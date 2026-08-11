// @vitest-environment node
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { heroPosterTarget, normaliseImage, normalisePhoto } from '@/lib/photo-processing';
import { aspectTargets, photoAspects } from '@/lib/photo-schema';

/** A solid-colour JPEG carrying EXIF (including a GPS tag) and an orientation. */
async function testPhoto(width: number, height: number, orientation?: number) {
  return sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 120, b: 60 } },
  })
    .withMetadata({
      // sharp writes the GPS IFD as IFD3.
      exif: { IFD0: { Copyright: 'TAP IN.' }, IFD3: { GPSLatitudeRef: 'N' } },
      orientation,
    })
    .jpeg()
    .toBuffer();
}

const ratioOf = ({ width, height }: { width: number; height: number }) => width / height;

describe('normalisePhoto', () => {
  it('crops to the requested ratio regardless of the source shape', async () => {
    const sources = await Promise.all([
      testPhoto(6000, 4000),
      testPhoto(1200, 900),
      testPhoto(800, 2400),
    ]);

    for (const source of sources) {
      for (const aspect of photoAspects) {
        const output = await normalisePhoto(source, aspect);
        expect(ratioOf(output)).toBeCloseTo(ratioOf(aspectTargets[aspect]), 2);
      }
    }
  });

  it('applies EXIF orientation instead of leaving the photo sideways', async () => {
    // Orientation 6 means "rotate 90°", so a 1200x900 file is really 900x1200.
    const output = await normalisePhoto(await testPhoto(1200, 900, 6), 'portrait');

    expect(ratioOf(output)).toBeCloseTo(0.75, 2);
    // 900px of true width is the constraint; a landscape reading would allow more.
    expect(output.width).toBeLessThanOrEqual(900);
  });

  it('strips metadata, so uploaded photos cannot leak GPS coordinates', async () => {
    const output = await normalisePhoto(await testPhoto(2400, 1600), 'landscape');
    const metadata = await sharp(output.body).metadata();

    expect(metadata.exif).toBeUndefined();
    expect(metadata.format).toBe('webp');
  });

  it('never upscales a photo smaller than the target', async () => {
    const output = await normalisePhoto(await testPhoto(800, 500), 'landscape');

    expect(output.width).toBeLessThanOrEqual(800);
    expect(output.width).toBeLessThan(aspectTargets.landscape.width);
  });

  it('resizes a large photo down to the documented target', async () => {
    const output = await normalisePhoto(await testPhoto(6000, 4000), 'landscape');

    expect(output.width).toBe(aspectTargets.landscape.width);
    expect(output.height).toBe(aspectTargets.landscape.height);
  });

  it('rejects a file that is not an image', async () => {
    await expect(normalisePhoto(Buffer.from('not an image'), 'square')).rejects.toThrow();
  });
});

describe('normaliseImage / hero poster', () => {
  it('crops a hero poster to the documented 16:9 target', async () => {
    const output = await normaliseImage(await testPhoto(4000, 3000), heroPosterTarget);

    expect(output.width).toBe(heroPosterTarget.width);
    expect(output.height).toBe(heroPosterTarget.height);
    expect(output.width / output.height).toBeCloseTo(16 / 9, 2);
  });

  it('keeps the hero ratio without upscaling a small source', async () => {
    const output = await normaliseImage(await testPhoto(800, 600), heroPosterTarget);

    expect(output.width).toBeLessThanOrEqual(800);
    expect(output.width / output.height).toBeCloseTo(16 / 9, 2);
  });

  it('strips metadata from a hero poster too', async () => {
    const output = await normaliseImage(await testPhoto(3000, 2000), heroPosterTarget);
    const metadata = await sharp(output.body).metadata();
    expect(metadata.exif).toBeUndefined();
  });
});
