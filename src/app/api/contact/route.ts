import { NextResponse } from 'next/server';
import { createContactSchema, toFieldErrors } from '@/lib/contact-schema';
import { deliverEnquiry } from '@/lib/mailer';
import { resolveDictionary } from '@/lib/copy';
import { isLocale, defaultLocale, type Locale } from '@/lib/i18n';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
/** Never cached — this route only ever handles POSTs. */
export const dynamic = 'force-dynamic';

const rateLimited = createRateLimiter({ windowMs: 60_000, max: 5 });

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const requestedLocale =
    typeof payload === 'object' &&
    payload !== null &&
    'locale' in payload &&
    isLocale((payload as { locale?: string }).locale)
      ? ((payload as { locale: Locale }).locale)
      : defaultLocale;

  const dict = await resolveDictionary(requestedLocale);
  const schema = createContactSchema(dict.contact.validation);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'validation',
        fieldErrors: toFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  const values = parsed.data;

  /* Honeypot: a filled hidden field means a bot. Respond exactly like a
     success so the bot learns nothing, but send no email. */
  if (values.website) {
    return NextResponse.json({ ok: true, delivered: false, spam: true });
  }

  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      { ok: false, error: 'rate-limited', message: dict.contact.validation.rateLimited },
      { status: 429 },
    );
  }

  const result = await deliverEnquiry(values);

  if (!result.ok) {
    // The visitor is told the truth: nothing was delivered.
    return NextResponse.json(
      {
        ok: false,
        error: result.reason,
        message: dict.contact.validation.serverError,
      },
      { status: result.reason === 'email-not-configured' ? 503 : 502 },
    );
  }

  return NextResponse.json({ ok: true, delivered: true });
}
