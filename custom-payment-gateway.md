# Writing a custom payment gateway

Resrv ships with Stripe and an offline (bank transfer / pay-at-premises) gateway out of the box. If you need a different provider (PayPal, Square, Adyen, Braintree, or anything else), you write a class that implements `Reach\StatamicResrv\Http\Payment\PaymentInterface` and register it in the `payment_gateways` config array.

This page walks through the full interface, the two gateway types (inline and redirect), and the races you must handle for a production-grade integration. For multi-gateway concepts (the picker, surcharges, amount limits), see [Payment gateways](./payment-gateways).

::: tip
A custom gateway slots straight into the multi-gateway machinery. Surcharges and amount limits are purely config-time concerns handled by `PaymentGatewayManager`, so they work with your gateway without any code changes.
:::

::: warning Updating a gateway for v6.5
Resrv v6.5.0 changes `PaymentInterface` to support [manual reservations](./manual-reservations), which customers pay from the [payment page](./payment-page):

- `paymentIntent()` gained a 4th parameter, `?string $returnUrl = null`. See [The return URL](#the-return-url).
- `retrievePaymentIntent()` is a new required method. See [Retrieving a payment intent](#retrieving-a-payment-intent).
- `verifyPayment()` must also confirm reservations in the new `awaiting_payment` status. See [Verifying webhooks](#verifying-webhooks).

PHP enforces the first two when your class loads ("Declaration of …::paymentIntent() must be compatible with …"). Resrv checks every configured gateway class when it builds its gateway list, so a gateway that misses either one breaks checkout, webhooks and the Control Panel reservation pages, not just its own payments. Update your gateway before, or in the same deploy as, the Resrv upgrade.
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

Five methods are new in v6.0. If you are porting a v5 gateway, start with these:

| Method | Returns | Role |
|--------|---------|------|
| `name()` | `string` | Machine-readable slug: lowercase, no spaces (e.g. `paypal`). Fallback identifier. |
| `label()` | `string` | Default human label shown in the gateway picker. Overridable per-install via the config `label` key. |
| `paymentView()` | `string` | The Blade view rendering the inline payment UI. Redirect gateways return the default view as a never-rendered fallback. |
| `supportsManualConfirmation()` | `bool` | `true` only for offline/non-provider-verified gateways. Stripe and other provider-backed gateways return `false`. |
| `cancelPaymentIntent()` | `void` | Voids an abandoned provider-side intent. See [Cancelling abandoned intents](#cancelling-abandoned-intents). |

Later v6 releases changed the interface again. A v5 port needs these too, and so does any gateway written for an earlier v6 release:

| Change | Since | Role |
|--------|-------|------|
| `supportsAutomaticRefunds()` | v6.2 | `true` when `refund()` returns money through the provider's API. See [Refunds](#refunds). |
| `retrievePaymentIntent()` | v6.5 | Reads the current state of an intent you created earlier. See [Retrieving a payment intent](#retrieving-a-payment-intent). |
| `paymentIntent()` 4th parameter, `?string $returnUrl = null` | v6.5 | The base URL a redirect gateway sends the customer back to. See [The return URL](#the-return-url). |

::: warning Implement every method
Every method in the interface is required, and `paymentIntent()` must declare the 4th parameter even if your gateway ignores it. A gateway that misses one fatals as soon as Resrv loads it, even though some methods can be no-ops for some providers (`cancelPaymentIntent()` for offline-style gateways, or `retrievePaymentIntent()` returning `null` for gateways that never create a provider intent).
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

`paymentIntent()` creates the provider-side session and returns an object Resrv reads to drive the rest of checkout, or of the [payment page](./payment-page) when a customer pays for a manual reservation. `$amount` is a `Price` object holding the payment plus any surcharge: call `$amount->raw()` for the numeric string in minor units (cents). The 4th parameter, `$returnUrl`, tells redirect gateways where to send the customer back (see [The return URL](#the-return-url)). The return value differs by gateway type.

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

Always stash `reservation_id` in the intent metadata as shown above. The stale-intent fallback in `verifyPayment()` relies on it.

### The return URL

A redirect gateway tells the provider where to send the customer after paying. Build that URL from `$returnUrl`:

- In checkout, Resrv passes the absolute URL of your checkout-complete entry (the page with the <code v-pre>{{ resrv_checkout_redirect }}</code> tag).
- On the [payment page](./payment-page), Resrv passes the customer's payment link, so they come back to the page they paid from. That URL already carries `?ref=…&hash=…`, which is how the page identifies the customer.
- When `$returnUrl` is `null` (a caller that doesn't set one), fall back to the checkout-complete entry, as before.

Then append your own return parameters, choosing the separator based on whether the base already has a query string:

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

Appending a bare `?` to the payment link produces a malformed URL with two `?`, and the customer's way back breaks. In normal checkout the result is the same URL as before, because Resrv passes the checkout-complete entry as `$returnUrl`.

::: info
In checkout, Resrv also appends `resrv_gateway=<config_key>` to your `redirectTo` URL before redirecting. On the payment page it sends the customer to `redirectTo` unchanged and adds `resrv_gateway` to `$returnUrl` instead, so you may find it on the base already. Keep appending your own parameters anyway: a duplicate `resrv_gateway` is harmless. The <code v-pre>{{ resrv_checkout_redirect }}</code> tag reads it to resolve your gateway, and the payment page checks for it to know the customer is coming back from your provider.
:::

## The inline payment view

Inline gateways render a Blade view (returned from `paymentView()`) inside the `CheckoutPayment` Livewire component at checkout, and inside the `reservation-payment` component on the [payment page](./payment-page). Both components expose these to your view:

| Property | Type | Description |
|----------|------|-------------|
| `$wire.clientSecret` | string | From `paymentIntent()->client_secret` |
| `$wire.publicKey` | string | From `getPublicKey()` |
| `$wire.checkoutCompletedUrl` | string | Where to send the customer after paying: the checkout-completed Statamic entry at checkout, the customer's payment link on the payment page |
| `$amount` | float | Formatted payment amount, available as a Blade variable |

Because the same view renders on the payment page, the layout of your payment page entry must load your provider's JavaScript too, just like your checkout layout.

On the payment page, Resrv shows **Payment processing** to a returning customer only when the return URL carries `redirect_status=succeeded` or `redirect_status=processing` (or Stripe's `payment_intent` / `payment_intent_client_secret` parameters), while `redirect_status=failed` shows the **Pay** button again so the customer can retry. Without any of them, a customer who has just paid lands back on **Complete your payment** with the **Pay** button until the webhook confirms the booking. So append `redirect_status` when you send the customer to `checkout_completed_url`, and use `&` as the separator when the URL already has a query string: on the payment page it always does (`?ref=…&hash=…`).

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

The [payment page](./payment-page) calls `handleRedirectBack()` too, when a customer comes back from your provider with `resrv_gateway` in the URL. It resolves your gateway from the reservation and uses the `status` only for an interim message: `true` or `'pending'` shows "Payment processing", and `false` lets the customer try again. It never confirms the booking (your webhook does), so your `handleRedirectBack()` needs no changes for it.

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
3. **Confirm on success**, but route it through `transitionTo(CONFIRMED, tolerant: true)` and gate `ReservationConfirmed` on the result. Don't check for `pending` first: the transition confirms both `pending` checkouts and `awaiting_payment` [manual reservations](./manual-reservations), and returns `false` for anything else. Leave a failed *attempt* as it is (a declined card is retryable; don't cancel it or release the hold).
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

Dispatch `ReservationConfirmed` with `ReservationConfirmed::VIA_WEBHOOK` and the gateway and payment id, as above, so the [activity log](./activity-log) records the booking as "Confirmed by payment webhook".

A failed or cancelled intent must never end an **Awaiting payment** reservation: the customer can try again from the same link, and an admin can cancel the booking. `expire()` already ignores anything that isn't `pending`, so don't call any other transition from those events.

::: warning Log and ignore stale successes
The policy above guarantees Resrv never confirms a reservation against an amount or gateway the customer has since walked away from, at the cost of you manually reconciling the orphan charge at the provider. Resrv ships this trade-off for Stripe; adopt the same for any provider that confirms asynchronously.
:::

### The orphan-payment race

A second, subtler race remains even for a *live* intent. `ExpireReservations` runs on every availability search and can flip a still-`PENDING` reservation to `EXPIRED` in the window between your webhook's in-memory checks and the moment it writes the confirmation. From v6.5.0, the lapsed-hold sweep (`resrv:cancel-lapsed-holds`) can likewise cancel an `awaiting_payment` manual reservation while its payment is still going through.

Resrv's state changes go through `Reservation::transitionTo()`, which re-reads the row under a `lockForUpdate`. Called with `tolerant: true`, it returns `false` (instead of throwing) when the row moved to an incompatible state. **Gate `ReservationConfirmed` on its return, and re-read on `false`** to surface a terminal state as an orphaned charge:

```php
$reservation->refresh();

// Logs and notifies admins when the row is EXPIRED, REFUNDED, CANCELLED or PARTNER
// (a cancelled booking's own retained charge excepted). Dedupes on (reservation, intent)
// so provider retries don't spam admins.
\Reach\StatamicResrv\Mail\OrphanedPaymentNotification::notifyIfOrphaned($reservation, $data['id']);

return response()->json([], 200);
```

If your gateway checks the terminal statuses by hand and calls `dispatchFor()`, switch to `notifyIfOrphaned()`: a hand-written list of `EXPIRED`, `REFUNDED` and `PARTNER` misses a late payment on a cancelled hold.

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

For [manual reservations](./manual-reservations), Resrv also calls it when an admin cancels an awaiting-payment reservation, when the lapsed-hold sweep cancels one, when an admin marks one as paid while an online payment the customer started is still open, and when the payment page has to replace an intent it can't resume. In each of these cases Resrv then reads the intent back with [`retrievePaymentIntent()`](#retrieving-a-payment-intent) to check the void worked.

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
- **Swallow provider errors** (log them, don't re-throw). In checkout, by the time Resrv calls you, it has already cleared `reservation.payment_id` in the database: a failed cancellation only leaves an orphan at the provider, not inconsistent Resrv state. In the manual-reservation flows Resrv keeps the reference until `retrievePaymentIntent()` confirms the intent is dead, so a failed cancellation is caught there. Exceptions you throw are logged and swallowed anyway.
- **Don't try to rescue a succeeded intent here.** If a race confirms an intent you're cancelling, the recovery path lives in the stale-intent fallback in `verifyPayment()`.
- This path runs whenever `payment_id` is non-empty; it is **not** gated on surcharge. Even single-gateway setups left abandoned intents behind before; implementing this fixes that regardless of surcharge configuration.

For providers that never create a remote resource needing cleanup (offline / bank-transfer / test gateways), make it a no-op. `OfflinePaymentGateway` and `FakePaymentGateway` both do:

```php
public function cancelPaymentIntent(string $paymentId, Reservation $reservation): void
{
    //
}
```

## Retrieving a payment intent <Badge type="tip" text="NEW" />

From v6.5.0, `retrievePaymentIntent()` is required. It reads the current state of an intent your gateway created earlier. Checkout never calls it: every caller belongs to [manual reservations](./manual-reservations).

1. **Resuming a payment.** When a customer comes back to the [payment page](./payment-page) after an interrupted payment, Resrv reads the stored intent instead of creating a second one.
2. **Verifying a void.** When an admin cancels an awaiting-payment reservation, or the lapsed-hold sweep cancels one, Resrv calls `cancelPaymentIntent()` and then reads the intent back. It drops the reference only when the intent reads `canceled` or `null`.
3. **Reconciling Mark as paid.** When an admin marks a reservation as paid, Resrv reads any intent the customer started, to decide whether to void it or keep it because it already took money.
4. **Refunding only real charges.** A reservation marked as paid that kept an intent reference is refunded through `refund()` only when the intent reads `succeeded` or `processing`.

```php
public function retrievePaymentIntent(string $paymentId, Reservation $reservation): ?object
```

Every caller branches on what you return, so get the contract right:

- **Return an object with a `->status` property** in Stripe's vocabulary. If your provider uses other names, map them:
  - `succeeded`, `processing`, `requires_capture`: money is captured, settling or held. Resrv won't create another intent and keeps the reference. (When an admin marks the reservation as paid, an uncaptured `requires_capture` hold is voided instead.)
  - `canceled`: the intent is dead, so Resrv may replace it or forget it.
  - Anything else (e.g. `requires_payment_method`, `requires_action`): still payable, so Resrv resumes it.
- **Include `->redirectTo` (redirect gateways) or `->client_secret` (inline gateways)** while the intent is still payable. Resrv uses it to send the customer back to the same payment. Without it, Resrv voids the intent and creates a replacement through `paymentIntent()`, which works but burns an intent on every resume.
- **Return `null` only when the intent definitively doesn't exist**, for example an HTTP 404 or Stripe's `resource_missing`. Resrv treats `null` as "gone".
- **Throw on any transient failure**: timeouts, rate limits (429), 5xx responses, authentication or connection errors. Never wrap the call in a catch-all that returns `null`. Resrv would then create a second chargeable intent next to a live one, drop the reference to a charge that later captures, or skip the refund of a real charge.
- **Report `canceled` for an intent your `cancelPaymentIntent()` just voided.** Before it creates a replacement, Resrv voids the old intent and checks it reads `canceled` (or `null`). If it still looks payable, the payment attempt stops with a retryable error rather than leaving two chargeable intents.

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

Gateways that never create a provider intent (offline, bank transfer) have nothing to retrieve, so they return `null`. That's safe because they also return `true` from `supportsManualConfirmation()`, and Resrv never relies on a retrieved status for them:

```php
public function retrievePaymentIntent(string $paymentId, Reservation $reservation): ?object
{
    // Offline payments have no remote intent to resume.
    return null;
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

`refund()` also runs when a customer cancels their own reservation from the [reservation status page](./reservation-status#cancelling-a-reservation), but only if your gateway says it returns money automatically:

```php
public function supportsAutomaticRefunds(): bool
{
    return true; // false only when refund() moves no money (bank transfer, pay at premises)
}
```

Return `false` only when your `refund()` is a bookkeeping no-op. Customers then can't cancel bookings paid through your gateway themselves, and an admin still refunds them from the Control Panel after returning the money.

Resrv skips `refund()` for a reservation an admin [marked as paid](./manual-reservations#mark-as-paid): the money was collected outside Resrv, so the admin returns it by hand. If such a reservation kept an online intent reference for reconciliation, Resrv reads it with [`retrievePaymentIntent()`](#retrieving-a-payment-intent) first and calls `refund()` only when it reads `succeeded` or `processing`.

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

An inline gateway (Square, Braintree) is identical apart from a few things: `redirectsForPayment()` returns `false`, `paymentIntent()` and `retrievePaymentIntent()` return `->client_secret` instead of `->redirectTo`, `paymentIntent()` can ignore `$returnUrl` (so it needs no `buildReturnUrl()`), and `paymentView()` returns a custom Blade view (see [The inline payment view](#the-inline-payment-view)).

## Checklist

Before deploying a custom gateway:

- [ ] Class implements `Reach\StatamicResrv\Http\Payment\PaymentInterface`.
- [ ] `name()` returns a unique lowercase slug.
- [ ] `label()` returns a human-readable string.
- [ ] `paymentView()` returns a valid Blade view path (or the default for redirect gateways).
- [ ] `supportsManualConfirmation()` returns `true` only for offline/non-provider-verified gateways.
- [ ] `paymentIntent()` returns an object with `->id` and either `->client_secret` (inline) or `->redirectTo` (redirect), and stashes `reservation_id` in the provider metadata.
- [ ] `paymentIntent()` declares the 4th parameter, `?string $returnUrl = null`. Redirect gateways build their return URL from `$returnUrl`, fall back to the checkout-complete entry when it's `null`, and append their parameters with the right separator (`&` when the base already has a query string).
- [ ] `retrievePaymentIntent()` returns an object with `->status` in Stripe's vocabulary (plus `->redirectTo` or `->client_secret` while the intent is payable), returns `null` only when the intent definitively doesn't exist, throws on transient failures, and reports `canceled` after `cancelPaymentIntent()` voided it. Offline-style gateways return `null`.
- [ ] `redirectsForPayment()` returns the correct boolean for your gateway type.
- [ ] `handleRedirectBack()` checks `handlePaymentPending()` first, then returns the correct status array.
- [ ] `verifyPayment()` verifies the signature, routes success through `transitionTo(CONFIRMED, tolerant: true)`, gates `ReservationConfirmed` on the result, handles the stale-intent and orphan-payment races (with `notifyIfOrphaned()`), and leaves failed attempts as they are.
- [ ] `verifyPayment()` confirms `awaiting_payment` reservations too: no `pending`-only check before `transitionTo()`, `ReservationConfirmed` dispatched with `ReservationConfirmed::VIA_WEBHOOK`, and no failed or cancelled intent ends an awaiting-payment reservation.
- [ ] `supportsWebhooks()` returns `true` if your gateway confirms through webhooks. Online gateways that return `false` can't be used for manual reservations.
- [ ] `cancelPaymentIntent()` voids an intent at the provider (or is a no-op for offline-style gateways).
- [ ] `supportsAutomaticRefunds()` returns `true` only when `refund()` moves money through the provider.
- [ ] `refund()` throws `RefundFailedException` on failure.
- [ ] Gateway is registered in `config/resrv-config.php` under `payment_gateways`.
- [ ] Webhook URL is configured in the provider's dashboard with the correct config-key segment.
- [ ] For inline gateways: the custom Blade view works and is publishable.
- [ ] For redirect gateways: the return URL falls back to the Statamic page with <code v-pre>{{ resrv_checkout_redirect }}</code> when `$returnUrl` is `null`.

## Related

- [Payment gateways](./payment-gateways): the multi-gateway picker, surcharges, amount limits, and webhook routes.
- [Stripe](./stripe): the bundled inline gateway, including per-collection accounts.
- [Mollie](./mollie): maintained as a separate add-on.
- [Manual reservations](./manual-reservations): bookings created in the Control Panel and paid through your gateway.
- [Payment page](./payment-page): where customers pay for manual reservations.
