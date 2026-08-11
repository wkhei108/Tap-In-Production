import DisplayText from '@/components/ui/DisplayText';
import Reveal from '@/components/ui/Reveal';
import MediaFrame from '@/components/media/MediaFrame';
import type { ServiceDetail } from '@/content/services';
import type { Locale } from '@/lib/i18n';
import type { MediaSlotRecord } from '@/lib/campaign-schema';
import { serviceSlotAspect, slotFrameProps } from '@/lib/media-slots';
import { cn } from '@/lib/utils';

type Props = {
  services: ServiceDetail[];
  locale: Locale;
  tone: 'club' | 'game';
  mediaPendingLabel: string;
  /** Uploaded images, keyed by slot. Each service has one. */
  pageMedia: Record<string, MediaSlotRecord>;
};

const tones = {
  club: { accent: 'text-club-ink', bullet: 'bg-club-ink', rule: 'bg-club/50' },
  game: { accent: 'text-game-ink', bullet: 'bg-game-ink', rule: 'bg-game/50' },
} as const;

/**
 * The detailed service run-down used on both pillar pages.
 *
 * Alternating text/media rows rather than an accordion — the service detail is
 * the main reason a club or organiser is on this page, so none of it is hidden
 * behind a click.
 */
export default function ServiceSections({
  services,
  locale,
  tone,
  mediaPendingLabel,
  pageMedia,
}: Props) {
  const t = tones[tone];

  return (
    <div className="flex flex-col">
      {services.map((service, index) => {
        const mediaFirst = index % 2 === 1;

        return (
          <Reveal
            as="section"
            key={service.id}
            className="touchline grid gap-8 py-12 md:grid-cols-12 md:gap-10 md:py-16"
          >
            {/* Copy */}
            <div
              className={cn(
                'flex flex-col gap-5 md:col-span-7',
                mediaFirst && 'md:order-2 md:col-start-6',
              )}
            >
              <div className="flex items-center gap-4">
                <span className={cn('meta', t.accent)}>{service.number}</span>
                <span aria-hidden="true" className={cn('h-px w-10', t.rule)} />
                <span className="meta text-mute">{service.label[locale]}</span>
              </div>

              <DisplayText
                as="h2"
                locale={locale}
                id={service.id}
                className="text-display-md scroll-mt-28"
              >
                {service.title[locale]}
              </DisplayText>

              <p className="max-w-[56ch] text-lead text-mute">{service.summary[locale]}</p>

              <ul className="mt-2 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {service.items[locale].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-bone/85">
                    <span
                      aria-hidden="true"
                      className={cn('mt-1.5 size-1 shrink-0 rotate-45', t.bullet)}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Media */}
            <div className={cn('md:col-span-5', mediaFirst && 'md:order-1 md:col-start-1 md:row-start-1')}>
              <MediaFrame
                {...slotFrameProps(pageMedia[`services.${tone}.${service.id}`], locale, {
                  alt: `${service.title[locale]} — ${mediaPendingLabel}`,
                  aspect: serviceSlotAspect(index),
                })}
                sizes="(min-width: 768px) 40vw, 100vw"
                tone={tone}
                placeholderLabel={mediaPendingLabel}
              />
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
