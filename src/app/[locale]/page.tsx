import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowDown } from 'lucide-react';

import HeroShowreel from '@/components/home/HeroShowreel';
import ServiceTicker from '@/components/home/ServiceTicker';
import PillarCard from '@/components/home/PillarCard';
import CapabilityGrid from '@/components/home/CapabilityGrid';
import ProcessTimeline from '@/components/home/ProcessTimeline';
import SponsorValueSection from '@/components/home/SponsorValueSection';
import SocialMediaRail from '@/components/home/SocialMediaRail';
import ProjectGrid from '@/components/work/ProjectGrid';
import MediaFrame from '@/components/media/MediaFrame';
import SectionHeading from '@/components/ui/SectionHeading';
import DisplayText from '@/components/ui/DisplayText';
import PrimaryCTA from '@/components/ui/PrimaryCTA';
import Reveal from '@/components/ui/Reveal';
import FinalCTA from '@/components/sections/FinalCTA';

import { resolveDictionary } from '@/lib/copy';
import { resolvePageMedia } from '@/lib/site-content';
import { slotFrameProps } from '@/lib/media-slots';
import { resolveFeaturedProjects, resolveHero } from '@/lib/campaigns';
import { isLocale, pathFor, type Locale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

/** Backstop for admin edits; writes also revalidate this path immediately. */
export const revalidate = 900;


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
    title: dict.home.meta.title,
    description: dict.home.meta.description,
    path: pathFor(raw, 'home'),
    pathForLocale: (l) => pathFor(l, 'home'),
    absoluteTitle: true,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale: Locale = raw;
  const dict = await resolveDictionary(locale);
  const pageMedia = await resolvePageMedia();
  const featured = await resolveFeaturedProjects(4);
  const hero = await resolveHero();

  return (
    <>
      {/* ---------------------------------------------------------------- 1. Hero */}
      <section className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden pt-28 md:min-h-svh">
        {/* Set in /admin. With no hero saved these are all undefined and the
            branded placeholder carries the section, exactly as before. */}
        <HeroShowreel
          posterSrc={hero?.posterUrl}
          videoSrc={hero?.videoUrl}
          posterAlt={
            (locale === 'zh-hk' ? hero?.posterAltTextZh : hero?.posterAltText) ??
            dict.home.hero.mediaLabel
          }
          mediaLabel={dict.home.hero.mediaLabel}
          placeholderLabel={dict.common.mediaPending}
        />

        <div className="shell pb-10 md:pb-16">
          <p className="meta flex items-center gap-3 text-lime">
            <span aria-hidden="true" className="h-px w-8 bg-current" />
            {dict.home.hero.eyebrow}
          </p>

          <h1 className="mt-6">
            <span className="sr-only">
              {dict.home.hero.headlineLineOne} {dict.home.hero.headlineLineTwo}
            </span>
            <span aria-hidden="true" className="flex flex-col">
              <span
                className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} animate-wipe-up text-display-2xl`}
              >
                {dict.home.hero.headlineLineOne}
              </span>
              <span
                className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} animate-wipe-up text-display-2xl text-lime`}
                style={{ animationDelay: '120ms' }}
              >
                {dict.home.hero.headlineLineTwo}
              </span>
            </span>
          </h1>

          <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end">
            <p className="max-w-[58ch] text-lead text-mute md:col-span-7">
              {dict.home.hero.body}
            </p>

            <div className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
              <PrimaryCTA href={pathFor(locale, 'contact')} size="lg">
                {dict.home.hero.primaryCta}
              </PrimaryCTA>
              <PrimaryCTA href={pathFor(locale, 'work')} variant="outline" size="lg">
                {dict.home.hero.secondaryCta}
              </PrimaryCTA>
            </div>
          </div>

          <p className="meta mt-10 hidden items-center gap-2 text-mute/60 md:flex">
            <ArrowDown aria-hidden="true" className="size-3.5" />
            {dict.home.hero.scrollHint}
          </p>
        </div>

        <ServiceTicker items={dict.home.ticker} />
      </section>

      {/* -------------------------------------------------------- 2. Introduction */}
      <section className="shell py-20 md:py-28" aria-labelledby="intro-heading">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <SectionHeading
              locale={locale}
              eyebrow={dict.home.intro.eyebrow}
              title={dict.home.intro.headline}
              id="intro-heading"
            />
            <p className="mt-6 max-w-[52ch] text-lead text-mute">{dict.home.intro.body}</p>
            <p className="mt-5 max-w-[46ch] border-l-2 border-lime/40 pl-5 text-sm text-mute/85">
              {dict.home.intro.secondary}
            </p>
          </div>

          {/* Editorial composition: one large frame plus a smaller overlapping one. */}
          <div className="relative lg:col-span-7">
            <Reveal>
              <MediaFrame
                {...slotFrameProps(pageMedia['home.intro.primary'], locale, {
                  alt: dict.home.intro.captionPrimary,
                  aspect: 'landscape',
                  note: dict.home.intro.captionPrimary,
                })}
                sizes="(min-width: 1024px) 55vw, 100vw"
                placeholderLabel={dict.common.mediaPending}
              />
            </Reveal>
            <Reveal delay={0.12} className="ml-auto -mt-16 w-1/2 max-w-[280px] md:-mt-24">
              <MediaFrame
                {...slotFrameProps(pageMedia['home.intro.secondary'], locale, {
                  alt: dict.home.intro.captionSecondary,
                  aspect: 'portrait',
                  note: dict.home.intro.captionSecondary,
                })}
                sizes="(min-width: 1024px) 20vw, 45vw"
                placeholderLabel={dict.common.mediaPending}
                className="shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- 3. Business pillars */}
      <section className="shell py-16 md:py-24" aria-labelledby="pillars-heading">
        <SectionHeading
          locale={locale}
          eyebrow={dict.home.pillars.eyebrow}
          title={dict.home.pillars.headline}
          body={dict.home.pillars.body}
          id="pillars-heading"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <PillarCard
              locale={locale}
              tone="club"
              index="01"
              name={dict.home.pillars.club.name}
              meta={dict.home.pillars.club.meta}
              tagline={dict.home.pillars.club.tagline}
              services={dict.home.pillars.club.services}
              cta={dict.home.pillars.club.cta}
              href={pathFor(locale, 'buildAClub')}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <PillarCard
              locale={locale}
              tone="game"
              index="02"
              name={dict.home.pillars.game.name}
              meta={dict.home.pillars.game.meta}
              tagline={dict.home.pillars.game.tagline}
              services={dict.home.pillars.game.services}
              cta={dict.home.pillars.game.cta}
              href={pathFor(locale, 'buildAGame')}
            />
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- 4. Featured work */}
      <section className="shell py-20 md:py-28" aria-labelledby="featured-heading">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            locale={locale}
            eyebrow={dict.home.featured.eyebrow}
            title={dict.home.featured.headline}
            body={dict.home.featured.body}
            id="featured-heading"
          />
          <PrimaryCTA
            href={pathFor(locale, 'work')}
            variant="outline"
            className="shrink-0 self-start md:self-auto"
          >
            {dict.home.featured.cta}
          </PrimaryCTA>
        </div>

        <ProjectGrid projects={featured} locale={locale} className="mt-12" />
      </section>

      {/* --------------------------------------------------------- 5. Capabilities */}
      <section className="shell py-20 md:py-28" aria-labelledby="capabilities-heading">
        <SectionHeading
          locale={locale}
          eyebrow={dict.home.capabilities.eyebrow}
          title={dict.home.capabilities.headline}
          body={dict.home.capabilities.body}
          id="capabilities-heading"
        />
        <div className="mt-12">
          <CapabilityGrid locale={locale} />
        </div>
      </section>

      {/* -------------------------------------------------------------- 6. Process */}
      <section className="shell py-20 md:py-28" aria-labelledby="process-heading">
        <SectionHeading
          locale={locale}
          eyebrow={dict.home.process.eyebrow}
          title={dict.home.process.headline}
          body={dict.home.process.body}
          id="process-heading"
        />
        <div className="mt-14">
          <ProcessTimeline locale={locale} />
        </div>
      </section>

      {/* ----------------------------------------------------- 7. Commercial value */}
      <SponsorValueSection locale={locale} />

      {/* ------------------------------------------------- 8. Clubs & collaborators
          Intentionally not rendered as a logo strip: no client logos have been
          approved or supplied. See docs/client-input-needed.md. The section is
          documented here so it is easy to switch on once artwork exists. */}
      <section className="shell py-10" aria-labelledby="clients-heading">
        <div className="border border-dashed border-line/70 bg-surface/30 p-8 md:p-10">
          <p className="meta text-mute/70">{dict.home.clients.eyebrow}</p>
          <DisplayText
            as="h2"
            locale={locale}
            id="clients-heading"
            className="mt-3 text-display-sm text-bone/70"
          >
            {dict.home.clients.headline}
          </DisplayText>
          <p className="mt-3 max-w-[64ch] text-sm text-mute">{dict.home.clients.body}</p>
        </div>
      </section>

      {/* ------------------------------------------------------ 9. From the touchline */}
      <SocialMediaRail locale={locale} />

      {/* ------------------------------------------------------------ 10. Final CTA */}
      <FinalCTA
        locale={locale}
        headline={dict.home.finalCta.headline}
        body={dict.home.finalCta.body}
        primaryLabel={dict.home.finalCta.primaryCta}
        secondaryLabel={dict.home.finalCta.secondaryCta}
      />
    </>
  );
}
