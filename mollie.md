# Mollie

You can use Mollie to receive payments from your customers. In this page, we'll go over the setup required for Mollie to work correctly.

::: warning
Even though this payment gateway is tested, it's suggested that you test the payment gateway in test mode before going live.
:::

## Install the Mollie payment gateway addon

First, you need to install the addon that provides the Mollie payment gateway:

```bash
composer require reachweb/resrv-payment-mollie
```

## Setting up the API key

From your Mollie account you need your `Live API key`.

For security reasons, your key is not stored in the addon's configuration but is instead stored in your `.env` file. You need to add it to your `.env` file:

```dotenv
MOLLIE_KEY=...
```

In case you have cached your config, remember to clear the config cache when making changes to the .env file:

```bash
php artisan config:clear
```

## Switch the payment gateway

Finally, you need to switch the payment gateway to Mollie in the Resrv configuration file. Open the `config/resrv-config.php` file.

Around the end of the file you'll find the `payment_gateway` setting. Swap it from the Stripe one to Mollie:

```php
'payment_gateway' => Reach\ResrvPaymentMollie\Http\Payment\MolliePaymentGateway::class,
```

## Next steps

That's it! You should now be able to receive payments using Mollie.