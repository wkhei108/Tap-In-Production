import { cn } from '@/lib/utils';
import { site } from '@/content/site';

/**
 * Temporary text wordmark.
 *
 * TAP IN. has not supplied a vector logo yet, so this is set in the display
 * face rather than traced from a low-resolution screenshot. Swap the markup
 * here for `public/brand/tap-in-logo.svg` when the real artwork arrives —
 * see docs/client-input-needed.md. Sizing is controlled with text classes.
 */
export default function Wordmark({
  className,
  tone = 'lime',
}: {
  className?: string;
  tone?: 'lime' | 'bone' | 'ink';
}) {
  const toneClass =
    tone === 'lime' ? 'text-lime' : tone === 'ink' ? 'text-ink' : 'text-bone';

  return (
    <span
      className={cn(
        'display inline-block whitespace-nowrap leading-none tracking-[-0.015em]',
        toneClass,
        className,
      )}
    >
      <span className="sr-only">{site.name}</span>
      <span aria-hidden="true">TAP&nbsp;IN.</span>
    </span>
  );
}
