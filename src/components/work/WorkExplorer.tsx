'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import ProjectFilters from './ProjectFilters';
import ProjectCard from './ProjectCard';
import {
  filterProjects,
  workFilters,
  type Project,
  type WorkFilter,
} from '@/content/projects';
import { format } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

type Props = {
  projects: Project[];
  locale: Locale;
  labels: Record<WorkFilter, string>;
  groupLabel: string;
  countTemplate: string;
  countOne: string;
  empty: string;
  emptyHint: string;
};

const spans = [
  'md:col-span-7',
  'md:col-span-5',
  'md:col-span-5',
  'md:col-span-7',
  'md:col-span-6',
  'md:col-span-6',
];

function isWorkFilter(value: string | null): value is WorkFilter {
  return value !== null && (workFilters as readonly string[]).includes(value);
}

/**
 * Filterable work index.
 *
 * The active filter lives in the query string, so a filtered view is
 * shareable and the browser back button behaves as expected. Filtering is
 * synchronous over data already on the page — nothing is fetched, so the grid
 * never shifts while results load.
 */
export default function WorkExplorer({
  projects,
  locale,
  labels,
  groupLabel,
  countTemplate,
  countOne,
  empty,
  emptyHint,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const paramFilter = searchParams.get('filter');
  const [active, setActive] = useState<WorkFilter>(
    isWorkFilter(paramFilter) ? paramFilter : 'all',
  );

  const counts = useMemo(() => {
    const entries = workFilters.map(
      (filter) => [filter, filterProjects(projects, filter).length] as const,
    );
    return Object.fromEntries(entries) as Record<WorkFilter, number>;
  }, [projects]);

  const visible = useMemo(() => filterProjects(projects, active), [projects, active]);

  const onChange = useCallback(
    (filter: WorkFilter) => {
      setActive(filter);
      const query = filter === 'all' ? '' : `?filter=${filter}`;
      // Keeps the filter shareable without moving the visitor's scroll position.
      router.replace(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router],
  );

  return (
    <>
      <ProjectFilters
        active={active}
        onChange={onChange}
        labels={labels}
        groupLabel={groupLabel}
        counts={counts}
      />

      <p aria-live="polite" className="meta mt-6 text-mute">
        {visible.length === 1
          ? countOne
          : format(countTemplate, { count: visible.length })}
      </p>

      {visible.length === 0 ? (
        <div className="mt-12 border border-line bg-surface/50 p-10 text-center">
          <p className="text-lead text-bone">{empty}</p>
          <p className="mt-2 text-sm text-mute">{emptyHint}</p>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-12 md:gap-y-16">
          {visible.map((project, index) => (
            <motion.li
              key={project.slug}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={spans[index % spans.length]}
            >
              <ProjectCard
                project={project}
                locale={locale}
                emphasis={index % 6 === 0 || index % 6 === 3 ? 'feature' : 'standard'}
                priority={index < 2}
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </motion.li>
          ))}
        </ul>
      )}
    </>
  );
}
