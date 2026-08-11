'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Pin, PinOff } from 'lucide-react';
import { photoAspects, type ManagedPhoto, type PhotoUploadField } from '@/lib/photo-schema';
import { galleryColumns, galleryGridColumns, packGalleryRows } from '@/lib/gallery-layout';
import type { MediaAspect } from '@/content/projects';

type Props = {
  projects: Array<{ slug: string; title: string; builtIn: MediaAspect[] }>;
  adminConfigured: boolean;
  storageConfigured: boolean;
};

type FieldErrors = Partial<Record<PhotoUploadField, string>>;

const field =
  'mt-1.5 w-full rounded-xs border border-line bg-surface px-3 py-2 text-sm text-bone ' +
  'outline-none focus-visible:border-lime';
const label = 'block text-xs uppercase tracking-wider text-mute';
const iconButton =
  'grid size-8 shrink-0 place-items-center rounded-xs border border-line text-mute ' +
  'transition-colors hover:text-bone disabled:pointer-events-none disabled:opacity-30';

/** Pinned photos lead, so the list always reads in the order the page renders. */
function pinnedFirst(list: ManagedPhoto[]): ManagedPhoto[] {
  return [...list.filter((item) => item.pinned), ...list.filter((item) => !item.pinned)];
}

export default function MediaManager({ projects, adminConfigured, storageConfigured }: Props) {
  const [token, setToken] = useState('');
  const [slug, setSlug] = useState(projects[0]?.slug ?? '');
  const [items, setItems] = useState<ManagedPhoto[]>([]);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const ready = adminConfigured && storageConfigured && token.length > 0 && slug.length > 0;
  const builtIn = projects.find((project) => project.slug === slug)?.builtIn ?? [];

  /**
   * Takes its slug and token as arguments rather than reading state, so it can
   * be called from the change handler that is setting them.
   */
  const load = useCallback(
    async (nextSlug: string, nextToken: string) => {
      if (!nextSlug || !nextToken) return;

      const response = await fetch(`/api/media?slug=${encodeURIComponent(nextSlug)}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
      });
      const body = await response.json();

      if (!response.ok) {
        setItems([]);
        setDirty(false);
        setStatus(body.message ?? `Could not load photos (${body.error ?? response.status}).`);
        return;
      }

      setItems(pinnedFirst(body.items));
      setDirty(false);
      setStatus('');
    },
    [],
  );

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setStatus('Uploading…');

    const response = await fetch('/api/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: new FormData(event.currentTarget),
    });
    const body = await response.json();
    setBusy(false);

    if (!response.ok) {
      setErrors(body.fieldErrors ?? {});
      setStatus(body.message ?? `Upload failed (${body.error ?? response.status}).`);
      return;
    }

    formRef.current?.reset();
    setStatus(`Uploaded — stored at ${body.width}×${body.height}, ${Math.round(body.bytes / 1024)} KB.`);
    await load(slug, token);
  }

  async function remove(id: string) {
    setBusy(true);
    const response = await fetch('/api/media', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, id }),
    });
    const body = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(body.message ?? `Delete failed (${body.error ?? response.status}).`);
      return;
    }

    setStatus('Photo removed.');
    await load(slug, token);
  }

  async function saveOrder() {
    setBusy(true);
    setStatus('Saving order…');

    const response = await fetch('/api/media', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        items: items.map(({ id, pinned }) => ({ id, pinned })),
      }),
    });
    const body = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(body.message ?? `Could not save the order (${body.error ?? response.status}).`);
      return;
    }

    setItems(pinnedFirst(body.items));
    setDirty(false);
    setStatus('Order saved.');
  }

  /** Swap with the neighbour. Only ever called within one pinned group. */
  function move(index: number, delta: -1 | 1) {
    setItems((current) => {
      const next = [...current];
      const target = index + delta;
      const a = next[index];
      const b = next[target];
      if (!a || !b) return current;
      next[index] = b;
      next[target] = a;
      return next;
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

  if (!adminConfigured || !storageConfigured) {
    return (
      <div className="mt-10 rounded-xs border border-line bg-surface p-5 text-sm text-mute">
        <p className="text-bone">This tool is not set up on this deployment yet.</p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {!adminConfigured ? (
            <li>
              <code className="text-bone/80">ADMIN_MEDIA_TOKEN</code> is unset or shorter
              than 32 characters. Generate one with{' '}
              <code className="text-bone/80">openssl rand -hex 32</code>.
            </li>
          ) : null}
          {!storageConfigured ? (
            <li>
              No Blob store is connected — add one in the Vercel dashboard under Storage,
              which sets <code className="text-bone/80">BLOB_READ_WRITE_TOKEN</code>.
            </li>
          ) : null}
        </ul>
        <p className="mt-3">
          Until then, photos are added the original way: drop the file into{' '}
          <code className="text-bone/80">public/media/</code> and set the path in{' '}
          <code className="text-bone/80">src/content/projects.ts</code>. See{' '}
          <code className="text-bone/80">docs/asset-guide.md</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-10">
      <div>
        <label className={label} htmlFor="token">
          Admin token
        </label>
        <input
          id="token"
          type="password"
          value={token}
          autoComplete="off"
          onChange={(event) => setToken(event.target.value)}
          onBlur={(event) => void load(slug, event.target.value)}
          className={field}
          placeholder="Paste ADMIN_MEDIA_TOKEN"
        />
        <p className="mt-1.5 text-xs text-mute/70">
          Held in memory only — it is gone when you reload.
        </p>
      </div>

      <form ref={formRef} onSubmit={upload} className="flex flex-col gap-5">
        <div>
          <label className={label} htmlFor="slug">
            Project
          </label>
          <select
            id="slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              void load(event.target.value, token);
            }}
            className={field}
          >
            {projects.map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="file">
              Photo
            </label>
            <input
              id="file"
              name="file"
              type="file"
              required
              accept="image/jpeg,image/png,image/webp,image/avif,image/tiff"
              className={field}
            />
            <p className="mt-1.5 text-xs text-mute/70">
              Resized, converted to WebP and stripped of location data on upload.
            </p>
          </div>

          <div>
            <label className={label} htmlFor="aspect">
              Crop
            </label>
            <select id="aspect" name="aspect" className={field} defaultValue="landscape">
              {photoAspects.map((aspect) => (
                <option key={aspect} value={aspect}>
                  {aspect} · {galleryColumns[aspect]}/{galleryGridColumns} columns
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label} htmlFor="altText">
            Alt text — English
          </label>
          <input id="altText" name="altText" required className={field} />
          {errors.altText ? <p className="mt-1.5 text-xs text-lime">{errors.altText}</p> : null}
        </div>

        <div>
          <label className={label} htmlFor="altTextZh">
            Alt text — 繁體中文
          </label>
          <input id="altTextZh" name="altTextZh" required lang="zh-Hant-HK" className={field} />
          {errors.altTextZh ? (
            <p className="mt-1.5 text-xs text-lime">{errors.altTextZh}</p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="captionEn">
              Caption — English (optional)
            </label>
            <input id="captionEn" name="captionEn" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="captionZh">
              Caption — 繁體中文 (optional)
            </label>
            <input id="captionZh" name="captionZh" lang="zh-Hant-HK" className={field} />
          </div>
        </div>
        <p className="-mt-2 text-xs text-mute/70">
          A caption is only shown when both languages are filled in.
        </p>

        <button
          type="submit"
          disabled={busy || !ready}
          className="self-start rounded-xs bg-lime px-5 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
        >
          {busy ? 'Working…' : 'Upload photo'}
        </button>
      </form>

      <p aria-live="polite" className="min-h-5 text-sm text-mute">
        {status}
      </p>

      <RunningOrder
        items={items}
        builtIn={builtIn}
        busy={busy}
        dirty={dirty}
        onMove={move}
        onTogglePin={togglePin}
        onRemove={remove}
        onSave={saveOrder}
      />
    </div>
  );
}

/* ==========================================================================
   Running order
   ========================================================================== */

type RunningOrderProps = {
  items: ManagedPhoto[];
  builtIn: MediaAspect[];
  busy: boolean;
  dirty: boolean;
  onMove: (index: number, delta: -1 | 1) => void;
  onTogglePin: (id: string) => void;
  onRemove: (id: string) => void;
  onSave: () => void;
};

function RunningOrder({
  items,
  builtIn,
  busy,
  dirty,
  onMove,
  onTogglePin,
  onRemove,
  onSave,
}: RunningOrderProps) {
  const pinnedCount = items.filter((item) => item.pinned).length;

  return (
    <section aria-labelledby="managed" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="managed" className="text-xs uppercase tracking-wider text-mute">
          Managed photos ({items.length})
        </h2>
        {dirty ? (
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            className="rounded-xs bg-lime px-4 py-2 text-xs font-medium text-ink disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save order'}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-mute/70">Nothing uploaded for this project yet.</p>
      ) : (
        <>
          <p className="text-xs text-mute/70">
            Pinned photos lead the gallery, ahead of the {builtIn.length} slot
            {builtIn.length === 1 ? '' : 's'} built into the site. Everything else follows
            them.
          </p>

          <ul className="flex flex-col gap-2">
            {items.map((item, index) => {
              const group = items.filter((other) => other.pinned === item.pinned);
              const first = items.indexOf(group[0]!);
              const last = items.indexOf(group[group.length - 1]!);

              return (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xs border p-3 ${
                    item.pinned ? 'border-lime/40 bg-lime/5' : 'border-line bg-surface'
                  }`}
                >
                  <span className="w-5 shrink-0 text-center font-mono text-xs text-mute/60">
                    {index + 1}
                  </span>

                  <Image
                    // An internal tool has no reason to spend image optimisation on previews.
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

                  {/* Labelled by position rather than alt text: the alt text is
                      a sentence, and "Move Keeper claiming a cross. earlier"
                      is not something anyone should have to listen to. The
                      surrounding list item still announces the photo itself. */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onMove(index, -1)}
                      disabled={busy || index === first}
                      aria-label={`Move photo ${index + 1} earlier`}
                      className={iconButton}
                    >
                      <ArrowUp aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(index, 1)}
                      disabled={busy || index === last}
                      aria-label={`Move photo ${index + 1} later`}
                      className={iconButton}
                    >
                      <ArrowDown aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onTogglePin(item.id)}
                      disabled={busy}
                      aria-pressed={item.pinned}
                      aria-label={`${item.pinned ? 'Unpin' : 'Pin'} photo ${index + 1}`}
                      className={`${iconButton} ${item.pinned ? 'border-lime/50 text-lime' : ''}`}
                    >
                      {item.pinned ? (
                        <PinOff aria-hidden="true" className="size-3.5" />
                      ) : (
                        <Pin aria-hidden="true" className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      disabled={busy}
                      aria-label={`Remove photo ${index + 1}`}
                      className="rounded-xs border border-line px-2.5 py-1.5 text-xs text-mute transition-colors hover:text-bone disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <LayoutPreview items={items} builtIn={builtIn} pinnedCount={pinnedCount} />
        </>
      )}
    </section>
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
    <div className="mt-2 rounded-xs border border-line bg-surface p-4">
      <h3 className="text-xs uppercase tracking-wider text-mute">Gallery layout</h3>
      <p className="mt-1.5 text-xs text-mute/70">
        How these rows will sit on the case-study page. A row that does not reach 12
        columns leaves a gap — landscape pairs with portrait, square pairs with square.
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
