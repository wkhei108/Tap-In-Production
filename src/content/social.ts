import { site } from './site';
import type { Localised } from './services';
import type { MediaAspect } from './projects';

export type SocialPost = {
  id: string;
  /** Deep link to the individual post once TAP IN. supplies the URLs. */
  href: string;
  /** Path under /public/media/social. Undefined renders a branded panel. */
  image?: string;
  aspect: MediaAspect;
  altText: string;
  altTextZh: string;
  caption?: Localised;
};

/**
 * Curated Instagram rail.
 *
 * Local data on purpose — there is no scraping and no Instagram embed script.
 * TAP IN. chooses which posts appear by editing this list, so the grid stays
 * fast, stable and under editorial control.
 *
 * To publish: export the image from the original post (not a screenshot of the
 * Instagram interface), save it to `public/media/social/`, set `image`, and
 * point `href` at the post URL.
 */
export const socialPosts: SocialPost[] = [
  {
    id: 'post-01',
    href: site.instagramUrl,
    aspect: 'portrait',
    altText: 'Placeholder for a recent TAP IN. Instagram post — matchday photography.',
    altTextZh: 'TAP IN. 近期 Instagram 帖文位置 — 比賽日攝影。',
    caption: { en: 'Matchday', 'zh-hk': '比賽日' },
  },
  {
    id: 'post-02',
    href: site.instagramUrl,
    aspect: 'square',
    altText: 'Placeholder for a recent TAP IN. Instagram post — matchday graphic.',
    altTextZh: 'TAP IN. 近期 Instagram 帖文位置 — 比賽日圖像。',
    caption: { en: 'Graphics', 'zh-hk': '設計圖像' },
  },
  {
    id: 'post-03',
    href: site.instagramUrl,
    aspect: 'portrait',
    altText: 'Placeholder for a recent TAP IN. Instagram post — player portrait.',
    altTextZh: 'TAP IN. 近期 Instagram 帖文位置 — 球員形象照。',
    caption: { en: 'Portraits', 'zh-hk': '形象拍攝' },
  },
  {
    id: 'post-04',
    href: site.instagramUrl,
    aspect: 'square',
    altText: 'Placeholder for a recent TAP IN. Instagram post — event production.',
    altTextZh: 'TAP IN. 近期 Instagram 帖文位置 — 賽事製作。',
    caption: { en: 'Events', 'zh-hk': '賽事' },
  },
  {
    id: 'post-05',
    href: site.instagramUrl,
    aspect: 'portrait',
    altText: 'Placeholder for a recent TAP IN. Instagram post — short-form video still.',
    altTextZh: 'TAP IN. 近期 Instagram 帖文位置 — 短片截圖。',
    caption: { en: 'Short-form', 'zh-hk': '短片' },
  },
];
