'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

import { adminCard, adminField, adminGhostButton, adminLabel, adminPrimaryButton } from './admin-ui';
import MediaVersions from './MediaVersions';
import type { MediaSlotRecord, MediaVersion } from '@/lib/campaign-schema';
import type { MediaSlotDefinition } from '@/lib/media-slots';
import { acceptedUploadTypes } from '@/lib/photo-schema';

/* ==========================================================================
   Page media.

   The fixed image positions a layout reserves — the two frames on the home
   intro, the pair on About, the one beside each service. Each is uploaded
   with the alt text it needs, and each can be emptied again, at which point
   the page goes back to the branded panel it shows today.
   ========================================================================== */

const previewRatio: Record<string, string> = {
  landscape: '16 / 10',
  portrait: '3 / 4',
  square: '1 / 1',
};

type Props = {
  slots: MediaSlotDefinition[];
  initialMedia: Record<string, MediaSlotRecord>;
  /** Previous versions per slot, keyed `page:<slot>`. */
  initialHistory: Record<string, MediaVersion[]>;
  storageConfigured: boolean;
};

export default function MediaSlotPanel({
  slots,
  initialMedia,
  initialHistory,
  storageConfigured,
}: Props) {
  const [media, setMedia] = useState(initialMedia);

  if (slots.length === 0) return null;

  if (!storageConfigured) {
    return (
      <section aria-labelledby="page-media" className={`${adminCard} p-5`}>
        <h2 id="page-media" className={adminLabel}>
          Images
        </h2>
        <p className="mt-2 text-sm text-mute">
          Uploading needs a Blob store. Add one to this project in Vercel and reload.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="page-media" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="page-media" className={adminLabel}>
          Images ({slots.length})
        </h2>
        <p className="text-[0.65rem] text-mute/60">
          Cropped and converted on upload. Location data is stripped.
        </p>
      </div>

      {slots.map((slot) => (
        <SlotCard
          key={slot.key}
          slot={slot}
          record={media[slot.key]}
          initialVersions={initialHistory[`page:${slot.key}`] ?? []}
          onChange={(record) =>
            setMedia((current) => {
              const next = { ...current };
              if (record) next[slot.key] = record;
              else delete next[slot.key];
              return next;
            })
          }
        />
      ))}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function SlotCard({
  slot,
  record,
  initialVersions,
  onChange,
}: {
  slot: MediaSlotDefinition;
  record?: MediaSlotRecord;
  initialVersions: MediaVersion[];
  onChange: (record: MediaSlotRecord | null) => void;
}) {
  const [altText, setAltText] = useState(record?.altText ?? '');
  const [altTextZh, setAltTextZh] = useState(record?.altTextZh ?? '');
  const [captionEn, setCaptionEn] = useState(record?.caption?.en ?? '');
  const [captionZh, setCaptionZh] = useState(record?.caption?.['zh-hk'] ?? '');
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [versions, setVersions] = useState(initialVersions);
  const fileInput = useRef<HTMLInputElement>(null);

  const hasImage = Boolean(record?.url || preview);
  const canSave = hasImage && altText.trim() !== '' && altTextZh.trim() !== '';

  function discardPreview() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  function pick(file: File | undefined) {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setStatus('');
  }

  async function save() {
    setBusy(true);
    setErrors({});

    const form = new FormData();
    form.set('slot', slot.key);
    form.set('altText', altText);
    form.set('altTextZh', altTextZh);
    form.set('captionEn', captionEn);
    form.set('captionZh', captionZh);

    const file = fileInput.current?.files?.[0];
    if (file) form.set('image', file);

    const response = await fetch('/api/content/media', { method: 'POST', body: form });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      if (body.fieldErrors) setErrors(body.fieldErrors);
      const firstFieldError = body.fieldErrors
        ? (Object.values(body.fieldErrors)[0] as string | undefined)
        : undefined;
      setStatus(
        firstFieldError ?? body.message ?? `Could not save (${body.error ?? response.status}).`,
      );
      return;
    }

    discardPreview();
    onChange(body.media ?? null);
    if (body.versions) setVersions(body.versions);
    setStatus('Published.');
  }

  async function clear() {
    setBusy(true);

    const response = await fetch('/api/content/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot: slot.key }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setConfirmingClear(false);

    if (!response.ok) {
      setStatus(body.message ?? `Could not remove it (${body.error ?? response.status}).`);
      return;
    }

    discardPreview();
    setAltText('');
    setAltTextZh('');
    setCaptionEn('');
    setCaptionZh('');
    onChange(null);
    if (body.versions) setVersions(body.versions);
    setStatus('Removed — the page shows its placeholder again. You can put it back below.');
  }

  return (
    <div className={`${adminCard} p-4`}>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-48 sm:shrink-0">
          <div
            className="relative overflow-hidden rounded-xs border border-line bg-ink"
            style={{ aspectRatio: previewRatio[slot.aspect] ?? '16 / 10' }}
          >
            {preview ? (
              /* A local object URL has no dimensions to give `next/image`. */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={preview} alt="" className="size-full object-cover" />
            ) : record?.url ? (
              <Image
                src={record.url}
                alt=""
                fill
                unoptimized
                sizes="192px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-[0.65rem] text-mute/40">
                Nothing uploaded
              </span>
            )}
          </div>

          <input
            ref={fileInput}
            type="file"
            accept={acceptedUploadTypes.join(',')}
            className="sr-only"
            onChange={(event) => pick(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className={`${adminGhostButton} mt-2 w-full`}
            disabled={busy}
          >
            <Upload aria-hidden="true" className="size-3.5" />
            {record?.url || preview ? 'Replace image' : 'Choose image'}
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <h3 className="text-sm text-bone">{slot.label}</h3>
            <p className="mt-0.5 text-[0.65rem] text-mute/60">
              {slot.hint} · {slot.aspect}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={adminLabel}>Alt text — English</span>
              <input
                type="text"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Goalkeeper claiming a cross under floodlights"
                className={adminField}
              />
            </label>
            <label className="block">
              <span className={adminLabel}>Alt text — 繁體中文</span>
              <input
                type="text"
                lang="zh-Hant-HK"
                value={altTextZh}
                onChange={(event) => setAltTextZh(event.target.value)}
                placeholder="守門員在射燈下摘下傳中球"
                className={adminField}
              />
            </label>
          </div>

          <details>
            <summary className="cursor-pointer text-xs text-mute hover:text-bone">
              Caption (optional)
            </summary>
            <p className="mt-1.5 text-[0.65rem] text-mute/50">
              Only shown when both languages are filled in.
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                aria-label="Caption — English"
                value={captionEn}
                onChange={(event) => setCaptionEn(event.target.value)}
                placeholder="Matchday"
                className={`${adminField} mt-0`}
              />
              <input
                type="text"
                lang="zh-Hant-HK"
                aria-label="Caption — 繁體中文"
                value={captionZh}
                onChange={(event) => setCaptionZh(event.target.value)}
                placeholder="比賽日"
                className={`${adminField} mt-0`}
              />
            </div>
          </details>

          {Object.values(errors)[0] ? (
            <p role="alert" className="text-xs text-amber">
              {Object.values(errors)[0]}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={adminPrimaryButton}
              disabled={busy || !canSave}
              onClick={save}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>

            {record?.url ? (
              confirmingClear ? (
                <>
                  <span className="text-xs text-mute">Remove this image?</span>
                  <button
                    type="button"
                    className={adminGhostButton}
                    disabled={busy}
                    onClick={clear}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    className={adminGhostButton}
                    onClick={() => setConfirmingClear(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={adminGhostButton}
                  onClick={() => setConfirmingClear(true)}
                >
                  Remove
                </button>
              )
            ) : null}

            {preview ? (
              <button type="button" className={adminGhostButton} onClick={discardPreview}>
                Discard pick
              </button>
            ) : null}

            {!canSave && hasImage ? (
              <span className="text-[0.65rem] text-mute/60">Alt text is required in both languages.</span>
            ) : null}
          </div>

          <p aria-live="polite" className="text-sm text-mute empty:hidden">
            {status}
          </p>

          <MediaVersions
            historyKey={`page:${slot.key}`}
            versions={versions}
            fallbackAspect={slot.aspect}
            disabled={busy}
            onRestored={(body) => {
              setVersions(body.versions);
              const restored = body.media as MediaSlotRecord | null;
              onChange(restored);
              if (restored) {
                setAltText(restored.altText);
                setAltTextZh(restored.altTextZh);
                setCaptionEn(restored.caption?.en ?? '');
                setCaptionZh(restored.caption?.['zh-hk'] ?? '');
              }
              setStatus('Restored.');
            }}
          />
        </div>
      </div>
    </div>
  );
}
