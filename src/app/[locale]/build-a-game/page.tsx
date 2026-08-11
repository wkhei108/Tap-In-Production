import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PageHero from '@/components/sections/PageHero';
import ServiceSections from '@/components/sections/ServiceSections';
import StageTimeline from '@/components/sections/StageTimeline';
import PlanBoard from '@/components/sections/PlanBoard';
import FinalCTA from '@/components/sections/FinalCTA';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import PrimaryCTA from '@/components/ui/PrimaryCTA';
import ProjectGrid from '@/components/work/ProjectGrid';

import { resolveDictionary, resolveServiceContent } from '@/lib/copy';
import { resolvePageMedia } from '@/lib/site-content';
import { filterProjects } from '@/content/projects';
import { resolveProjects } from '@/lib/campaigns';
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
    title: dict.game.meta.title,
    description: dict.game.meta.description,
    path: pathFor(raw, 'buildAGame'),
    pathForLocale: (l) => pathFor(l, 'buildAGame'),
  });
}

export default async function BuildAGamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale: Locale = raw;
  const dict = await resolveDictionary(locale);
  const pageMedia = await resolvePageMedia();
  const gameProjects = filterProjects(await resolveProjects(), 'game').slice(0, 4);
  const { gameServices, gameEventJourney, gameDeliverablesBoard } = await resolveServiceContent();

  return (
    <>
      <PageHero
        locale={locale}
        tone="game"
        eyebrow={dict.game.hero.eyebrow}
        headline={dict.game.hero.headline}
        body={dict.game.hero.body}
        actions={[
          { label: dict.game.hero.primaryCta, href: pathFor(locale, 'contact') },
          {
            label: dict.game.hero.secondaryCta,
            href: `${pathFor(locale, 'work')}?filter=game`,
            variant: 'outline',
          },
        ]}
      />

      <section className="shell py-16 md:py-24" aria-labelledby="game-intro">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <SectionHeading
              locale={locale}
              tone="game"
              eyebrow={dict.game.intro.eyebrow}
              title={dict.game.intro.headline}
              body={dict.game.intro.body}
              id="game-intro"
            />
          </div>

          <ul className="grid gap-px overflow-hidden rounded-xs border border-line bg-line sm:grid-cols-2 lg:col-span-7">
            {dict.game.intro.pillars.map((pillar) => (
              <li key={pillar.label} className="flex flex-col gap-1.5 bg-ink p-5">
                <h3
                  className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-lg text-game-ink`}
                >
                  {pillar.label}
                </h3>
                <p className="text-sm text-mute">{pillar.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="shell py-12 md:py-16" aria-labelledby="game-services">
        <SectionHeading
          locale={locale}
          tone="game"
          eyebrow={dict.game.services.eyebrow}
          title={dict.game.services.headline}
          body={dict.game.services.body}
          id="game-services"
        />
        <div className="mt-8">
          <ServiceSections
            services={gameServices}
            locale={locale}
            tone="game"
            mediaPendingLabel={dict.common.mediaPending}
            pageMedia={pageMedia}
          />
        </div>
      </section>

      <section className="shell py-16 md:py-24" aria-labelledby="game-journey">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              locale={locale}
              tone="game"
              eyebrow={dict.game.journey.eyebrow}
              title={dict.game.journey.headline}
              body={dict.game.journey.body}
              id="game-journey"
            />
          </div>
          <div className="lg:col-span-7">
            <StageTimeline stages={gameEventJourney} locale={locale} tone="game" />
          </div>
        </div>

        <div className="mt-16">
          <SectionHeading
            locale={locale}
            tone="game"
            eyebrow={dict.game.deliverablesBoard.eyebrow}
            title={dict.game.deliverablesBoard.headline}
            body={dict.game.deliverablesBoard.body}
            size="md"
          />
          <div className="mt-8">
            <PlanBoard
              columns={gameDeliverablesBoard}
              locale={locale}
              tone="game"
              note={dict.game.deliverablesBoard.note}
            />
          </div>
        </div>
      </section>

      {gameProjects.length > 0 ? (
        <section className="shell py-16 md:py-24" aria-labelledby="game-gallery">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              locale={locale}
              tone="game"
              eyebrow={dict.game.gallery.eyebrow}
              title={dict.game.gallery.headline}
              id="game-gallery"
            />
            <PrimaryCTA
              href={`${pathFor(locale, 'work')}?filter=game`}
              variant="outline"
              className="shrink-0 self-start md:self-auto"
            >
              {dict.common.viewAllWork}
            </PrimaryCTA>
          </div>

          <Reveal className="mt-12">
            <ProjectGrid projects={gameProjects} locale={locale} />
          </Reveal>
        </section>
      ) : null}

      <FinalCTA
        locale={locale}
        tone="game"
        headline={dict.game.cta.headline}
        body={dict.game.cta.body}
      />
    </>
  );
}
