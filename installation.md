# Installation

Here you can find the installation and first-time setup instructions for Resrv.

## Prerequisites

Statamic Resrv v6 requires **PHP 8.4+**, **Laravel 12 or 13**, **Statamic 6**, and **Livewire 3.6.4+ or 4**.

A database is required. You can use SQLite for development and for production if you expect to have a low number of concurrent users. MySQL or PostgreSQL are recommended for production in most cases.

## Composer

Install the package using Composer:

```bash
composer require reachweb/statamic-resrv
```

## Migration

After you've set up [your database](https://laravel.com/docs/13.x/database#configuration), you need to run the migrations to create the tables:

```bash
php artisan migrate
```

## Install script

To complete the installation, run the install script:

```bash
php artisan resrv:install
```

The script asks five questions, each publishing a different set of assets:

```bash
 Publish the developer configuration file (payment gateways & Stripe keys)? Most sites don't need this. (yes/no) [no]:
 > no

 Do you want to publish the checkout form? (needed for Resrv to work correctly) (yes/no) [yes]:
 > yes

Publishing checkout form
Publishing checkout form blueprint

 Do you want to publish the Livewire views? (recommended) (yes/no) [yes]:
 > yes

Publishing Livewire views

 Do you want to publish the language files? (needed only if you wish to edit them) (yes/no) [no]:
 > no

 Do you want to publish the email templates? (needed only if you wish to edit them) (yes/no) [no]:
 > no

Installation finished. Go get some reservations!
```

Here's what each prompt does, and the recommended answer:

| Prompt | Default | Recommended | What it publishes |
| --- | --- | --- | --- |
| Developer configuration file | `no` | `no` | `config/resrv-config.php` |
| Checkout form | `yes` | `yes` | The checkout form and blueprints |
| Livewire views | `yes` | `yes` | The frontend Livewire views, so you can customize them |
| Language files | `no` | Only if editing | Translation files under `lang/vendor/statamic-resrv` |
| Email templates | `no` | Only if editing | Email views under `resources/views/vendor/statamic-resrv/email` |

### The developer configuration file

::: info MOST SITES SKIP THIS
In v6, all user-facing settings (business information, reservation rules, currency, checkout, emails) are managed in the Control Panel under **Resrv → Settings** and stored on your site at `resources/addons/statamic-resrv.yaml`.
:::

The published `config/resrv-config.php` holds only **developer keys**: `payment_gateway`, `payment_gateways`, the `stripe_*` env lookups. It's required if you need to register multiple [payment gateways](./payment-gateways) or hand-edit [Stripe](./stripe) keys. You can publish it later at any time with:

```bash
php artisan vendor:publish --tag=resrv-config
```

See [Configuration](./configuration) for the full settings model.

It is recommended to publish the checkout form and the Livewire views, especially since the views are needed for Tailwind to create the styles required.

## Where to go from here?

We suggest you follow along the docs, starting with the [Core Concepts](./core-concepts) to better understand how to use Resrv.
