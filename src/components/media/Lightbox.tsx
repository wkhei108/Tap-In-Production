'use client';

import { useCallback, useEffect, useId, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { MediaItem } from '@/content/projects';
import { aspectRatios, format } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

export type LightboxLabels = {
  close: string;
  previous: string;
  next: string;
  position: string;
};

type Props = {
  items: MediaItem[];
  index: number;
  locale: Locale;
  labels: LightboxLabels;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

/**
 * Modal image viewer.
 *
 * Keyboard: Escape closes, ← → move between items, Tab is trapped inside the
 * dialog, and focus returns to the thumbnail that opened it. Loaded through a
 * dynamic import so none of this ships until a visitor actually opens it.
 */
export default function Lightbox({
  items,
  index,
  locale,
  labels,
  onClose,
  onNavigate,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const item = items[index];
  const total = items.length;

  const go = useCallback(
    (direction: -1 | 1) => {
      onNavigate((index + direction + total) % total);
    },
    [index, onNavigate, total],
  );

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          go(-1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          go(1);
          break;
        case 'Tab': {
          const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled])',
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
          break;
        }
        default:
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [go, onClose]);

  if (!item) return null;

  const alt = locale === 'zh-hk' ? item.altTextZh : item.altText;
  const position = format(labels.position, { current: index + 1, total });

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[80] flex flex-col bg-ink/97"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <p id={titleId} className="meta text-mute" aria-live="polite">
          {position}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="tap inline-flex items-center justify-center rounded-xs border border-line text-bone transition-colors hover:border-lime hover:text-lime"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <figure className="flex max-h-full w-full max-w-5xl flex-col items-center gap-4">
          <div
            className="relative w-full flex-1 overflow-hidden"
            style={{ aspectRatio: aspectRatios[item.aspect], maxHeight: '72svh' }}
          >
            {item.src ? (
              <Image
                src={item.src}
                alt={alt}
                fill
                sizes="(min-width: 1024px) 64rem, 100vw"
                className="object-contain"
              />
            ) : (
              <div
                role="img"
                aria-label={alt}
                className="flex size-full flex-col items-center justify-center gap-3 border border-line bg-surface"
              >
                <span className="display text-display-sm text-bone/25">TAP IN.</span>
              </div>
            )}
          </div>

          {item.caption ? (
            <figcaption className="meta text-mute">{item.caption[locale]}</figcaption>
          ) : null}
        </figure>
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-line px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={labels.previous}
          className="tap inline-flex items-center justify-center rounded-xs border border-line px-4 text-bone transition-colors hover:border-lime hover:text-lime"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={labels.next}
          className="tap inline-flex items-center justify-center rounded-xs border border-line px-4 text-bone transition-colors hover:border-lime hover:text-lime"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
}
