/**
 * Fixed paper-grain wash sitting above the background and below content.
 * Server-rendered inline SVG so there is no extra request and no flash.
 */
export default function TextureOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.055] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
