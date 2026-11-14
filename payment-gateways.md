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

Because the booking is confirmed before any money arrives, Resrv can't know whether the customer has paid. From v6.5.0, the Control Panel shows the amount of these bookings as **Payment** rather than as paid. Refunding one only records the refund: if the customer did pay, you return the money yourself.

The offline gateway also works for [manual reservations](./manual-reservations). There it shows your **Offline Payment Instructions** (**Resrv → Settings → Checkout → Manual reservations**) on the [payment page](./payment-page) and in the payment request email, and you confirm the booking with **Mark as paid** once the money arrives. See [Gateways for manual reservations](#gateways-for-manual-reservations).

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

## Gateways for manual reservations <Badge type="tip" text="NEW" />

From v6.5.0, you can [create reservations from the Control Panel](./manual-reservations) and ask the customer to pay for them. The same configured gateways collect those payments, with a few differences from checkout:

- **One gateway per reservation.** You pick the **Payment method** when you create the reservation, and it can't be changed afterwards. The customer gets no picker: they pay with that method.
- **Every gateway is listed.** The **Create reservation** page shows all configured gateways, each with a short note on how the customer pays. Gateways that can't take the payment are disabled with the reason, instead of being hidden.
- **Online gateways need a payment page.** The customer pays from the link in the payment request email, which opens your [payment page](./payment-page#setting-up-the-page). Until you select a published entry under **Resrv → Settings → Checkout → Manual reservations → Payment Page Entry**, online gateways are disabled for manual reservations.
- **Online gateways need webhooks.** The gateway's webhook is the only thing that confirms the payment, exactly as in checkout, so set up its [webhook route](#webhook-routes). A gateway whose `supportsWebhooks()` returns `false` can't be used to collect a payment.
- **Manual-confirmation gateways always work.** The [Offline gateway](#the-offline-gateway) (or any gateway whose `supportsManualConfirmation()` returns `true`) needs no payment page, but it must be registered in `payment_gateways`: the default config only has Stripe. The customer pays you directly, following your **Offline Payment Instructions**, and you confirm the booking with [**Mark as paid**](./manual-reservations#mark-as-paid).
- **Bookings that collect nothing need no gateway.** When the amount to request is zero, the **Payment method** field is hidden and the reservation is confirmed straight away.
- **[Amount limits](#amount-limits) apply** to the amount you request, before any surcharge. A gateway outside its limits is disabled for that booking.
- **[Surcharges](#surcharges) apply.** The surcharge is calculated on the amount you request and stored on the reservation when you create it. The payment page and the payment request email show the **Amount to pay** with the surcharge included, and that is what the gateway charges. **Mark as paid** records the same amount as received.

<Image src="./img/resrv-manual-create-payment.webp" alt="Each payment method on the Create reservation page explains how the customer pays. The choice can't be changed later." />

::: warning NO MANUAL-ONLY GATEWAYS
Every gateway in `payment_gateways` is offered both at checkout (within its amount limits) and on the **Create reservation** page. There is no manual-only option. Adding the Offline gateway for manual bookings also lets website customers choose it at checkout, where it [confirms the booking immediately](#the-offline-gateway) without payment.
:::

Refunds follow how the money was paid. A manual reservation paid online from the payment page refunds through its gateway, like any checkout booking. A reservation you marked as paid was paid outside Resrv, so refunding it doesn't return that money through a gateway: the Control Panel records the refund and shows "Refund recorded — return the payment to the customer manually", and returning the money is up to you. If the reservation kept an online payment reference because the customer's online payment also went through, Resrv refunds that charge through its gateway. See [Refunds and reconciliation](./manual-reservations#refunds-and-reconciliation).

## Webhook routes

Each gateway has its own webhook URL so providers can notify Resrv independently:

| Route | Resolves to |
| --- | --- |
| `/resrv/api/webhook/{gateway}` | The gateway whose config key is `{gateway}` |
| `/resrv/api/webhook` | The default gateway (single-gateway sites only) |

Both `GET` and `POST` are available on each route, and all are exempt from CSRF protection.

The same routes confirm payments made from the [payment page](./payment-page) of a manual reservation. There is nothing extra to register.

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

Customers paying for a [manual reservation](./manual-reservations) from the [payment page](./payment-page) come back to the payment page instead, because Resrv gives the gateway the payment link as the return URL (see [The return URL](./custom-payment-gateway#the-return-url)). While the payment completes, the page shows a "Payment processing" message, and the gateway's webhook then confirms the booking. Inline gateways render their payment form on the payment page itself.

## Cancelling abandoned payments

When a customer backs out of payment, switches to a different gateway at the picker, or reopens an expired checkout, Resrv cancels the abandoned payment intent at the provider so no stale authorisation lingers. It clears the recorded payment id and gateway first, then asks the gateway to cancel the old intent; any error from the provider during cancellation is logged and ignored so it can never block checkout.

Manual reservations do it the other way round, because the customer may still be paying from the link. When you cancel an awaiting-payment reservation, when the lapsed-hold sweep cancels one, or when you mark one as paid after the customer started an online payment, Resrv cancels the intent at the gateway and checks the result with the provider, and it forgets the payment reference only once the provider confirms the intent is dead. If the intent has already taken money, the reference stays and your admins get a reconciliation alert email with a recommended action. If Resrv can't confirm the intent is dead, the reference stays too: after **Mark as paid** your admins are alerted straight away; after a cancellation Resrv flags the reservation in the Control Panel and logs a warning, and your admins are emailed only if a payment later lands on the cancelled reservation (the orphaned-payment alert), or straight away if the reservation's gateway is no longer configured.

The offline gateway has nothing to cancel, so its cancellation is a no-op. If you build your own gateway, this behaviour is part of the `PaymentInterface` you implement, see the [Custom payment gateway](./custom-payment-gateway) guide.

## Related

- [Stripe](./stripe): set up the default card gateway.
- [Mollie](./mollie): a maintained redirect gateway add-on.
- [Custom payment gateway](./custom-payment-gateway): build your own gateway against `PaymentInterface`.
- [Checkout](./checkout): where gateways appear in the booking flow.
- [Manual reservations](./manual-reservations): create bookings in the Control Panel and request a payment.
- [Payment page](./payment-page): where customers pay for manual reservations.
- [Configuration](./configuration): the rest of the developer config keys.
- [Languages](./languages): translate payment-related labels and messages.
