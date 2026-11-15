# Availability Results Component

The `AvailabilityResults` Livewire component handles displaying the results of an availability search and lets the user start the checkout process. This page explains how to use it and how to provide extra functionality.

::: warning UPGRADING FROM v5
v6 renames the "advanced availability" props to match [Rates](./rates). If you used `advanced` or `:overrideProperties`, or copied the advanced sub-view, see [Breaking changes from v5](#breaking-changes-from-v5).
:::

## Component basics

This component is designed to work for a **single Entry**. To show many entries at once, see the [Availability Collection](./availability-search-multiple#the-availability-collection-component) component. To let visitors book several rates or dates together, see [Cart booking](./cart-booking).

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
| rates | boolean | false | Shows the [rate](./rates) labels. If the search is for any rate (`rate=any`), every available rate gets its own price and "Book now" button. |
| rateSorting | string | "order" | The order of the rate rows. `"order"` follows each rate's configured order, `"price"` puts the cheapest first. |
| showExtras | boolean or array | false | If you want to display an Extras select box here, you can set this to true to show all extras or an array of the IDs you want to display. (more information below) |
| showOptions | boolean or array | false | If you want to display an Options select box here, you can set this to true to show all options for this Entry or an array of the IDs you want to display. (more information below) |
| overrideRates | array | [] | Your own `rate_id => label` map to replace the rate labels. |
| view | string | "availability-results" | You can override the view that is used to render the component. Expects a `name.blade.php` file in the `/resources/views/vendor/statamic-resrv/livewire` folder. |

## Working with rates

If an Entry has more than one [rate](./rates), set `rates="true"` to show each rate's label and price:

```antlers
{{ livewire:availability-search :rates="true" :any-rate="true" }}
{{ livewire:availability-results :entry="id" :rates="true" }}
```

When the search is for any rate, each available rate gets its own row and the visitor picks one. To list the cheapest rate first, set `rateSorting` to `"price"`:

```antlers
{{ livewire:availability-results :entry="id" :rates="true" rateSorting="price" }}
```

### The rates sub-view

The rate rows are rendered by the anonymous Blade component `<x-resrv::availability-results-advanced>` (`availability-results-advanced.blade.php`). The main view calls it like this:

```blade
<x-resrv::availability-results-advanced
    :$availability
    :entryRates="$this->entryRates"
    :dateStart="$data->dates['date_start'] ?? null" />
```

It lists each rate with its label (from `entryRates`), price and cancellation label, and books it with `wire:click="checkoutRate('{rateId}')"`. Only the filename still says "advanced".

## Cancellation policy

Rates with a cancellation policy show a label:

- **Non-refundable** for non-refundable rates.
- **Free cancellation until \<date\>** for rates with a free cancellation period. The date is the check-in date minus that period.
- **No free cancellation for these dates** when that date has already passed. The rate is still refundable for later check-ins, so this isn't the non-refundable label. To style it differently in a custom view, check `CancellationPolicy::freeCancellationOpen()`.

Rates on the global default with no period show no label. The policy is in each rate row's `data` as `cancellation_policy`, a `['policy', 'period']` array. See [Rates](./rates) to set it.

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

v6 replaces "advanced availability" with collection-scoped [Rates](./rates). Apply these renames when you upgrade:

| v5 | v6 |
| -- | -- |
| `advanced` prop | `rates` prop |
| `overrideProperties` prop | `overrideRates` prop |
| `advancedProperties()` computed | `entryRates()` computed |
| `checkoutProperty()` | `checkoutRate()` |

If you copied the old advanced sub-view, move your changes to the anonymous `<x-resrv::availability-results-advanced>` component, which replaces that partial view. See [Upgrading to v6](./upgrading) for the full upgrade guide.

## Related components

- [Availability List](./availability-list): upcoming available dates for one entry.
- [Availability Collection](./availability-search-multiple#the-availability-collection-component): availability for many entries at once.
- [Cart booking](./cart-booking): several rates and dates in one reservation.
