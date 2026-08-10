'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeMeta, locales, switchLocalePath, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * EN / 繁 switcher.
 *
 * Both locales use identical route segments, so swapping the prefix keeps the
 * visitor on the same page — including the project slug on a case study.
 * Rendered as two links (not a dropdown) so it is reachable in one tab stop
 * each and works without JavaScript.
 */
export default function LanguageSwitcher({
  locale,
  label,
  className,
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  const pathname = usePathname() ?? `/${locale}`;

  return (
    <div
      className={cn(
        'flex items-center rounded-xs border border-line',
        className,
      )}
      role="group"
      aria-label={label}
    >
      {locales.map((code, index) => {
        const isActive = code === locale;
        const meta = localeMeta[code];

        return (
          <span key={code} className="flex items-center">
            {index > 0 ? (
              <span aria-hidden="true" className="text-mute/50">
                /
              </span>
            ) : null}
            <Link
              href={switchLocalePath(pathname, code)}
              hrefLang={meta.hrefLang}
              lang={meta.hrefLang}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'tap inline-flex items-center justify-center px-2.5 py-2 text-xs font-semibold tracking-[0.1em] transition-colors duration-200',
                isActive ? 'text-lime' : 'text-mute hover:text-bone',
              )}
            >
              <span className="sr-only">{meta.label}</span>
              <span aria-hidden="true">{meta.shortLabel}</span>
            </Link>
          </span>
        );
      })}
    </div>
  );
}
