# Core Concepts

Here you can find a basic outline of how Statamic Resrv works and how to better integrate it into your Statamic project.

## What is Statamic Resrv?

Resrv is a content-agnostic reservation engine built using Laravel and "living" inside a Statamic CMS installation. 
It integrates with the power of Statamic to provide a powerful and flexible reservation system for any possible use.

## Who can use this?

Practically every business that needs reservations, like a hotel, a restaurant, a conference, car rental, boat rental, 
and more. Resrv is designed to be flexible and cater to many different business scenarios.

Besides the core functionality, it also has many extra functionalities that can be used to build your reservation 
system. That way, every business can have an in-house reservation system on their website and take reservations 
without paying huge reservation fees or expensive monthly subscriptions.

## How does it work?

Statamic Resrv is built on top of Statamic's Entries. Every Entry in your site can be a "product" that can have availability, pricing, and more.

What's even cooler is that you can even sell completely different products. For example, you can have a Collection 
of hotel rooms to reserve and, in the very same Statamic installation, a Collection of cars for rent.

In the **backend**, using Statamic's control panel, you can access the reservation calendar in each Entry simply by 
adding a Resrv Availability field to your Collection. 

A single Entry can also offer multiple [Rates](./rates): for example different room types or pricing tiers that share or own their own inventory. Rates are scoped per Collection, so you set them up once and reuse them across all the Entries in that Collection.

Also in the control panel, you can find a wealth of extra tools, like a list of all the Reservations, a Calendar, Reports, CSV Export, [Rates](./rates), [Dynamic Pricing](./dynamic-pricing) (discounts & coupons), an [Affiliate](./affiliates) system, and more.

In the **frontend**, we provide a number of Laravel Livewire components that handle availability search, showing the 
results, the checkout process, and more.

## Required steps

Resrv can be quite complex to set up, depending on the use case. But here are the general steps that you need 
to follow to get started:

1. [Install](./installation) the addon and migrate the database. Most settings now live in the control panel under **Resrv → Settings**, so the config file is optional and only needed for developer keys like payment gateways.
2. Create the [checkout page](./checkout), which contains the Checkout Livewire component and the checkout complete page.
3. [Configure Resrv](./configuration#checkout) to use the above pages.
4. Add a [Resrv Availability](./availability) field to one of your Collections.
5. Add pricing and availability to your Entries.
6. If you need more than one rate per Entry (room types, pricing tiers, and so on), create your [Rates](./rates) for the Collection.
7. Add any additional [Extras](./extras) or [Options](./options) that you may need.
8. Set up your [payment gateways](./payment-gateways) and configure the webhooks. [Stripe](./stripe) is supported out of the box, an offline / bank-transfer gateway is bundled, you can run multiple gateways at once, and [Mollie](./mollie) is available as a separate add-on.
9. Add the [frontend](./frontend-setup) assets and use the Livewire components to add availability search to your site.
10. Profit!

::: tip Upgrading from v5?
If you already run Resrv v5, follow the [Upgrading to v6](./upgrading) guide. The old "advanced availability" and "connected availabilities" features have been replaced by the new [Rates](./rates) system.
:::
