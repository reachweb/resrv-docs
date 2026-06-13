# Reservations

Resrv offers various ways to list and manage your reservations inside Statamic's Control Panel. In this page, we'll go through the available tools and how to use them.

## Reservation List

The Reservations section in the Control Panel allows you to list and filter all your reservations.

<Image src="./img/resrv-reservations.webp" alt="The Reservations section in the Control Panel." />

Here, you can filter and reorder all your reservations by the *Entry* they belong to, the *status* of the reservation, the reservation *start date* or *made date* (when the booking was created), and the *year*.

::: tip Default status filter
The Status filter defaults to **Confirmed** and **Partner**, so pending and expired reservations are hidden until you opt them in. If you "don't see your expired reservations", this is why. Just enable those statuses in the filter.
:::

The status of a reservation can be one of the following:

- **Confirmed**: The reservation is confirmed and paid for.
- **Pending**: The user has started the checkout process but hasn't completed it. A pending reservation still holds availability.
- **Refunded**: The reservation has been refunded. This is a terminal status.
- **Expired**: The user started the reservation but never finished the checkout. Availability is restored.
- **Partner**: This special status means a reservation was made through an affiliate, skipping payment. It is treated as a confirmed booking for reports and the calendar.

## How reservations work

Sometimes there can be confusion due to many expired reservations being displayed. This is totally normal and by design, as a new reservation is created the moment the user starts the checkout process. This also plays a part in the availability system, reducing availability to prevent double bookings.

If a reservation is expired, it means that a user started the checkout process but never completed it. By default, the system "holds" a reservation for 10 minutes, but you can change that in the [configuration](./configuration#checkout) using the "Minutes to hold" setting. If personal details were added, the user stopped the checkout process before payment. Otherwise, they likely never intended to complete the process in the first place.

## Reservation Details

Clicking on the status of a reservation in the Reservations list will take you to the Reservation Details page. Here, you can view all reservation details, the data the customer provided during checkout, any extras or options, the dynamic pricing policies that were applied, and the payment information.

<Image src="./img/resrv-reservation-details.webp" alt="A totally random reservation by a random user." />

The details page surfaces:

- The **rate** used for the booking. For multi-rate bookings, each child reservation is listed with its own rate (see [Rates](./rates)).
- The **payment gateway** the reservation was paid with, plus a per-gateway **surcharge** line when a surcharge applies (see [Payment gateways](./payment-gateways)).

## Refunds

From the item menu in the Reservation List, you can refund a reservation:

<Image src="./img/resrv-reservation-refund.webp" alt="How to refund a reservation." />

After confirmation, the reservation is marked as refunded and the customer receives a notification email. **Availability is also restored.**

The refund routes through whichever payment gateway the reservation was originally paid with. With multiple gateways configured, Resrv resolves the correct one per reservation, so a booking paid with Stripe refunds through Stripe and a booking paid with another gateway refunds through that gateway.

**Partner and zero-payment reservations** skip the gateway call entirely. Because no charge was ever taken (an affiliate skip-payment or a fully-discounted booking never created a payment intent), the reservation is simply marked refunded and its availability restored: no gateway is contacted.

If you build a [custom payment gateway](./custom-payment-gateway), implement the `refund()` method on the `PaymentInterface` contract so refunds initiated from the Control Panel reach your provider.

## Reservations Calendar

Another helpful view is the Reservation Calendar. This view allows you to see all **confirmed and partner** reservations on a calendar:

<Image src="./img/resrv-reservation-calendar.webp" alt="The Reservation Calendar." />

Clicking on a reservation will take you to the Reservation Details page.

## Reports

You can create some basic reports to see how your sales are performing.

<Image src="./img/resrv-reservation-reports.webp" alt="The reports page in the Control Panel." />

A **Filter by** toggle lets you choose how the date range is applied:

- **Reservation date**: filters by each booking's start date (`date_start`).
- **Date created**: filters by when the reservation was made (`created_at`).

Pick a date range alongside it, and the report covers all **confirmed and partner** reservations within that range. Reports surface:

- Three summary cards: **Reservations** (count), **Revenue** (total), and **Average reservation value**.
- A **Best sellers** panel: your top entries by reservation count, with revenue and share.
- A **Top selling extras** panel: your most-booked extras.

## Export <Badge type="tip" text="NEW" />

The **Export** section lets you export reservations to a CSV file. It's a separate Control Panel page with its own filters and column picker.

<Image src="./img/resrv-reservations-export.webp" alt="The reservations CSV export page in the Control Panel." />

### Filters

- **Reservation date range**: filters by each booking's start date (`date_start`), not the created date. Defaults to the last 30 days.
- **Status**: a checkbox group that defaults to **Confirmed** and **Partner**.
- **Item**: restrict the export to a single entry.
- **Affiliate**: restrict the export to a single affiliate (shown only when affiliates exist).
- **Only include reservations with customer details**: limits the export to bookings that have customer data attached.

### Column picker

Choose exactly which columns to include. Fields are organized into groups (Reservation, Pricing, Customer, Entry, Add-ons), each with an All / None toggle. The default selection covers reference, status, item, rate, quantity, start and end dates, created date, customer email, and total.

Your selection is remembered in the browser for next time.

::: tip Custom checkout fields
Any custom checkout fields you've added are auto-discovered from stored customer data and appear in the column picker automatically, labeled from the field's display name. So a site's custom fields become exportable columns without any configuration.
:::

### Download

A live **match count** updates as you change the filters, so you can see how many reservations will be exported before downloading. The **Download CSV** button is enabled once the count is above zero and you have a date range, at least one status, and at least one field selected.

The file is a UTF-8 CSV downloaded as `reservations-Y-m-d-His.csv` (e.g. `reservations-2026-06-08-143015.csv`). Large exports are streamed safely in batches, and string values that could be interpreted as spreadsheet formulas are escaped to guard against CSV injection.
