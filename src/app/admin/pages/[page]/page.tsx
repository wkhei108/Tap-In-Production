import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import AdminChrome from '@/components/admin/AdminChrome';
import CopyEditor from '@/components/admin/CopyEditor';
import MediaSlotPanel from '@/components/admin/MediaSlotPanel';
import SocialRailPanel from '@/components/admin/SocialRailPanel';
import { sessionCookieName, verifySessionValue } from '@/lib/admin-session';
import { adminScreenFor } from '@/lib/admin-screens';
import { copyFieldsFor, copyValuesFor, readCopyOverlay } from '@/lib/copy';
import { mediaSlotsFor } from '@/lib/media-slots';
import { readSiteIndex } from '@/lib/campaigns';
import { mergeSocialPosts } from '@/lib/site-content';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';

// Reads the session cookie and live storage state, so never captured at build.
export const dynamic = 'force-dynamic';

export const metadata = { robots: { index: false, follow: false } };

/**
 * One editor screen per page of the public site.
 *
 * A single route rather than eight near-identical files: the screens differ
 * only in which slice of the content they own, and that is already described
 * in `admin-screens.ts`.
 */
export default async function AdminPageEditor({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const store = await cookies();

  if (!verifySessionValue(store.get(sessionCookieName)?.value ?? null)) {
    redirect('/admin/login');
  }

  const { page } = await params;
  const screen = adminScreenFor(page);
  if (!screen) notFound();

  const storageConfigured = isPhotoStorageConfigured();

  /* One read of each document serves the whole screen. */
  const overlay = await readCopyOverlay({ fresh: true });
  const index = await readSiteIndex({ fresh: true });

  const fields = copyFieldsFor(screen.namespace);
  const values = copyValuesFor(overlay, screen.namespace);
  const slots = screen.mediaGroup ? mediaSlotsFor(screen.mediaGroup) : [];

  return (
    <div className="min-h-svh">
      <AdminChrome title={screen.label} current={screen.href} blurb={screen.blurb} />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8">
        {screen.note ? (
          <p className="rounded-xs border border-line bg-surface px-4 py-3 text-xs text-mute">
            {screen.note}
          </p>
        ) : null}

        {slots.length > 0 ? (
          <MediaSlotPanel
            slots={slots}
            initialMedia={index.pageMedia ?? {}}
            storageConfigured={storageConfigured}
          />
        ) : null}

        {screen.namespace === 'home' ? (
          <SocialRailPanel
            initialPosts={mergeSocialPosts(index)}
            storageConfigured={storageConfigured}
          />
        ) : null}

        <CopyEditor
          namespace={screen.namespace}
          fields={fields}
          stored={{ en: values.en, zh: values['zh-hk'] }}
          storageConfigured={storageConfigured}
        />
      </main>
    </div>
  );
}
