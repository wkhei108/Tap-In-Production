import type { Metadata } from 'next';
import '../globals.css';

/**
 * A second root layout, alongside `[locale]`. The admin is a private
 * single-language utility — it deliberately gets no site header, footer,
 * analytics or locale switching.
 */
export const metadata: Metadata = {
  title: 'Admin — TAP IN.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-svh text-bone antialiased">{children}</body>
    </html>
  );
}
