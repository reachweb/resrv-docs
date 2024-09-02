# Availability Search for Multiple Entries

This page explains how to allow your users to search for all available Entries for a specific date or dates.

## Using Livewire Filters (Recommended)

In most modern websites, filtering a list of Entries for results should be instant and quick. With that in mind, we've decided to combine Statamic Resrv with another product of ours, [Livewire Filters](https://livewirefilters.com/).

### What Is Livewire Filters?

**Livewire Filters** is an add-on that enables you to use Livewire to create "live" filters (meaning they feel like JavaScript, no reload is needed) for your Statamic collections. It's **super powerful** and allows you to easily filter your entries by almost any field. You can [read the docs](https://livewirefilters.com/docs/v1/overview) on its website to learn more about how to use it, but for the purpose of this page, we'll just go over the basics.

To use Livewire Filters, you just need to [install the addon](https://livewirefilters.com/docs/v1/installation). Statamic Resrv will detect that it exists and automatically register the extra components needed.

### How to Filter Your Entries

Again, more info can be found in the [Livewire Filters docs](https://livewirefilters.com/docs/v1/usage-overview). Statamic Resrv registers an extra Livewire component called `LfAvailabilityFilter`. This component includes `AvailabilitySearch` and ties it to the `LivewireCollection` component that Livewire Filters provides.

A quick example would be something like this:

```antlers{3-7,13}
<div class="container mx-auto my-12 flex">
    <div class="w-96">
        {{ livewire:lf-availability-filter
            blueprint="rooms.room"
            calendar="range"
            enableQuantity="true"
        }}
    </div>
    <div class="pl-12 xl:pl-16 w-full flex-shrink">
        {{ livewire-collection:rooms query_scope="resrv_search" resrv_search:resrv_availability="{ session:resrv-search }" }}
    </div>
</div>
```

The `LfAvailabilityFilter` accepts the same properties as the [AvailabilitySearch](./availability-search-component) component, but it also needs a `blueprint` property that you need to set to `collection.blueprint`, as in the example above. It then uses a `resrv_search` query scope to filter out the entries that are not available for the selected dates.

That's all! Now all you need to do is edit your `LivewireCollection` view at `resources/views/vendor/statamic-livewire-filters/livewire/livewire-collection.blade.php` and you'll have a blazing fast "live" filtering system for your entries.

## Using the Collection Tag

If you don't want to use Livewire or don't need all the extra power that Livewire Filters offer, you can always use the regular [Collection Tag](https://statamic.dev/tags/collection) to list all available entries. You can still apply the same `resrv-search` query scope to filter out the entries that are not available for the selected dates.

A basic example would look like this:

```antlers{3,7,18}
<div class="container mx-auto my-12 flex">
    <div class="w-96">
        {{ livewire:availability-search calendar="range" live="false" :redirectTo="url" }}
    </div>
    <div class="pl-12 xl:pl-16 w-full flex-shrink">
        <div class="grid grid-cols-2 gap-4 xl:gap-8">
            {{ collection:rooms as="rooms" query_scope="resrv_search" resrv_search:resrv_availability="{ session:resrv-search }" }}
                {{ if no_results }}
                    <p>No rooms are available for these dates.</p>
                {{ /if }}
                {{ rooms }}
                    <a class="bg-gray-50 rounded-lg p-8 w-full" href="{{ url }}">
                        <div class="text-xl font-bold">
                            {{ title }}
                        </div>                
                    </a>
                {{ /rooms }}
            {{ /collection:rooms }}
        </div>
    </div>
</div>
```

This will display an `AvailabilitySearch` component in the side, without live refresh. When a user clicks "Search", they will be redirected back to the same page and the `resrv-search` query scope will filter out any not available entries for the dates selected.

::: tip
You need to to also send the session data along (the `resrv_search:resrv_availability="{ session:resrv-search }"` part). Even though this could have been done in the query scope itself, that way we have better control over the data that is sent can better handle Livewire filtering as described further down.
:::

## Accessing Availability Data

When an AvailabilitySearch is active, a hook is triggered that adds the availability data into each Entry so that you can use them in your templates. The data is added as an array passed through as the `live_availability` key of the entry.

It has the following properties:

| Property | Description |
| -------- | ----------- |
| price | The total price of the Entry for the given dates. |
| original_price | The starting price if Dynamic Pricing is active. |
| payment | What the user needs to pay to book this Entry (check the Global config for more info). |
| property | The property the above refers to in case Advanced Availability is used. |
| propertyLabel | The label of the above property. |

When the availability data is provided, you can use them like so:

```antlers{11-15}
[...]
{{ collection:rooms as="rooms" query_scope="resrv_search" resrv_search:resrv_availability="{ session:resrv-search }" }}
    {{ if no_results }}
        <p>No rooms are available for these dates.</p>
    {{ /if }}
    {{ rooms }}
        <a class="bg-gray-50 rounded-lg p-8 w-full" href="{{ url }}">
            <div class="text-xl font-bold">
                {{ title }}
            </div>
            {{ if live_availability }}
            <span class="text-sm text-gray-500 mt-2">
                Price: ${{ live_availability:price }}
            </span>
            {{ /endif }}            
        </a>
    {{ /rooms }}
{{ /collection:rooms }}
[...]
```

::: tip
The method above works for both the **Collection Tag** and the **Livewire Filters** component.
:::
