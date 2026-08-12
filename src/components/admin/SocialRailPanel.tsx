'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

import { adminCard, adminField, adminGhostButton, adminLabel, adminPrimaryButton } from './admin-ui';
import MediaVersions from './MediaVersions';
import { acceptedUploadTypes } from '@/lib/photo-schema';
import type { MediaVersion } from '@/lib/campaign-schema';
import type { SocialPost } from '@/content/social';

/* ==========================================================================
   The Instagram rail.

   Five curated cards on the homepage, each one an image, a link back to the
   post and the words that go with it. Local data on purpose — there is no
   scraping and no embed script, so the grid stays fast and under editorial
   control. The number of cards is fixed by the layout; what is in them is not.
   ========================================================================== */

const previewRatio: Record<string, string> = {
  landscape: '16 / 10',
  portrait: '3 / 4',
  square: '1 / 1',
};

export default function SocialRailPanel({
  initialPosts,
  initialHistory,
  storageConfigured,
}: {
  initialPosts: SocialPost[];
  /** Previous versions per card, keyed `social:<id>`. */
  initialHistory: Record<string, MediaVersion[]>;
  storageConfigured: boolean;
}) {
  if (!storageConfigured) {
    return (
      <section aria-labelledby="social-rail-admin" className={`${adminCard} p-5`}>
        <h2 id="social-rail-admin" className={adminLabel}>
          Instagram rail
        </h2>
        <p className="mt-2 text-sm text-mute">
          Editing the rail needs a Blob store. Add one to this project in Vercel and reload.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="social-rail-admin" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="social-rail-admin" className={adminLabel}>
          Instagram rail ({initialPosts.length})
        </h2>
        <p className="text-[0.65rem] text-mute/60">
          Export from the original post, not a screenshot of the app.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {initialPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            initialVersions={initialHistory[`social:${post.id}`] ?? []}
          />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function PostCard({
  post,
  initialVersions,
}: {
  post: SocialPost;
  initialVersions: MediaVersion[];
}) {
  const [image, setImage] = useState(post.image);
  const [href, setHref] = useState(post.href);
  const [altText, setAltText] = useState(post.altText);
  const [altTextZh, setAltTextZh] = useState(post.altTextZh);
  const [captionEn, setCaptionEn] = useState(post.caption?.en ?? '');
  const [captionZh, setCaptionZh] = useState(post.caption?.['zh-hk'] ?? '');
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState(initialVersions);
  const fileInput = useRef<HTMLInputElement>(null);

  const canSave = altText.trim() !== '' && altTextZh.trim() !== '';

  function discardPreview() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function save() {
    setBusy(true);
    setError('');

    const form = new FormData();
    form.set('id', post.id);
    form.set('href', href);
    form.set('altText', altText);
    form.set('altTextZh', altTextZh);
    form.set('captionEn', captionEn);
    form.set('captionZh', captionZh);

    const file = fileInput.current?.files?.[0];
    if (file) form.set('image', file);

    const response = await fetch('/api/content/social', { method: 'POST', body: form });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      const firstFieldError = body.fieldErrors
        ? (Object.values(body.fieldErrors)[0] as string | undefined)
        : undefined;
      setError(
        firstFieldError ?? body.message ?? `Could not save (${body.error ?? response.status}).`,
      );
      return;
    }

    /* Take the stored URL from the response: the local object URL is revoked
       on the next line, so showing it would leave a broken picture. */
    if (body.post?.image) setImage(body.post.image);
    if (body.versions) setVersions(body.versions);
    discardPreview();
    setStatus('Published.');
  }

  async function removeImage() {
    setBusy(true);

    const response = await fetch('/api/content/social', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(body.message ?? `Could not remove it (${body.error ?? response.status}).`);
      return;
    }

    discardPreview();
    setImage(undefined);
    if (body.versions) setVersions(body.versions);
    setStatus('Image removed — you can put it back below.');
  }

  return (
    <div className={`${adminCard} flex gap-4 p-4`}>
      <div className="w-24 shrink-0">
        <div
          className="relative overflow-hidden rounded-xs border border-line bg-ink"
          style={{ aspectRatio: previewRatio[post.aspect] ?? '3 / 4' }}
        >
          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt="" className="size-full object-cover" />
          ) : image ? (
            <Image src={image} alt="" fill unoptimized sizes="96px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-center text-[0.6rem] text-mute/40">
              Empty
            </span>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept={acceptedUploadTypes.join(',')}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (preview) URL.revokeObjectURL(preview);
            setPreview(URL.createObjectURL(file));
            setStatus('');
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className={`${adminGhostButton} mt-2 w-full`}
          disabled={busy}
        >
          <Upload aria-hidden="true" className="size-3" />
          {image || preview ? 'Replace' : 'Choose'}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <p className="font-mono text-[0.65rem] text-mute/60">{post.id}</p>

        <label className="block">
          <span className={adminLabel}>Post link</span>
          <input
            type="url"
            value={href}
            onChange={(event) => setHref(event.target.value)}
            placeholder="https://www.instagram.com/p/…"
            className={adminField}
          />
        </label>

        <label className="block">
          <span className={adminLabel}>Alt text — English</span>
          <input
            type="text"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
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
            className={adminField}
          />
        </label>

        <details>
          <summary className="cursor-pointer text-xs text-mute hover:text-bone">
            Caption (optional)
          </summary>
          <p className="mt-1.5 text-[0.65rem] text-mute/50">
            Only shown when both languages are filled in.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            <input
              type="text"
              aria-label="Caption — English"
              value={captionEn}
              onChange={(event) => setCaptionEn(event.target.value)}
              className={`${adminField} mt-0`}
            />
            <input
              type="text"
              lang="zh-Hant-HK"
              aria-label="Caption — 繁體中文"
              value={captionZh}
              onChange={(event) => setCaptionZh(event.target.value)}
              className={`${adminField} mt-0`}
            />
          </div>
        </details>

        {error ? (
          <p role="alert" className="text-xs text-amber">
            {error}
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
          {image ? (
            <button
              type="button"
              className={adminGhostButton}
              disabled={busy}
              onClick={removeImage}
            >
              Remove image
            </button>
          ) : null}
        </div>

        <p aria-live="polite" className="text-sm text-mute empty:hidden">
          {status}
        </p>

        <MediaVersions
          historyKey={`social:${post.id}`}
          versions={versions}
          fallbackAspect={post.aspect}
          disabled={busy}
          onRestored={(body) => {
            setVersions(body.versions);
            const restored = body.post as SocialPost | null;
            if (restored) {
              setImage(restored.image);
              setAltText(restored.altText);
              setAltTextZh(restored.altTextZh);
              setHref(restored.href);
            }
            setStatus('Restored.');
          }}
        />
      </div>
    </div>
  );
}
