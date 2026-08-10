'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Transparent over the hero, solid once the visitor scrolls.
 * The only client state in the header, kept deliberately tiny.
 */
export default function HeaderShell({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      aria-label={ariaLabel}
      data-scrolled={scrolled}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        'pt-[env(safe-area-inset-top)]',
        scrolled
          ? 'border-b border-line bg-ink/95 supports-[backdrop-filter]:bg-ink/80 supports-[backdrop-filter]:backdrop-blur-sm'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      {children}
    </header>
  );
}
