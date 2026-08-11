import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import PageHero from '@/components/sections/PageHero';
import FinalCTA from '@/components/sections/FinalCTA';
import WorkExplorer from '@/components/work/WorkExplorer';
import ProjectGrid from '@/components/work/ProjectGrid';

import { getDictionary } from '@/content/dictionaries';
import { type WorkFilter } from '@/content/projects';
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
  const dict = getDictionary(raw);

  return buildMetadata({
    locale: raw,
    title: dict.work.meta.title,
    description: dict.work.meta.description,
    path: pathFor(raw, 'work'),
    pathForLocale: (l) => pathFor(l, 'work'),
  });
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const projects = await resolveProjects();

  const filterLabels: Record<WorkFilter, string> = {
    all: dict.work.filters.all,
    club: dict.work.filters.club,
    game: dict.work.filters.game,
    social: dict.work.filters.social,
    photography: dict.work.filters.photography,
    video: dict.work.filters.video,
    branding: dict.work.filters.branding,
    events: dict.work.filters.events,
  };

  return (
    <>
      <PageHero
        locale={locale}
        eyebrow={dict.work.eyebrow}
        headline={dict.work.headline}
        body={dict.work.body}
      />

      <section className="shell pb-8" aria-label={dict.a11y.projectFilters}>
        {/* The explorer reads the active filter from the query string, so it is
            wrapped in Suspense to keep this route statically rendered. The
            fallback is the complete, unfiltered grid — never a spinner. */}
        <Suspense
          fallback={<ProjectGrid projects={projects} locale={locale} className="mt-10" />}
        >
          <WorkExplorer
            projects={projects}
            locale={locale}
            labels={filterLabels}
            groupLabel={dict.work.filtersLabel}
            countTemplate={dict.work.count}
            countOne={dict.work.countOne}
            empty={dict.work.empty}
            emptyHint={dict.work.emptyHint}
          />
        </Suspense>
      </section>

      <FinalCTA
        locale={locale}
        headline={dict.home.finalCta.headline}
        body={dict.home.finalCta.body}
      />
    </>
  );
}
