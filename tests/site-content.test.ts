// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  groupKeyForPath,
  humaniseSegment,
  isLongText,
  labelForField,
  labelForGroup,
} from '@/lib/copy-labels';
import {
  isMediaSlot,
  mediaSlotFor,
  mediaSlots,
  mediaSlotsFor,
  serviceSlotAspect,
  slotFrameProps,
} from '@/lib/media-slots';
import { mergeSite, mergeSocialPosts, resolvedSocialLinks } from '@/lib/site-content';
import { emptySiteIndex, type SiteIndex } from '@/lib/campaign-schema';
import { site } from '@/content/site';
import { socialPosts } from '@/content/social';
import { clubServices, gameServices } from '@/content/services';

const index = (extra: Partial<SiteIndex> = {}): SiteIndex => ({ ...emptySiteIndex(), ...extra });

describe('copy labels', () => {
  it('turns a segment into words', () => {
    expect(humaniseSegment('headlineLineOne')).toBe('Headline line one');
    expect(humaniseSegment('clubServices')).toBe('Club services');
  });

  it('uses an override where the derived label would be jargon', () => {
    expect(humaniseSegment('a11y')).toBe('Accessibility');
    expect(humaniseSegment('nav')).toBe('Navigation');
    expect(humaniseSegment('notFound')).toBe('404 page');
  });

  it('groups a field with the values that sit beside it', () => {
    expect(groupKeyForPath('home.hero.headlineLineOne')).toBe('home.hero');
    expect(groupKeyForPath('nav.work')).toBe('nav');
    expect(groupKeyForPath('services.clubServices.0.title')).toBe('services.clubServices.0');
  });

  it('folds a list index into the word before it', () => {
    expect(labelForGroup('about.difference.items.2')).toBe('About · Difference · Items 3');
    expect(labelForGroup('services.clubServices.0')).toBe('Club services 1');
  });

  it('labels a field by its own segment', () => {
    expect(labelForField('home.hero.headlineLineOne')).toBe('Headline line one');
  });

  it('sends long copy to a textarea and short copy to an input', () => {
    expect(isLongText('Scroll')).toBe(false);
    expect(isLongText('x'.repeat(120))).toBe(true);
  });
});

describe('media slots', () => {
  it('reserves one slot per service on each pillar page, plus the fixed four', () => {
    expect(mediaSlotsFor('home')).toHaveLength(2);
    expect(mediaSlotsFor('about')).toHaveLength(2);
    expect(mediaSlotsFor('club')).toHaveLength(clubServices.length);
    expect(mediaSlotsFor('game')).toHaveLength(gameServices.length);
    expect(mediaSlots).toHaveLength(4 + clubServices.length + gameServices.length);
  });

  it('keys service slots by their stable id, not their position', () => {
    const first = clubServices[0]!;
    expect(mediaSlotFor(`services.club.${first.id}`)).toBeTruthy();
    expect(isMediaSlot('services.club.not-a-service')).toBe(false);
  });

  it('agrees with the crop the layout alternates to', () => {
    /* ServiceSections uses `index % 3 === 1 ? portrait : landscape`; a slot
       processed to the wrong ratio would make the column jump. */
    expect(serviceSlotAspect(0)).toBe('landscape');
    expect(serviceSlotAspect(1)).toBe('portrait');
    expect(serviceSlotAspect(2)).toBe('landscape');
  });

  it('every slot key is unique', () => {
    const keys = mediaSlots.map((slot) => slot.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('slotFrameProps', () => {
  const fallback = { alt: 'Placeholder wording', aspect: 'landscape' as const };

  it('keeps the reserved ratio and placeholder when nothing is uploaded', () => {
    expect(slotFrameProps(undefined, 'en', fallback)).toEqual({
      alt: 'Placeholder wording',
      aspect: 'landscape',
      note: undefined,
    });
  });

  it('uses the stored image and the alt text for the locale', () => {
    const record = {
      url: 'https://example.public.blob.vercel-storage.com/media/pages/a.webp',
      aspect: 'portrait' as const,
      altText: 'A goalkeeper',
      altTextZh: '守門員',
    };

    expect(slotFrameProps(record, 'zh-hk', fallback)).toMatchObject({
      src: record.url,
      alt: '守門員',
      aspect: 'portrait',
    });
    expect(slotFrameProps(record, 'en', fallback).alt).toBe('A goalkeeper');
  });

  it('shows a stored caption in place of the fallback note', () => {
    const record = {
      url: 'https://example.public.blob.vercel-storage.com/media/pages/a.webp',
      aspect: 'landscape' as const,
      altText: 'Alt',
      altTextZh: '替代',
      caption: { en: 'Matchday', 'zh-hk': '比賽日' },
    };

    expect(slotFrameProps(record, 'en', { ...fallback, note: 'Fallback' }).note).toBe('Matchday');
  });
});

describe('mergeSite', () => {
  it('falls back to what shipped when nothing is stored', () => {
    expect(mergeSite(index())).toMatchObject({ name: site.name, email: site.email });
  });

  it('applies stored settings over the code defaults', () => {
    const merged = mergeSite(index({ settings: { name: 'TAP IN. HK', email: 'hi@example.com' } }));

    expect(merged.name).toBe('TAP IN. HK');
    expect(merged.email).toBe('hi@example.com');
    /* Untouched fields keep shipping from code. */
    expect(merged.instagramUrl).toBe(site.instagramUrl);
  });

  it('never lets the environment-only fields be overridden', () => {
    const merged = mergeSite(index({ settings: { name: 'Edited' } }));
    expect(merged.url).toBe(site.url);
    expect(merged.analyticsId).toBe(site.analyticsId);
  });

  it('builds the shared links from whatever resolved', () => {
    const links = resolvedSocialLinks(mergeSite(index({ settings: { email: 'hi@example.com' } })));
    expect(links[1].href).toBe('mailto:hi@example.com');
  });
});

describe('mergeSocialPosts', () => {
  it('keeps the curated list intact when nothing is stored', () => {
    expect(mergeSocialPosts(index())).toEqual(socialPosts);
  });

  it('overlays only the fields that were set', () => {
    const merged = mergeSocialPosts(
      index({
        socialPosts: {
          'post-01': {
            url: 'https://example.public.blob.vercel-storage.com/media/social/a.webp',
          },
        },
      }),
    );

    expect(merged[0]?.image).toBe(
      'https://example.public.blob.vercel-storage.com/media/social/a.webp',
    );
    /* The alt text nobody edited still comes from code. */
    expect(merged[0]?.altText).toBe(socialPosts[0]?.altText);
    expect(merged).toHaveLength(socialPosts.length);
  });

  it('leaves cards with no record untouched', () => {
    const merged = mergeSocialPosts(index({ socialPosts: { 'post-01': { href: 'https://x.test/p' } } }));
    expect(merged[1]).toEqual(socialPosts[1]);
  });
});
