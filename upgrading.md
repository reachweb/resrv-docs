# Upgrading to v6

Resrv v6 is a major release. The biggest changes are the new collection-scoped [Rates](./rates) system (which replaces the old "advanced" and "connected" availability features), a [multiple payment gateway](./payment-gateways) system, and a new settings model where most options now live in the control panel instead of a config file.

This guide walks you through upgrading an existing v5 site. Read it end to end before you start: some of the database migrations are **destructive** and cannot be reversed without a backup.

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

In v6, business information, reservation rules, currency, checkout, and email settings live in the control panel under **Resrv → Settings** (stored at `resources/addons/statamic-resrv.yaml`). The published `config/resrv-config.php` is now **developer only**: it holds just `payment_gateway`, `payment_gateways`, the `stripe_*` keys, and the nested `checkout_forms` / `reservation_emails` overrides.

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

- values **seeded** into the CP settings
- **conflicts** (where the file and CP disagree, the CP value stays active)
- keys that are now **safe to delete** from `config/resrv-config.php`
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

The frontend calendar library changed from Vanilla Calendar Pro to **@reachweb/alpine-calendar** (an AlpineJS-native calendar that ships with Livewire 3). Day.js is still bundled. The precompiled asset URLs are unchanged, so a simple re-publish of the `frontend` assets is usually enough, but every calendar CSS variable was renamed.

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
- [ ] Custom payment gateways implement the five new `PaymentInterface` methods
- [ ] Published Blade templates, custom PHP, and language overrides updated (if applicable)
- [ ] Frontend availability search, rate selector, and checkout all complete successfully
- [ ] Existing reservations display the correct rate labels
