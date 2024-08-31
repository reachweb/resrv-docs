# Installation

Here you can find the installation and first-time setup instructions for Resrv.

## Prerequisites

Statamic Resrv is tested with **Laravel 10.x and 11.x**. It is recommended to use the latest version of **Statamic 5**.

A database is required. You can use SQLite for development and for production if you expect to have a low number of concurrent users. MySQL is recommended for production in most cases. Laravel 11 comes with SQLite support out of the box.

## Composer

Install the package using Composer:

```bash
composer require reachweb/statamic-resrv
```

## Migration

After you've set up your database, you need to run the migrations to create the tables:

```bash
php artisan migrate
```

## Install script

To complete the installation, run the install script:

```bash
php artisan resrv:install
```

This will publish the configuration file and ask you which assets you want to publish:

```bash
Publishing configuration file

 Do you want to publish the checkout form? (yes/no):
 > yes

Publishing checkout form
Publishing checkout form blueprint

 Do you want to publish the Livewire checkout views? (recommended) (yes/no):
 > yes

Publishing checkout views

 Do you want to publish the language files? (yes/no):
 > yes

Publishing language files

 Do you want to publish the email templates? (yes/no):
 > yes

Installation finished. Go get some reservations!
```

It is recommended to publish everything in order to have total control over what Resrv displays.

## Where to go from here?

We suggest you follow along the docs, starting with the [Core Concepts](./core-concepts) to better undestand how to use Resrv.
