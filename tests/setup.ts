import '@testing-library/react';

/**
 * jsdom does not implement matchMedia, which `useRichMediaAllowed` and
 * Motion both read. Default to "no preference" so components render their
 * normal state in tests.
 */
if (!window.matchMedia) {
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
