# Availability Results Component

The `AvailabilityResults` Livewire component handles displaying the results of an availability search and lets the user start the checkout process. This page explains how to use it and how to provide extra functionality.

## Component basics

This component is designed to work for a **single Entry**. You can check how to display the list of Entries that are available for a specific date or dates in the [Availability Search for Multiple Entries](./availability-search-multiple) page.

In its most basic form, you can include it in your templates like so:

```antlers
{{ livewire:availability-results :entry="id" }}
```

This will load the component and display the results for the Entry at the current page. As described in the [Availability Search for a Single Entry](./availability-search-single) page, you usually want to attach an instance of the AvailabilitySearch component so tha the user can change their search properties:

```antlers
<div class="max-w-md">
    <div class="my-8">
        {{ livewire:availability-search enableQuantity="true" calendar="range" }}
    </div>
    <div class="my-8">
        {{ livewire:availability-results :entry="id" }}
    </div>
</div>
```

## Component properties

Of course, there are quite a few properties that you can set depending on the use case. Here's a list of all the available properties:

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| entry | string | none - required | **Needs to be a Statamic Entry ID**. The ID of the entry you want to display results for. |
| extraDays | integer | 0 | When set to a number greater than 0, the component will also get availability for the days before and after the current period the user searches for. |
| extraDaysOffset | integer | 0 | If extra days are enabled you can set an offset between the dates it searches for. |
| showExtras | boolean or array | false | If you want to display an Extras select box here, you can set this to true to show all extras or an array of the IDs you want to display. (more information below) |
| showOptions | boolean or array | false | If you want to display an Options select box here, you can set this to true to show all options for this Entry or an array of the IDs you want to display. (more information below) |
| view | string | "availability-results" | You can override the view that is used to render the component. Expects a `name.blade.php` file in the `/resources/views/vendor/statamic-resrv/livewire` folder. |

## Customizing

Obviously, depending on the use case, you'll need to customize the component to fit your needs. The main template file can be found at `/resources/views/vendor/statamic-resrv/livewire/availability-results.blade.php`. There you can select what elements you want to display and customize them.

## Extras and Options (Optional)

Besides just displaying the availability results, you can also display the Extras and Options of that Entry. It might strike you as weird that this is part of the `AvailabilityResults` component instead of the `AvailabilitySearch` component, but the Extras and Options need access the Entry data, so they need to be displayed in the same component.

By default, the Extras and Options are not displayed since they are part of the [Checkout](./checkout) component. However there are cases where you might want to display them next to the availability results.

To do so, just enable the appropriate properties. For example:

```antlers
{{ livewire:availability-results :entry="id" showExtras="true" }}
```

<Image src="./img/resrv-availability-results-extras.webp" alt="An AvailabilityResults component with the Extras enabled." />

## Checking out

The final task of the `AvailabilityResults` component is to let the user start the checkout process. When the user clicks "Book now", the component will create a "Pending" reservation and move the user to the checkout page.

Read along to learn more about the [Checkout](./checkout) component.