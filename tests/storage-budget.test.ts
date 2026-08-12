// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* ==========================================================================
   How many storage operations does one action cost?

   Vercel Blob bills two buckets, and a Hobby store's monthly allowance for
   the expensive one is small (2,000):

     Advanced — put(), copy(), list()          ← the scarce one
     Simple   — head(), and a cache-MISS read
     Free     — del()

   A store already hit that ceiling once, from a `list()` used to look up a
   pathname the code already knew. That was one instance of a general
   failure: nothing anywhere asserted how much storage work an action did, so
   a redundant read cost nothing to add and nothing caught it.

   These tests are that missing budget. They pin the operation count of every
   write path in the tool. A change that adds a round trip fails here with a
   number, rather than turning up a month later as a suspended store.
   ========================================================================== */

class FakeBlobNotFoundError extends Error {}

const ops = { head: 0, put: 0, list: 0, del: 0 };

/** The document each pathname currently holds, keyed by pathname. */
const store = new Map<string, string>();

const head = vi.fn(async (pathname: string) => {
  ops.head += 1;
  if (!store.has(pathname)) throw new FakeBlobNotFoundError(pathname);
  return { url: `https://test.public.blob.vercel-storage.com/${pathname}`, pathname };
});

const put = vi.fn(async (pathname: string, body: unknown) => {
  ops.put += 1;
  store.set(pathname, typeof body === 'string' ? body : '<binary>');
  return { url: `https://test.public.blob.vercel-storage.com/${pathname}`, pathname };
});

const list = vi.fn(async () => {
  ops.list += 1;
  return { blobs: [], hasMore: false, cursor: undefined };
});

const del = vi.fn(async () => {
  ops.del += 1;
});

vi.mock('@vercel/blob', () => ({
  head,
  put,
  list,
  del,
  BlobNotFoundError: FakeBlobNotFoundError,
}));

/* The public blob URL is fetched directly rather than through the SDK. */
const originalFetch = globalThis.fetch;

beforeEach(() => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test-token';

  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const pathname = url.split('.com/')[1] ?? '';
    const body = store.get(pathname);

    if (body === undefined) return new Response('missing', { status: 404 });
    return new Response(body, { status: 200 });
  }) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  store.clear();
  ops.head = 0;
  ops.put = 0;
  ops.list = 0;
  ops.del = 0;
  vi.clearAllMocks();
  vi.resetModules();
});

/** Put a usable index in place without spending counted operations. */
function seedIndex(extra: Record<string, unknown> = {}) {
  store.set(
    'media/site-index.json',
    JSON.stringify({ version: 1, campaigns: {}, ...extra }),
  );
  ops.head = 0;
  ops.put = 0;
}

const slot = {
  url: 'https://test.public.blob.vercel-storage.com/media/pages/about.pov-1.webp',
  aspect: 'landscape' as const,
  altText: 'Alt',
  altTextZh: '替代',
};

describe('list() is never used again', () => {
  it('no write path reaches for a scan', async () => {
    seedIndex();
    const { setPageMediaSlot, clearPageMediaSlot, setBrandAsset, clearBrandAsset } =
      await import('@/lib/site-content');

    await setPageMediaSlot('about.pov', slot);
    await clearPageMediaSlot('about.pov');
    await setBrandAsset('logo', 'https://test.public.blob.vercel-storage.com/a.png');
    await clearBrandAsset('logo');

    expect(ops.list).toBe(0);
  });
});

