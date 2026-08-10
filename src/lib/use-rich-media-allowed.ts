'use client';

import { useSyncExternalStore } from 'react';

type SaveDataConnection = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

function getConnection(): SaveDataConnection | undefined {
  return (navigator as Navigator & { connection?: SaveDataConnection }).connection;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Subscribes to the two signals that decide whether heavy media should run:
 * the visitor's motion preference and their connection.
 *
 * Both are external systems, so this reads them through `useSyncExternalStore`
 * rather than assigning state inside an effect — the value is correct on the
 * first client render, and it updates live if the visitor turns on reduced
 * motion or Data Saver.
 */
function subscribe(onChange: () => void): () => void {
  const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  motionQuery.addEventListener('change', onChange);

  const connection = getConnection();
  connection?.addEventListener?.('change', onChange);

  return () => {
    motionQuery.removeEventListener('change', onChange);
    connection?.removeEventListener?.('change', onChange);
  };
}

function getSnapshot(): boolean {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return false;

  const connection = getConnection();
  if (connection?.saveData === true) return false;
  if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
    return false;
  }

  return true;
}

/** The server never assumes video is wanted — the poster renders instead. */
function getServerSnapshot(): boolean {
  return false;
}

export function useRichMediaAllowed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
