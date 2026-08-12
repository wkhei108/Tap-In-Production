import { cn } from '@/lib/utils';
import { site } from '@/content/site';

/**
 * The wordmark.
 *
 * Until a vector logo is uploaded this is set in the display face rather than
 * traced from a low-resolution screenshot. Upload one under Settings → Brand
 * and it takes over here.
 *
 * Uploaded artwork is sized by its own height class rather than by the text
 * size: a logo file usually carries its own padding inside the viewBox, so
 * matching it to the cap height of the text leaves it looking far smaller
 * than the words it replaced.
 */
export default function Wordmark({
  className,
  tone = 'lime',
  logoUrl,
  name,
  logoClassName = 'h-9',
}: {
  className?: string;
  tone?: 'lime' | 'bone' | 'ink';
  /** Uploaded artwork. Falls back to the text wordmark when absent. */
  logoUrl?: string;
  /** Accessible name — the site name, which is itself editable. */
  name?: string;
  /**
   * Height utilities for the uploaded logo, e.g. `h-8 md:h-10`. Height only:
   * `cn` is a plain join, so a second width utility here would collide with
   * the one below rather than override it.
   */
  logoClassName?: string;
}) {
  const toneClass =
    tone === 'lime' ? 'text-lime' : tone === 'ink' ? 'text-ink' : 'text-bone';

  const label = name ?? site.name;

  if (logoUrl) {
    return (
      <span className={cn('inline-flex items-center leading-none', className)}>
        {/* Arbitrary artwork dimensions, sized from the height class above —
            `next/image` would need a width and height this component cannot
            know. The width cap stops a wide lockup crowding out the nav on a
            narrow screen. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={label}
          className={cn('w-auto max-w-[min(58vw,280px)] object-contain', logoClassName)}
        />
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
