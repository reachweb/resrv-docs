# Resrv Changelog

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

