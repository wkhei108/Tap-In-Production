import DisplayText from '@/components/ui/DisplayText';
import PrimaryCTA from '@/components/ui/PrimaryCTA';
import PitchLinePattern from '@/components/ui/PitchLinePattern';
import { getDictionary } from '@/content/dictionaries';
import { site } from '@/content/site';
import { pathFor, type Locale } from '@/lib/i18n';

type Props = {
  locale: Locale;
  headline: string;
  body: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  tone?: 'lime' | 'club' | 'game';
};

const toneRing = {
  lime: 'from-surface-2/80',
  club: 'from-club-deep/60',
  game: 'from-game-deep/60',
} as const;

/** The closing enquiry block, shared by every page. */
export default function FinalCTA({
  locale,
  headline,
  body,
  primaryLabel,
  secondaryLabel,
  tone = 'lime',
}: Props) {
  const dict = getDictionary(locale);

  return (
    <section
      className="shell relative py-20 md:py-28"
      aria-labelledby="final-cta-heading"
    >
      <div
        className={`relative isolate overflow-hidden rounded-xs border border-line bg-gradient-to-br ${toneRing[tone]} to-transparent p-8 md:p-16`}
      >
        <PitchLinePattern
          tone={tone === 'lime' ? 'lime' : tone}
          variant="centre"
          className="-z-10 opacity-60"
        />

        <div className="max-w-[26ch]">
          <DisplayText
            as="h2"
            locale={locale}
            id="final-cta-heading"
            className="text-display-lg"
          >
            {headline}
          </DisplayText>
        </div>

        <p className="mt-6 max-w-[56ch] text-lead text-mute">{body}</p>

        <div className="mt-10 flex flex-wrap gap-3">
          <PrimaryCTA href={pathFor(locale, 'contact')} size="lg">
            {primaryLabel ?? dict.common.startProject}
          </PrimaryCTA>
          <PrimaryCTA
            href={`mailto:${site.email}`}
            external
            variant="outline"
            size="lg"
            withArrow={false}
          >
            {secondaryLabel ?? dict.common.emailUs}
          </PrimaryCTA>
        </div>

        <p className="meta mt-8 text-mute/60">{site.email}</p>
      </div>
    </section>
  );
}
