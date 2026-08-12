import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import MediaVersions from '@/components/admin/MediaVersions';
import CopyHistory from '@/components/admin/CopyHistory';
import type { MediaVersion } from '@/lib/campaign-schema';
import type { CopySnapshot } from '@/lib/copy-schema';

const version = (over: Partial<MediaVersion> = {}): MediaVersion => ({
  id: 'v1',
  url: 'https://example.public.blob.vercel-storage.com/media/brand/logo-1.svg',
  replacedAt: new Date().toISOString(),
  reason: 'replaced',
  ...over,
});

const snapshot = (over: Partial<CopySnapshot> = {}): CopySnapshot => ({
  id: 's1',
  savedAt: new Date().toISOString(),
  changed: ['home.hero.headlineLineOne'],
  values: { en: {}, 'zh-hk': {} },
  ...over,
});

describe('MediaVersions', () => {
  it('stays out of the way when there is nothing to go back to', () => {
    const { container } = render(
      <MediaVersions historyKey="brand:logo" versions={[]} onRestored={() => {}} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('offers the versions it has, collapsed until asked', () => {
    render(
      <MediaVersions
        historyKey="brand:logo"
        versions={[version(), version({ id: 'v2' })]}
        onRestored={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: /Previous versions \(2\)/ })).toBeTruthy();
    /* Collapsed, so no restore buttons are reachable yet. */
    expect(screen.queryByRole('button', { name: 'Restore' })).toBeNull();
  });

  it('says whether a version was replaced or removed', () => {
    render(
      <MediaVersions
        historyKey="page:about.pov"
        versions={[version({ reason: 'removed' })]}
        onRestored={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Previous versions/ }));

    expect(screen.getByText(/Removed/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Restore/ })).toBeTruthy();
  });
});

describe('CopyHistory', () => {
  it('stays out of the way before anything has been published', () => {
    const { container } = render(
      <CopyHistory namespace="home" snapshots={[]} disabled={false} onRestored={() => {}} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('offers a one-click undo of the most recent publish', () => {
    render(
      <CopyHistory
        namespace="home"
        snapshots={[snapshot()]}
        disabled={false}
        onRestored={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: /Undo last publish/ })).toBeTruthy();
  });

  it('holds undo back while there are unsaved edits', () => {
    render(
      <CopyHistory
        namespace="home"
        snapshots={[snapshot()]}
        disabled
        onRestored={() => {}}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Undo last publish/ }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('lists the whole stack on request', () => {
    render(
      <CopyHistory
        namespace="home"
        snapshots={[snapshot(), snapshot({ id: 's2', changed: ['a', 'b'] })]}
        disabled={false}
        onRestored={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'All 2' }));

    expect(screen.getAllByRole('button', { name: /Restore this/ })).toHaveLength(2);
    expect(screen.getByText(/publish of 2 fields/)).toBeTruthy();
  });
});
