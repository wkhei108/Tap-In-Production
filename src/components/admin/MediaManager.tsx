'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { photoAspects, type ManagedPhoto, type PhotoUploadField } from '@/lib/photo-schema';

type Props = {
  projects: Array<{ slug: string; title: string }>;
  adminConfigured: boolean;
  storageConfigured: boolean;
};

type FieldErrors = Partial<Record<PhotoUploadField, string>>;

const field =
  'mt-1.5 w-full rounded-xs border border-line bg-surface px-3 py-2 text-sm text-bone ' +
  'outline-none focus-visible:border-lime';
const label = 'block text-xs uppercase tracking-wider text-mute';

export default function MediaManager({ projects, adminConfigured, storageConfigured }: Props) {
  const [token, setToken] = useState('');
  const [slug, setSlug] = useState(projects[0]?.slug ?? '');
  const [items, setItems] = useState<ManagedPhoto[]>([]);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const ready = adminConfigured && storageConfigured && token.length > 0 && slug.length > 0;

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
        setStatus(body.message ?? `Could not load photos (${body.error ?? response.status}).`);
        return;
      }

      setItems(body.items);
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
                  {aspect}
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

      <section aria-labelledby="managed">
        <h2 id="managed" className="text-xs uppercase tracking-wider text-mute">
          Managed photos ({items.length})
        </h2>

        {items.length === 0 ? (
          <p className="mt-3 text-sm text-mute/70">
            Nothing uploaded for this project yet.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 rounded-xs border border-line bg-surface p-3"
              >
                <Image
                  // An internal tool has no reason to spend image optimisation on previews.
                  unoptimized
                  src={item.url}
                  alt={item.altText}
                  width={96}
                  height={64}
                  className="h-16 w-24 shrink-0 rounded-xs object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-bone">{item.altText}</p>
                  <p className="truncate text-xs text-mute/70">
                    {item.aspect} · {new Date(item.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={busy}
                  className="shrink-0 rounded-xs border border-line px-3 py-1.5 text-xs text-mute hover:text-bone disabled:opacity-40"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
