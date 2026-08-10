import '@testing-library/react';

/**
 * jsdom does not implement matchMedia, which `useRichMediaAllowed` and
 * Motion both read. Default to "no preference" so components render their
 * normal state in tests.
 *
 * Skipped entirely for suites that opt into the node environment — server-side
 * code has no window to patch.
 */
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
