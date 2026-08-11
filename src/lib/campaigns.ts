import { del, list, put } from '@vercel/blob';

import {
  campaignRecordSchema,
  emptySiteIndex,
  siteIndexSchema,
  slugify,
  type CampaignCover,
  type CampaignRecord,
  type HeroRecord,
  type SiteIndex,
} from './campaign-schema';
import { isPhotoStorageConfigured, type StorageResult } from './photo-storage';
import {
  projectCategories,
  projects,
  type Project,
  type ProjectCategory,
  type WorkFilter,
} from '@/content/projects';
import type { Localised } from '@/content/services';

/* ==========================================================================
   Campaign resolution.

   Every public page needs the same thing: the list of campaigns, with any
   admin overlay applied. Reading each campaign's own manifest would mean a
   dozen round trips per page; this reads one small index instead.

   Same contract as `readManifest`: if storage is unconfigured or the read
   fails, the site falls back to exactly what `src/content/projects.ts` says
   and nothing appears broken.
   ========================================================================== */

const indexPath = 'media/site-index.json';

/** How long a page may serve a stale index. Writes call `revalidatePath` too. */
const indexRevalidateSeconds = 900;

async function findIndexUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: indexPath, limit: 1 });
  return blobs.find((blob) => blob.pathname === indexPath)?.url ?? null;
}

export async function readSiteIndex(
  { fresh = false }: { fresh?: boolean } = {},
): Promise<SiteIndex> {
  if (!isPhotoStorageConfigured()) return emptySiteIndex();

  try {
    const url = await findIndexUrl();
    if (!url) return emptySiteIndex();

    const response = await fetch(
      url,
      fresh ? { cache: 'no-store' } : { next: { revalidate: indexRevalidateSeconds } },
    );
    if (!response.ok) {
      console.error(`[TAP IN.] Campaign index returned ${response.status}.`);
      return emptySiteIndex();
    }

    const parsed = siteIndexSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error('[TAP IN.] Campaign index is malformed; ignoring it.');
      return emptySiteIndex();
    }

    return parsed.data;
  } catch (error) {
    console.error('[TAP IN.] Could not read the campaign index:', error);
    return emptySiteIndex();
  }
}

export async function writeSiteIndex(index: SiteIndex): Promise<StorageResult<SiteIndex>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  try {
    await put(indexPath, JSON.stringify(index), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    return { ok: true, data: index };
  } catch (error) {
    console.error('[TAP IN.] Could not write the campaign index:', error);
    return { ok: false, reason: 'storage-error' };
  }
}

/** Read, change, write. Always reads fresh so concurrent edits do not clobber. */
export async function mutateSiteIndex(
  change: (index: SiteIndex) => SiteIndex,
): Promise<StorageResult<SiteIndex>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };
  return writeSiteIndex(change(await readSiteIndex({ fresh: true })));
}

/* ==========================================================================
   Overlaying
   ========================================================================== */

/**
 * Turn an admin-created record into the `Project` shape the site renders.
 *
 * The prose fields a full case study carries — brief, challenge, approach,
 * deliverables — are simply absent; the template skips those sections rather
 * than printing empty headings.
 */
function projectFromRecord(slug: string, record: CampaignRecord): Project {
  return {
    slug,
    title: record.title ?? slug,
    titleZh: record.titleZh ?? record.title ?? slug,
    client: { en: record.clientName ?? '', 'zh-hk': record.clientNameZh ?? '' },
    year: record.year || undefined,
    category: (record.category ?? 'season-campaign') as ProjectCategory,
    filters: (record.filters ?? ['all']) as WorkFilter[],
    services: { en: [], 'zh-hk': [] },
    summary: record.summary ?? '',
    summaryZh: record.summaryZh ?? '',
    coverImage: record.cover?.url,
    coverAspect: record.cover?.aspect ?? 'landscape',
    altText: record.cover?.altText ?? record.title ?? slug,
    altTextZh: record.cover?.altTextZh ?? record.titleZh ?? slug,
    deliverables: { en: [], 'zh-hk': [] },
    gallery: [],
    featured: false,
    sample: false,
  };
}

