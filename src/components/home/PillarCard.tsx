import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import DisplayText from '@/components/ui/DisplayText';
import PitchLinePattern from '@/components/ui/PitchLinePattern';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

type Props = {
  locale: Locale;
  tone: 'club' | 'game';
  name: string;
  meta: string;
  tagline: string;
  services: string[];
  cta: string;
  href: string;
  index: string;
};

const tones = {
  club: {
    border: 'hover:border-club-ink/60 focus-within:border-club-ink/60',
    glow: 'from-club-deep/70',
    accent: 'text-club-ink',
    bullet: 'bg-club-ink',
    ctaHover: 'group-hover:text-club-ink group-focus-within:text-club-ink',
  },
  game: {
    border: 'hover:border-game-ink/60 focus-within:border-game-ink/60',
    glow: 'from-game-deep/70',
    accent: 'text-game-ink',
    bullet: 'bg-game-ink',
    ctaHover: 'group-hover:text-game-ink group-focus-within:text-game-ink',
  },
} as const;

/**
 * One of the two business pillars.
 *
 * The whole card is a single link (the heading carries it), so hover, focus
 * and touch all behave identically — the secondary detail is always visible
 * rather than hidden behind a hover state that a phone can never trigger.
 */
export default function PillarCard({
  locale,
  tone,
  name,
  meta,
  tagline,
  services,
  cta,
  href,
  index,
}: Props) {
  const t = tones[tone];

  return (
    <article
      className={cn(
        'group relative isolate flex flex-col overflow-hidden rounded-xs border border-line bg-surface/60 transition-colors duration-500',
        t.border,
      )}
    >
      {/* Accent wash — intensifies on hover/focus without hiding anything. */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 -z-10 bg-gradient-to-br to-transparent opacity-40 transition-opacity duration-700 group-hover:opacity-90 group-focus-within:opacity-90 motion-reduce:transition-none',
          t.glow,
        )}
      />
      {/* Centre-circle motif only — the full pitch drew boxes across the
          headline and read as a stray rectangle. */}
      <PitchLinePattern
        tone={tone}
        variant="centre"
        className="-z-10 opacity-50 transition-opacity duration-700 group-hover:opacity-90 group-focus-within:opacity-90"
      />

      <div className="flex flex-1 flex-col gap-6 p-6 md:p-9">
        <div className="flex items-start justify-between gap-4">
          <p className={cn('meta', t.accent)}>{meta}</p>
          <span className="meta text-mute/60">{index}</span>
        </div>

        <div className="flex flex-col gap-4">
          <DisplayText as="h3" locale="en" className="text-display-md">
            {/* Programme names are brand marks — never translated. */}
            <Link href={href} className="after:absolute after:inset-0 after:content-['']">
              {name}
            </Link>
          </DisplayText>
          <p className="max-w-[42ch] text-lead text-mute">{tagline}</p>
        </div>

        <ul className="mt-auto grid grid-cols-1 gap-x-6 gap-y-2 pt-2 sm:grid-cols-2">
          {services.map((service) => (
            <li key={service} className="flex items-center gap-2.5 text-sm text-bone/80">
              <span aria-hidden="true" className={cn('size-1 shrink-0 rotate-45', t.bullet)} />
              {service}
            </li>
          ))}
        </ul>

        <p
          className={cn(
            'mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase transition-colors duration-300',
            locale === 'zh-hk' ? 'display-cjk' : 'display',
            t.ctaHover,
          )}
        >
          {cta}
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
          />
        </p>
      </div>
    </article>
  );
}
