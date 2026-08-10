# Client input needed before launch

The site is complete and deployable as it stands. This is what TAP IN. needs to
supply to replace placeholder content and switch on the sections that are
currently held back.

Nothing here blocks a staging deploy. Items marked **Blocking** should be
resolved before the site is announced publicly.

---

## 1. Domain and hosting — Blocking

| Item                | Why it matters                                                                 |
| ------------------- | ------------------------------------------------------------------------------ |
| Final domain        | Canonical URLs, `hreflang`, `sitemap.xml`, `robots.txt` and JSON-LD all use it. |
| DNS access          | To point the domain at the host.                                                |

Currently `https://tapin.hk` is used as a placeholder. Set
`NEXT_PUBLIC_SITE_URL` to the real origin and redeploy.

## 2. Email delivery — Blocking

| Item                  | Notes                                                          |
| --------------------- | -------------------------------------------------------------- |
| Resend account        | Or a preferred alternative provider.                            |
| `RESEND_API_KEY`      | Server-side only.                                               |
| Verified sender domain| So enquiries do not land in spam.                               |
| Confirm inbox         | Enquiries currently default to `tap.in.enquiry@gmail.com`.      |

Until this is configured the form validates correctly and tells the visitor
plainly that the enquiry was not delivered. **It never shows a false success.**

## 3. Brand assets — Blocking

| Item                        | Notes                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| Vector logo (SVG or AI/EPS) | The current wordmark is a temporary type setting.                 |
| Square brand mark           | For the favicon, web manifest and app icon.                       |
| Brand guidelines            | If they exist — colour, type and clear-space rules.               |
| Confirm the accent palette  | Built to the supplied lime / blue / green; adjusted only for AA.  |

## 4. Photography and video — Blocking

Every image on the site is currently a branded placeholder panel. See
[`asset-guide.md`](asset-guide.md) for sizes and file paths.

| Item                                  | Where it appears                          |
| ------------------------------------- | ----------------------------------------- |
| Homepage showreel (15–30s, silent)    | Hero background                            |
| Hero poster frame                     | Hero — required, carries the page alone    |
| 2 editorial images                    | Homepage introduction                      |
| 7 images                              | BUILD-A-CLUB service sections              |
| 8 images                              | BUILD-A-GAME service sections              |
| 2 images                              | About page                                 |
| Cover + gallery per project           | Work grid and case studies                 |
| 5 curated Instagram frames            | “From the touchline” rail                  |

Original TAP IN. work only. No stock football imagery, and nothing exported
from an Instagram screenshot.

## 5. Portfolio — Blocking

All six projects in `src/content/projects.ts` are clearly marked sample
entries. For each real project we need:

- Confirmed project name, in English and Traditional Chinese
- Client or organiser name, **and permission to name them**
- Year
- What the brief actually was, the challenge, and how it was approached
- Services delivered and deliverables
- Media

## 6. Results and testimonials — Non-blocking

Not published, and will not be, until supplied and verified.

- **Verified** performance figures (reach, growth, sponsor outcomes) with the
  source they came from. Case studies currently state that results have not
  been published rather than inventing any.
- Approved client quotes, with attribution and written permission.

## 7. Client logos — Non-blocking

The “Clubs & collaborators” band renders an explanatory placeholder instead of
a logo strip. To switch it on:

- Vector logo from each rights holder
- Written permission to display it

## 8. Team — Non-blocking

The About page states that profiles will follow. No invented founders or staff
have been published. To add them:

- Real names, roles and short biographies (both languages)
- Portraits
- Permission to publish

## 9. Privacy wording — Blocking

`/privacy` is a plain-language draft covering the enquiry form and optional
analytics. It carries a visible “draft for review” notice.

**TAP IN. must read and approve the wording before launch**, and remove the
notice in `src/content/en.ts` / `zh-hk.ts` (`privacy.reviewNotice`) once
approved. It deliberately does not claim compliance with any specific regime.

## 10. Optional configuration — Non-blocking

| Item                          | Effect if left blank                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp row is omitted from the contact page.               |
| `NEXT_PUBLIC_ANALYTICS_ID`    | No analytics script loads at all, and no cookie banner is needed. |

If TAP IN. later chooses an analytics tool that sets non-essential cookies, a
consent banner must be added before it goes live.

## 11. Copy review — Non-blocking

All English and Traditional Chinese copy was written for this build and should
be read through by TAP IN. In particular:

- The service descriptions on BUILD-A-CLUB and BUILD-A-GAME
- The sample season workflow and matchweek calendar (marked “illustrative”)
- The sample event journey and deliverables board (marked “illustrative”)
- The About page point of view and differentiators

No pricing appears anywhere. If TAP IN. wants packages or indicative pricing
published, supply the figures and it can be added.
