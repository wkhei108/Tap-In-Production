'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Mail } from 'lucide-react';
import { InstagramGlyph } from '@/components/ui/icons';
import type { Locale } from '@/lib/i18n';
import type { NavItem } from './SiteHeader';
import LanguageSwitcher from './LanguageSwitcher';

type Props = {
  locale: Locale;
  items: NavItem[];
  contactHref: string;
  /* Resolved server-side and passed in: this is a client component, so it
     cannot read the overlay itself. */
  contactDetails: {
    email: string;
    instagramUrl: string;
    instagramHandle: string;
  };
  labels: {
    open: string;
    close: string;
    title: string;
    startProject: string;
    language: string;
  };
};

/**
 * Full-screen mobile navigation.
 *
 * Accessibility: labelled dialog, focus moved in and restored on close, Escape
 * closes, focus is trapped while open, and the page behind is inert to
 * scrolling. Closes automatically on navigation.
 */
export default function MobileMenu({
  locale,
  items,
  contactHref,
  contactDetails,
  labels,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  /* Close when the route changes. Adjusted during render rather than in an
     effect, so the panel is already gone on the first render of the new page
     instead of flashing for a frame. */
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Lock background scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Move focus into the panel, trap it, and restore it on close.
  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        openButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="tap inline-flex items-center justify-center rounded-xs border border-line text-bone transition-colors duration-200 hover:border-lime hover:text-lime lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[60] lg:hidden"
        >
          <div
            ref={panelRef}
            className="flex h-svh flex-col overflow-y-auto bg-ink pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]"
          >
            <div className="shell flex items-center justify-between py-4">
              <h2 id={titleId} className="meta text-mute">
                {labels.title}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => {
                  setOpen(false);
                  openButtonRef.current?.focus();
                }}
                aria-label={labels.close}
                className="tap inline-flex items-center justify-center rounded-xs border border-line text-bone transition-colors duration-200 hover:border-lime hover:text-lime"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <nav aria-label={labels.title} className="shell flex-1 pt-4">
              <ul className="flex flex-col">
                {items.map((item, index) => (
                  <li key={item.key} className="border-b border-line">
                    <Link
                      href={item.href}
                      className="tap flex items-baseline gap-4 py-5"
                      onClick={() => setOpen(false)}
                    >
                      {/* Decorative index — kept out of the link's
                          accessible name, which stays just the page title. */}
                      <span aria-hidden="true" className="meta text-lime/70">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={
                          locale === 'zh-hk'
                            ? 'display-cjk text-display-md'
                            : 'display text-display-md'
                        }
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="shell mt-8 flex flex-col gap-5">
              <Link
                href={contactHref}
                onClick={() => setOpen(false)}
                className="tap flex items-center justify-center rounded-xs bg-lime px-6 py-4 font-semibold text-ink"
              >
                <span className="display leading-none tracking-[0.02em]">
                  {labels.startProject}
                </span>
              </Link>

              <div className="flex flex-col gap-3">
                <a
                  href={`mailto:${contactDetails.email}`}
                  className="tap flex items-center gap-3 text-sm text-mute transition-colors hover:text-bone"
                >
                  <Mail aria-hidden="true" className="size-4 shrink-0" />
                  {contactDetails.email}
                </a>
                <a
                  href={contactDetails.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap flex items-center gap-3 text-sm text-mute transition-colors hover:text-bone"
                >
                  <InstagramGlyph className="size-4 shrink-0" />
                  {contactDetails.instagramHandle}
                </a>
              </div>

              <LanguageSwitcher
                locale={locale}
                label={labels.language}
                className="self-start"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
