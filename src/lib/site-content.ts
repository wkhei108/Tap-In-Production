import { del } from '@vercel/blob';

import { readSiteIndex, writeSiteIndex } from './campaigns';
import { isPhotoStorageConfigured, type StorageResult } from './photo-storage';
import {
  type BrandAssets,
  type BrandAssetKind,
  type MediaSlotRecord,
  type MediaVersion,
  type SiteIndex,
  type SiteSettingsRecord,
  type SocialPostRecord,
} from './campaign-schema';
import {
  findVersion,
  historyKey,
  newVersion,
  pushVersion,
  readHistory,
  removeVersion,
  type MediaScope,
} from './media-history';
import { mediaSlotFor } from './media-slots';
import { site } from '@/content/site';
import { socialPosts, type SocialPost } from '@/content/social';
import type { Localised } from '@/content/services';

/* ==========================================================================
   Site-wide content resolution.

   The same overlay contract as campaigns: `src/content/` is the base, the
   index says what the tool changed on top, and an unconfigured or unreadable
   store means the site renders exactly what shipped.

   Every write that displaces an image files the old version in the history
   log rather than deleting it, so an upload is never a one-way door.
   ========================================================================== */

/**
 * Write a computed index, then delete only the files it orphaned.
 *
 * Deleting after the write is deliberate: if the write fails nothing has
 * been destroyed, and a failed delete leaves a stray file rather than a
 * broken page.
 */
async function commit(
  next: SiteIndex,
  expired: string[] = [],
): Promise<StorageResult<SiteIndex>> {
  const written = await writeSiteIndex(next);
  if (!written.ok) return written;

  for (const url of expired) await del(url).catch(() => {});

  return written;
}

/* --------------------------------------------------------- Page media slots */

export async function resolvePageMedia(
  index?: SiteIndex,
): Promise<Record<string, MediaSlotRecord>> {
  return (index ?? (await readSiteIndex())).pageMedia ?? {};
}

const versionFromSlot = (record: MediaSlotRecord, reason: MediaVersion['reason']) =>
  newVersion({
    url: record.url,
    aspect: record.aspect,
    altText: record.altText,
    altTextZh: record.altTextZh,
    caption: record.caption,
    reason,
  });

export async function setPageMediaSlot(
  slot: string,
  record: MediaSlotRecord,
): Promise<StorageResult<SiteIndex>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const current = await readSiteIndex({ fresh: true });
  const previous = current.pageMedia?.[slot];

  let next: SiteIndex = {
    ...current,
    pageMedia: {
      ...(current.pageMedia ?? {}),
      [slot]: { ...record, updatedAt: new Date().toISOString() },
    },
  };
  let expired: string[] = [];

  /* Only file a version when the image itself changed — correcting alt text
     should not push five copies of the same photo into the history. */
  if (previous && previous.url !== record.url) {
    ({ index: next, expired } = pushVersion(
      next,
      historyKey('page', slot),
      versionFromSlot(previous, 'replaced'),
    ));
  }

  return commit(next, expired);
}

export async function clearPageMediaSlot(slot: string): Promise<StorageResult<SiteIndex>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const current = await readSiteIndex({ fresh: true });
  const previous = current.pageMedia?.[slot];
  if (!previous) return { ok: true, data: current };

  const { [slot]: _dropped, ...rest } = current.pageMedia ?? {};

  const { index: next, expired } = pushVersion(
    { ...current, pageMedia: rest },
    historyKey('page', slot),
    versionFromSlot(previous, 'removed'),
  );

  return commit(next, expired);
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
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const current = await readSiteIndex({ fresh: true });
  const previous = current.socialPosts?.[id];

  let next: SiteIndex = {
    ...current,
    socialPosts: {
      ...(current.socialPosts ?? {}),
      [id]: { ...(previous ?? {}), ...record, updatedAt: new Date().toISOString() },
    },
  };
  let expired: string[] = [];

  if (previous?.url && record.url && previous.url !== record.url) {
    ({ index: next, expired } = pushVersion(
      next,
      historyKey('social', id),
      newVersion({
        url: previous.url,
        aspect: previous.aspect,
        altText: previous.altText,
        altTextZh: previous.altTextZh,
        caption: previous.caption,
        href: previous.href,
        reason: 'replaced',
      }),
    ));
  }

  return commit(next, expired);
}

