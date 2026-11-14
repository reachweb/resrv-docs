# Resrv brand guide

The logo is a calendar page with three reservations laid out on it like a booking timeline: an ink page with two binder tabs, an orange-to-amber border, and orange, amber and white bars. The name RESRV sits next to it in wide capitals. Every file in this folder comes from the same vector artwork, so use the files as they are instead of rebuilding the logo.

## Logo versions

| Version | Use it for | Proportions |
| --- | --- | --- |
| Horizontal (`logo-horizontal`) | The main logo: website and docs header, emails, documents, README files | 4.11 : 1 |
| Stacked (`logo-stacked`) | Square or tall spaces: the Marketplace product image, slides, posters, merch | 1.41 : 1 |
| Icon (`icon`) | App icon, favicon, profile pictures, small spaces | 0.97 : 1 |
| Wordmark (`wordmark`) | Where the mark is already shown nearby, or space is very wide and short | 5.29 : 1 |

Each version comes in four colors:

| Color | Use it on |
| --- | --- |
| `color` | White and light backgrounds. The name is ink. |
| `reversed` | Ink, black and other dark backgrounds. The name is white; the mark is unchanged, because its gradient border keeps the ink page visible. |
| `black` | One-color printing: stamps, engraving, single-ink print, fax. |
| `white` | One color on photos, orange or other mid-tone backgrounds. |

In the one-color versions the border, the tab collars and the bars are the color and the ink page becomes see-through, so the mark reads as an outlined calendar with three bars. The wordmark has no `reversed` version: use `white`.

## Clear space and minimum size

Keep a clear space around the logo equal to the height of the capital R in the name, on every side. For the icon on its own, keep a quarter of its height. Nothing else (text, edges, other logos) goes inside that space.

| Version | Smallest on screen | Smallest in print |
| --- | --- | --- |
| Horizontal | 100 px wide (24 px tall, the docs header size) | 30 mm wide |
| Stacked | 80 px wide | 20 mm wide |
| Wordmark | 70 px wide | 18 mm wide |
| Icon, `color` or `reversed` | 24 px tall | 8 mm tall |
| Icon, `black` or `white` | 24 px tall | 8 mm tall (the collars around the tabs close up below this) |

Below 24 px, use `favicon/favicon.svg`: a simplified cut of the mark drawn on a 16 px grid, with the same tile, tabs, border and bars snapped to whole pixels.

## Colors

| Name | HEX | RGB | Where |
| --- | --- | --- | --- |
| Orange | `#F56B3C` | 245, 107, 60 | Start of the border gradient (top left); the first bar |
| Amber | `#F8AD22` | 248, 173, 34 | End of the border gradient (bottom right); the second bar |
| Ink | `#171718` | 23, 23, 24 | The calendar page and its tabs; the name on light backgrounds; dark backgrounds of the social and Marketplace images |
| White | `#FFFFFF` | 255, 255, 255 | The third bar; backgrounds; the name on dark backgrounds |
| Black | `#000000` | 0, 0, 0 | The `black` one-color logo only |

The border is a straight linear gradient from orange at the top left of the mark to amber at the bottom right. Orange to amber is the same pair as the gradient title on the docs home page, so the docs and the logo match.

The files are in screen colors (RGB). For offset printing, ask the printer to match the orange, the amber and the ink to CMYK or Pantone from a printed proof, then add the values here:

| Name | CMYK | Pantone |
| --- | --- | --- |
| Orange | not set yet | not set yet |
| Amber | not set yet | not set yet |
| Ink | not set yet | not set yet |

## Typography

