import type { MetadataRoute } from 'next';
import { resolveBrand, resolveSite } from '@/lib/site-content';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await resolveSite();
  const brand = await resolveBrand();

  /* An uploaded mark replaces the one that ships in public/brand. */
  const markSrc = brand.markUrl ?? '/brand/tap-in-mark.svg';

  /* Uploads keep their original format, so the MIME type is read back off the
     stored name rather than assumed to be SVG. */
  const markType =
    {
      svg: 'image/svg+xml',
      png: 'image/png',
      webp: 'image/webp',
      jpg: 'image/jpeg',
      avif: 'image/avif',
    }[markSrc.split('.').pop()?.toLowerCase() ?? ''] ?? undefined;

  return {
    name: `${site.name} — ${site.tagline.en}`,
    short_name: site.name,
    description: site.tagline.en,
    start_url: '/en',
    display: 'standalone',
    background_color: '#070A0D',
    theme_color: '#070A0D',
    lang: 'en',
    categories: ['sports', 'business', 'photography'],
    icons: [
      { src: markSrc, sizes: 'any', type: markType, purpose: 'any' },
      // The mark is drawn with generous padding, so it survives masking.
      { src: markSrc, sizes: 'any', type: markType, purpose: 'maskable' },
    ],
  };
}