/** Apply an overlay to a campaign that is defined in code. */
function applyOverlay(project: Project, record: CampaignRecord | undefined): Project {
  if (!record) return project;

  return {
    ...project,
    title: record.title ?? project.title,
    titleZh: record.titleZh ?? project.titleZh,
    // A managed cover wins over the path in projects.ts, and brings its own
    // crop and alt text with it.
    coverImage: record.cover?.url ?? project.coverImage,
    coverAspect: record.cover?.aspect ?? project.coverAspect,
    altText: record.cover?.altText ?? project.altText,
    altTextZh: record.cover?.altTextZh ?? project.altTextZh,
  };
}

/** Stable sort: explicit order first, then the order they appear in code. */
function byStoredOrder(index: SiteIndex) {
  return (a: Project, b: Project) => {
    const orderA = index.campaigns[a.slug]?.order;
    const orderB = index.campaigns[b.slug]?.order;
    if (orderA === undefined && orderB === undefined) return 0;
    if (orderA === undefined) return 1;
    if (orderB === undefined) return -1;
    return orderA - orderB;
  };
}

/**
 * The campaign list every public page should use.
 *
 * Returns plain `Project[]`, so `ProjectCard`, `ProjectGrid` and
 * `WorkExplorer` need no changes at all — the overlay is invisible to them.
 */
export async function resolveProjects(index?: SiteIndex): Promise<Project[]> {
  const resolved = index ?? (await readSiteIndex());

  const fromCode = projects.map((project) =>
    applyOverlay(project, resolved.campaigns[project.slug]),
  );

  const codeSlugs = new Set(projects.map((project) => project.slug));
  const fromAdmin = Object.entries(resolved.campaigns)
    .filter(([slug, record]) => record.origin === 'admin' && !codeSlugs.has(slug))
    .map(([slug, record]) => projectFromRecord(slug, record));

  return [...fromCode, ...fromAdmin].sort(byStoredOrder(resolved));
}

export async function resolveProjectBySlug(slug: string): Promise<Project | undefined> {
  return (await resolveProjects()).find((project) => project.slug === slug);
}

export async function resolveFeaturedProjects(limit = 6): Promise<Project[]> {
  return (await resolveProjects()).filter((project) => project.featured).slice(0, limit);
}

/** Related campaigns, sharing a filter where possible. Mirrors getRelatedProjects. */
export async function resolveRelatedProjects(slug: string, limit = 3): Promise<Project[]> {
  const all = await resolveProjects();
  const current = all.find((project) => project.slug === slug);
  if (!current) return [];

  const others = all.filter((project) => project.slug !== slug);
  const sharing = others.filter((project) =>
    project.filters.some((filter) => filter !== 'all' && current.filters.includes(filter)),
  );

  const seen = new Set<string>();
  return [...sharing, ...others]
    .filter((project) => !seen.has(project.slug) && seen.add(project.slug))
    .slice(0, limit);
}

/* ==========================================================================
   Cover writes
   ========================================================================== */

export async function setCampaignCover(
  slug: string,
  cover: CampaignCover,
): Promise<StorageResult<SiteIndex>> {
  return mutateSiteIndex((index) => ({
    ...index,
    campaigns: {
      ...index.campaigns,
      [slug]: campaignRecordSchema.parse({ ...index.campaigns[slug], cover }),
    },
  }));
}

/**
 * Drop the managed cover, falling back to whatever projects.ts specifies.
 *
 * A dedicated upload is deleted from storage as well; a cover promoted from
 * the gallery is left alone, because that photo is still in the gallery.
 */
export async function clearCampaignCover(slug: string): Promise<StorageResult<SiteIndex>> {
  const current = await readSiteIndex({ fresh: true });
  const existing = current.campaigns[slug]?.cover;

  const written = await mutateSiteIndex((index) => {
    const record = index.campaigns[slug];
    if (!record) return index;
    const { cover: _dropped, ...rest } = record;
    return {
      ...index,
      campaigns: { ...index.campaigns, [slug]: campaignRecordSchema.parse(rest) },
    };
  });

  if (written.ok && existing && !existing.fromPhotoId) {
    await del(existing.url).catch(() => {});
  }

  return written;
}

/* ==========================================================================
   Categories

   Same overlay idea as campaigns: the code-defined set is the base, the index
   adds to it. Resolved per request rather than baked into a module-level enum,
   because a category added through the tool has to count immediately.
   ========================================================================== */

export type CategoryMap = Record<string, Localised>;

