# Payment Gateways <Badge type="tip" text="NEW" />

Statamic Resrv processes payments through one or more **payment gateways**. Out of the box it ships with two: [Stripe](./stripe) for card payments and a bundled **Offline** gateway for bank transfer or pay-at-premises bookings. In v6 you can also configure **multiple gateways at once** and let the customer choose at checkout, apply a per-gateway surcharge, and restrict gateways to a specific order-value range.

This page covers how gateways are configured and how they behave. For the gateways themselves see [Stripe](./stripe), [Mollie](./mollie), and the [Custom payment gateway](./custom-payment-gateway) guide. For where gateways appear in the booking flow, see [Checkout](./checkout).

## Configuring gateways

Gateways are a **developer setting**, configured in `config/resrv-config.php`, not in the Control Panel. The `payment_gateways` key is an array keyed by a machine name, with one entry per gateway:

```php
// config/resrv-config.php
'payment_gateways' => [
    'stripe' => [
        'class'         => \Reach\StatamicResrv\Http\Payment\StripePaymentGateway::class,
        'label'         => 'Credit Card',
        'surcharge'     => ['type' => 'percent', 'amount' => 4],
        'amount_limits' => ['min' => 10, 'max' => 1000],
    ],
    'offline' => [
        'class' => \Reach\StatamicResrv\Http\Payment\OfflinePaymentGateway::class,
        'label' => 'Bank Transfer / Pay at Premises',
    ],
],
```

Each entry accepts the following keys:

