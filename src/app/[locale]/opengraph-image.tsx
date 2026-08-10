import { ImageResponse } from 'next/og';
import { getDictionary } from '@/content/dictionaries';
import { site } from '@/content/site';
import { isLocale, locales } from '@/lib/i18n';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${site.name} — ${site.tagline.en}`;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Social sharing card, generated per locale at build time.
 *
 * Drawn from the design tokens rather than a supplied JPEG so it can never
 * fall out of step with the brand. Replace with artwork from TAP IN. by
 * adding `public/media/og/<locale>.png` and pointing `buildMetadata` at it.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'en';
  const dict = getDictionary(locale);

  const lines =
    locale === 'zh-hk'
      ? ['打造球會。', '成就賽事。']
      : ['BUILD THE CLUB.', 'BUILD THE GAME.'];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(140deg, #11171B 0%, #070A0D 62%)',
          padding: 72,
          position: 'relative',
        }}
      >
        {/* Pitch markings */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: '2px solid rgba(255,255,255,0.10)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 40,
            bottom: 40,
            left: 600,
            width: 2,
            background: 'rgba(255,255,255,0.10)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 175,
            left: 460,
            width: 280,
            height: 280,
            borderRadius: 280,
            border: '2px solid rgba(255,255,255,0.10)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 44, height: 6, background: '#D7FF20', display: 'flex' }} />
          <div
            style={{
              color: '#D7FF20',
              fontSize: 24,
              letterSpacing: 6,
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            {dict.home.hero.eyebrow}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              color: '#F4F6F1',
              fontSize: locale === 'zh-hk' ? 104 : 96,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: locale === 'zh-hk' ? 0 : -2,
              display: 'flex',
            }}
          >
            {lines[0]}
          </div>
          <div
            style={{
              color: '#D7FF20',
              fontSize: locale === 'zh-hk' ? 104 : 96,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: locale === 'zh-hk' ? 0 : -2,
              display: 'flex',
            }}
          >
            {lines[1]}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '2px solid rgba(255,255,255,0.14)',
            paddingTop: 28,
          }}
        >
          <div
            style={{
              color: '#F4F6F1',
              fontSize: 46,
              fontWeight: 700,
              letterSpacing: -1,
              display: 'flex',
            }}
          >
            {site.name}
          </div>
          <div style={{ color: '#9EA7AE', fontSize: 24, display: 'flex' }}>
            {site.instagramHandle}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
