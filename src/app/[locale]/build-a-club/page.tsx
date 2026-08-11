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
    title: dict.club.meta.title,
    description: dict.club.meta.description,
    path: pathFor(raw, 'buildAClub'),
    pathForLocale: (l) => pathFor(l, 'buildAClub'),
  });
}

export default async function BuildAClubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale: Locale = raw;
  const dict = await resolveDictionary(locale);
  const pageMedia = await resolvePageMedia();
  const clubProjects = filterProjects(await resolveProjects(), 'club').slice(0, 4);
  const { clubServices, clubSeasonWorkflow, clubMatchweekCalendar } =
    await resolveServiceContent();

  return (
    <>
      <PageHero
        locale={locale}
        tone="club"
        eyebrow={dict.club.hero.eyebrow}
        headline={dict.club.hero.headline}
        body={dict.club.hero.body}
        actions={[
          { label: dict.club.hero.primaryCta, href: pathFor(locale, 'contact') },
          {
            label: dict.club.hero.secondaryCta,
            href: `${pathFor(locale, 'work')}?filter=club`,
            variant: 'outline',
          },
        ]}
      />

      {/* Why it matters + the six signature labels */}
      <section className="shell py-16 md:py-24" aria-labelledby="club-intro">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <SectionHeading
              locale={locale}
              tone="club"
              eyebrow={dict.club.intro.eyebrow}
              title={dict.club.intro.headline}
              body={dict.club.intro.body}
              id="club-intro"
            />
          </div>

          <ul className="grid gap-px overflow-hidden rounded-xs border border-line bg-line sm:grid-cols-2 lg:col-span-7">
            {dict.club.intro.pillars.map((pillar) => (
              <li key={pillar.label} className="flex flex-col gap-1.5 bg-ink p-5">
                <h3
                  className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-lg text-club-ink`}
                >
                  {pillar.label}
                </h3>
                <p className="text-sm text-mute">{pillar.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The seven services */}
      <section className="shell py-12 md:py-16" aria-labelledby="club-services">
        <SectionHeading
          locale={locale}
          tone="club"
          eyebrow={dict.club.services.eyebrow}
          title={dict.club.services.headline}
          body={dict.club.services.body}
          id="club-services"
        />
        <div className="mt-8">
          <ServiceSections
            services={clubServices}
            locale={locale}
            tone="club"
            mediaPendingLabel={dict.common.mediaPending}
            pageMedia={pageMedia}
          />
        </div>
      </section>

      {/* Season workflow + matchweek calendar */}
      <section className="shell py-16 md:py-24" aria-labelledby="club-workflow">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              locale={locale}
              tone="club"
              eyebrow={dict.club.workflow.eyebrow}
              title={dict.club.workflow.headline}
              body={dict.club.workflow.body}
              id="club-workflow"
            />
          </div>
          <div className="lg:col-span-7">
            <StageTimeline stages={clubSeasonWorkflow} locale={locale} tone="club" />
          </div>
        </div>

        <div className="mt-16">
          <SectionHeading
            locale={locale}
            tone="club"
            eyebrow={dict.club.calendar.eyebrow}
            title={dict.club.calendar.headline}
            body={dict.club.calendar.body}
            size="md"
          />
          <div className="mt-8">
            <PlanBoard
              columns={clubMatchweekCalendar}
              locale={locale}
              tone="club"
              note={dict.club.calendar.note}
            />
          </div>
        </div>
      </section>

      {/* Related club work */}
      {clubProjects.length > 0 ? (
        <section className="shell py-16 md:py-24" aria-labelledby="club-gallery">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              locale={locale}
              tone="club"
              eyebrow={dict.club.gallery.eyebrow}
              title={dict.club.gallery.headline}
              id="club-gallery"
            />
            <PrimaryCTA
              href={`${pathFor(locale, 'work')}?filter=club`}
              variant="outline"
              className="shrink-0 self-start md:self-auto"
            >
              {dict.common.viewAllWork}
            </PrimaryCTA>
          </div>

          <Reveal className="mt-12">
            <ProjectGrid projects={clubProjects} locale={locale} />
          </Reveal>
        </section>
      ) : null}

      <FinalCTA
        locale={locale}
        tone="club"
        headline={dict.club.cta.headline}
        body={dict.club.cta.body}
      />
    </>
  );
}
