# Global Configuration

Statamic Resrv has quite a few configuration options that you can set in the addon's configuration page. In this page, we will go through most of them one by one.

You can find the configuration page in Statamic's Control Panel under the "Settings" section.

## General Information

Here you can set some general contact information that will be used in the Reservation emails that are automatically sent to the user.

::: warning
The "Logo" field doesn't work yet, please check the email configuration page to see how to add a logo manually.
:::

## Reservation Settings

- **Enable advanced availability**: This enables advanced availability globally. Check the [Availability docs](./availability#advanced-availability) for more information.

- **Enable connected advanced availabilities**: This enables connected availabilities globally. Again, you should check the [Availability docs](./availability#connected-availabilities) for more information.

- **Enable time**: This allows you to set the starting and ending time of a reservation and charge extra. This feature is not yet implemented in the frontend.

- **Enable affiliates**: This enables the Affiliate system.

- **Minimum days before**: The minimum number of days allowed between the current date and the reservation start date. Useful if you don't want to allow last-minute reservations.

- **Minimum reservation period (in days)**: In scenarios like a hotel where reservations span multiple dates, you can set here the minimum required number of days.

- **Maximum reservation period (in days)**: The same for maximum reservation period.

- **Free cancellation (in days)**: The number of days before the reservation start date that the user can cancel the reservation. Please note that cancellations are manual; this is mainly used to display that info in the frontend.

- **Require full payment if free cancellation has passed**: If the free cancellation period has passed when the user makes the reservation, you can require full payment (in case you're not already doing that).

- **Maximum quantity**: This is the maximum quantity allowed in one reservation.

- **Ignore quantity for prices**: In case you want to keep track of the quantity but not charge extra for it, you can set this to true. For example, you might want to charge $20 for a reservation at a restaurant and allow 20 seats, but not charge extra for each seat.

- **Calculate days using time**: If *enable time* is enabled, this will charge an extra day if the ending time is after the starting time. For example, if you give a car at 12:00 and it is returned at 18:00, you will charge an extra day. Not yet implemented in the frontend.

- **Decrease availability for extra time**: Tied to the setting above, this will block availability for the final day if the return time is after the starting time.

- **Admin email**: Comma-separated list of the emails that should be notified for reservations.

## Checkout Settings

- **Form name**: The handle of the [form you want to use during checkout](./checkout#checkout-form). The default is "checkout" and should work out of the box.

- **Payment type**: Here you can select what the user will pay online. You can choose between paying everything (reservation plus any extras and options), the reservation price only, a percentage of the reservation price, or a fixed amount.

- **Minutes to hold**: When a user initiates a checkout, the availability for their reservation is temporarily blocked for the given number of minutes. This helps to prevent double bookings, especially when availability is low. If the user skips the checkout and returns to the site, the availability will be restored instantly when he performs a new availability search.

## Livewire checkout settings

Here you need to select the Entries that hold the [Checkout Livewire component](./checkout#checkout-component) and the [Checkout Complete Tag](./checkout#checkout-complete).

## Currency settings

Here you can set the currency that will be used site-wide.