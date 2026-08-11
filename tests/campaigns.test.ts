// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import {
  availableSlug,
  mergeCategories,
  resolveFeaturedProjects,
  resolveHero,
  resolveProjectBySlug,
  resolveProjects,
} from '@/lib/campaigns';
import {
  newCampaignSchema,
  siteIndexSchema,
  slugify,
  type SiteIndex,
} from '@/lib/campaign-schema';
import { projectCategories, projects } from '@/content/projects';

const first = projects[0]!;
const second = projects[1]!;

const index = (campaigns: SiteIndex['campaigns']): SiteIndex => ({ version: 1, campaigns });

afterEach(() => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
});

describe('resolveProjects', () => {
  it('returns the code-defined campaigns untouched when nothing is overridden', async () => {
    const resolved = await resolveProjects(index({}));
    expect(resolved.map((p) => p.slug)).toEqual(projects.map((p) => p.slug));
    expect(resolved[0]?.title).toBe(first.title);
  });

  it('falls back to the code list when storage is not configured', async () => {
    // No BLOB_READ_WRITE_TOKEN, so readSiteIndex short-circuits without a fetch.
    const resolved = await resolveProjects();
    expect(resolved.map((p) => p.slug)).toEqual(projects.map((p) => p.slug));
  });

  it('lets an admin title win over the one in code', async () => {
    const resolved = await resolveProjects(
      index({ [first.slug]: { origin: 'code', title: 'Renamed', titleZh: '改名' } }),
    );
    const target = resolved.find((p) => p.slug === first.slug);
    expect(target?.title).toBe('Renamed');
    expect(target?.titleZh).toBe('改名');
  });

  it('keeps the slug when a campaign is renamed', async () => {
    const resolved = await resolveProjects(
      index({ [first.slug]: { origin: 'code', title: 'Something Else Entirely' } }),
    );
    expect(resolved.some((p) => p.slug === first.slug)).toBe(true);
  });

  it('applies a managed cover over the path in projects.ts', async () => {
    const resolved = await resolveProjects(
      index({
        [first.slug]: {
          origin: 'code',
          cover: {
            url: 'https://store.public.blob.vercel-storage.com/media/projects/x/cover.webp',
            aspect: 'square',
            altText: 'Managed cover.',
            altTextZh: '管理封面。',
          },
        },
      }),
    );

    const target = resolved.find((p) => p.slug === first.slug);
    expect(target?.coverImage).toContain('cover.webp');
    expect(target?.coverAspect).toBe('square');
    expect(target?.altText).toBe('Managed cover.');
    expect(target?.altTextZh).toBe('管理封面。');
  });

  it('sorts by stored order, leaving unordered campaigns after', async () => {
    const resolved = await resolveProjects(
      index({
        [second.slug]: { origin: 'code', order: 0 },
        [first.slug]: { origin: 'code', order: 1 },
      }),
    );

    expect(resolved[0]?.slug).toBe(second.slug);
    expect(resolved[1]?.slug).toBe(first.slug);
    expect(resolved).toHaveLength(projects.length);
  });

  it('appends campaigns created in the tool', async () => {
    const resolved = await resolveProjects(
      index({
        'new-cup-final': {
          origin: 'admin',
          title: 'New Cup Final',
          titleZh: '新盃賽決賽',
          clientName: 'A Club',
          clientNameZh: '一間球會',
          summary: 'A short summary.',
          summaryZh: '簡短摘要。',
          category: 'match-photography',
          filters: ['photography'],
        },
      }),
    );

    const created = resolved.find((p) => p.slug === 'new-cup-final');
    expect(created).toBeDefined();
    expect(created?.title).toBe('New Cup Final');
    expect(created?.sample).toBe(false);
    // Short-form campaigns carry no long prose; the template skips those sections.
    expect(created?.brief).toBeUndefined();
    expect(created?.deliverables.en).toEqual([]);
  });

  it('does not duplicate a campaign that also exists in code', async () => {
    const resolved = await resolveProjects(
      index({ [first.slug]: { origin: 'admin', title: 'Shadow' } }),
    );
    expect(resolved.filter((p) => p.slug === first.slug)).toHaveLength(1);
  });
});

describe('resolveProjectBySlug / resolveFeaturedProjects', () => {
  it('finds a code-defined campaign', async () => {
    expect((await resolveProjectBySlug(first.slug))?.slug).toBe(first.slug);
  });

  it('returns undefined for a slug nobody defines', async () => {
    expect(await resolveProjectBySlug('does-not-exist')).toBeUndefined();
  });

  it('only returns featured campaigns', async () => {
    const featured = await resolveFeaturedProjects(4);
    expect(featured.every((p) => p.featured)).toBe(true);
    expect(featured.length).toBeLessThanOrEqual(4);
  });
});

describe('siteIndexSchema', () => {
  it('rejects an unknown format version', () => {
    expect(siteIndexSchema.safeParse({ version: 2, campaigns: {} }).success).toBe(false);
  });

  it('defaults origin to code', () => {
    const parsed = siteIndexSchema.safeParse({ version: 1, campaigns: { a: { title: 'x' } } });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.campaigns.a?.origin).toBe('code');
  });

  it('rejects a cover pointing somewhere that is not a URL', () => {
    const parsed = siteIndexSchema.safeParse({
      version: 1,
      campaigns: {
        a: {
          cover: { url: '/etc/passwd', aspect: 'square', altText: 'x', altTextZh: 'y' },
        },
      },
    });
    expect(parsed.success).toBe(false);
  });
});

