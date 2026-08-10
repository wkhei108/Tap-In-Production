/**
 * Very small in-memory rate limit.
 *
 * Enough to blunt casual abuse on a single instance. It is intentionally not a
 * distributed limiter — if TAP IN. ever needs that, put it at the edge or in
 * front of the app rather than here.
 */
export function createRateLimiter({
  windowMs,
  max,
  maxKeys = 500,
}: {
  windowMs: number;
  max: number;
  maxKeys?: number;
}): (key: string) => boolean {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function rateLimited(key: string): boolean {
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }

    entry.count += 1;
    if (entry.count > max) return true;

    // Opportunistic cleanup so the map cannot grow without bound.
    if (hits.size > maxKeys) {
      for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
    }

    return false;
  };
}

/** Best-effort caller identity behind Vercel's proxy. */
export function clientKey(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
