import { site } from '@/content/site';
import type { ContactFormValues } from './contact-schema';
import { getDictionary } from '@/content/dictionaries';
import type { Locale } from './i18n';

export type DeliveryResult =
  | { ok: true; provider: 'resend' | 'console' }
  | { ok: false; provider: 'resend' | 'console' | 'none'; reason: string };

/**
 * Email provider adapter.
 *
 * Resend is used when `RESEND_API_KEY` is set; otherwise the payload is logged
 * and the route reports that delivery is not configured. The development
 * fallback never reports success for an email that was not actually sent —
 * that is the difference between a working form and a form that looks like it
 * works.
 *
 * Calling the Resend REST API directly keeps an SDK out of the bundle; there
 * is nothing here a dependency would do for us.
 */
export async function deliverEnquiry(values: ContactFormValues): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL ?? site.email;
  const from = process.env.CONTACT_FROM_EMAIL ?? 'TAP IN. Website <onboarding@resend.dev>';

  const subject = `New enquiry — ${values.organisation} (${values.service})`;
  const text = renderPlainText(values);

  if (!apiKey) {
    // Development fallback. Deliberately loud, and explicitly not a success.
    console.warn(
      '[TAP IN.] Email delivery is not configured (RESEND_API_KEY is unset). ' +
        'The enquiry below was NOT sent. See README.md → Contact form.',
    );
    console.info(`[TAP IN.] To: ${to}\nSubject: ${subject}\n\n${text}`);

    return {
      ok: false,
      provider: 'console',
      reason: 'email-not-configured',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: values.email,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('[TAP IN.] Resend rejected the enquiry:', response.status, body);
      return { ok: false, provider: 'resend', reason: `resend-${response.status}` };
    }

    return { ok: true, provider: 'resend' };
  } catch (error) {
    console.error('[TAP IN.] Enquiry delivery failed:', error);
    return { ok: false, provider: 'resend', reason: 'network-error' };
  }
}

/** Human-readable enquiry, labelled in the language the visitor used. */
function renderPlainText(values: ContactFormValues): string {
  const locale = values.locale as Locale;
  const dict = getDictionary(locale);
  const form = dict.contact.form;
  const options = dict.contact.options;

  const rows: Array<[string, string]> = [
    [form.name, values.name],
    [form.organisation, values.organisation],
    [form.email, values.email],
    [form.phone, values.phone || '—'],
    [form.serviceInterest, options.service[values.service]],
    [form.projectType, options.projectType[values.projectType]],
    [form.preferredDate, values.preferredDate || '—'],
    [form.budget, values.budget ? options.budget[values.budget] : '—'],
    [form.referral, values.referral ? options.referral[values.referral] : '—'],
  ];

  const table = rows.map(([label, value]) => `${label}: ${value}`).join('\n');

  return [
    `New project enquiry via ${site.url}`,
    `Locale: ${values.locale}`,
    '',
    table,
    '',
    `${form.details}:`,
    values.details,
    '',
    `Consent given: yes`,
  ].join('\n');
}
