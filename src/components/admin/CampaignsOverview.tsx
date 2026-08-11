'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus } from 'lucide-react';

import { workFilters, type WorkFilter } from '@/content/projects';
import type { Localised } from '@/content/services';
import type { HeroRecord } from '@/lib/campaign-schema';
import {
  adminCard,
  adminField,
  adminGhostButton,
  adminIconButton,
  adminLabel,
  adminPrimaryButton,
} from './admin-ui';
import HeroPanel from './HeroPanel';

export type CampaignSummary = {
  slug: string;
  title: string;
  titleZh: string;
  clientName: string;
  clientNameZh: string;
  summary: string;
  summaryZh: string;
  category: string;
  filters: WorkFilter[];
  year: string;
  coverUrl: string | null;
  hasCover: boolean;
  origin: 'code' | 'admin';
};

type Props = {
  initialCampaigns: CampaignSummary[];
  initialCategories: Record<string, Localised>;
  initialHero: HeroRecord | null;
  storageConfigured: boolean;
};

type FieldErrors = Record<string, string>;

/** The short form, shared by "new campaign" and "edit campaign". */
type FormValues = {
  title: string;
  titleZh: string;
  clientName: string;
  clientNameZh: string;
  summary: string;
  summaryZh: string;
  category: string;
  filters: WorkFilter[];
  year: string;
};

const blankForm = (category: string): FormValues => ({
  title: '',
  titleZh: '',
  clientName: '',
  clientNameZh: '',
  summary: '',
  summaryZh: '',
  category,
  filters: [],
  year: '',
});

