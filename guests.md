# Guests Component

A common use case for reservation systems is to capture the total number of guests for a reservation. Often, you may also need to know the type of guests (e.g., adults, children, etc.). To help with this, we've created the Guests Blade component.

::: warning YOU MIGHT NOT NEED THIS
If you only need the total number of guests, the quantity control in the [Availability Search](./availability-search-component) component should suffice. It allows you to manage availability based on the number of guests or products booked. This component is useful in cases where you need more detailed guest information, such as having 2 adults and 1 child in a room.
:::

## Basics

The Guests component is a standard Blade component that uses AlpineJS. You can find it in the `resources/views/vendor/statamic-resrv/livewire/components/availability-guests.blade.php` file. The default version allows you to specify the number of adults, children, and infants for a reservation.

The following properties must be set:

| Property    | Type    | Description                                |
| ----------- | ------- | ------------------------------------------ |
| maxAdults   | integer | The maximum allowed number of adults.      |
| maxChildren | integer | The maximum allowed number of children.    |
| maxInfants  | integer | The maximum allowed number of infants.     |

The component needs to run *inside* the `AvailabilitySearch` component. Here is an example:

```blade (14-19)
<!-- resources/views/vendor/statamic-resrv/livewire/availability-search.blade.php -->
<div class="relative">
    <div class="text-lg font-medium mb-4">Availability Search</div>
    <div class="mb-4">
        <div class="text-sm font-medium uppercase mb-1">Your Dates</div>
        <x-resrv::availability-dates
            :$calendar
            class="w-full"
            :errors="$errors"
        />
    </div>

    <div class="mb-4">
        <div class="text-sm font-medium uppercase mb-1">Guests</div>
        <x-resrv::availability-guests
            maxAdults="4"
            maxChildren="2"
            maxInfants="2"
        />
    </div>    

    @if ($live === false)
    <x-resrv::availability-button />
    @endif
</div>
```

This example above will display this component and dropdown in the search form:

<Image src="./img/resrv-guests-component.webp" alt="The Guests component in the search form." />

## Setting up the checkout form

If you explore the Guests component code, you'll notice that it binds various properties to the `data.customer` object. As mentioned in the [Availability Search](./availability-search-component#passing-data-to-checkout) page, the `data.customer` object can hold data by saving it to the session, which will then be passed to the checkout page and set into the customer's form.

To ensure this component functions as expected, you need to create hidden text fields in your checkout form with the handles `adults`, `children`, and `infants`.

## Binding to the quantity

What about cases that you might want to charge by the number of guests but you also need to know the number of adults, children, and infants? You can bind the total number of guests to the quantity.

Here is an example based on the default code of the Guests component:

```js
Alpine.data('guests', () => ({
    adults: $wire.data.customer.adults,
    children: $wire.data.customer.children,
    infants: $wire.data.customer.infants,
    totalQuantity: $wire.entangle('data.quantity').live, // [!code highlight]
    guestsPopup: false,

    init() {
        if (this.adults === undefined) {
            this.adults = 1;
            $wire.set('data.customer.adults', 1);
            this.setTotalQuantity(); // [!code highlight]
        }
        if (this.children === undefined) {
            this.children = 0;
            $wire.set('data.customer.children', 0);
            this.setTotalQuantity(); // [!code highlight]
        }
        if (this.infants === undefined) {
            this.infants = 0;
            $wire.set('data.customer.infants', 0);
            this.setTotalQuantity(); // [!code highlight]
        }
        this.$watch('adults', value => {
            $wire.set('data.customer.adults', value);
            this.setTotalQuantity(); // [!code highlight]
        });

        this.$watch('children', value => {
            $wire.set('data.customer.children', value);
            this.setTotalQuantity(); // [!code highlight]
        });

        this.$watch('infants', value => {
            $wire.set('data.customer.infants', value);
            this.setTotalQuantity(); // [!code highlight]
        });
    },

    setTotalQuantity() { // [!code highlight]
        this.totalQuantity = this.adults + this.children + this.infants; // [!code highlight]
    }, // [!code highlight]

    // more code here
}));
```
