import type { BoardColumn } from '@/content/services';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const tones = {
  club: 'text-club-ink',
  game: 'text-game-ink',
  lime: 'text-lime',
} as const;

/**
 * Substitution-board style column set — used for the sample matchweek calendar
 * and the sample event deliverables board.
 */
export default function PlanBoard({
  columns,
  locale,
  tone = 'lime',
  note,
}: {
  columns: BoardColumn[];
  locale: Locale;
  tone?: keyof typeof tones;
  note?: string;
}) {
  return (
    <div>
      <div className="grid gap-px overflow-hidden rounded-xs border border-line bg-line md:grid-cols-4">
        {columns.map((column) => (
          <section key={column.id} className="flex flex-col gap-4 bg-ink p-5 md:p-6">
            <h3
              className={cn(
                'meta border-b border-line pb-3',
                tones[tone],
              )}
            >
              {column.title[locale]}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {column.items[locale].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 font-mono text-[0.8rem] leading-snug text-bone/85"
                >
                  <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 bg-mute/60" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {note ? <p className="meta mt-4 text-mute/60">{note}</p> : null}
    </div>
  );
}