describe('newCampaignSchema', () => {
  const valid = {
    title: 'Cup Final Production',
    titleZh: '盃賽決賽製作',
    clientName: 'Kowloon FC',
    clientNameZh: '九龍足球會',
    summary: 'Full match-day production for the cup final.',
    summaryZh: '盃賽決賽的全日製作。',
    category: 'match-photography',
    filters: ['photography'],
  };

  it('accepts a complete campaign', () => {
    expect(newCampaignSchema.safeParse(valid).success).toBe(true);
  });

  it('requires every field in both languages', () => {
    // This is the runtime replacement for the compile-time parity guarantee
    // that zh-hk.ts gets from being typed as `typeof en`.
    for (const missing of ['title', 'titleZh', 'clientName', 'clientNameZh', 'summary', 'summaryZh'] as const) {
      expect(newCampaignSchema.safeParse({ ...valid, [missing]: '  ' }).success).toBe(false);
    }
  });

  it('requires at least one filter', () => {
    expect(newCampaignSchema.safeParse({ ...valid, filters: [] }).success).toBe(false);
  });

  it('requires a category to be chosen', () => {
    expect(newCampaignSchema.safeParse({ ...valid, category: '  ' }).success).toBe(false);
  });

  it('accepts any category key at the schema level', () => {
    /* Deliberate: categories can be added at runtime, so a module-level enum
       frozen at import would reject a perfectly valid new one. The route
       checks the value against the merged code+admin set instead — see the
       `in categories` guard in src/app/api/campaigns/route.ts. */
    expect(newCampaignSchema.safeParse({ ...valid, category: 'youth-development' }).success).toBe(
      true,
    );
  });
});

describe('slugify', () => {
  it('makes a URL-safe segment from a campaign name', () => {
    expect(slugify('Cup Final Production 2026')).toBe('cup-final-production-2026');
  });

  it('collapses punctuation and trims stray dashes', () => {
    expect(slugify('  Kowloon FC — Season "Recap"!  ')).toBe('kowloon-fc-season-recap');
  });

  it('never exceeds a sensible length', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(60);
  });
});

describe('mergeCategories', () => {
  it('returns the code-defined categories when none were added', () => {
    expect(mergeCategories(index({}))).toEqual(projectCategories);
  });

  it('adds a category created in the tool', () => {
    const merged = mergeCategories({
      version: 1,
      campaigns: {},
      categories: { 'youth-development': { en: 'Youth Development', 'zh-hk': '青訓' } },
    });

    expect(merged['youth-development']).toEqual({
      en: 'Youth Development',
      'zh-hk': '青訓',
    });
    // The code-defined ones survive alongside it.
    expect(Object.keys(merged).length).toBe(Object.keys(projectCategories).length + 1);
  });

  it('lets an admin category override a code one of the same key', () => {
    const key = Object.keys(projectCategories)[0]!;
    const merged = mergeCategories({
      version: 1,
      campaigns: {},
      categories: { [key]: { en: 'Renamed', 'zh-hk': '改名' } },
    });
    expect(merged[key]?.en).toBe('Renamed');
  });
});

describe('availableSlug', () => {
  it('uses the desired slug when it is free', () => {
    expect(availableSlug('cup-final', new Set())).toBe('cup-final');
  });

  it('suffixes rather than overwriting an existing campaign', () => {
    expect(availableSlug('cup-final', new Set(['cup-final']))).toBe('cup-final-2');
    expect(availableSlug('cup-final', new Set(['cup-final', 'cup-final-2']))).toBe(
      'cup-final-3',
    );
  });

  it('never collides with a code-defined slug', () => {
    const taken = new Set(projects.map((p) => p.slug));
    const slug = availableSlug(first.slug, taken);
    expect(taken.has(slug)).toBe(false);
  });
});

describe('a campaign using a runtime-added category', () => {
  it('still parses out of the index', () => {
    // The stored category is a plain string precisely so this works — an enum
    // frozen at import time would reject it and blank the whole index.
    const parsed = siteIndexSchema.safeParse({
      version: 1,
      campaigns: { 'new-one': { origin: 'admin', title: 'New', category: 'youth-development' } },
      categories: { 'youth-development': { en: 'Youth Development', 'zh-hk': '青訓' } },
    });
    expect(parsed.success).toBe(true);
  });

  it('resolves onto the project with that category intact', async () => {
    const resolved = await resolveProjects({
      version: 1,
      campaigns: {
        'new-one': {
          origin: 'admin',
          title: 'New',
          titleZh: '新',
          category: 'youth-development',
          filters: ['club'],
        },
      },
      categories: { 'youth-development': { en: 'Youth Development', 'zh-hk': '青訓' } },
    });
    expect(resolved.find((p) => p.slug === 'new-one')?.category).toBe('youth-development');
  });
});

describe('resolveHero', () => {
  it('is null when nothing has been set', async () => {
    expect(await resolveHero(index({}))).toBeNull();
  });

  it('returns the stored hero', async () => {
    const hero = await resolveHero({
      version: 1,
      campaigns: {},
      hero: {
        posterUrl: 'https://store.public.blob.vercel-storage.com/media/hero/poster.webp',
        posterAltText: 'Floodlit pitch before kickoff.',
        posterAltTextZh: '開賽前的射燈球場。',
      },
    });
    expect(hero?.posterAltText).toBe('Floodlit pitch before kickoff.');
    expect(hero?.videoUrl).toBeUndefined();
  });

  it('rejects a hero with no poster', () => {
    const parsed = siteIndexSchema.safeParse({
      version: 1,
      campaigns: {},
      hero: { posterAltText: 'x', posterAltTextZh: 'y' },
    });
    expect(parsed.success).toBe(false);
  });
});
