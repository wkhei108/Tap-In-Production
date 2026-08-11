import type { CopyNamespace } from './copy';
import type { MediaSlotGroup } from './media-slots';

/* ==========================================================================
   The admin's own map.

   One screen per page of the public site, plus the campaign tool and site
   settings. Kept here rather than in the nav component so the route, the
   navigation and the page all agree on what exists.
   ========================================================================== */

export type AdminScreen = {
  /** URL segment under `/admin/pages/`. */
  segment: string;
  href: string;
  label: string;
  /** Which copy this screen owns. */
  namespace: CopyNamespace;
  /** Which image slots it owns, if any. */
  mediaGroup?: MediaSlotGroup;
  /** Shown under the heading, to orient someone who did not build the site. */
  blurb: string;
  /** Extra note about content edited elsewhere. */
  note?: string;
};

export const adminScreens: AdminScreen[] = [
  {
    segment: 'home',
    href: '/admin/pages/home',
    label: 'Home',
    namespace: 'home',
    mediaGroup: 'home',
    blurb: 'The homepage — hero copy, intro, pillars, capabilities and the Instagram rail.',
    note: 'The capability grid and the five-step process also appear on the About page.',
  },
  {
    segment: 'about',
    href: '/admin/pages/about',
    label: 'About',
    namespace: 'about',
    mediaGroup: 'about',
    blurb: 'The About page — point of view, what makes TAP IN. different, and Hong Kong.',
    note: 'The five-step process shown here is edited on the Home screen.',
  },
  {
    segment: 'build-a-club',
    href: '/admin/pages/build-a-club',
    label: 'Build a Club',
    namespace: 'club',
    mediaGroup: 'club',
    blurb: 'The club pillar page — hero, the seven services, season workflow and matchweek board.',
  },
  {
    segment: 'build-a-game',
    href: '/admin/pages/build-a-game',
    label: 'Build a Game',
    namespace: 'game',
    mediaGroup: 'game',
    blurb: 'The event pillar page — hero, the eight services, event journey and deliverables board.',
  },
  {
    segment: 'work',
    href: '/admin/pages/work',
    label: 'Work',
    namespace: 'work',
    blurb: 'The work index and the shared labels on every case study.',
    note: 'Individual campaigns, their covers and their photos are edited under Campaigns.',
  },
  {
    segment: 'contact',
    href: '/admin/pages/contact',
    label: 'Contact',
    namespace: 'contact',
    blurb: 'The contact page — every form label, dropdown option and validation message.',
  },
  {
    segment: 'privacy',
    href: '/admin/pages/privacy',
    label: 'Privacy',
    namespace: 'privacy',
    blurb: 'The privacy policy.',
  },
  {
    segment: 'global',
    href: '/admin/pages/global',
    label: 'Navigation & footer',
    namespace: 'global',
    blurb: 'Copy that appears on every page — navigation, footer, buttons, gallery chrome and the 404.',
  },
];

const screenBySegment = new Map(adminScreens.map((screen) => [screen.segment, screen]));

export function adminScreenFor(segment: string): AdminScreen | undefined {
  return screenBySegment.get(segment);
}

/** Every destination in the admin nav, in order. */
export const adminNav: Array<{ href: string; label: string }> = [
  { href: '/admin', label: 'Campaigns' },
  ...adminScreens.map((screen) => ({ href: screen.href, label: screen.label })),
  { href: '/admin/settings', label: 'Settings' },
];