export default function CampaignsOverview({
  initialCampaigns,
  initialCategories,
  initialHero,
  storageConfigured,
}: Props) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const firstCategory = Object.keys(categories)[0] ?? '';
  const missingCovers = campaigns.filter((campaign) => !campaign.hasCover).length;

  async function reload() {
    const response = await fetch('/api/campaigns');
    if (!response.ok) return;
    const body = await response.json();
    setCampaigns(body.campaigns);
    setCategories(body.categories);
    setDirty(false);
  }

  async function saveOrder() {
    setBusy(true);
    setStatus('Saving order…');
    const response = await fetch('/api/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: campaigns.map((campaign) => campaign.slug) }),
    });
    setBusy(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setStatus(body.message ?? `Could not save the order (${body.error ?? response.status}).`);
      return;
    }

    setDirty(false);
    setStatus('Order saved.');
  }

  async function submitCampaign(values: FormValues, slug?: string) {
    setBusy(true);
    const response = await fetch('/api/campaigns', {
      method: slug ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slug ? { ...values, slug } : values),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      return (body.fieldErrors ?? { title: body.message ?? 'Could not save.' }) as FieldErrors;
    }

    setEditing(null);
    setCreating(false);
    setStatus(slug ? 'Campaign updated.' : 'Campaign created.');
    await reload();
    return null;
  }

  function move(index: number, delta: -1 | 1) {
    setCampaigns((current) => {
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

  function moveTo(from: number, to: number) {
    if (from === to) return;
    setCampaigns((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      if (!moved) return current;
      next.splice(to, 0, moved);
      return next;
    });
    setDirty(true);
  }

  if (!storageConfigured) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className={`${adminCard} p-5 text-sm text-mute`}>
          <p className="text-bone">Storage is not connected on this deployment.</p>
          <p className="mt-3">
            Add a Blob store in the Vercel dashboard under Storage — that sets{' '}
            <code className="text-bone/80">BLOB_READ_WRITE_TOKEN</code> — then redeploy.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8">
      {/* Campaigns */}
      <section aria-labelledby="campaigns" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 id="campaigns" className={adminLabel}>
              Campaigns ({campaigns.length})
            </h2>
            {missingCovers > 0 ? (
              <p className="mt-1 text-xs text-amber">
                {missingCovers} still {missingCovers === 1 ? 'has' : 'have'} no cover photo.
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {dirty ? (
              <button type="button" onClick={saveOrder} disabled={busy} className={adminPrimaryButton}>
                {busy ? 'Saving…' : 'Save order'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setCreating(true);
                setEditing(null);
              }}
              disabled={busy || !firstCategory}
              className={adminGhostButton}
            >
              <Plus aria-hidden="true" className="size-3.5" /> New campaign
            </button>
          </div>
        </div>

        <p className="text-xs text-mute/70">
          Drag a row, or use the arrows, to set the order they appear on Work and in every
          grid that lists them.
        </p>

        {creating ? (
          <CampaignForm
            heading="New campaign"
            categories={categories}
            initial={blankForm(firstCategory)}
            busy={busy}
            onCancel={() => setCreating(false)}
            onSubmit={(values) => submitCampaign(values)}
          />
        ) : null}

        <ul className="flex flex-col gap-2">
          {campaigns.map((campaign, index) => (
            <li
              key={campaign.slug}
              draggable={!busy && editing !== campaign.slug}
              onDragStart={() => setDragFrom(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragFrom !== null) moveTo(dragFrom, index);
                setDragFrom(null);
              }}
              onDragEnd={() => setDragFrom(null)}
              className={`rounded-xs border border-line bg-surface p-3 ${
                dragFrom === index ? 'opacity-40' : ''
              }`}
            >
              {editing === campaign.slug ? (
                <CampaignForm
                  heading={`Editing ${campaign.title}`}
                  categories={categories}
                  initial={{
                    title: campaign.title,
                    titleZh: campaign.titleZh,
                    clientName: campaign.clientName,
                    clientNameZh: campaign.clientNameZh,
                    summary: campaign.summary,
                    summaryZh: campaign.summaryZh,
                    category: campaign.category,
                    filters: campaign.filters,
                    year: campaign.year,
                  }}
                  busy={busy}
                  slugNote={`Address stays /work/${campaign.slug}`}
                  onCancel={() => setEditing(null)}
                  onSubmit={(values) => submitCampaign(values, campaign.slug)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <GripVertical aria-hidden="true" className="size-4 shrink-0 cursor-grab text-mute/40" />
                  <span className="w-4 shrink-0 text-center font-mono text-xs text-mute/60">
                    {index + 1}
                  </span>

                  {campaign.coverUrl ? (
                    <Image
                      unoptimized
                      src={campaign.coverUrl}
                      alt=""
                      width={96}
                      height={64}
                      className="h-14 w-20 shrink-0 rounded-xs object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-20 shrink-0 place-items-center rounded-xs border border-dashed border-amber/40 text-[0.6rem] text-amber/80">
                      no cover
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-bone">{campaign.title}</p>
                    <p className="truncate font-mono text-xs text-mute/70">
                      /{campaign.slug}
                      {campaign.origin === 'admin' ? ' · added here' : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={busy || index === 0}
                      aria-label={`Move campaign ${index + 1} earlier`}
                      className={adminIconButton}
                    >
                      <ArrowUp aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={busy || index === campaigns.length - 1}
                      aria-label={`Move campaign ${index + 1} later`}
                      className={adminIconButton}
                    >
                      <ArrowDown aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(campaign.slug);
                        setCreating(false);
                      }}
                      disabled={busy}
                      className={adminGhostButton}
                    >
                      Edit
                    </button>
                    <Link href={`/admin/media/${campaign.slug}`} className={adminGhostButton}>
                      Photos
                    </Link>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        <p aria-live="polite" className="empty:hidden text-sm text-mute">
          {status}
        </p>
      </section>

      <CategoriesPanel
        categories={categories}
        busy={busy}
        onAdded={(next) => {
          setCategories(next);
          setStatus('Category added.');
        }}
        setBusy={setBusy}
      />

      <HeroPanel initialHero={initialHero} />
    </main>
  );
}

/* ==========================================================================
   Campaign form — the same fields whether creating or editing
   ========================================================================== */

function CampaignForm({
  heading,
  categories,
  initial,
  busy,
  slugNote,
  onCancel,
  onSubmit,
}: {
  heading: string;
  categories: Record<string, Localised>;
  initial: FormValues;
  busy: boolean;
  slugNote?: string;
  onCancel: () => void;
  onSubmit: (values: FormValues) => Promise<FieldErrors | null>;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleFilter(filter: WorkFilter) {
    set(
      'filters',
      values.filters.includes(filter)
        ? values.filters.filter((entry) => entry !== filter)
        : [...values.filters, filter],
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const result = await onSubmit(values);
    if (result) setErrors(result);
  }

  const field = (key: keyof FormValues, label: string, lang?: string) => (
    <div>
      <label className={adminLabel} htmlFor={`${key}-field`}>
        {label}
      </label>
      <input
        id={`${key}-field`}
        lang={lang}
        value={values[key] as string}
        onChange={(event) => set(key, event.target.value as FormValues[typeof key])}
        className={adminField}
      />
      {errors[key] ? <p className="mt-1.5 text-xs text-amber">{errors[key]}</p> : null}
    </div>
  );

  return (
    <form onSubmit={submit} className={`${adminCard} flex flex-col gap-4 p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={adminLabel}>{heading}</h3>
        {slugNote ? <p className="font-mono text-xs text-mute/60">{slugNote}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field('title', 'Campaign name — English')}
        {field('titleZh', 'Campaign name — 繁體中文', 'zh-Hant-HK')}
        {field('clientName', 'Client — English')}
        {field('clientNameZh', 'Client — 繁體中文', 'zh-Hant-HK')}
        {field('summary', 'Summary — English')}
        {field('summaryZh', 'Summary — 繁體中文', 'zh-Hant-HK')}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={adminLabel} htmlFor="category-field">
            Category
          </label>
          <select
            id="category-field"
            value={values.category}
            onChange={(event) => set('category', event.target.value)}
            className={adminField}
          >
            {Object.entries(categories).map(([key, label]) => (
              <option key={key} value={key}>
                {label.en}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p className="mt-1.5 text-xs text-amber">{errors.category}</p>
          ) : null}
        </div>
        {field('year', 'Year (optional)')}
      </div>

      <fieldset>
        <legend className={adminLabel}>Filters it answers to</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {workFilters
            .filter((filter) => filter !== 'all')
            .map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => toggleFilter(filter)}
                aria-pressed={values.filters.includes(filter)}
                className={`rounded-xs border px-2.5 py-1 font-mono text-[0.68rem] transition-colors ${
                  values.filters.includes(filter)
                    ? 'border-lime/50 bg-lime/10 text-lime'
                    : 'border-line text-mute hover:text-bone'
                }`}
              >
                {filter}
              </button>
            ))}
        </div>
        {errors.filters ? <p className="mt-1.5 text-xs text-amber">{errors.filters}</p> : null}
      </fieldset>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className={adminPrimaryButton}>
          {busy ? 'Saving…' : 'Save campaign'}
        </button>
        <button type="button" onClick={onCancel} className={adminGhostButton}>
          Cancel
        </button>
        <span className="text-xs text-mute/60">
          The long case-study writing stays in the code.
        </span>
      </div>
    </form>
  );
}

/* ==========================================================================
   Categories
   ========================================================================== */

function CategoriesPanel({
  categories,
  busy,
  onAdded,
  setBusy,
}: {
  categories: Record<string, Localised>;
  busy: boolean;
  onAdded: (next: Record<string, Localised>) => void;
  setBusy: (value: boolean) => void;
}) {
  const [label, setLabel] = useState('');
  const [labelZh, setLabelZh] = useState('');
  const [error, setError] = useState('');

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'category', label, labelZh }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(
        (body.fieldErrors && Object.values(body.fieldErrors)[0]) ??
          body.message ??
          'Could not add that category.',
      );
      return;
    }

    setLabel('');
    setLabelZh('');
    onAdded(body.categories);
  }

  return (
    <section aria-labelledby="categories" className={`${adminCard} p-4`}>
      <h2 id="categories" className={adminLabel}>
        Categories
      </h2>
      <p className="mt-1.5 text-xs text-mute/70">
        The label shown on a campaign card and at the top of its page. Adding one makes it
        available to every campaign; existing ones cannot be removed here yet.
      </p>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {Object.entries(categories).map(([key, value]) => (
          <li
            key={key}
            className="rounded-xs border border-line px-2.5 py-1 text-xs text-bone/85"
          >
            {value.en} <span className="text-mute/60">· {value['zh-hk']}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-40 flex-1">
          <label className={adminLabel} htmlFor="cat-en">
            New category — English
          </label>
          <input
            id="cat-en"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className={adminField}
          />
        </div>
        <div className="min-w-40 flex-1">
          <label className={adminLabel} htmlFor="cat-zh">
            New category — 繁體中文
          </label>
          <input
            id="cat-zh"
            lang="zh-Hant-HK"
            value={labelZh}
            onChange={(event) => setLabelZh(event.target.value)}
            className={adminField}
          />
        </div>
        <button
          type="submit"
          disabled={busy || !label.trim() || !labelZh.trim()}
          className={adminPrimaryButton}
        >
          Add
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-amber">
          {error}
        </p>
      ) : null}
    </section>
  );
}
