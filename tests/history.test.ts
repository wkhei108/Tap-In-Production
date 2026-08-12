// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  findVersion,
  historyKey,
  historyLimit,
  newVersion,
  parseHistoryKey,
  pushVersion,
  readHistory,
  removeVersion,
} from '@/lib/media-history';
import { emptySiteIndex, type MediaVersion, type SiteIndex } from '@/lib/campaign-schema';
import {
  copyHistoryFor,
  copyValuesFor,
  pushSnapshot,
  replaceNamespaceValues,
  snapshotOf,
} from '@/lib/copy';
import { copyHistoryLimit, emptyCopyOverlay, type CopyOverlay } from '@/lib/copy-schema';

const blank = (): SiteIndex => emptySiteIndex();

const version = (url: string): MediaVersion => newVersion({ url });

describe('history keys', () => {
  it('round-trips a scope and an id', () => {
    expect(parseHistoryKey(historyKey('page', 'home.intro.primary'))).toEqual({
      scope: 'page',
      id: 'home.intro.primary',
    });
    expect(parseHistoryKey(historyKey('brand', 'logo'))).toEqual({ scope: 'brand', id: 'logo' });
  });

  it('keeps ids containing a colon intact', () => {
    expect(parseHistoryKey('social:post:01')).toEqual({ scope: 'social', id: 'post:01' });
  });

  it('rejects anything that is not a known scope', () => {
    expect(parseHistoryKey('campaigns:slug')).toBeNull();
    expect(parseHistoryKey('page:')).toBeNull();
    expect(parseHistoryKey(':logo')).toBeNull();
    expect(parseHistoryKey('nonsense')).toBeNull();
  });
});

describe('pushVersion', () => {
  const key = historyKey('brand', 'logo');

  it('files the newest version first', () => {
    const first = version('https://example.test/a.svg');
    const second = version('https://example.test/b.svg');

    let { index } = pushVersion(blank(), key, first);
    ({ index } = pushVersion(index, key, second));

    expect(readHistory(index, key).map((entry) => entry.url)).toEqual([
      'https://example.test/b.svg',
      'https://example.test/a.svg',
    ]);
  });

  it('keeps nothing to delete while under the cap', () => {
    const { expired } = pushVersion(blank(), key, version('https://example.test/a.svg'));
    expect(expired).toEqual([]);
  });

  it('reports the oldest file once the cap is passed', () => {
    let index = blank();
    for (let n = 0; n < historyLimit; n += 1) {
      ({ index } = pushVersion(index, key, version(`https://example.test/${n}.svg`)));
    }

    const { index: trimmed, expired } = pushVersion(
      index,
      key,
      version('https://example.test/newest.svg'),
    );

    expect(readHistory(trimmed, key)).toHaveLength(historyLimit);
    expect(expired).toEqual(['https://example.test/0.svg']);
  });

  it('never reports a file that is still referenced', () => {
    /* The same image uploaded twice must not be deleted when only one of the
       two entries falls past the cap. */
    let index = blank();
    ({ index } = pushVersion(index, key, version('https://example.test/same.svg')));
    for (let n = 0; n < historyLimit; n += 1) {
      ({ index } = pushVersion(index, key, version(`https://example.test/${n}.svg`)));
    }
    const { expired } = pushVersion(index, key, version('https://example.test/same.svg'));

    expect(expired).not.toContain('https://example.test/same.svg');
  });

  it("keeps each slot's log separate", () => {
    const other = historyKey('brand', 'mark');
    let { index } = pushVersion(blank(), key, version('https://example.test/a.svg'));
    ({ index } = pushVersion(index, other, version('https://example.test/b.svg')));

    expect(readHistory(index, key)).toHaveLength(1);
    expect(readHistory(index, other)).toHaveLength(1);
  });
});

