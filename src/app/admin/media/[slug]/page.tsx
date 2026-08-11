import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import MediaLibrary from '@/components/admin/MediaLibrary';
import SignOutButton from '@/components/admin/SignOutButton';
import { adminGhostButton } from '@/components/admin/admin-ui';
import { sessionCookieName, verifySessionValue } from '@/lib/admin-session';
import { readSiteIndex, resolveProjects } from '@/lib/campaigns';
import { isPhotoStorageConfigured, readManifest } from '@/lib/photo-storage';

// Reads the session cookie and live storage state, so never captured at build.
export const dynamic = 'force-dynamic';

export default async function AdminCampaignMediaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const store = await cookies();

  if (!verifySessionValue(store.get(sessionCookieName)?.value ?? null)) {
    redirect('/admin/login');
  }

  const { slug } = await params;
  const index = await readSiteIndex({ fresh: true });
  const resolved = await resolveProjects(index);
  const current = resolved.find((project) => project.slug === slug);
  if (!current) notFound();

  /* The whole list still travels: the library's rail lets you hop between
     campaigns without going back to the overview. */
  const projects = resolved.map((project) => ({
    slug: project.slug,
    title: project.title,
    builtIn: project.gallery.map((item) => item.aspect),
  }));

  const initialItems = (await readManifest(slug, { fresh: true })).items;

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-lime">
              TAP IN.
            </span>
            <h1 className="truncate font-mono text-sm text-bone">{current.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/admin" className={adminGhostButton}>
              <ArrowLeft aria-hidden="true" className="size-3.5" /> Campaigns
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <MediaLibrary
        projects={projects}
        initialSlug={slug}
        initialItems={initialItems}
        initialCover={index.campaigns[slug]?.cover ?? null}
        storageConfigured={isPhotoStorageConfigured()}
      />
    </div>
  );
}
