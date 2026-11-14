# Mollie

You can use Mollie to receive payments from your customers. Mollie is a **redirect gateway**: the customer is sent to Mollie's hosted checkout to pay, then returned to your site.

Mollie ships as a separate, maintained add-on (`reachweb/resrv-payment-mollie`) that is updated for Resrv v6 and implements the v6 `PaymentInterface`. This page covers the setup required for it to work.

::: warning Upgrading to Resrv v6.5
Resrv v6.5.0 changes the `PaymentInterface` (a 4th `paymentIntent()` parameter and the new required `retrievePaymentIntent()` method, see [Writing a custom payment gateway](./custom-payment-gateway)). Update the Mollie add-on to a release that implements both **in the same deploy** as Resrv v6.5. Otherwise, while Mollie is configured, every request that loads Resrv's payment gateways fails with a fatal error, including checkout, webhooks and the Control Panel reservation pages. Before upgrading, check that the `MolliePaymentGateway` class in the add-on version you will install declares `retrievePaymentIntent()`. If no such release is available yet, hold the Resrv upgrade.
:::

If you offer Mollie for [manual reservations](./manual-reservations), customers pay from the [payment page](./payment-page), and only Mollie's webhook can confirm the booking, so make sure the webhook route below is configured.

::: warning
Even though this payment gateway is tested, it's suggested that you test it in test mode before going live.
:::

## Install the Mollie payment gateway add-on

First, install the add-on that provides the Mollie payment gateway:

```bash
composer require reachweb/resrv-payment-mollie
```

## Setting up the API key

From your Mollie account you need your `Live API key`.

For security reasons, your key is not stored in the add-on's configuration but in your `.env` file. Add it there:

```dotenv
MOLLIE_KEY=...
```

If you have cached your config, remember to clear the config cache after changing the `.env` file:

```bash
php artisan config:clear
```

## Register the gateway

You enable Mollie in the `config/resrv-config.php` file. You have two options.

### Recommended: register it under `payment_gateways`

In v6 you can run multiple gateways side by side through the `payment_gateways` array. Add Mollie as an entry with its class and a label. Because Mollie is a redirect gateway, this is the recommended approach:

```php
'payment_gateways' => [
    'mollie' => [
        'class' => Reach\ResrvPaymentMollie\Http\Payment\MolliePaymentGateway::class,
        'label' => 'Mollie',
    ],
],
```

When more than one gateway is configured, the customer picks a payment method at checkout. You can also attach a per-gateway surcharge or amount limits to this entry. See [Payment gateways](./payment-gateways) for the full array shape.

::: tip Webhook route
When Mollie runs under `payment_gateways`, its webhook route is `/resrv/api/webhook/mollie` (the route key matches the array key). Configure this URL in your Mollie dashboard.
:::

### Alternative: set it as the single gateway

If Mollie is the only gateway you need, set the singular `payment_gateway` key to its class instead. Find the `payment_gateway` setting near the end of `config/resrv-config.php` and swap the Stripe class for Mollie:

```php
'payment_gateway' => Reach\ResrvPaymentMollie\Http\Payment\MolliePaymentGateway::class,
```

With Mollie as your single gateway, its webhook route is the bare `/resrv/api/webhook` URL (no gateway suffix). The per-gateway `/resrv/api/webhook/mollie` URL only applies when Mollie runs under the `payment_gateways` array.

## Next steps

That's it! You should now be able to receive payments using Mollie.

If you want to run Mollie alongside other gateways, add surcharges, or restrict it to certain order values, see [Payment gateways](./payment-gateways). To build your own redirect or inline gateway, see [Writing a custom payment gateway](./custom-payment-gateway).
