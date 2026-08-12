import { NextResponse } from 'next/server';

import { guardAdmin, refreshEverything } from '@/lib/admin-guard';
import { ogImageTarget, uploadBrandAsset, uploadProcessedImage } from '@/lib/admin-upload';
import {
  brandAssetSchema,
  siteSettingsPayloadSchema,
  type SiteSettingsRecord,
} from '@/lib/campaign-schema';
import { toPhotoFieldErrors } from '@/lib/photo-schema';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';
import { historyKey, readHistory } from '@/lib/media-history';
import {
  clearBrandAsset,
  resolveBrand,
  resolveSite,
  saveSiteSettings,
  setBrandAsset,
} from '@/lib/site-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function storageRequired(): NextResponse | null {
  if (isPhotoStorageConfigured()) return null;
  return NextResponse.json(
    {
      ok: false,
      error: 'storage-not-configured',
      message: 'Add a Blob store in Vercel before changing settings.',
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
    settings: await resolveSite(),
    brand: await resolveBrand(),
  });
}

/**
 * Save site identity.
 *
 * Blank fields are dropped rather than stored, so clearing one falls back to
 * what `src/content/site.ts` says — the site can never end up with no name or
 * no email address.
 */
export async function PUT(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const unconfigured = storageRequired();
  if (unconfigured) return unconfigured;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const parsed = siteSettingsPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const values = parsed.data;

  /* A tagline is bilingual, so it is stored only when both halves are given —
     the same rule captions follow everywhere else in the tool. */
  const tagline =
    values.tagline && values.taglineZh
      ? { en: values.tagline, 'zh-hk': values.taglineZh }
      : undefined;

  const settings: SiteSettingsRecord = {
    name: values.name || undefined,
    legalName: values.legalName || undefined,
    tagline,
    email: values.email || undefined,
    instagramHandle: values.instagramHandle || undefined,
    instagramUrl: values.instagramUrl || undefined,
    areaServed: values.areaServed || undefined,
    signOff: values.signOff || undefined,
    whatsapp: values.whatsapp || undefined,
  };

  const result = await saveSiteSettings(settings);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshEverything();

  return NextResponse.json({ ok: true, settings: await resolveSite() });
}

/**
 * Replace a piece of brand artwork.
 *
 * The logo, mark and icon are stored exactly as supplied so an SVG stays a
 * vector; the share card is normalised to 1200×630, because no platform
 * renders an SVG preview.
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

  const parsed = brandAssetSchema.safeParse({ kind: form.get('kind') });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { kind } = parsed.data;
  const file = form.get('asset');

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { ok: false, error: 'file-required', message: 'Choose a file to upload.' },
      { status: 400 },
    );
  }

  const upload =
    kind === 'ogImage'
      ? await uploadProcessedImage({
          file,
          prefix: 'media/brand/og',
          label: 'share image',
          target: ogImageTarget,
        })
      : await uploadBrandAsset({ file, prefix: `media/brand/${kind}`, label: kind });

  if (!upload.ok) return upload.response;

  const result = await setBrandAsset(kind, upload.url);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshEverything();

  return NextResponse.json({
    ok: true,
    kind,
    brand: await resolveBrand(result.data),
    versions: readHistory(result.data, historyKey('brand', kind)),
  });
}

/** Remove a piece of artwork; what ships in `public/brand` takes over again. */
export async function DELETE(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const parsed = brandAssetSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'unknown-asset' }, { status: 400 });
  }

  const result = await clearBrandAsset(parsed.data.kind);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshEverything();

  return NextResponse.json({
    ok: true,
    kind: parsed.data.kind,
    brand: await resolveBrand(result.data),
    versions: readHistory(result.data, historyKey('brand', parsed.data.kind)),
  });
}
