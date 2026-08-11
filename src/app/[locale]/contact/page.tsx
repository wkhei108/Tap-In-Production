import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Mail, MapPin, MessageCircle } from 'lucide-react';

import PageHero from '@/components/sections/PageHero';
import ContactForm from '@/components/contact/ContactForm';
import { InstagramGlyph } from '@/components/ui/icons';

import { resolveDictionary } from '@/lib/copy';
import { resolveSite } from '@/lib/site-content';
import { isLocale, pathFor, type Locale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

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
    title: dict.contact.meta.title,
    description: dict.contact.meta.description,
    path: pathFor(raw, 'contact'),
    pathForLocale: (l) => pathFor(l, 'contact'),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale: Locale = raw;
  const dict = await resolveDictionary(locale);
  const site = await resolveSite();
  const direct = dict.contact.direct;

  return (
    <>
      <PageHero
        locale={locale}
        eyebrow={dict.contact.hero.eyebrow}
        headline={dict.contact.hero.headline}
        body={dict.contact.hero.body}
      />

      <section className="shell pb-20 md:pb-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Direct contact rail */}
          <aside className="lg:col-span-4">
            <div className="border border-line bg-surface/40 p-6 md:p-8">
              <h2 className="meta text-lime">{direct.heading}</h2>

              <ul className="mt-6 flex flex-col gap-5">
                <li>
                  <p className="meta text-mute/60">{direct.emailLabel}</p>
                  <a
                    href={`mailto:${site.email}`}
                    className="tap mt-1.5 inline-flex items-center gap-2.5 text-sm text-bone transition-colors hover:text-lime"
                  >
                    <Mail aria-hidden="true" className="size-4 shrink-0" />
                    {site.email}
                  </a>
                </li>

                <li>
                  <p className="meta text-mute/60">{direct.instagramLabel}</p>
                  <a
                    href={site.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap mt-1.5 inline-flex items-center gap-2.5 text-sm text-bone transition-colors hover:text-lime"
                  >
                    <InstagramGlyph className="size-4 shrink-0" />
                    {site.instagramHandle}
                    <span className="sr-only">{dict.a11y.newTab}</span>
                  </a>
                </li>

                {/* Rendered only when a number is configured — never a dead link. */}
                {site.whatsapp ? (
                  <li>
                    <p className="meta text-mute/60">{direct.whatsappLabel}</p>
                    <a
                      href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap mt-1.5 inline-flex items-center gap-2.5 text-sm text-bone transition-colors hover:text-lime"
                    >
                      <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
                      {site.whatsapp}
                    </a>
                  </li>
                ) : null}

                <li>
                  <p className="meta text-mute/60">{direct.basedLabel}</p>
                  <p className="mt-1.5 flex items-center gap-2.5 text-sm text-bone">
                    <MapPin aria-hidden="true" className="size-4 shrink-0" />
                    {direct.basedValue}
                  </p>
                </li>
              </ul>

              <p className="mt-8 border-t border-line pt-6 text-sm text-mute">
                {direct.responseNote}
              </p>
            </div>
          </aside>

          {/* Enquiry form */}
          <div className="lg:col-span-8">
            <ContactForm locale={locale} dict={dict} />
          </div>
        </div>
      </section>
    </>
  );
}
