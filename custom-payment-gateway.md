# Writing a custom payment gateway

Resrv ships with Stripe and an offline (bank transfer / pay-at-premises) gateway out of the box. If you need a different provider (PayPal, Square, Adyen, Braintree, or anything else), you write a class that implements `Reach\StatamicResrv\Http\Payment\PaymentInterface` and register it in the `payment_gateways` config array.

This page walks through the full interface, the two gateway types (inline and redirect), and the races you must handle for a production-grade integration. For multi-gateway concepts (the picker, surcharges, amount limits), see [Payment gateways](./payment-gateways).

::: tip
A custom gateway slots straight into the multi-gateway machinery. Surcharges and amount limits are purely config-time concerns handled by `PaymentGatewayManager`, so they work with your gateway without any code changes.
:::

## The two gateway types

Every gateway is either **inline** or **redirect**, decided by `redirectsForPayment()`:

- **Inline gateways** (e.g. Stripe, Square) render a payment form directly on the checkout page via a Blade view. `redirectsForPayment()` returns `false`.
- **Redirect gateways** (e.g. PayPal, Mollie, iDEAL) send the customer to the provider's hosted page, then back to your site. `redirectsForPayment()` returns `true`.

Both types implement the same interface; only a handful of methods behave differently.

## The PaymentInterface

```php
interface PaymentInterface
{
    public function name(): string;                                                      // NEW in v6
    public function label(): string;                                                     // NEW in v6
    public function paymentView(): string;                                               // NEW in v6
    public function paymentIntent($amount, Reservation $reservation, $data);
    public function cancelPaymentIntent(string $paymentId, Reservation $reservation): void; // NEW in v6
    public function refund(Reservation $reservation);
    public function getPublicKey(Reservation $reservation);
    public function getSecretKey(Reservation $reservation);
    public function getWebhookSecret(Reservation $reservation);
    public function supportsWebhooks(): bool;
    public function supportsManualConfirmation(): bool;                                   // NEW in v6
    public function redirectsForPayment(): bool;
    public function handleRedirectBack(): array;
    public function handlePaymentPending(): bool|array;
    public function verifyPayment($request);
    public function verifyWebhook();
}
```

Five methods are new in v6. If you are porting a v5 gateway, these are the ones you must add:

