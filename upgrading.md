---
outline: [2, 3]
---

# Upgrading to v6

Find the section that starts at your version, then work through it and every section after it. `composer update` installs the latest release in one go, so read all the sections that apply before you run it.

1. [Upgrading from v5 to v6](#upgrading-from-v5-to-v6): new requirements, destructive rate migrations, settings and custom code.
2. [Upgrading from v6.0.0 to v6.1.0](#upgrading-from-v6-0-0-to-v6-1-0): one removed attribute.
3. [Upgrading from v6.1.0 to v6.4.0](#upgrading-from-v6-1-0-to-v6-4-0): a new gateway method, a new status and a changed tag default.
4. [Upgrading to v6.5.0](#upgrading-to-v6-5-0): manual reservations, gateway interface changes and a scheduled command.

Each section ends with a checklist for confirming the upgrade worked.

::: tip USING A CODING AGENT?
Point your agent (Claude Code, Cursor, etc.) at this page with a prompt like this:

> Upgrade Resrv to the latest version by following https://resrv.dev/upgrading. Check which version I'm on and work through every section that applies, in order. Before anything else, confirm that I have a full database backup. Show me the output of each `--dry-run` before running the real command, update my custom PHP, published templates and language overrides, and ask me when something is unclear. Finish by going through each section's checklist.

Review its changes and the migration output yourself, especially around the destructive steps.
:::

## Upgrading from v5 to v6

v6 replaces the old "advanced" and "connected" availability with collection-scoped [Rates](./rates), adds [multiple payment gateways](./payment-gateways) and moves most settings from the config file to the Control Panel.

::: danger BACK UP YOUR DATABASE FIRST
The rate migrations remove the `property` column and drop the `resrv_advanced_availabilities` table. There is no automatic rollback, so take a full database backup before you run any migrations.
:::

### 1. Bump your requirements

| Requirement | v5 | v6 |
|---|---|---|
| PHP | 8.1 / 8.2 | **8.4+** |
| Laravel | 10 / 11 | **12 or 13** |
| Statamic | 5 | **6** |
| Livewire | 3 | **3.6.4+ or 4** |

Upgrade your project to Statamic 6 and Laravel 12 or 13 *before* you upgrade Resrv. Then update the package:

```bash
composer update reachweb/statamic-resrv
```

#### Laravel 13: keep `php` session serialization

Laravel 13 changed the default session serialization in `config/session.php` from `php` to `json`. Resrv's availability search keeps its `AvailabilityData` form object in the session with Livewire's `#[Session('resrv-search')]` attribute, and JSON turns that object into a plain array. The next request then throws:

```
Cannot assign array to property ... of type AvailabilityData
```

Set it back to `php` in `config/session.php`:

```php
'serialization' => 'php',
```

The Resrv starter kit already ships with this setting. It works around a Livewire limitation, so keep it until Livewire fixes it.

### 2. Run the migrations

```bash
php artisan migrate
```

Watch the four **rate migrations**. They run in this order:

1. Create the `resrv_rates` and `resrv_rate_entries` tables.
2. Add a nullable `rate_id` column to `resrv_availabilities`, `resrv_reservations`, `resrv_child_reservations` and `resrv_fixed_pricing`.
3. **Data migration**: group existing availability by collection, create a rate per unique property (or a `default` rate for standard availability) and backfill `rate_id` on every row.
4. **Finalize**: delete orphaned rows with no `rate_id` (logged as warnings), drop the `property` column and the `resrv_advanced_availabilities` table, make `rate_id` required and add the new unique constraints.

::: warning DESTRUCTIVE STEP
Steps 3 and 4 rewrite data and drop columns. Read the migration output for warnings about deleted orphaned records.
:::

The other new v6 tables and columns need no special handling.

### 3. Migrate your settings

Most settings now live in the Control Panel under **Resrv → Settings** and are saved to `resources/addons/statamic-resrv.yaml`. The published `config/resrv-config.php` is now for developers only and holds just `payment_gateway`, `payment_gateways` and the `stripe_*` keys.

`composer update` already copied your old values across. A Statamic update script runs when you cross into 6.0.0 and prints a short report. Run the command yourself to preview the result, or to re-run it if `composer update` ran with `--no-scripts` or you edited `config/resrv-config.php` afterwards:

```bash
php please resrv:settings:migrate --dry-run   # preview, saves nothing
php please resrv:settings:migrate             # run or re-run
```

It never overwrites a value already set in the Control Panel. The report lists the values it seeded (including the old nested `checkout_forms` and `reservation_emails`), conflicts where the Control Panel value stays active, keys that are safe to delete, stale keys such as `enable_advanced_availability`, and the developer keys to keep.

While `config/resrv-config.php` still defines keys the Control Panel manages, the settings page shows a **"⚠ Published config file detected"** warning. Delete those keys, keeping only the developer keys, to clear it.

See [Configuration](./configuration) for every setting.

### 4. Move from advanced/connected availability to Rates

v5's per-entry "advanced availability" (the `property` column) and "connected availabilities" are **removed** and replaced by [Rates](./rates).

The migrations in step 2 created a rate for each old property, plus a `default` rate for standard availability. The `resrv:upgrade-to-rates` command gives those rates titles. It doesn't run automatically:

```bash
php please resrv:upgrade-to-rates --dry-run   # preview
php please resrv:upgrade-to-rates
```

In standard collections, it renames the `default` rate to **"Standard Rate"**. In collections with properties, it titles each rate from the `advanced_availability` labels in your blueprint, so `{"non-refundable":"Non Refundable"}` gives the `non-refundable` rate the title "Non Refundable". It warns about connected availabilities but doesn't migrate them.

Then open **Resrv → Rates** and check the rates and titles in each collection.

#### Replacing connected availabilities

The `AvailabilityChanged` event and the `UpdateConnectedAvailabilities` listener are gone too. If you used connected availabilities to sync inventory across entries, either:

1. Merge the connected entries into one entry with several rates. We recommend this, since rates with shared availability draw from one inventory pool.
2. Write your own sync in listeners for `ReservationCreated` and `ReservationCancelled`:

```php
use Reach\StatamicResrv\Events\ReservationCreated;
use Reach\StatamicResrv\Events\ReservationCancelled;

Event::listen(ReservationCreated::class, function ($event) {
    // Your custom availability sync logic.
});

Event::listen(ReservationCancelled::class, function ($event) {
    // Your custom reverse-sync logic.
});
```

#### Custom code changes

In custom PHP, replace property references with rate references:

```php
// Old
$reservation->property;
$reservation->getPropertyAttributeLabel();
$availability->property;

// New
$reservation->rate_id;
$reservation->rate;          // Rate model relationship
$reservation->getRateLabel(); // Human-readable label
$availability->rate_id;
```

Useful rate lookups:

```php
use Reach\StatamicResrv\Models\Rate;

Rate::forEntry($statamicId)->get();        // rates available to an entry
Rate::forCollection('rooms')->get();       // all rates in a collection
Rate::findOrCreateDefaultForEntry($id);    // ensure a default rate exists
```

Availability request arrays now use an integer `rate_id` instead of the `advanced` property string:

```php
// Old
['date_start' => '2026-04-01', 'date_end' => '2026-04-05', 'quantity' => 1, 'advanced' => 'double-room'];

// New
['date_start' => '2026-04-01', 'date_end' => '2026-04-05', 'quantity' => 1, 'rate_id' => 3];
```

The `NoAdvancedAvailabilitySet` exception is gone, so remove any `catch` blocks for it.

The old `advanced_availability` and `connected_availabilities` blueprint fields no longer do anything. Remove them once you've checked the migration.

### 5. Update custom payment gateways

A custom gateway that implements `PaymentInterface` fails to load until it has these five new methods. Resrv loads every configured gateway class, so one outdated gateway breaks checkout, webhooks and the Control Panel reservation pages.

| Method | Role |
|---|---|
| `name(): string` | Machine slug, lowercase with no spaces, such as `paypal`. |
| `label(): string` | Default label in the checkout gateway picker. |
| `paymentView(): string` | Blade view for the inline payment UI. Redirect gateways return the default view, which never renders. |
| `supportsManualConfirmation(): bool` | `true` only for offline gateways that no provider verifies, `false` for provider-backed ones. |
| `cancelPaymentIntent(string $paymentId, Reservation $reservation): void` | Voids an abandoned provider-side intent. |

Because `composer update` installs the latest release, make the later interface changes before you deploy too: `supportsAutomaticRefunds()` from [v6.2.0](#v6-2-0) and the [v6.5.0 changes](#_1-update-custom-payment-gateways-first).

v6 also adds per-gateway webhook routes (`/resrv/api/webhook/{gateway}`). Single-gateway sites keep working, because the `payment_gateway` config key and the bare `/resrv/api/webhook` route still point to the default gateway.

See the [Custom payment gateway guide](./custom-payment-gateway) for each method, and [Payment gateways](./payment-gateways) for multiple gateways, surcharges and amount limits.

### 6. Update published frontend templates

::: tip ONLY FOR PUBLISHED VIEWS
The template edits below apply to views you published to `resources/views/vendor/statamic-resrv/` and customized. The bundled views are already up to date.
:::

#### Rate selector rename

If you published the advanced-availability partial, rename it:

```bash
mv resources/views/vendor/statamic-resrv/livewire/components/availability-advanced.blade.php \
   resources/views/vendor/statamic-resrv/livewire/components/availability-rates.blade.php
```

In `availability-search.blade.php`, update the variable, component tag and wire model:

```blade
{{-- Old --}}
@if ($advanced)
<x-resrv::availability-advanced wire:model.live="data.advanced" :entryRates="$this->entryRates" :errors="$errors" />
@endif

{{-- New --}}
@if ($rates)
<x-resrv::availability-rates wire:model.live="data.rate" :entryRates="$this->entryRates" :errors="$errors" />
@endif
```

#### Results template

In `availability-results.blade.php`, replace the `request.property` checks with `message.status`:

```blade
{{-- Old --}}
@if (data_get($availability, 'request.property') !== 'any')

{{-- New --}}
@if (data_get($availability, 'message.status') === true)
```

#### Checkout and email templates

In `checkout-reservation-details.blade.php` and any email template that used the property, swap the accessors:

```blade
{{-- Old --}}
@if ($reservation->property)
    {{ $reservation->getPropertyAttributeLabel() }}
@endif

{{-- New --}}
@if ($reservation->rate_id)
    {{ $reservation->getRateLabel() }}
@endif
```

#### Calendar library and CSS variables

The frontend calendar is now **@reachweb/alpine-calendar** instead of Vanilla Calendar Pro. Day.js is still bundled and the asset URLs haven't changed, so re-publishing the `frontend` assets is usually enough. Every calendar CSS variable was renamed, though.

If you customized the calendar's colors, rename your `--calendar-*` variables to the new `--color-calendar-*` and `--radius-calendar-*` ones:

```css
/* Old */
--calendar-color-main: #06b6d4;

/* New */
--color-calendar-primary: #06b6d4;
```

The `--calendar-color-slate-*` palette and the `--calendar-color-main` accent are gone. The new defaults have zero specificity, so your overrides don't need `!important`. See [Frontend Setup](./frontend-setup) for the full variable list and the re-publish command.

### 7. Update language overrides

If you published the language files, add the new rate keys. The old property keys still work.

| New key | Default |
|---|---|
| `selectRate` | "Select rate" |
| `pleaseSelectRate` | "Please select a rate..." |
| `pleaseSelectRateToBook` | "Please select a rate to book" |
| `multipleRatesAvailable` | "Multiple rates available." |

Payments and cancellation policies added more frontend keys, such as `selectPaymentMethod` and `noGatewayAvailableForAmount`. Re-publish the language files and merge the new keys into your overrides. See [Languages](./languages) for how overrides work.

### Checklist

- [ ] The migration output has no warnings about deleted orphaned records, or you've checked that those rows didn't matter.
- [ ] **Resrv → Settings** shows your old values, without the "⚠ Published config file detected" warning.
- [ ] **Resrv → Rates** lists the rates you expect in each collection, with readable titles.
- [ ] An existing reservation that used an advanced property shows its rate label in the Control Panel.
- [ ] If you used connected availabilities, you merged those entries into one, or booking one of them updates the others.
- [ ] Checkout and the Control Panel reservation pages load. An outdated custom gateway breaks both.
- [ ] A test booking works from start to finish: search, pick a rate, check out and pay, with each gateway you offer.
- [ ] If you customized the calendar's colors, the frontend calendar still uses them.

## Upgrading from v6.0.0 to v6.1.0

v6.1.0 has no migrations and nothing destructive.

### 1. Remove the `resetOnBoot` attribute

The `resetOnBoot` attribute on the [`availability-search`](./availability-search-component) component has been **removed**. Delete it from your templates, or Livewire throws a *"property does not exist"* error. Coming from v5, remove its old name, `resetAdvancedOnBoot`, as well.

```blade
{{-- Before --}}
{{ livewire:availability-search calendar="range" :rates="true" :resetOnBoot="true" }}

{{-- After --}}
{{ livewire:availability-search calendar="range" :rates="true" }}
```

You don't need it anymore. Every availability component now drops a rate from the `resrv-search` session that doesn't apply to it, and auto-selects the rate when only one is valid.

### 2. Optional: schedule housekeeping

The new `resrv:housekeeping` command clears long-expired reservations and their related rows, orphaned customer details and availability for past dates. It doesn't run on its own, so add it to your scheduler:

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('resrv:housekeeping')->daily();
```

Preview what it removes first, and check that the retention window (`--days`, default 30) suits your site:

```bash
php please resrv:housekeeping --dry-run
```

### Checklist {#checklist-v6-1}

- [ ] `grep -rnE "reset(Advanced)?OnBoot" resources/views` finds nothing.
- [ ] Pages with an availability search load without a Livewire error.
- [ ] If you scheduled housekeeping, `php artisan schedule:list` shows `resrv:housekeeping`.

## Upgrading from v6.1.0 to v6.4.0

These releases are small and nothing in them is destructive. Each one is listed separately, so skip any you already have. Their two migrations (v6.2.0 and v6.3.0) run with the others in [step 2 of the v6.5.0 upgrade](#_2-update-the-package-and-run-the-migrations).

### v6.2.0

- Custom payment gateways need `supportsAutomaticRefunds(): bool`, or they fail to load. Return `true` only if your `refund()` returns the money through the provider's API, and `false` for gateways like bank transfer. See [Refunds](./custom-payment-gateway#refunds).
- `refunded` now only means the gateway returned the money. Cancellations without a refund, and voids of bookings that were never charged, get the new `cancelled` status. If your code checks for `refunded`, handle `cancelled` too.
- The new [reservation status page](./reservation-status) and customer cancellations stay off until you enable them.

### v6.3.0

- A coupon tied to an affiliate still credits the affiliate, but no longer lets the customer skip payment. Only affiliate links do.
- With **Enable affiliates** off, Resrv no longer sets affiliate cookies, credits affiliates, lets them skip payment or sends affiliate emails.

### v6.4.0

- The `reservation_from_uri` tag now finds **Partner** bookings as well as **Confirmed** ones. Add `statuses="confirmed"` to any page that should only show confirmed bookings.

### Checklist {#checklist-v6-4}

- [ ] Every custom payment gateway has `supportsAutomaticRefunds()`.
- [ ] Code that checks for the `refunded` status also handles `cancelled`.
- [ ] Pages built on the `reservation_from_uri` tag show the bookings you expect.

## Upgrading to v6.5.0

v6.5.0 adds [manual reservations](./manual-reservations) and four migrations, none of them destructive. It also changes the interface custom payment gateways implement, so if you have one, update it before anything else.

### 1. Update custom payment gateways first

The bundled Stripe and Offline gateways are already updated. If you wrote your own gateway, `PaymentInterface` has two changes that PHP enforces as soon as the class loads:

- `paymentIntent()` gained a 4th parameter, `?string $returnUrl = null`. Without it, the class fails to load with *"Declaration of …::paymentIntent() must be compatible with …"*. Redirect gateways must also use it to build the return URL they send to the provider.
- `retrievePaymentIntent(string $paymentId, Reservation $reservation): ?object` is a new required method. Resrv uses it to resume an interrupted payment and to check that a payment it cancelled can't still collect money.

Resrv loads every configured gateway class, so one outdated gateway breaks checkout, webhooks and the Control Panel reservation pages. Deploy these changes together with the package update.

Gateways that confirm payments through webhooks also need `verifyPayment()` to confirm **Awaiting payment** reservations as well as pending ones. Otherwise a customer pays through the payment link and the booking never confirms. Manual reservations only offer online gateways whose `supportsWebhooks()` returns `true`.

The [Custom payment gateway](./custom-payment-gateway) guide covers all three changes. On v6.1 or earlier, your gateway also needs `supportsAutomaticRefunds()` from [v6.2.0](#v6-2-0).

::: warning MOLLIE AND PAYPAL ADD-ONS
Update the Mollie (`reachweb/resrv-payment-mollie`) or PayPal (`reachweb/resrv-payment-paypal`) add-on in the same deploy. Before you upgrade Resrv, check that the add-on version you'll install declares `retrievePaymentIntent()` and the 4-parameter `paymentIntent()` in its gateway class (`MolliePaymentGateway` or `PaypalPaymentGateway`). If there's no such release yet, hold the Resrv upgrade.
:::

### 2. Update the package and run the migrations

```bash
composer update reachweb/statamic-resrv
php artisan migrate
```

Run the migrations before the site serves traffic, because any page or email that lists a reservation's extras fails until the new `total` column exists. `migrate` also runs the migrations of any release you skipped.

| Migration | Adds |
|---|---|
| `2026_07_05_000000_add_manual_reservation_columns_to_resrv_reservations_table` | `affects_availability` (boolean, default `true`), `created_by`, `hold_expires_at` and `payment_request_email_sent_at` on `resrv_reservations` |
| `2026_07_21_000000_add_payment_unresolved_to_resrv_reservations_table` | `payment_unresolved` (boolean, default `false`) on `resrv_reservations` |
| `2026_09_08_000000_add_units_per_addon_to_rates` | `units_per_addon` (nullable integer) on `resrv_rates`, for [Booked units per add-on](./rates#booked-units-per-add-on) |
| `2026_09_14_000000_add_total_column_to_resrv_reservation_extra_table` | `total` (nullable) on `resrv_reservation_extra` |

Existing rows need no backfill and behave as before.

### 3. Schedule the lapsed-hold sweep

A manual reservation can have a payment deadline, and `resrv:cancel-lapsed-holds` cancels it if it's still unpaid by then. Resrv doesn't schedule the command for you:

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('resrv:cancel-lapsed-holds')->everyFifteenMinutes()->withoutOverlapping();
```

Each run cancels the **Awaiting payment** reservations past their deadline and releases their availability. It also cancels any online payment in progress and emails the customer and your admins. Fifteen minutes is only a suggestion. A lapsed hold stays in place until the next run.

::: warning REQUIRES CRON
Scheduled commands only run if your server's cron runs `php artisan schedule:run` every minute. Without the sweep, the payment link and **Send payment request** still stop working after the deadline. The reservation stays **Awaiting payment** and keeps its availability, and nobody is emailed. The Control Panel flags it with "Hold expired — will be cancelled by the next sweep".
:::

To see how many holds a run would cancel:

```bash
php please resrv:cancel-lapsed-holds --dry-run
```

See [Payment deadlines](./manual-reservations#payment-deadlines) for how holds and the arrival-day cut-off work.

### 4. Set up the payment page

Customers pay manual reservations on a page of your site, linked from the payment request email. Skip this step if you won't take online payments for them.

1. Create a published, non-private entry with a URL, and render the payment component in its template:

   ```antlers
   {{ livewire:reservation-payment }}
   ```

2. Select the entry under **Resrv → Settings → Checkout → Manual reservations → Payment Page Entry**.

Without it, the **Create reservation** page only offers offline (manually confirmed) methods, and you mark those bookings as paid in the Control Panel.

The page renders your gateway's payment form, so its layout needs the same assets as your checkout page: Livewire, the [Resrv frontend assets](./frontend-setup) and, for Stripe, [Stripe's JavaScript](./stripe#including-stripe-s-javascript). See [Payment page](./payment-page#setting-up-the-page) for details.

### 5. Optional: add offline payment instructions

For offline payment methods such as bank transfer, enter your payment details under **Resrv → Settings → Checkout → Manual reservations → Offline Payment Instructions**. They're shown as plain text on the payment page and in the payment request email. If you leave the field empty, customers are told to arrange payment with you and quote their booking reference.

### 6. Use a cache store that supports locks

The payment page uses `Cache::lock()`, so a double click or a second tab resumes the same payment instead of starting another. The `file`, `database`, `redis`, `memcached`, `dynamodb` and `array` stores support locks. `apc` doesn't, and on it every online payment on the payment page fails with "We could not start the payment process". If you run more than one app server, use a shared store (`redis`, `database` or `memcached`).

Without locks, two submits sent at the same moment on the **Create reservation** page could also both create a booking.

### 7. Re-publish or merge customized views and translations

- If you published the email templates (`php artisan vendor:publish --tag=resrv-emails`) or set a custom template on an email event or form, merge in the changes from `vendor/reachweb/statamic-resrv/resources/views/email/reservations`. `cancelled`, `cancelled-customer`, `confirmed`, `made`, `orphaned-payment` and `refunded` changed, and old copies keep the old wording. An old `cancelled` template, for example, tells your admins that a lapsed hold was "cancelled by the customer". See [Template changes in v6.5](./emails#template-changes-in-v6-5) and [Editing the templates](./emails#editing-the-templates). The new `payment-request` template uses the packaged copy until you publish it.
- Published checkout views (`--tag=resrv-checkout-views`) need no merging. The new `livewire/reservation-payment.blade.php` and `livewire/components/partials/business-contact.blade.php` use the packaged copies until you publish them.
- The frontend language file (`--tag=resrv-language`) has 23 new keys in `frontend.php` for the payment page. Only English ships, so add them to every locale you've published. [Payment page](./payment-page#translations) lists them.
- The new email and Control Panel sentences go through `__()`. If you translate Resrv in `lang/<locale>.json`, add them there.

### What changes for existing sites

These apply even if you never create a manual reservation. The [v6.5.0 changelog](./changelog#v6-5-0) has the details.

- Checkout now enforces extras made required by the **Extra in category is selected** and **No extra in category is selected** [conditions](./extras#conditions). If you use them, test a checkout that needs one.
- Payment webhooks no longer fail with a 419 error on Laravel 13. You can remove any `preventRequestForgery(except: [...])` exclusion you added for them.
- The **Use Statamic Resrv** permission now also lets a user create reservations, mark them as paid, send payment requests, extend holds and cancel unpaid reservations. Review which roles have it.
- The Reservations status filter now defaults to **Confirmed**, **Partner** and **Awaiting payment**.
- Offline checkout bookings show **Payment** instead of **Paid**, since Resrv can't know whether the money arrived. Refunding a booking that wasn't paid online now reminds you to return the money yourself.
- Admins also get the orphaned-payment email when a payment lands on a **Cancelled** reservation.
- Confirmation emails say "Amount already paid" instead of "Already paid by credit card" when nothing was charged online.

### Checklist {#checklist-v6-5}

- [ ] Checkout and the Control Panel reservation pages load without a "must be compatible" error, with your custom gateways and any Mollie or PayPal add-on updated.
- [ ] `php artisan migrate:status` shows the four v6.5.0 migrations as ran.
- [ ] `php artisan schedule:list` shows `resrv:cancel-lapsed-holds`, and your server's cron runs `schedule:run` every minute.
- [ ] Your cache store (`CACHE_STORE` in `.env`) isn't `apc`.
- [ ] If you take online payments for manual reservations, a test reservation paid through its payment link turns **Confirmed** once the webhook arrives.
- [ ] Your published email templates, checkout views and language files include the v6.5.0 changes.
