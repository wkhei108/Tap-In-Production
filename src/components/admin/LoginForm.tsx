'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminField, adminPrimaryButton } from './admin-ui';

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setBusy(false);
      setError(body.message ?? 'Could not sign in. Try again.');
      return;
    }

    // The cookie is set; re-render the server component that gates /admin.
    router.replace('/admin');
    router.refresh();
  }

  if (!configured) {
    return (
      <div className="rounded-xs border border-line bg-surface p-5 text-sm text-mute">
        <p className="text-bone">This tool is not set up on this deployment yet.</p>
        <p className="mt-3">
          <code className="text-bone/80">ADMIN_MEDIA_TOKEN</code> is unset or shorter than
          32 characters. Set it in the Vercel dashboard under Settings → Environment
          Variables, then redeploy.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs uppercase tracking-wider text-mute" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          autoFocus
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          className={adminField}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-amber">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={busy || !password} className={adminPrimaryButton}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-xs text-mute/70">
        Stays signed in on this device for 30 days.
      </p>
    </form>
  );
}
