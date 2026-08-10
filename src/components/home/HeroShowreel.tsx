import Image from 'next/image';
import PitchLinePattern from '@/components/ui/PitchLinePattern';
import HeroVideo from './HeroVideo';

type Props = {
  /** Optional showreel. Until supplied, the poster/placeholder carries the hero. */
  videoSrc?: string;
  videoWebmSrc?: string;
  posterSrc?: string;
  posterAlt: string;
  mediaLabel: string;
  placeholderLabel: string;
};

/**
 * Hero background.
 *
 * Layer order is deliberate: a branded panel is painted first, the poster
 * image on top of it, and the showreel only ever on top of that — so the hero
 * is complete and on-brand before any video byte is requested, and stays
 * complete if the video never loads at all.
 */
export default function HeroShowreel({
  videoSrc,
  videoWebmSrc,
  posterSrc,
  posterAlt,
  mediaLabel,
  placeholderLabel,
}: Props) {
  return (
    <div aria-hidden={!posterSrc} className="absolute inset-0 -z-10 overflow-hidden bg-ink">
      {/* Base: branded panel, always present. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,#141c22_0%,#070a0d_68%)]">
        <PitchLinePattern variant="full" tone="neutral" className="opacity-70" />
        <div className="grid-lines absolute inset-0 opacity-50" />
      </div>

      {posterSrc ? (
        <Image
          src={posterSrc}
          alt={posterAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-x-0 bottom-8 flex justify-center">
          <span className="meta text-mute/40">{placeholderLabel}</span>
        </div>
      )}

      {videoSrc ? (
        <HeroVideo
          src={videoSrc}
          webmSrc={videoWebmSrc}
          poster={posterSrc}
          label={mediaLabel}
        />
      ) : null}

      {/* Legibility scrim — keeps the headline at AA over any footage. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
    </div>
  );
}
