import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, isLocale } from '@/lib/i18n';

/**
 * Every page lives under `/<locale>/…`, which is what lets `[locale]/layout`
 * act as the root layout and set the correct `lang` attribute server-side.
 *
 * This proxy makes sure a visitor never lands on an unprefixed path:
 *   `/`            → `/en` (or `/zh-hk` if their browser prefers Chinese)
 *   `/work`        → `/en/work`
 *   `/en/work`     → untouched
 */
function preferredLocale(request: NextRequest) {
  const header = request.headers.get('accept-language');
  if (!header) return defaultLocale;

  const preferences = header
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return {
        tag: tag.toLowerCase(),
        quality: q ? Number.parseFloat(q.split('=')[1] ?? '1') : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of preferences) {
    // zh-hk, zh-hant, zh-tw and plain zh all resolve to Traditional Chinese.
    if (tag.startsWith('zh')) return 'zh-hk';
    if (tag.startsWith('en')) return 'en';
  }

  return defaultLocale;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/').filter(Boolean)[0];

  if (isLocale(firstSegment)) return NextResponse.next();

  const url = request.nextUrl.clone();
  const locale = pathname === '/' ? preferredLocale(request) : defaultLocale;
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  /**
   * Skip Next internals, the API, the single-language admin tool (bare
   * `/admin` as well as everything under it), and the metadata routes that
   * must stay at the origin root (sitemap.xml, robots.txt, favicons,
   * manifest, OG images).
   */
  matcher: [
    '/((?!_next/static|_next/image|api/|admin|favicon\\.ico|icon|apple-icon|opengraph-image|twitter-image|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|media/|brand/).*)',
  ],
};
