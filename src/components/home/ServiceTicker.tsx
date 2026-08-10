import { cn } from '@/lib/utils';

/**
 * Continuous service strip under the hero.
 *
 * Pure CSS marquee — no client JavaScript. The duplicate track is hidden from
 * assistive technology so the list is announced once, and the animation is
 * switched off entirely by the `prefers-reduced-motion` block in globals.css,
 * where it becomes a static, readable row.
 */
export default function ServiceTicker({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  const track = (
    <ul className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item} className="flex items-center">
          <span className="display px-6 text-sm tracking-[0.18em] text-bone/70 md:text-base">
            {item}
          </span>
          <span aria-hidden="true" className="size-1 rotate-45 bg-lime/70" />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden border-y border-line bg-surface/50 py-3',
        className,
      )}
    >
      <div className="flex w-max animate-marquee motion-reduce:w-full motion-reduce:animate-none">
        {track}
        <div aria-hidden="true" className="flex motion-reduce:hidden">
          {track}
        </div>
      </div>
    </div>
  );
}
