# Prompt: update Control-Panel screenshots to Statamic 6 / Resrv v6

Copy everything below the line into a fresh Claude Code session started in this repo
(`/Volumes/1TB/Sites/resrv-docs`).

---

You are updating outdated documentation screenshots in this Blume docs site so they
reflect the new **Statamic 6 / Resrv v6** Control Panel UI. Three screenshots on the
Availability page were already redone this way — use them and the scripts below as the pattern.

## Environment
- Docs dev server (rendered pages): http://localhost:4321  (start with `npm run dev` if it's down)
- Control Panel (already running, Statamic 6 + Resrv v6): https://resrv-hotel.test/cp/
- The CP site is a **testbed** — you may add/edit availability, reservations, rates, etc. as needed.
  Do NOT permanently alter blueprints or save throwaway config: when a shot needs a temporary
  value (e.g. a field's label), set it, screenshot, and close WITHOUT saving.
- Screenshots are `.webp` under `public/img/`, referenced from the `docs/**/*.mdx` pages as
  `<Frame caption="...">![...](/img/....webp)</Frame>`. **Keep exact filenames** (some contain typos, e.g.
  `resrv-availabilty-field.webp`).

## Tooling
- **Interactive exploration / finding the right CP view & crop:** use the `playwriter` skill
  (drives the user's real Chrome). Good for navigating and figuring out selectors/state.
  NOTE: that browser is `devicePixelRatio: 1`, so its screenshots are only 1x — use it to
  *work out* each shot, not to produce the final image.
- **Final 2x (retina) capture:** use `scripts/cp-browser.mjs` — `launchCP()` opens a
  headed Chromium at `deviceScaleFactor: 2` with a persistent, already-logged-in profile
  (login is reused across runs). Write a small per-page capture script modeled on
  **`scripts/recapture-availability-2x.mjs`**, which:
    1. navigates the CP and reproduces each screenshot's state,
    2. computes a tight crop via `page.evaluate(... getBoundingClientRect ...)`,
    3. `page.screenshot({ clip })` → PNG (2x automatically),
    4. converts to webp with `cwebp -q 92` and overwrites the file in `public/img/`.
  Requires once: `npm i -D playwright && npx playwright install chromium`.
- Viewport width is **1440** for all captures. Crop tightly to the relevant panel/component.

## Method (repeat per page)
1. Pick a target page (see list below). Read its `.mdx` and note every `/img/...webp` image
   and its caption/surrounding text.
2. Open the rendered page (e.g. http://localhost:4321/extras) and look at each current
   screenshot so you know exactly what view + framing to reproduce.
3. Decide, per image, whether it is a **Control-Panel** screenshot that changed in v6.
   Skip front-end/site screenshots and anything already correct. If a v5 feature was removed
   in v6 (some pages note this), flag it instead of inventing a shot.
4. In the CP, reproduce the same view. Match the old framing/values where it makes the doc
   clearer (the Availability modal, for example, reused Available=7 / Price=100).
5. Capture at 2x via a capture script (extend/copy `recapture-availability-2x.mjs`), convert
   to webp, overwrite the existing file (same name).
6. Verify on the dev server: reload the page and confirm each image renders correctly and
   crisply. Report before/after.

## Candidate pages (grep for pages that embed images)
```bash
grep -rlE '\.webp' docs
```
Start with the ones the user cares about (e.g. **extras.md**, **options.md**, **surcharges.md**,
**cutoff.md**, **dynamic-pricing.md**, **rates.md**, **reservations.md**, **checkout.md**,
**configuration.md**), then sweep the rest. Confirm scope with the user if the list is large.

## Guardrails
- Don't dump/exfiltrate session cookies. The 2x auth flow relies on the persistent Chromium
  profile in `scripts/cp-browser.mjs`, which the user logs into once.
- Keep filenames identical. Overwrites are git-tracked, so they're easy to revert
  (`git checkout public/img/<file>`).
- If a screenshot can't be reproduced (feature removed/renamed in v6), stop and tell the user
  rather than guessing.

---

# Work list — Control-Panel screenshots and where to find them

Only Control-Panel screenshots are listed. **Front-end component / external screenshots are
excluded on purpose — the user is redoing those.** Do NOT touch the skipped files at the bottom.

Reference locations used below:
- **Resrv menu** (left sidebar): Reservations `/cp/resrv/reservations`, Reports `/cp/resrv/reports`,
  Calendar `/cp/resrv/reservations/calendar`, Affiliates `/cp/resrv/affiliates`,
  Rates `/cp/resrv/rates`, Extras `/cp/resrv/extras`, Dynamic Pricing `/cp/resrv/dynamicpricing`,
  Export `/cp/resrv/export`, Settings `/cp/addons/statamic-resrv/settings`.
- **Entry field screenshots** live on a Rooms entry's **Booking** tab, e.g.
  `/cp/collections/rooms/entries/garden-view-double` → *Booking* tab (fields: Availability,
  Options, Extras, Cutoff). Blueprint for adding fields: `/cp/fields/blueprints/collections/rooms/room/edit`.
- Some shots need data or a feature toggled on first (noted per item). It's a testbed — create
  sample reservations/affiliates/campaigns and enable features as needed, but don't save
  throwaway blueprint edits.

### availability.md — ✅ already redone
Run `node scripts/recapture-availability-2x.mjs` to (re)generate at 2x. Nothing else needed here.

### extras.md
- `resrv-extras-list.webp` — **Resrv → Extras** (`/cp/resrv/extras`): the Extras list/management page.
- `resrv-extras-assign.webp` — **Resrv → Extras**: open a row's **action/dropdown menu** and show the **Mass assign** option.
- `resrv-extras-field.webp` — Rooms entry → **Booking** tab → the **Resrv Extras** field (shows which extras are available for the entry).
- `resrv-extras-conditions.webp` — **Resrv → Extras** → edit an Extra → the **Conditions** section (show/hide/required rules).

### options.md
- `resrv-options-field.webp` — Rooms entry → **Booking** tab → the **Resrv Options** field.

### cutoff.md
- `resrv-cutoff-field.webp` — Rooms entry → **Booking** tab → the **Resrv Cutoff** field. First enable cutoff globally at **Resrv → Settings → Engine settings** (Enable cutoff rules), and turn on "Enable cutoff" on the field so it shows its settings.

### fixed-pricing.md
- `resrv-fixed-pricing.webp` — the **Resrv Fixed Pricing** field on an entry. This field isn't on the rooms blueprint by default; add a `Resrv Fixed Pricing` field to a blueprint (testbed) so the section appears on an entry, then screenshot it with a few durations filled (e.g. 2d/3d/4d + extra-day price).

### rates.md
- `resrv-rates-list.webp` — **Resrv → Rates** (`/cp/resrv/rates`): collection picker + rate tree.
- `resrv-rates-panel.webp` — **Resrv → Rates** → add/edit a rate → the panel with **General / Pricing / Availability / Restrictions** sections.

### dynamic-pricing.md
- `resrv-dynamic-pricing.webp` — **Resrv → Dynamic Pricing** (`/cp/resrv/dynamicpricing`): the list/section.
- `resrv-dynamic-pricing-off.webp` — **Dynamic Pricing** → add/edit a campaign configured as a fixed % discount for a month (matches caption "10% for August").
- `resrv-dynamic-pricing-lastminute.webp` — **Dynamic Pricing** → add/edit a campaign that only applies to reservations starting in the next 7 days.
- `resrv-dynamic-pricing-applied.webp` — a **reservation details** page showing applied dynamic-pricing campaigns (needs a reservation that triggered one).

### reservations.md
- `resrv-reservations.webp` — **Resrv → Reservations** (`/cp/resrv/reservations`): the list.
- `resrv-reservation-details.webp` — open any reservation → the details page.
- `resrv-reservation-refund.webp` — reservation details → the **refund** action/panel.
- `resrv-reservation-calendar.webp` — **Resrv → Calendar** (`/cp/resrv/reservations/calendar`).
- `resrv-reservation-reports.webp` — **Resrv → Reports** (`/cp/resrv/reports`).
- `resrv-reservations-export.webp` — **Resrv → Export** (`/cp/resrv/export`): the CSV export page.
  (May need at least one reservation to exist for details/refund/calendar/reports/export.)

### affiliates.md  (enable affiliates in config first: Settings → Engine)
- `resrv-affiliates-add.webp` — **Resrv → Affiliates** (`/cp/resrv/affiliates`) → the add-affiliate form.
- `resrv-reservation-affiliate-credit.webp` — a **reservation details** page for a reservation credited to an affiliate (the affiliate/fee block).

### emails.md
- `resrv-emails-global.webp` — **Resrv → Settings → Emails** (`/cp/addons/statamic-resrv/settings`) → the **Global email event settings** grid (add a row so the grid fields show).

### checkout.md  (only the CP one)
- `resrv-checkout-form.webp` — **Forms → Checkout** (`/cp/forms`) → the checkout form's field editor (Statamic **form builder** view). The other checkout images are front-end — skip them.

## Skip (front-end or external — user handles these)
`availability-results.md`: resrv-availability-results-extras · `availability-search-single.md`: resrv-availability-search-single, resrv-availability-search-with-prices · `availability-search-component.md`: resrv-availability-search · `availability-search-multiple.md`: resrv-availability-collection · `cart-booking.md`: resrv-availability-multi-results · `guests.md`: resrv-guests-component · `checkout.md`: resrv-checkout, resrv-checkout-gateway-picker, resrv-checkout-form-frontend · `stripe.md`: resrv-stripe-webhook (external Stripe dashboard).
