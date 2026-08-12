'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

import { adminCard, adminField, adminGhostButton, adminLabel, adminPrimaryButton } from './admin-ui';
import MediaVersions from './MediaVersions';
import { acceptedBrandTypes } from '@/lib/photo-schema';
import type { BrandAssets, BrandAssetKind, MediaVersion } from '@/lib/campaign-schema';
import type { ResolvedSite } from '@/lib/site-content';

/* ==========================================================================
   Site identity and brand artwork.

   Everything here renders on every page, so a save publishes the whole site
   rather than one route. Clearing a field is not the same as blanking it: an
   empty box falls back to what `src/content/site.ts` ships, which is why the
   site can never end up with no name or no email address.
   ========================================================================== */

type Props = {
  initialSettings: ResolvedSite;
  initialBrand: BrandAssets;
  /** Previous versions per asset, keyed `brand:<kind>`. */
  initialHistory: Record<string, MediaVersion[]>;
  storageConfigured: boolean;
};

export default function SiteSettingsPanel({
  initialSettings,
  initialBrand,
  initialHistory,
  storageConfigured,
}: Props) {
  const [values, setValues] = useState({
    name: initialSettings.name,
    legalName: initialSettings.legalName,
    tagline: initialSettings.tagline.en,
    taglineZh: initialSettings.tagline['zh-hk'],
    email: initialSettings.email,
    instagramHandle: initialSettings.instagramHandle,
    instagramUrl: initialSettings.instagramUrl,
    areaServed: initialSettings.areaServed,
    signOff: initialSettings.signOff,
    whatsapp: initialSettings.whatsapp,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setErrors({});

    const response = await fetch('/api/content/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
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

    setStatus('Published across the site.');
  }

  if (!storageConfigured) {
    return (
      <section className={`${adminCard} p-5`}>
        <h2 className={adminLabel}>Settings</h2>
        <p className="mt-2 text-sm text-mute">
          Changing settings needs a Blob store. Add one to this project in Vercel and reload —
          until then the site uses what shipped in the build.
        </p>
      </section>
    );
  }

  const field = (
    key: keyof typeof values,
    label: string,
    options: { lang?: string; placeholder?: string; type?: string } = {},
  ) => (
    <label className="block">
      <span className={adminLabel}>{label}</span>
      <input
        type={options.type ?? 'text'}
        lang={options.lang}
        value={values[key]}
        placeholder={options.placeholder}
        onChange={(event) => set(key, event.target.value)}
        className={adminField}
      />
      {errors[key] ? <p className="mt-1.5 text-xs text-amber">{errors[key]}</p> : null}
    </label>
  );

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="identity" className="flex flex-col gap-4">
        <div>
          <h2 id="identity" className={adminLabel}>
            Identity
          </h2>
          <p className="mt-1.5 text-xs text-mute/70">
            Leave a field empty to go back to what the site shipped with.
          </p>
        </div>

        <div className={`${adminCard} flex flex-col gap-4 p-4`}>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('name', 'Site name', { placeholder: 'TAP IN.' })}
            {field('legalName', 'Legal name')}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {field('tagline', 'Tagline — English')}
            {field('taglineZh', 'Tagline — 繁體中文', { lang: 'zh-Hant-HK' })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {field('email', 'Enquiry email', { type: 'email' })}
            {field('areaServed', 'Area served', { placeholder: 'Hong Kong' })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {field('instagramHandle', 'Instagram handle', { placeholder: '@tap_in_official' })}
            {field('instagramUrl', 'Instagram link', {
              type: 'url',
              placeholder: 'https://www.instagram.com/…',
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {field('whatsapp', 'WhatsApp number', {
              placeholder: 'Leave empty to hide it',
            })}
            {field('signOff', 'Footer sign-off')}
          </div>
        </div>

        <div className={`${adminCard} p-4`}>
          <h3 className={adminLabel}>Set by the environment</h3>
          <p className="mt-1.5 text-xs text-mute/70">
            Deploy configuration rather than content — changed in Vercel, not here, so an edit
            cannot be silently overridden.
          </p>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-mute/60">Site URL</dt>
              <dd className="font-mono text-mute">{initialSettings.url}</dd>
            </div>
            <div>
              <dt className="text-mute/60">Analytics ID</dt>
              <dd className="font-mono text-mute">{initialSettings.analyticsId || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={adminPrimaryButton} disabled={busy} onClick={save}>
            {busy ? 'Publishing…' : 'Publish settings'}
          </button>
          <p aria-live="polite" className="text-sm text-mute empty:hidden">
            {status}
          </p>
        </div>
      </section>

      <BrandPanel initialBrand={initialBrand} initialHistory={initialHistory} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const brandAssets: Array<{ kind: BrandAssetKind; label: string; hint: string }> = [
  {
    kind: 'logo',
    label: 'Logo',
    hint: 'Replaces the text wordmark in the header and footer. SVG keeps its edges.',
  },
  {
    kind: 'mark',
    label: 'App icon mark',
    hint: 'Used by the web app manifest when the site is installed to a home screen.',
  },
  {
    kind: 'icon',
    label: 'Favicon',
    hint: 'The browser tab icon. Leave empty to keep the one drawn in the build.',
  },
  {
    kind: 'ogImage',
    label: 'Share image',
    hint: 'Shown when a link is posted. Cropped to 1200 × 630 — must be a photo, not a vector.',
  },
];

function BrandPanel({
  initialBrand,
  initialHistory,
}: {
  initialBrand: BrandAssets;
  initialHistory: Record<string, MediaVersion[]>;
}) {
  const [brand, setBrand] = useState(initialBrand);

  return (
    <section aria-labelledby="brand" className="flex flex-col gap-3">
      <div>
        <h2 id="brand" className={adminLabel}>
          Brand
        </h2>
        <p className="mt-1.5 text-xs text-mute/70">
          Each of these falls back to what ships in the build until something is uploaded.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {brandAssets.map((asset) => (
          <BrandAssetCard
            key={asset.kind}
            asset={asset}
            url={brand[fieldFor(asset.kind)]}
            initialVersions={initialHistory[`brand:${asset.kind}`] ?? []}
            onChange={(next) => setBrand(next)}
          />
        ))}
      </div>
    </section>
  );
}

function fieldFor(kind: BrandAssetKind): keyof BrandAssets {
  return kind === 'logo'
    ? 'logoUrl'
    : kind === 'mark'
      ? 'markUrl'
      : kind === 'icon'
        ? 'iconUrl'
        : 'ogImageUrl';
}

function BrandAssetCard({
  asset,
  url,
  initialVersions,
  onChange,
}: {
  asset: { kind: BrandAssetKind; label: string; hint: string };
  url?: string;
  initialVersions: MediaVersion[];
  onChange: (brand: BrandAssets) => void;
}) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState(initialVersions);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError('');

    const form = new FormData();
    form.set('kind', asset.kind);
    form.set('asset', file);

    const response = await fetch('/api/content/settings', { method: 'POST', body: form });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (fileInput.current) fileInput.current.value = '';

    if (!response.ok) {
      setError(body.message ?? `Could not upload it (${body.error ?? response.status}).`);
      return;
    }

    onChange(body.brand ?? {});
    if (body.versions) setVersions(body.versions);
    setStatus('Published.');
  }

  async function remove() {
    setBusy(true);
    setError('');

    const response = await fetch('/api/content/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: asset.kind }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(body.message ?? `Could not remove it (${body.error ?? response.status}).`);
      return;
    }

    onChange(body.brand ?? {});
    if (body.versions) setVersions(body.versions);
    setStatus('Removed — the built-in artwork is back. You can put yours back below.');
  }

  return (
    <div className={`${adminCard} flex flex-col gap-3 p-4`}>
      <div>
        <h3 className="text-sm text-bone">{asset.label}</h3>
        <p className="mt-0.5 text-[0.65rem] text-mute/60">{asset.hint}</p>
      </div>

      <div className="grid h-24 place-items-center rounded-xs border border-line bg-ink p-3">
        {url ? (
          <Image
            src={url}
            alt=""
            width={160}
            height={80}
            unoptimized
            className="max-h-full w-auto object-contain"
          />
        ) : (
          <span className="text-[0.65rem] text-mute/40">Using the built-in artwork</span>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-xs text-amber">
          {error}
        </p>
      ) : null}

      <input
        ref={fileInput}
        type="file"
        accept={acceptedBrandTypes.join(',')}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={adminGhostButton}
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          <Upload aria-hidden="true" className="size-3.5" />
          {busy ? 'Uploading…' : url ? 'Replace' : 'Upload'}
        </button>
        {url ? (
          <button type="button" className={adminGhostButton} disabled={busy} onClick={remove}>
            Remove
          </button>
        ) : null}
      </div>

      <p aria-live="polite" className="text-sm text-mute empty:hidden">
        {status}
      </p>

      <MediaVersions
        historyKey={`brand:${asset.kind}`}
        versions={versions}
        fit="contain"
        disabled={busy}
        onRestored={(body) => {
          setVersions(body.versions);
          onChange((body.brand as BrandAssets) ?? {});
          setStatus('Restored.');
        }}
      />
    </div>
  );
}
