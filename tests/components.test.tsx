import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ProjectCard from '@/components/work/ProjectCard';
import ProjectFilters from '@/components/work/ProjectFilters';
import CapabilityGrid from '@/components/home/CapabilityGrid';
import MediaFrame from '@/components/media/MediaFrame';
import SectionHeading from '@/components/ui/SectionHeading';
import { getProjectBySlug, workFilters, type WorkFilter } from '@/content/projects';
import { en } from '@/content/en';

const project = getProjectBySlug('club-season-content-programme')!;

const filterLabels = Object.fromEntries(
  workFilters.map((f) => [f, en.work.filters[f as keyof typeof en.work.filters]]),
) as Record<WorkFilter, string>;

const counts = Object.fromEntries(workFilters.map((f) => [f, 2])) as Record<WorkFilter, number>;

describe('ProjectCard', () => {
  it('renders the English title as a link to the case study', async () => {
    render(await ProjectCard({ project, locale: 'en' }));
    const link = screen.getByRole('link', { name: project.title });
    expect(link).toHaveProperty('href');
    expect(link.getAttribute('href')).toBe('/en/work/club-season-content-programme');
  });

  it('renders Traditional Chinese copy and a zh-hk link', async () => {
    render(await ProjectCard({ project, locale: 'zh-hk' }));
    expect(screen.getByRole('link', { name: project.titleZh })).toBeTruthy();
    expect(screen.getByRole('link', { name: project.titleZh }).getAttribute('href')).toBe(
      '/zh-hk/work/club-season-content-programme',
    );
  });

  it('labels sample entries so they cannot read as real client work', async () => {
    render(await ProjectCard({ project, locale: 'en' }));
    expect(screen.getByText(en.common.sampleBadge)).toBeTruthy();
  });

  it('omits the year when none has been confirmed', async () => {
    const { container } = render(await ProjectCard({ project, locale: 'en' }));
    expect(container.textContent).not.toMatch(/\b20\d{2}\b/);
  });
});

describe('MediaFrame', () => {
  it('falls back to an accessible branded panel when no asset is supplied', () => {
    render(<MediaFrame alt="Matchday photograph placeholder" aspect="landscape" />);
    const panel = screen.getByRole('img', { name: 'Matchday photograph placeholder' });
    expect(panel).toBeTruthy();
  });

  it('labels the placeholder without pointing at a file path', () => {
    /* Media is uploaded through the admin now, so printing a `/public` path
       told the operator to do something that would not work. */
    const { container } = render(<MediaFrame alt="Cover" placeholderLabel="Media pending" />);

    expect(screen.getByText('Media pending')).toBeTruthy();
    expect(container.querySelector('code')).toBeNull();
  });

  it('renders an image when the asset exists', () => {
    render(<MediaFrame src="/media/projects/demo/cover.webp" alt="A real cover" />);
    expect(screen.getByRole('img', { name: 'A real cover' }).tagName).toBe('IMG');
  });
});

describe('ProjectFilters', () => {
  it('renders one button per filter inside a labelled group', () => {
    render(
      <ProjectFilters
        active="all"
        onChange={() => {}}
        labels={filterLabels}
        groupLabel="Filter work by category"
        counts={counts}
      />,
    );

    const group = screen.getByRole('group', { name: 'Filter work by category' });
    expect(within(group).getAllByRole('button')).toHaveLength(workFilters.length);
  });

  it('marks the active filter with aria-pressed rather than colour alone', () => {
    render(
      <ProjectFilters
        active="branding"
        onChange={() => {}}
        labels={filterLabels}
        groupLabel="Filter work by category"
        counts={counts}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Branding/ }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getByRole('button', { name: /^All/ }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });
});

describe('CapabilityGrid', () => {
  it('shows every capability without hiding any behind an interaction', async () => {
    render(await CapabilityGrid({ locale: 'en' }));
    for (const heading of ['Content', 'Production', 'Brand', 'Events']) {
      expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
    }
    expect(screen.getByText('Match photography')).toBeTruthy();
    expect(screen.getByText('Fan-zone activation')).toBeTruthy();
  });

  it('renders the Traditional Chinese capability list', async () => {
    render(await CapabilityGrid({ locale: 'zh-hk' }));
    expect(screen.getByRole('heading', { name: '製作' })).toBeTruthy();
    expect(screen.getByText('比賽攝影')).toBeTruthy();
  });
});

describe('SectionHeading', () => {
  it('renders an h2 by default with the eyebrow and body copy', () => {
    render(
      <SectionHeading
        locale="en"
        eyebrow="Capabilities"
        title="What we actually do."
        body="Four disciplines, one team."
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'What we actually do.' })).toBeTruthy();
    expect(screen.getByText('Capabilities')).toBeTruthy();
  });

  it('uses the CJK display treatment for Chinese, not uppercase Latin', () => {
    render(<SectionHeading locale="zh-hk" title="我們實際負責的事。" />);
    const heading = screen.getByRole('heading', { name: '我們實際負責的事。' });
    expect(heading.className).toContain('display-cjk');
    expect(heading.className).not.toContain('display ');
  });
});