export function mergeCategories(index: SiteIndex): CategoryMap {
  return { ...projectCategories, ...(index.categories ?? {}) };
}

export async function resolveCategories(index?: SiteIndex): Promise<CategoryMap> {
  return mergeCategories(index ?? (await readSiteIndex()));
}

/** Add a category. The key is derived from the English label, once. */
export async function addCategory(
  label: string,
  labelZh: string,
): Promise<StorageResult<{ key: string }>> {
  const key = slugify(label);
  if (!key) return { ok: false, reason: 'storage-error' };

  const written = await mutateSiteIndex((index) => ({
    ...index,
    categories: {
      ...(index.categories ?? {}),
      [key]: { en: label, 'zh-hk': labelZh },
    },
  }));

  if (!written.ok) return written;
  return { ok: true, data: { key } };
}

/* ==========================================================================
   Campaign records
   ========================================================================== */

/** A slug that is free, suffixing `-2`, `-3`… rather than overwriting. */
export function availableSlug(desired: string, taken: Set<string>): string {
  if (!taken.has(desired)) return desired;
  for (let n = 2; n < 500; n += 1) {
    const candidate = `${desired}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${desired}-${Date.now()}`;
}

type CampaignFields = Pick<
  CampaignRecord,
  | 'title'
  | 'titleZh'
  | 'clientName'
  | 'clientNameZh'
  | 'summary'
  | 'summaryZh'
  | 'category'
  | 'filters'
  | 'year'
>;

/**
 * Create a campaign in the tool.
 *
 * The slug is derived from the name here and never changes again — renaming
 * later edits the display name only.
 */
export async function createCampaign(
  fields: CampaignFields,
): Promise<StorageResult<{ slug: string }>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const current = await readSiteIndex({ fresh: true });
  const taken = new Set([...projects.map((p) => p.slug), ...Object.keys(current.campaigns)]);
  const slug = availableSlug(slugify(fields.title ?? ''), taken);
  if (!slug) return { ok: false, reason: 'storage-error' };

  const written = await writeSiteIndex({
    ...current,
    campaigns: {
      ...current.campaigns,
      [slug]: campaignRecordSchema.parse({
        ...fields,
        origin: 'admin',
        createdAt: new Date().toISOString(),
      }),
    },
  });

  if (!written.ok) return written;
  return { ok: true, data: { slug } };
}

/**
 * Edit a campaign's short-form fields.
 *
 * Works for both origins. On a code-defined campaign these become an overlay
 * over `projects.ts`; the long-form prose is never touched, because it is not
 * in this field set at all.
 */
export async function updateCampaign(
  slug: string,
  fields: CampaignFields,
): Promise<StorageResult<SiteIndex>> {
  return mutateSiteIndex((index) => ({
    ...index,
    campaigns: {
      ...index.campaigns,
      [slug]: campaignRecordSchema.parse({ ...index.campaigns[slug], ...fields }),
    },
  }));
}

/** Write a new running order across all campaigns. */
export async function reorderCampaigns(slugs: string[]): Promise<StorageResult<SiteIndex>> {
  return mutateSiteIndex((index) => {
    const campaigns = { ...index.campaigns };
    slugs.forEach((slug, position) => {
      campaigns[slug] = campaignRecordSchema.parse({ ...campaigns[slug], order: position });
    });
    return { ...index, campaigns };
  });
}

/* ==========================================================================
   Homepage hero
   ========================================================================== */

export async function resolveHero(index?: SiteIndex): Promise<HeroRecord | null> {
  return (index ?? (await readSiteIndex())).hero ?? null;
}

export async function setHero(hero: HeroRecord): Promise<StorageResult<SiteIndex>> {
  return mutateSiteIndex((index) => ({
    ...index,
    hero: { ...hero, updatedAt: new Date().toISOString() },
  }));
}

/** Remove the hero, and the files behind it — nothing else references them. */
export async function clearHero(): Promise<StorageResult<SiteIndex>> {
  const current = await readSiteIndex({ fresh: true });
  const existing = current.hero;

  const written = await mutateSiteIndex((index) => {
    const { hero: _dropped, ...rest } = index;
    return rest as SiteIndex;
  });

  if (written.ok && existing) {
    await del(existing.posterUrl).catch(() => {});
    if (existing.videoUrl) await del(existing.videoUrl).catch(() => {});
  }

  return written;
}
