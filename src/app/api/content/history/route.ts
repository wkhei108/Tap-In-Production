import { NextResponse } from 'next/server';

import { guardAdmin, refreshEditorScreen, refreshEverything } from '@/lib/admin-guard';
import {
  copyFieldsFor,
  copyHistoryFor,
  copyValuesFor,
  isCopyNamespace,
  mutateCopyOverlay,
  pushSnapshot,
  readCopyOverlay,
  replaceNamespaceValues,
  snapshotOf,
} from '@/lib/copy';
import { readSiteIndex } from '@/lib/campaigns';
import { parseHistoryKey, readHistory } from '@/lib/media-history';
import { mediaSlotFor } from '@/lib/media-slots';
import { isPhotoStorageConfigured } from '@/lib/photo-storage';
import { mergeSocialPosts, resolveBrand, restoreMediaVersion } from '@/lib/site-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ==========================================================================
   Undo.

   Two kinds of history share one route because they answer the same
   question: put back what was here before. Images are restored by version,
   copy by publish.
   ========================================================================== */

function storageRequired(): NextResponse | null {
  if (isPhotoStorageConfigured()) return null;
  return NextResponse.json(
    {
      ok: false,
      error: 'storage-not-configured',
      message: 'Add a Blob store in Vercel before using history.',
    },
    { status: 503 },
  );
}

/** Read a log — used when a panel wants to refresh its list on its own. */
export async function GET(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const namespace = url.searchParams.get('namespace');

  if (key) {
    if (!parseHistoryKey(key)) {
      return NextResponse.json({ ok: false, error: 'unknown-key' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, versions: readHistory(await readSiteIndex(), key) });
  }

  if (namespace && isCopyNamespace(namespace)) {
    return NextResponse.json({
      ok: true,
      history: copyHistoryFor(await readCopyOverlay({ fresh: true }), namespace),
    });
  }

  return NextResponse.json({ ok: false, error: 'key-required' }, { status: 400 });
}

export async function POST(request: Request) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const unconfigured = storageRequired();
  if (unconfigured) return unconfigured;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const body = (payload ?? {}) as { key?: unknown; versionId?: unknown; namespace?: unknown; snapshotId?: unknown };

  /* --- An image ---------------------------------------------------------- */
  if (typeof body.key === 'string') {
    const parsedKey = parseHistoryKey(body.key);
    if (!parsedKey) {
      return NextResponse.json({ ok: false, error: 'unknown-key' }, { status: 400 });
    }

    if (typeof body.versionId !== 'string' || !body.versionId) {
      return NextResponse.json({ ok: false, error: 'version-required' }, { status: 400 });
    }

    /* The scope decides what a valid id looks like, so a caller cannot use
       one scope's key to write into another's records. */
    if (parsedKey.scope === 'page' && !mediaSlotFor(parsedKey.id)) {
      return NextResponse.json({ ok: false, error: 'unknown-slot' }, { status: 400 });
    }

    const result = await restoreMediaVersion(
      body.key,
      parsedKey.scope,
      parsedKey.id,
      body.versionId,
    );

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.reason },
        { status: result.reason === 'not-found' ? 404 : 502 },
      );
    }

    if (parsedKey.scope === 'page') {
      refreshEditorScreen(mediaSlotFor(parsedKey.id)?.group ?? 'home');
    } else if (parsedKey.scope === 'social') {
      refreshEditorScreen('home');
    } else {
      refreshEverything();
    }

    const index = result.data;

    return NextResponse.json({
      ok: true,
      versions: readHistory(index, body.key),
      media: parsedKey.scope === 'page' ? (index.pageMedia?.[parsedKey.id] ?? null) : null,
      post:
        parsedKey.scope === 'social'
          ? (mergeSocialPosts(index).find((entry) => entry.id === parsedKey.id) ?? null)
          : null,
      brand: parsedKey.scope === 'brand' ? await resolveBrand(index) : null,
    });
  }

  /* --- A publish --------------------------------------------------------- */
  if (typeof body.namespace === 'string') {
    if (!isCopyNamespace(body.namespace)) {
      return NextResponse.json({ ok: false, error: 'unknown-namespace' }, { status: 400 });
    }

    if (typeof body.snapshotId !== 'string' || !body.snapshotId) {
      return NextResponse.json({ ok: false, error: 'snapshot-required' }, { status: 400 });
    }

    const namespace = body.namespace;
    const snapshotId = body.snapshotId;
    let found = true;

    const written = await mutateCopyOverlay((overlay) => {
      const snapshot = copyHistoryFor(overlay, namespace).find(
        (entry) => entry.id === snapshotId,
      );

      if (!snapshot) {
        found = false;
        return overlay;
      }

      /* File the current state before replacing it, so undoing an undo is
         the same action again. */
      const filed = pushSnapshot(
        overlay,
        namespace,
        snapshotOf(overlay, namespace, Object.keys(snapshot.values.en)),
      );

      return replaceNamespaceValues(filed, namespace, {
        en: snapshot.values.en,
        'zh-hk': snapshot.values['zh-hk'],
      });
    });

    if (!found) {
      return NextResponse.json({ ok: false, error: 'not-found' }, { status: 404 });
    }

    if (!written.ok) {
      return NextResponse.json({ ok: false, error: written.reason }, { status: 502 });
    }

    refreshEditorScreen(namespace);

    const values = copyValuesFor(written.data, namespace);

    return NextResponse.json({
      ok: true,
      /* The editor rebuilds its fields from these plus the code defaults. */
      values: { en: values.en, zh: values['zh-hk'] },
      fields: copyFieldsFor(namespace).length,
      history: copyHistoryFor(written.data, namespace),
    });
  }

  return NextResponse.json({ ok: false, error: 'key-required' }, { status: 400 });
}
