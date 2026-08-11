// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  copyFieldsFor,
  copyValuesFor,
  isCopyNamespace,
  resolveDictionary,
  resolveServiceContent,
} from '@/lib/copy';
import {
  emptyCopyOverlay,
  flattenDictionaries,
  flattenLocalised,
  mergeDictionary,
  mergeLocalised,
  sameCopyValue,
  type CopyOverlay,
} from '@/lib/copy-schema';
import { en } from '@/content/en';
import { zhHK } from '@/content/zh-hk';
import { clubServices } from '@/content/services';

const overlay = (values: Partial<CopyOverlay['values']>): CopyOverlay => ({
  version: 1,
  values: { en: {}, 'zh-hk': {}, ...values },
});

describe('flattenDictionaries', () => {
  it('emits one field per leaf with both languages side by side', () => {
    const fields = flattenDictionaries(
      { hero: { headline: 'Build the club' } },
      { hero: { headline: '打造球會' } },
    );

    expect(fields).toEqual([
      { path: 'hero.headline', en: 'Build the club', zh: '打造球會', kind: 'string' },
    ]);
  });

  it('treats a list of strings as one editable leaf, not many', () => {
    const fields = flattenDictionaries({ ticker: ['a', 'b'] }, { ticker: ['甲', '乙'] });

    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({ path: 'ticker', kind: 'string[]', en: ['a', 'b'] });
  });

  it('indexes into arrays of objects', () => {
    const fields = flattenDictionaries(
      { items: [{ title: 'One' }, { title: 'Two' }] },
      { items: [{ title: '一' }, { title: '二' }] },
    );

    expect(fields.map((field) => field.path)).toEqual(['items.0.title', 'items.1.title']);
  });

  it('tolerates a leaf missing on the Chinese side rather than throwing', () => {
    const fields = flattenDictionaries({ a: 'one' }, {});
    expect(fields[0]).toMatchObject({ en: 'one', zh: '' });
  });

  it('covers the real dictionaries and keeps the two locales in step', () => {
    const fields = flattenDictionaries(en, zhHK);

    expect(fields.length).toBeGreaterThan(300);
    /* Every leaf must have Chinese copy: the compiler guarantees the shape,
       this guarantees nothing was left as an empty string. */
    expect(fields.filter((field) => field.zh === '' || field.zh.length === 0)).toEqual([]);
  });
});

describe('flattenLocalised', () => {
  it('picks up Localised leaves and skips structural strings', () => {
    const fields = flattenLocalised(
      [{ id: 'social', number: '01', title: { en: 'Social', 'zh-hk': '社交' } }],
      'services.clubServices',
    );

    expect(fields).toEqual([
      {
        path: 'services.clubServices.0.title',
        en: 'Social',
        zh: '社交',
        kind: 'string',
      },
    ]);
  });

  it('handles Localised lists', () => {
    const fields = flattenLocalised(
      [{ items: { en: ['a'], 'zh-hk': ['甲'] } }],
      'services.clubServices',
    );

    expect(fields[0]).toMatchObject({ kind: 'string[]', en: ['a'], zh: ['甲'] });
  });

  it('never exposes an id or number as editable copy', () => {
    const paths = flattenLocalised(clubServices, 'services.clubServices').map((f) => f.path);

    expect(paths.some((path) => path.endsWith('.id'))).toBe(false);
    expect(paths.some((path) => path.endsWith('.number'))).toBe(false);
  });
});

describe('mergeDictionary', () => {
  it('applies a stored value without touching its neighbours', () => {
    const base = { hero: { headline: 'Old', body: 'Kept' } };
    const merged = mergeDictionary(base, { 'hero.headline': 'New' });

    expect(merged).toEqual({ hero: { headline: 'New', body: 'Kept' } });
  });

  it('does not mutate the code default', () => {
    const base = { hero: { headline: 'Old' } };
    mergeDictionary(base, { 'hero.headline': 'New' });

    expect(base.hero.headline).toBe('Old');
  });

  it('replaces a whole list, so bullets can be added and removed', () => {
    const merged = mergeDictionary({ ticker: ['a', 'b'] }, { ticker: ['a', 'b', 'c'] });
    expect(merged.ticker).toEqual(['a', 'b', 'c']);
  });

  it('drops a path that no longer exists', () => {
    const base = { hero: { headline: 'Kept' } };
    const merged = mergeDictionary(base, { 'hero.retired': 'Ignored', 'gone.away': 'Ignored' });

    expect(merged).toEqual({ hero: { headline: 'Kept' } });
  });

  it('drops a value whose kind no longer matches', () => {
    const base = { ticker: ['a'], headline: 'Kept' };
    const merged = mergeDictionary(base, { ticker: 'now a string', headline: ['now a list'] });

    expect(merged).toEqual({ ticker: ['a'], headline: 'Kept' });
  });

  it('returns the base untouched when there is nothing stored', () => {
    const base = { hero: { headline: 'Old' } };
    expect(mergeDictionary(base, {})).toBe(base);
    expect(mergeDictionary(base, undefined)).toBe(base);
  });

  it('keeps the dictionary shape intact so `Dictionary` still holds', () => {
    const merged = mergeDictionary(en, { 'home.hero.headlineLineOne': 'Edited' });

    expect(Object.keys(merged)).toEqual(Object.keys(en));
    expect(merged.home.hero.headlineLineOne).toBe('Edited');
    expect(Object.keys(merged.work.filters)).toEqual(Object.keys(en.work.filters));
  });
});