| Method | Returns | Role |
|--------|---------|------|
| `name()` | `string` | Machine-readable slug: lowercase, no spaces (e.g. `paypal`). Fallback identifier. |
| `label()` | `string` | Default human label shown in the gateway picker. Overridable per-install via the config `label` key. |
| `paymentView()` | `string` | The Blade view rendering the inline payment UI. Redirect gateways return the default view as a never-rendered fallback. |
| `supportsManualConfirmation()` | `bool` | `true` only for offline/non-provider-verified gateways. Stripe and other provider-backed gateways return `false`. |
| `cancelPaymentIntent()` | `void` | Voids an abandoned provider-side intent. See [Cancelling abandoned intents](#cancelling-abandoned-intents). |

::: warning Implement all five
`cancelPaymentIntent()` is required by the interface: your gateway will fatal at boot if it's missing, even though it can be a no-op for some providers.
:::

## Identity methods

`name()`, `label()`, `paymentView()` and `supportsManualConfirmation()` identify your gateway and tell Resrv how to render it.

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

`supportsManualConfirmation()` returns `true` only when the customer confirms without a provider verifying the transaction in real time (bank transfer, pay-on-premises). When `true`, the checkout UI shows a "Confirm Reservation" button that confirms the reservation immediately. For any provider-backed gateway, confirmation comes from a webhook or redirect callback instead, so this must be `false`.

For reference, the bundled Stripe gateway returns:

```php
public function name(): string { return 'stripe'; }
public function label(): string { return 'Credit Card'; }
public function paymentView(): string { return 'statamic-resrv::livewire.checkout-payment'; }
public function supportsManualConfirmation(): bool { return false; }
```

## Creating the payment intent

`paymentIntent()` creates the provider-side session and returns an object Resrv reads to drive the rest of checkout. `$amount` is a `Price` object: call `$amount->raw()` for the numeric string in minor units (cents). The return value differs by gateway type.

### Inline gateways

Return an object with `->id` and `->client_secret`:

```php
public function paymentIntent($amount, Reservation $reservation, $data)
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
public function paymentIntent($amount, Reservation $reservation, $data)
{
    $session = YourProvider::createCheckout([
        'amount' => $amount->raw(),
        'currency' => Str::lower(config('resrv-config.currency_isoCode')),
        'metadata' => ['reservation_id' => $reservation->id],
    ]);

    $result = new \stdClass;
    $result->id = $session->id;                  // stored as reservation.payment_id
    $result->redirectTo = $session->checkout_url; // customer is sent here
    return $result;
}
```

::: info
Resrv automatically appends `resrv_gateway=<config_key>` to the `redirectTo` URL before redirecting; you don't add it yourself. Point your provider's return URL at the Statamic page that uses the <code v-pre>{{ resrv_checkout_redirect }}</code> tag; that tag reads `resrv_gateway` from the query string to resolve the right gateway on the way back.
:::

Always stash `reservation_id` in the intent metadata as shown above. The stale-intent fallback in `verifyPayment()` relies on it.

## The inline payment view

Inline gateways render a Blade view (returned from `paymentView()`) inside the `CheckoutPayment` Livewire component. The component exposes these to your view:

| Property | Type | Description |
|----------|------|-------------|
| `$wire.clientSecret` | string | From `paymentIntent()->client_secret` |
| `$wire.publicKey` | string | From `getPublicKey()` |
| `$wire.checkoutCompletedUrl` | string | URL of the checkout-completed Statamic entry |
| `$amount` | float | Formatted payment amount, available as a Blade variable |

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
        // On approval, redirect to this.checkout_completed_url.
    },
}));
</script>
@endscript
```

Make the view publishable so installs can customize it, and have `paymentView()` return the namespaced path (e.g. `'your-package::livewire.paypal-payment'`). Laravel resolves published views first, so an overridden copy wins automatically.

Redirect gateways skip this entirely: return the default `statamic-resrv::livewire.checkout-payment` view as a fallback that is never rendered.

## Handling the redirect back

Redirect gateways must implement `handleRedirectBack()`. When the customer returns, the <code v-pre>{{ resrv_checkout_redirect }}</code> tag resolves your gateway (via the `resrv_gateway` query param) and calls this method. It must return an array with a `status` key of `true`, `false`, or `'pending'`:

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

`handlePaymentPending()` returns a pending state when `?payment_pending=<id>` is present (useful for async methods like bank transfers), and `false` otherwise:

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

The three `status` values map to the success, failure, and pending messages the customer sees on the checkout-completed page.

## Verifying webhooks

Gateways that confirm via webhook (`supportsWebhooks()` returns `true`) implement `verifyPayment()`. Register each provider's webhook at the per-gateway route; the segment must match the config key:

```text
POST https://yoursite.com/resrv/api/webhook/paypal
POST https://yoursite.com/resrv/api/webhook/stripe
```

The bare `/resrv/api/webhook` route still resolves to the default gateway for single-gateway sites, but returns a 404 when multiple gateways are configured. See [Payment gateways](./payment-gateways#webhook-routes) for routing details.

A production `verifyPayment()` does four things:

1. **Verify the signature** against the webhook secret. Reject if it doesn't match.
2. **Find the reservation** by `payment_id`, with a metadata fallback for stale intents.
3. **Confirm on success**, but route it through `transitionTo(CONFIRMED, tolerant: true)` and gate `ReservationConfirmed` on the result. Leave a failed *attempt* PENDING (a declined card is retryable; don't cancel it or release the hold).
4. **Return a 200 response** so the provider stops retrying.

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

        if ($reservation->transitionTo(ReservationStatus::CONFIRMED, tolerant: true)) {
            ReservationConfirmed::dispatch($reservation);

            return response()->json([], 200);
        }

        // The transition was skipped because the row changed under the lock: see
        // the orphan-payment race below.
        $reservation->refresh();
        \Reach\StatamicResrv\Mail\OrphanedPaymentNotification::notifyIfOrphaned($reservation, $data['id']);
    }

    // A failed ATTEMPT is retryable: do nothing, leaving the reservation PENDING.

    if ($eventType === 'canceled' && ! $isStaleIntent) {
        // A genuinely-canceled intent is dead. expire() no-ops if not PENDING.
        $reservation->expire();
    }

    return response()->json([], 200);
}
```

