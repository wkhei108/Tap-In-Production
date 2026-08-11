import MediaFrame from '@/components/media/MediaFrame';
import SectionHeading from '@/components/ui/SectionHeading';
import PrimaryCTA from '@/components/ui/PrimaryCTA';
import { InstagramGlyph } from '@/components/ui/icons';
import { resolveDictionary } from '@/lib/copy';
import { resolveSite, resolveSocialPosts } from '@/lib/site-content';
import type { Locale } from '@/lib/i18n';

/**
 * "From the touchline" — a curated rail linking out to Instagram.
 * Horizontally scrollable on mobile, a grid from `md` up.
 */
export default async function SocialMediaRail({ locale }: { locale: Locale }) {
  const dict = await resolveDictionary(locale);
  const site = await resolveSite();
  const socialPosts = await resolveSocialPosts();
  const copy = dict.home.social;

  return (
    <section className="py-20 md:py-28" aria-labelledby="social-rail">
      <div className="shell">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            locale={locale}
            eyebrow={copy.eyebrow}
            title={copy.headline}
            body={copy.body}
            id="social-rail"
          />
          <PrimaryCTA
            href={site.instagramUrl}
            external
            variant="outline"
            className="shrink-0 self-start md:self-auto"
          >
            <span className="flex items-center gap-2">
              <InstagramGlyph className="size-4" />
              {copy.cta} {site.instagramHandle}
            </span>
          </PrimaryCTA>
        </div>
      </div>

      {/* Edge-to-edge rail on mobile so the last card hints at more content. */}
      <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(1.125rem,4vw,3.5rem)] pb-4 md:mx-auto md:grid md:max-w-[var(--shell-max)] md:snap-none md:grid-cols-5 md:overflow-visible md:pb-0">
        {socialPosts.map((post) => (
          <li
            key={post.id}
            className="w-[68vw] shrink-0 snap-start sm:w-[42vw] md:w-auto"
          >
            <a
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block"
            >
              <MediaFrame
                src={post.image}
                alt={locale === 'zh-hk' ? post.altTextZh : post.altText}
                aspect={post.aspect}
                sizes="(min-width: 768px) 20vw, 68vw"
                hoverZoom
                placeholderLabel={dict.common.mediaPending}
                note={post.caption ? post.caption[locale] : undefined}
              />
              <span className="sr-only">{dict.a11y.newTab}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
