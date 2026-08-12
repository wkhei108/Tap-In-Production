import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import Wordmark from '@/components/brand/Wordmark';
import { site } from '@/content/site';

/* ==========================================================================
   An uploaded logo has to be sized by its own height, not by the cap height
   of the words it replaced: a logo file usually carries padding inside its
   viewBox, so matching the text size renders it far smaller than expected.
   ========================================================================== */

const logo = 'https://example.public.blob.vercel-storage.com/media/brand/logo-1.svg';

describe('Wordmark', () => {
  it('sets the name in the display face until a logo is uploaded', () => {
    const { container } = render(<Wordmark />);

    /* Twice on purpose: once for screen readers, once with a non-breaking
       space for sighted readers. */
    expect(screen.getAllByText(site.name).length).toBeGreaterThan(0);
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders an uploaded logo in place of the text', () => {
    render(<Wordmark logoUrl={logo} name="TAP IN." />);

    const image = screen.getByRole('img', { name: 'TAP IN.' });
    expect(image.getAttribute('src')).toBe(logo);
    expect(screen.queryByText('TAP IN.')).toBeNull();
  });

  it('uses the height it was given rather than the surrounding text size', () => {
    render(<Wordmark logoUrl={logo} logoClassName="h-8 md:h-10" className="text-2xl" />);

    const image = screen.getByRole('img');
    expect(image.className).toContain('h-8');
    expect(image.className).toContain('md:h-10');
    /* The old bug: tied to `1em` of the caller's font size. */
    expect(image.className).not.toContain('h-[1em]');
  });

  it('caps its width so a wide lockup cannot crowd out the nav', () => {
    render(<Wordmark logoUrl={logo} />);

    const className = screen.getByRole('img').className;
    expect(className).toContain('max-w-');
    expect(className).toContain('object-contain');
  });

  it('carries the editable site name as its accessible name', () => {
    render(<Wordmark logoUrl={logo} name="Edited Name" />);
    expect(screen.getByRole('img', { name: 'Edited Name' })).toBeTruthy();
  });
});