::: warning Log and ignore stale successes
The policy above guarantees Resrv never confirms a reservation against an amount or gateway the customer has since walked away from, at the cost of you manually reconciling the orphan charge at the provider. Resrv ships this trade-off for Stripe; adopt the same for any provider that confirms asynchronously.
:::

### The orphan-payment race

A second, subtler race remains even for a *live* intent. `ExpireReservations` runs on every availability search and can flip a still-`PENDING` reservation to `EXPIRED` in the window between your webhook's in-memory checks and the moment it writes the confirmation.

Resrv's state changes go through `Reservation::transitionTo()`, which re-reads the row under a `lockForUpdate`. Called with `tolerant: true`, it returns `false` (instead of throwing) when the row moved to an incompatible state. **Gate `ReservationConfirmed` on its return, and re-read on `false`** to surface a terminal state as an orphaned charge:

```php
$reservation->refresh();

if (in_array($reservation->status, [
    ReservationStatus::EXPIRED->value,
    ReservationStatus::REFUNDED->value,
    ReservationStatus::PARTNER->value,
], true)) {
    Log::warning('Succeeded webhook lost the confirmation race; manual refund likely required.', [
        'reservation_id' => $reservation->id,
        'reservation_status' => $reservation->status,
        'payment_intent_id' => $data['id'],
    ]);

    // Notify admins for manual reconciliation. Dedupes on (reservation, intent)
    // so provider retries don't spam admins.
    \Reach\StatamicResrv\Mail\OrphanedPaymentNotification::dispatchFor($reservation, $data['id']);
}

return response()->json([], 200);
```

Returning `200` stops provider retries; the logged/notified orphan is the single source of truth for manual reconciliation. The bundled `StripePaymentGateway` does exactly this, and Resrv's webhook regression tests cover the race.

::: info Manual-confirmation gateways
Offline-style gateways (`supportsManualConfirmation()` returns `true`) confirm through Resrv's built-in `CheckoutPayment::confirmPayment()`, which already performs this re-read and shows the customer an "expired" error instead of a false success. You don't add anything for that path; it lives in Resrv core.
:::

`verifyWebhook()` is a health check for the GET webhook route. Built-in gateways return `true`.

## Cancelling abandoned intents

`cancelPaymentIntent()` voids an intent the customer abandoned after it was already created at the provider. Resrv calls it when the customer:

1. Navigates back from step 3 to step 1 or 2.
2. Switches gateway at the picker on step 3.
3. Re-enters step 2 with a stale intent still persisted from an earlier pass.
4. Reopens a time-expired PENDING checkout.

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

Key points:

