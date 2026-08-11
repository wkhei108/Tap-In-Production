import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import AdminChrome from '@/components/admin/AdminChrome';
import MediaLibrary from '@/components/admin/MediaLibrary';
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
      <AdminChrome
        title={current.title}
        current="/admin"
        blurb="Photos, running order and cover for this campaign."
      />

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
