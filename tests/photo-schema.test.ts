import { describe, expect, it } from 'vitest';
import {
  aspectTargets,
  photoAspects,
  photoManifestSchema,
  photoUploadSchema,
  toMediaItem,
  toPhotoFieldErrors,
} from '@/lib/photo-schema';
import { aspectRatios } from '@/lib/utils';

const validUpload = {
  slug: 'invitational-cup-production',
  aspect: 'landscape',
  altText: 'Teams lining up before the cup final.',
  altTextZh: '盃賽決賽前，球隊列隊。',
  captionEn: '',
  captionZh: '',
};

describe('photoUploadSchema', () => {
  it('accepts a complete submission', () => {
    expect(photoUploadSchema.safeParse(validUpload).success).toBe(true);
  });

  it('requires alt text in both languages', () => {
    for (const missing of ['altText', 'altTextZh'] as const) {
      const result = photoUploadSchema.safeParse({ ...validUpload, [missing]: '  ' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(toPhotoFieldErrors(result.error)[missing]).toBeTruthy();
      }
    }
  });

  it('rejects alt text longer than the asset guide allows', () => {
    const result = photoUploadSchema.safeParse({ ...validUpload, altText: 'a'.repeat(126) });
    expect(result.success).toBe(false);
  });

  it('rejects a crop the gallery cannot lay out', () => {
    expect(photoUploadSchema.safeParse({ ...validUpload, aspect: 'banner' }).success).toBe(
      false,
    );
  });
});

describe('aspect targets', () => {
  it('covers every aspect the site renders', () => {
    expect(Object.keys(aspectTargets).sort()).toEqual([...photoAspects].sort());
    expect(Object.keys(aspectTargets).sort()).toEqual(Object.keys(aspectRatios).sort());
  });

  it('matches the ratios in src/lib/utils.ts', () => {
    for (const aspect of photoAspects) {
      const [w = 0, h = 1] = aspectRatios[aspect].split('/').map((part) => Number(part.trim()));
      const target = aspectTargets[aspect];
      expect(target.width / target.height).toBeCloseTo(w / h, 4);
    }
  });
});

describe('photoManifestSchema', () => {
  const photo = {
    id: 'e7b1',
    url: 'https://store.public.blob.vercel-storage.com/media/projects/x/e7b1.webp',
    aspect: 'portrait',
    altText: 'Keeper claiming a cross.',
    altTextZh: '守門員摘下傳中球。',
    uploadedAt: '2026-08-10T00:00:00.000Z',
  };

  it('parses a stored manifest', () => {
    const result = photoManifestSchema.safeParse({ version: 1, items: [photo] });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown format version', () => {
    expect(photoManifestSchema.safeParse({ version: 2, items: [] }).success).toBe(false);
  });

  it('rejects an entry pointing somewhere that is not a URL', () => {
    const result = photoManifestSchema.safeParse({
      version: 1,
      items: [{ ...photo, url: '/etc/passwd' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('toMediaItem', () => {
  it('produces a gallery item the existing components accept', () => {
    const item = toMediaItem({
      id: 'e7b1',
      url: 'https://store.public.blob.vercel-storage.com/media/projects/x/e7b1.webp',
      aspect: 'square',
      altText: 'Fans on the terrace.',
      altTextZh: '看台上的球迷。',
      caption: { en: 'Full time', 'zh-hk': '完場' },
      uploadedAt: '2026-08-10T00:00:00.000Z',
    });

    expect(item).toEqual({
      type: 'image',
      src: 'https://store.public.blob.vercel-storage.com/media/projects/x/e7b1.webp',
      aspect: 'square',
      altText: 'Fans on the terrace.',
      altTextZh: '看台上的球迷。',
      caption: { en: 'Full time', 'zh-hk': '完場' },
    });
  });
});
