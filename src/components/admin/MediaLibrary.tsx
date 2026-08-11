'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Pin, PinOff, Upload, X } from 'lucide-react';

import {
  acceptedUploadTypes,
  maxUploadBytes,
  photoAspects,
  type ManagedPhoto,
  type PhotoFieldErrors,
} from '@/lib/photo-schema';
import { galleryColumns, galleryGridColumns, packGalleryRows } from '@/lib/gallery-layout';
import { aspectRatios } from '@/lib/utils';
import type { MediaAspect } from '@/content/projects';
import {
  adminCard,
  adminField,
  adminGhostButton,
  adminIconButton,
  adminLabel,
  adminPrimaryButton,
} from './admin-ui';

type ProjectSummary = { slug: string; title: string; builtIn: MediaAspect[] };

type Props = {
  projects: ProjectSummary[];
  initialSlug: string;
  initialItems: ManagedPhoto[];
  storageConfigured: boolean;
};

/** A file picked but not yet uploaded. */
type Staged = {
  localId: string;
  file: File;
  previewUrl: string;
  aspect: MediaAspect;
  altText: string;
  altTextZh: string;
  captionEn: string;
  captionZh: string;
  error?: string;
};

/** Pinned photos lead, so the list always reads in the order the page renders. */
function pinnedFirst(list: ManagedPhoto[]): ManagedPhoto[] {
  return [...list.filter((item) => item.pinned), ...list.filter((item) => !item.pinned)];
}

function isAcceptedFile(file: File): boolean {
  return (acceptedUploadTypes as readonly string[]).includes(file.type);
}

