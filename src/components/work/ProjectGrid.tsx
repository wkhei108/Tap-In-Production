import ProjectCard from './ProjectCard';
import type { Project } from '@/content/projects';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Editorial grid.
 *
 * Column spans follow a repeating 7/5 → 5/7 rhythm rather than a uniform
 * card wall, and each project keeps its own crop (portrait, square or
 * landscape), so the page reads like a contact sheet instead of a template.
 */
const spans = [
  'md:col-span-7',
  'md:col-span-5',
  'md:col-span-5',
  'md:col-span-7',
  'md:col-span-6',
  'md:col-span-6',
];

export default function ProjectGrid({
  projects,
  locale,
  className,
}: {
  projects: Project[];
  locale: Locale;
  className?: string;
}) {
  return (
    <ul className={cn('grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-12 md:gap-y-16', className)}>
      {projects.map((project, index) => (
        <li key={project.slug} className={spans[index % spans.length]}>
          <ProjectCard
            project={project}
            locale={locale}
            emphasis={index % 6 === 0 || index % 6 === 3 ? 'feature' : 'standard'}
            priority={index < 2}
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </li>
      ))}
    </ul>
  );
}
