import { NextResponse } from 'next/server';

import { guardAdmin, refreshEditorScreen } from '@/lib/admin-guard';
import { uploadProcessedImage } from '@/lib/admin-upload';
import { mediaSlotTextSchema, type MediaSlotRecord } from '@/lib/campaign-schema';
import { mediaSlotFor } from '@/lib/media-slots';
import { historyKey, readHistory } from '@/lib/media-history';
import { toPhotoFieldErrors } from '@/lib/photo-schema';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';
import { clearPageMediaSlot, resolvePageMedia, setPageMediaSlot } from '@/lib/site-content';
import { readSiteIndex } from '@/lib/campaigns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function storageRequired(): NextResponse | null {
  if (isPhotoStorageConfigured()) return null;
  return NextResponse.json(
    {
      ok: false,
      error: 'storage-not-configured',
      message: 'Add a Blob store in Vercel before uploading images.',
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
    /* The admin reloads this straight after saving; it has to see the save. */
    media: await resolvePageMedia(await readSiteIndex({ fresh: true })),
  });
}

/**
 * Fill or update one page media slot.
 *
 * The image is optional on a repeat save, so alt text and captions can be
 * corrected without re-uploading the photograph.
 */
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

  const parsed = mediaSlotTextSchema.safeParse({
    slot: form.get('slot'),
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

  /* Only slots the layouts actually reserve — a caller cannot invent a key
     and write an orphaned record into the index. */
  const definition = mediaSlotFor(values.slot);
  if (!definition) {
    return NextResponse.json({ ok: false, error: 'unknown-slot' }, { status: 400 });
  }

  /* Fresh: this decides whether a text-only save keeps the current image, so
     a stale read here would write back a superseded URL and silently revert a
     photo uploaded moments ago. */
  const existing = (await resolvePageMedia(await readSiteIndex({ fresh: true })))[values.slot];

  const file = form.get('image');
  let url = existing?.url;

  if (file instanceof File && file.size > 0) {
    const upload = await uploadProcessedImage({
      file,
      aspect: definition.aspect,
      prefix: `media/pages/${values.slot}`,
      label: 'image',
    });
    if (!upload.ok) return upload.response;
    url = upload.url;
  }

  if (!url) {
    return NextResponse.json(
      { ok: false, error: 'file-required', message: 'Choose an image to upload.' },
      { status: 400 },
    );
  }

  const record: MediaSlotRecord = {
    url,
    aspect: definition.aspect,
    altText: values.altText,
    altTextZh: values.altTextZh,
    /* Both languages or neither: a caption that appears in English and
       vanishes in Chinese reads as a bug. */
    caption:
      values.captionEn && values.captionZh
        ? { en: values.captionEn, 'zh-hk': values.captionZh }
        : undefined,
  };

  const result = await setPageMediaSlot(values.slot, record);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshEditorScreen(definition.group);

  return NextResponse.json({
    ok: true,
    slot: values.slot,
    media: record,
    versions: readHistory(result.data, historyKey('page', values.slot)),
  });
}

/** Empty a slot; the layout goes back to its branded placeholder. */
export async function DELETE(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const slot = (payload as { slot?: unknown } | null)?.slot;
  if (typeof slot !== 'string' || !slot) {
    return NextResponse.json({ ok: false, error: 'slot-required' }, { status: 400 });
  }

  const definition = mediaSlotFor(slot);
  if (!definition) {
    return NextResponse.json({ ok: false, error: 'unknown-slot' }, { status: 400 });
  }

  const result = await clearPageMediaSlot(slot);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshEditorScreen(definition.group);

  return NextResponse.json({
    ok: true,
    slot,
    media: null,
    versions: readHistory(result.data, historyKey('page', slot)),
  });
}
