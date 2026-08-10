import Link from 'next/link';
import PitchLinePattern from '@/components/ui/PitchLinePattern';
import PrimaryCTA from '@/components/ui/PrimaryCTA';
import { en } from '@/content/en';
import { defaultLocale, pathFor } from '@/lib/i18n';

/**
 * Locale-scoped 404.
 *
 * `not-found.tsx` cannot read route params, so this renders in the default
 * locale and links back into the site rather than guessing wrongly.
 */
export default function NotFound() {
  const dict = en;

  return (
    <section className="relative isolate flex min-h-[70svh] items-center overflow-hidden pt-32">
      <PitchLinePattern variant="centre" className="-z-10 opacity-40" />

      <div className="shell py-20">
        <p className="meta text-lime">{dict.notFound.code}</p>
        <h1 className="display mt-5 max-w-[16ch] text-display-xl">
          {dict.notFound.headline}
        </h1>
        <p className="mt-6 max-w-[52ch] text-lead text-mute">{dict.notFound.body}</p>

        <div className="mt-10 flex flex-wrap gap-3">
          <PrimaryCTA href={pathFor(defaultLocale, 'home')} size="lg">
            {dict.notFound.cta}
          </PrimaryCTA>
          <PrimaryCTA href={pathFor(defaultLocale, 'work')} variant="outline" size="lg">
            {dict.notFound.secondary}
          </PrimaryCTA>
        </div>

        <p className="mt-10 text-sm text-mute/70">
          <Link href={pathFor('zh-hk', 'home')} hrefLang="zh-Hant-HK" className="wipe-link">
            繁體中文
          </Link>
        </p>
      </div>
    </section>
  );
}
