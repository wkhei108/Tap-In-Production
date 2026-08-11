/* ==========================================================================
   Turning dot paths into something an editor can read.

   The admin's field list is walked out of the content rather than typed by
   hand, so the labels have to be derived too. `home.hero.headlineLineOne`
   becomes "Home · Hero" / "Headline line one" with no registry to maintain —
   and the handful of segments that read badly get an override below.

   Deliberately free of imports: this runs in the browser, where the content
   resolver and the blob client must not be pulled in.
   ========================================================================== */

/** Segments whose derived label would be jargon, an acronym, or plain wrong. */
const overrides: Record<string, string> = {
  a11y: 'Accessibility',
  nav: 'Navigation',
  notFound: '404 page',
  meta: 'Search & social',
  cta: 'Call to action',
  ctaPrimary: 'Primary button',
  ctaSecondary: 'Secondary button',
  primaryCta: 'Primary button',
  secondaryCta: 'Secondary button',
  pov: 'Point of view',
  hongKong: 'Hong Kong',
  zh: 'Chinese',
  faq: 'FAQ',
  seo: 'SEO',
  url: 'URL',
  href: 'Link',
  altText: 'Alt text',
  altTextZh: 'Alt text (Chinese)',
  ok: 'OK',
};

/** `headlineLineOne` → `Headline line one`; `build-a-club` → `Build a club`. */
export function humaniseSegment(segment: string): string {
  const override = overrides[segment];
  if (override) return override;

  const spaced = segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .toLowerCase();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Join path segments into a label, folding list indexes into the word before
 * them: `items.2.title` reads as "Items 3 · Title", not "Items · 3 · Title".
 */
export function labelForSegments(segments: string[]): string {
  const parts: string[] = [];

  for (const segment of segments) {
    if (/^\d+$/.test(segment)) {
      const position = Number(segment) + 1;
      if (parts.length > 0) parts[parts.length - 1] = `${parts[parts.length - 1]} ${position}`;
      else parts.push(`#${position}`);
      continue;
    }

    parts.push(humaniseSegment(segment));
  }

  return parts.join(' · ');
}

/**
 * The group a field belongs to: its path minus the final segment.
 *
 * Everything that sits beside a value ends up together, which lines the
 * editor up with how the copy is actually structured — one card per service,
 * one block per section — without needing to know anything about the content.
 */
export function groupKeyForPath(path: string): string {
  const segments = path.split('.');
  return segments.length > 1 ? segments.slice(0, -1).join('.') : segments[0] ?? path;
}

/** `services` is a storage prefix, not something an editor needs to read. */
export function labelForGroup(groupKey: string): string {
  const segments = groupKey.split('.').filter((segment) => segment !== 'services');
  return labelForSegments(segments) || humaniseSegment(groupKey);
}

/** The field's own label, relative to its group. */
export function labelForField(path: string): string {
  const segments = path.split('.');
  return labelForSegments(segments.slice(-1));
}

/** Long copy wants a textarea; a button label does not. */
export function isLongText(value: string): boolean {
  return value.length > 80 || value.includes('\n');
}
