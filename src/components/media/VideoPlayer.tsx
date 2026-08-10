'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { aspectRatios, cn, type AspectKey } from '@/lib/utils';
import { useRichMediaAllowed } from '@/lib/use-rich-media-allowed';

type Props = {
  src?: string;
  srcWebm?: string;
  poster?: string;
  aspect?: AspectKey;
  /** Muted looping background footage with no chrome. */
  ambient?: boolean;
  className?: string;
  labels: {
    play: string;
    pause: string;
    noSupport: string;
  };
  /** Description of the footage for assistive technology. */
  ariaLabel: string;
  /** Rendered under the video when supplied. */
  transcript?: string;
  transcriptLabel?: string;
};

/**
 * Native video with an accessible control.
 *
 * Ambient clips are muted, looped and inline — never autoplaying audio. They
 * are also skipped entirely for visitors who prefer reduced motion or have
 * Data Saver on, who get the poster frame instead.
 */
export default function VideoPlayer({
  src,
  srcWebm,
  poster,
  aspect = 'landscape',
  ambient = false,
  className,
  labels,
  ariaLabel,
  transcript,
  transcriptLabel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const richMediaAllowed = useRichMediaAllowed();

  useEffect(() => {
    if (!ambient || !richMediaAllowed) return;
    const video = videoRef.current;
    if (!video) return;

    video.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [ambient, richMediaAllowed]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().then(() => setPlaying(true));
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  if (!src) return null;

  return (
    <div className={cn('relative', className)}>
      <div
        className="relative overflow-hidden rounded-xs border border-line bg-surface"
        style={{ aspectRatio: aspectRatios[aspect] }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          poster={poster}
          muted
          loop={ambient}
          playsInline
          preload={ambient ? 'none' : 'metadata'}
          controls={!ambient}
          aria-label={ariaLabel}
        >
          {srcWebm ? <source src={srcWebm} type="video/webm" /> : null}
          <source src={src} type="video/mp4" />
          {labels.noSupport}
        </video>

        {ambient ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? labels.pause : labels.play}
            className="tap absolute bottom-3 right-3 z-10 inline-flex items-center justify-center rounded-xs border border-line bg-ink/70 text-bone transition-colors hover:border-lime hover:text-lime"
          >
            {playing ? (
              <Pause aria-hidden="true" className="size-4" />
            ) : (
              <Play aria-hidden="true" className="size-4" />
            )}
          </button>
        ) : null}
      </div>

      {transcript ? (
        <details className="mt-3 border border-line bg-surface/60 p-4">
          <summary className="meta cursor-pointer text-mute">{transcriptLabel}</summary>
          <p className="mt-3 text-sm text-mute">{transcript}</p>
        </details>
      ) : null}
    </div>
  );
}
