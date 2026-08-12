import { randomUUID } from 'node:crypto';

import type { MediaVersion, SiteIndex } from './campaign-schema';

/* ==========================================================================
   Version history for uploaded images.

   Every image the tool manages — page slots, the Instagram rail, brand
   artwork — shares one log, so "put the old one back" works the same way
   wherever you are.

   The cap is what makes this safe to leave on: six versions per slot is
   enough to undo a bad afternoon, and old files are only deleted once they
   fall past it.
   ========================================================================== */

export const historyLimit = 6;

export type MediaScope = 'page' | 'social' | 'brand';

const scopes: MediaScope[] = ['page', 'social', 'brand'];

export function historyKey(scope: MediaScope, id: string): string {
  return `${scope}:${id}`;
}

export function parseHistoryKey(key: string): { scope: MediaScope; id: string } | null {
  const separator = key.indexOf(':');
  if (separator < 1) return null;

  const scope = key.slice(0, separator);
  const id = key.slice(separator + 1);
  if (!id || !scopes.includes(scope as MediaScope)) return null;

  return { scope: scope as MediaScope, id };
}

export function readHistory(index: SiteIndex, key: string): MediaVersion[] {
  return index.mediaHistory?.[key] ?? [];
}

export function newVersion(
  fields: Omit<MediaVersion, 'id' | 'replacedAt' | 'reason'> &
    Partial<Pick<MediaVersion, 'reason'>>,
): MediaVersion {
  return {
    ...fields,
    id: randomUUID(),
    replacedAt: new Date().toISOString(),
    reason: fields.reason ?? 'replaced',
  };
}

/**
 * Add a version to a slot's log, newest first.
 *
 * Returns the trimmed index alongside the URLs that fell past the cap, so
 * the caller can delete exactly those files and nothing else. A URL still
 * referenced elsewhere in the log is never reported — restoring a version
 * leaves the same file in two places for a moment.
 */
export function pushVersion(
  index: SiteIndex,
  key: string,
  version: MediaVersion,
): { index: SiteIndex; expired: string[] } {
  const existing = readHistory(index, key);
  const next = [version, ...existing];
  const kept = next.slice(0, historyLimit);
  const dropped = next.slice(historyLimit);

  const stillReferenced = new Set(kept.map((entry) => entry.url));
  const expired = dropped
    .map((entry) => entry.url)
    .filter((url) => !stillReferenced.has(url));

  return {
    index: { ...index, mediaHistory: { ...(index.mediaHistory ?? {}), [key]: kept } },
    expired,
  };
}

/** Drop one entry from a log — used when a version becomes current again. */
export function removeVersion(index: SiteIndex, key: string, versionId: string): SiteIndex {
  const remaining = readHistory(index, key).filter((entry) => entry.id !== versionId);
  const history = { ...(index.mediaHistory ?? {}) };

  if (remaining.length > 0) history[key] = remaining;
  else delete history[key];

  return { ...index, mediaHistory: history };
}

export function findVersion(
  index: SiteIndex,
  key: string,
  versionId: string,
): MediaVersion | undefined {
  return readHistory(index, key).find((entry) => entry.id === versionId);
}
