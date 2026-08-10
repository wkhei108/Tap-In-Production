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
  const target = aspectTargets[aspect];

  // Orientation has to be baked in before measuring, or a portrait photo shot
  // on a rotated sensor reports its dimensions the wrong way round.
  const oriented = await sharp(input).rotate().toBuffer();
  const source = await sharp(oriented).metadata();

  /*
   * Scale the target down to fit inside the source rather than passing
   * `withoutEnlargement`. That option makes sharp skip the resize altogether
   * when the source is smaller than the target, which silently skips the crop
   * too and leaves the photo at whatever ratio the camera produced. Shrinking
   * the target keeps the ratio exact and still never upscales.
   */
  const scale = Math.min(1, source.width / target.width, source.height / target.height);

  const { data, info } = await sharp(oriented)
    .resize({
      width: Math.round(target.width * scale),
      height: Math.round(target.height * scale),
      fit: 'cover',
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return { body: data, width: info.width, height: info.height, bytes: data.byteLength };
}
