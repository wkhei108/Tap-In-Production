'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminGhostButton } from './admin-ui';

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className={adminGhostButton}>
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
