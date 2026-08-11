import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PageHero from '@/components/sections/PageHero';
import { resolveDictionary } from '@/lib/copy';
import { resolveSite } from '@/lib/site-content';
import { isLocale, pathFor, type Locale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

/**
 * Plain-language privacy page.
 *
 * Deliberately narrow: it covers the enquiry form and optional analytics only,
 * and carries a visible review notice. It does not claim compliance with any
 * particular regime — TAP IN. must have the final wording reviewed before
 * launch (see docs/client-input-needed.md).
 */

/** Update when the wording changes. */
const LAST_UPDATED = '2026-08-10';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const dict = await resolveDictionary(raw);

  return buildMetadata({
    locale: raw,
    title: dict.privacy.meta.title,
    description: dict.privacy.meta.description,
    path: pathFor(raw, 'privacy'),
    pathForLocale: (l) => pathFor(l, 'privacy'),
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale: Locale = raw;
  const dict = await resolveDictionary(locale);
  const site = await resolveSite();

  const formatted = new Intl.DateTimeFormat(
    locale === 'zh-hk' ? 'zh-Hant-HK' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' },
  ).format(new Date(LAST_UPDATED));

  return (
    <>
      <PageHero
        locale={locale}
        eyebrow={dict.privacy.eyebrow}
        headline={dict.privacy.headline}
      />

      <section className="shell pb-20 md:pb-28">
        <div className="max-w-[68ch]">
          <p className="meta text-mute/70">
            {dict.privacy.updated} · {formatted}
          </p>

          <p className="mt-6 border-l-2 border-lime/50 bg-surface/40 p-5 text-sm text-bone/90">
            {dict.privacy.reviewNotice}
          </p>

          <div className="mt-12 flex flex-col">
            {dict.privacy.sections.map((section, index) => (
              <section key={section.title} className="touchline py-8">
                <div className="flex items-baseline gap-4">
                  <span className="meta text-lime">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2
                    className={`${locale === 'zh-hk' ? 'display-cjk' : 'display'} text-display-sm`}
                  >
                    {section.title}
                  </h2>
                </div>
                <p className="mt-3 text-mute">{section.body}</p>
              </section>
            ))}
          </div>

          <p className="mt-10 text-sm text-mute">
            <a
              href={`mailto:${site.email}`}
              className="wipe-link text-lime transition-colors hover:text-bone"
            >
              {site.email}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
