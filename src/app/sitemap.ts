import type { MetadataRoute } from 'next';
import { site } from '@/content/site';
import { getAllProjects } from '@/content/projects';
import {
  absoluteUrl,
  languageAlternates,
  locales,
  pathFor,
  type Locale,
} from '@/lib/i18n';
import type { RouteKey } from '@/content/site';

/**
 * Every page in both locales, each entry carrying its `alternates.languages`
 * map so search engines see the pairing explicitly.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: Array<{ key: RouteKey; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = [
    { key: 'home', priority: 1, changeFrequency: 'weekly' },
    { key: 'buildAClub', priority: 0.9, changeFrequency: 'monthly' },
    { key: 'buildAGame', priority: 0.9, changeFrequency: 'monthly' },
    { key: 'work', priority: 0.8, changeFrequency: 'weekly' },
    { key: 'about', priority: 0.7, changeFrequency: 'monthly' },
    { key: 'contact', priority: 0.8, changeFrequency: 'monthly' },
    { key: 'privacy', priority: 0.3, changeFrequency: 'yearly' },
  ];

  const pages: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of staticRoutes) {
      pages.push({
        url: absoluteUrl(site.url, pathFor(locale, route.key)),
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: languageAlternates(site.url, (l: Locale) => pathFor(l, route.key)),
        },
      });
    }

    for (const project of getAllProjects()) {
      pages.push({
        url: absoluteUrl(site.url, pathFor(locale, 'work', project.slug)),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: {
          languages: languageAlternates(site.url, (l: Locale) =>
            pathFor(l, 'work', project.slug),
          ),
        },
      });
    }
  }

  return pages;
}
