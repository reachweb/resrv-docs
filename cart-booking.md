# Cart Booking Component <Badge type="tip" text="NEW" />

The `AvailabilityMultiResults` Livewire component is a cart-based booking surface for a **single Entry**. Instead of booking one date range and one rate at a time, the visitor can pick **quantities per rate**, add those selections to a running booking, change the dates and add more, and finally check out everything as a **single reservation**.

This is ideal for excursions, tours, classes, or any product where a customer books several units (or several dates) in one go. For the simpler one-rate / one-date flow, use the [Availability Results](./availability-results) component instead.

## Component basics

Pair the component with an [Availability Search](./availability-search-component) instance so the visitor can pick dates and quantities. In its most basic form:

```antlers
<livewire:availability-search :rates="true" :any-rate="true" />
<livewire:availability-multi-results :entry="id" />
```

Because the component is rate-driven, the `availability-search` it is paired with should run with `:rates="true"` and `:any-rate="true"` so that every rate is returned for the searched dates.

A common pattern is to loop a collection and render a multi-results block per entry:

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
| entry | string | none - required | **Needs to be a Statamic Entry ID.** The Entry the cart books against. Passed as the `mount` parameter. |
| rates | boolean | true | Defaults to `true` here: the component is rate-driven and always resolves per-rate labels and prices. |
| showExtras | boolean or string | false | Show the Extras component inside the cart panel. Set to `true` for all extras, or a filter slug. (more information below) |
| showOptions | boolean or string | false | Show the Options component inside the cart panel. Set to `true` for all options, or a filter slug. (more information below) |
| overrideRates | array | [] | Override the `rate_id => label` map instead of resolving labels from the Rate model. |
| view | string | "availability-multi-results" | You can override the view that is used to render the component. Expects a `name.blade.php` file in the `/resources/views/vendor/statamic-resrv/livewire` folder. |

::: info NO `showRates` PROP
Unlike the [Availability Collection](./availability-search-multiple#the-availability-collection-component) component, `availability-multi-results` does **not** have a `showRates` property. It always renders every available rate with its own quantity picker.
:::

## The cart flow

The component renders three areas that work together:

1. **Per-rate quantity pickers.** Once the visitor searches, each available rate is shown with its label, the per-unit price, an optional [cancellation policy](./rates#cancellation-policy) label, and `-` / `+` buttons to set a quantity. Availability is always queried at quantity 1 so the displayed prices are per unit; the customer picks the quantity afterwards.
2. **Add to booking.** When at least one rate has a quantity greater than zero, an **"Add to booking"** button appears. Clicking it pushes every selected rate (with its dates, rate, quantity, and price) into the cart and resets the pickers.
3. **Your booking.** Once the cart has any selections, a **"Your booking"** panel lists every line item (rate label, quantity, date range, and line total) with a remove button, a running **Total**, a **Clear** link, and a **"Book now"** button.

Because the dates come from the paired `availability-search`, the visitor can **change the dates and add more selections** to the same cart. Each "Add to booking" appends to the existing cart rather than replacing it, so a single booking can span several different date ranges and rates.

Clicking **Book now** validates the whole cart, creates the reservation, and redirects the visitor to the [Checkout](./checkout) page.

<Image src="./img/resrv-availability-multi-results.webp" alt="An AvailabilityMultiResults component showing per-rate quantity pickers and a running booking cart." />

## Extras and Options (Optional)

Like the [Availability Results](./availability-results) component, you can display the Entry's Extras and Options inline. Here they render inside the "Your booking" cart panel and their pricing is recalculated against every selection in the cart:

```antlers
<livewire:availability-multi-results :entry="id" :show-extras="true" :show-options="true" />
```

The selected extras and options are carried over to the [Checkout](./checkout) component as usual.

## How the reservation is structured

When the visitor checks out, the cart is converted into a reservation that the normal checkout flow understands without any special handling:

- **One parent reservation** is created. It stores the overall total price and the overall date span.
- **One child reservation per cart selection** is created, each with its own dates, rate, quantity, and price.

The event-driven reservation lifecycle handles the rest: availability is decreased per child when the reservation is created, and increased again per child if it expires or is cancelled. The [Checkout](./checkout) component treats the parent reservation exactly like a normal single reservation, so the whole cart is paid for in one transaction.

::: info DATABASE MIGRATION
This feature adds a `price` column to the `resrv_child_reservations` table. The migration runs automatically with the package migrations; existing child reservation rows get `price = null`.
:::

## How the cart is scoped to one entry

The cart lives in the session and is scoped to the Entry that owns it. Three session keys are used:

- `resrv-search`: the shared search state (dates, quantity, rate).
- `resrv-multi-selections`: the cart itself.
- `resrv-multi-cart-entry`: which Entry owns the cart.

When you visit a different Entry's multi-results page, the component detects that the persisted cart belongs to another Entry (or to none) and starts clean, so a cart never leaks between Entries. After checkout the cart and its owner are cleared, while any selected extras and options are left in the session for the Checkout component to copy onto the reservation.

## Customizing

The main template file can be found at `/resources/views/vendor/statamic-resrv/livewire/availability-multi-results.blade.php`. Publish the views first if you haven't already (either [during installation](./installation) or by running `php artisan vendor:publish --tag=resrv-checkout-views`), then edit the file to choose which elements to display and how to style them.

## Translations

The component uses these frontend translation keys, which you can override as described in the [Languages](./languages) page:

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

The optional cancellation policy label also uses the cancellation keys (`nonRefundable`, `freeCancellationUntilDate`) documented on the [Rates](./rates#cancellation-policy) page.
