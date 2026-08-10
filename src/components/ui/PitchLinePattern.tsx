import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Tint the markings with a pillar accent. */
  tone?: 'neutral' | 'club' | 'game' | 'lime';
  /** `half` draws the top half of a pitch, `full` the whole thing. */
  variant?: 'half' | 'full' | 'centre';
};

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  neutral: 'text-white/[0.09]',
  club: 'text-club-ink/20',
  game: 'text-game-ink/20',
  lime: 'text-lime/20',
};

/**
 * Touchline / tactical-board markings used as a background motif.
 * Purely decorative — hidden from assistive technology.
 */
export default function PitchLinePattern({
  className,
  tone = 'neutral',
  variant = 'half',
}: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', toneClass[tone], className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    >
      {variant === 'centre' ? (
        <>
          <circle cx="200" cy="130" r="56" />
          <circle cx="200" cy="130" r="2.5" fill="currentColor" stroke="none" />
          <line x1="0" y1="130" x2="400" y2="130" />
        </>
      ) : (
        <>
          {/* Touchlines */}
          <rect x="16" y="14" width="368" height="232" />
          {/* Halfway line + centre circle */}
          <line x1="16" y1="130" x2="384" y2="130" />
          <circle cx="200" cy="130" r="42" />
          <circle cx="200" cy="130" r="2.5" fill="currentColor" stroke="none" />
          {/* Penalty area, top */}
          <rect x="104" y="14" width="192" height="56" />
          <rect x="152" y="14" width="96" height="22" />
          {variant === 'full' && (
            <>
              <rect x="104" y="190" width="192" height="56" />
              <rect x="152" y="224" width="96" height="22" />
            </>
          )}
        </>
      )}
    </svg>
  );
}
