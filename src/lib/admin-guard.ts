import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { isAdminConfigured } from './admin-auth';
import { readCookie, sessionCookieName, verifySessionValue } from './admin-session';
import { clientKey, createRateLimiter } from './rate-limit';
import { readSiteIndex } from './campaigns';
import { projects } from '@/content/projects';
import type { RouteKey } from '@/content/site';
import { locales, pathFor } from './i18n';

/* ==========================================================================
   Shared guards for the admin API routes.
   ========================================================================== */

const rateLimited = createRateLimiter({ windowMs: 60_000, max: 30 });

/** Rate limit first, so the session cookie cannot be brute-forced cheaply. */
export function guardAdmin(request: Request): NextResponse | null {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json({ ok: false, error: 'rate-limited' }, { status: 429 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'admin-not-configured',
        message: 'ADMIN_MEDIA_TOKEN is unset or too short. See .env.example.',
      },
      { status: 503 },
    );
  }

  if (!verifySessionValue(readCookie(request, sessionCookieName))) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }

  return null;
}

/**
 * A slug is only ever a campaign that exists — one declared in
 * `src/content/projects.ts` or one created in the tool. Checking against the
 * real list rather than a shape regex means a caller cannot invent a storage
 * path, however the string is spelled.
 */
export async function isKnownCampaign(slug: string): Promise<boolean> {
  if (projects.some((project) => project.slug === slug)) return true;
  const index = await readSiteIndex({ fresh: true });
  return index.campaigns[slug]?.origin === 'admin';
}

/** Publish a case study immediately rather than waiting out its revalidate window. */
export function refreshCampaign(slug: string): void {
  for (const locale of locales) revalidatePath(pathFor(locale, 'work', slug));
}

/**
 * Covers appear on every project grid, not just the case study, so a cover
 * change has to refresh the pages that list campaigns as well.
 */
export function refreshCampaignListings(): void {
  for (const locale of locales) {
    revalidatePath(pathFor(locale, 'home'));
    revalidatePath(pathFor(locale, 'work'));
    revalidatePath(pathFor(locale, 'buildAClub'));
    revalidatePath(pathFor(locale, 'buildAGame'));
  }
}

/** Which route each copy namespace and media group publishes to. */
const editorRoutes: Record<string, RouteKey[]> = {
  home: ['home'],
  about: ['about'],
  club: ['buildAClub'],
  game: ['buildAGame'],
  work: ['work'],
  contact: ['contact'],
  privacy: ['privacy'],
};

/**
 * Publish one editor screen's pages in both locales.
 *
 * The home namespace owns the capability grid and the process timeline, which
 * the about page renders too, so that pairing refreshes both.
 */
export function refreshEditorScreen(namespace: string): void {
  const routes = editorRoutes[namespace];

  if (!routes) {
    refreshEverything();
    return;
  }

  for (const locale of locales) {
    for (const route of routes) revalidatePath(pathFor(locale, route));
    /* Capabilities and the process steps are shared between the two. */
    if (namespace === 'home') revalidatePath(pathFor(locale, 'about'));
  }
}

/**
 * Publish the whole site.
 *
 * Used for the header, footer, shared labels, brand artwork and site
 * settings — all of which render on every page, so anything narrower would
 * leave stale copy somewhere.
 */
export function refreshEverything(): void {
  /* Purge each locale's layout rather than listing routes: the header and
     footer render inside it, so a case study — whose path carries a slug and
     can never appear in a fixed list — would otherwise keep the old logo or
     the old navigation until its own revalidate window expired. */
  for (const locale of locales) revalidatePath(`/${locale}`, 'layout');
}