describe('mergeLocalised', () => {
  it('replaces one language and leaves the other alone', () => {
    const base = [{ id: 'a', title: { en: 'Old', 'zh-hk': '舊' } }];
    const merged = mergeLocalised(base, 'services.clubServices', overlay({
      en: { 'services.clubServices.0.title': 'New' },
    }));

    expect(merged[0]?.title).toEqual({ en: 'New', 'zh-hk': '舊' });
  });

  it('ignores paths belonging to a different prefix', () => {
    const base = [{ title: { en: 'Old', 'zh-hk': '舊' } }];
    const merged = mergeLocalised(base, 'services.clubServices', overlay({
      en: { 'services.gameServices.0.title': 'Other' },
    }));

    expect(merged[0]?.title.en).toBe('Old');
  });

  it('drops a value whose kind no longer matches', () => {
    const base = [{ items: { en: ['a'], 'zh-hk': ['甲'] } }];
    const merged = mergeLocalised(base, 'services.clubServices', overlay({
      en: { 'services.clubServices.0.items': 'no longer a list' },
    }));

    expect(merged[0]?.items.en).toEqual(['a']);
  });
});

describe('the field registry', () => {
  it('splits the content across the editor screens with nothing lost', () => {
    const namespaces = ['home', 'about', 'club', 'game', 'work', 'contact', 'privacy', 'global'] as const;
    const seen = namespaces.flatMap((namespace) => copyFieldsFor(namespace).map((f) => f.path));

    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.length).toBeGreaterThan(300);
  });

  it('routes each screen to the content it owns', () => {
    expect(copyFieldsFor('home').every((f) => f.path.startsWith('home.') || f.path.startsWith('services.'))).toBe(true);
    expect(copyFieldsFor('club').some((f) => f.path.startsWith('services.clubServices.'))).toBe(true);
    expect(copyFieldsFor('club').some((f) => f.path.startsWith('services.gameServices.'))).toBe(false);
    expect(copyFieldsFor('global').some((f) => f.path.startsWith('nav.'))).toBe(true);
  });

  it('never lets a `work` root swallow another key by prefix', () => {
    expect(copyFieldsFor('work').every((f) => f.path.startsWith('work.') || f.path.startsWith('project.'))).toBe(true);
  });

  it('recognises its own namespaces', () => {
    expect(isCopyNamespace('home')).toBe(true);
    expect(isCopyNamespace('nope')).toBe(false);
  });

  it('reports only the stored values belonging to a screen', () => {
    const stored = copyValuesFor(
      overlay({ en: { 'home.hero.headlineLineOne': 'A', 'about.hero.headline': 'B' } }),
      'home',
    );

    expect(Object.keys(stored.en)).toEqual(['home.hero.headlineLineOne']);
  });
});

describe('resolution without storage', () => {
  it('falls back to the code dictionary', async () => {
    const dict = await resolveDictionary('en', emptyCopyOverlay());
    expect(dict.home.hero.headlineLineOne).toBe(en.home.hero.headlineLineOne);
  });

  it('applies an overlay to the dictionary but not across the services boundary', async () => {
    const dict = await resolveDictionary(
      'en',
      overlay({ en: { 'home.hero.headlineLineOne': 'Edited', 'services.clubServices.0.title': 'X' } }),
    );

    expect(dict.home.hero.headlineLineOne).toBe('Edited');
  });

  it('applies an overlay to the service content', async () => {
    const content = await resolveServiceContent(
      overlay({ 'zh-hk': { 'services.clubServices.0.title': '新標題' } }),
    );

    expect(content.clubServices[0]?.title['zh-hk']).toBe('新標題');
    expect(content.clubServices[0]?.title.en).toBe(clubServices[0]?.title.en);
  });
});

describe('sameCopyValue', () => {
  it('compares strings and lists', () => {
    expect(sameCopyValue('a', 'a')).toBe(true);
    expect(sameCopyValue('a', 'b')).toBe(false);
    expect(sameCopyValue(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(sameCopyValue(['a'], ['a', 'b'])).toBe(false);
    expect(sameCopyValue('a', ['a'])).toBe(false);
  });
});
