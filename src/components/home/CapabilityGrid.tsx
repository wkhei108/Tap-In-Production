import { capabilityGroups } from '@/content/services';
import type { Locale } from '@/lib/i18n';

/**
 * The full capability list, always visible.
 *
 * Deliberately a plain list rather than an accordion or hover reveal —
 * this is the content prospective clients scan for, so it is never hidden
 * behind an interaction.
 */
export default function CapabilityGrid({ locale }: { locale: Locale }) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-xs border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {capabilityGroups.map((group) => (
        <li key={group.id} className="flex flex-col gap-5 bg-ink p-6 md:p-7">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-4">
            <h3 className={locale === 'zh-hk' ? 'display-cjk text-xl' : 'display text-xl'}>
              {group.title[locale]}
            </h3>
            <span className="meta text-lime">{group.number}</span>
          </div>

          <ul className="flex flex-col gap-2.5">
            {group.items[locale].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-mute">
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rotate-45 bg-lime/60" />
                <span className="text-bone/80">{item}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
