import type { Metadata } from 'next';
import { site } from '@/content/site';
import { getDictionary } from '@/content/dictionaries';
import {
  absoluteUrl,
  languageAlternates,
  localeMeta,
  locales,
  type Locale,
} from './i18n';

type BuildMetadataArgs = {
  locale: Locale;
  title: string;
  description: string;
  /** Path for this page in the given locale, e.g. `/en/work`. */
  path: string;
  /** Same page in every other locale — used for hreflang. */
  pathForLocale: (locale: Locale) => string;
  /** Defaults to the locale's generated OG image. */
  ogImage?: string;
  /** Absolute-titled pages (the homepage) opt out of the `| TAP IN.` suffix. */
  absoluteTitle?: boolean;
};

export function buildMetadata({
  locale,
  title,
  description,
  path,
  pathForLocale,
  ogImage,
  absoluteTitle = false,
}: BuildMetadataArgs): Metadata {
  const url = absoluteUrl(site.url, path);
  const image = ogImage ?? absoluteUrl(site.url, `/${locale}/opengraph-image`);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(site.url, pathForLocale),
    },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title,
      description,
      url,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => localeMeta[l].ogLocale),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Organisation / ProfessionalService structured data.
 *
 * Deliberately limited to facts TAP IN. has supplied — no street address,
 * telephone, founding date or opening hours are invented here.
 */
export function organisationJsonLd(locale: Locale) {
  const dict = getDictionary(locale);

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${site.url}/#organisation`,
    name: site.name,
    alternateName: 'TAP IN',
    url: absoluteUrl(site.url, `/${locale}`),
    email: site.email,
    description: dict.home.meta.description,
    slogan: site.signOff,
    areaServed: {
      '@type': 'Place',
      name: site.areaServed,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Hong Kong',
      addressCountry: 'HK',
    },
    knowsLanguage: ['en', 'zh-Hant-HK'],
    sameAs: [site.instagramUrl],
    makesOffer: [
      'Social media strategy and management',
      'Match photography',
      'Match video production',
      'Player and team photoshoots',
      'Football branding and graphic design',
      'Season-long content production',
      'Sponsorship content and promotional assets',
      'Football event and tournament production',
    ].map((name) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name },
    })),
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: absoluteUrl(site.url, `/${locale}`),
    name: site.name,
    inLanguage: localeMeta[locale].hrefLang,
    publisher: { '@id': `${site.url}/#organisation` },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(site.url, item.path),
    })),
  };
}
