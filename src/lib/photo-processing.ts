import sharp from 'sharp';
import { aspectTargets } from './photo-schema';
import type { MediaAspect } from '@/content/projects';

export type ProcessedPhoto = {
  body: Buffer;
  width: number;
  height: number;
  bytes: number;
};

/**
 * Normalise an uploaded photo to the site's house format.
 *
 * Three things happen here that the asset guide otherwise asks a human to do
 * by hand: the image is cropped to one of the three site ratios, converted to
 * WebP at the documented target size, and stripped of metadata.
 *
 * That last one is not cosmetic. Match photography routinely carries EXIF GPS
 * coordinates, and `public/` and object storage are both world-readable —
 * sharp drops all metadata unless `withMetadata()` is called, so the omission
 * below is the privacy control. `rotate()` bakes in the EXIF orientation
 * first, otherwise discarding the tag would leave the photo sideways.
 */
export async function normalisePhoto(
  input: Buffer,
  aspect: MediaAspect,
): Promise<ProcessedPhoto> {
  return normaliseImage(input, aspectTargets[aspect]);
}

/**
 * `docs/asset-guide.md`: hero poster 2400 × 1350, 16:9. One shape only —
 * unlike the gallery, the hero has no crop picker.
 */
export const heroPosterTarget = { width: 2400, height: 1350 } as const;

/** The shared pipeline. `normalisePhoto` and the hero both land here. */
export async function normaliseImage(
  input: Buffer,
  target: { width: number; height: number },
): Promise<ProcessedPhoto> {
  /*
   * `metadata()` reads the header only — no decode — and reports the stored
   * dimensions, so a photo shot on a rotated sensor comes back the wrong way
   * round. EXIF orientations 5-8 are the quarter turns, so swap for those to
   * get the size the viewer will actually see.
   */
  const source = await sharp(input).metadata();
  const quarterTurned = (source.orientation ?? 1) >= 5;
  const sourceWidth = quarterTurned ? source.height : source.width;
  const sourceHeight = quarterTurned ? source.width : source.height;

  /*
   * Scale the target down to fit inside the source rather than passing
   * `withoutEnlargement`. That option makes sharp skip the resize altogether
   * when the source is smaller than the target, which silently skips the crop
   * too and leaves the photo at whatever ratio the camera produced. Shrinking
   * the target keeps the ratio exact and still never upscales.
   */
  const scale = Math.min(1, sourceWidth / target.width, sourceHeight / target.height);

  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width: Math.round(target.width * scale),
      height: Math.round(target.height * scale),
      fit: 'cover',
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return { body: data, width: info.width, height: info.height, bytes: data.byteLength };
}
