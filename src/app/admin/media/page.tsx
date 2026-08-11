import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import MediaLibrary from '@/components/admin/MediaLibrary';
import SignOutButton from '@/components/admin/SignOutButton';
import { sessionCookieName, verifySessionValue } from '@/lib/admin-session';
import { isPhotoStorageConfigured, readManifest } from '@/lib/photo-storage';
import { getAllProjects } from '@/content/projects';

// Reads the session cookie and environment state, so never captured at build.
export const dynamic = 'force-dynamic';

export default async function AdminMediaPage() {
  const store = await cookies();

  // Gate here rather than in the client: an unauthenticated visitor should
  // never receive the tool's markup at all.
  if (!verifySessionValue(store.get(sessionCookieName)?.value ?? null)) {
    redirect('/admin/login');
  }

  const projects = getAllProjects().map((project) => ({
    slug: project.slug,
    title: project.title,
    /* The crops already declared in src/content/projects.ts. The running-order
       preview needs them to show the real layout — managed photos sit either
       side of these, not in a list of their own. */
    builtIn: project.gallery.map((item) => item.aspect),
  }));

  /* Load the first project's photos here rather than in a client effect: the
     tool opens already populated, and there is no loading flash. */
  const initialSlug = projects[0]?.slug ?? '';
  const initialItems = initialSlug ? (await readManifest(initialSlug, { fresh: true })).items : [];

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-lime">
              TAP IN.
            </span>
            <h1 className="font-mono text-sm text-bone">Media library</h1>
          </div>
          <SignOutButton />
        </div>
      </header>

      <MediaLibrary
        projects={projects}
        initialSlug={initialSlug}
        initialItems={initialItems}
        storageConfigured={isPhotoStorageConfigured()}
      />
    </div>
  );
}
