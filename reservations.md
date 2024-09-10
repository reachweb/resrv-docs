# Reservations

Resrv offers various ways to list and manage your reservations inside Statamic's Control Panel. In this page, we'll go through the available tools and how to use them.

## Reservation List

The Reservations section in the Control Panel allows you to list and filter all your reservations.

<Image src="./img/resrv-reservations.webp" alt="The Reservations section in the Control Panel." />

Here, you can filter and reorder all your reservations by the *Entry* they belong to, the *status* of the reservation, and the reservation *starting* or *created* date.

The status of a reservation can be one of the following:

- **Confirmed**: The reservation is confirmed and paid for.
- **Pending**: The user has started the checkout process but hasn't completed it.
- **Refunded**: The reservation has been refunded.
- **Expired**: The user started the reservation but never finished the checkout.
- **Partner**: This special status means a reservation was made through an affiliate, skipping payment.
- **Webhook**: This means the user has completed the checkout process, but the webhook hasn't been triggered yet to confirm the reservation.

## How reservations work

Sometimes there can be confusion due to many expired reservations being displayed. This is totally normal and by design, as a new reservation is created the moment the user starts the checkout process. This also plays a part in the availability system, reducing availability to prevent double bookings.

If a reservation is expired, it means that a user started the checkout process but never completed it. By default, the system "holds" a reservation for 10 minutes, but you can change that in the [configuration](./configuration#checkout-settings) using the "minutes to hold" setting. If personal details were added, the user stopped the checkout process before payment. Otherwise, they likely never intended to complete the process in the first place.

## Reservation Details

Clicking on the status of a reservation in the Reservations list will take you to the Reservation Details page. Here, you can view all reservation details, the data the customer provided during checkout, any extras or options, the dynamic pricing policies that were applied, and the payment information.

<Image src="./img/resrv-reservation-details.webp" alt="A totally random reservation by a random user." />

## Refunds

From the item menu in the Reservation List, you can refund a reservation:

<Image src="./img/resrv-reservation-refund.webp" alt="How to refund a reservation." />

After confirmation, the reservation will be marked as refunded, and the user will receive a notification email. **Availability will also be restored**. When using Stripe, the actual refund will happen through the Stripe API. If you're using a different payment gateway, you'll need to manually refund the payment or implement the refund method in your gateway.

## Reservations Calendar

Another helpful view is the Reservation Calendar. This view allows you to see all **confirmed** reservations on a calendar:

<Image src="./img/resrv-reservation-calendar.webp" alt="The Reservation Calendar." />

Clicking on a reservation will take you to the Reservation Details page.

## Reports

Finally, you can create some basic reports to see how your sales are performing. You can filter the reports by the reservation **start date** and get an overview of the number of reservations per day, the total amount of reservations, the average price per reservation, and your top sellers.

<Image src="./img/resrv-reservation-reports.webp" alt="The reports page in the Control Panel." />
