import { NextResponse } from 'next/server';

import {
  guardAdmin,
  isKnownCampaign,
  refreshCampaign,
  refreshCampaignListings,
} from '@/lib/admin-guard';
import {
  addCategory,
  createCampaign,
  mergeCategories,
  readSiteIndex,
  reorderCampaigns,
  resolveProjects,
  updateCampaign,
} from '@/lib/campaigns';
import {
  campaignReorderSchema,
  editCampaignSchema,
  newCampaignSchema,
  newCategorySchema,
} from '@/lib/campaign-schema';
import { toPhotoFieldErrors } from '@/lib/photo-schema';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function storageRequired() {
  return NextResponse.json(
    {
      ok: false,
      error: 'storage-not-configured',
      message: 'No Blob store is connected to this project. See .env.example.',
    },
    { status: 503 },
  );
}

/** Everything the overview screen needs, in one round trip. */
export async function GET(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const index = await readSiteIndex({ fresh: true });
  const resolved = await resolveProjects(index);

  return NextResponse.json({
    ok: true,
    storageConfigured: isPhotoStorageConfigured(),
    categories: mergeCategories(index),
    campaigns: resolved.map((project) => ({
      slug: project.slug,
      title: project.title,
      titleZh: project.titleZh,
      clientName: project.client.en,
      clientNameZh: project.client['zh-hk'],
      summary: project.summary,
      summaryZh: project.summaryZh,
      category: project.category,
      filters: project.filters,
      year: project.year ?? '',
      coverUrl: project.coverImage ?? null,
      // A managed cover is the only kind the tool can change; a path baked
      // into projects.ts still counts as "has a cover" for the flag.
      hasCover: Boolean(project.coverImage),
      origin: index.campaigns[project.slug]?.origin === 'admin' ? 'admin' : 'code',
    })),
  });
}

/** Create a campaign. The slug is derived from the name and then frozen. */
export async function POST(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;
  if (!isPhotoStorageConfigured()) return storageRequired();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  /* Adding a category shares this endpoint: it is a tiny write against the
     same index, and giving it its own route would duplicate all the guards. */
  if ((payload as { kind?: unknown } | null)?.kind === 'category') {
    const parsed = newCategorySchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const added = await addCategory(parsed.data.label, parsed.data.labelZh);
    if (!added.ok) {
      return NextResponse.json({ ok: false, error: added.reason }, { status: 502 });
    }

    const index = await readSiteIndex({ fresh: true });
    return NextResponse.json({ ok: true, key: added.data.key, categories: mergeCategories(index) });
  }

  const parsed = newCampaignSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const values = parsed.data;

  // Checked here rather than in the schema: categories can be added at
  // runtime, so the valid set is only knowable per request.
  const categories = mergeCategories(await readSiteIndex({ fresh: true }));
  if (!(values.category in categories)) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: { category: 'Unknown category.' } },
      { status: 400 },
    );
  }

  const created = await createCampaign({ ...values, year: values.year || undefined });
  if (!created.ok) {
    return NextResponse.json({ ok: false, error: created.reason }, { status: 502 });
  }

  refreshCampaign(created.data.slug);
  refreshCampaignListings();

  return NextResponse.json({ ok: true, slug: created.data.slug });
}

/** Edit a campaign's short-form fields. Never touches the long-form prose. */
export async function PUT(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;
  if (!isPhotoStorageConfigured()) return storageRequired();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const parsed = editCampaignSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { slug, ...values } = parsed.data;

  if (!(await isKnownCampaign(slug))) {
    return NextResponse.json({ ok: false, error: 'unknown-campaign' }, { status: 400 });
  }

  const categories = mergeCategories(await readSiteIndex({ fresh: true }));
  if (!(values.category in categories)) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: { category: 'Unknown category.' } },
      { status: 400 },
    );
  }

  const updated = await updateCampaign(slug, { ...values, year: values.year || undefined });
  if (!updated.ok) {
    return NextResponse.json({ ok: false, error: updated.reason }, { status: 502 });
  }

  refreshCampaign(slug);
  refreshCampaignListings();

  return NextResponse.json({ ok: true, slug });
}

/** Save a new running order across all campaigns. */
export async function PATCH(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;
  if (!isPhotoStorageConfigured()) return storageRequired();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const parsed = campaignReorderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'validation' }, { status: 400 });
  }

  const known = await resolveProjects();
  const valid = new Set(known.map((project) => project.slug));
  const slugs = parsed.data.slugs.filter((slug) => valid.has(slug));

  const result = await reorderCampaigns(slugs);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 502 });
  }

  refreshCampaignListings();

  return NextResponse.json({ ok: true });
}
