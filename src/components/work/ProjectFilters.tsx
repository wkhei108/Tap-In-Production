'use client';

import { workFilters, type WorkFilter } from '@/content/projects';
import { cn } from '@/lib/utils';

type Props = {
  active: WorkFilter;
  onChange: (filter: WorkFilter) => void;
  labels: Record<WorkFilter, string>;
  groupLabel: string;
  counts: Record<WorkFilter, number>;
};

/**
 * Filter bar.
 *
 * Real <button>s in a labelled group, each carrying `aria-pressed` so the
 * active state is announced rather than being conveyed by colour alone. The
 * count is exposed to screen readers too, so an empty category is obvious
 * before it is selected.
 */
export default function ProjectFilters({
  active,
  onChange,
  labels,
  groupLabel,
  counts,
}: Props) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="-mx-[clamp(1.125rem,4vw,3.5rem)] flex gap-2 overflow-x-auto px-[clamp(1.125rem,4vw,3.5rem)] pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      {workFilters.map((filter) => {
        const isActive = filter === active;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            aria-pressed={isActive}
            className={cn(
              'tap relative shrink-0 rounded-xs border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200',
              isActive
                ? 'border-lime bg-lime text-ink'
                : 'border-line bg-transparent text-mute hover:border-line-strong hover:text-bone',
            )}
          >
            {labels[filter]}
            <span className="sr-only"> — {counts[filter]}</span>
          </button>
        );
      })}
    </div>
  );
}
