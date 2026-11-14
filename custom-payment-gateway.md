# Writing a custom payment gateway

To use a provider other than Stripe or the built-in offline gateway, write a class that implements `Reach\StatamicResrv\Http\Payment\PaymentInterface` and register it in the `payment_gateways` config array.

::: tip
Surcharges and amount limits need no gateway code, because `PaymentGatewayManager` handles them from config. See [Payment gateways](./payment-gateways).
:::

::: warning Updating a gateway for v6.5
Resrv v6.5.0 changes `PaymentInterface` to support [manual reservations](./manual-reservations), which customers pay from the [payment page](./payment-page):

- `paymentIntent()` gained a 4th parameter, `?string $returnUrl = null`. See [The return URL](#the-return-url).
- `retrievePaymentIntent()` is a new required method. See [Retrieving a payment intent](#retrieving-a-payment-intent).
- `verifyPayment()` must also confirm reservations in the new `awaiting_payment` status. See [Verifying webhooks](#verifying-webhooks).

A gateway missing either of the first two fails to load with a PHP error ("Declaration of …::paymentIntent() must be compatible with …"). Resrv loads every configured gateway, so this breaks checkout, webhooks and the Control Panel reservation pages for all of them. Update your gateway before the Resrv upgrade or in the same deploy.
:::

## The two gateway types

A gateway is either inline or redirect:

- Inline gateways, like Stripe, render a payment form on the checkout page with a Blade view. `redirectsForPayment()` returns `false`.
- Redirect gateways, like PayPal, send the customer to the provider's hosted page and back. `redirectsForPayment()` returns `true`.

## The PaymentInterface

```php
interface PaymentInterface
{
    public function name(): string;                                                      // NEW in v6
    public function label(): string;                                                     // NEW in v6
    public function paymentView(): string;                                               // NEW in v6
    public function paymentIntent($amount, Reservation $reservation, $data, ?string $returnUrl = null); // $returnUrl NEW in v6.5
    public function retrievePaymentIntent(string $paymentId, Reservation $reservation): ?object;        // NEW in v6.5
    public function cancelPaymentIntent(string $paymentId, Reservation $reservation): void; // NEW in v6
    public function refund(Reservation $reservation);
    public function getPublicKey(Reservation $reservation);
    public function getSecretKey(Reservation $reservation);
    public function getWebhookSecret(Reservation $reservation);
    public function supportsWebhooks(): bool;
    public function supportsManualConfirmation(): bool;                                   // NEW in v6
    public function supportsAutomaticRefunds(): bool;                                     // NEW in v6.2
    public function redirectsForPayment(): bool;
    public function handleRedirectBack(): array;
    public function handlePaymentPending(): bool|array;
    public function verifyPayment($request);
    public function verifyWebhook();
}
```

If you're porting a v5 gateway, start with the five methods added in v6.0:

| Method | Returns | Role |
|--------|---------|------|
| `name()` | `string` | Lowercase slug, like `paypal`. Used as a fallback identifier. |
| `label()` | `string` | Default picker label. The config `label` key overrides it. |
| `paymentView()` | `string` | Blade view for the inline payment form. Redirect gateways return the default, which never renders. |
| `supportsManualConfirmation()` | `bool` | `true` only for offline gateways. |
| `cancelPaymentIntent()` | `void` | Voids an abandoned intent. See [Cancelling abandoned intents](#cancelling-abandoned-intents). |

Later releases added these, which both v5 ports and older v6 gateways need:

| Change | Since | Role |
|--------|-------|------|
| `supportsAutomaticRefunds()` | v6.2 | `true` when `refund()` returns money through the provider's API. See [Refunds](#refunds). |
| `retrievePaymentIntent()` | v6.5 | Reads the current state of an intent. See [Retrieving a payment intent](#retrieving-a-payment-intent). |
| `paymentIntent()` 4th parameter, `?string $returnUrl = null` | v6.5 | The base URL a redirect gateway sends the customer back to. See [The return URL](#the-return-url). |

::: warning Implement every method
Every method is required, and `paymentIntent()` must declare the 4th parameter even if you ignore it. A missing method is a fatal error as soon as Resrv loads the gateway. Methods your provider doesn't need can be no-ops, like `cancelPaymentIntent()` in an offline gateway or `retrievePaymentIntent()` returning `null`.
:::

## Identity methods

```php
public function name(): string
{
    return 'paypal'; // lowercase slug, no spaces
}

public function label(): string
{
    return 'PayPal'; // default picker label; overridable via config 'label'
}

public function paymentView(): string
{
    // Inline gateway: your custom view:
    return 'your-package::livewire.paypal-payment';

    // Redirect gateway: default fallback (never actually rendered):
    // return 'statamic-resrv::livewire.checkout-payment';
}

public function supportsManualConfirmation(): bool
{
    return false; // true ONLY for offline / non-provider-verified gateways
}
```

Return `true` from `supportsManualConfirmation()` only when no provider verifies the payment, as with bank transfer. Checkout then shows a "Confirm Reservation" button that confirms the booking straight away. Gateways that confirm through a webhook or redirect callback return `false`.

The bundled Stripe gateway returns:

```php
public function name(): string { return 'stripe'; }
public function label(): string { return 'Credit Card'; }
public function paymentView(): string { return 'statamic-resrv::livewire.checkout-payment'; }
public function supportsManualConfirmation(): bool { return false; }
```

## Creating the payment intent

`paymentIntent()` creates the session at the provider and returns an object Resrv uses for the rest of checkout or the [payment page](./payment-page). `$amount` is a `Price` object that includes any surcharge. `$amount->raw()` gives it in minor units (cents) as a numeric string. Redirect gateways use `$returnUrl` (see [The return URL](#the-return-url)).

### Inline gateways

Return an object with `->id` and `->client_secret`:

```php
// Inline gateways can ignore $returnUrl, but must still declare it.
public function paymentIntent($amount, Reservation $reservation, $data, ?string $returnUrl = null)
{
    $session = YourProvider::createSession([
        'amount' => $amount->raw(), // minor units (cents) as a numeric string
        'currency' => Str::lower(config('resrv-config.currency_isoCode')),
        'metadata' => ['reservation_id' => $reservation->id],
    ]);

    $result = new \stdClass;
    $result->id = $session->id;                     // stored as reservation.payment_id
    $result->client_secret = $session->client_secret; // passed to the frontend JS SDK
    return $result;
}
```

### Redirect gateways

Return an object with `->id` and `->redirectTo`:

```php
public function paymentIntent($amount, Reservation $reservation, $data, ?string $returnUrl = null)
{
    $session = YourProvider::createCheckout([
        'amount' => $amount->raw(),
        'currency' => Str::lower(config('resrv-config.currency_isoCode')),
        'metadata' => ['reservation_id' => $reservation->id],
        'return_url' => $this->buildReturnUrl($reservation, $returnUrl), // see "The return URL" below
    ]);

    $result = new \stdClass;
    $result->id = $session->id;                  // stored as reservation.payment_id
    $result->redirectTo = $session->checkout_url; // customer is sent here
    return $result;
}
```

Always store `reservation_id` in the intent metadata. The stale-intent fallback in `verifyPayment()` needs it.

### The return URL

Redirect gateways build the provider's return URL from `$returnUrl`:

- In checkout, it's the absolute URL of your checkout-complete entry (the page with the <code v-pre>{{ resrv_checkout_redirect }}</code> tag).
- On the [payment page](./payment-page), it's the customer's payment link, which already carries `?ref=…&hash=…`.
- When it's `null`, fall back to the checkout-complete entry.

Then append your own parameters, with `&` as the separator when the base already has a query string:

```php
use Statamic\Facades\Entry;

protected function buildReturnUrl(Reservation $reservation, ?string $returnUrl = null): string
{
    $base = $returnUrl ?? Entry::find(config('resrv-config.checkout_completed_entry'))->absoluteUrl();

    // The payment page's URL already ends in ?ref=…&hash=…, so never hard-code '?'.
    $separator = str_contains($base, '?') ? '&' : '?';

    return $base.$separator.http_build_query([
        'id' => $reservation->id,
        'resrv_gateway' => 'paypal', // the config key you register the gateway under
    ]);
}
```

::: info
In checkout, Resrv adds `resrv_gateway=<config_key>` to your `redirectTo` URL. On the payment page it adds it to `$returnUrl` instead. Append it yourself anyway, since a duplicate does no harm. The <code v-pre>{{ resrv_checkout_redirect }}</code> tag and the payment page use it to identify your gateway.
:::

## The inline payment view

The view from `paymentView()` renders inside the `CheckoutPayment` Livewire component at checkout and the `reservation-payment` component on the [payment page](./payment-page). Both pass these to it:

| Property | Type | Description |
|----------|------|-------------|
| `$wire.clientSecret` | string | From `paymentIntent()->client_secret` |
| `$wire.publicKey` | string | From `getPublicKey()` |
| `$wire.checkoutCompletedUrl` | string | Where to send the customer after paying (the payment link on the payment page) |
| `$amount` | float | Formatted payment amount, as a Blade variable |

Load your provider's JavaScript in your payment page layout too.

After payment, send the customer to `checkout_completed_url` with `redirect_status` appended, using `&` when the URL already has a query string (the payment link always does). The payment page shows **Payment processing** only for `redirect_status=succeeded` or `redirect_status=processing` (or Stripe's `payment_intent` / `payment_intent_client_secret` parameters). `redirect_status=failed` shows the **Pay** button again. Without them, a customer who just paid sees **Complete your payment** until the webhook confirms the booking.

A minimal view at `resources/views/livewire/paypal-payment.blade.php`:

```blade
<div>
    <div x-data="paypalPayment">
        <div class="my-6 xl:my-8">
            <div class="text-lg xl:text-xl font-medium mb-2">
                {{ trans('statamic-resrv::frontend.payment') }}
            </div>
        </div>
        <div id="paypal-button-container" x-ref="paypalButtons"></div>
        <p x-show="errors" x-cloak x-transition class="mt-6 text-red-600">
            <span x-html="errors"></span>
        </p>
    </div>
</div>

@script
<script>
Alpine.data('paypalPayment', () => ({
    client_id: $wire.publicKey,
    checkout_completed_url: $wire.checkoutCompletedUrl,
    errors: false,

    init() {
        // Load the provider's JS SDK and render the payment UI.
        // On approval, redirect to this.checkout_completed_url with redirect_status appended:
        // const sep = this.checkout_completed_url.includes('?') ? '&' : '?';
        // window.location.href = this.checkout_completed_url + sep + 'redirect_status=succeeded';
    },
}));
</script>
@endscript
```

Make the view publishable and return its namespaced path from `paymentView()`, like `'your-package::livewire.paypal-payment'`, so a published copy overrides it.

## Handling the redirect back

When a customer returns from a redirect gateway, the <code v-pre>{{ resrv_checkout_redirect }}</code> tag finds your gateway from the `resrv_gateway` query parameter and calls `handleRedirectBack()`. It must return an array with a `status` of `true`, `false` or `'pending'`:

```php
public function handleRedirectBack(): array
{
    // Always check for pending payments first
    if ($pending = $this->handlePaymentPending()) {
        return $pending;
    }

    $sessionId = request()->input('session_id');
    $reservation = Reservation::findByPaymentId($sessionId)->first();

    // No match: payment_id was cleared because the customer abandoned, switched
    // gateway, etc. Short-circuit to the failure path, since falling back to the session
    // reservation would show success for a booking no webhook will confirm.
    if (! $reservation) {
        return ['status' => false, 'reservation' => []];
    }

    $session = YourProvider::getSession($sessionId);

    return [
        'status' => $session->status === 'paid',
        'reservation' => $reservation->toArray(),
    ];
}
```

`handlePaymentPending()` returns a pending state when `?payment_pending=<id>` is present, for async methods like bank transfer, and `false` otherwise:

```php
public function handlePaymentPending(): bool|array
{
    if (! request()->has('payment_pending')) {
        return false;
    }

    $reservation = Reservation::find(request()->input('payment_pending'));

    return [
        'status' => 'pending',
        'reservation' => $reservation ? $reservation->toArray() : [],
    ];
}
```

The checkout-completed page shows a success, failure or pending message based on `status`.

The [payment page](./payment-page) also calls `handleRedirectBack()`, but only to pick a message: `true` or `'pending'` shows "Payment processing" and `false` lets the customer try again. The webhook still confirms the booking, so `handleRedirectBack()` needs no changes for the payment page.

## Verifying webhooks

Gateways that confirm through a webhook return `true` from `supportsWebhooks()` and implement `verifyPayment()`. Register the webhook at your gateway's own route, where the last segment matches the config key:

```text
POST https://yoursite.com/resrv/api/webhook/paypal
POST https://yoursite.com/resrv/api/webhook/stripe
```

The bare `/resrv/api/webhook` route still goes to the default gateway on single-gateway sites, but returns a 404 when you configure more than one. See [Payment gateways](./payment-gateways#webhook-routes).

`verifyPayment()` should:

1. Verify the signature against the webhook secret and reject the request if it doesn't match.
2. Find the reservation by `payment_id`, with a metadata fallback for stale intents.
3. On success, call `transitionTo(CONFIRMED, tolerant: true)` and dispatch `ReservationConfirmed` only if it returns `true`. Don't check for `pending` first. The transition confirms both `pending` checkouts and `awaiting_payment` [manual reservations](./manual-reservations), and returns `false` for anything else.
4. Leave a failed attempt alone. A declined card can be retried, so don't cancel or release the hold.
5. Return a 200 response so the provider stops retrying.

```php
public function verifyPayment($request)
{
    $payload = json_decode($request->getContent(), true);
    $data = $payload['data']['object'];

    // Verify the webhook signature against getWebhookSecret($reservation) here.

    $reservation = Reservation::findByPaymentId($data['id'])->first();

    // Stale-intent fallback: payment_id was cleared by Resrv before the provider's
    // cancellation took effect. Recover the reservation from intent metadata so the
    // charge isn't lost.
    $isStaleIntent = false;
    if (! $reservation && isset($data['metadata']['reservation_id'])) {
        $reservation = Reservation::find($data['metadata']['reservation_id']);
        $isStaleIntent = (bool) $reservation;
    }

    if (! $reservation) {
        return response()->json([], 200);
    }

    if ($eventType === 'succeeded') {
        if ($isStaleIntent) {
            // The customer walked away (refresh, back, gateway switch, coupon change)
            // before this webhook arrived. Confirming now would email and decrease
            // inventory against an amount/gateway the reservation no longer matches.
            Log::warning('Payment intent succeeded after being abandoned; manual reconciliation may be required.', [
                'reservation_id' => $reservation->id,
                'payment_intent_id' => $data['id'],
            ]);

            return response()->json([], 200);
        }

        // Confirms PENDING and AWAITING_PAYMENT rows alike: no pending-only check in front of it.
        if ($reservation->transitionTo(ReservationStatus::CONFIRMED, tolerant: true)) {
            ReservationConfirmed::dispatch($reservation, ReservationConfirmed::VIA_WEBHOOK, [
                'gateway' => $reservation->payment_gateway,
                'payment_id' => $data['id'],
            ]);

            return response()->json([], 200);
        }

        // The transition was skipped because the row changed under the lock: see
        // the orphan-payment race below.
        $reservation->refresh();
        \Reach\StatamicResrv\Mail\OrphanedPaymentNotification::notifyIfOrphaned($reservation, $data['id']);
    }

    // A failed ATTEMPT is retryable: do nothing, leaving the reservation PENDING
    // (or AWAITING_PAYMENT, so the customer can pay again from the same link).

    if ($eventType === 'canceled' && ! $isStaleIntent) {
        // A genuinely-canceled intent is dead. expire() no-ops if not PENDING,
        // so an AWAITING_PAYMENT reservation stays open.
        $reservation->expire();
    }

    return response()->json([], 200);
}
```

Pass `ReservationConfirmed::VIA_WEBHOOK`, the gateway and the payment id, as above, so the [activity log](./activity-log) shows "Confirmed by payment webhook".

A failed or cancelled intent must never end an **Awaiting payment** reservation, since the customer can still pay from the same link. `expire()` only touches `pending` reservations, so don't call any other transition for these events.

::: warning Log and ignore stale successes
Logging a stale success instead of confirming it means Resrv never confirms a reservation against an amount or gateway the customer abandoned. You then reconcile the orphan charge at the provider by hand. The Stripe gateway does this, and we suggest the same for any provider that confirms asynchronously.
:::

### The orphan-payment race

A live intent can still lose a race. `ExpireReservations` runs on every availability search and can move a `PENDING` reservation to `EXPIRED` between your webhook's checks and its confirmation. From v6.5.0, the lapsed-hold sweep (`resrv:cancel-lapsed-holds`) can also cancel an `awaiting_payment` manual reservation while its payment is going through.

`Reservation::transitionTo()` re-reads the row under a `lockForUpdate`. With `tolerant: true` it returns `false` instead of throwing when the row has moved to an incompatible state. On `false`, refresh the reservation and report the orphaned charge:

```php
$reservation->refresh();

// Logs and notifies admins when the row is EXPIRED, REFUNDED, CANCELLED or PARTNER
// (a cancelled booking's own retained charge excepted). Dedupes on (reservation, intent)
// so provider retries don't spam admins.
\Reach\StatamicResrv\Mail\OrphanedPaymentNotification::notifyIfOrphaned($reservation, $data['id']);

return response()->json([], 200);
```

If your gateway checks the terminal statuses by hand and calls `dispatchFor()`, switch to `notifyIfOrphaned()`. A hand-written list of `EXPIRED`, `REFUNDED` and `PARTNER` misses a late payment on a cancelled hold.

Return `200` either way and reconcile from the logged orphan. The bundled `StripePaymentGateway` does the same.

::: info Manual-confirmation gateways
Offline gateways (`supportsManualConfirmation()` returns `true`) confirm through Resrv's `CheckoutPayment::confirmPayment()`, which already does this re-read and shows the customer an "expired" error. You don't need to add anything.
:::

`verifyWebhook()` is a health check for the GET webhook route. Built-in gateways return `true`.

## Cancelling abandoned intents

Resrv calls `cancelPaymentIntent()` to void an intent at the provider when the customer:

1. Navigates back from step 3 to step 1 or 2.
2. Switches gateway at the picker on step 3.
3. Re-enters step 2 with a stale intent from an earlier pass.
4. Reopens a PENDING checkout whose time ran out.

For [manual reservations](./manual-reservations), Resrv also calls it when:

- An admin or the lapsed-hold sweep cancels an awaiting-payment reservation.
- An admin marks a reservation as paid while the customer's online payment is still open.
- The payment page has to replace an intent it can't resume.

Resrv then checks the void with [`retrievePaymentIntent()`](#retrieving-a-payment-intent).

```php
public function cancelPaymentIntent(string $paymentId, Reservation $reservation): void
{
    try {
        // Best-effort void/cancel at the provider:
        //   Stripe:  PaymentIntent::retrieve($paymentId)->cancel()  (only in a cancellable status)
        //   PayPal:  POST /v2/checkout/orders/{id}/void
        //   Adyen:   POST /cancels with originalReference=$paymentId
        YourProvider::cancelOrder($paymentId);
    } catch (\Throwable $e) {
        Log::warning('Failed to cancel provider intent: '.$e->getMessage(), [
            'payment_id' => $paymentId,
            'reservation_id' => $reservation->id,
        ]);
    }
}
```

- Only cancel intents that can be cancelled. Cancelling a `succeeded` or already `canceled` intent usually throws.
- Log provider errors and don't re-throw them (Resrv would log and swallow them anyway). In checkout, Resrv has already cleared `reservation.payment_id`, so a failed cancellation only leaves an orphan at the provider. For manual reservations, Resrv keeps the reference until `retrievePaymentIntent()` shows the intent is dead.
- Don't try to rescue a succeeded intent here. The stale-intent fallback in `verifyPayment()` handles that.

Offline and test gateways have nothing to clean up, so `OfflinePaymentGateway` and `FakePaymentGateway` make it a no-op:

```php
public function cancelPaymentIntent(string $paymentId, Reservation $reservation): void
{
    //
}
```

## Retrieving a payment intent <Badge type="tip" text="NEW" />

`retrievePaymentIntent()`, required from v6.5.0, reads the current state of an intent your gateway created. Checkout never calls it. [Manual reservations](./manual-reservations) use it to:

1. Resume an interrupted payment on the [payment page](./payment-page) instead of creating a second intent.
2. Check a void after `cancelPaymentIntent()`. Resrv drops the reference only when the intent reads `canceled` or `null`.
3. Decide whether to void or keep the customer's intent when an admin marks the reservation as paid. An intent that took money is kept.
4. Refund a reservation marked as paid only when its intent reads `succeeded` or `processing`.

```php
public function retrievePaymentIntent(string $paymentId, Reservation $reservation): ?object
```

Return an object with a `->status` property, using Stripe's status names. Map your provider's statuses to these:

- `succeeded`, `processing` or `requires_capture`: the money is captured, settling or held. Resrv keeps the reference and won't create another intent. Marking the reservation as paid voids an uncaptured `requires_capture` hold instead.
- `canceled`: the intent is dead, and Resrv may replace or forget it.
- Anything else, such as `requires_payment_method` or `requires_action`: still payable, so Resrv resumes it.

While the intent is payable, include `->redirectTo` (redirect gateways) or `->client_secret` (inline gateways) so Resrv can resume the same payment. Otherwise Resrv voids it and creates a new one through `paymentIntent()` on every resume.

Return `null` only when the intent definitely doesn't exist, such as an HTTP 404 or Stripe's `resource_missing`. Resrv treats `null` as gone.

Throw on transient failures: timeouts, rate limits (429), 5xx responses, authentication and connection errors. Never catch everything and return `null`, or Resrv may create a second chargeable intent, lose a charge that captures later, or skip a real refund.

After `cancelPaymentIntent()` voids an intent, report it as `canceled`. Resrv checks for `canceled` or `null` before it creates a replacement. If the old intent still looks payable, the payment attempt stops with a retryable error.

The bundled Stripe gateway returns the Stripe intent itself, which already has `->status` and `->client_secret`:

```php
public function retrievePaymentIntent(string $paymentId, Reservation $reservation): ?object
{
    try {
        return $this->getClient($reservation)->paymentIntents->retrieve($paymentId);
    } catch (InvalidRequestException $e) {
        // Only a definitely-gone intent may be replaced with a fresh one. Every transient
        // failure must propagate so a brownout on this read can't orphan a live intent.
        if ($e->getError()?->code === 'resource_missing' || $e->getHttpStatus() === 404) {
            return null;
        }

        throw $e;
    }
}
```

Offline gateways have no provider intent and return `null`. That's safe, because they return `true` from `supportsManualConfirmation()` and Resrv never relies on a retrieved status for them:

```php
public function retrievePaymentIntent(string $paymentId, Reservation $reservation): ?object
{
    // Offline payments have no remote intent to resume.
    return null;
}
```

## Refunds

Resrv calls `refund()` when an admin refunds a reservation in the Control Panel, using the gateway stored in the reservation's `payment_gateway` column. Throw `RefundFailedException` on failure and the Control Panel shows an error.

```php
public function refund($reservation)
{
    try {
        $result = YourProvider::refund($reservation->payment_id);
    } catch (\Exception $e) {
        throw new \Reach\StatamicResrv\Exceptions\RefundFailedException($e->getMessage());
    }

    return $result;
}
```

`refund()` also runs when a customer cancels their own reservation from the [reservation status page](./reservation-status#cancelling-a-reservation), but only if your gateway returns money automatically:

```php
public function supportsAutomaticRefunds(): bool
{
    return true; // false only when refund() moves no money (bank transfer, pay at premises)
}
```

With `false`, customers can't cancel those bookings themselves. An admin returns the money and then refunds the reservation in the Control Panel.

Resrv skips `refund()` for a reservation an admin [marked as paid](./manual-reservations#mark-as-paid), since the admin returns that money by hand. If it kept an online intent reference, Resrv calls `refund()` only when [`retrievePaymentIntent()`](#retrieving-a-payment-intent) reads `succeeded` or `processing`.

## Provider keys

These three methods return the public, secret and webhook signing keys. Each receives the `$reservation`, so you can return different keys per collection, as the [Stripe](./stripe#per-collection-stripe-accounts) gateway does.

```php
public function getPublicKey($reservation)
{
    return config('resrv-config.paypal_client_id');
}

public function getSecretKey($reservation)
{
    return config('resrv-config.paypal_secret');
}

public function getWebhookSecret($reservation)
{
    return config('resrv-config.paypal_webhook_id');
}
```

## Registering the gateway

Add your gateway to `config/resrv-config.php` under `payment_gateways`:

```php
'payment_gateways' => [
    'stripe' => [
        'class' => \Reach\StatamicResrv\Http\Payment\StripePaymentGateway::class,
        'label' => 'Credit Card',
    ],
    'paypal' => [
        'class' => \App\Payment\PayPalPaymentGateway::class,
        'label' => 'PayPal',
    ],
],
```

- The config key (`'paypal'`) is stored in the reservation's `payment_gateway` column and used for refunds, webhooks and redirect callbacks. Don't change it once reservations use it.
- `label` is optional and defaults to the gateway's `label()`.
- The first entry is the default gateway, used for old reservations with a null `payment_gateway`.
- The old singular `payment_gateway` key still works as a fallback when `payment_gateways` is empty.

## Complete redirect-gateway skeleton

A starting point for a redirect gateway:

```php
<?php

namespace App\Payment;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Reach\StatamicResrv\Enums\ReservationStatus;
use Reach\StatamicResrv\Events\ReservationConfirmed;
use Reach\StatamicResrv\Exceptions\RefundFailedException;
use Reach\StatamicResrv\Http\Payment\PaymentInterface;
use Reach\StatamicResrv\Models\Reservation;
use Statamic\Facades\Entry;

class PayPalPaymentGateway implements PaymentInterface
{
    // --- Identity ---

    public function name(): string
    {
        return 'paypal';
    }

    public function label(): string
    {
        return 'PayPal';
    }

    public function paymentView(): string
    {
        // Redirect gateway: never rendered, return the default as a fallback.
        return 'statamic-resrv::livewire.checkout-payment';
    }

    public function supportsManualConfirmation(): bool
    {
        return false;
    }

    // --- Payment flow ---

    public function paymentIntent($amount, Reservation $reservation, $data, ?string $returnUrl = null)
    {
        // TODO: create a checkout session with the provider's API.
        // $amount->raw() = minor units (cents) as a numeric string.
        // Give the provider $this->buildReturnUrl($reservation, $returnUrl) as its return URL.
        $result = new \stdClass;
        $result->id = 'PROVIDER_SESSION_ID';                  // stored as reservation.payment_id
        $result->redirectTo = 'https://provider.com/checkout/...'; // customer is sent here
        return $result;
    }

    public function retrievePaymentIntent(string $paymentId, Reservation $reservation): ?object
    {
        // TODO: fetch the order from the provider's API. Return null ONLY when the provider
        // says it doesn't exist (e.g. 404); let timeouts, 429s, 5xx and auth errors throw.
        $result = new \stdClass;
        $result->id = $paymentId;
        $result->status = 'requires_payment_method';          // map the provider's status to Stripe's vocabulary
        $result->redirectTo = 'https://provider.com/checkout/...'; // while the order is still payable
        return $result;
    }

    protected function buildReturnUrl(Reservation $reservation, ?string $returnUrl = null): string
    {
        // $returnUrl is the payment page's link (already carrying ?ref=…&hash=…) or the
        // checkout-complete entry; fall back to the latter when it's null.
        $base = $returnUrl ?? Entry::find(config('resrv-config.checkout_completed_entry'))->absoluteUrl();
        $separator = str_contains($base, '?') ? '&' : '?';

        return $base.$separator.http_build_query([
            'id' => $reservation->id,
            'resrv_gateway' => 'paypal', // the config key you register the gateway under
        ]);
    }

    public function redirectsForPayment(): bool
    {
        return true;
    }

    public function handleRedirectBack(): array
    {
        if ($pending = $this->handlePaymentPending()) {
            return $pending;
        }

        $token = request()->input('token');
        $reservation = Reservation::findByPaymentId($token)->first();

        if (! $reservation) {
            return ['status' => false, 'reservation' => []];
        }

        // TODO: verify payment with the provider's API using $token.
        $paid = true;

        return [
            'status' => $paid,
            'reservation' => $reservation->toArray(),
        ];
    }

    public function handlePaymentPending(): bool|array
    {
        if (! request()->has('payment_pending')) {
            return false;
        }

        $reservation = Reservation::find(request()->input('payment_pending'));

        return [
            'status' => 'pending',
            'reservation' => $reservation ? $reservation->toArray() : [],
        ];
    }

    // --- Cancellation ---

    public function cancelPaymentIntent(string $paymentId, Reservation $reservation): void
    {
        try {
            // TODO: void/cancel the order at the provider (best-effort).
        } catch (\Throwable $e) {
            Log::warning('Failed to cancel provider intent: '.$e->getMessage(), [
                'payment_id' => $paymentId,
                'reservation_id' => $reservation->id,
            ]);
        }
    }

    // --- Webhooks ---

    public function supportsWebhooks(): bool
    {
        return true;
    }

    public function verifyWebhook()
    {
        return true;
    }

    public function verifyPayment($request)
    {
        // TODO: verify signature, find the reservation (with metadata fallback),
        // and route success through transitionTo(CONFIRMED, tolerant: true), which
        // confirms both PENDING and AWAITING_PAYMENT reservations. Dispatch
        // ReservationConfirmed with ReservationConfirmed::VIA_WEBHOOK.
        return response()->json([], 200);
    }

    // --- Refund ---

    public function supportsAutomaticRefunds(): bool
    {
        return true; // refund() returns money through the provider's API
    }

    public function refund($reservation)
    {
        try {
            // TODO: call the provider's refund API using $reservation->payment_id.
        } catch (\Exception $e) {
            throw new RefundFailedException($e->getMessage());
        }

        return true;
    }

    // --- Keys ---

    public function getPublicKey($reservation)
    {
        return config('resrv-config.paypal_client_id');
    }

    public function getSecretKey($reservation)
    {
        return config('resrv-config.paypal_secret');
    }

    public function getWebhookSecret($reservation)
    {
        return config('resrv-config.paypal_webhook_id');
    }
}
```

For an inline gateway, change these:

- `redirectsForPayment()` returns `false`.
- `paymentIntent()` and `retrievePaymentIntent()` return `->client_secret` instead of `->redirectTo`.
- `paymentIntent()` can ignore `$returnUrl`, so you don't need `buildReturnUrl()`.
- `paymentView()` returns your Blade view (see [The inline payment view](#the-inline-payment-view)).

## Checklist

Before deploying a custom gateway:

- [ ] Every method is implemented, including `paymentIntent()`'s 4th parameter, `?string $returnUrl = null`.
- [ ] `name()` is a unique lowercase slug, and `supportsManualConfirmation()` is `true` only for offline gateways.
- [ ] `paymentIntent()` returns `->id` with `->client_secret` (inline) or `->redirectTo` (redirect), and stores `reservation_id` in the provider metadata.
- [ ] Redirect gateways build the return URL from `$returnUrl`, fall back to the page with <code v-pre>{{ resrv_checkout_redirect }}</code> when it's `null`, and use `&` when there's already a query string.
- [ ] `retrievePaymentIntent()` maps statuses to Stripe's names, returns `null` only for a missing intent, throws on transient failures, and reports `canceled` after a void.
- [ ] `handleRedirectBack()` checks `handlePaymentPending()` first.
- [ ] `verifyPayment()` verifies the signature, confirms through `transitionTo(CONFIRMED, tolerant: true)` with no `pending`-only check, and dispatches `ReservationConfirmed` with `ReservationConfirmed::VIA_WEBHOOK` only when that succeeds.
- [ ] `verifyPayment()` handles stale intents and orphans (with `notifyIfOrphaned()`), leaves failed attempts alone, and never ends an `awaiting_payment` reservation on a failed or cancelled intent.
- [ ] `supportsWebhooks()` is `true` if you confirm through webhooks. Online gateways that return `false` can't be used for manual reservations.
- [ ] `cancelPaymentIntent()` voids the intent at the provider, or is a no-op for offline gateways.
- [ ] `supportsAutomaticRefunds()` is `true` only when `refund()` moves money, and `refund()` throws `RefundFailedException` on failure.
- [ ] The gateway is registered under `payment_gateways` in `config/resrv-config.php`, and the provider's webhook URL ends in its config key.
- [ ] Inline gateways have a working, publishable Blade view.

## Related

- [Payment gateways](./payment-gateways): the gateway picker, surcharges, amount limits and webhook routes.
- [Stripe](./stripe): the bundled inline gateway, including per-collection accounts.
- [Mollie](./mollie): maintained as a separate add-on.
- [Manual reservations](./manual-reservations): bookings created in the Control Panel and paid through your gateway.
- [Payment page](./payment-page): where customers pay for manual reservations.
