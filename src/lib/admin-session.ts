import { createHmac, timingSafeEqual } from 'node:crypto';
import { isAdminConfigured } from './admin-auth';

/* ==========================================================================
   Admin sessions.

   The password is exchanged once for a signed cookie rather than being
   retyped every visit. Nothing is stored server-side: the cookie carries its
   own expiry and a signature over it, keyed on ADMIN_MEDIA_TOKEN. Rotating
   that token therefore invalidates every outstanding session, which is what
   you want the "if it leaks" lever to do.

   Signed with node:crypto rather than a JWT library — this is one claim and
   one signature, and mailer.ts already sets the precedent of not taking a
   dependency for something this small.
   ========================================================================== */

export const sessionCookieName = 'tapin_admin_session';

/** Long enough that signing in is rare; short enough that a lost laptop expires. */
export const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Read one cookie off a request without pulling in `next/headers`. */
export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }

  return null;
}

/** `<expiresAt>.<signature>`, or null when the admin is not configured. */
export function createSessionValue(now = Date.now()): string | null {
  const secret = process.env.ADMIN_MEDIA_TOKEN;
  if (!isAdminConfigured() || !secret) return null;

  const expiresAt = String(now + sessionMaxAgeSeconds * 1000);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifySessionValue(value: string | null, now = Date.now()): boolean {
  const secret = process.env.ADMIN_MEDIA_TOKEN;
  if (!isAdminConfigured() || !secret || !value) return false;

  const separator = value.lastIndexOf('.');
  if (separator === -1) return false;

  const expiresAt = value.slice(0, separator);
  const provided = Buffer.from(value.slice(separator + 1));
  const expected = Buffer.from(sign(expiresAt, secret));

  // Compare before trusting the expiry — an unsigned payload says nothing.
  if (provided.length !== expected.length) return false;
  if (!timingSafeEqual(provided, expected)) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > now;
}

function serialiseCookie(value: string, maxAge: number): string {
  const attributes = [
    `${sessionCookieName}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];

  // Localhost is served over http, where a Secure cookie is silently dropped.
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');

  return attributes.join('; ');
}

export function sessionCookie(value: string): string {
  return serialiseCookie(value, sessionMaxAgeSeconds);
}

export function clearedSessionCookie(): string {
  return serialiseCookie('', 0);
}
