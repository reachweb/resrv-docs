# Availability List Component <Badge type="tip" text="NEW" />

The `AvailabilityList` Livewire component lists the **upcoming available dates** for a single Entry, starting from a date the user picks. Instead of searching a fixed date range, it answers the question "what are the next days I can book?" and presents them as a list the user can click through.

This component has existed since v5.1.0 but was never documented until now.

## How it works

`AvailabilityList` does **not** book directly. It is a date picker that drives an [AvailabilitySearch](./availability-search-component) component:

1. The user picks a *start date* in an `availability-search` (typically a single-date calendar).
2. `AvailabilityList` lists the upcoming available dates from that start date.
3. When the user clicks a date, the component dispatches `availability-date-selected` back to `availability-search`, which sets the date and re-runs the search.
4. Your [AvailabilityResults](./availability-results) component then renders the chosen date and the "Book now" button.

So you always pair it with a search and a results component: the list itself is just a way to surface open dates.

## Basic usage

Include the component on the Entry's page alongside a single-date search:

```antlers
<div class="max-w-md">
    <div class="my-8">
        {{ livewire:availability-search calendar="single" }}
    </div>
    <div class="my-8">
        {{ livewire:availability-list :entry="id" }}
    </div>
</div>
```

The search provides the start date; the list shows the upcoming available dates from there. Add an `availability-results` component to let the user complete the booking once they have clicked a date.

## Component properties

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| entry | string | none - required | **Needs to be a Statamic Entry ID.** The ID of the entry you want to list available dates for. |
| rates | boolean | false | When enabled, the list shows per-[rate](./rates) availability and resolves the rate labels for each date. |
| overrideRates | array | [] | A `rate_id => label` map that overrides the rate labels resolved from the database. |
| groupByDate | boolean | false | When `false`, results are grouped by rate (rate → dates). When `true`, results are grouped by date first (date → rates) and the component renders the `availability-list-by-date` view. |
| view | string | "availability-list" | Override the view used to render the component. Expects a `name.blade.php` file in the `/resources/views/vendor/statamic-resrv/livewire` folder. When `groupByDate` is `true` and `view` is left at its default, the component automatically switches to `availability-list-by-date`. |

::: info
The list uses the `date_start` value from the current search as the date to list *from*. Pair it with a single-date [AvailabilitySearch](./availability-search-single) so the user has a clear "from" date to set.
:::

## Grouping by date

By default the component groups available dates by rate. Set `groupByDate` to `true` to group by date instead, which renders the dedicated `availability-list-by-date` view:

```antlers
{{-- date-first grouping --}}
{{ livewire:availability-list :entry="id" :rates="true" :group-by-date="true" }}
```

In this mode each available date is listed once, with the bookable rates shown beneath it.

## Customizing

Two views back this component, depending on `groupByDate`:

- `/resources/views/vendor/statamic-resrv/livewire/availability-list.blade.php`: the default, grouped by rate. Each date renders as a card with the weekday, day and month, the price, and a low-stock badge (for example "only N left" when stock is low).
- `/resources/views/vendor/statamic-resrv/livewire/availability-list-by-date.blade.php`: used when `groupByDate` is enabled, grouped by date, with each rate rendered as a button under its date.

Publish the frontend views to customize them:

```bash
php artisan vendor:publish --tag=resrv-checkout-views
```

The translation strings used by these views (such as `availableDates`, `availableDatesFrom`, `noAvailableDates`, `pleaseSelectStartDate`, `only`, `left`, `available`, and `optionsAvailable`) live in the published language file. See [Languages](./languages) for how to override them.

## What's next?

Pair this component with an [AvailabilityResults](./availability-results) component so the user can complete the booking after selecting a date, and review the [AvailabilitySearch](./availability-search-component) component for the search options that drive it.
