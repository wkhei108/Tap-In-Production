import { z } from 'zod';

import { locales, type Locale } from './i18n';

/* ==========================================================================
   Copy overlays.

   `src/content/en.ts`, `zh-hk.ts` and `services.ts` stay the source of truth
   for everything that shipped with the build. This file describes what the
   admin tool may say on top of them.

   The overlay is *sparse* and keyed by dot path — `home.hero.headlineA`,
   `services.clubServices.0.summary` — and only the strings someone actually
   edited are stored. That is the whole design:

   - copy fixed in code still reaches every key nobody has touched;
   - copy added in code shows up in the tool automatically, because the field
     list is walked out of the content rather than hand-maintained;
   - values are replaced, keys never are, so `work.filters` cannot drift out
     of sync with `workFilters` in projects.ts and `contact.validation.*`
     keeps feeding the Zod messages in contact-schema.ts.
   ========================================================================== */

/** Every editable leaf is either one string or a list of strings. */
export const copyValueSchema = z.union([
  z.string().max(4000),
  z.array(z.string().max(1000)).max(60),
]);

export type CopyValue = z.infer<typeof copyValueSchema>;
export type CopyKind = 'string' | 'string[]';

/** Stored values for one locale, keyed by path. */
export const copyValuesSchema = z.record(z.string(), copyValueSchema);
export type CopyValues = z.infer<typeof copyValuesSchema>;

/**
 * The whole overlay, read once per render.
 *
 * Untrusted input — it comes back from object storage — so it is parsed, not
 * cast. Both locale buckets default to `{}` so an overlay written before a
 * locale existed still parses.
 */
export const copyOverlaySchema = z.object({
  version: z.literal(1),
  values: z.object({
    en: copyValuesSchema.default({}),
    'zh-hk': copyValuesSchema.default({}),
  }),
});

export type CopyOverlay = z.infer<typeof copyOverlaySchema>;

export const emptyCopyOverlay = (): CopyOverlay => ({
  version: 1,
  values: { en: {}, 'zh-hk': {} },
});

/* ==========================================================================
   Shape guards
   ========================================================================== */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** A `Localised` leaf from services.ts / site.ts: `{ en, 'zh-hk' }`. */
function isLocalisedLeaf(value: unknown): value is Record<Locale, CopyValue> {
  if (!isPlainObject(value)) return false;

  const keys = Object.keys(value);
  if (keys.length !== locales.length) return false;
  if (!locales.every((locale) => keys.includes(locale))) return false;

  const [first, ...rest] = locales.map((locale) => value[locale]);
  if (typeof first === 'string') return rest.every((item) => typeof item === 'string');
  if (isStringArray(first)) return rest.every(isStringArray);
  return false;
}

export function kindOf(value: CopyValue): CopyKind {
  return typeof value === 'string' ? 'string' : 'string[]';
}

/* ==========================================================================
   Walking content into editable fields

   Two content shapes exist in this codebase and both end up as the same flat
   `CopyField[]`, so the admin editor only has to understand one thing:

   - the dictionaries put the locale at the *file* level (en.ts / zh-hk.ts);
   - services.ts and site.ts put it at the *leaf* (`{ en, 'zh-hk' }`).
   ========================================================================== */

export type CopyField = {
  path: string;
  en: CopyValue;
  zh: CopyValue;
  kind: CopyKind;
};

/**
 * Walk the two dictionaries in step, emitting one field per leaf.
 *
 * `zh-hk.ts` is typed as `typeof en`, so the structures match by construction;
 * a leaf missing on the Chinese side is still tolerated rather than throwing.
 */
export function flattenDictionaries(en: unknown, zh: unknown, prefix = ''): CopyField[] {
  const fields: CopyField[] = [];

  const walk = (enValue: unknown, zhValue: unknown, path: string) => {
    if (typeof enValue === 'string') {
      fields.push({
        path,
        en: enValue,
        zh: typeof zhValue === 'string' ? zhValue : '',
        kind: 'string',
      });
      return;
    }

    if (isStringArray(enValue)) {
      fields.push({
        path,
        en: [...enValue],
        zh: isStringArray(zhValue) ? [...zhValue] : [],
        kind: 'string[]',
      });
      return;
    }

    if (Array.isArray(enValue)) {
      enValue.forEach((item, index) => {
        const zhItem = Array.isArray(zhValue) ? zhValue[index] : undefined;
        walk(item, zhItem, path ? `${path}.${index}` : String(index));
      });
      return;
    }

    if (isPlainObject(enValue)) {
      for (const [key, child] of Object.entries(enValue)) {
        const zhChild = isPlainObject(zhValue) ? zhValue[key] : undefined;
        walk(child, zhChild, path ? `${path}.${key}` : key);
      }
    }

    /* Numbers, booleans and nullish values are not copy — skipped. */
  };

  walk(en, zh, prefix);
  return fields;
}

/**
 * Walk content whose leaves are `Localised`, emitting one field per leaf.
 *
 * Plain strings inside these structures — `id`, `number` — are structural
 * (anchor targets, substitution-board numbering) and are deliberately not
 * editable, so only `Localised` leaves are picked up.
 */
