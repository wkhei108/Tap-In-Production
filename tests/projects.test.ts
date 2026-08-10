import { describe, expect, it } from 'vitest';
import {
  filterProjects,
  getAllProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getRelatedProjects,
  projectSummary,
  projectTitle,
  workFilters,
  type WorkFilter,
} from '@/content/projects';
import { en } from '@/content/en';
import { zhHK } from '@/content/zh-hk';

describe('project filtering', () => {
  const projects = getAllProjects();

  it('returns everything for the "all" filter', () => {
    expect(filterProjects(projects, 'all')).toHaveLength(projects.length);
  });

  it('narrows to projects carrying the selected filter', () => {
    for (const filter of workFilters) {
      if (filter === 'all') continue;
      const result = filterProjects(projects, filter);
      expect(result.every((p) => p.filters.includes(filter))).toBe(true);
    }
  });

  it('does not mutate the source list', () => {
    const before = [...projects];
    filterProjects(projects, 'club');
    expect(getAllProjects()).toEqual(before);
  });

  it('finds club and event work', () => {
    expect(filterProjects(projects, 'club').length).toBeGreaterThan(0);
    expect(filterProjects(projects, 'game').length).toBeGreaterThan(0);
  });

  it('has a label for every filter in both dictionaries', () => {
    for (const filter of workFilters) {
      const key = filter as keyof typeof en.work.filters;
      expect(en.work.filters[key]).toBeTruthy();
      expect(zhHK.work.filters[key]).toBeTruthy();
    }
  });

  it('only uses filter keys the UI can render', () => {
    const known = new Set<WorkFilter>(workFilters);
    for (const project of projects) {
      for (const filter of project.filters) {
        expect(known.has(filter)).toBe(true);
      }
    }
  });
});

describe('project lookups', () => {
  it('finds a project by slug and returns undefined otherwise', () => {
    expect(getProjectBySlug('invitational-cup-production')?.slug).toBe(
      'invitational-cup-production',
    );
    expect(getProjectBySlug('does-not-exist')).toBeUndefined();
  });

  it('returns featured projects only, capped at the limit', () => {
    const featured = getFeaturedProjects(3);
    expect(featured).toHaveLength(3);
    expect(featured.every((p) => p.featured)).toBe(true);
  });

  it('excludes the current project from related work', () => {
    const related = getRelatedProjects('invitational-cup-production');
    expect(related.every((p) => p.slug !== 'invitational-cup-production')).toBe(true);
    expect(related.length).toBeGreaterThan(0);
  });

  it('returns localised titles and summaries', () => {
    const project = getProjectBySlug('club-season-content-programme')!;
    expect(projectTitle(project, 'en')).toBe(project.title);
    expect(projectTitle(project, 'zh-hk')).toBe(project.titleZh);
    expect(projectSummary(project, 'zh-hk')).toBe(project.summaryZh);
  });
});

describe('editorial integrity', () => {
  const projects = getAllProjects();

  it('has unique slugs', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('carries bilingual copy and alt text for every project', () => {
    for (const project of projects) {
      expect(project.titleZh.length).toBeGreaterThan(0);
      expect(project.summaryZh.length).toBeGreaterThan(0);
      expect(project.altText.length).toBeGreaterThan(0);
      expect(project.altTextZh.length).toBeGreaterThan(0);
      expect(project.deliverables.en.length).toBe(project.deliverables['zh-hk'].length);
      expect(project.services.en.length).toBe(project.services['zh-hk'].length);
    }
  });

  it('gives every gallery item alt text in both languages', () => {
    for (const project of projects) {
      for (const item of project.gallery) {
        expect(item.altText.length).toBeGreaterThan(0);
        expect(item.altTextZh.length).toBeGreaterThan(0);
      }
    }
  });

  /**
   * The brief is explicit: no invented results. Sample entries must not carry
   * outcomes or a year, so nothing on the site reads as a real engagement
   * until TAP IN. supplies verified detail.
   */
  it('publishes no outcomes or years for sample entries', () => {
    for (const project of projects.filter((p) => p.sample)) {
      expect(project.outcomes).toBeUndefined();
      expect(project.year).toBeUndefined();
    }
  });

  it('marks every current entry as a sample', () => {
    // Flip to false as real projects land; this test then guards the rest.
    expect(projects.every((p) => p.sample)).toBe(true);
  });
});
