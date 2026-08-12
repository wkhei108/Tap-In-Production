import { randomUUID } from 'node:crypto';
import { cache } from 'react';
import { put } from '@vercel/blob';

import {
  copyHistoryLimit,
  copyOverlaySchema,
  emptyCopyOverlay,
  flattenDictionaries,
  flattenLocalised,
  mergeDictionary,
  mergeLocalised,
  type CopyField,
  type CopyOverlay,
  type CopySnapshot,
  type CopyValues,
} from './copy-schema';
import {
  findBlobUrl,
  isPhotoStorageConfigured,
  rememberBlobUrl,
  type StorageResult,
} from './photo-storage';
import type { Locale } from './i18n';
import { en } from '@/content/en';
import { zhHK } from '@/content/zh-hk';
import type { Dictionary } from '@/content/dictionaries';
import {
  capabilityGroups,
  clubMatchweekCalendar,
  clubSeasonWorkflow,
  clubServices,
  gameDeliverablesBoard,
  gameEventJourney,
  gameServices,
  processSteps,
  type BoardColumn,
  type CapabilityGroup,
  type ProcessStep,
  type ServiceDetail,
  type TimelineStage,
} from '@/content/services';

/* ==========================================================================
   Copy resolution.

   Same contract as `readSiteIndex`: if storage is unconfigured or the read
   fails, the site falls back to exactly what `src/content/` says and nothing
   appears broken. Every read is wrapped so a bad overlay can never take the
   public site down — the worst case is that an edit stops applying.
   ========================================================================== */

const overlayPath = 'media/content/copy.json';

/** How long a page may serve stale copy. Writes call `revalidatePath` too. */
const overlayRevalidateSeconds = 900;

async function findOverlayUrl(): Promise<string | null> {
  return findBlobUrl(overlayPath);
}

async function fetchOverlay({ fresh }: { fresh: boolean }): Promise<CopyOverlay> {
  if (!isPhotoStorageConfigured()) return emptyCopyOverlay();

  try {
    const url = await findOverlayUrl();
    if (!url) return emptyCopyOverlay();

    const response = await fetch(
      url,
      fresh ? { cache: 'no-store' } : { next: { revalidate: overlayRevalidateSeconds } },
    );
    if (!response.ok) {
      console.error(`[TAP IN.] Copy overlay returned ${response.status}.`);
      return emptyCopyOverlay();
    }

    const parsed = copyOverlaySchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error('[TAP IN.] Copy overlay is malformed; ignoring it.');
      return emptyCopyOverlay();
    }

    return parsed.data;
  } catch (error) {
    console.error('[TAP IN.] Could not read the copy overlay:', error);
    return emptyCopyOverlay();
  }
}

/**
 * Read the overlay once per request.
 *
 * Unlike the campaign index — which a page reads once and threads through —
 * copy is needed by the header, the footer and half a dozen self-contained
 * sections. `cache` collapses those into a single read per render.
 */
const readCachedOverlay = cache(() => fetchOverlay({ fresh: false }));

export async function readCopyOverlay(
  { fresh = false }: { fresh?: boolean } = {},
): Promise<CopyOverlay> {
  return fresh ? fetchOverlay({ fresh: true }) : readCachedOverlay();
}

export async function writeCopyOverlay(overlay: CopyOverlay): Promise<StorageResult<CopyOverlay>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };

  try {
    const blob = await put(overlayPath, JSON.stringify(overlay), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });

    rememberBlobUrl(overlayPath, blob.url);

    return { ok: true, data: overlay };
  } catch (error) {
    console.error('[TAP IN.] Could not write the copy overlay:', error);
    return { ok: false, reason: 'storage-error' };
  }
}

/** Read, change, write. Always reads fresh so concurrent edits do not clobber. */
export async function mutateCopyOverlay(
  change: (overlay: CopyOverlay) => CopyOverlay,
): Promise<StorageResult<CopyOverlay>> {
  if (!isPhotoStorageConfigured()) return { ok: false, reason: 'storage-not-configured' };
  return writeCopyOverlay(change(await readCopyOverlay({ fresh: true })));
}

/* ==========================================================================
   Resolving content
   ========================================================================== */

const dictionaries: Record<Locale, Dictionary> = { en, 'zh-hk': zhHK };

/**
 * The dictionary every public page should use.
 *
 * Returns a plain `Dictionary`, so components need no changes beyond becoming
 * async — the overlay is invisible to them.
 */
export async function resolveDictionary(
  locale: Locale,
  overlay?: CopyOverlay,
): Promise<Dictionary> {
  const resolved = overlay ?? (await readCopyOverlay());
  return mergeDictionary(dictionaries[locale], dictionaryValues(resolved, locale));
}

/** Only the paths that belong to the dictionaries, not to services.ts. */
function dictionaryValues(overlay: CopyOverlay, locale: Locale): CopyValues {
  const values = overlay.values[locale] ?? {};
  const entries = Object.entries(values).filter(([path]) => !path.startsWith(`${servicesPrefix}.`));
  return Object.fromEntries(entries);
}

export type ServiceContent = {
  clubServices: ServiceDetail[];
  gameServices: ServiceDetail[];
  capabilityGroups: CapabilityGroup[];
  processSteps: ProcessStep[];
  clubSeasonWorkflow: TimelineStage[];
  clubMatchweekCalendar: BoardColumn[];
  gameEventJourney: TimelineStage[];
  gameDeliverablesBoard: BoardColumn[];
};

const servicesPrefix = 'services';

const serviceSources: ServiceContent = {
  clubServices,
  gameServices,
  capabilityGroups,
  processSteps,
  clubSeasonWorkflow,
  clubMatchweekCalendar,
  gameEventJourney,
  gameDeliverablesBoard,
};

