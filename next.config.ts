import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Built-in imagery ships from /public. Anything added through the admin
    // tool — campaign photos, covers, the homepage hero poster — lives in the
    // project's Vercel Blob store under the same media/ layout.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/media/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 390, 640, 768, 1024, 1280, 1440, 1920, 2400],
    imageSizes: [96, 160, 240, 320, 480],
  },
  // Unprefixed paths are redirected to a locale in src/middleware.ts.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
