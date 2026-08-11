import { del } from '@vercel/blob';

import { mutateSiteIndex, readSiteIndex } from './campaigns';
import type { StorageResult } from './photo-storage';
import {
  type BrandAssets,
  type BrandAssetKind,
  type MediaSlotRecord,
  type SiteIndex,
  type SiteSettingsRecord,
  type SocialPostRecord,
} from './campaign-schema';
import { site } from '@/content/site';
import { socialPosts, type SocialPost } from '@/content/social';
import type { Localised } from '@/content/services';

/* ==========================================================================
   Site-wide content resolution.

   The same overlay contract as campaigns: `src/content/` is the base, the
   index says what the tool changed on top, and an unconfigured or unreadable
   store means the site renders exactly what shipped.
   ========================================================================== */

/* --------------------------------------------------------- Page media slots */

export async function resolvePageMedia(
  index?: SiteIndex,
): Promise<Record<string, MediaSlotRecord>> {
  return (index ?? (await readSiteIndex())).pageMedia ?? {};
}

export async function setPageMediaSlot(
  slot: string,
  record: MediaSlotRecord,
): Promise<StorageResult<SiteIndex>> {
  const current = await readSiteIndex({ fresh: true });
  const previous = current.pageMedia?.[slot];

  const written = await mutateSiteIndex((index) => ({
    ...index,
    pageMedia: {
      ...(index.pageMedia ?? {}),
      [slot]: { ...record, updatedAt: new Date().toISOString() },
    },
  }));

  /* A replaced image is nothing else's business — every upload gets a fresh
     name, so the old file has no other reference. */
  if (written.ok && previous && previous.url !== record.url) {
    await del(previous.url).catch(() => {});
  }

  return written;
}

export async function clearPageMediaSlot(slot: string): Promise<StorageResult<SiteIndex>> {
  const current = await readSiteIndex({ fresh: true });
  const previous = current.pageMedia?.[slot];

  const written = await mutateSiteIndex((index) => {
    if (!index.pageMedia?.[slot]) return index;
    const { [slot]: _dropped, ...rest } = index.pageMedia;
    return { ...index, pageMedia: rest };
  });

  if (written.ok && previous) await del(previous.url).catch(() => {});

  return written;
}

/* ------------------------------------------------------------ Instagram rail */

/**
 * The rail as rendered: the curated list from `social.ts` with any admin
 * overlay applied. Order and length stay code-defined, so the grid keeps its
 * five columns whatever has been filled in.
 */
export function mergeSocialPosts(index: SiteIndex): SocialPost[] {
  const records = index.socialPosts ?? {};

  return socialPosts.map((post) => {
    const record = records[post.id];
    if (!record) return post;

    return {
      ...post,
      href: record.href || post.href,
      image: record.url ?? post.image,
      aspect: record.aspect ?? post.aspect,
      altText: record.altText || post.altText,
      altTextZh: record.altTextZh || post.altTextZh,
      caption: record.caption ?? post.caption,
    };
  });
}

export async function resolveSocialPosts(index?: SiteIndex): Promise<SocialPost[]> {
  return mergeSocialPosts(index ?? (await readSiteIndex()));
}

export async function setSocialPost(
  id: string,
  record: SocialPostRecord,
): Promise<StorageResult<SiteIndex>> {
  const current = await readSiteIndex({ fresh: true });
  const previous = current.socialPosts?.[id];

  const written = await mutateSiteIndex((index) => ({
    ...index,
    socialPosts: {
      ...(index.socialPosts ?? {}),
      [id]: {
        ...(index.socialPosts?.[id] ?? {}),
        ...record,
        updatedAt: new Date().toISOString(),
      },
    },
  }));

  if (written.ok && previous?.url && record.url && previous.url !== record.url) {
    await del(previous.url).catch(() => {});
  }

  return written;
}

