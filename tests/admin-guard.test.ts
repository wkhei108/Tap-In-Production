// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

/* ==========================================================================
   `revalidatePath(path, 'layout')` matches against the route *file pattern*
   registered at build time — `app/[locale]/layout.tsx` is registered as the
   literal string `/[locale]`, brackets included — not against a resolved URL.
   `revalidatePath('/en', 'layout')` looks correct and returns successfully,
   but matches nothing that was ever cached under it, so the call is a
   silent no-op: the site keeps serving what it served before, indefinitely.

   That shipped once already (a logo replaced through the admin never
   appeared, no matter how many times it was re-uploaded) and every test in
   the suite still passed, because nothing asserted what `revalidatePath` was
   actually called with. These pin the exact arguments so the same class of
   bug fails loudly next time.
   ========================================================================== */

const revalidatePath = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));

afterEach(() => {
  revalidatePath.mockClear();
  vi.resetModules();
});

describe('refreshEverything', () => {
  it('revalidates the locale layout by its route pattern, not a resolved URL', async () => {
    const { refreshEverything } = await import('@/lib/admin-guard');
    refreshEverything();

    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/[locale]', 'layout');
  });

  it('never calls revalidatePath with a resolved locale segment', async () => {
    const { refreshEverything } = await import('@/lib/admin-guard');
    refreshEverything();

    for (const call of revalidatePath.mock.calls) {
      expect(call[0]).not.toBe('/en');
      expect(call[0]).not.toBe('/zh-hk');
    }
  });
});

describe('refreshEditorScreen', () => {
  it('revalidates literal resolved paths for a known namespace, in both locales', async () => {
    const { refreshEditorScreen } = await import('@/lib/admin-guard');
    refreshEditorScreen('contact');

    expect(revalidatePath).toHaveBeenCalledWith('/en/contact');
    expect(revalidatePath).toHaveBeenCalledWith('/zh-hk/contact');
    /* Literal paths take no type argument — that form needs none. */
    expect(revalidatePath.mock.calls.every((call) => call.length === 1)).toBe(true);
  });

  it('also refreshes About, since Home owns the shared capability grid', async () => {
    const { refreshEditorScreen } = await import('@/lib/admin-guard');
    refreshEditorScreen('home');

    /* `home`'s route segment is empty, so its own path resolves to `/en`. */
    expect(revalidatePath).toHaveBeenCalledWith('/en');
    expect(revalidatePath).toHaveBeenCalledWith('/en/about');
    expect(revalidatePath).toHaveBeenCalledWith('/zh-hk/about');
  });

  it('falls back to the full-site refresh for a namespace it does not recognise', async () => {
    const { refreshEditorScreen } = await import('@/lib/admin-guard');
    refreshEditorScreen('not-a-real-namespace');

    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/[locale]', 'layout');
  });
});

describe('refreshCampaign', () => {
  it('revalidates the case study in both locales', async () => {
    const { refreshCampaign } = await import('@/lib/admin-guard');
    refreshCampaign('demo-slug');

    expect(revalidatePath).toHaveBeenCalledWith('/en/work/demo-slug');
    expect(revalidatePath).toHaveBeenCalledWith('/zh-hk/work/demo-slug');
  });
});
