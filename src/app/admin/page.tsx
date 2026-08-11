import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import CampaignsOverview from '@/components/admin/CampaignsOverview';
import SignOutButton from '@/components/admin/SignOutButton';
import { sessionCookieName, verifySessionValue } from '@/lib/admin-session';
import { mergeCategories, readSiteIndex, resolveProjects } from '@/lib/campaigns';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';

// Reads the session cookie and live storage state, so never captured at build.
export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const store = await cookies();

  if (!verifySessionValue(store.get(sessionCookieName)?.value ?? null)) {
    redirect('/admin/login');
  }

  /* One index read serves the whole screen: the campaign list, the category
     set, and the hero all live in it. */
  const index = await readSiteIndex({ fresh: true });
  const resolved = await resolveProjects(index);

  const campaigns = resolved.map((project) => ({
    slug: project.slug,
    title: project.title,
    titleZh: project.titleZh,
    clientName: project.client.en,
    clientNameZh: project.client['zh-hk'],
    summary: project.summary,
    summaryZh: project.summaryZh,
    category: project.category as string,
    filters: project.filters,
    year: project.year ?? '',
    coverUrl: project.coverImage ?? null,
    hasCover: Boolean(project.coverImage),
    origin: (index.campaigns[project.slug]?.origin === 'admin' ? 'admin' : 'code') as
      | 'admin'
      | 'code',
  }));

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-lime">
              TAP IN.
            </span>
            <h1 className="font-mono text-sm text-bone">Campaigns</h1>
          </div>
          <SignOutButton />
        </div>
      </header>

      <CampaignsOverview
        initialCampaigns={campaigns}
        initialCategories={mergeCategories(index)}
        initialHero={index.hero ?? null}
        storageConfigured={isPhotoStorageConfigured()}
      />
    </div>
  );
}
