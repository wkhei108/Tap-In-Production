import { del, list, put } from '@vercel/blob';
import { photoManifestSchema, type ManagedPhoto, type PhotoManifest } from './photo-schema';

/* ==========================================================================
   Vercel Blob adapter.

   Same philosophy as `mailer.ts`: when the service is not configured the site
   carries on exactly as it did before — every project falls back to the
   gallery declared in `src/content/projects.ts` — and a write never reports a
   success that did not happen.

   Unlike the mailer this uses the official SDK rather than hand-rolled fetch.
   Resend documents its REST API as a public contract; Vercel Blob does not,
   and pinning ourselves to an undocumented endpoint is exactly the kind of
   thing that breaks quietly a year from now.
   ========================================================================== */

export type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'storage-not-configured' | 'storage-error' };

/**
 * Vercel injects `BLOB_READ_WRITE_TOKEN` when a Blob store is connected to the
 * project, so this doubles as "has anyone set this up yet".
 */
export function isPhotoStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** A fresh value each time, so a caller can never mutate a shared default. */
function empty(): PhotoManifest {
  return { version: 1, items: [] };
}

/** Mirrors the `public/media/...` layout in `docs/asset-guide.md`. */
function projectPrefix(slug: string): string {
  return `media/projects/${slug}/`;
}

function manifestPath(slug: string): string {
  return `${projectPrefix(slug)}manifest.json`;
}

async function findBlobUrl(pathname: string): Promise<string | null> {
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  return blobs.find((blob) => blob.pathname === pathname)?.url ?? null;
}

/**
 * Read a project's managed photos.
 *
 * Every failure path returns an empty manifest rather than throwing: this runs
 * while rendering a case study, and a storage outage should cost the visitor
 * the managed photos, not the page.
 *
 * The default is a cached read, which is what keeps case studies statically
 * rendered. Pass `fresh` from the admin tool, where showing a photo that was
 * uploaded ten seconds ago matters more than the cache.
 */
export async function readManifest(
  slug: string,
  { fresh = false }: { fresh?: boolean } = {},
): Promise<PhotoManifest> {
  if (!isPhotoStorageConfigured()) return empty();

  try {
    const url = await findBlobUrl(manifestPath(slug));
    if (!url) return empty();

    const response = await fetch(
      url,
      fresh ? { cache: 'no-store' } : { next: { revalidate: 60 } },
    );
    if (!response.ok) {
      console.error(`[TAP IN.] Photo manifest for "${slug}" returned ${response.status}.`);
      return empty();
    }

    const parsed = photoManifestSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error(`[TAP IN.] Photo manifest for "${slug}" is malformed; ignoring it.`);
      return empty();
    }

    return parsed.data;
  } catch (error) {
    console.error(`[TAP IN.] Could not read the photo manifest for "${slug}":`, error);
    return empty();
  }
}

async function writeManifest(
  slug: string,
  manifest: PhotoManifest,
): Promise<StorageResult<PhotoManifest>> {
  try {
    await put(manifestPath(slug), JSON.stringify(manifest), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });

    return { ok: true, data: manifest };
  } catch (error) {
    console.error(`[TAP IN.] Could not write the photo manifest for "${slug}":`, error);
    return { ok: false, reason: 'storage-error' };
  }
}

/**
 * Store a processed photo and record it in the project's manifest.
 *
 * The caller supplies `id`; it is generated server-side and never taken from
 * the request, so an uploader cannot choose where their file lands.
 */
export async function savePhoto(
  slug: string,
  photo: Omit<ManagedPhoto, 'url' | 'uploadedAt'>,
  body: Buffer,
): Promise<StorageResult<ManagedPhoto>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  try {
    // Immutable: every upload gets a fresh id, so nothing ever needs revalidating.
    const blob = await put(`${projectPrefix(slug)}${photo.id}.webp`, body, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });

    const stored: ManagedPhoto = {
      ...photo,
      url: blob.url,
      uploadedAt: new Date().toISOString(),
    };

    // Must be a fresh read: appending to a cached manifest would silently drop
    // any photo added in the last revalidate window.
    const current = await readManifest(slug, { fresh: true });
    const written = await writeManifest(slug, {
      version: 1,
      items: [...current.items, stored],
    });

    if (!written.ok) {
      // The photo is uploaded but unreferenced. Drop it rather than leave an
      // orphan nobody can see or delete from the admin tool.
      await del(blob.url).catch(() => {});
      return written;
    }

    return { ok: true, data: stored };
  } catch (error) {
    console.error(`[TAP IN.] Could not upload a photo for "${slug}":`, error);
    return { ok: false, reason: 'storage-error' };
  }
}

/**
 * Rewrite a project's running order and pin flags.
 *
 * Takes the full desired sequence. Ids the manifest no longer knows about are
 * skipped, and photos the caller did not mention — one uploaded from another
 * tab mid-edit, say — keep their place at the end rather than being dropped by
 * a stale list.
 */
export async function reorderPhotos(
  slug: string,
  desired: ReadonlyArray<{ id: string; pinned: boolean }>,
): Promise<StorageResult<PhotoManifest>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const current = await readManifest(slug, { fresh: true });
  const remaining = new Map(current.items.map((item) => [item.id, item]));
  const ordered: ManagedPhoto[] = [];

  for (const { id, pinned } of desired) {
    const item = remaining.get(id);
    if (!item) continue;
    remaining.delete(id);
    ordered.push({ ...item, pinned });
  }

  ordered.push(...remaining.values());

  return writeManifest(slug, { version: 1, items: ordered });
}

/** Remove a photo from the manifest, then from storage. */
export async function removePhoto(
  slug: string,
  id: string,
): Promise<StorageResult<{ removed: boolean }>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const current = await readManifest(slug, { fresh: true });
  const target = current.items.find((item) => item.id === id);
  if (!target) return { ok: true, data: { removed: false } };

  const written = await writeManifest(slug, {
    version: 1,
    items: current.items.filter((item) => item.id !== id),
  });

  if (!written.ok) return written;

  try {
    await del(target.url);
  } catch (error) {
    // The manifest no longer references it, so the site is already correct.
    console.error(`[TAP IN.] Removed "${id}" from the manifest but could not delete the blob:`, error);
  }

  return { ok: true, data: { removed: true } };
}
