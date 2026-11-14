# Reservations

Resrv offers various ways to list and manage your reservations inside Statamic's Control Panel. In this page, we'll go through the available tools and how to use them.

## Reservation List

The Reservations section in the Control Panel allows you to list and filter all your reservations.

<Image src="./img/resrv-reservations.webp" alt="The Reservations section in the Control Panel." />

Here, you can filter and reorder all your reservations by the *Entry* they belong to, the *status* of the reservation, the reservation *start date* or *made date* (when the booking was created), and the *year*.

From v6.5.0, you can book on behalf of a customer with the **Create reservation** button and send them a link to pay. See [Manual reservations](./manual-reservations).

::: tip Default status filter
The Status filter defaults to **Confirmed**, **Partner** and (from v6.5.0) **Awaiting payment**. To see pending or expired reservations, enable those statuses in the filter.
:::

The status of a reservation can be one of the following:

- **Confirmed**: The reservation is confirmed. Checkout bookings with an offline payment method such as bank transfer are confirmed before the money reaches you, so confirmed doesn't always mean paid.
- **Pending**: The user has started the checkout process but hasn't completed it. It still holds availability.
- **Awaiting payment**: A reservation created in the Control Panel that is waiting for the customer to pay. It holds availability, unless it was created without decreasing availability. Once paid it becomes **Confirmed**. If you cancel it, or its [payment deadline](./manual-reservations#payment-deadlines) passes, it becomes **Cancelled**. See [Manual reservations](./manual-reservations#the-awaiting-payment-status).
- **Refunded**: The reservation has been refunded, by you or by the customer cancelling within the free-cancellation window on the [Reservation Status](./reservation-status) page.
- **Cancelled**: The reservation was cancelled without a refund through the payment gateway. This covers customers cancelling after the free-cancellation window (you keep the payment), cancelled partner and zero-payment bookings, and cancelled **Awaiting payment** reservations.
- **Expired**: The user started the reservation but never finished the checkout. Availability is restored.
- **Partner**: This special status means a reservation was made through an affiliate, skipping payment. Reports and the calendar treat it as confirmed.

**Awaiting payment** rows show the requested amount marked "(unpaid)". Instead of **Refund**, their item menu has actions such as **Mark as paid…** and **Send payment request**. See [Manual reservations](./manual-reservations#managing-awaiting-payment-reservations).

<Image src="./img/resrv-manual-listing.webp" alt="Awaiting-payment reservations appear in the listing with their own badge and row actions." />

## How reservations work

Sometimes there can be confusion due to many expired reservations being displayed. This is totally normal and by design, as a new reservation is created the moment the user starts the checkout process. This also plays a part in the availability system, reducing availability to prevent double bookings.

If a reservation is expired, it means that a user started the checkout process but never completed it. By default, the system "holds" a reservation for 10 minutes, but you can change that in the [configuration](./configuration#checkout) using the "Minutes to hold" setting. If personal details were added, the user stopped the checkout process before payment. Otherwise, they likely never intended to complete the process in the first place.

Reservations you [create in the Control Panel](./manual-reservations) skip checkout, so "Minutes to hold" doesn't apply. An **Awaiting payment** reservation keeps its availability until it's paid or cancelled. It never becomes **Expired**, gets no abandoned-reservation emails and isn't removed by housekeeping.

## Reservation Details

Clicking on the status of a reservation in the Reservations list will take you to the Reservation Details page. Here, you can view all reservation details, the data the customer provided during checkout, any extras or options, the dynamic pricing policies that were applied, and the payment information.

<Image src="./img/resrv-reservation-details.webp" alt="A totally random reservation by a random user." />

The page also shows:

- The **rate**. Multi-rate bookings list each child reservation with its own rate (see [Rates](./rates)).
- The **payment gateway**, and its **surcharge** if one applies (see [Payment gateways](./payment-gateways)).
- Whether the payment was **Paid**, is **Requested (unpaid)** or was **Not collected**. For checkout bookings with an offline payment method the row just reads **Payment**, because Resrv can't know if the money arrived.
- **Created by** and **Decreases availability**, for reservations created in the Control Panel.

Timestamps such as **Created** show their time zone.

**Awaiting payment** reservations also get an **Awaiting payment** section with the amount, deadline and payment link, and actions such as **Mark as paid** in the header. See [Manual reservations](./manual-reservations#managing-awaiting-payment-reservations).

## Refunds

From the item menu in the Reservation List, you can refund a reservation:

<Image src="./img/resrv-reservation-refund.webp" alt="How to refund a reservation." />

After confirmation, the reservation is marked as refunded and the customer receives a notification email. **Availability is also restored.**

The refund goes through the payment gateway the reservation was paid with, even if you have several gateways configured.

**Payments made outside an online gateway** can't be returned automatically. That includes offline payment methods such as bank transfer, and [manual reservations](./manual-reservations) you marked as paid. Refunding one still marks it refunded, restores availability and emails the customer, but you return the money yourself. Resrv reminds you in the refund dialog and on the reservation page, and the email tells the customer their payment will be returned separately. A manual reservation the customer paid through its payment link refunds through the gateway as usual.

Resrv flags a reservation you marked as paid if the customer's online payment may also have gone through. Refunding it goes through the gateway only if that payment actually went through. See [Manual reservations](./manual-reservations#refunds-and-reconciliation).

**Partner and zero-payment reservations** were never charged, so refunding one cancels it instead. It becomes **Cancelled** and its availability is restored.

**Awaiting payment** reservations have no **Refund** action because nothing has been paid. Use **Cancel reservation** instead, which releases the availability and cancels any online payment the customer started.

If you build a [custom payment gateway](./custom-payment-gateway), implement the `refund()` method of the `PaymentInterface` contract so Control Panel refunds reach your provider.

Customers can also cancel from the [Reservation Status](./reservation-status) page within the free-cancellation window. That refunds them through the gateway and restores availability.

## Reservations Calendar

Another helpful view is the Reservation Calendar. This view allows you to see all **confirmed and partner** reservations, plus **Awaiting payment** ones that hold availability, on a calendar:

<Image src="./img/resrv-reservation-calendar.webp" alt="The Reservation Calendar." />

Clicking on a reservation will take you to the Reservation Details page.

From v6.5.0, **Awaiting payment** reservations are drawn as dashed blue blocks. Hover one to see its payment deadline. Those created with **Decrease availability** turned off only appear once they're confirmed (see [Overbooking](./manual-reservations#overbooking-and-view-only-reservations)).

<Image src="./img/resrv-manual-calendar.webp" alt="Holds that take availability are shown on the calendar with a dashed style." />

## Reports

You can create some basic reports to see how your sales are performing.

<Image src="./img/resrv-reservation-reports.webp" alt="The reports page in the Control Panel." />

Use the **Filter by** toggle to choose which date the range applies to:

- **Reservation date**: the booking's start date (`date_start`).
- **Date created**: when the reservation was made (`created_at`).

The report covers **confirmed and partner** reservations in the range, plus cancelled bookings that kept their payment. It shows:

- Summary cards for **Reservations**, **Revenue**, **Average reservation value** and **Outstanding payments**. **Outstanding payments** counts the **Awaiting payment** reservations in the range and totals what they request, without payment surcharges. It isn't counted as revenue. Its **View these reservations** link opens them in the reservation list.
- **Best sellers**: your top entries by reservation count, with quantity sold, revenue and share.
- **Top selling extras**: your most-booked extras.

<Image src="./img/resrv-reports-outstanding.webp" alt="The Outstanding payments card totals what is still awaiting payment in the report range." />

## Export <Badge type="tip" text="NEW" />

The **Export** section exports reservations to a CSV file.

<Image src="./img/resrv-reservations-export.webp" alt="The reservations CSV export page in the Control Panel." />

### Filters

- **Reservation date range**: the booking's start date (`date_start`), not the created date. Defaults to the last 30 days.
- **Status**: defaults to **Confirmed** and **Partner**. You can also tick **Awaiting payment**. The CSV holds the raw status value, for example `awaiting_payment`.
- **Item**: export a single entry.
- **Affiliate**: export a single affiliate's reservations. Shown only when you have affiliates.
- **Only include reservations with customer details**: skips bookings without customer data.

### Column picker

Columns are grouped into Reservation, Pricing, Customer, Entry and Add-ons, each with an All / None toggle. By default you get the reference, status, item, rate, quantity, start and end dates, created date, customer email and total. Your browser remembers your selection.

::: tip Custom checkout fields
Custom checkout fields found in your stored customer data appear in the column picker automatically, labeled with their display name.
:::

### Download

A live **match count** shows how many reservations match your filters. **Download CSV** is enabled once the count is above zero and you've selected a date range, at least one status and at least one field.

The file is a UTF-8 CSV named `reservations-Y-m-d-His.csv` (e.g. `reservations-2026-06-08-143015.csv`). Large exports are streamed in batches, and values that look like spreadsheet formulas are escaped to prevent CSV injection.
