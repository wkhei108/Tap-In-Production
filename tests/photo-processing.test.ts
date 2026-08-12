// @vitest-environment node
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

/**
 * Encoding several full-size images per test runs close to the 5s default
 * when the suite is running in parallel on a small machine, which showed up
 * as intermittent timeouts rather than real failures.
 */
const encodingTimeout = 30_000;
import {
  heroPosterTarget,
  normaliseImage,
  normalisePhoto,
  trimTransparentEdges,
} from '@/lib/photo-processing';
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
  }, encodingTimeout);

  it('applies EXIF orientation instead of leaving the photo sideways', async () => {
    // Orientation 6 means "rotate 90°", so a 1200x900 file is really 900x1200.
    const output = await normalisePhoto(await testPhoto(1200, 900, 6), 'portrait');

    expect(ratioOf(output)).toBeCloseTo(0.75, 2);
    // 900px of true width is the constraint; a landscape reading would allow more.
    expect(output.width).toBeLessThanOrEqual(900);
  }, encodingTimeout);

  it('strips metadata, so uploaded photos cannot leak GPS coordinates', async () => {
    const output = await normalisePhoto(await testPhoto(2400, 1600), 'landscape');
    const metadata = await sharp(output.body).metadata();

    expect(metadata.exif).toBeUndefined();
    expect(metadata.format).toBe('webp');
  }, encodingTimeout);

  it('never upscales a photo smaller than the target', async () => {
    const output = await normalisePhoto(await testPhoto(800, 500), 'landscape');

    expect(output.width).toBeLessThanOrEqual(800);
    expect(output.width).toBeLessThan(aspectTargets.landscape.width);
  }, encodingTimeout);

  it('resizes a large photo down to the documented target', async () => {
    const output = await normalisePhoto(await testPhoto(6000, 4000), 'landscape');

    expect(output.width).toBe(aspectTargets.landscape.width);
    expect(output.height).toBe(aspectTargets.landscape.height);
  }, encodingTimeout);

  it('rejects a file that is not an image', async () => {
    await expect(normalisePhoto(Buffer.from('not an image'), 'square')).rejects.toThrow();
  }, encodingTimeout);
});

describe('normaliseImage / hero poster', () => {
  it('crops a hero poster to the documented 16:9 target', async () => {
    const output = await normaliseImage(await testPhoto(4000, 3000), heroPosterTarget);

    expect(output.width).toBe(heroPosterTarget.width);
    expect(output.height).toBe(heroPosterTarget.height);
    expect(output.width / output.height).toBeCloseTo(16 / 9, 2);
  }, encodingTimeout);

  it('keeps the hero ratio without upscaling a small source', async () => {
    const output = await normaliseImage(await testPhoto(800, 600), heroPosterTarget);

    expect(output.width).toBeLessThanOrEqual(800);
    expect(output.width / output.height).toBeCloseTo(16 / 9, 2);
  }, encodingTimeout);

  it('strips metadata from a hero poster too', async () => {
    const output = await normaliseImage(await testPhoto(3000, 2000), heroPosterTarget);
    const metadata = await sharp(output.body).metadata();
    expect(metadata.exif).toBeUndefined();
  }, encodingTimeout);
});

describe('trimTransparentEdges', () => {
  /** A wide wordmark floating in the middle of a square canvas. */
  async function paddedLogo() {
    const glyph = await sharp({
      create: { width: 600, height: 80, channels: 4, background: { r: 215, g: 255, b: 32, alpha: 1 } },
    })
      .png()
      .toBuffer();

    return sharp({
      create: { width: 800, height: 800, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: glyph, top: 360, left: 100 }])
      .png()
      .toBuffer();
  }

  it('removes the empty canvas around a wordmark', async () => {
    const trimmed = await trimTransparentEdges(await paddedLogo());
    const { width, height } = await sharp(trimmed).metadata();

    expect(width).toBe(600);
    expect(height).toBe(80);
  }, encodingTimeout);

  it('keeps the original format, so a PNG stays a PNG', async () => {
    const trimmed = await trimTransparentEdges(await paddedLogo());
    expect((await sharp(trimmed).metadata()).format).toBe('png');
  }, encodingTimeout);

  it('leaves artwork that already fits its canvas alone', async () => {
    const tight = await sharp({
      create: { width: 300, height: 100, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } },
    })
      .png()
      .toBuffer();

    const { width, height } = await sharp(await trimTransparentEdges(tight)).metadata();
    expect(width).toBe(300);
    expect(height).toBe(100);
  }, encodingTimeout);

  it('returns the upload untouched rather than throwing on something unreadable', async () => {
    const junk = Buffer.from('not an image');
    expect(await trimTransparentEdges(junk)).toBe(junk);
  }, encodingTimeout);

  it('keeps a fully transparent upload rather than trimming it to nothing', async () => {
    const blank = await sharp({
      create: { width: 200, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer();

    const { width } = await sharp(await trimTransparentEdges(blank)).metadata();
    expect(width).toBe(200);
  }, encodingTimeout);
});
