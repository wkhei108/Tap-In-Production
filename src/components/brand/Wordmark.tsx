import { cn } from '@/lib/utils';
import { site } from '@/content/site';

/**
 * The wordmark.
 *
 * Until a vector logo is uploaded this is set in the display face rather than
 * traced from a low-resolution screenshot. Upload one under Settings → Brand
 * and it takes over here, sized by the same text classes so every call site
 * keeps working without knowing which of the two it is getting.
 */
export default function Wordmark({
  className,
  tone = 'lime',
  logoUrl,
  name,
}: {
  className?: string;
  tone?: 'lime' | 'bone' | 'ink';
  /** Uploaded artwork. Falls back to the text wordmark when absent. */
  logoUrl?: string;
  /** Accessible name — the site name, which is itself editable. */
  name?: string;
}) {
  const toneClass =
    tone === 'lime' ? 'text-lime' : tone === 'ink' ? 'text-ink' : 'text-bone';

  const label = name ?? site.name;

  if (logoUrl) {
    return (
      <span className={cn('inline-flex items-center leading-none', className)}>
        {/* Arbitrary artwork dimensions, sized from the inherited font size —
            `next/image` would need a width and height this component cannot
            know. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={label} className="h-[1em] w-auto object-contain" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'display inline-block whitespace-nowrap leading-none tracking-[-0.015em]',
        toneClass,
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">TAP&nbsp;IN.</span>
    </span>
  );
}
