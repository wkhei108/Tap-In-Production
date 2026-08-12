'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Plus, RotateCcw, Search, X } from 'lucide-react';

import { adminCard, adminField, adminGhostButton, adminLabel, adminPrimaryButton } from './admin-ui';
import CopyHistory from './CopyHistory';
import {
  sameCopyValue,
  type CopyField,
  type CopySnapshot,
  type CopyValue,
} from '@/lib/copy-schema';
import {
  groupKeyForPath,
  isLongText,
  labelForField,
  labelForGroup,
} from '@/lib/copy-labels';

type Entry = { en: CopyValue; zh: CopyValue };
type Values = Record<string, Entry>;

type Props = {
  namespace: string;
  /** Code defaults, in content order. */
  fields: CopyField[];
  /** What is currently stored on top of them, keyed by path. */
  stored: { en: Record<string, CopyValue>; zh: Record<string, CopyValue> };
  /** Previous publishes of this screen, newest first. */
  snapshots: CopySnapshot[];
  storageConfigured: boolean;
};

/* ==========================================================================
   The copy editor.

   Every string on a page, in both languages, grouped the way the content is
   structured and derived from it — so a headline added in code turns up here
   with no list to maintain.

   Two rules shape the interface: English and Chinese always sit side by side
   rather than behind a language toggle, so nothing can be updated in one
   language and silently left stale in the other; and a field that differs
   from what shipped is marked and can be put back, so an edit is never a
   one-way door.
   ========================================================================== */

function effective(field: CopyField, stored: Props['stored']): Entry {
  return {
    en: stored.en[field.path] ?? field.en,
    zh: stored.zh[field.path] ?? field.zh,
  };
}

function sameEntry(a: Entry, b: Entry): boolean {
  return sameCopyValue(a.en, b.en) && sameCopyValue(a.zh, b.zh);
}

function asList(value: CopyValue): string[] {
  return typeof value === 'string' ? [value] : value;
}

