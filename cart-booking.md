# Cart Booking Component <Badge type="tip" text="NEW" />

The `AvailabilityMultiResults` Livewire component works like a cart for a **single Entry**. Visitors pick **quantities per rate**, add them to the booking, change the dates and add more, then check out everything as a **single reservation**.

For one rate and one date range, use the [Availability Results](./availability-results) component instead.

## Component basics

Pair it with an [Availability Search](./availability-search-component) that uses `:rates="true"` and `:any-rate="true"`, so every rate is returned:

```antlers
<livewire:availability-search :rates="true" :any-rate="true" />
<livewire:availability-multi-results :entry="id" />
```

To show one per entry, loop over a collection:

```antlers
{{ collection:excursions }}
    <livewire:availability-search :entry="id" :rates="true" :any-rate="true" />
    <livewire:availability-multi-results :entry="id" />
{{ /collection:excursions }}
```

Both the `<livewire:...>` and the Antlers <code v-pre>{{ livewire:... }}</code> syntaxes work.

## Component properties

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| entry | string | none - required | **Needs to be a Statamic Entry ID.** The Entry the cart books. |
| rates | boolean | true | Defaults to `true` here, because the component always shows per-rate labels and prices. |
| showExtras | boolean or string | false | Show Extras in the cart panel. Set to `true` for all extras, or a filter slug. (more information below) |
| showOptions | boolean or string | false | Show Options in the cart panel. Set to `true` for all options, or a filter slug. (more information below) |
| overrideRates | array | [] | Your own `rate_id => label` map, instead of the labels from the Rate model. |
| view | string | "availability-multi-results" | You can override the view that is used to render the component. Expects a `name.blade.php` file in the `/resources/views/vendor/statamic-resrv/livewire` folder. |

::: info NO `showRates` PROP
Unlike [Availability Collection](./availability-search-multiple#the-availability-collection-component), this component has no `showRates` property. Every available rate always gets its own quantity picker.
:::

## The cart flow

The component has three parts:

1. **Quantity pickers.** After a search, each available rate shows its label, unit price, an optional [cancellation policy](./rates#cancellation-policy) label, and `-` / `+` buttons. Availability is checked at quantity 1, so prices are per unit.
2. **Add to booking.** Once a rate has a quantity, an **"Add to booking"** button appears. It adds the selected rates to the cart and resets the pickers.
3. **Your booking.** Lists each line (rate, quantity, dates and line total) with a remove button, plus the **Total**, a **Clear** link and a **"Book now"** button.

Visitors can change the dates in the search and add more, so one booking can cover several date ranges and rates.

**Book now** validates the cart, creates the reservation and sends the visitor to the [Checkout](./checkout) page.

<Image src="./img/resrv-availability-multi-results.webp" alt="An AvailabilityMultiResults component showing per-rate quantity pickers and a running booking cart." />

## Extras and Options (Optional)

As with [Availability Results](./availability-results), you can show the Entry's Extras and Options. They appear in the "Your booking" panel and are priced against every selection in the cart:

```antlers
<livewire:availability-multi-results :entry="id" :show-extras="true" :show-options="true" />
```

The selected extras and options carry over to the [Checkout](./checkout) component as usual.

## How the reservation is structured

When the visitor books, the cart is saved as:

- **One parent reservation** holds the total price and the overall date span.
- **One child reservation per cart line** holds its own dates, rate, quantity and price.

Availability is reduced for each child when the reservation is created, and restored for each child if it expires or is cancelled. The [Checkout](./checkout) component treats the parent like any other reservation, so the whole cart is paid in one transaction.

::: info DATABASE MIGRATION
This feature adds a `price` column to the `resrv_child_reservations` table. It runs with the package migrations, and existing child reservations get `price = null`.
:::

## How the cart is scoped to one entry

The cart is stored in the session and belongs to one Entry. It uses three session keys:

- `resrv-search`: the shared search (dates, quantity, rate).
- `resrv-multi-selections`: the cart.
- `resrv-multi-cart-entry`: the Entry that owns the cart.

If a visitor opens a different Entry's page, the component starts an empty cart. After checkout the cart is cleared, but the selected extras and options stay in the session so the Checkout component can copy them onto the reservation.

## Customizing

The main template file is `/resources/views/vendor/statamic-resrv/livewire/availability-multi-results.blade.php`. Publish the views first if you haven't already, either [during installation](./installation) or with `php artisan vendor:publish --tag=resrv-checkout-views`.

## Translations

You can override these frontend keys as described in the [Languages](./languages) page:

| Key | Default |
| --- | ------- |
| `addToBooking` | Add to booking |
| `yourBooking` | Your booking |
| `total` | Total |
| `clear` | Clear |
| `bookNow` | Book now |
| `pleaseSelectRateToBook` | Please select a rate to book |
| `pleaseSelectDates` | Please select dates to search for availability. |
| `noAvailability` | No availability |
| `searchError` | Search error |
| `youAreTooLate` | You are too late! |

The cancellation label also uses the `nonRefundable` and `freeCancellationUntilDate` keys. See [Rates](./rates#cancellation-policy).
