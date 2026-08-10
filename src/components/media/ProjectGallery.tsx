'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import MediaFrame from './MediaFrame';
import VideoPlayer from './VideoPlayer';
import type { LightboxLabels } from './Lightbox';
import type { MediaItem } from '@/content/projects';
import type { Locale } from '@/lib/i18n';

// The viewer is only needed once someone opens an item.
const Lightbox = dynamic(() => import('./Lightbox'), { ssr: false });

type Props = {
  items: MediaItem[];
  locale: Locale;
  slug: string;
  labels: LightboxLabels & {
    open: string;
    galleryLabel: string;
    mediaPending: string;
    play: string;
    pause: string;
    noSupport: string;
    transcript: string;
  };
};

const span: Record<MediaItem['aspect'], string> = {
  landscape: 'md:col-span-8',
  portrait: 'md:col-span-4',
  square: 'md:col-span-6',
};

export default function ProjectGallery({ items, locale, slug, labels }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggersRef = useRef<Array<HTMLButtonElement | null>>([]);

  const close = useCallback(() => {
    const index = openIndex;
    setOpenIndex(null);
    // Return focus to the thumbnail the visitor came from.
    if (index !== null) triggersRef.current[index]?.focus();
  }, [openIndex]);

  if (items.length === 0) return null;

  return (
    <>
      <ul
        aria-label={labels.galleryLabel}
        className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6"
      >
        {items.map((item, index) => (
          <li key={`${slug}-${index}`} className={span[item.aspect]}>
            {item.type === 'video' && item.src ? (
              <VideoPlayer
                src={item.src}
                srcWebm={item.srcWebm}
                poster={item.poster}
                aspect={item.aspect}
                ariaLabel={locale === 'zh-hk' ? item.altTextZh : item.altText}
                transcript={item.transcript?.[locale]}
                transcriptLabel={labels.transcript}
                labels={{ play: labels.play, pause: labels.pause, noSupport: labels.noSupport }}
              />
            ) : (
              <button
                type="button"
                ref={(node) => {
                  triggersRef.current[index] = node;
                }}
                onClick={() => setOpenIndex(index)}
                className="group relative block w-full cursor-zoom-in text-left"
              >
                <span className="sr-only">{labels.open}</span>
                <MediaFrame
                  src={item.src}
                  alt={locale === 'zh-hk' ? item.altTextZh : item.altText}
                  aspect={item.aspect}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  hoverZoom
                  placeholderLabel={labels.mediaPending}
                  expectedPath={`/media/projects/${slug}/gallery-${String(index + 1).padStart(2, '0')}.webp`}
                  note={item.caption ? item.caption[locale] : undefined}
                />
              </button>
            )}
          </li>
        ))}
      </ul>

      {openIndex !== null ? (
        <Lightbox
          items={items}
          index={openIndex}
          locale={locale}
          labels={{
            close: labels.close,
            previous: labels.previous,
            next: labels.next,
            position: labels.position,
          }}
          onClose={close}
          onNavigate={setOpenIndex}
        />
      ) : null}
    </>
  );
}
