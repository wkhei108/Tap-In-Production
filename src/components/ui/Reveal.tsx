'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  /** Stagger sibling reveals, in seconds. */
  delay?: number;
  /** `wipe` rises like a broadcast lower-third, `fade` is quieter. */
  variant?: 'wipe' | 'fade';
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
};

/**
 * Section entrance transition.
 *
 * Deliberately dependency-free: an IntersectionObserver plus two CSS classes,
 * rather than an animation library. This is used on nearly every page, and
 * pulling a library in for a fade would put ~39 KB gzipped on every route for
 * an effect that CSS does natively.
 *
 * Content is visible by default and only hidden once the observer is actually
 * attached, so it can never be stranded invisible — no JavaScript, an
 * observer that never fires, or reduced motion all leave it fully readable.
 * The classes are toggled directly on the node, which keeps this out of React
 * state entirely (and off the render path).
 */
export default function Reveal({
  children,
  delay = 0,
  variant = 'wipe',
  className,
  as: Tag = 'div',
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    // Only now do we hide it — after confirming we can reveal it again.
    el.dataset.reveal = 'pending';

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.dataset.reveal = 'shown';
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn('reveal', variant === 'fade' && 'reveal-fade', className)}
      style={delay ? ({ '--reveal-delay': `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
