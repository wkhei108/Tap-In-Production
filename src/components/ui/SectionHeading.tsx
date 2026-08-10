import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';
import DisplayText from './DisplayText';

type Props = {
  locale: Locale;
  eyebrow?: string;
  title: string;
  body?: string;
  /** Heading level — sections default to h2. */
  as?: 'h1' | 'h2' | 'h3';
  size?: 'lg' | 'md';
  align?: 'left' | 'center';
  tone?: 'lime' | 'club' | 'game';
  className?: string;
  id?: string;
  /** Rendered under the copy — usually a CTA. */
  children?: React.ReactNode;
};

const toneClass = {
  lime: 'text-lime',
  club: 'text-club-ink',
  game: 'text-game-ink',
} as const;

/**
 * The standard section opener: production-note eyebrow, condensed display
 * headline, optional lead paragraph.
 */
export default function SectionHeading({
  locale,
  eyebrow,
  title,
  body,
  as = 'h2',
  size = 'lg',
  align = 'left',
  tone = 'lime',
  className,
  id,
  children,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className={cn('meta flex items-center gap-3', toneClass[tone])}>
          <span aria-hidden="true" className="h-px w-6 bg-current" />
          {eyebrow}
        </p>
      ) : null}

      <DisplayText
        as={as}
        locale={locale}
        id={id}
        className={cn(
          size === 'lg' ? 'text-display-lg' : 'text-display-md',
          'max-w-[22ch]',
          align === 'center' && 'max-w-[26ch]',
        )}
      >
        {title}
      </DisplayText>

      {body ? (
        <p
          className={cn(
            'max-w-[62ch] text-lead text-mute',
            align === 'center' && 'mx-auto',
          )}
        >
          {body}
        </p>
      ) : null}

      {children}
    </div>
  );
}
