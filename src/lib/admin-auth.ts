import { timingSafeEqual } from 'node:crypto';

/**
 * A token shorter than this is not worth the false sense of security — the
 * media endpoints write to public storage, so a guessable token is the same as
 * no token at all. Generate one with `openssl rand -hex 32`.
 */
const minTokenLength = 32;

/**
 * Is the media admin unlocked on this deployment?
 *
 * Unset or too-short token means locked: every request is refused rather than
 * waved through, so a misconfigured production deploy fails closed.
 */
export function isAdminConfigured(): boolean {
  const token = process.env.ADMIN_MEDIA_TOKEN;
  return typeof token === 'string' && token.length >= minTokenLength;
}

/** Constant-time comparison of a submitted password against the configured one. */
export function isCorrectPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_MEDIA_TOKEN;
  if (!isAdminConfigured() || !expected) return false;

  const provided = Buffer.from(candidate);
  const secret = Buffer.from(expected);

  // timingSafeEqual throws on a length mismatch, and the length of a rejected
  // password is not worth protecting.
  if (provided.length !== secret.length) return false;

  return timingSafeEqual(provided, secret);
}
