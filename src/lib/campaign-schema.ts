import { z } from 'zod';
import { photoAspects } from './photo-schema';
import { projectCategories, workFilters } from '@/content/projects';

/* ==========================================================================
   Campaign overlays.

   `src/content/projects.ts` stays the source of truth for everything that
   shipped with the build. This file describes what the admin tool may say on
   top of it: a different display name, a different position, a cover photo —
   and, for campaigns created after launch, the whole (short) record.
   ========================================================================== */

const categoryKeys = Object.keys(projectCategories) as [string, ...string[]];

/** The cover as stored: a processed image plus the words it needs. */
export const campaignCoverSchema = z.object({
  url: z.string().url(),
  aspect: z.enum(photoAspects),
  altText: z.string().min(1),
  altTextZh: z.string().min(1),
  /**
   * Set when the cover was promoted from the gallery, so the tool can show
   * which photo is currently acting as cover. Absent for a dedicated upload.
   */
  fromPhotoId: z.string().optional(),
});

export type CampaignCover = z.infer<typeof campaignCoverSchema>;

/**
 * Everything the admin can say about one campaign.
 *
 * For a code-defined campaign every field is optional — it is a thin overlay.
 * For one created in the tool, `origin: 'admin'` marks it and the short-form
 * fields carry the whole record.
 */
export const campaignRecordSchema = z.object({
  origin: z.enum(['code', 'admin']).default('code'),

  /** Display name only. The slug is the URL and never changes. */
  title: z.string().optional(),
  titleZh: z.string().optional(),

  /** Position on /work and in every project grid. Lower sorts first. */
  order: z.number().optional(),

  cover: campaignCoverSchema.optional(),

  /* --- Admin-created campaigns only ------------------------------------ */
  clientName: z.string().optional(),
  clientNameZh: z.string().optional(),
  category: z.enum(categoryKeys).optional(),
  filters: z.array(z.enum(workFilters)).optional(),
  summary: z.string().optional(),
  summaryZh: z.string().optional(),
  year: z.string().optional(),
  createdAt: z.string().optional(),
});

export type CampaignRecord = z.infer<typeof campaignRecordSchema>;

/**
 * The whole index, read once per page render.
 *
 * Untrusted input — it comes back from object storage — so it is parsed, not
 * cast. `version` exists so a future format change is detected rather than
 * silently mis-read.
 */
export const siteIndexSchema = z.object({
  version: z.literal(1),
  campaigns: z.record(z.string(), campaignRecordSchema),
});

export type SiteIndex = z.infer<typeof siteIndexSchema>;

export const emptySiteIndex = (): SiteIndex => ({ version: 1, campaigns: {} });

/* ==========================================================================
   Admin payloads
   ========================================================================== */

const bilingual = (label: string) => ({
  en: z.string().trim().min(1, `${label} is required in English.`).max(160),
  zh: z.string().trim().min(1, `${label} is required in Chinese.`).max(160),
});

/** Renaming and reordering, sent as the complete list the tool is showing. */
export const campaignOrderSchema = z.object({
  campaigns: z
    .array(
      z.object({
        slug: z.string().min(1),
        title: z.string().trim().min(1).max(160),
        titleZh: z.string().trim().min(1).max(160),
      }),
    )
    .max(200),
});

/**
 * A campaign created in the tool.
 *
 * Both languages are required on every field. That requirement is doing real
 * work: code-defined campaigns get their English/Chinese parity enforced by
 * the compiler (`zh-hk.ts` is typed as `typeof en`), and a record created at
 * runtime has no such backstop. This schema is the replacement, so nothing
 * here may become optional.
 */
export const newCampaignSchema = z.object({
  title: bilingual('Campaign name').en,
  titleZh: bilingual('Campaign name').zh,
  clientName: bilingual('Client').en,
  clientNameZh: bilingual('Client').zh,
  summary: z
    .string()
    .trim()
    .min(1, 'Summary is required in English.')
    .max(400),
  summaryZh: z
    .string()
    .trim()
    .min(1, 'Summary is required in Chinese.')
    .max(400),
  category: z.enum(categoryKeys, { message: 'Choose a category.' }),
  filters: z.array(z.enum(workFilters)).min(1, 'Choose at least one filter.'),
  year: z.string().trim().max(20).optional().or(z.literal('')),
});

export type NewCampaignValues = z.infer<typeof newCampaignSchema>;

/**
 * Build the permanent URL segment from the campaign name.
 *
 * Called once, at creation. The result is the address forever after — renaming
 * changes the display name only, so nothing anyone linked ever breaks.
 */
export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
