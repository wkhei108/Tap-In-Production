import { routes, type RouteKey } from '@/content/site';

export const locales = ['en', 'zh-hk'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** `lang` attribute + `hreflang` value for each locale. */
export const localeMeta: Record<
  Locale,
  { htmlLang: string; hrefLang: string; label: string; shortLabel: string; ogLocale: string }
> = {
  en: {
    htmlLang: 'en',
    hrefLang: 'en',
    label: 'English',
    shortLabel: 'EN',
    ogLocale: 'en_HK',
  },
  'zh-hk': {
    htmlLang: 'zh-Hant-HK',
    hrefLang: 'zh-Hant-HK',
    label: '繁體中文',
    shortLabel: '繁',
    ogLocale: 'zh_HK',
  },
};

export function isLocale(value: string | undefined): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Build an in-site path for a locale, e.g. `pathFor('zh-hk', 'work')`. */
export function pathFor(locale: Locale, route: RouteKey, ...segments: string[]): string {
  const base = routes[route];
  const parts = [locale, base, ...segments].filter(Boolean);
  return `/${parts.join('/')}`;
}

/** Absolute URL for canonical tags, sitemaps and JSON-LD. */
export function absoluteUrl(origin: string, path: string): string {
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Swap the locale prefix of the current pathname, keeping the rest of the
 * route intact. This is what preserves the visitor's page — including the
 * project slug on `/en/work/[slug]` — when they switch language.
 */
export function switchLocalePath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return `/${nextLocale}`;

  if (isLocale(segments[0])) {
    segments[0] = nextLocale;
    return `/${segments.join('/')}`;
  }

  return `/${[nextLocale, ...segments].join('/')}`;
}

/** The locale a pathname belongs to, falling back to the default. */
export function localeFromPath(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  return isLocale(first) ? first : defaultLocale;
}

/** `alternates.languages` map for Next.js metadata, incl. x-default. */
export function languageAlternates(
  origin: string,
  build: (locale: Locale) => string,
): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const locale of locales) {
    entries[localeMeta[locale].hrefLang] = absoluteUrl(origin, build(locale));
  }
  entries['x-default'] = absoluteUrl(origin, build(defaultLocale));
  return entries;
}
