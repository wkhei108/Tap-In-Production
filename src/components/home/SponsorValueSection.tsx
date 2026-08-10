import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { getDictionary } from '@/content/dictionaries';
import type { Locale } from '@/lib/i18n';

/**
 * Commercial value.
 *
 * Note the closing disclaimer: this section explains what consistent content
 * makes possible, and explicitly does not promise sponsorship revenue or
 * audience figures.
 */
export default function SponsorValueSection({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const copy = dict.home.commercial;

  return (
    <section className="shell relative py-20 md:py-28" aria-labelledby="commercial-value">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            locale={locale}
            eyebrow={copy.eyebrow}
            title={copy.headline}
            body={copy.body}
            id="commercial-value"
          />
        </div>

        <ul className="flex flex-col lg:col-span-7">
          {copy.points.map((point, index) => (
            <Reveal
              as="li"
              key={point.title}
              delay={index * 0.08}
              className="touchline flex flex-col gap-2 py-6 first:pt-0"
            >
              <div className="flex items-baseline gap-4">
                <span className="meta text-lime">{String(index + 1).padStart(2, '0')}</span>
                <h3
                  className={
                    locale === 'zh-hk' ? 'display-cjk text-xl' : 'display text-xl'
                  }
                >
                  {point.title}
                </h3>
              </div>
              <p className="max-w-[54ch] pl-10 text-sm text-mute">{point.body}</p>
            </Reveal>
          ))}

          <li className="mt-6 border-l-2 border-lime/40 pl-5">
            <p className="max-w-[58ch] text-sm text-mute/85">{copy.disclaimer}</p>
          </li>
        </ul>
      </div>
    </section>
  );
}
