import Link from 'next/link';
import { Mail } from 'lucide-react';
import { InstagramGlyph } from '@/components/ui/icons';
import Wordmark from '@/components/brand/Wordmark';
import PitchLinePattern from '@/components/ui/PitchLinePattern';
import { resolveDictionary } from '@/lib/copy';
import { resolveBrand, resolveSite } from '@/lib/site-content';
import { footerNav, type RouteKey } from '@/content/site';
import { pathFor, type Locale } from '@/lib/i18n';

export default async function SiteFooter({ locale }: { locale: Locale }) {
  const dict = await resolveDictionary(locale);
  const site = await resolveSite();
  const brand = await resolveBrand();
  const year = new Date().getFullYear();

  const labels: Record<RouteKey, string> = {
    home: dict.nav.home,
    work: dict.nav.work,
    buildAClub: dict.nav.buildAClub,
    buildAGame: dict.nav.buildAGame,
    about: dict.nav.about,
    contact: dict.nav.contact,
    privacy: dict.nav.privacy,
  };

  return (
    <footer
      aria-label={dict.nav.footerLabel}
      className="relative z-10 mt-24 border-t border-line bg-surface/40 md:mt-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden opacity-40">
        <PitchLinePattern variant="centre" tone="neutral" />
      </div>

      <div className="shell relative py-14 md:py-20">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          {/* Brand block */}
          <div className="md:col-span-5">
            <Wordmark
              className="text-display-md"
              logoUrl={brand.logoUrl}
              name={site.name}
            />
            <p className="mt-4 max-w-[34ch] text-sm text-mute">
              {site.tagline[locale]}
            </p>
            <p className="mt-3 max-w-[38ch] text-sm text-mute/80">{dict.footer.blurb}</p>
          </div>

          {/* Sitemap */}
          <nav aria-label={dict.footer.sitemapHeading} className="md:col-span-3">
            <h2 className="meta text-lime">{dict.footer.sitemapHeading}</h2>
            <ul className="mt-5 flex flex-col gap-1">
              {footerNav.map((key) => (
                <li key={key}>
                  <Link
                    href={pathFor(locale, key)}
                    className="tap inline-flex items-center text-sm text-mute transition-colors duration-200 hover:text-bone"
                  >
                    {labels[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="md:col-span-4">
            <h2 className="meta text-lime">{dict.footer.contactHeading}</h2>
            <ul className="mt-5 flex flex-col gap-3">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="tap inline-flex items-center gap-3 text-sm text-mute transition-colors duration-200 hover:text-bone"
                >
                  <Mail aria-hidden="true" className="size-4 shrink-0" />
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap inline-flex items-center gap-3 text-sm text-mute transition-colors duration-200 hover:text-bone"
                >
                  <InstagramGlyph className="size-4 shrink-0" />
                  {site.instagramHandle}
                  <span className="sr-only">{dict.a11y.newTab}</span>
                </a>
              </li>
              <li className="pt-1 text-sm text-mute/80">{dict.footer.builtLine}</li>
            </ul>
          </div>
        </div>

        {/* Sign-off band */}
        <div className="mt-14 border-t border-line pt-8 md:mt-20">
          <p
            aria-hidden="true"
            className="display select-none text-[clamp(1.5rem,6.5vw,4.6rem)] leading-none tracking-[-0.02em] text-bone/[0.09]"
          >
            {site.signOff}
          </p>
          <div className="mt-8 flex flex-col gap-2 text-xs text-mute/70 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {site.name} {dict.footer.rights}
            </p>
            <p className="meta text-mute/50">{site.areaServed}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
