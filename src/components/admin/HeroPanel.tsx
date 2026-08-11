'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

import type { HeroRecord } from '@/lib/campaign-schema';
import { acceptedUploadTypes } from '@/lib/photo-schema';
import {
  adminCard,
  adminField,
  adminGhostButton,
  adminLabel,
  adminPrimaryButton,
} from './admin-ui';

/**
 * The homepage hero: one poster, one optional showreel, for the whole site.
 *
 * Not part of any campaign, which is why it lives on the overview rather than
 * inside a campaign's library.
 */
export default function HeroPanel({ initialHero }: { initialHero: HeroRecord | null }) {
  const [hero, setHero] = useState(initialHero);
  const [altText, setAltText] = useState(initialHero?.posterAltText ?? '');
  const [altTextZh, setAltTextZh] = useState(initialHero?.posterAltTextZh ?? '');
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const posterInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const hasPoster = Boolean(hero?.posterUrl || posterPreview);
  const canSave = hasPoster && altText.trim() && altTextZh.trim();

  function pickPoster(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPosterPreview(URL.createObjectURL(file));
  }

  async function save() {
    setBusy(true);
    setStatus('Saving…');

    const form = new FormData();
    form.set('posterAltText', altText);
    form.set('posterAltTextZh', altTextZh);
    const poster = posterInput.current?.files?.[0];
    if (poster) form.set('poster', poster);
    const video = videoInput.current?.files?.[0];
    if (video) form.set('video', video);

    const response = await fetch('/api/hero', { method: 'POST', body: form });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      const firstFieldError = body.fieldErrors ? Object.values(body.fieldErrors)[0] : undefined;
      setStatus(
        (firstFieldError as string | undefined) ??
          body.message ??
          `Could not save the hero (${body.error ?? response.status}).`,
      );
      return;
    }

    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPosterPreview(null);
    setVideoName(null);
    if (posterInput.current) posterInput.current.value = '';
    if (videoInput.current) videoInput.current.value = '';
    setHero(body.hero);
    setStatus('Homepage hero updated.');
  }

  async function clear() {
    setBusy(true);
    const response = await fetch('/api/hero', { method: 'DELETE' });
    setBusy(false);

    if (!response.ok) {
      setStatus('Could not clear the hero.');
      return;
    }

    setHero(null);
    setAltText('');
    setAltTextZh('');
    setStatus('Hero cleared — the homepage is back to its placeholder.');
  }

  return (
    <section aria-labelledby="hero" className={`${adminCard} p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="hero" className={adminLabel}>
          Homepage hero
        </h2>
        {hero ? (
          <button type="button" onClick={clear} disabled={busy} className={adminGhostButton}>
            Clear hero
          </button>
        ) : null}
      </div>

      <p className="mt-1.5 text-xs text-mute/70">
        The full-screen image at the top of the homepage, with an optional silent showreel
        over it. The showreel is held back on reduced motion and slow connections, so the
        poster has to stand on its own — it is what most visitors see.
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-56 sm:shrink-0">
          <div className="aspect-video overflow-hidden rounded-xs border border-line bg-ink">
            {posterPreview ? (
              /* eslint-disable-next-line @next/next/no-img-element -- a local
                 object URL, never optimised or remote. */
              <img src={posterPreview} alt="" className="size-full object-cover" />
            ) : hero?.posterUrl ? (
              <Image
                unoptimized
                src={hero.posterUrl}
                alt={hero.posterAltText}
                width={224}
                height={126}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-[0.65rem] text-mute/50">
                no hero set
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => posterInput.current?.click()}
            disabled={busy}
            className={`${adminGhostButton} mt-2 w-full`}
          >
            {hasPoster ? 'Replace poster' : 'Choose poster'}
          </button>
          <input
            ref={posterInput}
            type="file"
            accept={acceptedUploadTypes.join(',')}
            onChange={(event) => pickPoster(event.target.files)}
            className="sr-only"
          />
          <p className="mt-1.5 text-[0.65rem] text-mute/60">Cropped to 16:9, 2400×1350.</p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <label className={adminLabel} htmlFor="hero-alt">
              Poster alt text — English
            </label>
            <input
              id="hero-alt"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              className={adminField}
            />
          </div>
          <div>
            <label className={adminLabel} htmlFor="hero-alt-zh">
              Poster alt text — 繁體中文
            </label>
            <input
              id="hero-alt-zh"
              lang="zh-Hant-HK"
              value={altTextZh}
              onChange={(event) => setAltTextZh(event.target.value)}
              className={adminField}
            />
          </div>

          <div>
            <span className={adminLabel}>Showreel (optional)</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => videoInput.current?.click()}
                disabled={busy}
                className={adminGhostButton}
              >
                {hero?.videoUrl ? 'Replace showreel' : 'Choose showreel'}
              </button>
              <span className="truncate font-mono text-[0.65rem] text-mute/60">
                {videoName ?? (hero?.videoUrl ? 'one saved' : 'none')}
              </span>
            </div>
            <input
              ref={videoInput}
              type="file"
              accept="video/mp4"
              onChange={(event) => setVideoName(event.target.files?.[0]?.name ?? null)}
              className="sr-only"
            />
            <p className="mt-1.5 text-[0.65rem] text-mute/60">
              Silent MP4, 15–30s, under 25 MB. Uploaded as supplied — nothing re-encodes it
              here, so export it web-ready.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy || !canSave}
              className={adminPrimaryButton}
            >
              {busy ? 'Saving…' : 'Save hero'}
            </button>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="empty:hidden mt-3 text-sm text-mute">
        {status}
      </p>
    </section>
  );
}
