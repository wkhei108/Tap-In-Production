import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Barlow_Condensed, Inter } from 'next/font/google';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import SkipLink from '@/components/layout/SkipLink';
import TextureOverlay from '@/components/ui/TextureOverlay';
import Analytics from '@/components/system/Analytics';
import { resolveDictionary } from '@/lib/copy';
import { resolveBrand, resolveSite } from '@/lib/site-content';
import { isLocale, localeMeta, locales, type Locale } from '@/lib/i18n';
import { organisationJsonLd, websiteJsonLd } from '@/lib/seo';
import '../globals.css';

/**
 * `[locale]` is the root layout: it owns <html> and <body>, which is the only
 * way to set a correct server-rendered `lang` per locale.
 */

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#070A0D',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};

  const dict = await resolveDictionary(raw);
  const site = await resolveSite();
  const brand = await resolveBrand();

  return {
    metadataBase: new URL(site.url),
    title: {
      default: dict.home.meta.title,
      template: `%s | ${site.name}`,
    },
    description: dict.home.meta.description,
    applicationName: site.name,
    creator: site.name,
    publisher: site.name,
    formatDetection: { telephone: false, address: false, email: false },
    manifest: '/manifest.webmanifest',
    /* An uploaded icon takes over the tab; `src/app/icon.svg` stays as the
       fallback Next.js serves when nothing has been uploaded. */
    ...(brand.iconUrl ? { icons: { icon: brand.iconUrl, apple: brand.iconUrl } } : {}),
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale: Locale = raw;
  const dict = await resolveDictionary(locale);

  const [organisation, website] = await Promise.all([
    organisationJsonLd(locale),
    websiteJsonLd(locale),
  ]);

  return (
    <html
      lang={localeMeta[locale].htmlLang}
      className={`${barlowCondensed.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-svh text-bone antialiased">
        <SkipLink label={dict.nav.skipToContent} />
        <TextureOverlay />
        <SiteHeader locale={locale} />
        <main id="main-content" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
        <SiteFooter locale={locale} />
        <Analytics />
        <script
          type="application/ld+json"
          // Structured data is generated from typed config, not user input.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organisation, website]),
          }}
        />
      </body>
    </html>
  );
}
