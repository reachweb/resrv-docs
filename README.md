<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/resrv-logo-horizontal-reversed.svg">
  <img src="public/brand/resrv-logo-horizontal-color.svg" alt="Resrv" height="48">
</picture>

# Resrv docs

The website and documentation for [Resrv](https://github.com/reachweb/statamic-resrv), the booking system add-on for Statamic, at [resrv.dev](https://resrv.dev). Built with [Blume](https://useblume.dev).

## Run it

Node 22.19 or later (`.nvmrc` pins 24).

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run validate  # check links and anchors
```

## Where things are

- `docs/`: the pages, one `.mdx` file each, starting at `docs/(getting-started)/introduction.mdx` (`/introduction`). The `(group)` folders are sidebar groups that add nothing to the URL, so every page sits at a flat route like `/rates` or `/stripe`. Each folder's `meta.ts` sets its title and page order.
- `docs/(support)/`: `index.mdx` is the support page (`/support`, linked from the group's header) and `changelog.mdx` the changelog (`/changelog`).
- `pages/index.astro`: the home page, a product page on Blume's full-width `PageLayout`. It mixes real screenshots of the demo hotel and its control panel (`public/home/`, light and dark versions that follow the site theme) with panels redrawn in HTML. Its wide headings use `public/home/fonts/archivo-wide.woff2`, a Latin subset of Archivo with the width axis. Every claim on it is covered by a docs page: change both together. The demo buttons use `demoUrl` and `demoCpUrl` from `site.ts`, which are placeholders until the demo is online.
- `components.ts` and `components/`: a page footer script that makes the upgrade guide's checklists tickable (Blume renders the boxes disabled).
- `site.ts`: the Marketplace link, price, version, requirements and support address. The docs read them as `{{variables}}` through `blume.config.ts`. Blume replaces variables inside code blocks too, so never name one like an Antlers variable a code example uses (`title`, `url`, ...).
- `blume.config.ts` and `theme.css`: site settings and colours (ink `#171718`; orange `#C4461B` for links on light, the brand orange `#F56B3C` on dark; Archivo for headings).
- `languages/antlers.tmLanguage.json`: the Antlers grammar. `blume.config.ts` registers it twice: with Astro's Shiki config, which highlights the ` ```antlers ` blocks, and in the bundled-language list of the Shiki copy Blume uses, so Blume's check doesn't flag them with `BLUME_UNKNOWN_CODE_LANGUAGE`. The second relies on Blume's internals: if a Blume upgrade brings the warning back, look there first.
- `public/`: favicons, `brand/` (logos and the link preview), `img/` (screenshots) and `statamic-partner.svg`.
- `brand/`: the brand kit and its guide. `node scripts/build-brand.mjs` regenerates it, and `node scripts/build-marketplace.mjs` the Statamic Marketplace images in `brand/statamic/marketplace/` from the captures in `brand/statamic/screens/`.
- `scripts/recapture-*-2x.mjs`: retake the Control Panel screenshots at 2x and overwrite them in `public/img/`. `scripts/UPDATE-SCREENSHOTS-PROMPT.md` explains the workflow. They need Playwright's Chromium (`npx playwright install chromium`).

## Writing

Short and plain: second person, short paragraphs, exact UI labels in **bold**, sentence case and no em dashes. Each fact lives on one page, and the others link to it. Use `:::tip`, `:::info`, `:::warning` and `:::danger` for callouts, and `<Frame caption="...">` around screenshots. Link pages by their route (`/rates`), not by file. When Resrv changes, update the page in the same release, and the version in `site.ts`.

## Deploy

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |

Node comes from `.nvmrc`. The repo holds no host config. resrv.dev answers through Cloudflare with Cloudflare Pages' headers and redirects, so it's most likely a Git-connected Cloudflare Pages project, with these settings in its dashboard. `DOCS_SITE_URL` overrides the site URL (`https://resrv.dev`) that sitemaps, canonical links and link previews use.
