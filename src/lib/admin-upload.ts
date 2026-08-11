import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

import { normaliseImage, normalisePhoto } from './photo-processing';
import {
  acceptedBrandTypes,
  acceptedUploadTypes,
  maxBrandBytes,
  maxUploadBytes,
} from './photo-schema';
import type { MediaAspect } from '@/content/projects';

/* ==========================================================================
   Shared upload handling for the admin routes.

   Every image upload does the same four things — check the size, check the
   type, run it through sharp, put it in the blob store — and each step has a
   specific status code the tool knows how to show. Written once here so the
   page-media, social and brand routes cannot drift apart on any of them.
   ========================================================================== */

export type UploadOutcome =
  | { ok: true; url: string; bytes: number }
  | { ok: false; response: NextResponse };

/** Share cards have to be raster: no platform renders an SVG preview. */
export const ogImageTarget = { width: 1200, height: 630 } as const;

const megabytes = (bytes: number) => Math.round(bytes / 1024 / 1024);

function tooLarge(limit: number, label: string): UploadOutcome {
  return {
    ok: false,
    response: NextResponse.json(
      {
        ok: false,
        error: 'file-too-large',
        message: `Keep the ${label} under ${megabytes(limit)} MB.`,
      },
      { status: 413 },
    ),
  };
}

function unsupported(label: string, expected: string): UploadOutcome {
  return {
    ok: false,
    response: NextResponse.json(
      { ok: false, error: 'unsupported-type', message: `The ${label} must be ${expected}.` },
      { status: 415 },
    ),
  };
}

function unreadable(label: string, error: unknown): UploadOutcome {
  console.error(`[TAP IN.] Could not process the ${label}:`, error);
  return {
    ok: false,
    response: NextResponse.json({ ok: false, error: 'unreadable-image' }, { status: 415 }),
  };
}

function storageFailed(label: string, error: unknown): UploadOutcome {
  console.error(`[TAP IN.] Could not upload the ${label}:`, error);
  return {
    ok: false,
    response: NextResponse.json({ ok: false, error: 'storage-error' }, { status: 502 }),
  };
}

/**
 * Process an image to a fixed crop and store it as WebP.
 *
 * Every upload gets a fresh name, so the file is immutable and can be cached
 * for a year; the caller deletes whatever it replaced.
 */
export async function uploadProcessedImage({
  file,
  aspect,
  prefix,
  label = 'image',
  target,
}: {
  file: File;
  aspect?: MediaAspect;
  /** Blob path prefix, e.g. `media/pages/home.intro.primary`. */
  prefix: string;
  label?: string;
  /** Explicit dimensions, for images that are not one of the three crops. */
  target?: { width: number; height: number };
}): Promise<UploadOutcome> {
  if (file.size > maxUploadBytes) return tooLarge(maxUploadBytes, label);

  if (!(acceptedUploadTypes as readonly string[]).includes(file.type)) {
    return unsupported(label, 'a JPEG, PNG, WebP, AVIF or TIFF image');
  }

  let processed;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    processed = target
      ? await normaliseImage(input, target)
      : await normalisePhoto(input, aspect ?? 'landscape');
  } catch (error) {
    return unreadable(label, error);
  }

  try {
    const blob = await put(`${prefix}-${randomUUID()}.webp`, processed.body, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return { ok: true, url: blob.url, bytes: processed.bytes };
  } catch (error) {
    return storageFailed(label, error);
  }
}

/**
 * Store artwork exactly as supplied.
 *
 * Used for the logo, mark and icon: they are usually SVG, and putting a
 * vector through the raster pipeline would throw away the thing that makes it
 * worth uploading.
 */
export async function uploadBrandAsset({
  file,
  prefix,
  label = 'file',
}: {
  file: File;
  prefix: string;
  label?: string;
}): Promise<UploadOutcome> {
  if (file.size > maxBrandBytes) return tooLarge(maxBrandBytes, label);

  if (!(acceptedBrandTypes as readonly string[]).includes(file.type)) {
    return unsupported(label, 'an SVG, PNG, WebP, JPEG or AVIF file');
  }

  const extension =
    file.type === 'image/svg+xml'
      ? 'svg'
      : file.type === 'image/png'
        ? 'png'
        : file.type === 'image/jpeg'
          ? 'jpg'
          : file.type === 'image/avif'
            ? 'avif'
            : 'webp';

  try {
    const blob = await put(`${prefix}-${randomUUID()}.${extension}`, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return { ok: true, url: blob.url, bytes: file.size };
  } catch (error) {
    return storageFailed(label, error);
  }
}