describe('one write costs one advanced operation', () => {
  /* `put()` is the only advanced operation left in the codebase. Each of
     these actions changes one document, so each should cost exactly one —
     any more means the same document is being written twice. */

  it('filling a page media slot', async () => {
    seedIndex();
    const { setPageMediaSlot } = await import('@/lib/site-content');

    await setPageMediaSlot('about.pov', slot);

    expect(ops.put).toBe(1);
    expect(ops.head).toBe(1);
  });

  it('emptying a page media slot', async () => {
    seedIndex({ pageMedia: { 'about.pov': slot } });
    const { clearPageMediaSlot } = await import('@/lib/site-content');

    await clearPageMediaSlot('about.pov');

    expect(ops.put).toBe(1);
    expect(ops.head).toBe(1);
  });

  it('saving site settings', async () => {
    seedIndex();
    const { saveSiteSettings } = await import('@/lib/site-content');

    await saveSiteSettings({ name: 'TAP IN.' });

    expect(ops.put).toBe(1);
    expect(ops.head).toBe(1);
  });

  it('replacing a brand asset', async () => {
    seedIndex({ brand: { logoUrl: 'https://test.public.blob.vercel-storage.com/old.png' } });
    const { setBrandAsset } = await import('@/lib/site-content');

    await setBrandAsset('logo', 'https://test.public.blob.vercel-storage.com/new.png');

    expect(ops.put).toBe(1);
    expect(ops.head).toBe(1);
  });

  it('restoring an earlier version', async () => {
    seedIndex({
      brand: { logoUrl: 'https://test.public.blob.vercel-storage.com/current.png' },
      mediaHistory: {
        'brand:logo': [
          {
            id: 'v1',
            url: 'https://test.public.blob.vercel-storage.com/older.png',
            replacedAt: new Date().toISOString(),
            reason: 'replaced',
          },
        ],
      },
    });
    const { restoreMediaVersion } = await import('@/lib/site-content');

    const result = await restoreMediaVersion('brand:logo', 'brand', 'logo', 'v1');

    expect(result.ok).toBe(true);
    expect(ops.put).toBe(1);
    expect(ops.head).toBe(1);
  });

  it('clearing a campaign cover', async () => {
    seedIndex({
      campaigns: {
        demo: {
          origin: 'code',
          cover: {
            url: 'https://test.public.blob.vercel-storage.com/media/projects/demo/cover-1.webp',
            aspect: 'landscape',
            altText: 'Alt',
            altTextZh: '替代',
          },
        },
      },
    });
    const { clearCampaignCover } = await import('@/lib/campaigns');

    await clearCampaignCover('demo');

    expect(ops.put).toBe(1);
    /* Reading the outgoing cover and reading the document to change are the
       same read — doing both separately was two round trips for one edit. */
    expect(ops.head).toBe(1);
  });

  it('clearing the homepage hero', async () => {
    seedIndex({
      hero: {
        posterUrl: 'https://test.public.blob.vercel-storage.com/media/hero/poster-1.webp',
        posterAltText: 'Alt',
        posterAltTextZh: '替代',
      },
    });
    const { clearHero } = await import('@/lib/campaigns');

    await clearHero();

    expect(ops.put).toBe(1);
    expect(ops.head).toBe(1);
  });

  it('creating a campaign', async () => {
    seedIndex();
    const { createCampaign } = await import('@/lib/campaigns');

    await createCampaign({ title: 'New One', titleZh: '新' });

    expect(ops.put).toBe(1);
    expect(ops.head).toBe(1);
  });

  it('reordering campaigns', async () => {
    seedIndex({ campaigns: { a: { origin: 'admin' }, b: { origin: 'admin' } } });
    const { reorderCampaigns } = await import('@/lib/campaigns');

    await reorderCampaigns(['b', 'a']);

    expect(ops.put).toBe(1);
    expect(ops.head).toBe(1);
  });
});

describe('resolving where a document lives', () => {
  it('collapses concurrent lookups of the same document into one', async () => {
    seedIndex();
    const { resolveProjects, resolveHero } = await import('@/lib/campaigns');
    const { resolveSite, resolveBrand, resolvePageMedia, resolveSocialPosts } = await import(
      '@/lib/site-content'
    );

    /* What the homepage plus its header and footer ask for, all at once and
       all the same document. React's per-request cache covers this during a
       render, but a route handler gets no such scope — so the dedupe lives in
       the storage layer, where it holds everywhere. */
    await Promise.all([
      resolveProjects(),
      resolveHero(),
      resolveSite(),
      resolveBrand(),
      resolvePageMedia(),
      resolveSocialPosts(),
    ]);

    expect(ops.head).toBe(1);
    expect(ops.put).toBe(0);
  });

  it('never looks the same document up twice, however many requests arrive', async () => {
    seedIndex();
    const { readSiteIndex } = await import('@/lib/campaigns');

    /* Sequential and `fresh`, so each one really does re-read the contents —
       but a pathname's URL cannot change, so it is resolved once. */
    await readSiteIndex({ fresh: true });
    await readSiteIndex({ fresh: true });
    await readSiteIndex({ fresh: true });

    expect(ops.head).toBe(1);
  });

  it('does not treat "nothing here yet" as a permanent answer', async () => {
    /* Nothing seeded: the first read finds no document. If that miss were
       cached, the first write would stay invisible forever. */
    const { readSiteIndex, writeSiteIndex } = await import('@/lib/campaigns');
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';

    expect((await readSiteIndex({ fresh: true })).campaigns).toEqual({});

    await writeSiteIndex({ version: 1, campaigns: { demo: { origin: 'admin' } } });
    const after = await readSiteIndex({ fresh: true });

    expect(after.campaigns.demo).toBeDefined();
  });

  it('costs nothing to find a document it just wrote', async () => {
    const { writeSiteIndex, readSiteIndex } = await import('@/lib/campaigns');
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';

    await writeSiteIndex({ version: 1, campaigns: {} });
    ops.head = 0;

    await readSiteIndex({ fresh: true });

    /* The write reported where it landed, so the read that follows — which
       the admin does on almost every request — resolves for free. */
    expect(ops.head).toBe(0);
  });
});

describe('deleting displaced files is free, and never skipped', () => {
  it('drops the file that fell past the history cap', async () => {
    const versions = Array.from({ length: 6 }, (_, n) => ({
      id: `v${n}`,
      url: `https://test.public.blob.vercel-storage.com/old-${n}.png`,
      replacedAt: new Date().toISOString(),
      reason: 'replaced' as const,
    }));

    seedIndex({
      brand: { logoUrl: 'https://test.public.blob.vercel-storage.com/current.png' },
      mediaHistory: { 'brand:logo': versions },
    });

    const { setBrandAsset } = await import('@/lib/site-content');
    await setBrandAsset('logo', 'https://test.public.blob.vercel-storage.com/newest.png');

    /* The oldest of seven falls off the six-deep log. `del()` is free, so
       there is no reason to batch or defer it. */
    expect(ops.del).toBe(1);
    expect(ops.put).toBe(1);
  });
});
