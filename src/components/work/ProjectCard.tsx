import Link from 'next/link';
import MediaFrame from '@/components/media/MediaFrame';
import DisplayText from '@/components/ui/DisplayText';
import { resolveDictionary } from '@/lib/copy';
import {
  categoryLabel,
  projectAlt,
  projectSummary,
  projectTitle,
  type Project,
} from '@/content/projects';
import { pathFor, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Props = {
  project: Project;
  locale: Locale;
  /** Editorial grid emphasis — `feature` spans wider and shows the summary. */
  emphasis?: 'feature' | 'standard';
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export default async function ProjectCard({
  project,
  locale,
  emphasis = 'standard',
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  priority = false,
  className,
}: Props) {
  const dict = await resolveDictionary(locale);
  const href = pathFor(locale, 'work', project.slug);

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <MediaFrame
        src={project.coverImage}
        alt={projectAlt(project, locale)}
        aspect={project.coverAspect}
        sizes={sizes}
        priority={priority}
        hoverZoom
        placeholderLabel={dict.common.mediaPending}
      />

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
            <span className="meta rounded-xs border border-line px-1.5 py-0.5 text-mute/80">
              {dict.common.sampleBadge}
            </span>
          ) : null}
        </div>

        <DisplayText
          as="h3"
          locale={locale}
          className={emphasis === 'feature' ? 'text-display-md' : 'text-display-sm'}
        >
          <Link
            href={href}
            className="wipe-link inline after:absolute after:inset-0 after:content-['']"
          >
            {projectTitle(project, locale)}
          </Link>
        </DisplayText>

        <p className="text-sm text-mute">{project.client[locale]}</p>

        {emphasis === 'feature' ? (
          <p className="mt-1 max-w-[52ch] text-sm text-mute/90">
            {projectSummary(project, locale)}
          </p>
        ) : null}
      </div>
    </article>
  );
}
