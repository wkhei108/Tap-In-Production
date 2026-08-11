import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import MediaFrame from '@/components/media/MediaFrame';
import ProjectGallery from '@/components/media/ProjectGallery';
import ProjectCard from '@/components/work/ProjectCard';
import DisplayText from '@/components/ui/DisplayText';
import FinalCTA from '@/components/sections/FinalCTA';
import PitchLinePattern from '@/components/ui/PitchLinePattern';

import { getDictionary } from '@/content/dictionaries';
import {
  categoryLabel,
  getAllProjects,
  getProjectBySlug,
  getRelatedProjects,
  projectAlt,
  projectSummary,
  projectTitle,
} from '@/content/projects';
import { isLocale, locales, pathFor, type Locale } from '@/lib/i18n';
import { breadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { readManifest } from '@/lib/photo-storage';
import { toMediaItem } from '@/lib/photo-schema';

/**
 * Case studies stay statically rendered; this window is how long a photo
 * uploaded through /admin/media can take to appear if the upload's own
 * `revalidatePath` call did not reach this deployment.
 */
export const revalidate = 300;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getAllProjects().map((project) => ({ locale, slug: project.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};

  const project = getProjectBySlug(slug);
  const dict = getDictionary(raw);
  if (!project) return { title: dict.project.notFoundTitle };

  return buildMetadata({
    locale: raw,
    title: `${projectTitle(project, raw)} — ${dict.project.metaSuffix}`,
    description: projectSummary(project, raw),
    path: pathFor(raw, 'work', project.slug),
    // The slug is shared across locales, which keeps the language switcher on
    // the same case study.
    pathForLocale: (l) => pathFor(l, 'work', project.slug),
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();

  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const related = getRelatedProjects(slug, 3);

  /* Photos uploaded through the admin tool surround the gallery declared in
     src/content/projects.ts: pinned ones lead, the rest follow. With no Blob
     store connected both lists are empty and the page renders exactly as it
     always has. */
  const managed = await readManifest(project.slug);
  const gallery = [
    ...managed.items.filter((photo) => photo.pinned).map(toMediaItem),
    ...project.gallery,
    ...managed.items.filter((photo) => !photo.pinned).map(toMediaItem),
  ];

  const breadcrumbs = breadcrumbJsonLd([
    { name: dict.nav.home, path: pathFor(locale, 'home') },
    { name: dict.nav.work, path: pathFor(locale, 'work') },
    { name: projectTitle(project, locale), path: pathFor(locale, 'work', project.slug) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      {/* 1. Full-width hero */}
      <section className="relative isolate overflow-hidden pt-28 md:pt-36">
        <PitchLinePattern variant="half" className="-z-10 opacity-40" />

        <div className="shell">
          <nav aria-label={dict.a11y.breadcrumb}>
            <Link
              href={pathFor(locale, 'work')}
              className="tap inline-flex items-center gap-2 text-sm text-mute transition-colors hover:text-lime"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {dict.common.backToWork}
            </Link>
          </nav>

          {/* 2. Title, client, year, category */}
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="meta text-lime">{categoryLabel(project.category, locale)}</span>
            {project.year ? (
              <>
                <span aria-hidden="true" className="text-mute/40">
                  ·
                </span>
                <span className="meta text-mute">{project.year}</span>
              </>
            ) : null}
            {project.sample ? (
              <span className="meta rounded-xs border border-line px-2 py-0.5 text-mute/80">
                {dict.common.sampleBadge}
              </span>
            ) : null}
          </div>

          <DisplayText as="h1" locale={locale} className="mt-5 max-w-[20ch] text-display-xl">
            {projectTitle(project, locale)}
          </DisplayText>

          {/* 3. Summary */}
          <p className="mt-6 max-w-[62ch] text-lead text-mute">
            {projectSummary(project, locale)}
          </p>

          {project.sample ? (
            <p className="mt-6 max-w-[62ch] border-l-2 border-lime/40 pl-5 text-sm text-mute/80">
              {dict.common.sampleNote}
            </p>
          ) : null}
        </div>

        <div className="shell mt-12">
          <MediaFrame
            src={project.coverImage}
            alt={projectAlt(project, locale)}
            aspect="landscape"
            sizes="100vw"
            priority
            placeholderLabel={dict.common.mediaPending}
            expectedPath={`/media/projects/${project.slug}/cover.webp`}
          />
        </div>
      </section>

      {/* Meta bar: client / services */}
      <section className="shell py-14 md:py-20">
        <dl className="grid gap-8 border-y border-line py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="meta text-mute/70">{dict.common.client}</dt>
            <dd className="mt-2 text-sm text-bone">{project.client[locale]}</dd>
          </div>
          <div>
            <dt className="meta text-mute/70">{dict.common.category}</dt>
            <dd className="mt-2 text-sm text-bone">
              {categoryLabel(project.category, locale)}
            </dd>
          </div>
          {project.year ? (
            <div>
              <dt className="meta text-mute/70">{dict.common.year}</dt>
              <dd className="mt-2 text-sm text-bone">{project.year}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2 lg:col-span-1">
            <dt className="meta text-mute/70">{dict.common.servicesDelivered}</dt>
            <dd className="mt-2">
              <ul className="flex flex-wrap gap-2">
                {project.services[locale].map((service) => (
                  <li
                    key={service}
                    className="rounded-xs border border-line px-2.5 py-1 text-xs text-bone/85"
                  >
                    {service}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        {/* 4–6. Brief, challenge, approach */}
        <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <h2 className="meta text-lime">{dict.common.brief}</h2>
            <p className="mt-4 text-lead text-bone/90">{project.brief[locale]}</p>
          </div>

          <div className="flex flex-col gap-10 lg:col-span-8">
            <div>
              <h2
                className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-display-sm`}
              >
                {dict.common.challenge}
              </h2>
              <p className="mt-3 max-w-[68ch] text-mute">{project.challenge[locale]}</p>
            </div>
            <div>
              <h2
                className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-display-sm`}
              >
                {dict.common.approach}
              </h2>
              <p className="mt-3 max-w-[68ch] text-mute">{project.approach[locale]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Gallery */}
      {gallery.length > 0 ? (
        <section className="shell py-10 md:py-14" aria-labelledby="project-gallery">
          <h2
            id="project-gallery"
            className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-display-sm`}
          >
            {dict.common.gallery}
          </h2>
          <div className="mt-8">
            <ProjectGallery
              items={gallery}
              locale={locale}
              slug={project.slug}
              labels={{
                open: dict.common.openLightbox,
                close: dict.common.closeLightbox,
                previous: dict.common.previousImage,
                next: dict.common.nextImage,
                position: dict.common.lightboxPosition,
                galleryLabel: dict.a11y.galleryLabel,
                mediaPending: dict.common.mediaPending,
                play: dict.common.playVideo,
                pause: dict.common.pauseVideo,
                noSupport: dict.common.videoNoSupport,
                transcript: dict.common.transcript,
              }}
            />
          </div>
        </section>
      ) : null}

      {/* 9. Deliverables + 10. Outcomes (rendered only when verified) */}
      <section className="shell py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <h2
              className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-display-sm`}
            >
              {dict.common.deliverables}
            </h2>
            <ul className="mt-6 flex flex-col">
              {project.deliverables[locale].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 border-b border-line py-3 text-sm text-bone/85"
                >
                  <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rotate-45 bg-lime" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6">
            {project.outcomes ? (
              <>
                <h2
                  className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-display-sm`}
                >
                  {dict.common.outcomes}
                </h2>
                <ul className="mt-6 flex flex-col">
                  {project.outcomes[locale].map((item) => (
                    <li
                      key={item}
                      className="border-b border-line py-3 text-sm text-bone/85"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              /* No verified results supplied — we state that plainly rather
                 than filling the space with generic claims. */
              <p className="border-l-2 border-line pl-5 text-sm text-mute/70">
                {dict.project.noOutcomesNote}
              </p>
            )}

            {project.credits ? (
              <div className="mt-10">
                <h2 className="meta text-mute/70">{dict.common.credits}</h2>
                <ul className="mt-3 flex flex-col gap-1 text-sm text-mute">
                  {project.credits[locale].map((credit) => (
                    <li key={credit}>{credit}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 11. Related projects */}
      {related.length > 0 ? (
        <section className="shell py-14 md:py-20" aria-labelledby="related-work">
          <h2
            id="related-work"
            className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-display-sm`}
          >
            {dict.common.relatedWork}
          </h2>
          <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <ProjectCard
                  project={item}
                  locale={locale}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 12. CTA */}
      <FinalCTA
        locale={locale}
        headline={dict.home.finalCta.headline}
        body={dict.home.finalCta.body}
      />
    </>
  );
}