| Key | Required | Type | Description |
| --- | --- | --- | --- |
| `class` | Yes | FQCN | The gateway class. Must implement `PaymentInterface` or the app throws at boot. |
| `label` | No | String | The label shown in the checkout picker. Falls back to the gateway's own `label()` when omitted. |
| `surcharge` | No | Array | A per-gateway surcharge added on top of the payment. See [Surcharges](#surcharges). |
| `amount_limits` | No | Array | Restricts the gateway to an order-value range. See [Amount limits](#amount-limits). |

::: tip
The array **key** (e.g. `stripe`, `offline`) is the gateway's config name. It is used in the per-gateway webhook URL and the `resrv_gateway` redirect parameter, so keep it lowercase with no spaces.
:::

### The default gateway

When `payment_gateways` is a non-empty array, **the first entry is the default gateway**. It is used as the fallback for any reservation that has no gateway recorded yet (for example, older reservations created before you added the config).

### Legacy single-gateway fallback

If you leave `payment_gateways` empty, Resrv falls back to the legacy singular `payment_gateway` key, which defaults to the Stripe gateway:

```php
// config/resrv-config.php
'payment_gateway' => \Reach\StatamicResrv\Http\Payment\StripePaymentGateway::class,
```

Existing single-gateway sites need **no changes**. Stripe keeps working exactly as before, the checkout never shows a picker, and the bare webhook URL keeps resolving. Only define `payment_gateways` when you want more than one gateway or want to apply surcharges and amount limits.

## The Offline gateway

The bundled `OfflinePaymentGateway` (`offline`) is for bookings that are paid outside the site: bank transfer, pay-at-premises, or pay-later. It talks to no external provider.

Instead of an inline payment form, the offline payment step shows a description, the amount due, and a **Confirm reservation** button. Pressing it confirms the reservation immediately on the server and fires the `ReservationConfirmed` event, so the **confirmation email is sent right away**, with no webhook involved. The customer then lands on the checkout-complete page with a `pending` status, signalling the booking is held and awaiting payment.

Add it to your `payment_gateways` array like any other gateway:

```php
'offline' => [
    'class' => \Reach\StatamicResrv\Http\Payment\OfflinePaymentGateway::class,
    'label' => 'Bank Transfer',
],
```

::: tip
The offline description, amount label, and button text are translation keys (`offlinePaymentDescription`, `offlinePaymentAmount`, `confirmReservation`, and others). You can override all of them, see [Languages](./languages).
:::

## Surcharges

A surcharge adds an extra amount on top of the payment when a customer picks a particular gateway, useful for passing on card-processing fees. Configure it per gateway with a `type` and an `amount`:

```php
// 4% on top of the amount payable now
'surcharge' => ['type' => 'percent', 'amount' => 4],

// A flat 2.50 in your currency's major units
'surcharge' => ['type' => 'fixed', 'amount' => 2.50],
```

| Type | `amount` means | Example |
| --- | --- | --- |
| `percent` | A percentage of the payment | `4` adds 4% |
| `fixed` | A flat amount in major currency units | `2.50` adds 2.50 |

Any other `type` throws an error when that gateway's surcharge is calculated at checkout.

How it behaves:

- The surcharge is calculated from the reservation's **payment** (the amount payable now), **before** the surcharge is added.
- The gateway is charged the **full total** (`payment + surcharge`). The reservation's `payment` value stays the booking amount: the surcharge is stored separately in the `payment_surcharge` column and surfaced in the totals.
- The checkout picker shows the surcharge next to the gateway label, e.g. `(+4% surcharge)` or `(+ €2.50 surcharge)`, so the customer sees the cost before choosing.

## Amount limits

Amount limits restrict a gateway to a specific order-value range. Set an inclusive `min`, `max`, or both:

```php
'amount_limits' => ['min' => 10, 'max' => 1000],
'amount_limits' => ['min' => 50],   // no upper bound
'amount_limits' => ['max' => 500],  // no lower bound
```

How it behaves:

- `min` and `max` are **inclusive**: the gateway is offered when `payment >= min` and `payment <= max`.
- The limit is compared against the reservation's **payment** (the amount payable now), **before** any surcharge is applied.
- A gateway whose limits the payment falls outside of is **hidden from the picker** entirely.

Edge cases worth knowing:

- **No gateway available**: if *every* gateway is filtered out for the current amount, checkout shows the `noGatewayAvailableForAmount` error and cannot advance. Make sure your ranges always cover every possible total.
- **Single survivor**: if exactly one gateway passes the filter, it is auto-selected and no picker is shown.
- **Free reservations**: when `payment` is `0`, the payment step is skipped entirely and amount limits are never evaluated. See [Skipping payment](./checkout).
- A coupon applied after a gateway is selected does not retroactively invalidate an in-flight payment: limits gate the *selection*, not processing.

::: warning BOOT-TIME VALIDATION
`amount_limits` must be an array, every value must be a parseable amount, only `min` and `max` keys are allowed, and `min` may not be greater than `max`. Breaking any of these throws an error when the app boots, so you'll catch configuration mistakes immediately.
:::

## The checkout gateway picker

When more than one gateway survives amount filtering, the customer reaches a **gateway picker** at the payment step. It lists each available gateway by label, with any surcharge shown alongside, under a "Select payment method" heading.

- Picking a gateway initialises that gateway's payment: an inline form (Stripe), the offline confirmation screen, or a redirect to the provider.
- If only one gateway is available it is **auto-selected** and the picker is skipped.
- If the booking total is zero, the payment step is skipped altogether.

See [Checkout](./checkout) for the full step-by-step flow and how to customise the checkout views.

## Webhook routes

Each gateway has its own webhook URL so providers can notify Resrv independently:

| Route | Resolves to |
| --- | --- |
| `/resrv/api/webhook/{gateway}` | The gateway whose config key is `{gateway}` |
| `/resrv/api/webhook` | The default gateway (single-gateway sites only) |

Both `GET` and `POST` are available on each route, and all are exempt from CSRF protection.

::: warning MULTIPLE GATEWAYS REQUIRE THE PER-GATEWAY URL
As soon as you configure `payment_gateways` with more than one gateway, the **bare** `/resrv/api/webhook` URL returns a **404**: Resrv refuses to guess which gateway a notification belongs to. You must point each provider at its specific `/resrv/api/webhook/{gateway}` URL (for example `/resrv/api/webhook/stripe`).

Single-gateway sites can keep using the bare URL.
:::

See the [Stripe](./stripe) page for setting up the Stripe webhook and its signing secret.

## Redirect vs inline gateways

A gateway is either **inline** or **redirect**:

- **Inline** gateways (like Stripe and the offline gateway) render their payment UI directly on the checkout page. The customer never leaves your site.
- **Redirect** gateways send the customer to the provider's hosted payment page. On the way out, Resrv appends a `resrv_gateway=<config-key>` query parameter to the redirect URL.

When the customer returns, your checkout-complete page (the one rendering the <code v-pre>{{ resrv_checkout_redirect }}</code> tag) resolves which gateway handled the payment, preferring the reservation's stored gateway, then the `resrv_gateway` query parameter, then the default. It then reports a `success`, `failed`, or `pending` status. See [Checkout](./checkout) for the redirect page details.

## Cancelling abandoned payments

When a customer backs out of payment, switches to a different gateway at the picker, or reopens an expired checkout, Resrv cancels the abandoned payment intent at the provider so no stale authorisation lingers. It clears the recorded payment id and gateway first, then asks the gateway to cancel the old intent; any error from the provider during cancellation is logged and ignored so it can never block checkout.

The offline gateway has nothing to cancel, so its cancellation is a no-op. If you build your own gateway, this behaviour is part of the `PaymentInterface` you implement, see the [Custom payment gateway](./custom-payment-gateway) guide.

## Related

- [Stripe](./stripe): set up the default card gateway.
- [Mollie](./mollie): a maintained redirect gateway add-on.
- [Custom payment gateway](./custom-payment-gateway): build your own gateway against `PaymentInterface`.
- [Checkout](./checkout): where gateways appear in the booking flow.
- [Configuration](./configuration): the rest of the developer config keys.
- [Languages](./languages): translate payment-related labels and messages.
