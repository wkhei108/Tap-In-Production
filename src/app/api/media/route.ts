import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { isAdminConfigured } from '@/lib/admin-auth';
import { readCookie, sessionCookieName, verifySessionValue } from '@/lib/admin-session';
import { normalisePhoto } from '@/lib/photo-processing';
import {
  acceptedUploadTypes,
  maxUploadBytes,
  photoEditSchema,
  photoOrderSchema,
  photoUploadSchema,
  toPhotoFieldErrors,
} from '@/lib/photo-schema';
import {
  isPhotoStorageConfigured,
  readManifest,
  removePhoto,
  reorderPhotos,
  savePhoto,
  updatePhotoText,
} from '@/lib/photo-storage';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { getAllProjects } from '@/content/projects';
import { locales, pathFor } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const rateLimited = createRateLimiter({ windowMs: 60_000, max: 30 });

/**
 * A slug is only ever one of the projects declared in `src/content/projects.ts`.
 * Checking against that list rather than a shape regex means a caller cannot
 * invent a storage path, however the string is spelled.
 */
function isKnownSlug(slug: string): boolean {
  return getAllProjects().some((project) => project.slug === slug);
}

/** Publish immediately rather than waiting out the case study's revalidate window. */
function refreshCaseStudy(slug: string): void {
  for (const locale of locales) revalidatePath(pathFor(locale, 'work', slug));
}

/** Rate limit first, so the token itself cannot be brute-forced cheaply. */
function guard(request: Request): NextResponse | null {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json({ ok: false, error: 'rate-limited' }, { status: 429 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'admin-not-configured',
        message: 'ADMIN_MEDIA_TOKEN is unset or too short. See .env.example.',
      },
      { status: 503 },
    );
  }

  if (!verifySessionValue(readCookie(request, sessionCookieName))) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }

  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;

  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug || !isKnownSlug(slug)) {
    return NextResponse.json({ ok: false, error: 'unknown-project' }, { status: 400 });
  }

  const manifest = await readManifest(slug, { fresh: true });

  return NextResponse.json({
    ok: true,
    storageConfigured: isPhotoStorageConfigured(),
    items: manifest.items,
  });
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;

  if (!isPhotoStorageConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'storage-not-configured',
        message: 'No Blob store is connected to this project. See .env.example.',
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-form' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'file-required' }, { status: 400 });
  }

  if (file.size > maxUploadBytes) {
    return NextResponse.json(
      {
        ok: false,
        error: 'file-too-large',
        message: `Keep uploads under ${Math.round(maxUploadBytes / 1024 / 1024)} MB.`,
      },
      { status: 413 },
    );
  }

  if (!(acceptedUploadTypes as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'unsupported-type',
        message: `Accepted formats: ${acceptedUploadTypes.join(', ')}.`,
      },
      { status: 415 },
    );
  }

  const parsed = photoUploadSchema.safeParse({
    slug: form.get('slug'),
    aspect: form.get('aspect'),
    altText: form.get('altText'),
    altTextZh: form.get('altTextZh'),
    captionEn: form.get('captionEn') ?? '',
    captionZh: form.get('captionZh') ?? '',
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const values = parsed.data;

  if (!isKnownSlug(values.slug)) {
    return NextResponse.json({ ok: false, error: 'unknown-project' }, { status: 400 });
  }

  let processed;
  try {
    processed = await normalisePhoto(Buffer.from(await file.arrayBuffer()), values.aspect);
  } catch (error) {
    // The declared MIME type is the uploader's word; sharp is the arbiter.
    console.error('[TAP IN.] Could not process an uploaded photo:', error);
    return NextResponse.json({ ok: false, error: 'unreadable-image' }, { status: 415 });
  }

  // A caption is only stored when both languages are supplied — a badge that
  // appears in English and vanishes in Chinese looks like a bug.
  const caption =
    values.captionEn && values.captionZh
      ? { en: values.captionEn, 'zh-hk': values.captionZh }
      : undefined;

  const result = await savePhoto(
    values.slug,
    {
      id: randomUUID(),
      aspect: values.aspect,
      altText: values.altText,
      altTextZh: values.altTextZh,
      caption,
      // New photos join the end of the running order; pinning is a later,
      // deliberate choice made in the admin tool.
      pinned: false,
    },
    processed.body,
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshCaseStudy(values.slug);

  return NextResponse.json({
    ok: true,
    photo: result.data,
    width: processed.width,
    height: processed.height,
    bytes: processed.bytes,
  });
}

/** Edit what a stored photo says. The image itself is untouched. */
export async function PUT(request: Request) {
  const denied = guard(request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const parsed = photoEditSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const values = parsed.data;

  if (!isKnownSlug(values.slug)) {
    return NextResponse.json({ ok: false, error: 'unknown-project' }, { status: 400 });
  }

  const result = await updatePhotoText(values.slug, values.id, {
    altText: values.altText,
    altTextZh: values.altTextZh,
    caption:
      values.captionEn && values.captionZh
        ? { en: values.captionEn, 'zh-hk': values.captionZh }
        : undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: result.reason === 'not-found' ? 404 : 502 },
    );
  }

  refreshCaseStudy(values.slug);

  return NextResponse.json({ ok: true, photo: result.data });
}

/** Save a new running order and pin flags for a project. */
export async function PATCH(request: Request) {
  const denied = guard(request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const parsed = photoOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'validation' }, { status: 400 });
  }

  const { slug, items } = parsed.data;

  if (!isKnownSlug(slug)) {
    return NextResponse.json({ ok: false, error: 'unknown-project' }, { status: 400 });
  }

  const result = await reorderPhotos(slug, items);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshCaseStudy(slug);

  return NextResponse.json({ ok: true, items: result.data.items });
}

export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const { slug, id } = (payload ?? {}) as { slug?: unknown; id?: unknown };

  if (typeof slug !== 'string' || !isKnownSlug(slug)) {
    return NextResponse.json({ ok: false, error: 'unknown-project' }, { status: 400 });
  }

  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ ok: false, error: 'id-required' }, { status: 400 });
  }

  const result = await removePhoto(slug, id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshCaseStudy(slug);

  return NextResponse.json({ ok: true, removed: result.data.removed });
}
