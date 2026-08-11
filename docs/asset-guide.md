# Asset guide

Everything you need to know to replace the placeholder panels with real TAP IN.
photography, video and artwork.

Nothing in this site depends on an asset existing. Every image slot renders
through `MediaFrame`, which draws a branded panel at the correct aspect ratio
and prints the file path it is waiting for. Adding an asset is always the same
two steps: **drop the file in the right folder, set the path in the content
file.**

> **Case-study photos can also be added without a deploy.** Once a Vercel Blob
> store is connected, `/admin/media` uploads straight into a project's gallery,
> applies the sizes below for you, and lets you reorder or pin what you have
> added. See README → Media. Everything else on this page — covers, hero,
> service and social imagery — still goes through the repo.

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

**The Instagram rail** — `src/content/social.ts`: set `image` to the exported
frame and `href` to the post URL. Export from the original file; do not
screenshot the Instagram interface, and do not scrape.

**Service section images** — no code change needed. Save the file at the path
printed on the placeholder and it appears, because `ServiceSections` derives
the path from the service `id`.

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

`public/brand/tap-in-logo.svg` is a **temporary** wordmark set in a condensed
system typeface. It has not been traced from a screenshot, which would be both
inaccurate and a poor basis for print.

When the real vector arrives, replace that file like for like, and update
`src/components/brand/Wordmark.tsx` to render it (currently it sets the name as
text). `public/brand/tap-in-mark.svg` — the pitch-motif square used for the
favicon and web manifest — can stay or be replaced with the official mark.

## Client logos

The “Clubs & collaborators” band on the homepage is deliberately **not** a logo
strip. It renders an explanatory placeholder instead, and will stay that way
until TAP IN. supplies:

1. Written permission from each club or partner, and
2. Vector (SVG) artwork from the rights holder.

Do not lift logos out of Instagram screenshots.
