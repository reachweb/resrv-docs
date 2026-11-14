# Reservations

Resrv offers various ways to list and manage your reservations inside Statamic's Control Panel. In this page, we'll go through the available tools and how to use them.

## Reservation List

The Reservations section in the Control Panel allows you to list and filter all your reservations.

<Image src="./img/resrv-reservations.webp" alt="The Reservations section in the Control Panel." />

Here, you can filter and reorder all your reservations by the *Entry* they belong to, the *status* of the reservation, the reservation *start date* or *made date* (when the booking was created), and the *year*.

From v6.5.0, the **Create reservation** button at the top of the list lets you book on behalf of a customer, for example after a phone call or an email, and send them a link to pay. See [Manual reservations](./manual-reservations).

::: tip Default status filter
The Status filter defaults to **Confirmed**, **Partner** and **Awaiting payment**, so pending and expired reservations are hidden until you opt them in. If you "don't see your expired reservations", this is why. Just enable those statuses in the filter. **Awaiting payment** is part of the default from v6.5.0, because those bookings usually need you to act on them.
:::

The status of a reservation can be one of the following:

- **Confirmed**: The reservation is confirmed. Checkout bookings that use an offline payment method (such as bank transfer) are confirmed before the money reaches you, so confirmed doesn't always mean paid.
- **Pending**: The user has started the checkout process but hasn't completed it. A pending reservation still holds availability.
- **Awaiting payment**: A reservation created in the Control Panel that is waiting for the customer to pay. It holds availability, unless it was created without decreasing availability. It leaves this status only when it is paid (it becomes **Confirmed**) or cancelled (it becomes **Cancelled**), either by you or, if it has a [payment deadline](./manual-reservations#payment-deadlines), by a scheduled command once that deadline passes. See [Manual reservations](./manual-reservations#the-awaiting-payment-status).
- **Refunded**: The reservation has been refunded. This is a terminal status. Customer self-service cancellations made within the free-cancellation window on the [Reservation Status](./reservation-status) page also land here.
- **Cancelled**: The reservation was cancelled without any money going back through a payment gateway. This is a terminal status. It covers customer cancellations after the free-cancellation window (the payment stays with you), cancelled partner and zero-payment bookings, and **Awaiting payment** reservations that were cancelled or whose payment deadline passed.
- **Expired**: The user started the reservation but never finished the checkout. Availability is restored.
- **Partner**: This special status means a reservation was made through an affiliate, skipping payment. It is treated as a confirmed booking for reports and the calendar.

**Awaiting payment** rows show the requested amount with an "(unpaid)" note. Once the customer can no longer pay through their link, a red **Hold expired** or **Arrival date passed** badge appears next to the status. Instead of **Refund**, their item menu offers **Mark as paid…** (**Mark as paid manually…** for online payment methods), **Send payment request** (or **Resend payment request**), **Copy payment link**, **Extend hold…** and **Cancel reservation**. Sending and copying the link are hidden once the customer can no longer pay, and **Extend hold…** is hidden once the arrival day has passed.

<Image src="./img/resrv-manual-listing.webp" alt="Awaiting-payment reservations appear in the listing with their own badge and row actions." />

## How reservations work

Sometimes there can be confusion due to many expired reservations being displayed. This is totally normal and by design, as a new reservation is created the moment the user starts the checkout process. This also plays a part in the availability system, reducing availability to prevent double bookings.

If a reservation is expired, it means that a user started the checkout process but never completed it. By default, the system "holds" a reservation for 10 minutes, but you can change that in the [configuration](./configuration#checkout) using the "Minutes to hold" setting. If personal details were added, the user stopped the checkout process before payment. Otherwise, they likely never intended to complete the process in the first place.

Reservations you [create in the Control Panel](./manual-reservations) skip checkout, so "Minutes to hold" doesn't apply to them. An **Awaiting payment** reservation keeps its availability until it is paid or cancelled. It is never moved to **Expired**, never receives abandoned-reservation emails and is never cleared by housekeeping.

## Reservation Details

Clicking on the status of a reservation in the Reservations list will take you to the Reservation Details page. Here, you can view all reservation details, the data the customer provided during checkout, any extras or options, the dynamic pricing policies that were applied, and the payment information.

<Image src="./img/resrv-reservation-details.webp" alt="A totally random reservation by a random user." />

The details page surfaces:

- The **rate** used for the booking. For multi-rate bookings, each child reservation is listed with its own rate (see [Rates](./rates)).
- The **payment gateway** the reservation was paid with, plus a per-gateway **surcharge** line when a surcharge applies (see [Payment gateways](./payment-gateways)).
- Whether the payment was **Paid**, is **Requested (unpaid)** or was **Not collected**. For checkout bookings that use an offline payment method, the row simply reads **Payment**, because Resrv can't know whether the money arrived.
- **Created by** and **Decreases availability**, for reservations created in the Control Panel.

Timestamps on this page, such as **Created**, show their time zone.

For an **Awaiting payment** reservation, the page also has an **Awaiting payment** section. It sums up who has to pay what, by when and how, and shows the customer's payment link ready to copy. The header holds the actions you need, such as **Mark as paid** or **Send payment request**, with the rest under **More actions**. See [Manual reservations](./manual-reservations#managing-awaiting-payment-reservations).

## Refunds

From the item menu in the Reservation List, you can refund a reservation:

<Image src="./img/resrv-reservation-refund.webp" alt="How to refund a reservation." />

After confirmation, the reservation is marked as refunded and the customer receives a notification email. **Availability is also restored.**

The refund routes through whichever payment gateway the reservation was originally paid with. With multiple gateways configured, Resrv resolves the correct one per reservation, so a booking paid with Stripe refunds through Stripe and a booking paid with another gateway refunds through that gateway.

**Payments made outside an online gateway** can't be returned automatically. This covers bookings that use an offline payment method such as bank transfer, and [manual reservations](./manual-reservations) you marked as paid. Refunding one still marks it refunded, restores availability and notifies the customer, but you return the money yourself. The refund dialog tells you so before you confirm, the success message reads "Refund recorded — return the payment to the customer manually" (or "Refund recorded — if the customer paid, return the payment to them manually" when Resrv can't tell whether the customer paid), the reservation page keeps a notice reminding you to return the payment manually, and the refund email tells the customer their payment "will be returned to you separately". A manual reservation that the customer paid through its payment link refunds through the gateway like any other booking.

If you marked a manual reservation as paid and the customer's online payment had also gone through, or Resrv couldn't confirm it was cancelled, Resrv keeps that payment's reference and flags the reservation for you to check in your payment provider. Refunding it goes through the gateway only if that online payment actually went through. See [Manual reservations](./manual-reservations#refunds-and-reconciliation).

**Partner and zero-payment reservations** skip the gateway call entirely. Because no charge was ever taken (an affiliate skip-payment or a fully-discounted booking never created a payment intent), the reservation is cancelled instead: it lands in **Cancelled** and its availability is restored. No gateway is contacted.

**Awaiting payment** reservations have no **Refund** action, because nothing has been paid yet. Use **Cancel reservation** instead. It releases the availability the booking took and cancels any online payment the customer started.

If you build a [custom payment gateway](./custom-payment-gateway), implement the `refund()` method on the `PaymentInterface` contract so refunds initiated from the Control Panel reach your provider.

Refunds can also be triggered by the customer themselves: within the free-cancellation window they can cancel from the frontend [Reservation Status](./reservation-status) page, which issues the refund automatically through the gateway and produces the same refunded-and-availability-restored outcome described here.

## Reservations Calendar

Another helpful view is the Reservation Calendar. This view allows you to see all **confirmed and partner** reservations, plus **Awaiting payment** reservations that hold availability, on a calendar:

<Image src="./img/resrv-reservation-calendar.webp" alt="The Reservation Calendar." />

Clicking on a reservation will take you to the Reservation Details page.

From v6.5.0, **Awaiting payment** reservations are drawn as dashed blue blocks and listed in the legend as "Awaiting payment (holds availability)". Hover one to see its payment deadline, for example "Awaiting payment — cancels automatically if not paid by …". A reservation without a deadline reads "Awaiting payment — no payment deadline". Awaiting-payment reservations created with **Decrease availability** turned off don't take availability, so they only appear once they are confirmed (see [Overbooking](./manual-reservations#overbooking-and-view-only-reservations)).

<Image src="./img/resrv-manual-calendar.webp" alt="Holds that take availability are shown on the calendar with a dashed style." />

## Reports

You can create some basic reports to see how your sales are performing.

<Image src="./img/resrv-reservation-reports.webp" alt="The reports page in the Control Panel." />

A **Filter by** toggle lets you choose how the date range is applied:

- **Reservation date**: filters by each booking's start date (`date_start`).
- **Date created**: filters by when the reservation was made (`created_at`).

Pick a date range alongside it, and the report covers all **confirmed and partner** reservations within that range, plus cancelled bookings that kept their payment. Reports surface:

- Four summary cards: **Reservations** (count), **Revenue** (total), **Average reservation value**, and **Outstanding payments**. The **Outstanding payments** card shows how many **Awaiting payment** reservations fall in the same range and the total they request (without payment surcharges). It isn't counted as revenue. Its **View these reservations** link opens the reservation list filtered to them.
- A **Best sellers** panel: your top entries by reservation count, with the quantity sold, revenue and share.
- A **Top selling extras** panel: your most-booked extras.

<Image src="./img/resrv-reports-outstanding.webp" alt="The Outstanding payments card totals what is still awaiting payment in the report range." />

## Export <Badge type="tip" text="NEW" />

The **Export** section lets you export reservations to a CSV file. It's a separate Control Panel page with its own filters and column picker.

<Image src="./img/resrv-reservations-export.webp" alt="The reservations CSV export page in the Control Panel." />

### Filters

- **Reservation date range**: filters by each booking's start date (`date_start`), not the created date. Defaults to the last 30 days.
- **Status**: a checkbox group that defaults to **Confirmed** and **Partner**. You can also tick **Awaiting payment**. The checkboxes show readable labels, but the CSV's Status column keeps the raw value (for example `awaiting_payment`).
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
