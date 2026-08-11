import MediaManager from '@/components/admin/MediaManager';
import { isAdminConfigured } from '@/lib/admin-auth';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';
import { getAllProjects } from '@/content/projects';

// Reads environment state, so it must never be captured at build time.
export const dynamic = 'force-dynamic';

export default function AdminMediaPage() {
  const projects = getAllProjects().map((project) => ({
    slug: project.slug,
    title: project.title,
    /* The crops already declared in src/content/projects.ts. The running-order
       preview needs them to show the real layout — managed photos sit either
       side of these, not in a list of their own. */
    builtIn: project.gallery.map((item) => item.aspect),
  }));

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16">
      <h1 className="font-mono text-xl tracking-tight">TAP IN. — project photos</h1>
      <p className="mt-3 max-w-[62ch] text-sm text-mute">
        Photos added here appear in the case study gallery within a few minutes, without
        a code deploy. Everything already listed in{' '}
        <code className="text-bone/80">src/content/projects.ts</code> stays where it is —
        this only adds to it.
      </p>

      <MediaManager
        projects={projects}
        adminConfigured={isAdminConfigured()}
        storageConfigured={isPhotoStorageConfigured()}
      />
    </main>
  );
}
