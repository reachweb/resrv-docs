# Availability Search Overview

The AvailabilitySearch Livewire component is the main component that you'll use to add the reservation functionality to your site. It allows the user to search for a date or date range, by specific [rate](./rates) and select the quantity that they want to book.

In this page, we'll go over the basics of how to use the component, and then we'll explain how to use it to search for availability of a [single entry](./availability-search-single) or how to pair it with [Livewire Filters](https://livewirefilters.com/) or Statamic's Collection Tag in order to search for all [available entries](./availability-search-multiple) for a specific date or dates.

## Component basics

In its most simple form, you can include the AvailabilitySearch component in your Antlers templates like so:

```antlers
{{ livewire:availability-search calendar="range" }}
```

More often than not, you'll also want to include the [AvailabilityResults](./availability-results) component to display the results of the search and the "Book now" button that starts the checkout process.

::: tip
Each search that the user makes is saved in the session (under the key `resrv-search`), so that their search persists between page loads.

Because that session is shared, a [rate](./rates) selected on one page might not exist on another. From v6.1.0, every availability component reconciles this for you: a rate that doesn't apply to the current entry or collection is dropped automatically, and when only one valid rate exists it is auto-selected. You don't need to clear a stale search manually.
:::

<Image src="./img/resrv-availability-search.webp" alt="A very simple AvailabilitySearch component with its pal, AvailabilityResults" />

## Component properties

Of course, there are quite a few properties that you can set depending on the use case. Here's a list of all the available properties:

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| calendar | string | "single" | The calendar type to use. `single` selects a single date, `range` selects a date range. |
| live | boolean | true | When enabled, the component automatically updates the results when the user changes any value of their search. When disabled, the component only updates when the user clicks the "Search" button. |
| rates | boolean | false | When enabled, the [rate](./rates) selector is rendered so the user can pick a rate. Pass `:rates="true"`. (Replaces the v5 `advanced` property: it's now a plain boolean.) |
| anyRate | boolean | false | **Usable when searching for multiple entries.** When enabled, an unselected rate is sent as "any" and the results return the cheapest rate that is available. Search is also allowed without dates. Pass `:any-rate="true"`. |
| enableQuantity | boolean | false | When enabled, a quantity control is added so that the user can book more than one product at once. |
| redirectTo | string | null | If live mode is disabled, the page to redirect to when the user clicks "Search". |
| overrideRates | array | [] | A `rate_id => label` map that overrides the rates resolved from the database for this entry/collection. |
| showAvailabilityOnCalendar | boolean | false | Show availability & pricing information on the calendar. Usable only when browsing [a specific entry](./availability-search-single#display-availability-in-the-calendar). |
| entry | string | null | **Needs to be a Statamic Entry ID.** Used to resolve the per-entry rate labels and required when *showAvailabilityOnCalendar* is enabled. Optional for collection-wide search. |
| ratesBlueprint | string | null | Optional. Carries the `collection.blueprint` reference when needed (mainly for the Livewire Filters path). Not required for normal single/collection search, since rates are now collection-scoped database records. |
| view | string | "availability-search" | Override the view that's used to render the component. Really useful when you want different versions of the AvailabilitySearch component on different pages. Expects a `name.blade.php` file in the `/resources/views/vendor/statamic-resrv/livewire` folder. |

::: warning UPGRADING FROM v5 OR v6.0.0
Several properties were renamed in v6 as part of the move to the [Rates](./rates) system: `advanced` → `rates`, `anyAdvanced` → `anyRate`, `overrideProperties` → `overrideRates`. See [Upgrading to v6](./upgrading) for the full list.

The boot-reset property (`resetAdvancedOnBoot` in v5, `resetOnBoot` in v6.0.0) was **removed in v6.1.0** — passing `:resetOnBoot` now throws a Livewire "property does not exist" error, so remove it from your templates. You no longer need it: the component reconciles stale rates on its own, dropping a rate that doesn't apply to the current entry or collection and auto-selecting when only one valid rate exists. See [Upgrading from v6.0.0 to v6.1.0](./upgrading#upgrading-from-v6-0-0-to-v6-1-0).
:::

## Customizing

The design of the Availability Search component is very basic by default, since it's meant to be modified to fit your layout. To modify it, make sure you've published the views during checkout and edit the `/resources/views/vendor/statamic-resrv/livewire/availability-search.blade.php` file.

In the same path, inside the `components` folder, you can find and customize the Blade components that are used by the Availability Search component. The rate selector lives in `components/availability-rates.blade.php`.

## Usage

The component can be used in three different ways:

1. **As a standalone search form that redirects to a results page.**
This is something that you'd probably use on the homepage of a site. To use it this way, you can set `live` to false and `redirectTo` to the Entry ID of the page you want to redirect to.
2. **As a search form inside a single Entry.**
When you want your user to search for a single Entry, usually on the aforementioned Entry's page. Follow along at [single entry](./availability-search-single) for examples.
3. **As a search form on an index page.**
When you want the user to input their search and list all available Entries. You can find your options on the [multiple entries](./availability-search-multiple) page.

## Setting the search via URL parameters

From v6.2.0, you can seed the search using URL query parameters. This lets you link directly to a page with the calendar prefilled and the results already loaded. It comes in handy for links in newsletters, campaigns or banners.

```
https://yoursite.com/villa-blue?date_start=2026-08-20&date_end=2026-08-25&rate=3
```

The following parameters are supported:

| Parameter | Example | Description |
| --------- | ------- | ----------- |
| date | `?date=2026-08-20` | Sets the starting date. The ending date is calculated automatically using the `minimum_reservation_period_in_days` setting (1 day minimum). |
| date_start & date_end | `?date_start=2026-08-20&date_end=2026-08-25` | Sets an exact date range. Both parameters must be present. If `date` is also present, the explicit range wins. |
| rate | `?rate=3` | Preselects a [rate](./rates) by its numeric ID. The string `any` is also accepted when `anyRate` is enabled. |

A few things to keep in mind:

- Dates must use the `YYYY-MM-DD` format.
- The parameters are read once, when the page loads, and they override any previous search saved in the session.
- Invalid values are ignored silently. A date in the past, a malformed value or a range that violates your reservation settings will never throw an error; the component simply behaves as if the parameter was not there.
- A rate ID that does not exist for the current entry or collection is dropped by the same reconciliation described above.
- Passing only `rate` preselects it in the dropdown, but a search only runs if dates are also available (either in the URL or in the session).
- On a standalone search form that redirects (`live` set to false with `redirectTo`), the parameters fill the form and the session but the visitor is not redirected automatically. The search carries over to the results page once they click "Search".

## Passing data to checkout

There are some cases where you might want to pass some data to the checkout page before the user gets there. A good example is the [Guests component](./guests) where we pass along the number of guests to the checkout page. To achieve that you can bind the control you want to use to the `data.customer.handle` property of the `AvailabilitySearch` component. Just make sure to create the appropriate fields in your [checkout form](./checkout#checkout-form). If you don't want to allow the user to edit them, remember to set them as `hidden` fields in your blueprint.

## Disabling dates of the week

In some cases you might want to disable specific days of the week. To do so, you need to edit your `availability-search.blade.php` file (make sure you [publish your views during installation](./installation) or by running `php artisan vendor:publish --tag=resrv-checkout-views`) and add a `disabledDays` array to the `x-resrv::availability-dates` component like so:

```blade{3}
<x-resrv::availability-dates
    :$calendar
    disabledDays='["Saturday", "Sunday"]'
    :errors="$errors"
/>
```

The array uses full English day names (`Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`).
