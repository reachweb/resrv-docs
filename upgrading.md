# Upgrading to v6

Resrv v6 is a major release. The biggest changes are the new collection-scoped [Rates](./rates) system (which replaces the old "advanced" and "connected" availability features), a [multiple payment gateway](./payment-gateways) system, and a new settings model where most options now live in the control panel instead of a config file.

This guide walks you through upgrading an existing v5 site. Read it end to end before you start: some of the database migrations are **destructive** and cannot be reversed without a backup.

::: tip ALREADY ON v6.0.0?
This page is the **v5 → v6** guide. If you are upgrading from **v6.0.0 to v6.1.0**, you only need the short [Upgrading from v6.0.0 to v6.1.0](#upgrading-from-v6-0-0-to-v6-1-0) checklist at the end — there are no migrations and nothing destructive.

Upgrading an existing v6 site to **v6.5.0**? Follow [Upgrading to v6.5.0](#upgrading-to-v6-5-0). It adds migrations and changes the interface that custom payment gateways implement. If you're on v6.0 or v6.1 with a custom payment gateway, read the note on v6.2.0 in [its step 1](#_1-update-custom-payment-gateways-first) too.
:::

::: danger BACK UP YOUR DATABASE FIRST
The rate migrations remove the `property` column and drop the `resrv_advanced_availabilities` table. There is no automatic rollback. Take a full database backup before running any migrations.
:::

::: tip USING A CODING AGENT?
If you work with a coding agent (Claude Code, Cursor, etc.), point it at this page and let it drive the upgrade. A prompt like this, combined with this guide, works well:

> Upgrade my Resrv installation from v5 to v6 by following the official upgrade guide at https://resrv.dev/upgrading exactly, step by step and in order. Before doing anything, confirm with me that I have a full database backup: some migrations are destructive and irreversible. Work through each step (requirements, migrations, settings, rates, payment gateways, published templates, language files), run the `--dry-run` previews first and show me the output before running anything for real, and update my custom PHP, published Blade templates, and language overrides to match. Stop and ask me whenever something is ambiguous or specific to my project. When you're done, walk through the verification checklist at the end of the guide.

Always review the agent's changes and the migration output yourself! Especially around the destructive steps.
:::

## 1. Bump your requirements

Resrv v6 raises its platform requirements:

| Requirement | v5 | v6 |
|---|---|---|
| PHP | 8.1 / 8.2 | **8.4+** |
| Laravel | 10 / 11 | **12 or 13** |
| Statamic | 5 | **6** |
| Livewire | 3 | **3.6.4+ or 4** |

Make sure your project is running on Statamic 6 and Laravel 12/13 *before* upgrading Resrv. Once your platform is ready, update the package:

```bash
composer update reachweb/statamic-resrv
```

### Laravel 13: keep `php` session serialization

Laravel 13 changed the default session serialization from `php` to `json` in `config/session.php`. Livewire persists PHP objects to the session. Resrv's availability search stores its `AvailabilityData` form object using the `#[Session('resrv-search')]` attribute. With JSON serialization, that object is flattened to a plain array when it's written to the session, so the next request throws:

```
Cannot assign array to property ... of type AvailabilityData
```

If you are on Laravel 13, set the serialization driver back to `php` in `config/session.php`:

```php
'serialization' => 'php',
```

If you are using the Resrv starter kit, this setting is already exported with the kit. This is a Livewire limitation that will need to be addressed on Livewire's side. Until then, the `php` serialization driver is required.

## 2. Run the migrations

```bash
php artisan migrate
```

v6 ships several new migrations. The most important ones for an upgrade are the four **rate migrations**, which run in sequence:

1. Create the `resrv_rates` and `resrv_rate_entries` tables.
2. Add a nullable `rate_id` column to `resrv_availabilities`, `resrv_reservations`, `resrv_child_reservations`, and `resrv_fixed_pricing`.
3. **Data migration**: group existing availability by collection, create a Rate per unique property (or a `default` rate for standard availability), and backfill `rate_id` on every row.
4. **Finalize**: delete orphaned rows with no `rate_id` (logged as warnings), drop the `property` column and the `resrv_advanced_availabilities` table, make `rate_id` required, and add the new unique constraints.

::: warning DESTRUCTIVE STEP
Steps 3 and 4 above rewrite and then drop columns. This is why the database backup in the intro is not optional. Check the migration output for any warnings about orphaned records being deleted.
:::

Other new v6 tables/columns (payment gateway, payment surcharge, rate prices, cancellation policy, abandoned-email tracking) are added by the same `php artisan migrate` run and need no special handling.

## 3. Migrate your settings

In v6, business information, reservation rules, currency, checkout, and email settings live in the control panel under **Resrv → Settings** (stored at `resources/addons/statamic-resrv.yaml`). The published `config/resrv-config.php` is now **developer only**: it holds just `payment_gateway`, `payment_gateways`, and the `stripe_*` keys.

If you previously configured Resrv by editing the published config file, your CP-managed values need to be seeded into the new settings store. **This happens automatically during `composer update` (step 1):** Resrv ships a Statamic update script that fires when you cross into `6.0.0`, runs the migration, and prints a short report of what it changed.

You only need the command below to **preview** the migration or to **re-run** it, for example if `composer update` ran with `--no-scripts` (so the update script never fired) or you edited `config/resrv-config.php` after upgrading.

**Preview without saving:**

```bash
php please resrv:settings:migrate --dry-run
```

**Run (or re-run) it:**

```bash
php please resrv:settings:migrate
```

The command reads your published `config/resrv-config.php` and seeds any CP-managed keys into the control panel settings. An existing CP value always wins, so it never overwrites something you have already set. The report lists:

- values **seeded** into the CP settings, including any previously-nested `checkout_forms` / `reservation_emails` values that are now folded into the CP
- **conflicts** (where the file and CP disagree, the CP value stays active)
- keys that are now **safe to delete** from `config/resrv-config.php` (including `checkout_forms` and `reservation_emails`)
- **stale keys** no longer used by Resrv (for example `enable_advanced_availability`, `enable_connected_availabilities`, `form_name`)
- the **developer keys** you should keep in the file

While a published config file still defines CP-managed keys, the settings page shows a **"⚠ Published config file detected"** warning. Remove those keys from `config/resrv-config.php` (keeping only the developer keys) to clear it.

See [Configuration](./configuration) for the full settings reference and the two-owner model.

## 4. Move from advanced/connected availability to Rates

v5's per-entry "advanced availability" (the `property` column) and "connected availabilities" features are **removed**. They are replaced by [Rates](./rates): first-class records scoped to a Statamic collection, with their own pricing mode, availability mode, restrictions, and entry assignment.

The migrations in step 2 already created a Rate for each of your old properties (and a `default` rate for standard availability). The upgrade command then gives those rates proper titles from your blueprint labels.

Unlike the settings migration, this command is **not** run automatically. You run it yourself after the migrations.

**Preview first:**

```bash
php please resrv:upgrade-to-rates --dry-run
```

**Then run it for real:**

```bash
php please resrv:upgrade-to-rates
```

What the command does:

- **Standard collections** (no properties): renames the `default` rate to **"Standard Rate"**.
- **Advanced collections** (with properties): renames each rate using the `advanced_availability` labels from your blueprint. For example, a blueprint mapping of `{"non-refundable":"Non Refundable"}` gives the `non-refundalbe` rate the title "Double Room".
- **Connected availabilities**: *detects and warns* about any cross-entry connections. It does **not** migrate them (see below).

After running it, open **Resrv → Rates** in the control panel and confirm each collection has the expected rates with the correct titles.

### Connected availabilities replacement

The connected availabilities feature (and the `AvailabilityChanged` event / `UpdateConnectedAvailabilities` listener that backed it) is gone. If you relied on it to sync inventory across entries, you now have two options:

1. **Consolidate** the connected entries into a single entry with multiple rates (the recommended path: shared-availability rates share one inventory pool).
2. **Write custom listeners** on `ReservationCreated` and `ReservationCancelled` to apply your own cross-entry sync logic:

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

### Custom code changes

If you have PHP that touches Resrv models, update property references to rate references:

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

Availability request arrays now use an integer `rate_id` instead of the old `advanced` property string:

```php
// Old
['date_start' => '2026-04-01', 'date_end' => '2026-04-05', 'quantity' => 1, 'advanced' => 'double-room'];

// New
['date_start' => '2026-04-01', 'date_end' => '2026-04-05', 'quantity' => 1, 'rate_id' => 3];
```

The `NoAdvancedAvailabilitySet` exception has also been deleted. Remove any `catch` blocks that reference it.

You can leave the now-defunct `advanced_availability` and `connected_availabilities` blueprint field configs in place (they are inert) or remove them from your blueprint YAML once you have verified the migration.

## 5. Update custom payment gateways

If you ship a custom gateway class that implements `PaymentInterface`, it **will fatal at boot** until you implement the five new methods v6 added:

| Method | Role |
|---|---|
| `name(): string` | Machine slug (lowercase, no spaces), e.g. `paypal`. |
| `label(): string` | Default human label shown in the checkout gateway picker. |
| `paymentView(): string` | Blade view for the inline payment UI (redirect gateways return the default view as a never-rendered fallback). |
| `supportsManualConfirmation(): bool` | `true` only for offline / non-provider-verified gateways; `false` for provider-backed ones. |
| `cancelPaymentIntent(string $paymentId, Reservation $reservation): void` | Voids an abandoned provider-side intent. |

Later v6 releases made more methods required, so a gateway with only these five still fails to load on current versions. v6.2.0 added `supportsAutomaticRefunds(): bool`, and v6.5.0 added `retrievePaymentIntent()` and a 4th `paymentIntent()` parameter (see [Upgrading to v6.5.0](#_1-update-custom-payment-gateways-first)).

v6 also adds **per-gateway webhook routes** (`/resrv/api/webhook/{gateway}`) and new reservation columns (`payment_gateway`, `payment_surcharge`). Existing single-gateway sites keep working unchanged: the legacy singular `payment_gateway` config key and the bare `/resrv/api/webhook` route still resolve to the default gateway.

The full step-by-step for implementing the new methods (including the stale-intent and orphaned-charge handling that provider-verified gateways need) is in the [Custom payment gateway guide](./custom-payment-gateway). For configuring multiple gateways, surcharges, and amount limits, see [Payment gateways](./payment-gateways).

## 6. Update published frontend templates

::: tip SKIP IF YOU DIDN'T PUBLISH VIEWS
If you never published Resrv's Livewire views, the bundled defaults are already correct, so skip this step. This only applies if you published views to `resources/views/vendor/statamic-resrv/` and customized them.
:::

### Rate selector rename

The advanced-availability partial was renamed to a rate-based one. If you published it, rename the file and update the component name:

```bash
mv resources/views/vendor/statamic-resrv/livewire/components/availability-advanced.blade.php \
   resources/views/vendor/statamic-resrv/livewire/components/availability-rates.blade.php
```

In `availability-search.blade.php`, the variable, component tag, and wire model all changed:

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

### Results template

In `availability-results.blade.php`, replace the old `request.property` checks with the new `message.status`:

```blade
{{-- Old --}}
@if (data_get($availability, 'request.property') !== 'any')

{{-- New --}}
@if (data_get($availability, 'message.status') === true)
```

### Checkout & email templates

In `checkout-reservation-details.blade.php` (and any email templates that referenced the property), swap the accessors:

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

### Calendar library and CSS variables

The frontend calendar library changed from Vanilla Calendar Pro to **@reachweb/alpine-calendar** (an AlpineJS-native calendar). Day.js is still bundled. The precompiled asset URLs are unchanged, so a simple re-publish of the `frontend` assets is usually enough, but every calendar CSS variable was renamed.

If you customized the calendar's colors, update the variable names from the old `--calendar-*` scheme to the new `--color-calendar-*` / `--radius-calendar-*` scheme. For example:

```css
/* Old */
--calendar-color-main: #06b6d4;

/* New */
--color-calendar-primary: #06b6d4;
```

The old `--calendar-color-slate-*` palette and the `--calendar-color-main` accent no longer exist. The new defaults are declared at zero specificity, so your overrides win without `!important`. See [Frontend Setup](./frontend-setup) for the full variable list, the Tailwind v4 guidance, and the re-publish command.

## 7. Update language overrides

If you published the language files, the rate system added new keys alongside the old property ones (the old keys are kept for back-compat):

| New key | Default |
|---|---|
| `selectRate` | "Select rate" |
| `pleaseSelectRate` | "Please select a rate..." |
| `pleaseSelectRateToBook` | "Please select a rate to book" |
| `multipleRatesAvailable` | "Multiple rates available." |

The payment and cancellation-policy features also added frontend keys (for example `selectPaymentMethod`, `surcharge`, `confirmReservation`, `noGatewayAvailableForAmount`). Re-publish the language files and merge the new keys into your overrides, or adjust the rate wording to suit your site (e.g. "Room type", "Package", "Plan"). See [Languages](./languages) for how overrides work.

## Verification checklist

- [ ] Database backed up before starting
- [ ] Platform on PHP 8.4+, Laravel 12/13, Statamic 6, Livewire 3.6.4+/4
- [ ] `composer update reachweb/statamic-resrv` completed without errors
- [ ] `php artisan migrate` ran the rate migrations successfully (no orphaned-record surprises)
- [ ] Settings migrated into the CP (runs automatically on `composer update`; verify or re-run with `php please resrv:settings:migrate`)
- [ ] CP-managed keys removed from `config/resrv-config.php` and the "Published config file detected" warning is gone
- [ ] `php please resrv:upgrade-to-rates --dry-run` reviewed, then run for real
- [ ] **Resrv → Rates** shows the correct rates per collection
- [ ] Connected-availability replacement implemented (if you used that feature)
- [ ] Custom payment gateways implement the five new `PaymentInterface` methods (plus the ones added in v6.2.0 and v6.5.0, see step 5)
- [ ] Published Blade templates, custom PHP, and language overrides updated (if applicable)
- [ ] Frontend availability search, rate selector, and checkout all complete successfully
- [ ] Existing reservations display the correct rate labels

## Upgrading from v6.0.0 to v6.1.0

v6.1.0 is a minor release. There are **no migrations** and nothing destructive — for most sites updating the package is all you need:

```bash
composer update reachweb/statamic-resrv
```

Then check the three points below.

### 1. Remove the `resetOnBoot` attribute

The `resetOnBoot` attribute on the [`availability-search`](./availability-search-component) component has been **removed**. If any of your templates still pass it, delete it — Livewire will otherwise throw a *"property does not exist"* error:

```blade
{{-- Before --}}
{{ livewire:availability-search calendar="range" :rates="true" :resetOnBoot="true" }}

{{-- After --}}
{{ livewire:availability-search calendar="range" :rates="true" }}
```

You no longer need it. Stale rate selections are now healed automatically: every availability component (search, list, results, multi-results and collection) checks the rate saved in the shared `resrv-search` session against its own context, drops a rate that doesn't apply there, and auto-selects when only one valid rate exists. The behaviour `resetOnBoot` approximated — discarding a stale search on a landing page — now happens on its own, in every component.

### 2. Optional: schedule housekeeping

v6.1.0 adds a `resrv:housekeeping` command that clears long-expired reservations (with their related rows), orphaned customer details, and availability for dates that have already passed. It does **not** run on its own. To keep your database from growing unbounded, add it to your scheduler:

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('resrv:housekeeping')->daily();
```

Preview what it would remove first, and confirm the retention window (`--days`, default 30) suits your site:

```bash
php please resrv:housekeeping --dry-run
```

### Verification

- `composer update reachweb/statamic-resrv` completed without errors
- No template passes `:resetOnBoot` to the availability-search component
- (Optional) `resrv:housekeeping` scheduled, after reviewing a `--dry-run`

## Upgrading to v6.5.0

v6.5.0 adds [manual reservations](./manual-reservations): bookings you create in the Control Panel, which your customers pay through an emailed link. It's a minor release with four new migrations since v6.4.0 (three for manual reservations and one for [Booked units per add-on](./rates#booked-units-per-add-on)) and nothing destructive, but it includes a **breaking change for custom payment gateways**, so read step 1 before you update the package:

```bash
composer update reachweb/statamic-resrv
```

Ship the changes from step 1 in the same deploy as the package update, then check the remaining points below.

### 1. Update custom payment gateways first

The bundled Stripe and Offline gateways are already updated. If you wrote your own gateway, `PaymentInterface` changed in two ways that PHP enforces as soon as the class loads:

- `paymentIntent()` gained a 4th parameter, `?string $returnUrl = null`. Every gateway must declare it, otherwise the class fails to load with *"Declaration of …::paymentIntent() must be compatible with …"*. Redirect gateways must also build the return URL they give the provider from it.
- `retrievePaymentIntent(string $paymentId, Reservation $reservation): ?object` is a new required method. Resrv uses it to resume an interrupted payment instead of starting a second one, and to check that a payment it cancelled can no longer collect money.

Resrv loads every configured gateway class when it builds its gateway list, so one outdated gateway breaks checkout, webhooks and the Control Panel reservation pages, not just its own payments.

Gateways that confirm payments through webhooks need one more change. It doesn't cause a fatal error, but it matters just as much: `verifyPayment()` must confirm **Awaiting payment** reservations as well as pending ones, otherwise a customer pays through the payment link and the booking never confirms. Online gateways are also offered for manual reservations only when `supportsWebhooks()` returns `true`.

The [Custom payment gateway](./custom-payment-gateway) guide covers all three changes.

Coming from v6.0 or v6.1? Your gateway also needs `supportsAutomaticRefunds(): bool`, which has been required since v6.2.0, or it fails to load too. See [Refunds](./custom-payment-gateway#refunds) in the custom gateway guide.

::: warning MOLLIE AND PAYPAL ADD-ONS
If you use the Mollie (`reachweb/resrv-payment-mollie`) or PayPal (`reachweb/resrv-payment-paypal`) add-on, update it in the same deploy to a release that implements `retrievePaymentIntent()` and the 4-parameter `paymentIntent()`. Before you upgrade Resrv, check that the add-on version you will install declares both in its gateway class (`MolliePaymentGateway` or `PaypalPaymentGateway`). If no such release of your add-on is available yet, hold the Resrv upgrade until there is one.
:::

### 2. Run the migrations

```bash
php artisan migrate
```

Run them before the site serves traffic. Reservation extras are now always loaded with the new `total` column, so every page and email that lists a reservation's extras fails until the migrations have run.

| Migration | Adds |
|---|---|
| `2026_07_05_000000_add_manual_reservation_columns_to_resrv_reservations_table` | `affects_availability` (boolean, default `true`), `created_by`, `hold_expires_at` and `payment_request_email_sent_at` on `resrv_reservations` |
| `2026_07_21_000000_add_payment_unresolved_to_resrv_reservations_table` | `payment_unresolved` (boolean, default `false`) on `resrv_reservations` |
| `2026_09_08_000000_add_units_per_addon_to_rates` | `units_per_addon` (nullable integer) on `resrv_rates`, for [Booked units per add-on](./rates#booked-units-per-add-on) |
| `2026_09_14_000000_add_total_column_to_resrv_reservation_extra_table` | `total` (nullable) on `resrv_reservation_extra` |

Existing rows need no backfill: the defaults keep every existing reservation affecting availability, an extra without a stored total falls back to price × quantity, and a rate with an empty `units_per_addon` prices add-ons as before.

### 3. Schedule the lapsed-hold sweep

When you create a manual reservation, you can hold it for a limited time so that it's cancelled automatically if the customer hasn't paid by the deadline. The `resrv:cancel-lapsed-holds` command does that cancelling. Resrv registers it but does **not** schedule it, so add it to your scheduler:

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('resrv:cancel-lapsed-holds')->everyFifteenMinutes()->withoutOverlapping();
```

Each run cancels the **Awaiting payment** reservations whose hold deadline has passed. It releases the availability they took, cancels any online payment the customer had started, and emails the customer and your admins. Every fifteen minutes is a suggestion: a lapsed hold is cancelled on the first run after its deadline.

::: warning REQUIRES CRON
Scheduled commands only run if your server's cron runs `php artisan schedule:run` every minute. Without the sweep, the payment link and **Send payment request** still stop working once a deadline passes, but the reservation stays **Awaiting payment**, keeps its availability, and nobody is emailed. The Control Panel flags it with "Hold expired — will be cancelled by the next sweep".
:::

To see how many holds a run would cancel, without changing anything:

```bash
php please resrv:cancel-lapsed-holds --dry-run
```

See [Payment deadlines](./manual-reservations#payment-deadlines) for how holds and the arrival-day cut-off work.

### 4. Set up the payment page

Customers pay a manual reservation on a page of your site, which they open from the link in the payment request email. Skip this step if you won't take online payments for manual reservations.

1. Create a published, non-private entry with a URL, and render the payment component in its template:

   ```antlers
   {{ livewire:reservation-payment }}
   ```

2. Select the entry under **Resrv → Settings → Checkout → Manual reservations → Payment Page Entry**.

Without it, online payment methods are disabled on the **Create reservation** page. Offline (manually confirmed) methods still work, and you mark those bookings as paid in the Control Panel.

The page renders your gateway's payment form in place, so give it a layout that loads the same assets as your checkout page: Livewire, the [Resrv frontend assets](./frontend-setup) and, for Stripe, [Stripe's JavaScript](./stripe#including-stripe-s-javascript). See [Payment page](./payment-page#setting-up-the-page) for the details.

### 5. Optional: add offline payment instructions

If manual reservations use an offline (manually confirmed) payment method such as bank transfer, enter your payment details under **Resrv → Settings → Checkout → Manual reservations → Offline Payment Instructions**. They're shown as plain text, with line breaks kept, on the payment page and in the payment request email. Leave the field empty and customers are told that payment is arranged directly with you and to quote their booking reference.

### 6. Use a cache store that supports locks

The payment page uses `Cache::lock()` to handle one payment attempt per reservation at a time, so a double click or a second tab resumes the same payment instead of starting another. The `file`, `database`, `redis`, `memcached`, `dynamodb` and `array` cache stores support locks; `apc` doesn't. On a store without locks, every online payment on the payment page fails with "We could not start the payment process". If you run more than one app server, use a shared store (`redis`, `database` or `memcached`).

The **Create reservation** page also uses a lock when the store supports one. Without it, a retried submit still returns the reservation that was already created, but two submits sent at the same moment could both create a booking.

### 7. Re-publish or merge customised views and translations

This step only applies to files you published or customised.

- **Email templates** (published with `php artisan vendor:publish --tag=resrv-emails`, or a custom template chosen for an email event or form): `cancelled`, `cancelled-customer`, `confirmed`, `made`, `orphaned-payment` and `refunded` changed, and `payment-request` is new. Old copies keep rendering, but they ignore the new `$holdLapsed`, `$paymentInFlight`, `$paymentCollected`, `$context`, `$refundedAutomatically` and `$returnedSeparately` data and keep the old wording. For example, an old `cancelled` template tells your admins that a lapsed hold was "cancelled by the customer". Merge the changes from the packaged templates in `vendor/reachweb/statamic-resrv/resources/views/email/reservations` into your copies (see [Template changes in v6.5](./emails#template-changes-in-v6-5) for what changed in each one, and [Editing the templates](./emails#editing-the-templates)). An unpublished `payment-request` uses the packaged copy.
- **Checkout views** (`--tag=resrv-checkout-views`): nothing to merge. The two new files, `livewire/reservation-payment.blade.php` and `livewire/components/partials/business-contact.blade.php`, use the packaged copies until you publish them.
- **Frontend language file** (`--tag=resrv-language`): `frontend.php` gained 23 keys for the payment page. Only English ships, so add them to every locale you've published. The [Payment page](./payment-page#translations) lists them with their defaults.
- **JSON translations:** the new email and Control Panel sentences go through `__()`. If you translate Resrv through `lang/<locale>.json`, add the new sentences there.

### What changes for existing sites

You'll notice these changes even if you never create a manual reservation:

- **Required extras at checkout:** extras made required by the **Extra in category is selected** or **No extra in category is selected** [conditions](./extras#conditions) are now checked when the checkout is submitted, and a checkout that's missing one is refused. Before, the extras step showed them as required but the checkout didn't enforce them, so bookings without them went through. If you use these conditions, test a checkout that needs one.
- **Payment webhooks on Laravel 13:** webhook calls from payment providers no longer fail with a 419 error. If you excluded the webhook routes from CSRF protection yourself with `preventRequestForgery(except: [...])`, you can remove that after updating.
- **Reservations listing:** the status filter now defaults to **Confirmed**, **Partner** and **Awaiting payment** (it was Confirmed and Partner), so bookings waiting for payment show up without changing the filter.
- **Permissions:** the existing **Use Statamic Resrv** permission now also lets a user create reservations, mark them as paid, send payment requests, extend holds and cancel unpaid reservations. Review which roles have it.
- **Availability edits:** changing an availability count is still blocked only by checkouts in progress, and the error now names them: "Cannot edit availability while checkouts are in progress for this date range (…). Try again once they complete or expire." Awaiting-payment holds don't block the edit, but if one is later cancelled or lapses, its quantity is added back on top of the value you set, as when a confirmed booking is refunded. Deleting availability is blocked while an awaiting-payment hold that took stock overlaps those dates, and an entry can't be deleted while it has an awaiting-payment reservation.
- **Offline checkout bookings:** reservations made at checkout with an offline (manually confirmed) gateway are no longer shown as paid in the Control Panel. Resrv can't know whether the money arrived, so the amount is labelled **Payment** instead of **Paid**.
- **Refunds of payments made outside a gateway:** refunding a booking whose money didn't go through an online gateway no longer reads as if the money was returned. The Control Panel shows "Refund recorded — if the customer paid, return the payment to them manually" for offline checkout bookings, or "Refund recorded — return the payment to the customer manually" for bookings marked as paid, and the reservation page keeps a **Return any payment manually** or **Return the payment manually** notice. The refund email adds "Your payment of … will be returned to you separately", or "If you have already paid for this reservation, …" when Resrv doesn't know whether the customer paid.
- **Payment alerts on cancelled reservations:** the reconciliation alert (the orphaned-payment email to admins) now also fires when a successful payment lands on a **Cancelled** reservation, for example a hold that lapsed while the customer was paying. The kept charge of a no-refund cancellation doesn't trigger it.
- **Email wording:** when nothing was charged online, confirmation emails show "Amount already paid" instead of "Already paid by credit card". They also show the payment rows whenever less than the total was paid, even when **Payment type** is *Charge the whole amount plus any options and extras*. The customer cancellation email labels its date row "Cancelled on".
- **Control Panel labels:** dates on the reservation page show their time zone, and status names in filters, badges and the export dialog are translated, readable labels.

### Verification

- Custom payment gateways (and the Mollie or PayPal add-on, if you use one) updated in the same deploy, and checkout loads without a "must be compatible" error
- `php artisan migrate` ran the four new migrations listed in step 2 (plus those of any earlier releases you skipped)
- `resrv:cancel-lapsed-holds` scheduled, after reviewing a `--dry-run`
- (If you take online payments for manual reservations) **Payment Page Entry** selected, and a test reservation paid through its payment link turns **Confirmed** once the gateway webhook arrives
- Cache store supports locks (not `apc`)
- Customised email templates, checkout views and language files merged
