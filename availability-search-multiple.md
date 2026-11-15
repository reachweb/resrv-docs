# Availability Search for Multiple Entries

This page explains how to list all available Entries for a specific date or dates.

We suggest the built-in [`availability-collection`](#the-availability-collection-component) component. It updates live, supports [Rates](./rates) and needs no extra package. Use the [Collection Tag](#collection-tag-server-rendered) for a server-rendered list without JavaScript, or [Livewire Filters](#livewire-filters-filtering-beyond-dates) if you also filter by other fields.

::: info REPLACES CONNECTED AVAILABILITY
With [Rates](./rates), `availability-collection` replaces the v5 "Connected availabilities" listing. If you are upgrading, read [Upgrading to v6](./upgrading).
:::

## When to use which component

| You want | Use |
|---|---|
| Availability of **one** entry on its page | [`availability-results`](./availability-results) |
| **Upcoming available dates** for one entry | [`availability-list`](./availability-list) |
| A **cart** of several rates or dates for one entry | [`availability-multi-results`](./cart-booking) |
| **Many entries** of a collection, live, no extra package | [`availability-collection`](#the-availability-collection-component) |
| Many entries, with availability as one **filter** among others | [`lf-availability-filter`](#livewire-filters-filtering-beyond-dates) (requires `marcorieser/statamic-livewire-filters`) |
| Many entries, server-rendered with a page reload | [the `resrv_search` collection-tag query scope](#collection-tag-server-rendered) |

## The availability-collection component <Badge type="tip" text="NEW" />

The `availability-collection` Livewire component shows availability for the searched dates across every published entry in a collection, or across entries you pick.

It listens for the `availability-search-updated` event from [`availability-search`](./availability-search-component), checks availability for all entries in **one batched query** and shows a card per entry with a price and a booking button.

### Template setup

Always add an `availability-search` too. It provides the dates, the quantity and, optionally, the rate.

#### All published entries in a collection

```antlers
<livewire:availability-search />
<livewire:availability-collection collection="rooms" />
```

#### A curated subset (explicit entry IDs)

```antlers
<livewire:availability-collection :entries="['id-1', 'id-2', 'id-3']" />
```

#### Collection + IDs (intersection)

Passing both limits the list to those IDs **within** the collection:

```antlers
<livewire:availability-collection collection="rooms" :entries="$featured_ids" />
```

::: warning COLLECTION OR ENTRIES REQUIRED
Pass `collection`, `entries` or both. If both are empty, the component throws an `InvalidArgumentException`.
:::

#### With rates, pagination and price sorting

```antlers
<livewire:availability-search :rates="true" :any-rate="true" />
<livewire:availability-collection
    collection="rooms"
    :rates="true"
    :show-rates="true"
    sort="price"
    rate-sorting="price"
    :paginate="12"
/>
```

`sort` orders the **entries**, and `rate-sorting` orders the **rates within** each entry.

<Image src="./img/resrv-availability-collection.webp" alt="The availability-collection component showing a grid of available entries for the searched dates." />

### Component properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `collection` | string | `null` | Collection handle. Required unless `entries` is set. |
| `entries` | array | `[]` | Entry IDs. With `collection`, only the IDs in that collection are shown. Accepts localized or origin IDs (multisite). |
| `rates` | bool | `false` | Show rate labels. |
| `showRates` | bool | `false` | `true` lists every available rate (label, price and book button) per entry. `false` shows a single "from" price. |
| `showUnavailable` | bool | `false` | `true` shows sold out entries with a "No availability" note. `false` hides them. |
| `paginate` | int | `null` | Page size, using Livewire pagination. |
| `sort` | string | `order` | Orders the **entries**: `order` (collection order, only when `collection` is set), `title`, or `price` (cheapest first). |
| `rateSorting` | string | `order` | Orders the **rates within** each entry: `order` (each rate's configured order, as in [`availability-results`](./availability-results)) or `price` (cheapest first). |
| `overrideRates` | array | `[]` | Your own `rate_id => label` map instead of the labels from [Rates](./rates). |
| `view` | string | `availability-collection` | A custom Blade view. |

### What happens when a visitor selects an entry

When a visitor books, the component calls `select($entryId, $rateId)`:

1. It checks that the entry still belongs in the listing (published, public, current site, in the collection or in `entries`). If not, it shows an error.
2. If a rate was passed, it's saved to the shared `resrv-search` session.
3. **If the entry has a detail page** (`$entry->url()` is set), the visitor goes there. The `#[Session]` search carries over, so the page's [`availability-results`](./availability-results) (or [`availability-multi-results`](./cart-booking)) picks up the booking.
4. **If the entry has no detail page**, the reservation is created right away and the visitor goes to the [checkout](./checkout) entry. Cutoff, availability and price are checked again first.

### Customizing the view

Publish the views:

```bash
php artisan vendor:publish --tag=resrv-checkout-views
```

Then edit `resources/views/vendor/statamic-resrv/livewire/availability-collection.blade.php`, or use your own view: `<livewire:availability-collection ... view="my-view" />`.

The view receives:

- `$this->rows`: a Collection with one row per entry:
  - `id`: the entry ID (pass it to `select()`).
  - `entry`: the Statamic `Entry`.
  - `available`: bool.
  - `from`: the "from" rate row, with `price`, `original_price`, `payment`, `rate_id`, `rateLabel` and `cancellation_policy`.
  - `rates`: every available rate row, in the same shape, for `showRates`.
- `$this->rateLabels`: a `rate_id => label` map, filled only when `rates` or `showRates` is set.
- `$this->resolvedEntries`: the `EntryCollection` or paginator. Call `->links()` on it to render pagination when `paginate` is set.
- `$data`: the current search (`$data->dates`, `$data->quantity`, `$data->rate`, `$data->hasDates()`).

To show a rate's cancellation label, pass its `cancellation_policy` (a `['policy' => string, 'period' => ?int]` array) to `CancellationPolicy::labelFor(...)`. To style the label, `CancellationPolicy::freeCancellationOpen($period, $dateStart)` tells you whether free cancellation is still possible for that check-in. Treat `false` like a non-refundable rate. See [Rates](./rates) to set up policies.

`from` and `rates` have the same shape as [`live_availability`](#accessing-availability-data), so you can share card templates with `lf-availability-filter`.

### Pagination

Set `paginate` on large collections. Entries are paged first (by collection order or title), so availability is only checked for the current page. This also means `sort="price"` only sorts within each page. Render the page links like this:

```blade
@if($this->resolvedEntries instanceof \Illuminate\Contracts\Pagination\Paginator)
    {{ $this->resolvedEntries->links() }}
@endif
```

### Sort vs. rate sorting

`sort` orders the entries in the listing. `rateSorting` orders the rates in each entry's card, and the first rate in that order is the entry's "from" price.

`rateSorting` defaults to `order`, so each entry lists its rates in the same order as on its `availability-results` page. The old listing approach always sorted rates by price. Pass `rate-sorting="price"` to keep that.

A common setup is `sort="price"` with `rate-sorting="order"`. Entries are then sorted by their "from" price, which is the first rate in your configured order and not always the cheapest. [`availability-results`](./availability-results) works the same way.

### Notes & caveats

- Cutoff rules aren't checked in the list. They're checked on `select()` for the chosen entry, where its [cutoff](./cutoff) applies.
- On multisite, availability is stored against origin entry IDs. The component resolves localized entries to their origin, so you can pass either kind of ID in `entries`.

## Alternative approaches

### Collection Tag (server-rendered)

If you don't need live refresh, use the regular [Collection Tag](https://statamic.dev/tags/collection) with the `resrv_search` query scope to list only the available entries.

A basic example would look like this:

```antlers{3,7,18}
<div class="container mx-auto my-12 flex">
    <div class="w-96">
        {{ livewire:availability-search calendar="range" live="false" :redirectTo="url" }}
    </div>
    <div class="pl-12 xl:pl-16 w-full flex-shrink">
        <div class="grid grid-cols-2 gap-4 xl:gap-8">
            {{ collection:rooms as="rooms" query_scope="resrv_search" resrv_search:resrv_availability="{ session:resrv-search }" }}
                {{ if no_results }}
                    <p>No rooms are available for these dates.</p>
                {{ /if }}
                {{ rooms }}
                    <a class="bg-gray-50 rounded-lg p-8 w-full" href="{{ url }}">
                        <div class="text-xl font-bold">
                            {{ title }}
                        </div>                
                    </a>
                {{ /rooms }}
            {{ /collection:rooms }}
        </div>
    </div>
</div>
```

::: tip
You need to also send the session data along (the `resrv_search:resrv_availability="{ session:resrv-search }"` part). Even though this could have been done in the query scope itself, because of the way Livewire works, we cannot trust that the session data of the Livewire component is the same as the user's.
:::

This will display an `AvailabilitySearch` component on the side, without live refresh. When a user clicks "Search", they will be redirected back to the same page and the `resrv_search` query scope will filter out any unavailable entries for the dates selected.

### Livewire Filters (filtering beyond dates)

[Livewire Filters](https://livewirefilters.com/), another product of ours, filters Statamic collections live by almost any field. Use it when you also want to filter by fields like amenities or price range, with availability as one more filter.

::: warning REQUIRES AN EXTRA PACKAGE
This needs `marcorieser/statamic-livewire-filters`. Resrv only registers the `lf-availability-filter` component when that package is installed. If you only filter by availability, use [`availability-collection`](#the-availability-collection-component) or the [Collection Tag](#collection-tag-server-rendered) instead.
:::

Once you [install the addon](https://livewirefilters.com/docs/v1/installation), Resrv registers a Livewire component called `LfAvailabilityFilter`. It includes `AvailabilitySearch` and ties it to the `LivewireCollection` component from Livewire Filters:

```antlers{3-7,10}
<div class="container mx-auto my-12 flex">
    <div class="w-96">
        {{ livewire:lf-availability-filter
            blueprint="rooms.room"
            calendar="range"
            enableQuantity="true"
        }}
    </div>
    <div class="pl-12 xl:pl-16 w-full flex-shrink">
        {{ livewire-collection:rooms query_scope="resrv_search" resrv_search:resrv_availability="{ session:resrv-search }" }}
    </div>
</div>
```

`LfAvailabilityFilter` accepts the same properties as the [AvailabilitySearch](./availability-search-component) component, plus a `blueprint` property set to `collection.blueprint`. The `resrv_search` query scope then filters out the unavailable entries. Edit your `LivewireCollection` view at `resources/views/vendor/statamic-livewire-filters/livewire/livewire-collection.blade.php` to change how entries render. See the [Livewire Filters docs](https://livewirefilters.com/docs/v1/overview) for the rest of the setup.

If your entries use [Rates](./rates), add `:rates="true"` to get rate labels in `live_availability` (see below):

```antlers{4}
{{ livewire:lf-availability-filter
    blueprint="rooms.room"
    calendar="range"
    :rates="true"
}}
```

### Accessing availability data

When an `AvailabilitySearch` is active, a hook is triggered that adds the availability data into each Entry so that you can use it in your templates. The data is added as an array passed through under the `live_availability` key of the entry.

It has the following properties:

| Property | Description |
| -------- | ----------- |
| price | The total price of the Entry for the given dates. |
| original_price | The starting price if [Dynamic Pricing](./dynamic-pricing) is active. |
| payment | What the user needs to pay to book this Entry (check the Settings for more info). |
| rate_id | The ID of the [rate](./rates), when rates are used. |
| rateLabel | The label of the above rate. |
| cancellation_policy | The rate's cancellation terms, as `policy` and `period`. |

::: info MULTIPLE RATES PER ENTRY
With [rates](./rates) enabled, an entry with several available rates gets a **collection of rows** in `live_availability`, one per rate. With only one matching rate, it holds that row directly. Loop over it if you expect more than one rate.
:::

When the availability data is provided, you can use it like so:

```antlers{11-15}
[...]
{{ collection:rooms as="rooms" query_scope="resrv_search" resrv_search:resrv_availability="{ session:resrv-search }" }}
    {{ if no_results }}
        <p>No rooms are available for these dates.</p>
    {{ /if }}
    {{ rooms }}
        <a class="bg-gray-50 rounded-lg p-8 w-full" href="{{ url }}">
            <div class="text-xl font-bold">
                {{ title }}
            </div>
            {{ if live_availability }}
            <span class="text-sm text-gray-500 mt-2">
                Price: ${{ live_availability:price }}
            </span>
            {{ /if }}            
        </a>
    {{ /rooms }}
{{ /collection:rooms }}
[...]
```

::: tip
The method above works for both the **Collection Tag** and the **Livewire Filters** approaches.
:::

## Related

- [Availability Search component](./availability-search-component): the search props these approaches share.
- [Rates](./rates): how rates replace "advanced availability".
- [Availability Results](./availability-results), [Availability List](./availability-list) and [Cart Booking](./cart-booking): the other availability components.
