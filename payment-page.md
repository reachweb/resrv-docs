# Payment Page <Badge type="tip" text="NEW" />

The `reservation-payment` Livewire component is the page your customers open to pay for a reservation you created in the Control Panel (see [Manual reservations](./manual-reservations)). They arrive through a signed link, so they don't need to log in or re-enter any details. The page shows what they owe, the remaining balance, the payment method and the payment deadline, then either takes the payment online or tells them how to pay you directly.

The page collects the payment but never confirms the booking itself: the payment gateway's webhook does that. The payment page is new in v6.5. You only need it if you create manual reservations that are paid online, because offline (manually confirmed) payment methods work without it.

## Setting up the page

1. Create an entry for the page at any URL you like, for example `/pay`. It must be **published**, not private, and have a URL: Resrv treats a draft, private or routeless entry as missing.
2. Add the component to the entry's template:

   ```antlers
   {{ livewire:reservation-payment }}
   ```

   Or, in a Blade template:

   ```blade
   <livewire:reservation-payment />
   ```

   Both the `<livewire:...>` and the Antlers <code v-pre>{{ livewire:... }}</code> syntaxes work. The component is standalone: it takes no attributes and needs no other component on the page.
3. Go to **Resrv → Settings → Checkout → Manual reservations** and select the entry as the **Payment Page Entry**. The same section holds the optional **Offline Payment Instructions** (see [Offline payment methods](#offline-payment-methods)).

<Image src="./img/resrv-settings-manual-reservations.webp" alt="Select the payment page and, optionally, the instructions shown for offline payment methods." />

::: warning ONLINE METHODS NEED THIS PAGE
Without a usable **Payment Page Entry**, online payment methods are disabled on the **Create reservation** page and the Control Panel shows no payment link. Offline methods still work: the customer pays you directly and you use **Mark as paid**. Keep the entry published, because payment requests for online methods are refused while it is missing or unpublished.
:::

::: tip USE YOUR CHECKOUT LAYOUT
When the customer pays by card, the page renders the gateway's payment form in place, the same form your checkout uses. Give the payment entry a layout that loads the same assets as your checkout page: Livewire's styles and scripts, the [Resrv frontend assets](./frontend-setup#other-required-assets) and, for Stripe, [Stripe's JavaScript](./stripe#including-stripe-s-javascript).
:::

## The payment link

Customers reach the page through a personal link that looks like this:

```text
https://yoursite.com/pay?ref=ABC123&hash=...
```

### How customers get the link

- **The payment request email.** For online payment methods, the email has a **Pay now** button with the link written out underneath. Resrv sends it when you create the reservation (unless you turn off **Send payment request email**), when you use **Send payment request** or **Resend payment request**, and when you extend the hold with the resend box ticked. You configure it through the **Customer payment request** event in [Emails](./emails).
- **Copied from the Control Panel.** A reservation awaiting payment shows its link in the **Payment link** field on its reservation page, and the listing has a **Copy payment link** row action. Use it to send the link another way, such as a chat message.

For offline payment methods, the email contains your payment instructions instead of a link. The link still exists, so you can copy it from the Control Panel if you'd like customers to see the instructions on the page.

The Control Panel only offers the link while the reservation is awaiting payment and its payment window is open. A link the customer already has keeps working after that, but it opens a page explaining what happened (paid, expired or cancelled) instead of a payment form. Reservations awaiting payment don't appear on the [reservation status page](./reservation-status), so until they pay, this link is the customer's only way to view the booking.

### Security

The `hash` is an HMAC of the reservation and the customer's email address, signed with your Laravel `app.key`. It ties the link to that single booking, so no login is needed and a leaked link can't be replayed against another reservation. The [reservation status page](./reservation-status#via-the-deep-link) uses the same scheme.

There is no lookup form. A missing, incomplete or tampered link shows one neutral notice, "We couldn't open your reservation from that link. Please check the link in your email or contact us for assistance.", followed by your contact details. The notice never says why the link failed, so the page can't be used to find out which references exist.

::: info RATE LIMITING
Failed link checks are rate limited twice: 10 attempts per IP and reference, and 30 attempts per IP across all references, both decaying after about 10 minutes. Once a limit is hit, even a valid link shows the neutral notice until the limit decays. These limits are counted separately from the reservation status page's.
:::

::: tip KEEP YOUR APP KEY AND PAYMENT PAGE STABLE
The hash depends on `config('app.key')`. Rotating the key invalidates every payment link you have sent. Send the payment request again afterwards so customers get a working link.

Likewise, don't change the payment entry's URL, or unpublish or delete it, while reservations are awaiting payment. Links already emailed point at the old URL. If you must, select the new page as the **Payment Page Entry** and send the payment requests again.
:::

## What the customer sees

While the reservation can be paid, the page shows:

- **Amount to pay**: the amount you requested plus any payment surcharge. The amount was stored when you created the reservation, so later price changes don't affect it.
- A "Please pay by" line with the deadline, when the reservation is on hold (see [Payment deadlines](#payment-deadlines)).
- The entry title, the **Booking reference**, and the **Reservation period** with the rate, the dates and the quantity (when more than one).
- Any extras and options.
- **Total**, when you requested only part of the total or the payment method adds a surcharge.
- **Payment surcharge**, when the payment method adds one.
- **Remaining balance** with "Not included in this payment.", when you requested less than the total.

Below that comes a **Pay** button for online methods, or your payment instructions for offline ones.

<Image src="./img/resrv-payment-page.webp" alt="The payment page for an online payment method." />

In every other state the page shows only the entry title, booking reference and reservation period, under a message that explains the state. If the entry has since been deleted, "Your booking" replaces the title.

### Page states

The page works out its state on the server each time it loads:

| Heading | When | What the customer sees |
| --- | --- | --- |
| Complete your payment | Awaiting payment, online method, payment window open | The details above, a **Pay** button with the amount, and "Payment method: …" underneath. |
| How to pay | Awaiting payment, offline method, payment window open | The details above and your payment instructions (see [Offline payment methods](#offline-payment-methods)). |
| Payment processing | The customer just came back from the payment provider, or a payment they started is already going through | "Your payment is being processed. You will receive a confirmation email as soon as it completes." |
| Reservation confirmed | The reservation is **Confirmed** | "This reservation has already been paid and confirmed. Thank you!" |
| Payment link expired | The hold deadline has passed | "This payment link has expired. Please contact us to arrange your booking." and your contact details. |
| Payment link expired | The arrival day has ended | "The arrival date for this reservation has passed, so it can no longer be paid online. Please contact us to arrange your booking." and your contact details. |
| Reservation unavailable | The reservation was cancelled or refunded | "This reservation is no longer available for payment. Please contact us for assistance." and your contact details. |
| *(no heading)* | The link is missing, broken, tampered with or rate limited | The neutral notice described under [Security](#security), and your contact details. |

A confirmed reservation always shows **Reservation confirmed**. A customer coming back from the payment provider sees **Payment processing** even if the deadline passed while they were paying.

The contact details are the **Email** and **Phone** from **Resrv → Settings → General**, each shown only when filled in. Both fields ship with placeholder values, so make sure they hold your real details.

## Paying online

When the customer clicks **Pay**, Resrv starts a payment for the stored amount through the payment method you chose when creating the reservation. Customers can't switch to another method on this page.

- **Inline gateways** such as Stripe replace the page with the gateway's payment form, the same one used at checkout. When the customer completes it, Stripe sends them back to the same payment link, which then shows **Payment processing**. If Stripe reports a failed payment on the way back, the page offers the **Pay** button again.
- **Redirect gateways** send the customer to the provider's payment page, and the provider returns them to the payment link. If the provider reports the payment as successful or pending, the page shows **Payment processing**. If it failed, the customer sees the **Pay** button again and can retry.

Custom and add-on gateways, such as Mollie, need a release that implements the v6.5 `PaymentInterface` changes: the [return URL](./custom-payment-gateway#the-return-url) that brings the customer back to this page, and [retrieving a payment intent](./custom-payment-gateway#retrieving-a-payment-intent) to resume an interrupted payment. See [Writing a custom payment gateway](./custom-payment-gateway).

If the payment can't be started, the customer sees "We could not start the payment process. Please try again or contact us for assistance." and Resrv logs the underlying error.

### Resuming an interrupted payment

Customers close tabs, lose their connection or click **Pay** twice. Resrv remembers the payment it started for the reservation and checks it with the provider before starting another:

- If the earlier payment can still be completed, the page resumes it instead of creating a second one.
- If the earlier payment already went through or is still processing, the page shows **Payment processing** and offers no new payment form.
- If the provider cancelled the earlier payment or it no longer exists, Resrv creates a new one.

Clicks that arrive at the same moment, for example from two tabs, are handled one after the other, so the second one resumes the payment the first created.

::: warning CACHE LOCKS REQUIRED
Payment attempts are serialized with a cache lock (`Cache::lock()`). The `file`, `database`, `redis`, `memcached`, `dynamodb` and `array` cache stores support locks, but `apc` does not. On a store without locks, every online payment on this page fails with "We could not start the payment process". If you run more than one app server, use a shared store (`redis`, `database` or `memcached`).
:::

### The webhook confirms the booking

**Payment processing** is only an interim message. The reservation stays **Awaiting payment** until the gateway's webhook reports the payment, and only then moves to **Confirmed**. At that point the customer receives the usual confirmation email, your admins get the new reservation email, and the link shows **Reservation confirmed**. If the [activity log](./activity-log) is enabled, it records "Confirmed by payment webhook".

Payments made on this page use the same webhook as checkout, so there is nothing extra to configure. Without a working webhook, the customer's card is charged but the reservation stays **Awaiting payment**. See [Stripe → Setup the webhook](./stripe#setup-the-webhook) and [Webhook routes](./payment-gateways#webhook-routes).

## Offline payment methods

When the reservation uses an offline (manually confirmed) method, such as the bundled Offline gateway, the page has no **Pay** button. Under the **How to pay** heading it shows "Payment method: …" followed by either:

- your **Offline Payment Instructions** (for example your bank details), then a line asking the customer to include their booking reference with the payment, or
- when you left the setting empty, a note that payment is arranged directly with you, asking the customer to contact you and quote their booking reference, then your contact details.

The instructions are shown as plain text with line breaks kept, and HTML is not rendered. The payment request email includes the same instructions. Once the money arrives, confirm the reservation with [Mark as paid](./manual-reservations#mark-as-paid) in the Control Panel. The link then shows **Reservation confirmed**.

<Image src="./img/resrv-payment-page-offline.webp" alt="For offline methods the payment page shows your payment instructions instead of a Pay button." />

## Payment deadlines

Two cut-offs close the payment window:

- **The hold deadline**, if you put the reservation on hold, using **Hold for a limited time** when you create it or **Extend hold** later.
- **The end of the arrival day**, in your app's time zone. This applies to every reservation, with or without a hold, so nobody is asked to pay online for a stay that has already started. Same-day bookings stay payable until the end of that day.

The "Please pay by" line only appears when the reservation is on hold. It shows whichever cut-off comes first: "Please pay by 17-10-2026 07:27 UTC", or "Please pay by the end of your arrival day: …" when the arrival day ends before the hold deadline. Times are shown in your app's time zone. Without a hold, the arrival-day cut-off still applies, but the page doesn't announce it.

Once a cut-off passes, the page stops offering payment and shows **Payment link expired**, even if the lapsed-hold sweep hasn't run yet. What happens next depends on the cut-off:

- **Hold deadline passed**: the lapsed-hold sweep (`resrv:cancel-lapsed-holds`, which you need to schedule) cancels the reservation and releases any availability it held. The link then shows **Reservation unavailable**. Until the sweep runs, you can still use [Extend hold](./manual-reservations#extend-hold). The link doesn't change, so the one the customer already has accepts payments again until the new deadline.
- **Arrival day passed**: nothing cancels the reservation automatically. The Control Panel flags it so you can mark it as paid or cancel it.

A payment the customer started before the cut-off can still go through, and the webhook confirms it while the reservation is still awaiting payment. See [Manual reservations → Payment deadlines](./manual-reservations#payment-deadlines) for scheduling the sweep and what it does.

## Customizing

The view is published together with the other checkout views:

```bash
php artisan vendor:publish --tag=resrv-checkout-views
```

The page uses two files:

- `resources/views/vendor/statamic-resrv/livewire/reservation-payment.blade.php`: the page itself.
- `resources/views/vendor/statamic-resrv/livewire/components/partials/business-contact.blade.php`: the email and phone lines shown with the notices.

There is no `view` attribute, so customize the published files directly. Files you haven't published fall back to the packaged copies. The card form shown after **Pay** is the gateway's own payment view (`livewire/checkout-payment.blade.php` for Stripe). Checkout uses the same view, so any change to it applies to both.

## Translations

The component uses these frontend keys, which you can override as described in [Languages](./languages). Only English ships, so add them to every locale you have published:

| Key | Default |
| --- | ------- |
| `completeYourPayment` | Complete your payment |
| `paymentHeadingInstructions` | How to pay |
| `paymentHeadingProcessing` | Payment processing |
| `paymentHeadingConfirmed` | Reservation confirmed |
| `paymentHeadingExpired` | Payment link expired |
| `paymentHeadingUnavailable` | Reservation unavailable |
| `amountToPay` | Amount to pay |
| `paymentDueBy` | Please pay by :date |
| `paymentDueByArrival` | Please pay by the end of your arrival day: :date |
| `remainingBalance` | Remaining balance |
| `remainingBalanceNote` | Not included in this payment. |
| `paymentMethodIs` | Payment method: :method |
| `contactPhone` | Phone |
| `paymentLinkFailed` | We couldn't open your reservation from that link. Please check the link in your email or contact us for assistance. |
| `paymentLinkExpired` | This payment link has expired. Please contact us to arrange your booking. |
| `paymentArrivalPassed` | The arrival date for this reservation has passed, so it can no longer be paid online. Please contact us to arrange your booking. |
| `paymentAlreadyCompleted` | This reservation has already been paid and confirmed. Thank you! |
| `paymentProcessing` | Your payment is being processed. You will receive a confirmation email as soon as it completes. |
| `paymentUnavailable` | This reservation is no longer available for payment. Please contact us for assistance. |
| `paymentOfflineInstructions` | Please include your booking reference :reference with your payment. We will confirm your reservation as soon as the payment arrives. |
| `paymentOfflineNoInstructions` | This reservation is not paid online: payment is arranged directly with us. Please contact us for the payment details and quote your booking reference :reference. We will confirm your reservation as soon as the payment arrives. |
| `paymentMountFailed` | We could not start the payment process. Please try again or contact us for assistance. |

`:date` is replaced with the deadline, `:method` with the payment method's label and `:reference` with the booking reference. `frontend.php` also defines `paymentDeadline` (Payment deadline), which the page doesn't currently use.

The view also reuses these existing keys: `pay`, `bookingReference`, `emailAddress`, `reservationPeriod`, `to`, `extras`, `options`, `total`, `paymentSurcharge` and `reservationItemUnavailable` (shown instead of the entry title when the entry no longer exists). The card form uses the checkout's payment keys: `payment`, `paymentDescription` and `toCompleteYourReservation`.

## Troubleshooting

- **"We couldn't open your reservation from that link"**: the link is incomplete or was altered, `app.key` has changed since it was sent, or too many failed attempts came from the same IP. Copy the link from the reservation page or send the payment request again.
- **"We could not start the payment process"**: check your logs. Typical causes are a cache store without lock support, a payment method removed from your gateway config after the reservation was created, or an error from the payment provider.
- **The card form doesn't appear after clicking Pay**: the payment entry's layout probably doesn't load Stripe's JavaScript (see [Setting up the page](#setting-up-the-page)).
- **Stuck on "Payment processing"**: the webhook hasn't confirmed the payment yet. Check your webhook setup and the provider's webhook logs. The reservation stays **Awaiting payment** in the Control Panel until the webhook arrives.
- **"Payment page not configured" on the reservation page**: no **Payment Page Entry** is set, or the entry is unpublished, private or has no URL.

## Related

- [Manual reservations](./manual-reservations): create reservations and request payment from the Control Panel.
- [Payment gateways](./payment-gateways): online and offline methods, surcharges and webhook routes.
- [Stripe](./stripe): the JavaScript and webhook the page relies on for card payments.
- [Emails](./emails): customize the payment request email.
- [Reservation status](./reservation-status): the self-service page for confirmed bookings.
- [Languages](./languages): translate the page.
