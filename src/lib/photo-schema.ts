import { z } from 'zod';
import type { MediaAspect, MediaItem } from '@/content/projects';

/* ==========================================================================
   Shared photo constants — the single source of truth for the upload form,
   the API route and the image processing step, so the three can never
   disagree about what is acceptable.
   ========================================================================== */

export const photoAspects = ['landscape', 'portrait', 'square'] as const satisfies
  readonly MediaAspect[];

/**
 * Output dimensions per crop, matching the table in `docs/asset-guide.md`.
 * Uploads are resized to these, so a photo dropped straight off a camera ends
 * up the same size as one prepared by hand.
 *
 * Each pair resolves to exactly the ratio `aspectRatios` renders — a test
 * asserts it. Anything else would be cropped a second time by the frame's CSS.
 */
export const aspectTargets: Record<MediaAspect, { width: number; height: number }> = {
  landscape: { width: 2000, height: 1250 },
  portrait: { width: 1350, height: 1800 },
  square: { width: 1400, height: 1400 },
};

export const acceptedUploadTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/tiff',
] as const;

/** Generous enough for an unedited camera JPEG, small enough to reject a RAW. */
export const maxUploadBytes = 20 * 1024 * 1024;

/**
 * Brand artwork limits.
 *
 * Kept here beside the photo limits rather than next to the upload handler,
 * because the admin form needs them too and the handler pulls in sharp —
 * which must never reach the browser bundle.
 */
export const maxBrandBytes = 5 * 1024 * 1024;

/** Vectors stay vectors: rasterising a logo would be a downgrade. */
export const acceptedBrandTypes = [
  'image/svg+xml',
  'image/png',
  'image/webp',
  'image/jpeg',
  'image/avif',
] as const;

/** `docs/asset-guide.md`: keep alt text under about 125 characters. */
const maxAltLength = 125;
const maxCaptionLength = 60;

/* ==========================================================================
   Upload metadata
   ========================================================================== */

/**
 * Alt text is required in both languages because the site is bilingual and
 * every existing gallery item carries both. Making it optional here would let
 * the upload form quietly introduce the one thing the asset guide forbids.
 *
 * Messages are English-only: this schema backs the private admin tool, not
 * anything a visitor ever sees.
 */
export const photoUploadSchema = z.object({
  slug: z.string().trim().min(1, 'Choose a project.'),

  aspect: z.enum(photoAspects, { message: 'Choose a crop.' }),

  altText: z
    .string()
    .trim()
    .min(1, 'English alt text is required.')
    .max(maxAltLength, `Keep alt text under ${maxAltLength} characters.`),

  altTextZh: z
    .string()
    .trim()
    .min(1, 'Chinese alt text is required.')
    .max(maxAltLength, `Keep alt text under ${maxAltLength} characters.`),

  captionEn: z
    .string()
    .trim()
    .max(maxCaptionLength, `Keep captions under ${maxCaptionLength} characters.`)
    .optional()
    .or(z.literal('')),

  captionZh: z
    .string()
    .trim()
    .max(maxCaptionLength, `Keep captions under ${maxCaptionLength} characters.`)
    .optional()
    .or(z.literal('')),
});

export type PhotoUploadValues = z.infer<typeof photoUploadSchema>;
export type PhotoUploadField = keyof PhotoUploadValues;

/**
 * Editing what a photo says, after it is already stored.
 *
 * Deliberately excludes the crop: that is baked into the WebP at upload time,
 * so changing it here would leave the label disagreeing with the pixels. To
 * recrop, upload the photo again.
 */
export const photoEditSchema = photoUploadSchema
  .pick({ altText: true, altTextZh: true, captionEn: true, captionZh: true })
  .extend({
    slug: z.string().trim().min(1),
    id: z.string().trim().min(1),
  });

export type PhotoEditValues = z.infer<typeof photoEditSchema>;

/**
 * Flatten Zod issues into `{ field: message }` for the admin forms.
 *
 * Untyped in its field names on purpose — the upload form and the edit form
 * carry different fields, and both want the same first-error-per-field shape.
 */
export function toPhotoFieldErrors(error: z.ZodError): PhotoFieldErrors {
  const result: PhotoFieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in result)) {
      result[key] = issue.message;
    }
  }

  return result;
}

export type PhotoFieldErrors = Record<string, string>;

/* ==========================================================================
   Stored manifest
   ========================================================================== */

/**
 * One managed photo, as stored in a project's manifest.
 *
 * Deliberately the same shape as the fields of `MediaItem` that a photo needs,
 * so `toMediaItem` below is a rename rather than a translation.
 */
export const managedPhotoSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  aspect: z.enum(photoAspects),
  altText: z.string(),
  altTextZh: z.string(),
  caption: z.object({ en: z.string(), 'zh-hk': z.string() }).optional(),
  uploadedAt: z.string(),
  /**
   * Pinned photos lead the gallery, ahead of the entries declared in
   * `src/content/projects.ts`. Defaulted rather than required so manifests
   * written before pinning existed still parse.
   */
  pinned: z.boolean().default(false),
});

export type ManagedPhoto = z.infer<typeof managedPhotoSchema>;

/**
 * The manifest is fetched from object storage, so it is untrusted input and
 * gets parsed rather than cast. `version` exists so a future format change can
 * be detected instead of silently mis-read.
 */
export const photoManifestSchema = z.object({
  version: z.literal(1),
  items: z.array(managedPhotoSchema),
});

export type PhotoManifest = z.infer<typeof photoManifestSchema>;

/**
 * A complete running order, sent whenever the admin tool saves.
 *
 * The whole list travels rather than a "move this one" instruction: the tool
 * already knows the order it is showing, and sending it wholesale means a
 * half-applied sequence is not a state the server can end up in.
 */
export const photoOrderSchema = z.object({
  slug: z.string().trim().min(1),
  items: z
    .array(z.object({ id: z.string().min(1), pinned: z.boolean() }))
    .max(200),
});

export type PhotoOrderValues = z.infer<typeof photoOrderSchema>;

/** Adapt a stored photo to the `MediaItem` the gallery components already take. */
export function toMediaItem(photo: ManagedPhoto): MediaItem {
  return {
    type: 'image',
    src: photo.url,
    aspect: photo.aspect,
    altText: photo.altText,
    altTextZh: photo.altTextZh,
    caption: photo.caption,
  };
}
