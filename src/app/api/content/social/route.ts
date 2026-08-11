import { NextResponse } from 'next/server';

import { guardAdmin, refreshEditorScreen } from '@/lib/admin-guard';
import { uploadProcessedImage } from '@/lib/admin-upload';
import { socialPostTextSchema, type SocialPostRecord } from '@/lib/campaign-schema';
import { toPhotoFieldErrors } from '@/lib/photo-schema';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';
import { clearSocialPostImage, resolveSocialPosts, setSocialPost } from '@/lib/site-content';
import { socialPosts } from '@/content/social';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* The rail is a fixed set of curated cards, so an id has to be one of them. */
const knownIds = new Set(socialPosts.map((post) => post.id));

const aspectFor = (id: string) => socialPosts.find((post) => post.id === id)?.aspect ?? 'portrait';

function storageRequired(): NextResponse | null {
  if (isPhotoStorageConfigured()) return null;
  return NextResponse.json(
    {
      ok: false,
      error: 'storage-not-configured',
      message: 'Add a Blob store in Vercel before editing the rail.',
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  return NextResponse.json({
    ok: true,
    storageConfigured: isPhotoStorageConfigured(),
    posts: await resolveSocialPosts(),
  });
}

/** Set one card's image, link and words. */
export async function POST(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const unconfigured = storageRequired();
  if (unconfigured) return unconfigured;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-form' }, { status: 400 });
  }

  const parsed = socialPostTextSchema.safeParse({
    id: form.get('id'),
    href: form.get('href'),
    altText: form.get('altText'),
    altTextZh: form.get('altTextZh'),
    captionEn: form.get('captionEn'),
    captionZh: form.get('captionZh'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const values = parsed.data;

  if (!knownIds.has(values.id)) {
    return NextResponse.json({ ok: false, error: 'unknown-post' }, { status: 400 });
  }

  const record: SocialPostRecord = {
    href: values.href || undefined,
    aspect: aspectFor(values.id),
    altText: values.altText,
    altTextZh: values.altTextZh,
    caption:
      values.captionEn && values.captionZh
        ? { en: values.captionEn, 'zh-hk': values.captionZh }
        : undefined,
  };

  const file = form.get('image');
  if (file instanceof File && file.size > 0) {
    const upload = await uploadProcessedImage({
      file,
      aspect: record.aspect,
      prefix: `media/social/${values.id}`,
      label: 'image',
    });
    if (!upload.ok) return upload.response;
    record.url = upload.url;
  }

  const result = await setSocialPost(values.id, record);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshEditorScreen('home');

  return NextResponse.json({ ok: true, id: values.id });
}

/** Drop a card's image, keeping its link and words. */
export async function DELETE(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const id = (payload as { id?: unknown } | null)?.id;
  if (typeof id !== 'string' || !knownIds.has(id)) {
    return NextResponse.json({ ok: false, error: 'unknown-post' }, { status: 400 });
  }

  const result = await clearSocialPostImage(id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshEditorScreen('home');

  return NextResponse.json({ ok: true, id });
}
