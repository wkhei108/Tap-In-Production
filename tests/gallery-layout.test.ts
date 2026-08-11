import { describe, expect, it } from 'vitest';
import {
  galleryColumns,
  galleryGridColumns,
  gallerySpanClass,
  packGalleryRows,
} from '@/lib/gallery-layout';
import { aspectRatios } from '@/lib/utils';
import type { MediaAspect } from '@/content/projects';

const pack = (aspects: MediaAspect[]) => packGalleryRows(aspects, (aspect) => aspect);

describe('gallery geometry', () => {
  it('defines a width and a class for every crop the site renders', () => {
    const crops = Object.keys(aspectRatios).sort();
    expect(Object.keys(galleryColumns).sort()).toEqual(crops);
    expect(Object.keys(gallerySpanClass).sort()).toEqual(crops);
  });

  it('keeps the Tailwind classes in step with the column counts', () => {
    for (const [aspect, columns] of Object.entries(galleryColumns)) {
      expect(gallerySpanClass[aspect as MediaAspect]).toBe(`md:col-span-${columns}`);
    }
  });

  it('never lets a single item exceed the grid', () => {
    for (const columns of Object.values(galleryColumns)) {
      expect(columns).toBeLessThanOrEqual(galleryGridColumns);
    }
  });
});

describe('packGalleryRows', () => {
  it('returns no rows for an empty gallery', () => {
    expect(pack([])).toEqual([]);
  });

  it('fills a row with a landscape and a portrait', () => {
    const rows = pack(['landscape', 'portrait']);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.filled).toBe(galleryGridColumns);
  });

  it('fills a row with two squares', () => {
    const rows = pack(['square', 'square']);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.filled).toBe(galleryGridColumns);
  });

  it('wraps rather than overflowing when the next item does not fit', () => {
    // 8 + 6 = 14, past the 12-column grid, so the square starts a new row.
    const rows = pack(['landscape', 'square']);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.items).toEqual(['landscape']);
    expect(rows[1]?.items).toEqual(['square']);
  });

  it('reports the gap left by a short row', () => {
    const rows = pack(['portrait']);
    expect(galleryGridColumns - (rows[0]?.filled ?? 0)).toBe(8);
  });

  it('shows that order changes the layout, not just the sequence', () => {
    const ragged = pack(['landscape', 'square', 'portrait']);
    const tidy = pack(['landscape', 'portrait', 'square']);

    expect(ragged).toHaveLength(2);
    expect(tidy).toHaveLength(2);
    // Same three photos: one order fills its first row, the other does not.
    expect(tidy[0]?.filled).toBe(galleryGridColumns);
    expect(ragged[0]?.filled).toBeLessThan(galleryGridColumns);
  });

  it('never packs a row beyond the grid', () => {
    const rows = pack([
      'landscape',
      'landscape',
      'portrait',
      'square',
      'square',
      'portrait',
      'landscape',
    ]);

    for (const row of rows) {
      expect(row.filled).toBeLessThanOrEqual(galleryGridColumns);
      expect(row.items.length).toBeGreaterThan(0);
    }
  });

  it('keeps every item exactly once, in order', () => {
    const input: MediaAspect[] = ['square', 'landscape', 'portrait', 'square', 'landscape'];
    expect(pack(input).flatMap((row) => row.items)).toEqual(input);
  });
});