describe('removeVersion', () => {
  const key = historyKey('page', 'about.pov');

  it('drops one entry and leaves the rest', () => {
    const keep = version('https://example.test/keep.webp');
    const go = version('https://example.test/go.webp');

    let { index } = pushVersion(blank(), key, keep);
    ({ index } = pushVersion(index, key, go));

    const after = removeVersion(index, key, go.id);
    expect(readHistory(after, key).map((entry) => entry.id)).toEqual([keep.id]);
  });

  it('removes the log entirely once it is empty', () => {
    const only = version('https://example.test/only.webp');
    const { index } = pushVersion(blank(), key, only);

    expect(removeVersion(index, key, only.id).mediaHistory?.[key]).toBeUndefined();
  });

  it('is a no-op for an id that is not there', () => {
    const { index } = pushVersion(blank(), key, version('https://example.test/a.webp'));
    expect(readHistory(removeVersion(index, key, 'nope'), key)).toHaveLength(1);
  });
});

describe('findVersion', () => {
  it('finds by id, within the right slot', () => {
    const key = historyKey('page', 'home.intro.primary');
    const entry = version('https://example.test/a.webp');
    const { index } = pushVersion(blank(), key, entry);

    expect(findVersion(index, key, entry.id)?.url).toBe('https://example.test/a.webp');
    expect(findVersion(index, historyKey('page', 'about.pov'), entry.id)).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */

const overlayWith = (values: Partial<CopyOverlay['values']>): CopyOverlay => ({
  ...emptyCopyOverlay(),
  values: { en: {}, 'zh-hk': {}, ...values },
});

describe('copy publish history', () => {
  it('snapshots only the screen being published', () => {
    const overlay = overlayWith({
      en: { 'home.hero.headlineLineOne': 'Edited', 'about.hero.headline': 'Other' },
    });

    const snapshot = snapshotOf(overlay, 'home', ['home.hero.headlineLineOne']);

    expect(Object.keys(snapshot.values.en)).toEqual(['home.hero.headlineLineOne']);
  });

  it('files snapshots newest first and caps the stack', () => {
    let overlay = emptyCopyOverlay();
    for (let n = 0; n < copyHistoryLimit + 3; n += 1) {
      overlay = pushSnapshot(overlay, 'home', snapshotOf(overlay, 'home', [`field-${n}`]));
    }

    const history = copyHistoryFor(overlay, 'home');
    expect(history).toHaveLength(copyHistoryLimit);
    expect(history[0]?.changed).toEqual([`field-${copyHistoryLimit + 2}`]);
  });

  it("keeps each screen's stack separate", () => {
    let overlay = emptyCopyOverlay();
    overlay = pushSnapshot(overlay, 'home', snapshotOf(overlay, 'home', ['a']));

    expect(copyHistoryFor(overlay, 'home')).toHaveLength(1);
    expect(copyHistoryFor(overlay, 'about')).toHaveLength(0);
  });
});

describe('replaceNamespaceValues', () => {
  it('swaps one screen and leaves the others alone', () => {
    const overlay = overlayWith({
      en: { 'home.hero.headlineLineOne': 'Now', 'about.hero.headline': 'Untouched' },
      'zh-hk': { 'home.hero.headlineLineOne': '現在' },
    });

    const restored = replaceNamespaceValues(overlay, 'home', {
      en: { 'home.hero.headlineLineOne': 'Before' },
      'zh-hk': { 'home.hero.headlineLineOne': '之前' },
    });

    expect(restored.values.en['home.hero.headlineLineOne']).toBe('Before');
    expect(restored.values['zh-hk']['home.hero.headlineLineOne']).toBe('之前');
    expect(restored.values.en['about.hero.headline']).toBe('Untouched');
  });

  it('drops paths the snapshot no longer carries, so a reverted edit really goes', () => {
    const overlay = overlayWith({
      en: { 'home.hero.headlineLineOne': 'Edited', 'home.hero.body': 'Also edited' },
    });

    const restored = replaceNamespaceValues(overlay, 'home', {
      en: { 'home.hero.headlineLineOne': 'Edited' },
      'zh-hk': {},
    });

    expect(restored.values.en['home.hero.body']).toBeUndefined();
    expect(copyValuesFor(restored, 'home').en).toEqual({ 'home.hero.headlineLineOne': 'Edited' });
  });

  it('restoring an empty snapshot clears the screen back to the shipped copy', () => {
    const overlay = overlayWith({ en: { 'privacy.headline': 'Edited' } });
    const restored = replaceNamespaceValues(overlay, 'privacy', { en: {}, 'zh-hk': {} });

    expect(copyValuesFor(restored, 'privacy').en).toEqual({});
  });
});
