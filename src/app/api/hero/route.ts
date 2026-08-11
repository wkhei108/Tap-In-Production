import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

import { guardAdmin } from '@/lib/admin-guard';
import { clearHero, readSiteIndex, setHero } from '@/lib/campaigns';
import { heroTextSchema, type HeroRecord } from '@/lib/campaign-schema';
import { heroPosterTarget, normaliseImage } from '@/lib/photo-processing';
import { acceptedUploadTypes, maxUploadBytes, toPhotoFieldErrors } from '@/lib/photo-schema';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';
import { locales, pathFor } from '@/lib/i18n';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generous next to the asset guide's 4 MB target. The guide is advice about
 * what makes a good showreel; this is only the ceiling that stops a raw
 * camera file being pushed through a serverless function.
 */
const maxVideoBytes = 25 * 1024 * 1024;

const acceptedVideoTypes = ['video/mp4'] as const;

/** The hero only exists on the homepage, so that is all that needs refreshing. */
function refreshHomepage(): void {
  for (const locale of locales) revalidatePath(pathFor(locale, 'home'));
}

export async function GET(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const index = await readSiteIndex({ fresh: true });
  return NextResponse.json({
    ok: true,
    storageConfigured: isPhotoStorageConfigured(),
    hero: index.hero ?? null,
  });
}

/**
 * Set the homepage hero.
 *
 * The poster is required — it is what most visitors actually see, since the
 * video is withheld on reduced motion, save-data and slow connections. The
 * video is optional and stored as supplied: sharp cannot transcode, and the
 * asset guide already asks for a web-ready silent MP4.
 */
export async function POST(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  if (!isPhotoStorageConfigured()) {
    return NextResponse.json({ ok: false, error: 'storage-not-configured' }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-form' }, { status: 400 });
  }

  const parsed = heroTextSchema.safeParse({
    posterAltText: form.get('posterAltText'),
    posterAltTextZh: form.get('posterAltTextZh'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const existing = (await readSiteIndex({ fresh: true })).hero ?? null;

  /* --- Poster ---------------------------------------------------------- */
  const poster = form.get('poster');
  let posterUrl = existing?.posterUrl;

  if (poster instanceof File && poster.size > 0) {
    if (poster.size > maxUploadBytes) {
      return NextResponse.json(
        {
          ok: false,
          error: 'file-too-large',
          message: `Keep the poster under ${Math.round(maxUploadBytes / 1024 / 1024)} MB.`,
        },
        { status: 413 },
      );
    }

    if (!(acceptedUploadTypes as readonly string[]).includes(poster.type)) {
      return NextResponse.json(
        { ok: false, error: 'unsupported-type', message: 'The poster must be an image.' },
        { status: 415 },
      );
    }

    let processed;
    try {
      processed = await normaliseImage(
        Buffer.from(await poster.arrayBuffer()),
        heroPosterTarget,
      );
    } catch (error) {
      console.error('[TAP IN.] Could not process the hero poster:', error);
      return NextResponse.json({ ok: false, error: 'unreadable-image' }, { status: 415 });
    }

    try {
      const blob = await put(`media/hero/poster-${randomUUID()}.webp`, processed.body, {
        access: 'public',
        contentType: 'image/webp',
        addRandomSuffix: false,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      });
      posterUrl = blob.url;
    } catch (error) {
      console.error('[TAP IN.] Could not upload the hero poster:', error);
      return NextResponse.json({ ok: false, error: 'storage-error' }, { status: 502 });
    }
  }

  if (!posterUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: 'poster-required',
        message: 'A poster is required — it is what shows when the video is held back.',
      },
      { status: 400 },
    );
  }

  /* --- Video (optional) ------------------------------------------------ */
  const video = form.get('video');
  let videoUrl = form.get('removeVideo') === 'true' ? undefined : existing?.videoUrl;

  if (video instanceof File && video.size > 0) {
    if (video.size > maxVideoBytes) {
      return NextResponse.json(
        {
          ok: false,
          error: 'file-too-large',
          message: `Keep the showreel under ${Math.round(maxVideoBytes / 1024 / 1024)} MB.`,
        },
        { status: 413 },
      );
    }

    if (!(acceptedVideoTypes as readonly string[]).includes(video.type)) {
      return NextResponse.json(
        { ok: false, error: 'unsupported-type', message: 'The showreel must be an MP4.' },
        { status: 415 },
      );
    }

    try {
      // Stored as supplied — no transcode. The asset guide asks for a silent,
      // web-ready H.264 MP4 and that is what lands here.
      const blob = await put(`media/hero/showreel-${randomUUID()}.mp4`, video, {
        access: 'public',
        contentType: 'video/mp4',
        addRandomSuffix: false,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      });
      videoUrl = blob.url;
    } catch (error) {
      console.error('[TAP IN.] Could not upload the hero showreel:', error);
      return NextResponse.json({ ok: false, error: 'storage-error' }, { status: 502 });
    }
  }

  const hero: HeroRecord = {
    posterUrl,
    posterAltText: parsed.data.posterAltText,
    posterAltTextZh: parsed.data.posterAltTextZh,
    videoUrl,
  };

  const result = await setHero(hero);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshHomepage();

  return NextResponse.json({ ok: true, hero });
}

/** Remove the hero entirely; the homepage goes back to its placeholder. */
export async function DELETE(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const result = await clearHero();
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshHomepage();

  return NextResponse.json({ ok: true, hero: null });
}
