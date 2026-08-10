import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The enquiry endpoint has nothing to index.
        disallow: ['/api/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
