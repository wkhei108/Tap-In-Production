import Link from 'next/link';

import SignOutButton from './SignOutButton';
import { adminNav } from '@/lib/admin-screens';

/**
 * The shared admin header.
 *
 * The tool grew from one screen to eleven, so the page title alone is no
 * longer enough to know where you are or how to get anywhere else. Rendered
 * per page rather than in the layout, because the layout is shared with the
 * login screen — which should show no navigation at all.
 */
export default function AdminChrome({
  title,
  current,
  blurb,
}: {
  title: string;
  /** Href of the active destination, used for `aria-current`. */
  current: string;
  blurb?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
        <div className="flex min-w-0 items-baseline gap-3">
          <Link
            href="/admin"
            className="font-mono text-xs uppercase tracking-[0.16em] text-lime transition-opacity hover:opacity-80"
          >
            TAP IN.
          </Link>
          <h1 className="truncate font-mono text-sm text-bone">{title}</h1>
        </div>
        <SignOutButton />
      </div>

      <nav
        aria-label="Admin sections"
        className="mx-auto w-full max-w-5xl overflow-x-auto px-5 pb-2.5"
      >
        <ul className="flex items-center gap-1">
          {adminNav.map((item) => {
            const active = item.href === current;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'inline-flex whitespace-nowrap rounded-xs bg-lime/15 px-2.5 py-1.5 text-xs font-medium text-lime'
                      : 'inline-flex whitespace-nowrap rounded-xs px-2.5 py-1.5 text-xs text-mute transition-colors hover:bg-surface hover:text-bone'
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {blurb ? (
        <p className="mx-auto w-full max-w-5xl px-5 pb-3 text-xs text-mute/70">{blurb}</p>
      ) : null}
    </header>
  );
}
