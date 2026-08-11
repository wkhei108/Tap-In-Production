import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PageHero from '@/components/sections/PageHero';
import FinalCTA from '@/components/sections/FinalCTA';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import MediaFrame from '@/components/media/MediaFrame';
import ProcessTimeline from '@/components/home/ProcessTimeline';

import { resolveDictionary } from '@/lib/copy';
import { isLocale, pathFor, type Locale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const dict = await resolveDictionary(raw);

  return buildMetadata({
    locale: raw,
    title: dict.about.meta.title,
    description: dict.about.meta.description,
    path: pathFor(raw, 'about'),
    pathForLocale: (l) => pathFor(l, 'about'),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale: Locale = raw;
  const dict = await resolveDictionary(locale);

  return (
    <>
      <PageHero
        locale={locale}
        eyebrow={dict.about.hero.eyebrow}
        headline={dict.about.hero.headline}
        body={dict.about.hero.body}
      />

      {/* Point of view + supporting image */}
      <section className="shell py-16 md:py-24" aria-labelledby="about-pov">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <SectionHeading
              locale={locale}
              eyebrow={dict.about.pov.eyebrow}
              title={dict.about.pov.headline}
              body={dict.about.pov.body}
              id="about-pov"
            />
            <p className="mt-6 max-w-[52ch] border-l-2 border-lime/40 pl-5 text-sm text-mute/85">
              {dict.about.pov.secondary}
            </p>
          </div>
          <Reveal className="lg:col-span-6">
            <MediaFrame
              aspect="landscape"
              alt={dict.about.pov.headline}
              sizes="(min-width: 1024px) 48vw, 100vw"
              placeholderLabel={dict.common.mediaPending}
              expectedPath="/media/about/team-at-work.webp"
            />
          </Reveal>
        </div>
      </section>

      {/* Why football-specific production matters */}
      <section className="shell py-16 md:py-24" aria-labelledby="about-why-football">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <SectionHeading
              locale={locale}
              eyebrow={dict.about.whyFootball.eyebrow}
              title={dict.about.whyFootball.headline}
              id="about-why-football"
            />
          </div>
          <div className="lg:col-span-7">
            <p className="max-w-[62ch] text-lead text-mute">{dict.about.whyFootball.body}</p>
            <ul className="mt-8 flex flex-col">
              {dict.about.whyFootball.points.map((point, index) => (
                <li
                  key={point}
                  className="flex items-start gap-4 border-t border-line py-4 text-bone/85"
                >
                  <span className="meta shrink-0 pt-1 text-lime">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What makes the team different */}
      <section className="shell py-16 md:py-24" aria-labelledby="about-difference">
        <SectionHeading
          locale={locale}
          eyebrow={dict.about.difference.eyebrow}
          title={dict.about.difference.headline}
          id="about-difference"
        />

        <ul className="mt-12 grid gap-px overflow-hidden rounded-xs border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {dict.about.difference.items.map((item, index) => (
            <li key={item.title} className="flex flex-col gap-3 bg-ink p-6 md:p-7">
              <span className="meta text-lime">{String(index + 1).padStart(2, '0')}</span>
              <h3
                className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-xl`}
              >
                {item.title}
              </h3>
              <p className="text-sm text-mute">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How we work with clients */}
      <section className="shell py-16 md:py-24" aria-labelledby="about-working">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <SectionHeading
              locale={locale}
              eyebrow={dict.about.working.eyebrow}
              title={dict.about.working.headline}
              id="about-working"
            />
          </div>
          <ul className="flex flex-col lg:col-span-7">
            {dict.about.working.steps.map((step, index) => (
              <Reveal
                as="li"
                key={step.title}
                delay={index * 0.06}
                className="touchline flex flex-col gap-2 py-6"
              >
                <h3
                  className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-display-sm`}
                >
                  {step.title}
                </h3>
                <p className="max-w-[58ch] text-sm text-mute">{step.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* The process, restated for prospective clients */}
      <section className="shell py-16 md:py-24" aria-labelledby="about-process">
        <SectionHeading
          locale={locale}
          eyebrow={dict.home.process.eyebrow}
          title={dict.home.process.headline}
          body={dict.home.process.body}
          id="about-process"
        />
        <div className="mt-14">
          <ProcessTimeline locale={locale} />
        </div>
      </section>

      {/* Hong Kong football connection */}
      <section className="shell py-16 md:py-24" aria-labelledby="about-hong-kong">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-6">
            <MediaFrame
              aspect="portrait"
              alt={dict.about.hongKong.headline}
              sizes="(min-width: 1024px) 48vw, 100vw"
              placeholderLabel={dict.common.mediaPending}
              expectedPath="/media/about/hong-kong-football.webp"
            />
          </Reveal>
          <div className="lg:col-span-6 lg:self-center">
            <SectionHeading
              locale={locale}
              eyebrow={dict.about.hongKong.eyebrow}
              title={dict.about.hongKong.headline}
              body={dict.about.hongKong.body}
              id="about-hong-kong"
            />
            <p className="mt-6 max-w-[54ch] text-sm text-mute/85">
              {dict.about.hongKong.secondary}
            </p>
          </div>
        </div>
      </section>

      {/* Team — placeholder until real biographies are supplied. No invented
          founders or staff profiles are published. */}
      <section className="shell py-10" aria-labelledby="about-team">
        <div className="border border-dashed border-line/70 bg-surface/30 p-8 md:p-10">
          <p className="meta text-mute/70">{dict.about.team.eyebrow}</p>
          <h2
            id="about-team"
            className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} mt-3 text-display-sm text-bone/70`}
          >
            {dict.about.team.headline}
          </h2>
          <p className="mt-3 max-w-[64ch] text-sm text-mute">{dict.about.team.body}</p>
        </div>
      </section>

      <FinalCTA
        locale={locale}
        headline={dict.about.cta.headline}
        body={dict.about.cta.body}
      />
    </>
  );
}
