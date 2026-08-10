/** Join class names, dropping falsy values. Keeps a clsx dependency out. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Fill `{token}` placeholders in a dictionary string.
 * `format('Item {current} of {total}', { current: 2, total: 8 })`
 */
export function format(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Aspect-ratio CSS values used by media frames across the site. */
export const aspectRatios = {
  portrait: '3 / 4',
  landscape: '16 / 10',
  square: '1 / 1',
} as const;

export type AspectKey = keyof typeof aspectRatios;
