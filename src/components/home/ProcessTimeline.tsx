import { processSteps } from '@/content/services';
import Reveal from '@/components/ui/Reveal';
import type { Locale } from '@/lib/i18n';

/**
 * The five-phase game plan, drawn as a touchline running through the steps.
 */
export default function ProcessTimeline({ locale }: { locale: Locale }) {
  return (
    <ol className="relative grid gap-8 md:grid-cols-5 md:gap-5">
      {/* The line itself — decorative, hidden from the accessibility tree. */}
      <div
        aria-hidden="true"
        className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-line md:left-0 md:top-[7px] md:h-px md:w-full"
      />

      {processSteps.map((step, index) => (
        <Reveal as="li" key={step.id} delay={index * 0.06} className="relative pl-8 md:pl-0 md:pt-8">
          <span
            aria-hidden="true"
            className="absolute left-0 top-1.5 size-[15px] rotate-45 border border-lime bg-ink md:top-0"
          />
          <span className="meta text-lime">{step.number}</span>
          <h3
            className={
              locale === 'zh-hk'
                ? 'display-cjk mt-3 text-display-sm'
                : 'display mt-3 text-display-sm'
            }
          >
            {step.title[locale]}
          </h3>
          <p className="mt-2 max-w-[34ch] text-sm text-mute">{step.body[locale]}</p>
        </Reveal>
      ))}
    </ol>
  );
}
