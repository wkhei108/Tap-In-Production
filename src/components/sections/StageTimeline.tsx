import Reveal from '@/components/ui/Reveal';
import type { TimelineStage } from '@/content/services';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const tones = {
  club: { marker: 'text-club-ink', node: 'border-club-ink' },
  game: { marker: 'text-game-ink', node: 'border-game-ink' },
  lime: { marker: 'text-lime', node: 'border-lime' },
} as const;

/**
 * Vertical stage list used for the season workflow and the event journey.
 * Ordered list so the sequence is conveyed structurally, not just visually.
 */
export default function StageTimeline({
  stages,
  locale,
  tone = 'lime',
}: {
  stages: TimelineStage[];
  locale: Locale;
  tone?: keyof typeof tones;
}) {
  const t = tones[tone];

  return (
    <ol className="relative flex flex-col">
      <div
        aria-hidden="true"
        className="absolute left-[7px] top-3 h-[calc(100%-1.5rem)] w-px bg-line"
      />

      {stages.map((stage, index) => (
        <Reveal as="li" key={stage.id} delay={index * 0.05} className="relative py-6 pl-10">
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-0 top-[26px] size-[15px] rotate-45 border bg-ink',
              t.node,
            )}
          />
          <div className="flex flex-col gap-2">
            <span className={cn('meta', t.marker)}>{stage.marker[locale]}</span>
            <h3
              className={cn(
                locale === 'zh-hk' ? 'display-cjk' : 'display',
                'text-display-sm',
              )}
            >
              {stage.title[locale]}
            </h3>
            <p className="max-w-[58ch] text-sm text-mute">{stage.body[locale]}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
