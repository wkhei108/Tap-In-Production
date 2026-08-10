import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'solid' | 'outline' | 'ghost' | 'club' | 'game';
type Size = 'md' | 'lg';

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  /** Renders the corner arrow. On by default for solid buttons. */
  withArrow?: boolean;
  external?: boolean;
  className?: string;
  /** Announced label when the visible text alone is ambiguous. */
  ariaLabel?: string;
};

const variantClass: Record<Variant, string> = {
  solid:
    'bg-lime text-ink hover:bg-bone focus-visible:bg-bone border border-lime hover:border-bone',
  outline:
    'border border-line text-bone hover:border-lime hover:text-lime bg-transparent',
  ghost: 'border border-transparent text-bone hover:text-lime bg-transparent px-0',
  club: 'bg-club text-bone hover:bg-club-ink hover:text-ink border border-club hover:border-club-ink',
  game: 'bg-game text-bone hover:bg-game-ink hover:text-ink border border-game hover:border-game-ink',
};

const sizeClass: Record<Size, string> = {
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
};

/**
 * The site's single call-to-action element. Always a real link — there are no
 * clickable divs and no dead buttons anywhere in this build.
 */
export default function PrimaryCTA({
  href,
  children,
  variant = 'solid',
  size = 'md',
  withArrow,
  external = false,
  className,
  ariaLabel,
}: Props) {
  const showArrow = withArrow ?? variant === 'solid';

  const content = (
    <>
      <span className="display text-[1.05em] leading-none tracking-[0.02em]">{children}</span>
      {showArrow ? (
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      ) : null}
    </>
  );

  const classes = cn(
    'tap group inline-flex items-center justify-center gap-2 rounded-xs font-semibold uppercase transition-colors duration-300',
    variantClass[variant],
    sizeClass[size],
    className,
  );

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}
