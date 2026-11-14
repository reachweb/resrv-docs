# Resrv Changelog

## v6.5.0
#### Release date: 14th November 2026

This release adds manual reservations: bookings you create in the Control Panel and your customers pay through an emailed link, with an optional payment deadline. It also adds a per-rate **Booked units per add-on** setting and fixes payment webhooks on Laravel 13. Custom payment gateways must be updated in the same deploy, so read [Upgrading to v6.5.0](./upgrading#upgrading-to-v6-5-0) before you update.

### New features
- **[Manual reservations](./manual-reservations):** create bookings for your customers straight from the Control Panel with the new **Create reservation** button on the Reservations listing. Pick the entry, dates, rate, quantity, extras and options, fill in the customer with the entry's checkout form, and follow the price in a live **Summary** sidebar. Request the **Checkout amount**, the **Full amount** or a **Custom amount** through one of your payment methods, override the total, credit an affiliate, or **Overbook anyway** when stock runs short. A retried or double-clicked submit never books twice, and a price that changed since it was shown is re-quoted before anything is created.
- **New Awaiting payment status:** a manual reservation that collects a payment is created as **Awaiting payment** (`awaiting_payment`). It holds availability (unless overbooked), isn't expired by **Minutes to hold**, gets no abandoned-reservation emails, isn't cleared by housekeeping, and leaves this status only when it's paid (by the gateway webhook, or with **Mark as paid** for money received outside Resrv) or cancelled. The listing and the reservation page offer **Mark as paid**, **Send payment request**, **Extend hold** and **Cancel reservation**, and the payment link is ready to copy. A booking that collects nothing is confirmed immediately.
- **[Payment page](./payment-page):** the new `reservation-payment` Livewire component is the page customers open from the payment request email. The link is tied to the booking and the customer's email and is rate limited, so customers pay without logging in or re-entering their details. The page shows the amount, any remaining balance, the payment method and, when there's a deadline, the date to pay by. It resumes an interrupted payment instead of starting a second one, and shows your **Offline Payment Instructions** for offline methods. The gateway webhook still confirms the booking.
- **[Payment deadlines](./manual-reservations#payment-deadlines):** hold a manual reservation for 1 to 365 days and it's cancelled automatically if it's still unpaid, releasing its availability. The new `resrv:cancel-lapsed-holds` command does the cancelling and must be [scheduled](./upgrading#_3-schedule-the-lapsed-hold-sweep). A booking also stops accepting payment through its link once its arrival day has ended, and the Control Panel flags overdue bookings.
- **Payment request emails:** a new **Customer payment request** [email event](./emails#manual-reservation-emails), enabled by default and overridable per form. It's sent when you create a reservation (switchable per booking), from **Send payment request**, and optionally from **Extend hold**, with the amount, any deadline, the reservation details and a **Pay now** button, or your payment instructions for offline methods. Lapsed holds email the customer and your admins through the existing **Customer cancelled (no refund)** and **Admin cancelled (by customer)** events.
- **Calendar, reports, activity log and export:** awaiting-payment bookings that took availability appear on the [reservations calendar](./reservations#reservations-calendar) with a dashed style and their deadline in the tooltip. [Reports](./reservations#reports) gain an **Outstanding payments** card that links to the filtered listing. The [activity log](./activity-log) records **Created in the Control Panel** and **Confirmed in the Control Panel**, and **Awaiting payment** can be selected in the [export](./reservations#export).
- **[Booked units per add-on](./rates#booked-units-per-add-on):** a new per-rate field that changes what counts as one unit when pricing [extras](./extras) and [option values](./options). Add-ons are normally multiplied by the booked quantity; set the field to `2` on a single-occupancy rate that books a 2-berth cabin as quantity 2, and a fixed 350 port tax is charged 350 instead of 700. The division rounds up, applies per cabin line in multi-cabin bookings, and leaves the cabin price, the stock and the global **Ignore quantity for prices** switch untouched.
- **Add-ons next to the results price under the booked rate:** Extras and Options rendered inside the availability results now price against the rate the results resolved, even when the search carries no rate, a selected option is re-priced (and re-broadcast) whenever the search changes, a selection restored from the session is re-priced before it is broadcast (whenever the search has dates), and the results component re-prices the selection under the rate it books, including when a rate is booked straight from the all-rates listing. The results component passes the rate to the two components as `effectiveRateId`; customised `availability-results.blade.php` views should pass it too (see [Rates](./rates#booked-units-per-add-on)).

### Improvements
- **Reservations listing:** the status filter now defaults to **Confirmed**, **Partner** and **Awaiting payment**, so bookings waiting for payment show up straight away.
- **Permissions:** the existing **Use Statamic Resrv** permission now also covers creating reservations, marking them as paid, sending payment requests, extending holds and cancelling unpaid reservations.
- **Availability edits:** the error for a blocked count change now names the checkouts in progress. Awaiting-payment holds don't block count changes (if one is later cancelled or lapses, its quantity is added back on top of your value), but they do block deleting the availability they took, and an entry with an awaiting-payment reservation can't be deleted.
- **Clearer refunds of offline payments:** checkout bookings paid through an offline gateway are shown neutrally as **Payment** in the Control Panel instead of **Paid**. Refunding a booking whose money didn't go through an online gateway now says "Refund recorded — return the payment to the customer manually" (or "if the customer paid…"), the reservation page keeps a reminder to return it yourself, and the refund email says the payment "will be returned to you separately".
- **Payment reconciliation alerts:** the orphaned-payment email to admins now also fires when a successful payment lands on a **Cancelled** reservation, for example a hold that lapsed while the customer was paying. The kept charge of a no-refund cancellation doesn't trigger it. Each case, including a booking marked as paid while an online payment also went through, has its own wording and recommended action.
- **Email wording:** confirmation emails show "Amount already paid" instead of "Already paid by credit card" when nothing was charged online, and now show the payment rows whenever less than the total was paid, including under the *Charge the whole amount plus any options and extras* payment type. The customer cancellation email labels its date row "Cancelled on".
- **Control Panel:** reservation dates show their time zone, and status names in filters, badges and the export dialog are translated, readable labels.
- **Updated booking calendar** to [`@reachweb/alpine-calendar`](./frontend-setup) v1.3.0.
- **For developers:** `ReservationConfirmed` gained `VIA_CP` and a `$notifyCustomer` flag. `ReservationCancelled` gained a `$context` (`hold_lapsed`, `unpaid_hold` or `payment_in_flight`) and a `$notifyCustomer` flag, which custom listeners that email customers should honour. The new `payment_unresolved` column marks a `payment_id` kept only for reconciliation, so don't treat `payment_id !== ''` on its own as revenue. Reservation extras gained a `total` pivot column, where manual reservations store the charged line total. Read an extra's line total with `Extra::priceFromPivot()`, which falls back to price × quantity, instead of multiplying the pivot price yourself.

### Bug fixes
- **Payment webhooks on Laravel 13:** the webhook routes are exempt from CSRF protection again. On Laravel 13, payment providers' webhook calls were rejected with a 419 error, so payments never confirmed their reservation. If you worked around this with `preventRequestForgery(except: [...])`, you can remove it after updating.
- **Extras required by a category condition** are now enforced when the checkout is submitted. The extras step already showed extras made required by **Extra in category is selected** or **No extra in category is selected** as required, but checkout didn't check them on submit. A checkout that's missing one is now refused, as it is for the other conditions. Manual reservations enforce them too.
- **Relative rates:** frontend calendar prices on relative rates no longer show `NaN`.
- **Multi-cart checkout:** a stale add-on price saved in the session no longer causes a dead-end "reservation changed" error when checkout loads. Checkout re-prices the session's extras and options against the actual reservation, and the Extras component re-prices on load and when the cart selection changes. If you added workarounds for this or the relative-rate issue, you can remove them after updating.
- **Option value descriptions** are no longer dropped when you save an option in the Control Panel.

### Breaking changes
- **Custom payment gateways:** `paymentIntent()` gained a 4th parameter, `?string $returnUrl = null`, and `retrievePaymentIntent()` is a new required method. A configured gateway without them fails to load, which breaks checkout, webhooks and the Control Panel reservation pages. `verifyPayment()` must also confirm `awaiting_payment` reservations. Update the Mollie or PayPal add-on in the same deploy (see [Upgrading](./upgrading#_1-update-custom-payment-gateways-first)). See the [Custom payment gateway](./custom-payment-gateway) guide.
- **New enum cases:** `ReservationStatus::AWAITING_PAYMENT` and `ReservationEmailEvent::CustomerPaymentRequest`. An exhaustive `match` over either enum throws `UnhandledMatchError` until it handles the new case.

### Upgrading

Run `composer update reachweb/statamic-resrv` and `php artisan migrate`. The new **Booked units per add-on** rate field is empty by default, so nothing changes until a rate sets it.

Manual reservations add three migrations and a few one-off steps. Update custom payment gateways (and the Mollie or PayPal add-on) in the same deploy, schedule `resrv:cancel-lapsed-holds`, set up the [payment page](./payment-page) if you take online payments for manual reservations, use a cache store that supports locks, and merge any customised email templates, checkout views and translations. See [Upgrading to v6.5.0](./upgrading#upgrading-to-v6-5-0) for the full checklist.

## v6.4.0
#### Release date: 10th August 2026

A small release that fixes the `reservation_from_uri` Antlers tag for affiliate bookings and lets you choose which statuses it looks up.

### New features
- **`statuses` parameter on the `reservation_from_uri` tag:** pass a pipe-separated list, for example `statuses="confirmed|partner|refunded"`, to choose which reservation statuses the tag looks up. Without it, the tag finds **Confirmed** and **Partner** bookings. Pending, expired and cancelled reservations are only found when you list them. An unknown status or an empty segment throws an error that says which value is wrong.

### Bug fixes
- **Partner bookings on customer pages:** the tag now finds partner (skip-payment) bookings, so affiliate reservations no longer return a 404 on pages built on it.
- **Themed error pages:** a missing, invalid or unknown reservation link on a page that uses the tag now shows your site's 404 template instead of a bare error page.

### Upgrading

Run `composer update reachweb/statamic-resrv`. There are no migrations. If a page relied on the tag returning only **Confirmed** bookings, add `statuses="confirmed"` to it.

## v6.3.0
#### Release date: 15th July 2026

This release tightens the [affiliate](./affiliates) system and adds quantities to the Reports page.

### Improvements
- **Quantity sold in Reports:** the **Best sellers** panel on the [Reports](./reservations#reports) page gains a **Quantity sold** column, the total quantity booked for each entry, next to its reservation count.
- **Turning affiliates off turns the whole system off:** with **Enable affiliates** off, Resrv no longer sets affiliate cookies, credits reservations or commission to affiliates (from links or coupons), lets affiliates skip payment, or sends affiliate emails. Existing attributions are kept for reporting and refunds.

### Bug fixes
- **Skipping payment is limited to affiliate links:** a coupon tied to an affiliate still credits the reservation to that affiliate, but it no longer shows the option to skip payment at checkout. Only customers who arrived through the affiliate's link can skip payment, because a coupon code can be shared publicly.
- **Unpublished affiliates:** a coupon tied to an unpublished affiliate still applies its discount, but no longer credits the affiliate with a commission.
- **Partner reservations** in the Control Panel now say "No payment collected (partner reservation)" instead of showing a payment amount that was never charged.

### Upgrading

Run `composer update reachweb/statamic-resrv` and `php artisan migrate`. The new migration adds a `source` column to `resrv_reservation_affiliate` that records whether each attribution came from the affiliate's link or from a coupon. Existing rows are marked as link attributions, so they keep the behaviour they had.

## v6.2.1
#### Release date: 12th July 2026

### Bug fixes
- **Custom Control Panel route:** Resrv's Control Panel screens now respect a custom `CP_ROUTE`. Their requests always went to `/cp` before, so on sites with a different Control Panel path, Resrv screens couldn't load or save their data.

## v6.2.0
#### Release date: 12th July 2026

This release adds a customer facing reservation status page with self service cancellations, a new terminal `cancelled` reservation status.

### New features
- **[Reservation status page](./reservation-status):** a new `reservation-status` Livewire component where customers look up their booking with the email and reference they booked with, or land on it directly through a secure "Manage your booking" link that is added to confirmation emails automatically. The feature is off by default; enable it under **Resrv → Settings → Checkout**.
- **[Customer cancellations](./reservation-status#cancelling-a-reservation):** let customers cancel their own booking from the status page. Inside the free cancellation window the charge is refunded automatically through the original payment gateway. After the window closes, or under a non-refundable policy, the customer can still cancel after a clear "no refund" warning and the payment stays with you. Bookings paid through offline gateways and partner bookings stay view only.
- **New `cancelled` reservation status:** `refunded` now strictly means the gateway returned the charge. Terminations where no money moves back (no-refund cancellations and voids of bookings that never held a charge) land in the new terminal `cancelled` status.

### Improvements
- **Reports:** cancelled bookings that kept their payment now count toward reservation totals, revenue, best sellers and [affiliate](./affiliates) commissions. Refunds and no-charge voids stay excluded.
- **Affiliate commissions follow the money:** refunding a reservation voids its commission while keeping the row for history, and a no-refund cancellation keeps the commission payable. Commissions of reservations refunded before this release are backfilled on migrate.
- **Safer refunds:** when a reservation's recorded [payment gateway](./payment-gateways) is no longer configured, refunding it fails with a clear "handle manually" error instead of silently routing the charge through the current default gateway. Stripe refunds also reconcile charges that were already refunded from the Stripe dashboard instead of erroring.
- **Lookup hardening:** reservation lookups are rate limited per reference and per IP, and failed deep links fall back to the form with a neutral notice.

### Breaking changes
- **Custom payment gateways:** `PaymentInterface` gained `supportsAutomaticRefunds(): bool`. Return `true` only if your gateway's `refund()` returns the money through the provider's API, and `false` for gateways that collect payment outside it, such as bank transfer. A configured gateway without the method fails to load. See [Refunds](./custom-payment-gateway#refunds).

### Upgrading

If you wrote a custom payment gateway, add `supportsAutomaticRefunds()` to it first. Then run `composer update reachweb/statamic-resrv` and `php artisan migrate`. Both new toggles are off by default, so nothing changes until you enable them. If your site code matches on the `refunded` status string, account for `cancelled` too, and note that Reports now include no-refund cancellations in their totals.

## v6.1.0
#### Release date: 3rd July 2026

A maintenance release on top of v6.0.0: new reporting and email tools, a database housekeeping command, and a broad round of fixes across availability, rates, emails and the frontend calendar. Upgrading is straightforward — see [Upgrading from v6.0.0 to v6.1.0](./upgrading#upgrading-from-v6-0-0-to-v6-1-0).

### New features
- **Database housekeeping command:** the new `resrv:housekeeping` command clears data that used to accumulate forever — long-expired reservations (and their related rows), orphaned customer details, and availability for dates that have already passed. Use `--days` (default 30) to set the retention window and `--dry-run` to preview. It doesn't run on its own; [schedule it](./upgrading#upgrading-from-v6-0-0-to-v6-1-0) to keep your database tidy.
- **Affiliate & dynamic-pricing reports:** the Reports page gains an **Affiliates** section (reservations, sales and commission per [affiliate](./affiliates)) and a **Dynamic pricing** section (how often each [rule](./dynamic-pricing) was applied). Both keep showing rows for affiliates or rules that have since been deleted.
- **Resend confirmation email:** a new action on the reservations listing resends the customer's [confirmation email](./emails) on demand — even if confirmation emails are disabled or routed to admins.
- **[Activity log](./activity-log):** an optional audit trail (off by default; enable it under **Reservation settings → Enable activity log**) that records every availability and price change — per date and rate, with the reason (checkout hold, expiry, cancellation, refund, Control Panel edit or delete, stuck-pending cleanup, data import) — and every reservation status change (checkout started, confirmed at checkout or by webhook, cancelled, expired, refunded). A new **Activity Log** screen in the Control Panel lets you browse and filter both. Prune old rows with the new `--log-days` option (default 365) on the [`resrv:housekeeping`](./activity-log#retention) command.
- **Deep-linkable search:** the availability search can now be pre-filled straight from [URL query parameters](./availability-search-component#setting-the-search-via-url-parameters) — `?date=YYYY-MM-DD` (checkout date derived from your minimum stay), `?date_start=…&date_end=…` and `?rate=<id>` (or `?rate=any`). Link or bookmark a ready-to-run search; invalid values are ignored, and it works with multiple search bars on a page (including redirect-style bars).

### Improvements
- **Self-healing rate selections:** stale or out-of-context [rate](./rates) selections carried over in the search session are now reconciled automatically. Every availability component (search, list, results, multi-results and collection) drops a rate that doesn't apply to it and auto-selects when only one valid rate exists. This replaces the old `resetOnBoot` attribute, which has been **removed** — see [Upgrading](./upgrading#upgrading-from-v6-0-0-to-v6-1-0).
- **Clearer rates in the availability calendar:** relative and shared rates are now labelled as such, read-only cells show a lock icon and explanation, the base rate is pulled in automatically when editing a shared rate, and dates still missing a price are flagged "Price required".
- **Smarter bulk availability editing:** the bulk-edit modal disables fields that don't apply to the selected rates (and says why), applies each value only to the rates that accept it, and saves multi-rate edits atomically so a single rejected rate never leaves a half-applied change.
- **Reports survive deletions:** deleting an affiliate now soft-deletes it, preserving its sales history, and affiliate and dynamic-pricing report rows remain (marked as deleted) after the affiliate or rule is gone.
- **Faster dynamic pricing screen:** entry and extra assignments load in a single batched query, so the listing stays fast as the number of rules grows.
- **Updated booking calendar** to [`@reachweb/alpine-calendar`](./frontend-setup) v1.2.0, with more reliable timezone-aware date handling.

### Bug fixes
- **Duplicating a Statamic entry** no longer copies the original's availability: each duplicate starts with its own clean slate and shows its own dates and prices.
- **Translated entries** now resolve their availability and pricing back to the root entry consistently, even across chained translations.
- **Date picker timezone:** visitors whose browser timezone is ahead of the server no longer see their selected check-in / check-out dates shift a day earlier.
- **Frontend calendar conflicts:** the frontend script bundle no longer leaks onto the global scope, fixing an "L is not a function" error that could break the date picker on pages that also load Leaflet (or similar) libraries.
- **Pending reservations:** abandoned, past-window holds no longer block availability edits, and saving or deleting availability in the Control Panel no longer expires valid in-progress checkouts or confirmed bookings.
- **Confirmed bookings no longer block availability edits:** you can now change the price and count for dates that already have confirmed or partner bookings — only in-progress checkouts still hold back a count change (they can still release stock when they expire). Deleting availability is still blocked while any active booking overlaps those dates.
- **Dynamic pricing rules** show their assigned entries again instead of "Unknown entry", including entries that don't have availability set up yet.
- **Refund emails** now show the actual amount charged to the card (including any payment surcharge) and no longer claim a refund for bookings that were never charged.
- **Reservation emails** (confirmation, made and abandoned) no longer error when the booked entry or a selected option has since been deleted — the email still sends and keeps the originally booked details.
- **Email theme:** a partially-published or empty email theme folder no longer drops the logo header; the packaged theme is always used as a fallback.
- **Bulk rate updates:** updating several rates at once, or with invalid dates or day-of-week filters, returns a clear validation message instead of a 500 error.
- **Empty listings:** a rate assigned only to a disabled entry no longer leaves a collection listing empty.
- **Deleting an extra** now also removes its entry assignments instead of leaving orphaned rows behind.
- **Control Panel polish:** the duplicate "Use Resrv" permission is gone, dark-mode badges keep their shape and contrast, the Refund action icon renders correctly, and informational alerts on the Resrv fields show their proper titles and styling.

### Upgrading

This is a minor release; for most sites `composer update reachweb/statamic-resrv` is all you need. If any of your templates pass `:resetOnBoot` to the availability-search component, **remove it** — the attribute no longer exists. See [Upgrading from v6.0.0 to v6.1.0](./upgrading#upgrading-from-v6-0-0-to-v6-1-0) for the full (short) checklist.

## v6.0.0
#### Release date: 6th June 2026

### This is a major release with breaking changes. Please read the [Upgrade Guide](./upgrading) and back up your database before upgrading.

Resrv v6 brings the add-on to Statamic 6, introduces the new Rates system, adds multiple payment gateways, and rebuilds the Control Panel.

### Requirements
- PHP 8.4+
- Laravel 12 or 13
- Statamic 6
- Livewire 3.6.4+ or 4

### New features
- **[Rates](./rates):** a new collection-scoped rate system that replaces the old per-entry "advanced availability" and "connected availabilities". Rates support independent or relative pricing, independent or shared inventory, date and stay restrictions, per-rate cancellation policies, and selective entry assignment.
- **[Multiple payment gateways](./payment-gateways):** offer several payment methods at checkout with a gateway picker, a built-in offline (bank transfer / pay-at-premises) gateway, per-gateway surcharges and amount limits, and per-gateway webhooks. A documented interface lets you [build your own gateway](./custom-payment-gateway).
- **New frontend components:** [`availability-collection`](./availability-search-multiple#the-availability-collection-component) (a live, no-extra-package list of available entries for a whole collection), [`availability-multi-results`](./cart-booking) (cart-based multi-rate / multi-date booking), and [`availability-list`](./availability-list) (a list of upcoming available dates).
- **[Settings in the Control Panel](./configuration):** business, reservation, checkout, email and currency settings now live under Resrv → Settings. `config/resrv-config.php` keeps developer-only keys. The `php please resrv:settings:migrate` command migrates legacy values, including the old nested checkout-form and email overrides, into the Control Panel.
- **[Email customization](./emails):** configure recipients, subject, from address and template per event and per checkout form, plus opt-in abandoned-reservation recovery emails. The Logo field now renders in emails automatically.
- **Per-rate [cancellation policies](./rates#cancellation-policy):** set a free-cancellation window or mark a rate as non-refundable; the policy is shown to the customer and snapshotted onto the reservation.
- **[CSV export](./reservations#export):** export reservations filtered by date range, status and columns, with custom checkout fields included.
- **Reports** can now run against the booking-creation date as well as the reservation date.
- **Minimum and maximum [dynamic pricing](./dynamic-pricing) rules:** clamp the final price to a floor or ceiling, applied after all other rules and coupons (and to extras).
- The frontend calendar moved to [`@reachweb/alpine-calendar`](./frontend-setup) and the Control Panel was rebuilt on Statamic 6 (Vue 3 + Inertia + Tailwind v4).

### Breaking changes
- Platform floor raised to PHP 8.4 / Laravel 12 or 13 / Statamic 6 / Livewire 3.6.4+.
- The `property` column, `advanced_availability` and `connected_availabilities` are removed and replaced by Rates. Run `php artisan resrv:upgrade-to-rates` after migrating.
- Custom payment gateways must implement five new `PaymentInterface` methods.
- CP-managed settings move out of `config/resrv-config.php` into the Control Panel.
- Published frontend views (e.g. `availability-advanced` → `availability-rates`), language overrides and the calendar's CSS variables changed.

### Upgrading

Follow the full [Upgrade Guide](./upgrading). In short: back up your database, bump your requirements and run `composer update`, run `php artisan migrate`, run `php please resrv:settings:migrate` and `php artisan resrv:upgrade-to-rates`, then update any published views, language files and custom payment gateways.

## v5.0.0
#### Release date: 5th Dec 2025

### This release contains breaking changes please read follow the release notes to upgrade existing Resrv installations.

### New features
- Totally rewritten Extras and Options functionality. Instead of using Blade components this functionality has now been moved into their own Livewire components. This minimizes use of JavaScript in the frontend and results in faster and more secure functionality.
- Added a new "days of the week" setting in the Mass Availability modal that allows you to only apply the changes in specific days of the selected range.
- Added a new `availability-results-advanced` Blade component that you can use to display all the possible advanced properties and their availability / pricing.
- Added a new `Cutoff` field that allows you to set a specific start time and schedule for each entry and set a cutoff time in hours after which reservations are no longer possible.
- Added more robust **connected availabilities** rules.
- Changed the `$resetAdvancedOnBoot` property of `AvailabilitySearch` to `$resetOnBoot` and it now also resets the quantity and triggers a search.
- Moved the customer data into a separate Customer model and database table. This will help us create account functionality in the future.
- Moved the availability calendar into a popup in order to provide much better mobile support.
- Removed the need for the Resrv Availability field to have the "resrv_availability" handle in the Statamic blueprints.
- Added a "when extra is NOT selected" condition rule to show / hide / require an extra if another extra is NOT selected.
- Added extra category conditions to show / hide / require extras based on categories.
- Added support for wildcard coupons using `*` to apply coupons to all entries.
- Added affiliate - coupon relationship to connect affiliates with coupons.
- Added the ability to close the calendar popup with the Esc key.
- Added support for multiple webhook secrets in the payment gateway configuration.
- The payment gateway now passes the public key through for easier frontend configuration.
- Email templates now use the configured logo.
- Made the calendar input readonly to prevent manual text input.
- Use override label in emails and frontend if set.

### Bug fixes
- Fixed some countries not appearing in the phone codes field of the checkout form.
- Fixed some issues with reservations made on the current day for the same day.
- Fixed an issue where coupons wouldn't update the total if applied after step 1.
- Fixed affiliate removal when coupon is removed.
- Fixed wildcard coupons on update event.
- Fixed Resrv tag getting schedule for wrong entry.
- Fixed reverse condition for extras.
- Fixed wrong email getter.
- Fixed refund emails being sent multiple times.
- Various other fixes you can find in GitHub.

### Upgrading

- **Make a backup of your database.**
- **Migrate your database by running `php artisan migrate`**
- The *resrv_customers* table should now have your customer data. This should be handled automatically by the migration but please check your database afterwards.
- There are **major changes** in Resrv's frontend views: if you were overriding those you need to manually upgrade the following views:
    - `checkout.blade.php` - needs to be upgraded to use the new Extras and Options components. Check the file in this release to check what needs to be changed.
    - `availability-results.blade.php` - also needs to be upgraded to use the new Extras and Options component - **even if you had not enabled them here**.
    - Also in `availability-results.blade.php` you need to add the section for displaying the cutoff feature error if you use it.
    - `checkout-extras.blade.php` and `checkout-extra.blade.php` - These have been completely replaced by `extras.blade.php` and `extra.blade.php`
    - `checkout-options.blade.php` and `checkout-option.blade.php` - These have been completely replaced by `options.blade.php` and `option.blade.php`
    - If you were using `availability-extras.blade.php` or `availability-options.blade.php` they also need to be upgraded.
    - `checkout-payment-table.blade.php` needs to be upgraded to use the new Extras and Options objects. Also check the changes in this release.
- You also need to update your **email templates** (again if you were overriding those). We have tried to respect backwards compatibility here but changing the following in all email templates is best practice:
    - Any mention of `$reservation->customer->get('email)` should now be `$reservation->customer->email`.
    - Replace `$reservation->customer->count() > 1` with `$reservation->has('customer')`
    - Replace `@foreach ($reservation->customer as $field => $value)` with `@foreach ($reservation->customerData as $field => $value)`.

## v4.1.0
#### Release date: 18th Mar 2025
- Laravel 12 support
- Added a fix for the new country code dictionary so that it can be used in regular Statamic forms and pass the value to the email template correctly.
- Cleanup of unused database columns and tables.

## v4.0.1
#### Release date: 1st Mar 2025
- Fix issues with diffInDays method changing in Carbon v3.

## v4.0.0
#### Release date: 28th Feb 2025

- New frontend calendar based on [Vanilla Calendar Pro](https://vanilla-calendar.pro/).
    - Added the capability to display price and availability per day inside the calendar itself.
    - The calendar now respects minimum and maximum durations and doesn't allow the user to select an unsupported range.
- New extra categories feature: your extras can now belong to categories.
- Extras are now using the `Entry` model to associate themselves with Entries.
- Extras are no longer editable inside an Entry using the `resrv_extras` field.
- Full conditional extras support (Show / hide or require extras based on conditions).
- New phone dictionary (both frontend and backend) for the checkout form that displays country phone code select box plus a text input for the phone number.
- Added a `resrv:import-entries` command that can be used to sync the site's Entries to Resrv's database.
- Improved extension's config display in the control panel and various panels.
- Upgraded the Stripe library to the latest version.
- Various small bug fixes.

### Upgrading

- **Make a backup of your database.**
- **Migrate your database by running `php artisan migrate`**
- The *resrv_statamicentry_extra* table is being replaced by the *resrv_entry_extra* table. This should be handled automatically by the migration but please check your database afterwards.
- There are major changes in Resrv's frontend views: if you were overriding those you need to manually upgrade the availability-search.blade.php, checkout-extras.blade.php, checkout-extra.blade.php files (and possibly more like the dictionary fields).

## v3.2.0
#### Release date: 1st Oct 2024

- Removed all the legacy API endpoints, controllers and more.
- Added more tests to cover scenarios that were tested from the API endpoints.
- Fix an issue that when a date range would contain the date that Daylight saving starts, the duration would be a day less.

## v3.1.0
#### Release date: 18th Sept 2024

- NEW Added support for Dictionaries in your checkout forms so that you can easily add selects with many options, like Countries.
- NEW New AlpineJS component for dictionaries, with filtering.
- FIX The select field was not working on checkout forms due to some changes from Statamic's side.
- FIX Calendar and Reports will now show and take into account accordingly partner reservations. (made via the affiliate system).

### Upgrading
Please note that if you have already overridden the Resrv views you will need to copy the file dictionary.blade.php from views/livewire/component/fields to your views/vendor/statamic-resrv folder.

## v3.0.1
#### Release date: 9th Sept 2024

- Fixed an issue when at the first save of an Entry that had a Resrv Availability field as "disabled" the value would not get saved thus making the Entry available to reserve.
- Fixed two issues with Fixed pricing.
- Updated the documentation URL and added the logo.

## v3.0.0
#### Release date: 3rd Sept 2024

- Disabled legacy endpoints be default.
- Removed support for Statamic 4.
- Fixed some icons in dark mode.
- Small fixes in Livewire components.
- Improved the LfAvailabilityFilter component so that it requires less properties.
- Added the live-availability data in the entries when using the regular Collection tag via a Hook.

