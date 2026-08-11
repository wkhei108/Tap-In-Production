# Asset guide

Everything you need to know to replace the placeholder panels with real TAP IN.
photography, video and artwork.

Nothing in this site depends on an asset existing. Every image slot renders
through `MediaFrame`, which draws a branded panel at the correct aspect ratio
until something is supplied.

> **Almost everything here is now uploaded, not committed.** With a Vercel Blob
> store connected, the admin at `/admin` handles campaign covers and galleries,
> the homepage hero, the images on Home / About / Build a Club / Build a Game,
> the Instagram rail, and the logo, app mark, favicon and share image. Uploads
> are cropped to the sizes below and stripped of location data automatically.
> Nothing on this page needs a deploy unless you are adding a *new* slot rather
> than filling an existing one.
>
> The paths below still describe what ships in the repo, which is what the site
> falls back to when a slot has never been filled.

---

## Folder structure

```
public/
  brand/
    tap-in-logo.svg              # wordmark  (TEMPORARY — see below)
    tap-in-mark.svg              # square mark, used for the favicon + manifest
  media/
    hero/
      showreel.mp4               # optional homepage showreel
      showreel.webm              # optional, better compression
      poster.webp                # poster frame — required if using video
    home/
      intro-primary.webp
      intro-secondary.webp
    about/
      team-at-work.webp
      hong-kong-football.webp
    build-a-club/
      social-media.webp          # one per service id, see below
      match-photography.webp
      video-production.webp
      brand-identity.webp
      photoshoots.webp
      merchandise.webp
      sponsorship-content.webp
    build-a-game/
      competition-planning.webp
      venue-logistics.webp
      event-identity.webp
      marketing-promotion.webp
      sponsorship-partnerships.webp
      awards-merchandise.webp
      event-execution.webp
      fan-experiences.webp
    projects/
      <project-slug>/
        cover.webp
        gallery-01.webp
        gallery-02.webp
        video-01.mp4
    social/
      post-01.webp … post-05.webp
    clients/
      <client-name>.svg          # only with written approval
```

The service filenames match the `id` of each entry in
`src/content/services.ts`. The placeholder panel prints the exact path it
expects, so you can also just read it off the page.

---

## Sizes and formats

| Use                         | Pixels        | Ratio  | Format      | Target size |
| --------------------------- | ------------- | ------ | ----------- | ----------- |
| Hero poster                 | 2400 × 1350   | 16:9   | WebP / AVIF | < 250 KB    |
| Hero showreel               | 1920 × 1080   | 16:9   | MP4 + WebM  | < 4 MB      |
| Landscape case-study image  | 2000 × 1250   | 16:10  | WebP / AVIF | < 300 KB    |
| Portrait editorial image    | 1350 × 1800   | 3:4    | WebP / AVIF | < 300 KB    |
| Square social image         | 1400 × 1400   | 1:1    | WebP / AVIF | < 250 KB    |
| Client logo                 | vector        | —      | SVG         | < 20 KB     |

The site's three crops are **landscape 16:10**, **portrait 3:4** and
**square 1:1** (`aspectRatios` in `src/lib/utils.ts`). Supplying an image at a
different ratio is fine — it will be cropped to fill, so keep the subject away
from the edges.

`next/image` generates the responsive sizes and serves AVIF/WebP
automatically. Upload the largest good-quality version listed above; do not
pre-generate `@2x` variants.

### Video

- 15–30 seconds, cut to loop cleanly
- **Silent.** The audio track should be removed entirely, not muted
- H.264 MP4 as the baseline, VP9/AV1 WebM alongside it if you can
- Always supply `poster.webp` — it is what most mobile visitors will see
- One background video per page, maximum

The showreel is only downloaded for visitors who are not on reduced motion and
not on a metered or slow connection. Everyone else gets the poster, so the
poster has to stand on its own.

### Keep sources out of `public/`

Everything in `public/` is deployed. Keep RAW files, project files and master
exports somewhere else — the repo ignores a top-level `/src-assets/` folder if
you want to keep them nearby without shipping them.

---

## Wiring an asset up

**A project cover and gallery** — `src/content/projects.ts`:

```ts
coverImage: '/media/projects/invitational-cup-production/cover.webp',
gallery: [
  {
    type: 'image',
    aspect: 'landscape',
    src: '/media/projects/invitational-cup-production/gallery-01.webp',
    altText: 'Teams lining up before the cup final at Kowloon Park.',
    altTextZh: '盃賽決賽前，球隊在九龍公園球場列隊。',
    caption: { en: 'Walk-in · final', 'zh-hk': '進場 · 決賽' },
  },
],
```

**A gallery video** — same array, with a poster and a transcript:

```ts
{
  type: 'video',
  aspect: 'landscape',
  src: '/media/projects/<slug>/video-01.mp4',
  poster: '/media/projects/<slug>/video-01-poster.webp',
  altText: 'Highlights film from the cup final.',
  altTextZh: '盃賽決賽精華片段。',
  transcript: { en: '…', 'zh-hk': '…' },
}
```

**The homepage showreel** — `src/app/[locale]/page.tsx`:

```tsx
<HeroShowreel
  videoSrc="/media/hero/showreel.mp4"
  videoWebmSrc="/media/hero/showreel.webm"
  posterSrc="/media/hero/poster.webp"
  …
/>
```

**The Instagram rail** — Admin → Home → Instagram rail. Upload the exported
frame and paste the post URL. Export from the original file; do not screenshot
the Instagram interface, and do not scrape. `src/content/social.ts` still
defines how many cards there are and what they say before anyone edits them.

**Service section images** — Admin → Build a Club / Build a Game. Each service
has its own slot, derived from its `id`, so adding a service in
`src/content/services.ts` brings a slot with it.

**Home and About images** — Admin → Home / About.

**Copy** — every heading, paragraph, button label and caption on the site is
editable under the matching admin screen, in both languages. Editing there
overlays `src/content/`; anything left alone keeps coming from the repo, so a
copy fix shipped in code still reaches every field nobody has touched.

---

## Alt text

Every image needs alt text in **both languages** (`altText` and `altTextZh`).

- Describe what is happening, not the file: “Goalkeeper claiming a cross under
  floodlights” beats “football photo”.
- Name the club or event only when it is confirmed and correct.
- Purely decorative panels (pitch markings, grain) are already
  `aria-hidden` — you do not need to write anything for those.
- Do not start with “Image of…”.
- Keep it under about 125 characters.

## The logo

Until a logo is supplied the header and footer set the name in the display
face rather than tracing a screenshot, which would be both inaccurate and a
poor basis for print.

When the real vector arrives, upload it under Admin → Settings → Brand and it
takes over immediately — `Wordmark` renders it in place of the text, sized by
the same text classes. The app mark, favicon and share image are uploaded in
the same place. `public/brand/*.svg` stays as the fallback for a deployment
with no Blob store, and can be replaced like for like if you would rather ship
the artwork in the repo.

## Client logos

The “Clubs & collaborators” band on the homepage is deliberately **not** a logo
strip. It renders an explanatory placeholder instead, and will stay that way
until TAP IN. supplies:

1. Written permission from each club or partner, and
2. Vector (SVG) artwork from the rights holder.

Do not lift logos out of Instagram screenshots.
