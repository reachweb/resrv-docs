# Resrv Changelog

## v6.0.0
#### Release date: June 2026

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
- **[Settings in the Control Panel](./configuration):** business, reservation, checkout, email and currency settings now live under Resrv → Settings. `config/resrv-config.php` keeps developer-only keys. The `php please resrv:settings:migrate` command migrates legacy values.
- **[Email customization](./emails):** configure recipients, subject, from address and template per event and per checkout form, plus opt-in abandoned-reservation recovery emails. The Logo field now renders in emails automatically.
- **Per-rate [cancellation policies](./rates#cancellation-policy):** set a free-cancellation window or mark a rate as non-refundable; the policy is shown to the customer and snapshotted onto the reservation.
- **[CSV export](./reservations#export):** export reservations filtered by date range, status and columns, with custom checkout fields included.
- **Reports** can now run against the booking-creation date as well as the reservation date.
- **Minimum and maximum [dynamic pricing](./dynamic-pricing) rules:** clamp the final price to a floor or ceiling, applied after all other rules and coupons (and to extras).
- The frontend calendar moved to [`@reachweb/alpine-calendar`](./frontend-setup) and the Control Panel was rebuilt on Statamic 6 (Vue 3 + Inertia + Tailwind v4).

### Breaking changes
- Platform floor raised to PHP 8.4 / Laravel 12–13 / Statamic 6 / Livewire 3.6.4+.
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

