import { describe, expect, it } from 'vitest';
import {
  isLocale,
  languageAlternates,
  localeFromPath,
  localeMeta,
  locales,
  pathFor,
  switchLocalePath,
} from '@/lib/i18n';
import { getDictionary } from '@/content/dictionaries';
import { en } from '@/content/en';
import { zhHK } from '@/content/zh-hk';

describe('locale routing', () => {
  it('recognises supported locales only', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('zh-hk')).toBe(true);
    expect(isLocale('zh-cn')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('builds locale-prefixed paths', () => {
    expect(pathFor('en', 'home')).toBe('/en');
    expect(pathFor('zh-hk', 'work')).toBe('/zh-hk/work');
    expect(pathFor('en', 'work', 'matchday-media-campaign')).toBe(
      '/en/work/matchday-media-campaign',
    );
    expect(pathFor('zh-hk', 'buildAClub')).toBe('/zh-hk/build-a-club');
  });

  it('keeps the visitor on the same page when switching language', () => {
    expect(switchLocalePath('/en/work', 'zh-hk')).toBe('/zh-hk/work');
    expect(switchLocalePath('/zh-hk/build-a-game', 'en')).toBe('/en/build-a-game');
    expect(switchLocalePath('/en', 'zh-hk')).toBe('/zh-hk');
    expect(switchLocalePath('/', 'zh-hk')).toBe('/zh-hk');
  });

  it('preserves the project slug on a case study', () => {
    expect(switchLocalePath('/en/work/invitational-cup-production', 'zh-hk')).toBe(
      '/zh-hk/work/invitational-cup-production',
    );
  });

  it('adds a prefix to an unprefixed path', () => {
    expect(switchLocalePath('/work/some-project', 'en')).toBe('/en/work/some-project');
  });

  it('reads the locale back out of a path', () => {
    expect(localeFromPath('/zh-hk/about')).toBe('zh-hk');
    expect(localeFromPath('/en')).toBe('en');
    expect(localeFromPath('/unknown')).toBe('en');
  });

  it('emits hreflang alternates for every locale plus x-default', () => {
    const alternates = languageAlternates('https://example.com', (l) => pathFor(l, 'work'));

    expect(alternates).toEqual({
      en: 'https://example.com/en/work',
      'zh-Hant-HK': 'https://example.com/zh-hk/work',
      'x-default': 'https://example.com/en/work',
    });
  });

  it('uses the correct html lang for each locale', () => {
    expect(localeMeta.en.htmlLang).toBe('en');
    expect(localeMeta['zh-hk'].htmlLang).toBe('zh-Hant-HK');
  });
});

describe('dictionaries', () => {
  it('returns the right dictionary per locale', () => {
    expect(getDictionary('en')).toBe(en);
    expect(getDictionary('zh-hk')).toBe(zhHK);
  });

  it('covers every locale', () => {
    for (const locale of locales) {
      expect(getDictionary(locale)).toBeTruthy();
    }
  });

  /**
   * TypeScript already enforces key parity (zh-hk.ts is typed as the English
   * dictionary). This guards the thing types cannot: a key that was copied
   * across but never actually translated.
   */
  it('has no English strings left in the Chinese dictionary', () => {
    const untranslated: string[] = [];

    const walk = (a: unknown, b: unknown, path: string) => {
      if (typeof a === 'string' && typeof b === 'string') {
        // Brand marks and platform names are intentionally identical.
        const allowed = [
          'TAP IN.',
          'BUILD-A-CLUB',
          'BUILD-A-GAME',
          'Instagram',
          'WhatsApp',
          '404',
        ];
        if (a === b && !allowed.includes(a)) untranslated.push(`${path}: "${a}"`);
        return;
      }
      if (Array.isArray(a) && Array.isArray(b)) {
        a.forEach((item, i) => walk(item, b[i], `${path}[${i}]`));
        return;
      }
      if (a && b && typeof a === 'object' && typeof b === 'object') {
        for (const key of Object.keys(a)) {
          walk(
            (a as Record<string, unknown>)[key],
            (b as Record<string, unknown>)[key],
            path ? `${path}.${key}` : key,
          );
        }
      }
    };

    walk(en, zhHK, '');
    expect(untranslated).toEqual([]);
  });
});