/**
 * The service data every pillar page should use.
 *
 * Keeps the `Localised` shape intact, so `service.title[locale]` at the call
 * site is unchanged — only the values behind it may have been edited.
 */
export async function resolveServiceContent(overlay?: CopyOverlay): Promise<ServiceContent> {
  const resolved = overlay ?? (await readCopyOverlay());

  return Object.fromEntries(
    Object.entries(serviceSources).map(([key, value]) => [
      key,
      mergeLocalised(value, `${servicesPrefix}.${key}`, resolved),
    ]),
  ) as ServiceContent;
}

/* ==========================================================================
   The editable field registry

   Walked out of the content at module load, so a string added to en.ts turns
   up in the admin on the next deploy with nothing else to update.
   ========================================================================== */

export const copyNamespaces = [
  'home',
  'about',
  'club',
  'game',
  'work',
  'contact',
  'privacy',
  'global',
] as const;

export type CopyNamespace = (typeof copyNamespaces)[number];

export function isCopyNamespace(value: string): value is CopyNamespace {
  return (copyNamespaces as readonly string[]).includes(value);
}

/**
 * Which content each editor screen owns.
 *
 * `capabilityGroups` and `processSteps` render on both the home page and the
 * about page; they are edited under `home`, and the about screen says so.
 */
const namespaceRoots: Record<CopyNamespace, string[]> = {
  home: ['home', 'services.capabilityGroups', 'services.processSteps'],
  about: ['about'],
  club: [
    'club',
    'services.clubServices',
    'services.clubSeasonWorkflow',
    'services.clubMatchweekCalendar',
  ],
  game: [
    'game',
    'services.gameServices',
    'services.gameEventJourney',
    'services.gameDeliverablesBoard',
  ],
  work: ['work', 'project'],
  contact: ['contact'],
  privacy: ['privacy'],
  global: ['nav', 'common', 'footer', 'notFound', 'a11y'],
};

const allFields: CopyField[] = [
  ...flattenDictionaries(en, zhHK),
  ...Object.entries(serviceSources).flatMap(([key, value]) =>
    flattenLocalised(value, `${servicesPrefix}.${key}`),
  ),
];

const fieldByPath = new Map(allFields.map((field) => [field.path, field]));

function ownedBy(path: string, roots: string[]): boolean {
  return roots.some((root) => path === root || path.startsWith(`${root}.`));
}

/** The code defaults for one editor screen, in content order. */
export function copyFieldsFor(namespace: CopyNamespace): CopyField[] {
  const roots = namespaceRoots[namespace];
  return allFields.filter((field) => ownedBy(field.path, roots));
}

export function copyFieldFor(path: string): CopyField | undefined {
  return fieldByPath.get(path);
}

export function copyNamespaceOwns(namespace: CopyNamespace, path: string): boolean {
  return ownedBy(path, namespaceRoots[namespace]);
}

/** The stored values for one screen, so the editor can show what was changed. */
export function copyValuesFor(
  overlay: CopyOverlay,
  namespace: CopyNamespace,
): Record<Locale, CopyValues> {
  const roots = namespaceRoots[namespace];

  const pick = (values: CopyValues): CopyValues =>
    Object.fromEntries(Object.entries(values).filter(([path]) => ownedBy(path, roots)));

  return {
    en: pick(overlay.values.en ?? {}),
    'zh-hk': pick(overlay.values['zh-hk'] ?? {}),
  };
}

/* ==========================================================================
   Publish history

   A published typo used to be reversible only field by field, and only back
   to what shipped in code — there was no way to say "put it back the way it
   was ten minutes ago". Each publish now files the previous state of that
   screen first.
   ========================================================================== */

export function copyHistoryFor(
  overlay: CopyOverlay,
  namespace: CopyNamespace,
): CopySnapshot[] {
  return overlay.history?.[namespace] ?? [];
}

export function snapshotOf(
  overlay: CopyOverlay,
  namespace: CopyNamespace,
  changed: string[],
): CopySnapshot {
  const values = copyValuesFor(overlay, namespace);

  return {
    id: randomUUID(),
    savedAt: new Date().toISOString(),
    changed,
    values: { en: values.en, 'zh-hk': values['zh-hk'] },
  };
}

/** File a snapshot against a screen, keeping the most recent few. */
export function pushSnapshot(overlay: CopyOverlay, namespace: CopyNamespace, snapshot: CopySnapshot): CopyOverlay {
  const existing = copyHistoryFor(overlay, namespace);

  return {
    ...overlay,
    history: {
      ...(overlay.history ?? {}),
      [namespace]: [snapshot, ...existing].slice(0, copyHistoryLimit),
    },
  };
}

/**
 * Replace one screen's stored copy wholesale.
 *
 * Paths belonging to other screens are untouched, so restoring the About
 * page cannot disturb the footer.
 */
export function replaceNamespaceValues(
  overlay: CopyOverlay,
  namespace: CopyNamespace,
  values: Record<Locale, CopyValues>,
): CopyOverlay {
  const roots = namespaceRoots[namespace];

  const rebuild = (current: CopyValues, replacement: CopyValues): CopyValues => {
    const kept = Object.fromEntries(
      Object.entries(current).filter(([path]) => !ownedBy(path, roots)),
    );
    return { ...kept, ...replacement };
  };

  return {
    ...overlay,
    values: {
      en: rebuild(overlay.values.en ?? {}, values.en),
      'zh-hk': rebuild(overlay.values['zh-hk'] ?? {}, values['zh-hk']),
    },
  };
}
