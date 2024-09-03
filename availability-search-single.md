# Availability Search for a Single Entry

This page explains how to allow your users to inquire about the availability and price of a single Entry.

## Usage

Usually, you'll use this on the Entry's page, in a sidebar or a modal. To offer you the most flexibility, we've split the search and results parts into separate components. That way, you can better customize the layout to fit your needs.

So, let's say you have a cruise named "Three Islands Cruise" and you want to allow your users to book tickets. A basic example would look like this:

```antlers
<div class="max-w-md">
    <div class="my-8">
        {{ livewire:availability-search enableQuantity="true" advanced="cruises.cruise" }}
    </div>
    <div class="my-8">
        {{ livewire:availability-results :entry="id" }}
    </div>
</div>
```

Here, we have an AvailabilitySearch component with advanced availability and quantity enabled. The results are displayed in a separate [AvailabilityResults](./availability-results) component.

<Image src="./img/resrv-availability-search-single.webp" alt="What the above example displays with some minimal changes" />

## Error handling

The component will display relevant information or error messages if the user fails to set all the required search properties (in this example, date & property) or if there is no availability.

## What's next?

You can now move to the [AvailabilityResults](./availability-results) component to customize the results shown.