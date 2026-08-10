import { describe, expect, it } from 'vitest';
import { createContactSchema, toFieldErrors } from '@/lib/contact-schema';

const valid = {
  name: 'Chan Tai Man',
  organisation: 'Kowloon FC',
  email: 'chan@example.com',
  phone: '',
  service: 'build-a-club',
  projectType: 'club',
  preferredDate: '',
  budget: '',
  referral: '',
  details: 'We want a season-long content programme for our first team.',
  consent: true,
  website: '',
  locale: 'en',
} as const;

describe('contact form schema', () => {
  it('accepts a complete enquiry', () => {
    const result = createContactSchema('en').safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('requires name, organisation, email, service, project type and details', () => {
    const result = createContactSchema('en').safeParse({
      ...valid,
      name: '',
      organisation: '',
      email: '',
      service: '',
      projectType: '',
      details: '',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = toFieldErrors(result.error);
    expect(Object.keys(errors).sort()).toEqual(
      ['details', 'email', 'name', 'organisation', 'projectType', 'service'].sort(),
    );
  });

  it('rejects an unchecked consent box', () => {
    const result = createContactSchema('en').safeParse({ ...valid, consent: false });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toFieldErrors(result.error).consent).toMatch(/confirm/i);
  });

  it('rejects a malformed email address', () => {
    const result = createContactSchema('en').safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toFieldErrors(result.error).email).toMatch(/doesn’t look right/i);
  });

  it('rejects a one-word project description', () => {
    const result = createContactSchema('en').safeParse({ ...valid, details: 'hello' });
    expect(result.success).toBe(false);
  });

  it('returns Traditional Chinese messages for the zh-hk locale', () => {
    const result = createContactSchema('zh-hk').safeParse({ ...valid, name: '', locale: 'zh-hk' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toFieldErrors(result.error).name).toBe('請填寫你的姓名。');
  });

  it('treats optional fields as optional', () => {
    const result = createContactSchema('en').safeParse({
      ...valid,
      phone: '+852 1234 5678',
      preferredDate: '2026-09-12',
      budget: 'season-or-event',
      referral: 'instagram',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed preferred date', () => {
    const result = createContactSchema('en').safeParse({ ...valid, preferredDate: '12/09/2026' });
    expect(result.success).toBe(false);
  });

  it('lets a filled honeypot through so the route can absorb it silently', () => {
    // Rejecting here would tell a bot exactly which field gave it away.
    const result = createContactSchema('en').safeParse({
      ...valid,
      website: 'https://spam.example',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.website).toBe('https://spam.example');
  });
});
