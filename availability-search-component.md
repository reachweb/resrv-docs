# Availability Search Overview

The AvailabilitySearch Livewire component is the main component that you'll use to add the reservation functionality to your site. It allows the user to search for a date or date range, by specific property and select the quantity that they want to book.

In this page, we'll go over the basics of how to use the component, and then we'll explain how to use it to search for availability of a [single entry](./availability-search-single.md) or how to pair it with [Livewire Filters](https://livewirefilters.com/) or Statamic's Collection Tag in order to search for all [available entries](./availability-search-multiple) for a specific date or dates.

## Component basics

In its most simple form, you can include the AvailabilitySearch component in your Antlers templates like so:

```antlers
{{ livewire:availability-search calendar="range" }}
```

More often than not, you'll also want to include the [AvailabilityResults](./availability-results) component to display the results of the search and the "Book now" button that starts the checkout process.

::: tip
Each search that the user makes is saved in the session, so that their search persists between page loads.
:::

<Image src="./img/resrv-availability-search.webp" alt="A very simple AvailabilitySearch component with its pal, AvailabilityResults" />

## Component properties

Of course, there are quite a few properties that you can set depending on the use case. Here's a list of all the available properties:

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| calendar | string | "single" | The calendar type to use. Single selects a single date, range selects a date range. |
| enableQuantity | boolean | true | When enabled, a quantity control is added so that the user can book more than one product at once. |
| live | boolean | true | When enabled, the component will automatically update the results when the user changes any value of their search. When disabled, the component will only update when the user clicks the "Search" button. |
| redirectTo | string | null | If live mode is disabled, you can select a page to redirect to when the user clicks "Search". |
| advanced | mixed | false | If you are using the advanced availability feature, you need to set this to the `collection.blueprint` value of the collection you are using (for example pages.page) in order to load the properties. |
| anyAdvanced | boolean | false | **Usable when searching for multiple entries** When enabled, the component will pass "any" as the property and the results will return the cheapest property that is available. |
| resetAdvancedOnBoot | boolean | false | When enabled, the component will reset the property when it boots back to null regardless of what's saved in the session. |
| overrideProperties | array | null | You can override the properties that have been set up using Advanced Availability in the Collection. |
| view | string | "availability-search" | You can override the view that is used to render the component. Really useful when you want to have different versions of the AvailabilitySearch component on different pages. Expects a `name.blade.php` file in the `/resources/views/vendor/statamic-resrv/livewire` folder. |

## Customizing

The design of the Availability Search component is very basic by default, since it's meant to be modified to fit your layout. To modify it, make sure you've published the views during checkout and edit the `/resources/views/vendor/statamic-resrv/livewire/availability-search.blade.php` file.

In the same path, inside the `components` folder, you can find and customize the Blade components that are used by the Availability Search component.

## Usage

The component can be used in three different ways:

1. **As a standalone search form that redirects to a results page.**
This is something that you'd probably use on the homepage of a site. To use it this way, you can set live to false and redirectTo to the Entry ID of the page you want to redirect to.
2. **As a search form inside a single Entry.**
When you want your user to search for a single Entry, usually on the aforementioned Entry's page. Follow along at [single entry](./availability-search-single.md) for examples.
3. **As a search form on an index page.**
When you want the user to input their search properties and list all available Entries. You can find your options on the [multiple entries](./availability-search-multiple) page.

## Passing data to checkout

There are some cases where you might want to pass some data to the checkout page before the user gets there. A good example is the [Guests component](./guests) where we pass along the number of guests to the checkout page. To achive that you can bind the control you want to use to the `data.customer.handle` property of the `AvailabilitySearch` component. Just make sure to create the appropriate fields in your [checkout form](./checkout#checkout-form). If you don't want to allow the user to edit them, remember to set them as `hidden` fields in your blueprint.