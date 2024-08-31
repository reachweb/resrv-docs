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

Also in the control panel, you can find a wealth of extra tools, like a list of all the Reservations, a Calendar, Reports, Dynamic Pricing (discounts & coupons) an Affiliate system, and more.

In the **frontend**, we provide a number of Laravel Livewire components that handle availability search, showing the 
results, the checkout process, and more.

## Required steps

Resrv can be quite complex to set up, depending on the use case. But here are the general steps that you need 
to follow to get started:

1. [Install](./installation) the addon, migrate the database, and publish the config and view files.
2. Create the checkout page, which contains the Checkout Livewire component and the checkout complete page.
3. Configure Resrv to select the above pages.
4. Add a [Resrv Availability](./availability) field to one of your Collections.
5. Add pricing and availability to your Entries.
6. Add any additional Extras or Options that you may need.
7. Set up the payment provider and configure the webhooks. [Stripe](./stripe) is supported out of the box.
8. Add the frontend assets and use the Livewire components to add availability search to your site.
9. Profit!
