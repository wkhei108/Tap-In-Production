import type { Metadata } from 'next';
import '../globals.css';

/**
 * A second root layout, alongside `[locale]`. The media tool is a private
 * single-language utility — it deliberately gets no header, footer, analytics
 * or locale switching.
 */
export const metadata: Metadata = {
  title: 'Media — TAP IN.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-svh bg-ink text-bone antialiased">{children}</body>
    </html>
  );
}
