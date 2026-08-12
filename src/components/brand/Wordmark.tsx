import { cn } from '@/lib/utils';
import { site } from '@/content/site';

/**
 * The wordmark.
 *
 * Until a vector logo is uploaded this is set in the display face rather than
 * traced from a low-resolution screenshot. Upload one under Settings → Brand
 * and it takes over here.
 *
 * Uploaded artwork is trimmed of transparent padding on upload (see
 * `trimTransparentEdges`), so its own bounding box is close to its visible
 * ink — which is what makes a height class here a fair comparison to the
 * text it replaces. The call sites measure the text wordmark's actual
 * rendered cap height (Barlow Condensed Bold caps run ~72% of font-size) and
 * pass that back in as `logoClassName`, so an uploaded logo reads at the same
 * size as the words it stands in for, not a guessed one.
 */
export default function Wordmark({
  className,
  tone = 'lime',
  logoUrl,
  name,
  logoClassName = 'h-5 md:h-6',
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
