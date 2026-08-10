/**
 * Central site configuration.
 *
 * Everything that identifies TAP IN. lives here — do not hard-code the
 * company name, email, handle or URL anywhere else in the codebase.
 */

export const site = {
  /** Always uppercase, always with the final full stop. */
  name: 'TAP IN.',
  legalName: 'TAP IN.',
  tagline: {
    en: 'Hong Kong Football Production & Consultancy',
    'zh-hk': '香港足球製作及顧問團隊',
  },
  email: 'tap.in.enquiry@gmail.com',
  instagramHandle: '@tap_in_official',
  instagramUrl: 'https://www.instagram.com/tap_in_official/',
  areaServed: 'Hong Kong',

  /**
   * Canonical origin. Override per-environment with NEXT_PUBLIC_SITE_URL —
   * the production domain has not been supplied yet (see
   * docs/client-input-needed.md).
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tapin.hk').replace(/\/$/, ''),

  /**
   * Optional channels. Leave blank and the UI simply omits them — nothing
   * renders a dead link.
   */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID ?? '',

  /** Shown on the closing footer band. */
  signOff: 'BUILD THE CLUB. BUILD THE GAME.',
} as const;

export const socialLinks = [
  { key: 'instagram', label: site.instagramHandle, href: site.instagramUrl, external: true },
  { key: 'email', label: site.email, href: `mailto:${site.email}`, external: true },
] as const;

/**
 * Route segments are identical in both locales, which is what lets the
 * language switcher swap only the locale prefix and keep the visitor on the
 * same page (including a project slug).
 */
export const routes = {
  home: '',
  buildAClub: 'build-a-club',
  buildAGame: 'build-a-game',
  work: 'work',
  about: 'about',
  contact: 'contact',
  privacy: 'privacy',
} as const;

export type RouteKey = keyof typeof routes;

/** Order of the primary navigation, left to right. */
export const primaryNav: RouteKey[] = ['work', 'buildAClub', 'buildAGame', 'about', 'contact'];

/** Footer sitemap column. */
export const footerNav: RouteKey[] = [
  'work',
  'buildAClub',
  'buildAGame',
  'about',
  'contact',
  'privacy',
];
