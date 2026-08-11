# TAP IN. — website

Production website for **TAP IN.**, a Hong Kong football production and
consultancy team working across two service lines: **BUILD-A-CLUB** (club
identity, content and season production) and **BUILD-A-GAME** (tournament and
event production).

Bilingual (English / Traditional Chinese for Hong Kong), mobile-first, and
built for visitors arriving from Instagram.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional for local development
npm run dev                    # http://localhost:3000 → redirects to /en
```

| Command             | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Development server                                      |
| `npm run build`     | Production build                                        |
| `npm run start`     | Serve the production build                              |
| `npm run lint`      | ESLint (`next/core-web-vitals` + `next/typescript`)      |
| `npm run typecheck` | `tsc --noEmit`, strict mode                              |
| `npm test`          | Vitest unit and component tests                          |
| `npm run verify`    | lint → typecheck → test → build, in one go               |

Node 20.9+ is required. The project uses **npm**; `package-lock.json` is
committed.

---

## Stack

- **Next.js 16** (App Router, React Server Components by default)
- **React 19**, **TypeScript** in strict mode
- **Tailwind CSS v4** — design tokens live in `src/app/globals.css` under `@theme`
- **Motion** for a small amount of entrance and hover motion
- **Zod** for contact-form validation (shared client and server)
- **Lucide** icons
- **Vitest** + Testing Library

Client components are used only where interaction requires them: the header
scroll state, mobile menu, language switcher, work filters, contact form,
lightbox, and the hero video gate. Everything else renders on the server.

---

## Routes

Every page exists in both locales. Route segments are identical across
languages, which is what lets the language switcher keep you on the same page —
including the project slug on a case study.

| English                    | Traditional Chinese            |
| -------------------------- | ------------------------------ |
| `/en`                      | `/zh-hk`                       |
| `/en/build-a-club`         | `/zh-hk/build-a-club`          |
| `/en/build-a-game`         | `/zh-hk/build-a-game`          |
| `/en/work`                 | `/zh-hk/work`                  |
| `/en/work/[slug]`          | `/zh-hk/work/[slug]`           |
| `/en/about`                | `/zh-hk/about`                 |
| `/en/contact`              | `/zh-hk/contact`               |
| `/en/privacy`              | `/zh-hk/privacy`               |

Plus `POST /api/contact`, and the generated `/sitemap.xml`, `/robots.txt`,
`/manifest.webmanifest`, `/icon.svg` and `/{locale}/opengraph-image`.

`src/proxy.ts` (Next 16's replacement for `middleware.ts`) redirects any
unprefixed path to a locale — `/` uses the visitor's `Accept-Language`, and
`/work` and friends go to English.

---

## Project structure

```
src/
  app/
    [locale]/            # This is the root layout: it owns <html lang=…>
      layout.tsx           header, footer, JSON-LD, fonts
      page.tsx             homepage
      build-a-club/        BUILD-A-CLUB
      build-a-game/        BUILD-A-GAME
      work/                index + [slug] case-study template
      about/ contact/ privacy/
      opengraph-image.tsx  social card, generated per locale
      not-found.tsx
    api/contact/route.ts # enquiry endpoint
    globals.css          # design tokens + base styles
    sitemap.ts robots.ts manifest.ts icon.svg
  components/
    layout/    SiteHeader, HeaderShell, MobileMenu, LanguageSwitcher,
               SiteFooter, SkipLink
    home/      HeroShowreel, HeroVideo, ServiceTicker, PillarCard,
               CapabilityGrid, ProcessTimeline, SponsorValueSection,
               SocialMediaRail
    sections/  PageHero, ServiceSections, StageTimeline, PlanBoard, FinalCTA
    work/      ProjectCard, ProjectGrid, ProjectFilters, WorkExplorer
    media/     MediaFrame, VideoPlayer, ProjectGallery, Lightbox
    contact/   ContactForm
    ui/        SectionHeading, DisplayText, PrimaryCTA, Reveal,
               PitchLinePattern, TextureOverlay, icons
    brand/     Wordmark
  content/     site.ts, en.ts, zh-hk.ts, dictionaries.ts,
               services.ts, projects.ts, social.ts
  lib/         i18n.ts, seo.ts, contact-schema.ts, mailer.ts, utils.ts,
               use-rich-media-allowed.ts