export default function MediaLibrary({
  projects,
  initialSlug,
  initialItems,
  storageConfigured,
}: Props) {
  const [slug, setSlug] = useState(initialSlug);
  const [items, setItems] = useState<ManagedPhoto[]>(pinnedFirst(initialItems));
  const [staged, setStaged] = useState<Staged[]>([]);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const project = projects.find((entry) => entry.slug === slug);
  const builtIn = project?.builtIn ?? [];

  /* ---------------------------------------------------------------- */
  /* Server round trips                                                */
  /* ---------------------------------------------------------------- */

  async function load(nextSlug: string) {
    setBusy(true);
    const response = await fetch(`/api/media?slug=${encodeURIComponent(nextSlug)}`);
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setItems([]);
      setStatus(body.message ?? `Could not load photos (${body.error ?? response.status}).`);
      return;
    }

    setItems(pinnedFirst(body.items));
    setDirty(false);
    setStatus('');
  }

  function switchProject(nextSlug: string) {
    clearStaged();
    setSlug(nextSlug);
    setEditingId(null);
    setConfirmingId(null);
    void load(nextSlug);
  }

  async function publishStaged() {
    setBusy(true);
    let uploaded = 0;
    const failures: Staged[] = [];

    // One request per photo: each gets its own validation and error, and a
    // single bad file cannot fail the whole batch.
    for (const item of staged) {
      const form = new FormData();
      form.set('file', item.file);
      form.set('slug', slug);
      form.set('aspect', item.aspect);
      form.set('altText', item.altText);
      form.set('altTextZh', item.altTextZh);
      form.set('captionEn', item.captionEn);
      form.set('captionZh', item.captionZh);

      setStatus(`Uploading ${uploaded + failures.length + 1} of ${staged.length}…`);

      const response = await fetch('/api/media', { method: 'POST', body: form });
      const body: { message?: string; error?: string; fieldErrors?: PhotoFieldErrors } =
        await response.json().catch(() => ({}));

      if (response.ok) {
        URL.revokeObjectURL(item.previewUrl);
        uploaded += 1;
        continue;
      }

      const firstFieldError = body.fieldErrors ? Object.values(body.fieldErrors)[0] : undefined;
      failures.push({
        ...item,
        error: firstFieldError ?? body.message ?? `Upload failed (${body.error ?? response.status}).`,
      });
    }

    setStaged(failures);
    setBusy(false);
    setStatus(
      failures.length === 0
        ? `Added ${uploaded} photo${uploaded === 1 ? '' : 's'}.`
        : `Added ${uploaded}. ${failures.length} still need attention.`,
    );

    await load(slug);
  }

  async function saveOrder() {
    setBusy(true);
    setStatus('Saving order…');

    const response = await fetch('/api/media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, items: items.map(({ id, pinned }) => ({ id, pinned })) }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setStatus(body.message ?? `Could not save the order (${body.error ?? response.status}).`);
      return;
    }

    setItems(pinnedFirst(body.items));
    setDirty(false);
    setStatus('Order saved.');
  }

  async function saveText(id: string, values: Omit<Staged, 'localId' | 'file' | 'previewUrl' | 'aspect'>) {
    setBusy(true);

    const response = await fetch('/api/media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, id, ...values }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      const firstFieldError = body.fieldErrors
        ? Object.values(body.fieldErrors as PhotoFieldErrors)[0]
        : undefined;
      setStatus(firstFieldError ?? body.message ?? `Could not save (${body.error ?? response.status}).`);
      return;
    }

    setItems((current) => current.map((item) => (item.id === id ? body.photo : item)));
    setEditingId(null);
    setStatus('Details updated.');
  }

  async function remove(id: string) {
    setBusy(true);
    const response = await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, id }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setConfirmingId(null);

    if (!response.ok) {
      setStatus(body.message ?? `Delete failed (${body.error ?? response.status}).`);
      return;
    }

    setStatus('Photo removed.');
    await load(slug);
  }

  /* ---------------------------------------------------------------- */
  /* Staging                                                           */
  /* ---------------------------------------------------------------- */

  function addFiles(files: FileList | null) {
    if (!files) return;

    const next: Staged[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(files)) {
      if (!isAcceptedFile(file)) {
        rejected.push(`${file.name} is not a supported image`);
        continue;
      }
      if (file.size > maxUploadBytes) {
        rejected.push(`${file.name} is over ${Math.round(maxUploadBytes / 1024 / 1024)} MB`);
        continue;
      }

      next.push({
        localId: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        aspect: 'landscape',
        altText: '',
        altTextZh: '',
        captionEn: '',
        captionZh: '',
      });
    }

    setStaged((current) => [...current, ...next]);
    setStatus(rejected.length ? `Skipped: ${rejected.join('; ')}.` : '');
  }

  function updateStaged(localId: string, patch: Partial<Staged>) {
    setStaged((current) =>
      current.map((item) => (item.localId === localId ? { ...item, ...patch } : item)),
    );
  }

  function dropStaged(localId: string) {
    setStaged((current) => {
      const target = current.find((item) => item.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.localId !== localId);
    });
  }

  function clearStaged() {
    setStaged((current) => {
      for (const item of current) URL.revokeObjectURL(item.previewUrl);
      return [];
    });
  }

  const stagedReady =
    staged.length > 0 && staged.every((item) => item.altText.trim() && item.altTextZh.trim());

  /* ---------------------------------------------------------------- */
  /* Ordering                                                          */
  /* ---------------------------------------------------------------- */

  function move(index: number, delta: -1 | 1) {
    setItems((current) => {
      const next = [...current];
      const a = next[index];
      const b = next[index + delta];
      if (!a || !b) return current;
      next[index] = b;
      next[index + delta] = a;
      return next;
    });
    setDirty(true);
  }

  /** Drag one row onto another. Landing among the pinned adopts their pin state. */
  function moveTo(from: number, to: number) {
    if (from === to) return;
    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      const landing = current[to];
      if (!moved || !landing) return current;
      next.splice(to, 0, { ...moved, pinned: landing.pinned });
      return pinnedFirst(next);
    });
    setDirty(true);
  }

  function togglePin(id: string) {
    setItems((current) =>
      pinnedFirst(
        current.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item)),
      ),
    );
    setDirty(true);
  }

  /* ---------------------------------------------------------------- */

  if (!storageConfigured) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className={`${adminCard} p-5 text-sm text-mute`}>
          <p className="text-bone">Storage is not connected on this deployment.</p>
          <p className="mt-3">
            Add a Blob store in the Vercel dashboard under Storage — that sets{' '}
            <code className="text-bone/80">BLOB_READ_WRITE_TOKEN</code> — then redeploy.
          </p>
          <p className="mt-3">
            Until then photos are added the original way: drop the file into{' '}
            <code className="text-bone/80">public/media/</code> and set the path in{' '}
            <code className="text-bone/80">src/content/projects.ts</code>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-8 md:grid-cols-[13rem_1fr]">
      {/* Project rail */}
      <nav aria-label="Projects" className="md:sticky md:top-20 md:self-start">
        <h2 className={adminLabel}>Projects</h2>
        <ul className="mt-2.5 flex flex-col gap-0.5">
          {projects.map((entry) => {
            const active = entry.slug === slug;
            return (
              <li key={entry.slug}>
                <button
                  type="button"
                  onClick={() => switchProject(entry.slug)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full rounded-xs px-2.5 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-surface-2 font-medium text-bone'
                      : 'text-mute hover:bg-surface hover:text-bone'
                  }`}
                >
                  {entry.title}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-col gap-8">
        {/* Dropzone */}
        <section aria-labelledby="add-photos">
          <h2 id="add-photos" className={adminLabel}>
            Add photos
          </h2>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDropping(true);
            }}
            onDragLeave={() => setDropping(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDropping(false);
              addFiles(event.dataTransfer.files);
            }}
            className={`mt-2.5 rounded-xs border border-dashed p-8 text-center transition-colors ${
              dropping ? 'border-lime bg-lime/5' : 'border-line-strong bg-surface'
            }`}
          >
            <Upload aria-hidden="true" className="mx-auto size-5 text-mute" />
            <p className="mt-3 text-sm text-bone">Drop photos here</p>
            <p className="mt-1 text-xs text-mute/70">
              JPEG, PNG, WebP, AVIF or TIFF · up to{' '}
              {Math.round(maxUploadBytes / 1024 / 1024)} MB each · several at once
            </p>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className={`${adminGhostButton} mt-4`}
            >
              Choose files
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={acceptedUploadTypes.join(',')}
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = '';
              }}
              className="sr-only"
            />
          </div>
        </section>

        {/* Staged */}
        {staged.length > 0 ? (
          <section aria-labelledby="staged" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="staged" className={adminLabel}>
                Ready to add ({staged.length})
              </h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={clearStaged} disabled={busy} className={adminGhostButton}>
                  Discard all
                </button>
                <button
                  type="button"
                  onClick={publishStaged}
                  disabled={busy || !stagedReady}
                  className={adminPrimaryButton}
                >
                  {busy ? 'Working…' : `Add ${staged.length} photo${staged.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>

            {!stagedReady ? (
              <p className="text-xs text-mute/70">
                Alt text is required in both languages for every photo before they can be
                added.
              </p>
            ) : null}

            <ul className="flex flex-col gap-3">
              {staged.map((item) => (
                <StagedCard
                  key={item.localId}
                  item={item}
                  busy={busy}
                  onChange={(patch) => updateStaged(item.localId, patch)}
                  onDiscard={() => dropStaged(item.localId)}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {/* Always in the DOM so updates are announced, but collapsed when empty
            rather than reserving a band of dead space. */}
        <p aria-live="polite" className="empty:hidden text-sm text-mute">
          {status}
        </p>

        {/* Published */}
        <section aria-labelledby="published" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="published" className={adminLabel}>
              In this gallery ({items.length})
            </h2>
            {dirty ? (
              <button type="button" onClick={saveOrder} disabled={busy} className={adminPrimaryButton}>
                {busy ? 'Saving…' : 'Save order'}
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-mute/70">Nothing added for this project yet.</p>
          ) : (
            <>
              <p className="text-xs text-mute/70">
                Drag a row, or use the arrows. Pinned photos lead the gallery, ahead of the{' '}
                {builtIn.length} slot{builtIn.length === 1 ? '' : 's'} built into the site.
              </p>

              <ul className="flex flex-col gap-2">
                {items.map((item, index) => {
                  const group = items.filter((other) => other.pinned === item.pinned);
                  const first = items.indexOf(group[0]!);
                  const last = items.indexOf(group[group.length - 1]!);

                  return (
                    <li
                      key={item.id}
                      draggable={!busy && editingId !== item.id}
                      onDragStart={() => setDragFrom(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (dragFrom !== null) moveTo(dragFrom, index);
                        setDragFrom(null);
                      }}
                      onDragEnd={() => setDragFrom(null)}
                      className={`rounded-xs border p-3 transition-colors ${
                        item.pinned ? 'border-lime/40 bg-lime/5' : 'border-line bg-surface'
                      } ${dragFrom === index ? 'opacity-40' : ''}`}
                    >
                      {editingId === item.id ? (
                        <EditForm
                          photo={item}
                          busy={busy}
                          onCancel={() => setEditingId(null)}
                          onSave={(values) => saveText(item.id, values)}
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <GripVertical
                            aria-hidden="true"
                            className="size-4 shrink-0 cursor-grab text-mute/40"
                          />
                          <span className="w-4 shrink-0 text-center font-mono text-xs text-mute/60">
                            {index + 1}
                          </span>

                          <Image
                            // An internal tool has no reason to spend image optimisation here.
                            unoptimized
                            src={item.url}
                            alt={item.altText}
                            width={96}
                            height={64}
                            className="h-14 w-20 shrink-0 rounded-xs object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-bone">{item.altText}</p>
                            <p className="truncate font-mono text-xs text-mute/70">
                              {item.aspect} · {galleryColumns[item.aspect]}/{galleryGridColumns}
                              {item.pinned ? ' · pinned' : ''}
                            </p>
                          </div>

                          {confirmingId === item.id ? (
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-xs text-amber">Remove this photo?</span>
                              <button
                                type="button"
                                onClick={() => remove(item.id)}
                                disabled={busy}
                                className="rounded-xs border border-amber/50 bg-amber/10 px-2.5 py-1.5 text-xs text-amber transition-colors hover:bg-amber/20 disabled:opacity-40"
                              >
                                Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(null)}
                                className={adminGhostButton}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => move(index, -1)}
                                disabled={busy || index === first}
                                aria-label={`Move photo ${index + 1} earlier`}
                                className={adminIconButton}
                              >
                                <ArrowUp aria-hidden="true" className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => move(index, 1)}
                                disabled={busy || index === last}
                                aria-label={`Move photo ${index + 1} later`}
                                className={adminIconButton}
                              >
                                <ArrowDown aria-hidden="true" className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => togglePin(item.id)}
                                disabled={busy}
                                aria-pressed={item.pinned}
                                aria-label={`${item.pinned ? 'Unpin' : 'Pin'} photo ${index + 1}`}
                                className={`${adminIconButton} ${
                                  item.pinned ? 'border-lime/50 text-lime' : ''
                                }`}
                              >
                                {item.pinned ? (
                                  <PinOff aria-hidden="true" className="size-3.5" />
                                ) : (
                                  <Pin aria-hidden="true" className="size-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(item.id)}
                                disabled={busy}
                                className={adminGhostButton}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(item.id)}
                                disabled={busy}
                                aria-label={`Remove photo ${index + 1}`}
                                className={adminGhostButton}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <LayoutPreview
                items={items}
                builtIn={builtIn}
                pinnedCount={items.filter((item) => item.pinned).length}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

/* ==========================================================================
   Staged card — crop preview plus the words the photo needs
   ========================================================================== */

function StagedCard({
  item,
  busy,
  onChange,
  onDiscard,
}: {
  item: Staged;
  busy: boolean;
  onChange: (patch: Partial<Staged>) => void;
  onDiscard: () => void;
}) {
  return (
    <li className={`${adminCard} p-3`}>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-52 sm:shrink-0">
          {/* The frame carries the chosen ratio and the image fills it, so this
              preview is literally what the crop will keep. */}
          <div
            style={{ aspectRatio: aspectRatios[item.aspect] }}
            className="overflow-hidden rounded-xs border border-line bg-ink"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a local
                object URL, never optimised or remote. */}
            <img
              src={item.previewUrl}
              alt=""
              className="size-full object-cover"
            />
          </div>

          <div className="mt-2 flex gap-1">
            {photoAspects.map((aspect) => (
              <button
                key={aspect}
                type="button"
                onClick={() => onChange({ aspect })}
                aria-pressed={item.aspect === aspect}
                className={`flex-1 rounded-xs border px-1.5 py-1 font-mono text-[0.65rem] transition-colors ${
                  item.aspect === aspect
                    ? 'border-lime/50 bg-lime/10 text-lime'
                    : 'border-line text-mute hover:text-bone'
                }`}
              >
                {aspect}
              </button>
            ))}
          </div>
          <p className="mt-1.5 truncate font-mono text-[0.65rem] text-mute/50">
            {item.file.name}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <label className={adminLabel} htmlFor={`alt-${item.localId}`}>
              Alt text — English
            </label>
            <input
              id={`alt-${item.localId}`}
              value={item.altText}
              onChange={(event) => onChange({ altText: event.target.value })}
              placeholder="Goalkeeper claiming a cross under floodlights"
              className={adminField}
            />
          </div>

          <div>
            <label className={adminLabel} htmlFor={`altzh-${item.localId}`}>
              Alt text — 繁體中文
            </label>
            <input
              id={`altzh-${item.localId}`}
              lang="zh-Hant-HK"
              value={item.altTextZh}
              onChange={(event) => onChange({ altTextZh: event.target.value })}
              placeholder="守門員在射燈下摘下傳中球"
              className={adminField}
            />
          </div>

          <details className="text-xs text-mute">
            <summary className="cursor-pointer select-none py-1">Caption (optional)</summary>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <input
                aria-label="Caption — English"
                value={item.captionEn}
                onChange={(event) => onChange({ captionEn: event.target.value })}
                placeholder="English"
                className={adminField}
              />
              <input
                aria-label="Caption — 繁體中文"
                lang="zh-Hant-HK"
                value={item.captionZh}
                onChange={(event) => onChange({ captionZh: event.target.value })}
                placeholder="繁體中文"
                className={adminField}
              />
            </div>
            <p className="mt-1.5 text-mute/60">Only shown when both are filled in.</p>
          </details>

          {item.error ? (
            <p role="alert" className="text-xs text-amber">
              {item.error}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onDiscard}
          disabled={busy}
          aria-label={`Discard ${item.file.name}`}
          className={`${adminIconButton} self-start`}
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </li>
  );
}

/* ==========================================================================
   Edit form — words only; the crop is baked into the stored file
   ========================================================================== */

function EditForm({
  photo,
  busy,
  onCancel,
  onSave,
}: {
  photo: ManagedPhoto;
  busy: boolean;
  onCancel: () => void;
  onSave: (values: {
    altText: string;
    altTextZh: string;
    captionEn: string;
    captionZh: string;
  }) => void;
}) {
  const [altText, setAltText] = useState(photo.altText);
  const [altTextZh, setAltTextZh] = useState(photo.altTextZh);
  const [captionEn, setCaptionEn] = useState(photo.caption?.en ?? '');
  const [captionZh, setCaptionZh] = useState(photo.caption?.['zh-hk'] ?? '');

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabel} htmlFor={`edit-alt-${photo.id}`}>
            Alt text — English
          </label>
          <input
            id={`edit-alt-${photo.id}`}
            value={altText}
            autoFocus
            onChange={(event) => setAltText(event.target.value)}
            className={adminField}
          />
        </div>
        <div>
          <label className={adminLabel} htmlFor={`edit-altzh-${photo.id}`}>
            Alt text — 繁體中文
          </label>
          <input
            id={`edit-altzh-${photo.id}`}
            lang="zh-Hant-HK"
            value={altTextZh}
            onChange={(event) => setAltTextZh(event.target.value)}
            className={adminField}
          />
        </div>
        <div>
          <label className={adminLabel} htmlFor={`edit-cap-${photo.id}`}>
            Caption — English
          </label>
          <input
            id={`edit-cap-${photo.id}`}
            value={captionEn}
            onChange={(event) => setCaptionEn(event.target.value)}
            className={adminField}
          />
        </div>
        <div>
          <label className={adminLabel} htmlFor={`edit-capzh-${photo.id}`}>
            Caption — 繁體中文
          </label>
          <input
            id={`edit-capzh-${photo.id}`}
            lang="zh-Hant-HK"
            value={captionZh}
            onChange={(event) => setCaptionZh(event.target.value)}
            className={adminField}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSave({ altText, altTextZh, captionEn, captionZh })}
          disabled={busy || !altText.trim() || !altTextZh.trim()}
          className={adminPrimaryButton}
        >
          {busy ? 'Saving…' : 'Save details'}
        </button>
        <button type="button" onClick={onCancel} className={adminGhostButton}>
          Cancel
        </button>
        <span className="text-xs text-mute/60">
          The crop is fixed at upload — re-upload to change it.
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   Layout preview
   ========================================================================== */

type PreviewCell = { key: string; aspect: MediaAspect; kind: 'pinned' | 'built-in' | 'rest' };

const cellTone: Record<PreviewCell['kind'], string> = {
  pinned: 'bg-lime/25 border-lime/50 text-lime',
  'built-in': 'bg-surface-2 border-line text-mute/70',
  rest: 'bg-club-deep/50 border-club-ink/30 text-club-ink',
};

/**
 * Shows the rows the gallery grid will actually produce.
 *
 * The gallery is 12 columns wide and each crop claims a different share of it,
 * so a running order that reads fine as a list can still leave a ragged row on
 * the page. This is the cheapest place to notice that — before publishing.
 */
function LayoutPreview({
  items,
  builtIn,
  pinnedCount,
}: {
  items: ManagedPhoto[];
  builtIn: MediaAspect[];
  pinnedCount: number;
}) {
  const cells: PreviewCell[] = [
    ...items.slice(0, pinnedCount).map((item) => ({
      key: item.id,
      aspect: item.aspect,
      kind: 'pinned' as const,
    })),
    ...builtIn.map((aspect, index) => ({
      key: `built-in-${index}`,
      aspect,
      kind: 'built-in' as const,
    })),
    ...items.slice(pinnedCount).map((item) => ({
      key: item.id,
      aspect: item.aspect,
      kind: 'rest' as const,
    })),
  ];

  const rows = packGalleryRows(cells, (cell) => cell.aspect);

  return (
    <div className={`${adminCard} mt-2 p-4`}>
      <h3 className={adminLabel}>Gallery layout</h3>
      <p className="mt-1.5 text-xs text-mute/70">
        How these rows will sit on the case-study page. A row that does not reach 12 columns
        leaves a gap — landscape pairs with portrait, square pairs with square.
      </p>

      <ol className="mt-3 flex flex-col gap-1.5">
        {rows.map((row, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-4 shrink-0 font-mono text-[0.65rem] text-mute/50">
              {index + 1}
            </span>
            <div className="flex flex-1 gap-1">
              {row.items.map((cell) => (
                <span
                  key={cell.key}
                  style={{ flexGrow: galleryColumns[cell.aspect] }}
                  className={`truncate rounded-[3px] border px-1.5 py-1 text-center font-mono text-[0.62rem] ${cellTone[cell.kind]}`}
                >
                  {cell.aspect}
                </span>
              ))}
              {row.filled < galleryGridColumns ? (
                <span
                  style={{ flexGrow: galleryGridColumns - row.filled }}
                  className="rounded-[3px] border border-dashed border-line/60 py-1 text-center font-mono text-[0.62rem] text-mute/40"
                >
                  gap
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[0.62rem] text-mute/60">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] border border-lime/50 bg-lime/25" /> pinned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] border border-line bg-surface-2" /> built into
          the site
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] border border-club-ink/30 bg-club-deep/50" />{' '}
          uploaded
        </span>
      </div>
    </div>
  );
}