export function flattenLocalised(source: unknown, prefix: string): CopyField[] {
  const fields: CopyField[] = [];

  const walk = (value: unknown, path: string) => {
    if (isLocalisedLeaf(value)) {
      const en = value.en;
      const zh = value['zh-hk'];
      fields.push({
        path,
        en: typeof en === 'string' ? en : [...en],
        zh: typeof zh === 'string' ? zh : [...zh],
        kind: kindOf(en),
      });
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, path ? `${path}.${index}` : String(index)));
      return;
    }

    if (isPlainObject(value)) {
      for (const [key, child] of Object.entries(value)) {
        walk(child, path ? `${path}.${key}` : key);
      }
    }
  };

  walk(source, prefix);
  return fields;
}

/* ==========================================================================
   Merging an overlay back over the content
   ========================================================================== */

function readSegment(container: unknown, segment: string): unknown {
  if (Array.isArray(container)) {
    const index = Number(segment);
    return Number.isInteger(index) ? (container as unknown[])[index] : undefined;
  }
  if (isPlainObject(container)) return container[segment];
  return undefined;
}

function writeSegment(container: unknown, segment: string, value: CopyValue): void {
  if (Array.isArray(container)) {
    const index = Number(segment);
    const target = container as unknown[];
    if (Number.isInteger(index) && index >= 0 && index < target.length) target[index] = value;
    return;
  }
  if (isPlainObject(container)) container[segment] = value;
}

/** Navigate to a path's parent, or `undefined` if the path no longer exists. */
function parentOf(root: unknown, segments: string[]): unknown {
  let cursor: unknown = root;
  for (const segment of segments) {
    cursor = readSegment(cursor, segment);
    if (cursor === undefined || cursor === null) return undefined;
  }
  return cursor;
}

/**
 * Apply one stored value, but only where it still fits.
 *
 * A path that no longer resolves, or that now points at a different kind of
 * leaf, is dropped rather than written. That is what makes a stale overlay
 * harmless after a content refactor: the merged object is still guaranteed to
 * satisfy `Dictionary`, and the worst case is that an old edit stops applying.
 */
function applyLeaf(root: unknown, path: string, value: CopyValue, side?: Locale): boolean {
  const segments = path.split('.');
  const last = segments.pop();
  if (!last) return false;

  const parent = parentOf(root, segments);
  if (parent === undefined) return false;

  const current = readSegment(parent, last);

  if (side) {
    /* Localised leaf: replace one language inside `{ en, 'zh-hk' }`. */
    if (!isLocalisedLeaf(current)) return false;
    if (kindOf(current[side]) !== kindOf(value)) return false;
    writeSegment(current, side, typeof value === 'string' ? value : [...value]);
    return true;
  }

  if (typeof current === 'string') {
    if (typeof value !== 'string') return false;
    writeSegment(parent, last, value);
    return true;
  }

  if (isStringArray(current)) {
    if (!isStringArray(value)) return false;
    writeSegment(parent, last, [...value]);
    return true;
  }

  return false;
}

/** Apply a locale's stored values over a dictionary-shaped structure. */
export function mergeDictionary<T>(base: T, values: CopyValues | undefined): T {
  if (!values) return base;

  const paths = Object.keys(values);
  if (paths.length === 0) return base;

  const next = structuredClone(base);
  for (const path of paths) {
    const value = values[path];
    if (value !== undefined) applyLeaf(next, path, value);
  }
  return next;
}

/** Apply both locales' stored values over content with `Localised` leaves. */
export function mergeLocalised<T>(base: T, prefix: string, overlay: CopyOverlay | undefined): T {
  if (!overlay) return base;

  const head = `${prefix}.`;
  const relevant = locales.flatMap((locale) =>
    Object.keys(overlay.values[locale] ?? {})
      .filter((path) => path.startsWith(head))
      .map((path) => ({ locale, path })),
  );

  if (relevant.length === 0) return base;

  const next = structuredClone(base);
  for (const { locale, path } of relevant) {
    const value = overlay.values[locale]?.[path];
    if (value !== undefined) applyLeaf(next, path.slice(head.length), value, locale);
  }
  return next;
}

/* ==========================================================================
   Admin payload
   ========================================================================== */

/**
 * One namespace's worth of edits, sent as the complete set the tool is
 * showing. The route diffs each entry against the code default and stores
 * only what actually differs, which is what keeps the overlay sparse without
 * the client having to track dirty state per field.
 */
export const copySaveSchema = z.object({
  namespace: z.string().trim().min(1).max(40),
  entries: z
    .array(
      z.object({
        path: z.string().trim().min(1).max(300),
        en: copyValueSchema,
        zh: copyValueSchema,
      }),
    )
    .max(1200),
});

export type CopySaveValues = z.infer<typeof copySaveSchema>;

/** Deep equality for copy values only — strings and flat string arrays. */
export function sameCopyValue(a: CopyValue, b: CopyValue): boolean {
  if (typeof a === 'string' || typeof b === 'string') return a === b;
  return a.length === b.length && a.every((item, index) => item === b[index]);
}
