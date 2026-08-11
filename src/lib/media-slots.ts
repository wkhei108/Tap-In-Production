import { clubServices, gameServices, type ServiceDetail } from '@/content/services';
import type { MediaAspect } from '@/content/projects';

/* ==========================================================================
   Page media slots.

   The layouts reserve a fixed set of image positions — two on the home intro,
   two on About, and one beside every service on each pillar page. Each one is
   named here so the admin tool can offer it, and so the page can ask for the
   same key when it renders.

   Slots are derived from the service list rather than typed out, so adding a
   service in `services.ts` brings its image slot with it.
   ========================================================================== */

export type MediaSlotGroup = 'home' | 'about' | 'club' | 'game';

export type MediaSlotDefinition = {
  key: string;
  group: MediaSlotGroup;
  /** Shown as the field heading in the admin. */
  label: string;
  /** Where on the page it sits, for operators who do not know the layout. */
  hint: string;
  /** The crop the layout expects. Uploads are processed to this ratio. */
  aspect: MediaAspect;
};

/**
 * `ServiceSections` alternates the crop down the page, so the slot has to
 * agree with the layout or the column would jump when a photo lands.
 */
export function serviceSlotAspect(index: number): MediaAspect {
  return index % 3 === 1 ? 'portrait' : 'landscape';
}

function serviceSlots(
  services: ServiceDetail[],
  group: Extract<MediaSlotGroup, 'club' | 'game'>,
): MediaSlotDefinition[] {
  return services.map((service, index) => ({
    key: `services.${group}.${service.id}`,
    group,
    label: `${service.number} · ${service.title.en}`,
    hint: 'Beside the service copy',
    aspect: serviceSlotAspect(index),
  }));
}

export const mediaSlots: MediaSlotDefinition[] = [
  {
    key: 'home.intro.primary',
    group: 'home',
    label: 'Intro — large frame',
    hint: 'The wide image in the “Our view” section',
    aspect: 'landscape',
  },
  {
    key: 'home.intro.secondary',
    group: 'home',
    label: 'Intro — overlapping frame',
    hint: 'The smaller portrait image that overlaps the wide one',
    aspect: 'portrait',
  },
  {
    key: 'about.pov',
    group: 'about',
    label: 'Point of view',
    hint: 'Beside the opening “Our view” copy',
    aspect: 'landscape',
  },
  {
    key: 'about.hongKong',
    group: 'about',
    label: 'Hong Kong football',
    hint: 'Beside the Hong Kong section',
    aspect: 'portrait',
  },
  ...serviceSlots(clubServices, 'club'),
  ...serviceSlots(gameServices, 'game'),
];

const slotByKey = new Map(mediaSlots.map((slot) => [slot.key, slot]));

export function mediaSlotsFor(group: MediaSlotGroup): MediaSlotDefinition[] {
  return mediaSlots.filter((slot) => slot.group === group);
}

export function mediaSlotFor(key: string): MediaSlotDefinition | undefined {
  return slotByKey.get(key);
}

export function isMediaSlot(key: string): boolean {
  return slotByKey.has(key);
}