export default function CopyEditor({
  namespace,
  fields,
  stored,
  snapshots,
  storageConfigured,
}: Props) {
  const initial = useMemo<Values>(
    () => Object.fromEntries(fields.map((field) => [field.path, effective(field, stored)])),
    [fields, stored],
  );

  const defaults = useMemo<Values>(
    () => Object.fromEntries(fields.map((field) => [field.path, { en: field.en, zh: field.zh }])),
    [fields],
  );

  const [values, setValues] = useState<Values>(initial);
  const [saved, setSaved] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState(snapshots);

  const groups = useMemo(() => {
    const byKey = new Map<string, CopyField[]>();
    for (const field of fields) {
      const key = groupKeyForPath(field.path);
      const bucket = byKey.get(key);
      if (bucket) bucket.push(field);
      else byKey.set(key, [field]);
    }
    return [...byKey.entries()].map(([key, items]) => ({ key, label: labelForGroup(key), items }));
  }, [fields]);

  /* Searching matches the label and both languages, so an operator can paste
     in the sentence they can see on the site and land on the right field. */
  const needle = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!needle) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((field) => {
          /* Matched against the copy as loaded, not as being typed: filtering
             on the live value would pull a field out from under the cursor
             the moment an edit stopped matching the search. */
          const entry = initial[field.path];
          const haystack = [
            field.path,
            labelForField(field.path),
            group.label,
            ...(entry ? [asList(entry.en).join(' '), asList(entry.zh).join(' ')] : []),
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(needle);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, needle, initial]);

  const dirtyPaths = useMemo(
    () =>
      fields
        .filter((field) => {
          const current = values[field.path];
          const base = saved[field.path];
          return current && base && !sameEntry(current, base);
        })
        .map((field) => field.path),
    [fields, values, saved],
  );

  const changedFromDefault = useMemo(() => {
    const set = new Set<string>();
    for (const field of fields) {
      const current = values[field.path];
      const base = defaults[field.path];
      if (current && base && !sameEntry(current, base)) set.add(field.path);
    }
    return set;
  }, [fields, values, defaults]);

  function update(path: string, side: 'en' | 'zh', value: CopyValue) {
    setValues((current) => {
      const entry = current[path];
      if (!entry) return current;
      return { ...current, [path]: { ...entry, [side]: value } };
    });
    setErrors((current) => {
      if (!(path in current)) return current;
      const next = { ...current };
      delete next[path];
      return next;
    });
  }

  function resetField(path: string) {
    const base = defaults[path];
    if (base) setValues((current) => ({ ...current, [path]: { ...base } }));
  }

  function toggleGroup(key: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setErrors({});

    const entries = dirtyPaths.map((path) => {
      const entry = values[path];
      return { path, en: entry!.en, zh: entry!.zh };
    });

    const response = await fetch('/api/content/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, entries }),
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

    setSaved(values);
    if (body.history) setHistory(body.history);
    setStatus(
      entries.length === 1 ? '1 change published.' : `${entries.length} changes published.`,
    );
  }

  if (!storageConfigured) {
    return (
      <section className={`${adminCard} p-5`}>
        <h2 className={adminLabel}>Copy</h2>
        <p className="mt-2 text-sm text-mute">
          Editing copy needs somewhere to store it. Add a Blob store to this project in Vercel,
          then reload — until then the site renders exactly what shipped in the build.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="copy-editor" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="copy-editor" className={adminLabel}>
          Copy ({fields.length} fields)
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={adminGhostButton}
            onClick={() => setOpenGroups(new Set(groups.map((group) => group.key)))}
          >
            Expand all
          </button>
          <button
            type="button"
            className={adminGhostButton}
            onClick={() => setOpenGroups(new Set())}
          >
            Collapse all
          </button>
        </div>
      </div>

      <CopyHistory
        namespace={namespace}
        snapshots={history}
        disabled={busy || dirtyPaths.length > 0}
        onRestored={(body) => {
          /* Rebuild every field from the restored overlay plus the code
             defaults, so the screen matches what the site will now serve. */
          const restored: Values = Object.fromEntries(
            fields.map((field) => [
              field.path,
              {
                en: body.values.en[field.path] ?? field.en,
                zh: body.values.zh[field.path] ?? field.zh,
              },
            ]),
          );

          setValues(restored);
          setSaved(restored);
          setHistory(body.history);
          setErrors({});
          setStatus('Reverted to the earlier wording.');
        }}
      />

      {dirtyPaths.length > 0 ? (
        <p className="text-[0.65rem] text-mute/60">
          Undo is unavailable while there are unsaved changes — publish or discard them first.
        </p>
      ) : null}

      <label className="relative block">
        <span className="sr-only">Search this page&rsquo;s copy</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-mute/50"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by wording, label or key…"
          className={`${adminField} mt-0 pl-9`}
        />
      </label>

      {needle && visibleGroups.length === 0 ? (
        <p className="text-sm text-mute">Nothing on this page matches “{query}”.</p>
      ) : null}

      <div className="flex flex-col gap-2">
        {visibleGroups.map((group) => {
          /* A search should show what it found, not make you open it. */
          const expanded = needle ? true : openGroups.has(group.key);
          const changedHere = group.items.filter((field) =>
            changedFromDefault.has(field.path),
          ).length;

          return (
            <div key={group.key} className={adminCard}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                aria-expanded={expanded}
                aria-controls={`group-${group.key}`}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <ChevronDown
                    aria-hidden="true"
                    className={`size-3.5 shrink-0 text-mute transition-transform ${
                      expanded ? '' : '-rotate-90'
                    }`}
                  />
                  <span className="truncate text-sm text-bone">{group.label}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5 text-[0.65rem] text-mute/70">
                  {changedHere > 0 ? (
                    <span className="rounded-xs bg-lime/15 px-1.5 py-0.5 font-mono text-lime">
                      {changedHere} edited
                    </span>
                  ) : null}
                  <span className="font-mono">{group.items.length}</span>
                </span>
              </button>

              {expanded ? (
                <div id={`group-${group.key}`} className="flex flex-col gap-5 border-t border-line p-4">
                  {group.items.map((field) => (
                    <FieldRow
                      key={field.path}
                      field={field}
                      entry={values[field.path]!}
                      changed={changedFromDefault.has(field.path)}
                      error={errors[field.path]}
                      onChange={update}
                      onReset={resetField}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Sticky, because the fields run far past a screenful. */}
      <div className="sticky bottom-0 z-10 -mx-5 border-t border-line bg-ink/95 px-5 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-mute empty:hidden">
            {status ||
              (dirtyPaths.length > 0
                ? `${dirtyPaths.length} unsaved ${dirtyPaths.length === 1 ? 'change' : 'changes'}`
                : '')}
          </p>
          <div className="ml-auto flex items-center gap-2">
            {dirtyPaths.length > 0 ? (
              <button
                type="button"
                className={adminGhostButton}
                disabled={busy}
                onClick={() => {
                  setValues(saved);
                  setErrors({});
                  setStatus('');
                }}
              >
                Discard
              </button>
            ) : null}
            <button
              type="button"
              className={adminPrimaryButton}
              disabled={busy || dirtyPaths.length === 0}
              onClick={save}
            >
              {busy ? 'Publishing…' : 'Publish changes'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function FieldRow({
  field,
  entry,
  changed,
  error,
  onChange,
  onReset,
}: {
  field: CopyField;
  entry: Entry;
  changed: boolean;
  error?: string;
  onChange: (path: string, side: 'en' | 'zh', value: CopyValue) => void;
  onReset: (path: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className={adminLabel}>{labelForField(field.path)}</span>
          {changed ? (
            <span
              aria-label="Edited — no longer the text this site shipped with"
              className="size-1.5 shrink-0 rotate-45 bg-lime"
            />
          ) : null}
        </span>
        {changed ? (
          <button
            type="button"
            onClick={() => onReset(field.path)}
            className="inline-flex items-center gap-1.5 text-[0.65rem] text-mute transition-colors hover:text-bone"
          >
            <RotateCcw aria-hidden="true" className="size-3" />
            Reset to original
          </button>
        ) : null}
      </div>

      {field.kind === 'string[]' ? (
        <ListField entry={entry} path={field.path} onChange={onChange} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="English"
            value={String(entry.en)}
            /* Decided from the shipped copy, not what is in the box: a field
               that swapped input for textarea mid-sentence would drop focus. */
            long={isLongText(String(field.en))}
            onChange={(value) => onChange(field.path, 'en', value)}
          />
          <TextField
            label="繁體中文"
            lang="zh-Hant-HK"
            value={String(entry.zh)}
            long={isLongText(String(field.en))}
            onChange={(value) => onChange(field.path, 'zh', value)}
          />
        </div>
      )}

      <p className="font-mono text-[0.6rem] text-mute/35">{field.path}</p>

      {error ? (
        <p role="alert" className="text-xs text-amber">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  value,
  lang,
  long,
  onChange,
}: {
  label: string;
  value: string;
  lang?: string;
  long: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[0.65rem] uppercase tracking-wider text-mute/60">{label}</span>
      {long ? (
        <textarea
          value={value}
          lang={lang}
          rows={Math.min(8, Math.ceil(value.length / 60) + 1)}
          onChange={(event) => onChange(event.target.value)}
          className={`${adminField} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          lang={lang}
          onChange={(event) => onChange(event.target.value)}
          className={adminField}
        />
      )}
    </label>
  );
}

/**
 * A bullet list, edited as paired rows.
 *
 * The two languages are kept the same length on purpose: the site renders one
 * list per locale, so a bullet added in English and forgotten in Chinese is a
 * visible hole rather than a harmless omission.
 */
function ListField({
  entry,
  path,
  onChange,
}: {
  entry: Entry;
  path: string;
  onChange: (path: string, side: 'en' | 'zh', value: CopyValue) => void;
}) {
  const en = asList(entry.en);
  const zh = asList(entry.zh);
  const rows = Math.max(en.length, zh.length);

  function setItem(side: 'en' | 'zh', index: number, value: string) {
    const list = [...(side === 'en' ? en : zh)];
    while (list.length <= index) list.push('');
    list[index] = value;
    onChange(path, side, list);
  }

  function addRow() {
    onChange(path, 'en', [...en, '']);
    onChange(path, 'zh', [...zh, '']);
  }

  function removeRow(index: number) {
    onChange(
      path,
      'en',
      en.filter((_, position) => position !== index),
    );
    onChange(
      path,
      'zh',
      zh.filter((_, position) => position !== index),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="mt-2.5 w-5 shrink-0 text-right font-mono text-[0.6rem] text-mute/40">
            {index + 1}
          </span>
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              aria-label={`Item ${index + 1}, English`}
              value={en[index] ?? ''}
              onChange={(event) => setItem('en', index, event.target.value)}
              className={`${adminField} mt-0`}
            />
            <input
              type="text"
              lang="zh-Hant-HK"
              aria-label={`Item ${index + 1}, Chinese`}
              value={zh[index] ?? ''}
              onChange={(event) => setItem('zh', index, event.target.value)}
              className={`${adminField} mt-0`}
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(index)}
            aria-label={`Remove item ${index + 1}`}
            className="mt-1 grid size-7 shrink-0 place-items-center rounded-xs border border-line text-mute transition-colors hover:border-line-strong hover:text-bone"
          >
            <X aria-hidden="true" className="size-3" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className={`${adminGhostButton} self-start`}
      >
        <Plus aria-hidden="true" className="size-3.5" />
        Add item
      </button>
    </div>
  );
}
