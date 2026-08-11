import type { MetadataRoute } from 'next';
import { resolveBrand, resolveSite } from '@/lib/site-content';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await resolveSite();
  const brand = await resolveBrand();

  /* An uploaded mark replaces the one that ships in public/brand. */
  const markSrc = brand.markUrl ?? '/brand/tap-in-mark.svg';
  const markType = brand.markUrl ? undefined : 'image/svg+xml';

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
