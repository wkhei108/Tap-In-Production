import Image from 'next/image';
import { aspectRatios, cn, type AspectKey } from '@/lib/utils';
import PitchLinePattern from '@/components/ui/PitchLinePattern';

type Props = {
  /** Path under /public. Undefined renders the branded placeholder panel. */
  src?: string;
  alt: string;
  aspect?: AspectKey;
  /** Responsive `sizes` hint — always pass one for grid images. */
  sizes?: string;
  priority?: boolean;
  className?: string;
  tone?: 'neutral' | 'club' | 'game' | 'lime';
  /** Small production note shown in the corner, e.g. a category. */
  note?: string;
  /** Copy for the placeholder state, supplied by the active dictionary. */
  placeholderLabel?: string;
  /** Expected file path, printed in the placeholder to speed up asset drops. */
  expectedPath?: string;
  /** Scale the image slightly on hover of an ancestor `.group`. */
  hoverZoom?: boolean;
  children?: React.ReactNode;
};

const toneRing: Record<NonNullable<Props['tone']>, string> = {
  neutral: 'from-surface-2 to-surface',
  club: 'from-club-deep to-surface',
  game: 'from-game-deep to-surface',
  lime: 'from-surface-2 to-surface',
};

/**
 * A fixed-ratio media container.
 *
 * The whole site addresses media through this component, so an asset that has
 * not been supplied yet degrades into a deliberate branded panel of exactly
 * the right shape — no broken icons, no layout shift, nothing to clean up
 * later beyond dropping the file in and setting the path.
 */
export default function MediaFrame({
  src,
  alt,
  aspect = 'landscape',
  sizes = '100vw',
  priority = false,
  className,
  tone = 'neutral',
  note,
  placeholderLabel,
  expectedPath,
  hoverZoom = false,
  children,
}: Props) {
  return (
    <figure
      className={cn(
        'relative isolate overflow-hidden rounded-xs border border-line bg-surface',
        className,
      )}
      style={{ aspectRatio: aspectRatios[aspect] }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className={cn(
            'object-cover',
            hoverZoom &&
              'transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100',
          )}
        />
      ) : (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br',
            toneRing[tone],
          )}
          // The placeholder is decorative; the accessible description of what
          // *will* be here is carried by the figure caption and alt text of
          // the real asset once supplied.
          role="img"
          aria-label={alt}
        >
          <PitchLinePattern tone={tone === 'neutral' ? 'neutral' : tone} variant="half" />

          <div className="absolute inset-0 flex min-w-0 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="display text-display-sm text-bone/25">TAP IN.</span>
            {placeholderLabel ? (
              <span className="meta text-mute/70">{placeholderLabel}</span>
            ) : null}
            {expectedPath ? (
              <code className="block w-full truncate font-mono text-[0.62rem] text-mute/45">
                {expectedPath}
              </code>
            ) : null}
          </div>
        </div>
      )}

      {note ? (
        <figcaption className="pointer-events-none absolute bottom-0 left-0 z-10 m-3">
          <span className="ticket meta text-bone/80">{note}</span>
        </figcaption>
      ) : null}

      {children}
    </figure>
  );
}