/** Drop the uploaded image, keeping the link and words. */
export async function clearSocialPostImage(id: string): Promise<StorageResult<SiteIndex>> {
  const current = await readSiteIndex({ fresh: true });
  const previous = current.socialPosts?.[id]?.url;

  const written = await mutateSiteIndex((index) => {
    const record = index.socialPosts?.[id];
    if (!record) return index;
    const { url: _dropped, ...rest } = record;
    return { ...index, socialPosts: { ...index.socialPosts, [id]: rest } };
  });

  if (written.ok && previous) await del(previous).catch(() => {});

  return written;
}

/* ------------------------------------------------------------ Brand artwork */

export async function resolveBrand(index?: SiteIndex): Promise<BrandAssets> {
  return (index ?? (await readSiteIndex())).brand ?? {};
}

const brandField: Record<BrandAssetKind, keyof BrandAssets> = {
  logo: 'logoUrl',
  mark: 'markUrl',
  icon: 'iconUrl',
  ogImage: 'ogImageUrl',
};

export async function setBrandAsset(
  kind: BrandAssetKind,
  url: string,
): Promise<StorageResult<SiteIndex>> {
  const field = brandField[kind];
  const current = await readSiteIndex({ fresh: true });
  const previous = current.brand?.[field];

  const written = await mutateSiteIndex((index) => ({
    ...index,
    brand: { ...(index.brand ?? {}), [field]: url },
  }));

  if (written.ok && previous && previous !== url) await del(previous).catch(() => {});

  return written;
}

export async function clearBrandAsset(kind: BrandAssetKind): Promise<StorageResult<SiteIndex>> {
  const field = brandField[kind];
  const current = await readSiteIndex({ fresh: true });
  const previous = current.brand?.[field];

  const written = await mutateSiteIndex((index) => {
    if (!index.brand?.[field]) return index;
    const { [field]: _dropped, ...rest } = index.brand;
    return { ...index, brand: rest };
  });

  if (written.ok && previous) await del(previous).catch(() => {});

  return written;
}

/* --------------------------------------------------------- Site identity */

export type ResolvedSite = {
  name: string;
  legalName: string;
  tagline: Localised;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  areaServed: string;
  signOff: string;
  whatsapp: string;
  /** Deploy configuration, not editorial content — environment only. */
  url: string;
  analyticsId: string;
};

/**
 * Site identity with any admin overlay applied.
 *
 * Blank values are never stored (the route drops them), so `??` here means
 * "cleared in the tool" can only ever fall back to what shipped in code —
 * the site cannot end up with no name or no email address.
 */
export function mergeSite(index: SiteIndex): ResolvedSite {
  const stored = index.settings ?? {};

  return {
    name: stored.name ?? site.name,
    legalName: stored.legalName ?? site.legalName,
    tagline: stored.tagline ?? site.tagline,
    email: stored.email ?? site.email,
    instagramHandle: stored.instagramHandle ?? site.instagramHandle,
    instagramUrl: stored.instagramUrl ?? site.instagramUrl,
    areaServed: stored.areaServed ?? site.areaServed,
    signOff: stored.signOff ?? site.signOff,
    whatsapp: stored.whatsapp ?? site.whatsapp,
    url: site.url,
    analyticsId: site.analyticsId,
  };
}

export async function resolveSite(index?: SiteIndex): Promise<ResolvedSite> {
  return mergeSite(index ?? (await readSiteIndex()));
}

/** The two links the header, footer and contact page share. */
export function resolvedSocialLinks(resolved: ResolvedSite) {
  return [
    {
      key: 'instagram',
      label: resolved.instagramHandle,
      href: resolved.instagramUrl,
      external: true,
    },
    { key: 'email', label: resolved.email, href: `mailto:${resolved.email}`, external: true },
  ] as const;
}

export async function saveSiteSettings(
  settings: SiteSettingsRecord,
): Promise<StorageResult<SiteIndex>> {
  return mutateSiteIndex((index) => ({
    ...index,
    settings: { ...settings, updatedAt: new Date().toISOString() },
  }));
}
