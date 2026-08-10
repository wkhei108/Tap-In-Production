import { NextResponse } from 'next/server';
import { createContactSchema, toFieldErrors } from '@/lib/contact-schema';
import { deliverEnquiry } from '@/lib/mailer';
import { getDictionary } from '@/content/dictionaries';
import { isLocale, defaultLocale, type Locale } from '@/lib/i18n';

export const runtime = 'nodejs';
/** Never cached — this route only ever handles POSTs. */
export const dynamic = 'force-dynamic';

/**
 * Very small in-memory rate limit.
 *
 * Enough to blunt casual form spam on a single instance. It is intentionally
 * not a distributed limiter — if TAP IN. ever needs that, put it at the edge
 * or in front of the app rather than here.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  if (entry.count > MAX_PER_WINDOW) return true;

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 500) {
    for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
  }

  return false;
}

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

  const dict = getDictionary(requestedLocale);
  const schema = createContactSchema(requestedLocale);
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

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (rateLimited(ip)) {
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
