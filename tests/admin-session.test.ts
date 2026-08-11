// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearedSessionCookie,
  createSessionValue,
  readCookie,
  sessionCookie,
  sessionCookieName,
  sessionMaxAgeSeconds,
  verifySessionValue,
} from '@/lib/admin-session';

const secret = 'a'.repeat(64);
const other = 'b'.repeat(64);

beforeEach(() => {
  process.env.ADMIN_MEDIA_TOKEN = secret;
});

afterEach(() => {
  delete process.env.ADMIN_MEDIA_TOKEN;
});

const withCookie = (value: string) =>
  new Request('https://tapin.hk/api/media', { headers: { cookie: value } });

describe('readCookie', () => {
  it('finds a cookie among several', () => {
    const request = withCookie(`a=1; ${sessionCookieName}=wanted; z=3`);
    expect(readCookie(request, sessionCookieName)).toBe('wanted');
  });

  it('does not match a cookie whose name merely ends the same way', () => {
    const request = withCookie(`not_${sessionCookieName}=nope`);
    expect(readCookie(request, sessionCookieName)).toBeNull();
  });

  it('returns null when there are no cookies at all', () => {
    expect(readCookie(new Request('https://tapin.hk/'), sessionCookieName)).toBeNull();
  });
});

describe('session values', () => {
  it('issues a value that verifies', () => {
    const value = createSessionValue();
    expect(value).not.toBeNull();
    expect(verifySessionValue(value)).toBe(true);
  });

  it('refuses a tampered expiry', () => {
    const value = createSessionValue()!;
    const [, signature] = value.split('.');
    const forged = `${Date.now() + 10_000_000}.${signature}`;
    expect(verifySessionValue(forged)).toBe(false);
  });

  it('refuses a value signed with a different token', () => {
    const value = createSessionValue()!;
    process.env.ADMIN_MEDIA_TOKEN = other;
    // Rotating the token is the documented way to revoke every session.
    expect(verifySessionValue(value)).toBe(false);
  });

  it('refuses an expired value', () => {
    const issued = createSessionValue(0)!;
    expect(verifySessionValue(issued, sessionMaxAgeSeconds * 1000 + 1)).toBe(false);
  });

  it('accepts a value right up to its expiry', () => {
    const issued = createSessionValue(0)!;
    expect(verifySessionValue(issued, sessionMaxAgeSeconds * 1000 - 1)).toBe(true);
  });

  it('refuses junk', () => {
    for (const junk of ['', 'nonsense', 'a.b', '.', `${Date.now() + 1000}.`]) {
      expect(verifySessionValue(junk)).toBe(false);
    }
  });

  it('fails closed when the admin is not configured', () => {
    const value = createSessionValue()!;
    delete process.env.ADMIN_MEDIA_TOKEN;
    expect(createSessionValue()).toBeNull();
    expect(verifySessionValue(value)).toBe(false);
  });

  it('fails closed when the token is too short to be worth trusting', () => {
    process.env.ADMIN_MEDIA_TOKEN = 'short';
    expect(createSessionValue()).toBeNull();
    expect(verifySessionValue('anything')).toBe(false);
  });
});

describe('cookie serialisation', () => {
  it('is HttpOnly, same-site and scoped to the whole app', () => {
    const header = sessionCookie('value');
    expect(header).toContain(`${sessionCookieName}=value`);
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Path=/');
    expect(header).toContain(`Max-Age=${sessionMaxAgeSeconds}`);
  });

  it('expires immediately when cleared', () => {
    expect(clearedSessionCookie()).toContain('Max-Age=0');
  });
});
