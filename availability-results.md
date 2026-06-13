# Availability Results Component

The `AvailabilityResults` Livewire component handles displaying the results of an availability search and lets the user start the checkout process. This page explains how to use it and how to provide extra functionality.

::: warning UPGRADING FROM v5
The "advanced availability" props on this component have been renamed in v6 to match the new collection-scoped [Rates](./rates) system. If you passed `advanced` or `:overrideProperties`, or copied the advanced sub-view, see [Breaking changes from v5](#breaking-changes-from-v5) below.
:::

## Component basics

This component is designed to work for a **single Entry**. If you want to display availability for many entries at once, see the [Availability Collection](./availability-search-multiple#the-availability-collection-component) component, or for a cart-based multi-rate / multi-date flow see [Cart booking](./cart-booking).

In its most basic form, you can include it in your templates like so:

```antlers
{{ livewire:availability-results :entry="id" }}
```

This will load the component and display the results for the Entry at the current page. As described in the [Availability Search for a Single Entry](./availability-search-single) page, you usually want to attach an instance of the AvailabilitySearch component so that the user can change their search:

```antlers
<div class="max-w-md">
    <div class="my-8">
        {{ livewire:availability-search enableQuantity="true" calendar="range" }}
    </div>
    <div class="my-8">
        {{ livewire:availability-results :entry="id" }}
    </div>
</div>
```

## Component properties

Of course, there are quite a few properties that you can set depending on the use case. Here's a list of all the available properties:

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| entry | string | none - required | **Needs to be a Statamic Entry ID**. The ID of the entry you want to display results for. |
| extraDays | integer | 0 | When set to a number greater than 0, the component will also get availability for the days before and after the current period the user searches for. |
| extraDaysOffset | integer | 0 | If extra days are enabled you can set an offset between the dates it searches for. |
| rates | boolean | false | When `true`, resolves the per-entry [rate](./rates) labels. If the search was made for any rate (`rate=any`), every available rate is listed with its own price and "Book now" button. |
| rateSorting | string | "order" | Controls how the rate rows are ordered when listing all rates. Use `"order"` for each rate's configured order, or `"price"` to list the cheapest rate first. |
| showExtras | boolean or array | false | If you want to display an Extras select box here, you can set this to true to show all extras or an array of the IDs you want to display. (more information below) |
| showOptions | boolean or array | false | If you want to display an Options select box here, you can set this to true to show all options for this Entry or an array of the IDs you want to display. (more information below) |
| overrideRates | array | [] | Override the resolved `rate_id => label` map with your own labels. |
| view | string | "availability-results" | You can override the view that is used to render the component. Expects a `name.blade.php` file in the `/resources/views/vendor/statamic-resrv/livewire` folder. |

## Working with rates

When an Entry has more than one [rate](./rates) (for example different room types or fare classes), set `rates="true"` so the component resolves each rate's label and price:

```antlers
{{ livewire:availability-search :rates="true" :any-rate="true" }}
{{ livewire:availability-results :entry="id" :rates="true" }}
```

When the search was made for any rate, every available rate is rendered as its own row, and the visitor picks one before booking. The order of those rows is controlled by `rateSorting`: `"order"` (the default) follows each rate's configured order, while `"price"` lists the cheapest first:

```antlers
{{ livewire:availability-results :entry="id" :rates="true" rateSorting="price" }}
```

### The rates sub-view

The list of rate rows is rendered by an anonymous Blade component, `<x-resrv::availability-results-advanced>`, found at `availability-results-advanced.blade.php`. The main view invokes it like this:

```blade
<x-resrv::availability-results-advanced
    :$availability
    :entryRates="$this->entryRates"
    :dateStart="$data->dates['date_start'] ?? null" />
```

It loops the available rates, looks up each label with `entryRates`, shows the price and an optional cancellation-policy label, and books a specific rate via `wire:click="checkoutRate('{rateId}')"`.

::: info
The filename still carries the word "advanced", but everything user-facing is now "rates": the prop is `entryRates` and the booking action is `checkoutRate`.
:::

## Cancellation policy

Each available rate row carries a `cancellation_policy` payload (a `['policy', 'period']` array) inside its `data`. When a rate has a policy configured, the component renders a customer-facing label:

- **Non-refundable** for non-refundable rates.
- **Free cancellation until \<date\>** for rates with a free-cancellation window (the date is the check-in date minus the rate's free-cancellation period).

Rates that inherit the global default with no period configured render no label at all. See [Rates](./rates) for how to set a per-rate cancellation policy.

## Customizing

Obviously, depending on the use case, you'll need to customize the component to fit your needs. The main template file can be found at `/resources/views/vendor/statamic-resrv/livewire/availability-results.blade.php`. There you can select what elements you want to display and customize them.

## Extras and Options (Optional)

Besides just displaying the availability results, you can also display the Extras and Options of that Entry. It might strike you as weird that this is part of the `AvailabilityResults` component instead of the `AvailabilitySearch` component, but the Extras and Options need access to the Entry data, so they need to be displayed in the same component.

By default, the Extras and Options are not displayed since they are part of the [Checkout](./checkout) component. However there are cases where you might want to display them next to the availability results.

To do so, just enable the appropriate properties. For example:

```antlers
{{ livewire:availability-results :entry="id" showExtras="true" }}
```

<Image src="./img/resrv-availability-results-extras.webp" alt="An AvailabilityResults component with the Extras enabled." />

## Checking out

The final task of the `AvailabilityResults` component is to let the user start the checkout process. When the user clicks "Book now", the component will create a "Pending" reservation and move the user to the checkout page.

Read along to learn more about the [Checkout](./checkout) component.

## Breaking changes from v5

The "advanced availability" concept has been replaced by collection-scoped [Rates](./rates). On this component that means a few renames you must apply when upgrading:

| v5 | v6 |
| -- | -- |
| `advanced` prop | `rates` prop |
| `overrideProperties` prop | `overrideRates` prop |
| `advancedProperties()` computed | `entryRates()` computed |
| `checkoutProperty()` | `checkoutRate()` |

The rate rows are now rendered by the anonymous `<x-resrv::availability-results-advanced>` component instead of a partial view. If you copied the old advanced sub-view, move your customizations to that component. See [Upgrading to v6](./upgrading) for the full upgrade guide.

## Related components

- [Availability List](./availability-list): list upcoming available dates for a single entry.
- [Availability Collection](./availability-search-multiple#the-availability-collection-component): show availability for many entries at once.
- [Cart booking](./cart-booking): let visitors accumulate multiple rates and dates into one reservation.
