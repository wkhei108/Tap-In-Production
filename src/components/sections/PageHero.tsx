import DisplayText from '@/components/ui/DisplayText';
import PrimaryCTA from '@/components/ui/PrimaryCTA';
import PitchLinePattern from '@/components/ui/PitchLinePattern';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Props = {
  locale: Locale;
  eyebrow: string;
  headline: string;
  body?: string;
  tone?: 'lime' | 'club' | 'game';
  actions?: Array<{ label: string; href: string; variant?: 'solid' | 'outline' }>;
  children?: React.ReactNode;
};

const tones = {
  lime: { eyebrow: 'text-lime', wash: 'from-surface-2/70', pattern: 'lime' },
  club: { eyebrow: 'text-club-ink', wash: 'from-club-deep/60', pattern: 'club' },
  game: { eyebrow: 'text-game-ink', wash: 'from-game-deep/60', pattern: 'game' },
} as const;

/** Standard interior page header. */
export default function PageHero({
  locale,
  eyebrow,
  headline,
  body,
  tone = 'lime',
  actions,
  children,
}: Props) {
  const t = tones[tone];

  return (
    <section className="relative isolate overflow-hidden pt-32 md:pt-44">
      <div
        aria-hidden="true"
        className={cn('absolute inset-0 -z-10 bg-gradient-to-b to-transparent', t.wash)}
      />
      <PitchLinePattern
        tone={t.pattern}
        variant="half"
        className="-z-10 opacity-50"
      />

      <div className="shell pb-14 md:pb-20">
        <p className={cn('meta flex items-center gap-3', t.eyebrow)}>
          <span aria-hidden="true" className="h-px w-8 bg-current" />
          {eyebrow}
        </p>

        <DisplayText as="h1" locale={locale} className="mt-6 max-w-[18ch] text-display-xl">
          {headline}
        </DisplayText>

        {body ? (
          <p className="mt-7 max-w-[62ch] text-lead text-mute">{body}</p>
        ) : null}

        {actions && actions.length > 0 ? (
          <div className="mt-9 flex flex-wrap gap-3">
            {actions.map((action) => (
              <PrimaryCTA
                key={action.href + action.label}
                href={action.href}
                variant={action.variant ?? 'solid'}
                size="lg"
              >
                {action.label}
              </PrimaryCTA>
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </section>
  );
}
