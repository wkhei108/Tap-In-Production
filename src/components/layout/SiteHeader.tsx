import Link from 'next/link';
import { getDictionary } from '@/content/dictionaries';
import { primaryNav, routes, type RouteKey } from '@/content/site';
import { pathFor, type Locale } from '@/lib/i18n';
import HeaderShell from './HeaderShell';
import LanguageSwitcher from './LanguageSwitcher';
import MobileMenu from './MobileMenu';
import Wordmark from '@/components/brand/Wordmark';

export type NavItem = { key: RouteKey; label: string; href: string };

/**
 * Server component: builds the localised nav model once, then hands it to the
 * small client shell that handles scroll state and the mobile menu.
 */
export default function SiteHeader({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  const navLabels: Record<RouteKey, string> = {
    home: dict.nav.home,
    work: dict.nav.work,
    buildAClub: dict.nav.buildAClub,
    buildAGame: dict.nav.buildAGame,
    about: dict.nav.about,
    contact: dict.nav.contact,
    privacy: dict.nav.privacy,
  };

  const items: NavItem[] = primaryNav.map((key) => ({
    key,
    label: navLabels[key],
    href: pathFor(locale, key),
  }));

  return (
    <HeaderShell ariaLabel={dict.nav.primaryLabel}>
      <div className="shell flex items-center justify-between gap-4 py-4 md:py-5">
        <Link
          href={pathFor(locale, 'home')}
          aria-label={dict.nav.brandHome}
          className="tap flex items-center"
        >
          <Wordmark className="text-2xl md:text-[1.7rem]" />
        </Link>

        <nav
          aria-label={dict.nav.primaryLabel}
          className="hidden items-center gap-7 lg:flex"
        >
          {items.map((item) => (
            <HeaderLink key={item.key} href={item.href} label={item.label} routeKey={item.key} />
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitcher locale={locale} label={dict.nav.languageLabel} />

          <Link
            href={pathFor(locale, 'contact')}
            className="tap hidden items-center rounded-xs border border-lime bg-lime px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-bone hover:bg-bone md:inline-flex"
          >
            <span className="display leading-none tracking-[0.02em]">
              {dict.nav.startProject}
            </span>
          </Link>

          <MobileMenu
            locale={locale}
            items={items}
            labels={{
              open: dict.nav.openMenu,
              close: dict.nav.closeMenu,
              title: dict.nav.menuTitle,
              startProject: dict.nav.startProject,
              language: dict.nav.languageLabel,
            }}
            contactHref={pathFor(locale, 'contact')}
          />
        </div>
      </div>
    </HeaderShell>
  );
}

function HeaderLink({
  href,
  label,
  routeKey,
}: {
  href: string;
  label: string;
  routeKey: RouteKey;
}) {
  return (
    <Link
      href={href}
      data-route={routes[routeKey]}
      className="wipe-link display text-sm tracking-[0.06em] text-bone/85 transition-colors duration-300 hover:text-bone"
    >
      {label}
    </Link>
  );
}