The name RESRV is the wordmark from the previous Resrv logo, kept as outlines in every file (including that logo's slight horizontal stretch), so you don't need a font to use it. Never retype it.

For text next to the logo, use **Archivo** (SemiBold, width 112%), the face of the tagline "Booking system for Statamic" on the social and Marketplace images. Archivo has a width axis from 62% to 125%; its wider settings (Semibold to ExtraBold, 110% to 125%) also work for headings in marketing material. The font file and its license are in `font/`. The SIL Open Font License allows commercial use; keep `OFL.txt` with the font if you pass it on.

Inside the control panel, keep Statamic's own look: Resrv's CP pages use Statamic's UI components and fonts, so don't load Archivo or recolor the CP with the brand colors.

## Files

```
brand/
├── logo/
│   ├── svg/    Website, Figma, any design tool (vector)
│   ├── pdf/    Print and documents (vector)
│   ├── eps/    Printers and sign makers who ask for EPS (vector)
│   └── png/    Transparent background, 1000 px and 4000 px on the long side
├── favicon/    Browser and home screen icons
├── social/     Profile pictures, link previews, headers and the GitHub preview
├── statamic/   Marketplace images, their screenshots and the control panel navigation icon
└── font/       Archivo and its license
```

Logo files are named `resrv-{version}-{color}`, with the long-side size added to PNGs, for example `resrv-logo-horizontal-color-1000.png`. Use SVG on websites, PDF or EPS for print and PNG where vector files aren't accepted (email signatures, slides, chat apps).

## Statamic Marketplace

- **Product image:** upload `statamic/marketplace/product-image-1280.png`. It's 1280 × 1280, the size the current Resrv listing and other Marketplace addons use: the stacked logo and the tagline on white, with the orange to amber gradient along the bottom edge.
- **Screenshots:** upload `statamic/marketplace/01-…` to `08-…` in order. They're 2400 × 1600 (the Marketplace shows them at up to 1280 wide) in the "Daylight" style: white canvas, Archivo headings, the darker orange for labels, real screenshots of the demo hotel and its control panel with soft shadows, and the logo's three bars as a signature. Their sources are the cropped captures in `statamic/screens/`. To change a slide, replace its capture or edit its text in `scripts/build-marketplace.mjs` and run `node scripts/build-marketplace.mjs` (or `node scripts/build-marketplace.mjs 05` for one slide). The text on each slide comes from the docs, so keep them in step.
- **Control panel icon:** `statamic/cp-nav-icon.svg` is the one-color mark in `currentColor`, so it follows the control panel's navigation colors in light and dark mode. Pass its markup to the navigation item's `icon()`; it reads down to 16 px.
- **Statamic's brand:** don't put the Statamic logo in Resrv's icons or images. The "Statamic Partner" badge (`public/statamic-partner.svg` in the docs) is Statamic's own; use it only as they supply it.

## Website

Copy the files in `favicon/` to the site's root and add:

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:image" content="https://resrv.dev/link-preview-1200x630-light.png">
```

`favicon.svg` and `favicon-16.png` are the simplified 16 px cut; `favicon-32.png` and the 32 and 48 px sizes inside `favicon.ico` are the full mark. The mark works on light and dark browser tabs as it is, so the favicon has no dark-mode variant. `android-chrome-192.png` and `android-chrome-512.png` are for a web app manifest. They keep the mark inside the safe zone, so they also work as maskable icons.

For the docs (VitePress), the header logo takes `logo/svg/resrv-logo-horizontal-color.svg` as `logo-light.svg` and `logo/svg/resrv-logo-horizontal-reversed.svg` as `logo-dark.svg`.

## Social media

| File | Where |
| --- | --- |
| `profile-picture-1080-light.png`, `profile-picture-1080-dark.png` | Profile pictures. The mark stays clear of the circle crop. |
| `link-preview-1200x630-light.png`, `link-preview-1200x630-dark.png` | Link previews (`og:image`) for the website and docs |
| `github-social-preview-1280x640.png` | The GitHub repository's social preview (Settings → Social preview) |
| `x-header-1500x500.png` | X header |
| `linkedin-cover-1128x191.png` | LinkedIn page cover |
| `facebook-cover-1640x624.png` | Facebook page cover |
| `youtube-banner-2560x1440.png` | YouTube banner. The logo sits inside the 1546 × 423 area that every device shows. |

The headers keep the logo centered, clear of the profile picture that overlaps their lower left corner.

## Don't

- Retype the name, change its font, or change the space between the mark and the name.
- Stretch, squash, rotate or crop the logo.
- Change the gradient's colors or direction, reorder or recolor the bars, or use the `color` version on a dark background.
- Add shadows, glows, outlines or extra gradients.
- Place the logo on busy photos without a solid area behind it; use the `white` version on a dark, calm part of the image.
- Put the logo inside another shape, except the app icons and profile pictures in this folder.
- Use the full mark below 24 px; use `favicon/favicon.svg` there.

## Origin

The mark started as "Fix B" in a round of concepts generated with GPT Image 2.6 on Krea in November 2026: a calendar tile with booking bars and a gradient border that keeps it visible on dark backgrounds, where the previous logo's tile disappeared. It was then redrawn by hand as exact geometry on a 120 × 124 grid. Two changes from the concept:

- The binder tabs have a gradient collar all the way round, not just at their base, so they also read on dark backgrounds.
- The bars, the border and the tabs are spaced on whole units, so the one-color versions can be drawn as a single shape with no overlaps.

Every file here is generated by `scripts/build-brand.mjs` in the resrv-docs repository. To change the logo, edit the geometry in that script and run `node scripts/build-brand.mjs` (it needs Playwright's Chromium, ImageMagick and Ghostscript); don't edit the files by hand.
