import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import AdminChrome from '@/components/admin/AdminChrome';
import CampaignsOverview from '@/components/admin/CampaignsOverview';
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
      <AdminChrome
        title="Campaigns"
        current="/admin"
        blurb="Case studies, their covers and their photo galleries."
      />

      <CampaignsOverview
        initialCampaigns={campaigns}
        initialCategories={mergeCategories(index)}
        initialHero={index.hero ?? null}
        storageConfigured={isPhotoStorageConfigured()}
      />
    </div>
  );
}
