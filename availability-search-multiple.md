# Availability Search for Multiple Entries

This page explains how to let your users search across many Entries at once and list only the ones that are available for a specific date or dates.

v6 ships a built-in [`availability-collection`](#the-availability-collection-component) Livewire component that lists availability for a whole collection (or a curated set of entries) live, with **no extra package** and full [Rates](./rates) support. It is the recommended approach. The older [Collection Tag](#collection-tag-server-rendered) and [Livewire Filters](#livewire-filters-filtering-beyond-dates) patterns are still fully supported when you need a no-JavaScript, server-rendered list or faceted filtering beyond dates.

::: info REPLACES CONNECTED AVAILABILITY
With [Rates](./rates), the `availability-collection` component is the v6 replacement for the old "Connected availabilities" listing approach. If you are upgrading an existing site, read [Upgrading to v6](./upgrading).
:::

## When to use which component

Resrv ships several frontend surfaces for showing availability. Pick the one that matches your use case:

| You want… | Use |
|---|---|
| Availability of **one** entry on its detail page | [`availability-results`](./availability-results) |
| A list of **upcoming available dates** for one entry | [`availability-list`](./availability-list) |
| A multi-rate / multi-date **cart** for one entry | [`availability-multi-results`](./cart-booking) |
| **Many entries** of a collection, live, no extra package | [`availability-collection`](#the-availability-collection-component) |
| Many entries, with availability as one **filter facet** alongside taxonomies/ranges | [`lf-availability-filter`](#livewire-filters-filtering-beyond-dates) (requires `marcorieser/statamic-livewire-filters`) |
| Many entries, server-side, full page reload acceptable | [the `resrv_search` collection-tag query scope](#collection-tag-server-rendered) |

`availability-collection` is the no-package, live answer to "show me the entries available for these dates". For richer faceted filtering, reach for `lf-availability-filter`.

## The availability-collection component <Badge type="tip" text="NEW" />

The `availability-collection` Livewire component shows the availability of **many entries at once**, a curated set of entries, or every published entry in a collection, for the dates the visitor searched. It is live (no page reload) and needs **no extra package**.

It pairs with [`availability-search`](./availability-search-component): the search component dispatches an `availability-search-updated` event, and `availability-collection` listens for it, runs a **single batched availability query** for the whole set, and renders one card per entry with a price and a booking action.

### Template setup

The component always works alongside an `availability-search` instance, which provides the dates, quantity and (optionally) the rate the visitor searched for.

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

Passing both narrows to the given IDs **within** that collection:

```antlers
<livewire:availability-collection collection="rooms" :entries="$featured_ids" />
```

::: warning COLLECTION OR ENTRIES REQUIRED
You must pass at least one of `collection` or `entries`. The component throws an `InvalidArgumentException` if both are empty.
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

`sort` orders the **entries**; `rate-sorting` orders the **rates within** each entry. They are independent: see the properties table below.

<Image src="./img/resrv-availability-collection.webp" alt="The availability-collection component showing a grid of available entries for the searched dates." />

### Component properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `collection` | string | `null` | Collection handle. Required unless `entries` is given. |
| `entries` | array | `[]` | Explicit entry IDs. Combined with `collection`, the two intersect. Accepts localized or origin IDs (multisite). |
| `rates` | bool | `false` | Resolve per-entry rate labels. |
| `showRates` | bool | `false` | `true` lists every available rate (label + price + book button) per entry; `false` shows a single cheapest "from" price. |
| `showUnavailable` | bool | `false` | `false` hides sold-out entries; `true` renders them with a "No availability" note. |
| `paginate` | int | `null` | Page size. Uses Livewire pagination; availability is still fetched in one batched query per page. |
| `sort` | string | `order` | Orders the **entries**: `order` (collection order, only honoured when `collection` is set), `title`, or `price` (cheapest first). |
| `rateSorting` | string | `order` | Orders the **rates within** each entry: `order` (each rate's configured order, matching [`availability-results`](./availability-results)) or `price` (cheapest first). Independent of `sort`. |
| `overrideRates` | array | `[]` | Override the `rate_id => label` map instead of resolving from the [Rates](./rates). |
| `view` | string | `availability-collection` | Use a fully custom Blade view. |

### What happens when a visitor selects an entry

When a visitor books, the component calls `select($entryId, $rateId)`:

1. The chosen entry is re-validated against the listing filters (published, public, current site, in the collection / in `entries`) to reject stale or forged IDs. If it is out of scope, an error is shown.
2. If a rate was passed, it is written to the shared `resrv-search` session.
3. **If the entry has a detail page** (`$entry->url()` is set), the visitor is **redirected** there. The `#[Session]` search carries over, so the detail page's [`availability-results`](./availability-results) (or [`availability-multi-results`](./cart-booking)) rehydrates from the session and continues the booking.
4. **If the entry has no detail page**, a reservation is created **immediately** and the visitor is sent straight to the [checkout](./checkout) entry. Cutoff and availability/price are re-validated at this step.

This redirect-vs-direct-book split is what lets the same collection listing drive either a "browse then open the detail page" flow or a one-click "book from the grid" flow, depending on whether your entries have detail pages.

### Customizing the view

Publish the views to override them:

```bash
php artisan vendor:publish --tag=resrv-checkout-views
```

…then edit `resources/views/vendor/statamic-resrv/livewire/availability-collection.blade.php`. Or point the component at your own view: `<livewire:availability-collection ... view="my-view" />`.

The view receives:

- `$this->rows`: a Collection, one row per entry to render:
  - `id`: the entry id (pass to `select()`),
  - `entry`: the Statamic `Entry` (title, url, fields, thumbnail…),
  - `available`: bool,
  - `from`: the cheapest / order-first available rate row: `price`, `original_price`, `payment`, `rate_id`, `rateLabel`, `cancellation_policy`,
  - `rates`: a Collection of every available rate row (same shape), for `showRates`.
- `$this->rateLabels`: a `rate_id => label` map (populated only when `rates` or `showRates` is set).
- `$this->resolvedEntries`: the underlying `EntryCollection` or paginator. Call `->links()` on it to render pagination when `paginate` is set.
- `$data`: the current search (`$data->dates`, `$data->quantity`, `$data->rate`, `$data->hasDates()`).

Each rate row's `cancellation_policy` key holds a `['policy' => string, 'period' => ?int]` array; pass it to `CancellationPolicy::labelFor(...)` to render a "Free cancellation until…" or "Non-refundable" line. See the [Rates](./rates) page for how the per-rate policy is configured.

The per-entry `from`/`rates` shape matches the [`live_availability`](#accessing-availability-data) value used by the Livewire-Filters integration, so card templates can be shared between this component and `lf-availability-filter`.

### Pagination

Set `paginate` to a page size to bound the work on large collections. Entries are paginated **first** (using `sort`), and the batched availability query then runs only for the current page. Render the page links from the resolved paginator:

```blade
@if($this->resolvedEntries instanceof \Illuminate\Contracts\Pagination\Paginator)
    {{ $this->resolvedEntries->links() }}
@endif
```

### Sort vs. rate sorting

The two ordering controls are fully independent:

- **`sort`** orders the **entries** in the listing: by collection `order`, by `title`, or by `price`.
- **`rateSorting`** orders the **rates inside** each entry's card (only relevant with `showRates`): by each rate's configured `order`, or by `price`.

A common combination is `sort="price"` to surface the cheapest entries first while keeping `rate-sorting="order"` so each card lists its rates in your configured sequence.

### Notes & caveats

- **Cutoff rules** are not applied to the at-a-glance list; they are re-checked on `select()` for the chosen entry, where a per-entry [cutoff](./cutoff) is meaningful.
- **Large collections**: every search prunes stale holds and scans reservations. Use `paginate` to bound the work: entries are paginated first, so the batched availability query only runs for the current page.
- **`sort="price"`** sorts within the resolved set. With `paginate`, that means within the current page (entries are paged by collection order/title before availability is known).
- **`rateSorting` defaults to `order`** so a collection listing shows each entry's rates in the same sequence as that entry's `availability-results` detail page. Pass `rate-sorting="price"` for cheapest-first rate ordering. (This is a behaviour change: the old listing approach always sorted rates by price.)
- **`sort="price"` with `rate-sorting="order"`** orders entries by each entry's *order-first* ("from") price rather than its cheapest price, because the "from" price is the first rate under the chosen rate ordering, the same coupling [`availability-results`](./availability-results) already has.
- **Multisite**: availability is stored against origin entry IDs. The component resolves localized entries to their origin automatically; pass either localized or origin IDs in `entries`.

## Alternative approaches

The `availability-collection` component above covers most multi-entry listings. Two older patterns remain useful in specific cases: a fully server-rendered list with no JavaScript, and faceted filtering by fields other than dates.

### Collection Tag (server-rendered)

If you don't want to use Livewire or don't need the live refresh, you can use the regular [Collection Tag](https://statamic.dev/tags/collection) to list all available entries. Apply the same `resrv_search` query scope to filter out the entries that are not available for the selected dates.

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

Reach for **Livewire Filters** when you need to filter your entries by fields **other than** date-availability (number of guests, amenities, taxonomies, price ranges and so on) with live, "no reload" facets. It combines Statamic Resrv with another product of ours, [Livewire Filters](https://livewirefilters.com/), which lets you filter your Statamic collections by almost any field. Availability becomes just one facet alongside the rest.

::: warning REQUIRES AN EXTRA PACKAGE
This integration only works when `marcorieser/statamic-livewire-filters` is installed. Statamic Resrv registers the `lf-availability-filter` component conditionally: it only exists once that package is present. If you just need availability filtering (no other facets), use [`availability-collection`](#the-availability-collection-component) or the [Collection Tag](#collection-tag-server-rendered) above instead.
:::

Once you [install the addon](https://livewirefilters.com/docs/v1/installation), Statamic Resrv detects it and registers an extra Livewire component called `LfAvailabilityFilter`, which includes `AvailabilitySearch` and ties it to the `LivewireCollection` component Livewire Filters provides:

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

`LfAvailabilityFilter` accepts the same properties as the [AvailabilitySearch](./availability-search-component) component, plus a `blueprint` property set to `collection.blueprint`. It uses the `resrv_search` query scope to filter out entries that aren't available for the selected dates. Edit your `LivewireCollection` view at `resources/views/vendor/statamic-livewire-filters/livewire/livewire-collection.blade.php` to control how each entry renders. See the [Livewire Filters docs](https://livewirefilters.com/docs/v1/overview) for the full filtering setup.

If your entries use [Rates](./rates), add `:rates="true"` so the search resolves rate labels for each entry, exposed in `live_availability` (see below):

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
| rate_id | The ID of the [rate](./rates) this row refers to when rates are used. |
| rateLabel | The label of the above rate. |
| cancellation_policy | The cancellation terms for this rate, as `policy` and `period`. |

::: info MULTIPLE RATES PER ENTRY
When [rates](./rates) are enabled and an entry has more than one available rate for the search, `live_availability` holds a **collection of rows** (one per available rate) instead of a single row. When only one rate matches, it holds that single row directly. Loop over it in your template when you expect more than one rate.
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

- [Availability Search component](./availability-search-component): all the search props shared by these approaches.
- [Rates](./rates): how rates replace the old "advanced availability" concept.
- [Availability Results](./availability-results), [Availability List](./availability-list) and [Cart Booking](./cart-booking): the other frontend availability surfaces.