- **Only cancel intents in a cancellable state.** Trying to cancel a `succeeded` or already-`canceled` intent usually throws.
- **Swallow provider errors** (log them, don't re-throw). By the time Resrv calls you, it has already cleared `reservation.payment_id` in the database: a failed cancellation only leaves an orphan at the provider, not inconsistent Resrv state. Exceptions you throw are logged and swallowed anyway.
- **Don't try to rescue a succeeded intent here.** If a race confirms an intent you're cancelling, the recovery path lives in the stale-intent fallback in `verifyPayment()`.
- This path runs whenever `payment_id` is non-empty; it is **not** gated on surcharge. Even single-gateway setups left abandoned intents behind before; implementing this fixes that regardless of surcharge configuration.

For providers that never create a remote resource needing cleanup (offline / bank-transfer / test gateways), make it a no-op. `OfflinePaymentGateway` and `FakePaymentGateway` both do:

```php
public function cancelPaymentIntent(string $paymentId, Reservation $reservation): void
{
    //
}
```

## Refunds

`refund()` is called from the Control Panel when an admin refunds a reservation. Resrv resolves the correct gateway from the reservation's stored `payment_gateway` column, so a PayPal booking refunds through PayPal, a Stripe booking through Stripe. Throw `RefundFailedException` on failure; the CP controller catches it and returns an error.

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

## Provider keys

The three key methods supply the public, secret, and webhook-signing keys. Each receives the `$reservation`, so you can return per-collection keys based on the reserved entry's collection (the same per-collection pattern Stripe uses, see [Stripe](./stripe#per-collection-stripe-accounts)).

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

Add your gateway to the application's `config/resrv-config.php` under `payment_gateways`:

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

- **The config key** (`'paypal'`) is stored in the reservation's `payment_gateway` column and used to resolve the gateway for refunds, webhooks, and redirect callbacks. Choose a stable slug and don't change it once reservations exist under it.
- **`label`** is optional; omit it to use the gateway's `label()`.
- **The first entry** is the default gateway, used as a fallback for old reservations with a null `payment_gateway`.
- The legacy singular `payment_gateway` key still works as the fallback when `payment_gateways` is empty; you don't need to remove it.

For surcharges and amount limits per gateway, see [Payment gateways](./payment-gateways).

## Complete redirect-gateway skeleton

A full starting point for a redirect-based gateway (PayPal, Mollie, iDEAL):

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

    public function paymentIntent($amount, Reservation $reservation, $data)
    {
        // TODO: create a checkout session with the provider's API.
        // $amount->raw() = minor units (cents) as a numeric string.
        $result = new \stdClass;
        $result->id = 'PROVIDER_SESSION_ID';                  // stored as reservation.payment_id
        $result->redirectTo = 'https://provider.com/checkout/...'; // customer is sent here
        return $result;
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
        // and route success through transitionTo(CONFIRMED, tolerant: true).
        return response()->json([], 200);
    }

    // --- Refund ---

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

An inline gateway (Square, Braintree) is identical apart from three things: `redirectsForPayment()` returns `false`, `paymentIntent()` returns `->client_secret` instead of `->redirectTo`, and `paymentView()` returns a custom Blade view (see [The inline payment view](#the-inline-payment-view)).

## Checklist

Before deploying a custom gateway:

- [ ] Class implements `Reach\StatamicResrv\Http\Payment\PaymentInterface`.
- [ ] `name()` returns a unique lowercase slug.
- [ ] `label()` returns a human-readable string.
- [ ] `paymentView()` returns a valid Blade view path (or the default for redirect gateways).
- [ ] `supportsManualConfirmation()` returns `true` only for offline/non-provider-verified gateways.
- [ ] `paymentIntent()` returns an object with `->id` and either `->client_secret` (inline) or `->redirectTo` (redirect), and stashes `reservation_id` in the provider metadata.
- [ ] `redirectsForPayment()` returns the correct boolean for your gateway type.
- [ ] `handleRedirectBack()` checks `handlePaymentPending()` first, then returns the correct status array.
- [ ] `verifyPayment()` verifies the signature, routes success through `transitionTo(CONFIRMED, tolerant: true)`, gates `ReservationConfirmed` on the result, handles the stale-intent and orphan-payment races, and leaves failed attempts PENDING.
- [ ] `cancelPaymentIntent()` voids an intent at the provider (or is a no-op for offline-style gateways).
- [ ] `refund()` throws `RefundFailedException` on failure.
- [ ] Gateway is registered in `config/resrv-config.php` under `payment_gateways`.
- [ ] Webhook URL is configured in the provider's dashboard with the correct config-key segment.
- [ ] For inline gateways: the custom Blade view works and is publishable.
- [ ] For redirect gateways: the return URL points to the Statamic page with <code v-pre>{{ resrv_checkout_redirect }}</code>.

## Related

- [Payment gateways](./payment-gateways): the multi-gateway picker, surcharges, amount limits, and webhook routes.
- [Stripe](./stripe): the bundled inline gateway, including per-collection accounts.
- [Mollie](./mollie): maintained as a separate add-on.
