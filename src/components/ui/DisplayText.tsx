import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

type Props = {
  children: React.ReactNode;
  locale: Locale;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  id?: string;
};

/**
 * Condensed display type, locale-aware.
 *
 * English gets the condensed uppercase treatment with negative tracking.
 * Traditional Chinese keeps its own face, normal case and positive tracking —
 * uppercase transforms and tight tracking wreck CJK rhythm.
 */
export default function DisplayText({
  children,
  locale,
  as: Tag = 'h2',
  className,
  id,
}: Props) {
  const isChinese = locale === 'zh-hk';

  return (
    <Tag id={id} className={cn(isChinese ? 'display-cjk' : 'display', className)}>
      {children}
    </Tag>
  );
}
