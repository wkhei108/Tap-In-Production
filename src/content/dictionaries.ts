import type { Locale } from '@/lib/i18n';
import { en, type Dictionary } from './en';
import { zhHK } from './zh-hk';

const dictionaries: Record<Locale, Dictionary> = {
  en,
  'zh-hk': zhHK,
};

/**
 * Synchronous dictionary lookup — the copy is a plain typed object, so there
 * is nothing to await and nothing to ship to the client beyond the strings a
 * component actually renders.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
