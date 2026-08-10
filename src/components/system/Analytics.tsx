import Script from 'next/script';
import { site } from '@/content/site';

/**
 * Analytics is opt-in and privacy-light.
 *
 * With no `NEXT_PUBLIC_ANALYTICS_ID` configured this renders nothing at all —
 * no script, no request, no cookie — which is why the site does not need a
 * cookie banner in its current configuration.
 *
 * The default integration is Plausible (cookieless). Swap the src if TAP IN.
 * chooses a different provider; if that provider sets non-essential cookies,
 * a consent banner must be added before launch.
 */
export default function Analytics() {
  if (!site.analyticsId) return null;

  return (
    <Script
      strategy="afterInteractive"
      data-domain={site.analyticsId}
      src="https://plausible.io/js/script.js"
    />
  );
}
