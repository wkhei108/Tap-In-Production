'use client';

import { useState } from 'react';
import { Undo2 } from 'lucide-react';

import { adminCard, adminGhostButton, adminLabel } from './admin-ui';
import type { CopySnapshot, CopyValue } from '@/lib/copy-schema';

/* ==========================================================================
   Publish history.

   Per-field "reset to original" only ever goes back to what shipped in the
   build. This goes back one publish at a time, which is what you want when
   the wording you replaced was itself an edit — or when a publish changed
   twelve fields and you want all twelve back.
   ========================================================================== */

function when(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';

  const seconds = Math.max(0, Math.round((Date.now() - then.getTime()) / 1000));
  if (seconds < 60) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  return then.toLocaleString();
}

export default function CopyHistory({
  namespace,
  snapshots,
  disabled,
  onRestored,
}: {
  namespace: string;
  snapshots: CopySnapshot[];
  disabled: boolean;
  onRestored: (body: {
    values: { en: Record<string, CopyValue>; zh: Record<string, CopyValue> };
    history: CopySnapshot[];
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (snapshots.length === 0) return null;

  async function restore(snapshotId: string) {
    setBusy(snapshotId);
    setError('');

    const response = await fetch('/api/content/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, snapshotId }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(null);

    if (!response.ok) {
      setError(body.message ?? `Could not undo that (${body.error ?? response.status}).`);
      return;
    }

    onRestored(body);
  }

  const latest = snapshots[0];

  return (
    <section aria-labelledby="copy-history" className={`${adminCard} p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="copy-history" className={adminLabel}>
            Publish history
          </h2>
          <p className="mt-1 text-[0.65rem] text-mute/60">
            Step this screen&rsquo;s wording back to how it was before a publish.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {latest ? (
            <button
              type="button"
              className={adminGhostButton}
              disabled={disabled || busy !== null}
              onClick={() => restore(latest.id)}
            >
              <Undo2 aria-hidden="true" className="size-3.5" />
              {busy === latest.id ? 'Undoing…' : 'Undo last publish'}
            </button>
          ) : null}
          {snapshots.length > 1 ? (
            <button
              type="button"
              className={adminGhostButton}
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            >
              {open ? 'Hide' : `All ${snapshots.length}`}
            </button>
          ) : null}
        </div>
      </div>

      {open ? (
        <ul className="mt-4 flex flex-col gap-2">
          {snapshots.map((snapshot, index) => (
            <li
              key={snapshot.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-2 text-xs"
            >
              <span className="text-mute">
                <span className="font-mono text-mute/50">{index + 1}.</span> Before a publish of{' '}
                {snapshot.changed.length}{' '}
                {snapshot.changed.length === 1 ? 'field' : 'fields'} · {when(snapshot.savedAt)}
              </span>
              <button
                type="button"
                className={adminGhostButton}
                disabled={disabled || busy !== null}
                onClick={() => restore(snapshot.id)}
              >
                {busy === snapshot.id ? 'Restoring…' : 'Restore this'}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-xs text-amber">
          {error}
        </p>
      ) : null}
    </section>
  );
}
