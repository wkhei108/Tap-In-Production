// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

/* ==========================================================================
   `findBlobUrl` looks up one *known* pathname — every path this project
   writes to is fixed, `addRandomSuffix: false` on every `put()` — so it is a
   direct lookup, not a search. It used to call `list({ prefix, limit: 1 })`,
   scanning for a pathname it could have looked up directly.

   That one call, made on every read of the site index and the copy overlay
   (both read `{ fresh: true }` before every write, and every admin page load
   reads both), was billed by Vercel as an "advanced operation" — a Hobby
   store's monthly allowance of 2,000 was gone in well under a day of normal
   admin use, with storage and bandwidth barely touched. These pin the fix:
   `head()`, not `list()`, and the same "not configured yet" contract as
   before.
   ========================================================================== */

class FakeBlobNotFoundError extends Error {}

const head = vi.fn();
const list = vi.fn();

vi.mock('@vercel/blob', () => ({
  head,
  list,
  del: vi.fn(),
  put: vi.fn(),
  BlobNotFoundError: FakeBlobNotFoundError,
}));

afterEach(() => {
  head.mockReset();
  list.mockReset();
  vi.resetModules();
});

describe('findBlobUrl', () => {
  it('looks a known pathname up directly, never by listing', async () => {
    head.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/media/site-index.json' });

    const { findBlobUrl } = await import('@/lib/photo-storage');
    const url = await findBlobUrl('media/site-index.json');

    expect(url).toBe('https://example.public.blob.vercel-storage.com/media/site-index.json');
    expect(head).toHaveBeenCalledExactlyOnceWith('media/site-index.json');
    expect(list).not.toHaveBeenCalled();
  });

  it('returns null for a pathname nothing has been written to yet', async () => {
    head.mockRejectedValue(new FakeBlobNotFoundError('not found'));

    const { findBlobUrl } = await import('@/lib/photo-storage');
    await expect(findBlobUrl('media/site-index.json')).resolves.toBeNull();
  });

  it('lets any other failure propagate, rather than masking it as "not found yet"', async () => {
    /* A suspended store, a network failure, bad auth — none of those mean
       "this is the first write", and swallowing them here would have hidden
       exactly the kind of infrastructure problem this fix was found while
       diagnosing. */
    head.mockRejectedValue(new Error('Vercel Blob: This store has been suspended.'));

    const { findBlobUrl } = await import('@/lib/photo-storage');
    await expect(findBlobUrl('media/site-index.json')).rejects.toThrow('suspended');
  });
});
