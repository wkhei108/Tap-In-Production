import { z } from 'zod';
import { en } from '@/content/en';

/* ==========================================================================
   Option sets — the single source of truth for the <select> fields and for
   server-side validation, so the two can never disagree.
   ========================================================================== */

export const serviceOptions = [
  'build-a-club',
  'build-a-game',
  'social-media',
  'photography',
  'video',
  'branding',
  'event-production',
  'sponsorship-activation',
  'not-sure',
] as const;

export const projectTypeOptions = [
  'club',
  'league',
  'corporate',
  'school',
  'brand',
  'other',
] as const;

export const budgetOptions = [
  'undisclosed',
  'exploring',
  'single-shoot',
  'short-campaign',
  'season-or-event',
] as const;

export const referralOptions = [
  'instagram',
  'referral',
  'matchday',
  'search',
  'other',
] as const;

export type ServiceOption = (typeof serviceOptions)[number];
export type ProjectTypeOption = (typeof projectTypeOptions)[number];
export type BudgetOption = (typeof budgetOptions)[number];
export type ReferralOption = (typeof referralOptions)[number];

/**
 * Bilingual schema factory.
 *
 * The same schema runs in the browser and on the server, so the visitor sees
 * the identical message in their own language either way.
 */
/**
 * The validation strings, which are themselves editable.
 *
 * Passed in rather than looked up: the form is a client component and the
 * route is a server one, so neither can share a synchronous dictionary — but
 * both already hold the resolved copy for the locale they are working in.
 */
export type ContactValidationMessages = typeof en.contact.validation;

export function createContactSchema(messages: ContactValidationMessages) {

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, messages.nameRequired)
      .max(80, messages.nameTooLong),

    organisation: z
      .string()
      .trim()
      .min(1, messages.organisationRequired)
      .max(120, messages.organisationTooLong),

    email: z
      .string()
      .trim()
      .min(1, messages.emailRequired)
      .email(messages.emailInvalid)
      .max(160, messages.emailInvalid),

    phone: z.string().trim().max(40, messages.phoneTooLong).optional().or(z.literal('')),

    service: z.enum(serviceOptions, { message: messages.serviceRequired }),

    projectType: z.enum(projectTypeOptions, { message: messages.projectTypeRequired }),

    // A native date input yields YYYY-MM-DD, or an empty string when untouched.
    preferredDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, messages.dateInvalid)
      .optional()
      .or(z.literal('')),

    budget: z.enum(budgetOptions).optional().or(z.literal('')),

    referral: z.enum(referralOptions).optional().or(z.literal('')),

    details: z
      .string()
      .trim()
      .min(1, messages.detailsRequired)
      .min(12, messages.detailsTooShort)
      .max(4000, messages.detailsTooLong),

    consent: z.literal(true, { message: messages.consentRequired }),

    /**
     * Honeypot. Real visitors never see this field, so anything in it is a
     * bot.
     *
     * Deliberately permissive: rejecting it here would return a 400 naming
     * the field, which teaches a bot exactly what to skip next time. The API
     * route accepts the submission, answers like a success, and sends
     * nothing.
     */
    website: z.string().max(200).optional().or(z.literal('')),

    locale: z.enum(['en', 'zh-hk']),
  });
}

export type ContactSchema = ReturnType<typeof createContactSchema>;
export type ContactFormValues = z.infer<ContactSchema>;

/** Field keys, used to map server errors back onto inputs. */
export type ContactField = keyof ContactFormValues;

/** Flatten Zod issues into `{ field: message }` for the form UI. */
export function toFieldErrors(
  error: z.ZodError<ContactFormValues>,
): Partial<Record<ContactField, string>> {
  const result: Partial<Record<ContactField, string>> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in result)) {
      result[key as ContactField] = issue.message;
    }
  }

  return result;
}
