import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import AdminChrome from '@/components/admin/AdminChrome';
import SiteSettingsPanel from '@/components/admin/SiteSettingsPanel';
import { sessionCookieName, verifySessionValue } from '@/lib/admin-session';
import { readSiteIndex } from '@/lib/campaigns';
import { mergeSite } from '@/lib/site-content';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';

// Reads the session cookie and live storage state, so never captured at build.
export const dynamic = 'force-dynamic';

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminSettingsPage() {
  const store = await cookies();

  if (!verifySessionValue(store.get(sessionCookieName)?.value ?? null)) {
    redirect('/admin/login');
  }

  const index = await readSiteIndex({ fresh: true });

  return (
    <div className="min-h-svh">
      <AdminChrome
        title="Settings"
        current="/admin/settings"
        blurb="Name, contact details and brand artwork — all of it renders on every page."
      />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8">
        <SiteSettingsPanel
          initialSettings={mergeSite(index)}
          initialBrand={index.brand ?? {}}
          storageConfigured={isPhotoStorageConfigured()}
        />
      </main>
    </div>
  );
}
