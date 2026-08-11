import { NextResponse } from 'next/server';

import { guardAdmin, refreshEditorScreen } from '@/lib/admin-guard';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';
import { copyFieldFor, copyNamespaceOwns, isCopyNamespace, mutateCopyOverlay } from '@/lib/copy';
import {
  copySaveSchema,
  kindOf,
  sameCopyValue,
  type CopyValue,
  type CopyValues,
} from '@/lib/copy-schema';
import { toPhotoFieldErrors } from '@/lib/photo-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Save one editor screen's copy.
 *
 * The client sends every field it is showing, in both languages, and this
 * diffs each one against the code default: same as the default means the key
 * is removed, different means it is stored. That keeps the overlay sparse
 * without the client tracking dirty state, and makes "reset to default"
 * nothing more than typing the original text back in.
 */
export async function POST(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  if (!isPhotoStorageConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'storage-not-configured',
        message: 'Add a Blob store in Vercel before editing copy.',
      },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const parsed = copySaveSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', fieldErrors: toPhotoFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { namespace, entries } = parsed.data;

  if (!isCopyNamespace(namespace)) {
    return NextResponse.json({ ok: false, error: 'unknown-namespace' }, { status: 400 });
  }

  /* Work out the changes before touching storage, so a payload referring to
     content that no longer exists is rejected as a whole rather than half
     applied. */
  const changes: Array<{ path: string; en: CopyValue | null; zh: CopyValue | null }> = [];
  const fieldErrors: Record<string, string> = {};

  for (const entry of entries) {
    const field = copyFieldFor(entry.path);

    if (!field || !copyNamespaceOwns(namespace, entry.path)) {
      /* Content removed or moved since the screen was opened. Skipping is
         kinder than failing the whole save for one stale field. */
      continue;
    }

    if (kindOf(entry.en) !== field.kind || kindOf(entry.zh) !== field.kind) {
      fieldErrors[entry.path] = 'This field changed shape — reload the page and try again.';
      continue;
    }

    if (field.kind === 'string' && !String(entry.en).trim()) {
      fieldErrors[entry.path] = 'English copy cannot be empty.';
      continue;
    }

    if (field.kind === 'string' && !String(entry.zh).trim()) {
      fieldErrors[entry.path] = 'Chinese copy cannot be empty.';
      continue;
    }

    changes.push({
      path: entry.path,
      en: sameCopyValue(entry.en, field.en) ? null : entry.en,
      zh: sameCopyValue(entry.zh, field.zh) ? null : entry.zh,
    });
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ ok: false, error: 'validation', fieldErrors }, { status: 400 });
  }

  const written = await mutateCopyOverlay((overlay) => {
    const en: CopyValues = { ...overlay.values.en };
    const zh: CopyValues = { ...overlay.values['zh-hk'] };

    for (const change of changes) {
      if (change.en === null) delete en[change.path];
      else en[change.path] = change.en;

      if (change.zh === null) delete zh[change.path];
      else zh[change.path] = change.zh;
    }

    return { ...overlay, values: { en, 'zh-hk': zh } };
  });

  if (!written.ok) {
    return NextResponse.json({ ok: false, error: written.reason }, { status: 502 });
  }

  refreshEditorScreen(namespace);

  const changed = changes.filter((change) => change.en !== null || change.zh !== null);

  return NextResponse.json({
    ok: true,
    saved: changes.length,
    changed: changed.map((change) => change.path),
  });
}
