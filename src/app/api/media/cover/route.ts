import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

import { guardAdmin, isKnownCampaign, refreshCampaign, refreshCampaignListings } from '@/lib/admin-guard';
import { clearCampaignCover, readSiteIndex, setCampaignCover } from '@/lib/campaigns';
import { normalisePhoto } from '@/lib/photo-processing';
import {
  acceptedUploadTypes,
  maxUploadBytes,
  photoUploadSchema,
  toPhotoFieldErrors,
} from '@/lib/photo-schema';
import { isPhotoStorageConfigured, readManifest } from '@/lib/photo-storage';
import type { CampaignCover } from '@/lib/campaign-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function published(slug: string, cover: CampaignCover | null) {
  refreshCampaign(slug);
  refreshCampaignListings();
  return NextResponse.json({ ok: true, cover });
}

/**
 * Set a campaign's cover, either way round:
 *
 * - `photoId` promotes a photo already in the gallery. Nothing is uploaded and
 *   nothing is duplicated — the cover points at the same stored image.
 * - `file` uploads a cover that never appears in the gallery, processed
 *   through the same pipeline as any other photo.
 */
export async function POST(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  if (!isPhotoStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'storage-not-configured' },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-form' }, { status: 400 });
  }

  const slug = form.get('slug');
  if (typeof slug !== 'string' || !(await isKnownCampaign(slug))) {
    return NextResponse.json({ ok: false, error: 'unknown-campaign' }, { status: 400 });
  }

  /* --- Promote an existing gallery photo ------------------------------- */
  const photoId = form.get('photoId');
  if (typeof photoId === 'string' && photoId) {
    const manifest = await readManifest(slug, { fresh: true });
    const photo = manifest.items.find((item) => item.id === photoId);

    if (!photo) {
      return NextResponse.json({ ok: false, error: 'photo-not-found' }, { status: 404 });
    }

    const cover: CampaignCover = {
      url: photo.url,
      aspect: photo.aspect,
      altText: photo.altText,
      altTextZh: photo.altTextZh,
      fromPhotoId: photo.id,
    };

    const result = await setCampaignCover(slug, cover);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
    }

    return published(slug, cover);
  }

  /* --- Upload a dedicated cover ---------------------------------------- */
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

  // Reuse the gallery upload schema for the words; only the crop and alt text
  // matter for a cover, and requiring both languages is the same rule.
  const parsed = photoUploadSchema.safeParse({
    slug,
    aspect: form.get('aspect'),
    altText: form.get('altText'),
    altTextZh: form.get('altTextZh'),
    captionEn: '',
    captionZh: '',
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const values = parsed.data;

  let processed;
  try {
    processed = await normalisePhoto(Buffer.from(await file.arrayBuffer()), values.aspect);
  } catch (error) {
    console.error('[TAP IN.] Could not process a cover upload:', error);
    return NextResponse.json({ ok: false, error: 'unreadable-image' }, { status: 415 });
  }

  let url: string;
  try {
    // A fresh id per upload keeps the URL immutable, so it can cache forever.
    const blob = await put(`media/projects/${slug}/cover-${randomUUID()}.webp`, processed.body, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    url = blob.url;
  } catch (error) {
    console.error(`[TAP IN.] Could not upload a cover for "${slug}":`, error);
    return NextResponse.json({ ok: false, error: 'storage-error' }, { status: 502 });
  }

  const cover: CampaignCover = {
    url,
    aspect: values.aspect,
    altText: values.altText,
    altTextZh: values.altTextZh,
  };

  const result = await setCampaignCover(slug, cover);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  return published(slug, cover);
}

/** Drop the managed cover; the campaign falls back to whatever the code says. */
export async function DELETE(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const slug = (payload as { slug?: unknown } | null)?.slug;
  if (typeof slug !== 'string' || !(await isKnownCampaign(slug))) {
    return NextResponse.json({ ok: false, error: 'unknown-campaign' }, { status: 400 });
  }

  const result = await clearCampaignCover(slug);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  return published(slug, null);
}

/** The current cover, for the admin tool to show what is in force. */
export async function GET(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug || !(await isKnownCampaign(slug))) {
    return NextResponse.json({ ok: false, error: 'unknown-campaign' }, { status: 400 });
  }

  const index = await readSiteIndex({ fresh: true });
  return NextResponse.json({ ok: true, cover: index.campaigns[slug]?.cover ?? null });
}
