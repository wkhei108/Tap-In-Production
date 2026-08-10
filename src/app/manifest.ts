import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline.en}`,
    short_name: 'TAP IN.',
    description: site.tagline.en,
    start_url: '/en',
    display: 'standalone',
    background_color: '#070A0D',
    theme_color: '#070A0D',
    lang: 'en',
    categories: ['sports', 'business', 'photography'],
    icons: [
      {
        src: '/brand/tap-in-mark.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        // The mark is drawn with generous padding, so it survives masking.
        src: '/brand/tap-in-mark.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
