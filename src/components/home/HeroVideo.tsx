'use client';

import { useEffect, useRef } from 'react';
import { useRichMediaAllowed } from '@/lib/use-rich-media-allowed';

/**
 * Silent background showreel.
 *
 * Mounted only once the client confirms the visitor is not on reduced motion
 * and not on a metered or slow connection — Instagram traffic is largely
 * mobile, so the video is an enhancement, never a requirement.
 */
export default function HeroVideo({
  src,
  webmSrc,
  poster,
  label,
}: {
  src: string;
  webmSrc?: string;
  poster?: string;
  label: string;
}) {
  const allowed = useRichMediaAllowed();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!allowed) return;
    // Autoplay can still be refused (iOS Low Power Mode); the poster stays put.
    videoRef.current?.play().catch(() => undefined);
  }, [allowed]);

  if (!allowed) return null;

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 size-full object-cover"
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      tabIndex={-1}
    >
      {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
      <source src={src} type="video/mp4" />
    </video>
  );
}
