# Reservation Status <Badge type="tip" text="NEW" />

The `reservation-status` Livewire component gives customers a self service page where they can look up their booking, see its current status, and (optionally) cancel it themselves. Inside the free cancellation window a cancellation refunds the charge automatically through the original payment gateway; after the window closes the customer can still cancel, after a clear warning, without a refund.

The whole feature is **off by default** and controlled by two nested toggles.

## Enabling the feature

Head to **Resrv → Settings → Checkout**:

1. **Enable the reservation status page** turns on the component (it renders nothing while off) and adds a "Manage your booking" link to confirmation emails. It requires a **Reservation Status Entry**: the Statamic entry whose template loads the component.
2. **Enable customer cancellations** additionally shows the cancel buttons. Without it the page is view only.

Both toggles are enforced server side, so a crafted request can't reach a disabled feature.

## Component basics

Create an entry for the page (any URL you like) and include the component in its template:

```antlers
{{ livewire:reservation-status }}
```

Both the `<livewire:...>` and the Antlers <code v-pre>{{ livewire:... }}</code> syntaxes work. The component is standalone: it needs no paired component and takes no attributes. Point the **Reservation Status Entry** setting at this entry so the email links resolve to it.

## Looking up a reservation

### By email and booking reference

In its default state the component renders a lookup form. The customer enters the email address they booked with and their booking reference. When nothing matches they always see the same generic message, so the form can never be used to probe which references exist.

::: info RATE LIMITING
Failed lookups are rate limited twice: 10 attempts per IP and reference, and 30 attempts per IP across all references, both decaying after about 10 minutes. Successful lookups never count against the budget.
:::

### Via the deep link

Confirmation emails automatically include a "Manage your booking" button that opens the page with the reservation already resolved:

```text
https://yoursite.com/manage-booking?ref=ABC123&hash=...
```

The `hash` is an HMAC signed with your Laravel `app.key` that ties the link to that single booking and the customer's email, so no login is needed and a leaked link can't be replayed against another reservation. To build the link yourself (for example in a published email template), use the model method that generates it:

```blade
@if ($url = $reservation->customerStatusUrl())
    [{{ __('Manage your booking') }}]({{ $url }})
@endif
```

`customerStatusUrl()` returns `null` when the feature is off, the status entry is missing or unpublished, or the customer has no email on file. If a customer follows a broken or tampered link, the page shows a neutral notice and falls back to the lookup form without revealing why the link failed.

::: tip KEEP YOUR APP KEY STABLE
The hash depends on `config('app.key')`. Rotating the key invalidates every existing deep link. The same scheme powers the <code v-pre>{{ resrv:reservation_from_uri }}</code> Antlers tag.
:::

::: info LOOKABLE STATUSES
The page surfaces live bookings (**Confirmed** and **Partner**), plus **Refunded**, **Cancelled** and **Completed** ones. **Pending** and **Expired** reservations are excluded because the customer never received a reference for those.

From v6.5.0, **Awaiting payment** reservations you [created in the Control Panel](./manual-reservations) are excluded too. Until they are paid, customers open them through the link to the [payment page](./payment-page) in their payment request email. Once paid, they appear here as **Confirmed**.
:::

## The status view

