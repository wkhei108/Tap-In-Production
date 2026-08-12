'use client';

import Image from 'next/image';
import { useState } from 'react';
import { History, Undo2 } from 'lucide-react';

import { adminGhostButton } from './admin-ui';
import type { MediaVersion } from '@/lib/campaign-schema';

/* ==========================================================================
   Previous versions of one image.

   Replacing a picture files the old one rather than deleting it, so the
   common mistake — uploading the wrong file over the right one — is a click
   to undo instead of a hunt through a downloads folder.
   ========================================================================== */

const previewRatio: Record<string, string> = {
  landscape: '16 / 10',
  portrait: '3 / 4',
  square: '1 / 1',
};

function when(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;

  return new Date(iso).toLocaleDateString();
}

type Props = {
  /** `page:<slot>`, `social:<id>` or `brand:<kind>`. */
  historyKey: string;
  versions: MediaVersion[];
  /** Ratio for the thumbnails when a version does not carry its own. */
  fallbackAspect?: string;
  /** `contain` suits artwork; `cover` suits photography. */
  fit?: 'cover' | 'contain';
  disabled?: boolean;
  onRestored: (body: {
    versions: MediaVersion[];
    media?: unknown;
    post?: unknown;
    brand?: unknown;
  }) => void;
};

export default function MediaVersions({
  historyKey,
  versions,
  fallbackAspect = 'landscape',
  fit = 'cover',
  disabled = false,
  onRestored,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (versions.length === 0) return null;

  async function restore(versionId: string) {
    setBusy(versionId);
    setError('');

    const response = await fetch('/api/content/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: historyKey, versionId }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(null);

    if (!response.ok) {
      setError(body.message ?? `Could not restore it (${body.error ?? response.status}).`);
      return;
    }

    onRestored(body);
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[0.65rem] text-mute transition-colors hover:text-bone"
      >
        <History aria-hidden="true" className="size-3" />
        Previous versions ({versions.length})
      </button>

      {open ? (
        <>
          <ul className="mt-3 flex flex-wrap gap-3">
            {versions.map((version) => (
              <li key={version.id} className="w-24">
                <div
                  className="relative overflow-hidden rounded-xs border border-line bg-ink"
                  style={{
                    aspectRatio: previewRatio[version.aspect ?? fallbackAspect] ?? '16 / 10',
                  }}
                >
                  <Image
                    src={version.url}
                    alt=""
                    fill
                    unoptimized
                    sizes="96px"
                    className={fit === 'contain' ? 'object-contain p-1.5' : 'object-cover'}
                  />
                </div>

                <p className="mt-1 text-[0.6rem] text-mute/60">
                  {version.reason === 'removed' ? 'Removed' : 'Replaced'} · {when(version.replacedAt)}
                </p>

                <button
                  type="button"
                  onClick={() => restore(version.id)}
                  disabled={disabled || busy !== null}
                  className={`${adminGhostButton} mt-1 w-full`}
                >
                  <Undo2 aria-hidden="true" className="size-3" />
                  {busy === version.id ? 'Restoring…' : 'Restore'}
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-2 text-[0.6rem] text-mute/50">
            The last {versions.length === 1 ? 'version is' : `${versions.length} versions are`} kept.
            Restoring files the current one here too, so this is always reversible.
          </p>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-xs text-amber">
          {error}
        </p>
      ) : null}
    </div>
  );
}
