import { NextResponse } from 'next/server';

import { isAdminConfigured, isCorrectPassword } from '@/lib/admin-auth';
import { clearedSessionCookie, createSessionValue, sessionCookie } from '@/lib/admin-session';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Tighter than the media endpoints: this one guards the password itself, and
 * nobody signs in ten times a minute honestly.
 */
const rateLimited = createRateLimiter({ windowMs: 60_000, max: 10 });

/** Sign in — exchange the password for a session cookie. */
export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      { ok: false, error: 'rate-limited', message: 'Too many attempts. Wait a minute.' },
      { status: 429 },
    );
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'admin-not-configured',
        message: 'ADMIN_MEDIA_TOKEN is unset or too short. See .env.example.',
      },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const password = (payload as { password?: unknown } | null)?.password;

  if (typeof password !== 'string' || !isCorrectPassword(password)) {
    return NextResponse.json(
      { ok: false, error: 'incorrect-password', message: 'That password is not right.' },
      { status: 401 },
    );
  }

  const value = createSessionValue();
  if (!value) {
    return NextResponse.json({ ok: false, error: 'admin-not-configured' }, { status: 503 });
  }

  return NextResponse.json(
    { ok: true },
    { headers: { 'Set-Cookie': sessionCookie(value) } },
  );
}

/** Sign out. */
export async function DELETE() {
  return NextResponse.json(
    { ok: true },
    { headers: { 'Set-Cookie': clearedSessionCookie() } },
  );
}