Once a reservation is resolved, the form is replaced by the status view showing a status badge, the booking reference, the reservation period (with one line per rate for cart bookings), quantity and rate where relevant, any extras and options, the cancellation policy label, the total, and the amount paid online. Bookings paid through manual gateways (offline / bank transfer) show a zero amount paid, since the money arrives outside the gateway. The same goes for bookings you [marked as paid](./manual-reservations#mark-as-paid) in the Control Panel.

The badge reads **Confirmed** for live bookings, **Cancelled & refunded** when the charge went back, **Cancelled** when no charge existed, **Cancelled — no refund issued** when the payment was retained, and **Completed** for past stays.

## Cancelling a reservation

With customer cancellations enabled, an eligible booking shows a cancel button below the details. There are two paths:

**With a refund.** While the free cancellation window is open, the booking has not started, and the gateway supports automatic refunds, the customer can cancel and the full amount paid is refunded to the original payment method. The deadline is inclusive through the end of its final day.

**Without a refund.** Once the window has closed, or when the booked policy is non-refundable, the customer can still cancel a booking paid online, but the payment stays with you. The button is preceded by an emphasized warning ("You will NOT receive a refund for this cancellation.") and a separate confirmation prompt, and the booking lands in the **Cancelled** status.

Both buttons trigger a JavaScript confirmation dialog, and the server re-checks eligibility before doing anything, so a stale or tampered request can't cancel an ineligible booking. Gateway failures show a generic message to the customer and log the underlying error for you.

No cancel button is shown, and a "contact us" note appears instead, when:

- No cancellation policy was ever configured (the default period of `0` means unconfigured, so nothing was agreed to at checkout).
- The booking was paid through a gateway that can't refund automatically (offline / bank transfer), it's a partner booking, or its recorded gateway is no longer configured.
- The booking was [marked as paid](./manual-reservations#mark-as-paid) in the Control Panel, because the money arrived outside Resrv. Manual reservations paid through their payment link follow the rules above.
- The stay has already started.

The per-rate terms that drive the window are documented under [Rates → Cancellation policy](./rates#cancellation-policy); the global fallback lives in the [free cancellation settings](./configuration).

## What happens on cancellation

A customer cancellation behaves exactly like the matching Control Panel action:

- On the refund path the charge is returned through the original gateway inside a row lock (a gateway failure rolls the status back, and a concurrent double cancel only refunds once), and the reservation transitions to **Refunded**.
- On the no-refund path the reservation transitions to **Cancelled** and no gateway call is made.
- Availability is restored for the booked dates in both cases.
- The customer receives the matching email: the refund notice on the refund path, or a cancellation notice that never claims a refund on the no-refund path. Your admins receive a "cancelled by customer" notification. See [Emails](./emails) to customize recipients, subjects and templates.
- Affiliate commissions follow the money: voided on a refund, kept when the payment was retained.

## Customizing

The view is published together with the other checkout views and lives at `/resources/views/vendor/statamic-resrv/livewire/reservation-status.blade.php`:

```bash
php artisan vendor:publish --tag=resrv-checkout-views
```

Unlike other components there is no `view` attribute; customize the published file directly.

## Translations

The component uses these frontend keys, overridable as described in [Languages](./languages):

| Key | Default |
| --- | ------- |
| `findYourReservation` | Find your reservation |
| `findYourReservationDescription` | Enter the email address you used for your booking and your booking reference code. |
| `emailAddress` | Email address |
| `bookingReference` | Booking reference |
| `findReservation` | Find reservation |
| `reservationNotFound` | We could not find a reservation matching these details. Please check them and try again. |
| `tooManyLookupAttempts` | Too many attempts. Please try again in a few minutes. |
| `reservationLinkFailed` | We couldn't open your reservation from that link. Please enter your email address and booking reference below. |
| `reservationStatus` | Reservation status |
| `statusConfirmed` | Confirmed |
| `statusCancelled` | Cancelled & refunded |
| `statusCancelledNoRefund` | Cancelled |
| `statusCancelledNoRefundIssued` | Cancelled — no refund issued |
| `statusCompleted` | Completed |
| `amountPaid` | Amount paid |
| `cancelReservation` | Cancel reservation |
| `cancelReservationConfirmation` | Are you sure you want to cancel this reservation? This action cannot be undone. |
| `cancelReservationDescription` | If you cancel now, the amount paid will be refunded to your original payment method. |
| `cancelReservationNoPaymentDescription` | You can cancel this reservation now. Since no payment was collected online, no refund will be issued. |
| `cancelReservationNoRefund` | Cancel without refund |
| `cancelReservationNoRefundDescription` | The free cancellation period for this reservation has expired. You can still cancel it, but the amount you paid is non-refundable. |
| `cancelReservationNonRefundableDescription` | This reservation is non-refundable. You can still cancel it, but the amount you paid will not be returned. |
| `cancelReservationNoRefundWarning` | You will NOT receive a refund for this cancellation. |
| `cancelReservationNoRefundConfirmation` | Are you sure you want to cancel this reservation? You will NOT receive a refund. This action cannot be undone. |
| `freeCancellationExpired` | The free cancellation period for this reservation has expired. |
| `cancellationNotAllowed` | This reservation cannot be cancelled online. Please contact us for assistance. |
| `cancellationFailed` | We could not process your cancellation automatically. Please contact us for assistance. |
| `reservationCancelledSuccess` | Your reservation has been cancelled. The amount paid will be refunded to your original payment method and a confirmation email is on its way. |
| `reservationCancelledNoPaymentSuccess` | Your reservation has been cancelled and a confirmation email is on its way. |
| `reservationCancelledNoRefundSuccess` | Your reservation has been cancelled. As it was outside the free cancellation period, no refund has been issued. A confirmation email is on its way. |
| `lookUpAnotherReservation` | Look up another reservation |

The view also reuses shared keys documented elsewhere: `somethingWentWrong`, `reservationPeriod`, `to`, `quantity`, `property`, `extras`, `options`, `cancellationPolicy` and `total`.
