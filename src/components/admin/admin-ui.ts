/* ==========================================================================
   Shared class strings for the admin tool.

   The public site gets its polish from `globals.css`; the admin is a private
   utility, so rather than inventing a second design language it borrows the
   same tokens (ink / surface / line / bone / mute / lime) through a handful of
   strings kept in one place.
   ========================================================================== */

export const adminField =
  'mt-1.5 w-full rounded-xs border border-line bg-ink px-3 py-2 text-sm text-bone ' +
  'outline-none transition-colors placeholder:text-mute/40 focus-visible:border-lime';

export const adminLabel = 'block text-xs uppercase tracking-wider text-mute';

export const adminPrimaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xs bg-lime px-5 py-2.5 text-sm ' +
  'font-medium text-ink transition-opacity hover:opacity-90 disabled:pointer-events-none ' +
  'disabled:opacity-40';

export const adminGhostButton =
  'inline-flex items-center justify-center gap-2 rounded-xs border border-line px-3 py-1.5 ' +
  'text-xs text-mute transition-colors hover:border-line-strong hover:text-bone ' +
  'disabled:pointer-events-none disabled:opacity-30';

export const adminIconButton =
  'grid size-8 shrink-0 place-items-center rounded-xs border border-line text-mute ' +
  'transition-colors hover:border-line-strong hover:text-bone ' +
  'disabled:pointer-events-none disabled:opacity-25';

export const adminCard = 'rounded-xs border border-line bg-surface';
