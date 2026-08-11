import type { MediaAspect } from '@/content/projects';

/* ==========================================================================
   Gallery grid geometry.

   The case-study gallery is a 12-column grid where each crop claims a
   different width, so the *order* of items decides whether a row fills
   cleanly or leaves a gap. Both the gallery itself and the admin tool's
   running-order preview read these numbers, so the preview can never drift
   from what the page actually renders.
   ========================================================================== */

export const galleryGridColumns = 12;

/** Columns each crop occupies. Landscape + portrait fills a row; so does square + square. */
export const galleryColumns: Record<MediaAspect, number> = {
  landscape: 8,
  portrait: 4,
  square: 6,
};

/**
 * The Tailwind class for each crop. Written as complete literals rather than
 * built from `galleryColumns` because Tailwind scans source text — an
 * interpolated class name would not survive the build.
 */
export const gallerySpanClass: Record<MediaAspect, string> = {
  landscape: 'md:col-span-8',
  portrait: 'md:col-span-4',
  square: 'md:col-span-6',
};

export type GalleryRow<T> = {
  items: T[];
  /** Columns used by this row, out of `galleryGridColumns`. */
  filled: number;
};

/**
 * Group items into the rows the CSS grid will produce.
 *
 * Mirrors grid auto-placement: an item that does not fit in the remaining
 * columns starts a new row. Used to show whether a chosen running order
 * leaves ragged gaps before anyone publishes it.
 */
export function packGalleryRows<T>(
  items: readonly T[],
  aspectOf: (item: T) => MediaAspect,
): GalleryRow<T>[] {
  const rows: GalleryRow<T>[] = [];
  let current: GalleryRow<T> = { items: [], filled: 0 };

  for (const item of items) {
    const width = galleryColumns[aspectOf(item)];

    if (current.items.length > 0 && current.filled + width > galleryGridColumns) {
      rows.push(current);
      current = { items: [], filled: 0 };
    }

    current.items.push(item);
    current.filled += width;
  }

  if (current.items.length > 0) rows.push(current);

  return rows;
}