/** Drop the uploaded image, keeping the link and words. */
export async function clearSocialPostImage(id: string): Promise<StorageResult<SiteIndex>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const current = await readSiteIndex({ fresh: true });
  const previous = current.socialPosts?.[id];
  if (!previous?.url) return { ok: true, data: current };

  const { url: _dropped, ...rest } = previous;

  const { index: next, expired } = pushVersion(
    { ...current, socialPosts: { ...current.socialPosts, [id]: rest } },
    historyKey('social', id),
    newVersion({
      url: previous.url,
      aspect: previous.aspect,
      altText: previous.altText,
      altTextZh: previous.altTextZh,
      caption: previous.caption,
      href: previous.href,
      reason: 'removed',
    }),
  );

  return commit(next, expired);
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
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const field = brandField[kind];
  const current = await readSiteIndex({ fresh: true });
  const previous = current.brand?.[field];

  let next: SiteIndex = { ...current, brand: { ...(current.brand ?? {}), [field]: url } };
  let expired: string[] = [];

  if (previous && previous !== url) {
    ({ index: next, expired } = pushVersion(
      next,
      historyKey('brand', kind),
      newVersion({ url: previous, reason: 'replaced' }),
    ));
  }

  return commit(next, expired);
}

export async function clearBrandAsset(kind: BrandAssetKind): Promise<StorageResult<SiteIndex>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const field = brandField[kind];
  const current = await readSiteIndex({ fresh: true });
  const previous = current.brand?.[field];
  if (!previous) return { ok: true, data: current };

  const { [field]: _dropped, ...rest } = current.brand ?? {};

  const { index: next, expired } = pushVersion(
    { ...current, brand: rest },
    historyKey('brand', kind),
    newVersion({ url: previous, reason: 'removed' }),
  );

  return commit(next, expired);
}

/* ------------------------------------------------------------ Restoring */

/**
 * Put an earlier version back.
 *
 * Whatever was current is filed into the log on the way past, so a restore
 * is itself undoable — including a restore that turns out to be the wrong
 * one. The entry being restored leaves the log, because it is now current.
 */
export async function restoreMediaVersion(
  key: string,
  scope: MediaScope,
  id: string,
  versionId: string,
): Promise<StorageResult<SiteIndex>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const current = await readSiteIndex({ fresh: true });
  const version = findVersion(current, key, versionId);
  if (!version) return { ok: false, reason: 'not-found' };

  let next = current;
  let expired: string[] = [];

  const file = (outgoing: MediaVersion | null) => {
    if (!outgoing) return;
    ({ index: next, expired } = pushVersion(next, key, outgoing));
  };

  if (scope === 'page') {
    const existing = current.pageMedia?.[id];
    file(existing ? versionFromSlot(existing, 'replaced') : null);

    next = {
      ...next,
      pageMedia: {
        ...(next.pageMedia ?? {}),
        [id]: {
          url: version.url,
          aspect: version.aspect ?? mediaSlotFor(id)?.aspect ?? 'landscape',
          altText: version.altText || existing?.altText || 'Restored image',
          altTextZh: version.altTextZh || existing?.altTextZh || 'Restored image',
          caption: version.caption,
          updatedAt: new Date().toISOString(),
        },
      },
    };
  } else if (scope === 'social') {
    const existing = current.socialPosts?.[id];
    file(
      existing?.url
        ? newVersion({
            url: existing.url,
            aspect: existing.aspect,
            altText: existing.altText,
            altTextZh: existing.altTextZh,
            caption: existing.caption,
            href: existing.href,
            reason: 'replaced',
          })
        : null,
    );

    next = {
      ...next,
      socialPosts: {
        ...(next.socialPosts ?? {}),
        [id]: {
          ...(existing ?? {}),
          url: version.url,
          aspect: version.aspect ?? existing?.aspect,
          altText: version.altText ?? existing?.altText,
          altTextZh: version.altTextZh ?? existing?.altTextZh,
          caption: version.caption ?? existing?.caption,
          href: version.href ?? existing?.href,
          updatedAt: new Date().toISOString(),
        },
      },
    };
  } else {
    const field = brandField[id as BrandAssetKind];
    if (!field) return { ok: false, reason: 'not-found' };

    const existing = current.brand?.[field];
    file(existing ? newVersion({ url: existing, reason: 'replaced' }) : null);

    next = { ...next, brand: { ...(next.brand ?? {}), [field]: version.url } };
  }

  next = removeVersion(next, key, versionId);

  return commit(next, expired);
}

/** The history log for one slot, newest first. */
export async function resolveMediaHistory(
  key: string,
  index?: SiteIndex,
): Promise<MediaVersion[]> {
  return readHistory(index ?? (await readSiteIndex()), key);
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
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  const current = await readSiteIndex({ fresh: true });
  return commit({ ...current, settings: { ...settings, updatedAt: new Date().toISOString() } });
}
