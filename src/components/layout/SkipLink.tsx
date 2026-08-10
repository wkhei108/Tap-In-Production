export default function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:items-center focus:rounded-xs focus:bg-lime focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink"
    >
      {label}
    </a>
  );
}