tests/         Vitest suites
docs/          asset-guide.md, client-input-needed.md
```

---

## Editing content

**All copy lives in `src/content/`. No component contains a hard-coded
sentence, email address or handle.**

| File               | Holds                                                          |
| ------------------ | -------------------------------------------------------------- |
| `site.ts`          | Company name, email, Instagram, site URL, nav order, WhatsApp   |
| `en.ts`            | Every English string, page by page                              |
| `zh-hk.ts`         | The Traditional Chinese counterpart                             |
| `services.ts`      | BUILD-A-CLUB / BUILD-A-GAME service detail, capabilities, process |
| `projects.ts`      | Portfolio entries and the typed project model                   |
| `social.ts`        | The curated “From the touchline” Instagram rail                 |

### Adding a translation

`zh-hk.ts` is typed as `typeof en`. Add a key to `en.ts` and the Chinese file
stops compiling until it is translated — parity is enforced by the compiler,
not by discipline. A test additionally flags any Chinese value that is still
identical to the English one.

### Adding a real project

1. Copy an entry in `src/content/projects.ts`.
2. Replace `title`, `titleZh`, `client`, `summary`, `summaryZh`, `brief`,
   `challenge`, `approach`, `deliverables`, `services`.
3. Add `year` and set `sample: false`.
4. Add media under `public/media/projects/<slug>/` and set `coverImage` and
   the `gallery` `src` values — see [`docs/asset-guide.md`](docs/asset-guide.md).
5. Only add `outcomes` when TAP IN. has **verified** the numbers. With no
   outcomes the case study says so plainly instead of inventing results.

### Sample data

Every project currently in `projects.ts` is marked `sample: true`, shows a
“Sample entry” badge, and carries no year and no results. They exist to prove
the template. Replace them before launch.

---

## Media

No client photography or video has been supplied yet. Rather than shipping
stock football imagery, every image slot renders through `MediaFrame`, which
draws a branded panel at exactly the right aspect ratio and prints the file
path it is waiting for. Nothing breaks, nothing shifts, and swapping in a real
asset is: drop the file in, set the path.

The hero accepts an optional showreel. Set `videoSrc` and `posterSrc` on
`<HeroShowreel>` in `src/app/[locale]/page.tsx` once the files exist. The
video is only fetched for visitors who are not on reduced motion and not on a
metered or slow connection; everyone else gets the poster.

Full specifications — filenames, dimensions, aspect ratios, compression and
alt-text rules — are in [`docs/asset-guide.md`](docs/asset-guide.md).

### Updating photos without a deploy

There are two ways to put a photo on the site, and they coexist:

| | Where it lives | Who can do it | When to use it |
| --- | --- | --- | --- |
| **In the repo** | `public/media/`, wired up in `src/content/projects.ts` | anyone editing code | the permanent set — covers, hero, service images |
| **`/admin/media`** | the project's Vercel Blob store | anyone with the admin token | adding case-study photos after launch |

The admin tool never edits `src/content/projects.ts`, so the repo stays the
source of truth for everything that shipped with the build. What it does own is
the running order around those entries: uploads can be reordered, and a photo
can be **pinned** to lead the gallery ahead of the built-in slots.

### Managing campaigns

`/admin` is the front door: every campaign with its cover thumbnail, a
**no cover** flag on the ones still on a placeholder, drag-to-reorder (which
sets the order on Work and in every grid), inline **Edit**, and **New
campaign**. Drilling into one opens `/admin/media/<slug>` — the photo library.

Editing covers the short form only: name, client, summary, category, filters,
year, both languages. The long case-study prose (brief, challenge, approach,
deliverables) stays in `src/content/projects.ts`, because that is where the
compiler enforces English/Chinese parity. Campaigns created in the tool simply
have none of it, and the case-study template skips those sections.

**Renaming never changes the URL.** A slug is derived from the name once, at
creation, and frozen — nothing anyone linked or Google indexed ever breaks.

Categories are managed on the same screen. They resolve per request rather than
from a compile-time enum, so one added through the tool is immediately usable;
the `/work` filter chips are a separate, code-only concept and stay that way.

### The homepage hero

Also on `/admin`: the full-screen poster at the top of the homepage, plus an
optional silent MP4 showreel. The poster is cropped to 2400×1350; the video is
stored exactly as supplied, since nothing here can transcode it. The showreel is
withheld on reduced motion and slow connections, so the poster has to stand on
its own — which is why its alt text is required in both languages. With no hero
saved the homepage renders its placeholder, exactly as before.

### Cover photos

A campaign's cover is the image that represents it everywhere — its own page, the
Work index, and every grid that lists it. Set one in `/admin/media` either by
starring a photo already in the gallery, or by uploading a cover that never
appears in the gallery. Clearing it falls back to whatever `projects.ts` says.

Because covers render on five different page types, reading each campaign's
manifest per page would mean a dozen storage round trips. Instead a single
`media/site-index.json` carries the overlay, and `resolveProjects()` in
`src/lib/campaigns.ts` applies it. That function returns plain `Project[]`, so
`ProjectCard`, `ProjectGrid` and `WorkExplorer` needed no changes at all. With
storage unconfigured it returns the code-defined list unchanged.

Those pages carry `revalidate = 900` as a backstop; writes call `revalidatePath`
so an edit shows up immediately rather than waiting it out.

The gallery is a 12-column grid and each crop claims a different share of it
(landscape 8, portrait 4, square 6), so the order decides whether a row fills
cleanly. `/admin/media` renders the resulting rows — including the built-in
slots — so a ragged gap is visible before it is published rather than after.
Both the grid and that preview read `src/lib/gallery-layout.ts`, which is what
stops them drifting apart.

An upload is resized to the crop you pick, converted to WebP, and **stripped of
metadata** — match photography routinely carries GPS coordinates, and blob
storage is public. Alt text is required in both languages, the same rule the
asset guide sets for hand-added assets.

To switch it on:

1. Vercel dashboard → **Storage** → create a **Blob** store and connect it to
   the project. That sets `BLOB_READ_WRITE_TOKEN` automatically.
2. Set `ADMIN_MEDIA_TOKEN` to at least 32 characters
   (`openssl rand -hex 32`). Anything shorter is refused rather than trusted.
   This doubles as the sign-in password.
3. Redeploy, then open `/admin/media`.

Signing in exchanges that password for an HttpOnly cookie that lasts 30 days,
so it is typed once per device rather than every visit. Rotating
`ADMIN_MEDIA_TOKEN` invalidates every outstanding session — that is the lever
to pull if it ever leaks. `src/lib/admin-session.ts` signs the cookie with
`node:crypto`; there is no session store and no auth dependency.

With either variable missing, the tool says exactly what is still needed and
the site renders precisely as it does today. Nothing half-works.

Case studies stay statically rendered and revalidate every 5 minutes; an upload
also refreshes its own case study immediately. Storage lives behind
`src/lib/photo-storage.ts`, so moving off Vercel Blob means rewriting one file.

---

## Contact form

- Validated with the **same Zod schema on the client and the server**
  (`src/lib/contact-schema.ts`), so error messages match in either language.
- `POST /api/contact` re-validates, applies a small in-memory rate limit, and
  hands off to the mail adapter.
- **Honeypot**: a hidden `website` field. A filled one gets a success-shaped
  response and no email — the bot learns nothing.
- **No fake success.** If delivery fails, or is not configured, the form shows
  an error, keeps everything the visitor typed, and points them at the email
  address.

### Enabling delivery

1. Create a [Resend](https://resend.com) account and verify the sending domain.
2. Set `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL`.
3. Redeploy.

Without `RESEND_API_KEY`, the server logs the enquiry and clearly states that
email delivery is not configured. The adapter talks to the Resend REST API over
`fetch`, so there is no SDK in the dependency tree; swapping provider means
editing one function in `src/lib/mailer.ts`.

---

## Accessibility

Targeting WCAG 2.2 AA.

- Semantic landmarks, a skip link, and a visible focus ring on every control
- Mobile menu is a labelled dialog: focus moves in, is trapped, returns to the
  trigger, and Escape closes it
- Lightbox supports Escape and arrow keys and restores focus to its thumbnail
- Filters are real buttons with `aria-pressed`; state is never colour-only
- Every form control has a label; errors are linked with `aria-describedby`
  and announced through a focusable summary
- `lang` is correct per locale (`en` / `zh-Hant-HK`)
- Colour tokens meet AA on the dark shell — the blue and green pillar accents
  each have a brighter `-ink` variant for body-size text
- `prefers-reduced-motion` disables the ticker, entrance animations and the
  hero video; no content is ever gated behind an animation

## Performance

- Static generation for all 28 pages; no client JS on purely editorial sections
- `next/image` with explicit `sizes`; every media slot has a fixed aspect ratio
  so there is no layout shift
- The lightbox is dynamically imported and only loads when opened
- Section reveals use an IntersectionObserver and two CSS classes rather than
  an animation library, so Motion loads only on `/work`, where it drives the
  filter transition. That keeps ~38 KB gzipped off every other route.
- Two Latin webfonts, subset to `latin`. Traditional Chinese uses the system HK
  face (PingFang HK / JhengHei / Noto), so CJK pages download no font at all
- Analytics loads only when `NEXT_PUBLIC_ANALYTICS_ID` is set

Homepage client JS is ~184 KB gzipped, most of it the React 19 + Next 16
runtime.

---

## Deployment

### Vercel (recommended)

1. Import the repository.
2. Framework preset: **Next.js**. Build `npm run build`, output handled
   automatically.
3. Add the environment variables from `.env.example`.
4. Point the domain at the project, then set `NEXT_PUBLIC_SITE_URL` to the
   final origin and redeploy so canonical URLs, `hreflang`, the sitemap and
   JSON-LD all use it.

### Any Node host

```bash
npm ci
npm run build
npm run start          # defaults to port 3000, override with PORT
```

Requires a Node runtime — `src/proxy.ts` and `/api/contact` are server-side, so
a purely static export is not supported.

### After the first deploy

- Submit `https://<domain>/sitemap.xml` to Google Search Console
- Check the social card at `https://<domain>/en/opengraph-image`
- Confirm a real enquiry arrives in the TAP IN. inbox

---

## Before launch

See [`docs/client-input-needed.md`](docs/client-input-needed.md) for the list
of assets, confirmations and credentials still needed from TAP IN. — final
domain, vector logo, photography and video, confirmed project names, client
logo approvals, verified results, team biographies, and sign-off on the
privacy wording.
