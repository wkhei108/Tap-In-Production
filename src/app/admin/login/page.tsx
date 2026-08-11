import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import LoginForm from '@/components/admin/LoginForm';
import { isAdminConfigured } from '@/lib/admin-auth';
import { sessionCookieName, verifySessionValue } from '@/lib/admin-session';

// Reads the session cookie, so it must never be captured at build time.
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const store = await cookies();

  if (verifySessionValue(store.get(sessionCookieName)?.value ?? null)) {
    redirect('/admin/media');
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-5 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-lime">TAP IN.</p>
      <h1 className="mt-2 font-mono text-xl tracking-tight text-bone">Media library</h1>
      <p className="mt-2 mb-8 text-sm text-mute">
        Sign in to add and arrange case-study photos.
      </p>

      <LoginForm configured={isAdminConfigured()} />
    </main>
  );
}
