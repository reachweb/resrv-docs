# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: Statamic developers and agencies** building sites for clients that take bookings. They come to resrv.dev to judge whether Resrv fits a client project, try the demo, buy the license on the Statamic Marketplace, and then build with the docs: install the add-on, add fields to collections and blueprints, drop Livewire components into Antlers or Blade templates, and set up payment gateways. They know Statamic, Laravel and Livewire, and they read the docs while coding.

**Secondary: the businesses they build for**, such as hotels, rentals, restaurants, tours, spas and event organisers. They run availability, prices and reservations in the Statamic control panel, but rarely read this site.

## Product Purpose

Resrv is a reservation engine add-on for Statamic, built with Laravel. It adds availability, rates, extras, options, checkout and payments to a Statamic site, so a business takes bookings on its own website and manages them in the control panel.

resrv.dev is both the product's home page and its documentation. It has to show a developer that Resrv fits their project, get them to the demo and the Marketplace, and then get them to a working booking flow. Success means a developer picks Resrv for a client site, licenses it before going live, and ships from the docs without needing to ask for help.

## Positioning

**Lead claim: any Statamic entry becomes bookable.** Resrv builds on Statamic's own entries, blueprints, forms and control panel instead of sitting beside them. Add the Resrv Availability field to a collection, and each entry gets its own availability and prices. It is content-agnostic, so one site can rent rooms from one collection and cars from another, and the same engine serves hotels, restaurants, tours, spas, rentals and events.

Supporting claims, which are true but come after the lead:

- Bookings happen on the business's own site for a one-time license, with no commission per booking and no monthly subscription.
- Developers keep control of the frontend: Livewire components, publishable Blade views, Tailwind and CSS variables, and custom payment gateways.

## Operating Context

- **Two parts, one site.** The home page (`pages/index.astro`) is the product page. The docs (`docs/`) are about 40 MDX pages in sidebar groups (Getting started, Backend, Frontend, Configuration, Support), with the changelog at `/changelog` and Support & Pricing at `/support`.
- **How developers use it.** They evaluate in the browser, often next to the Statamic Marketplace listing, then come back while building: they copy code blocks (Antlers, Blade, PHP, shell), follow numbered steps, and match the exact control panel labels.
- **Buying.** The purchase happens on the Statamic Marketplace, not on resrv.dev. Resrv is free during development and needs a license before going live.
- **Demo.** The Resrv Hotel sells rooms, spa treatments and restaurant tables through one checkout, and its control panel shows its own demo login. It isn't public yet: `demoUrl` and `demoCpUrl` in `site.ts` are placeholders.
- **Support.** GitHub issues and email, with replies usually within a day or two. Paid support is available for custom work, and the add-on is provided as-is.
- **Releases.** When Resrv changes, the affected docs page and the version in `site.ts` change in the same release.

## Capabilities and Constraints

**Product capabilities** (each has a docs page): per-day availability and prices per entry; rates (room types and pricing tiers, relative pricing, shared inventory); fixed pricing by rental length; extras and options; booking cutoff times; cart and multi-rate booking; a checkout form built with Statamic's forms; Stripe and an offline (bank transfer) gateway built in, Mollie as an add-on, and custom gateways; dynamic pricing and coupons; affiliates; manual reservations with payment links (new in 6.5); the reservations list, calendar, reports, CSV export and activity log; editable emails; frontend translations for multisite; and a reservation status page where guests look up and cancel bookings.

**Requirements and version** live in `site.ts` and change there: Resrv 6.5.1 needs PHP 8.4+, Laravel 12 or 13, Statamic 6 and Livewire 3.6.4+ or 4.

**Site constraints:**

- A static site built with Blume (Astro-based) and deployed on Cloudflare Pages. Docs pages render in Blume's own layout and are styled through `blume.config.ts` and `theme.css`. The home page is a custom Astro page on Blume's full-width `PageLayout`.
- Shared facts (price, license, version, requirements, URLs) come from `site.ts` and reach the docs as `{{variables}}`. Never hardcode them. Blume also replaces variables inside code blocks, so a variable must never share a name with an Antlers variable used in an example.
- Every claim on the home page is covered by a docs page and links to it. Change both together.
- Light and dark themes both ship, following the system setting. Control panel screenshots have a light and a dark version.

**Terminology:** the product is "Resrv" in text (RESRV appears only in the logo's wordmark). Use Statamic's terms (entries, collections, blueprints, control panel) and Resrv's own (Availability field, rates, extras, options, dynamic pricing, affiliates, manual reservations), with exact UI labels in **bold**.

**Undecided:** the public demo URLs, and the CMYK and Pantone values for print.

## Brand Commitments

- **The brand kit in `brand/` is binding**, and its guide `brand/README.md` covers the logo versions and colors, clear space, minimum sizes, the brand colors and the brand face, plus the don'ts. Follow the guide instead of restating it. Never retype or rebuild the logo: every file comes from `scripts/build-brand.mjs`.
- **The control panel keeps Statamic's look.** Resrv's CP pages use Statamic's UI components and fonts, never the brand face or colors.
- **Statamic's marks stay Statamic's.** Don't put the Statamic logo into Resrv's icons or images. The Statamic Partner badge (`public/statamic-partner.svg`) is used only as Statamic supplies it.
- **Voice** (from `README.md`, Writing): short and plain, second person, short paragraphs, exact UI labels in bold, sentence case, no em dashes. Each fact lives on one page, and the others link to it. Product pages speak to the developer as "you". The Support page speaks in the first person as Iosif, Reach's founder.
- **Maker:** Reach Web Agency in Kos, Greece, a Statamic Certified Partner. Reach also makes the Easy Forms and Livewire Filters add-ons.

## Evidence on Hand

- **Track record**, confirmed by the owner in November 2026 and shown on the live site: in production for 4 years (the live site still says "3+ years"), thousands of bookings processed, millions in revenue generated, and hundreds of automated tests. Keep these at this precision and never turn them into exact figures.
- **Real product imagery** from the Resrv Hotel demo and its control panel: `public/home/` (home page, light and dark), `public/img/` (docs), and `brand/statamic/screens/` and `brand/statamic/marketplace/` (Marketplace images). `scripts/recapture-*-2x.mjs` retakes the CP captures.
- **Statamic Partner badge** at `public/statamic-partner.svg`, linked to `partnerUrl`.
- **Changelog** at `docs/(support)/changelog.mdx`, 16 releases up to v6.5.1 (14 November 2026).
- **Client sites** run Resrv and are listed in Reach's portfolio at reach.gr. Don't name, link or show them on resrv.dev.
- **Absent, never invent:** testimonials or named customer quotes, customer logos, install or download counts, and a public demo.

## Product Principles

1. **Native to Statamic first.** Explain and show Resrv in Statamic's own terms, leading with "any entry becomes bookable".
2. **Every claim has a docs page behind it.** Marketing copy says only what the docs cover and links to the page.
3. **Show the real product.** Use real screenshots and the demo's own names and numbers. Proof is the confirmed track record, nothing more.
4. **Write for a developer at work.** Plain, exact and second person, with each fact in one place. The docs exist to get a booking flow shipped.
5. **One source for shared facts.** Price, version, requirements and URLs come from `site.ts`.

## Accessibility & Inclusion

No formal standard is declared. Current practice, from the code: the light theme darkens the link orange to `#c4461b` so text on white meets WCAG AA contrast (4.9:1), and the brand orange is used for text only on dark backgrounds. Screenshots carry descriptive alt text, and both light and dark themes are supported. Treat AA contrast as the working floor.
