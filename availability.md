# Availability

The Resrv Availability field is the cornerstone of the Resrv addon. It is used to bind any Entry to an availability and pricing calendar.

If an Entry needs several rates with their own availability and pricing (room types, for example), use this field together with [Rates](./rates).

::: info CHANGED IN v6
[Rates](./rates) replace the v5 "Advanced availability" and "Connected availabilities" features. The `advanced_availability` and `connected_availabilities` field configs and the `property` column are gone. See [Upgrading to v6](./upgrading) to migrate.
:::

## Adding it to your blueprint

Using the Blueprint Editor, add a new field of type `Resrv Availability` to your blueprint. (You can find it in the "Special" category).

<Image src="./img/resrv-availabilty-field.webp" alt="The Resrv Availability field in the Blueprint Editor." />

## Adding availability / pricing

After adding the field to your blueprint, simply open an Entry, and you'll see the Availability calendar.

<Image src="./img/resrv-availability-calendar.webp" alt="The Availability calendar when editing availability and pricing for a date range." />

You can use the `Enable reservations` toggle to disable reservations completely for this entry.

To edit the availability for this entry, simply click on the day you want to change or click and drag to select a date range. In case you want to edit more dates, there is a `Bulk edit` button at the top of the calendar.

In Bulk edit you can limit the change to certain **days of the week** (for weekend pricing, say) and, on an Entry with multiple rates, to one or more **rates**.

Each day on the calendar shows its price and remaining availability, or **Sold out** at `0`.

The availability modal:

<Image src="./img/resrv-availability-calendar-edit.webp" alt="The Availability calendar when editing a field." />

The terms used here:

| Term          | Meaning     |
| ------------- | ------------- |
| Availability  | The quantity of the available items (for example rooms, seats, etc.) |
| Price         | The price for the selected day (or date range) |

To *stop sales* you can set the quantity to 0 or just delete the availability info for that day.

## Per-rate availability

When an Entry has more than one [rate](./rates), pick one in the **Rate** selector above the calendar to edit its availability and pricing. Each rate has its own calendar.

A rate that shares inventory with a base rate has no availability of its own, so edit the availability on the **base rate**. If the shared rate has independent prices, you still set them on its calendar.

You create rates and assign them to entries in the **Rates** section of the Control Panel. See [Rates](./rates).

## Editing dates that already have bookings

You can change the price and availability of dates that have confirmed bookings. Only checkouts still in progress block a change to the availability count. An unfinished checkout returns its quantity when it expires, which would throw off the number you set. The save then fails with "Cannot edit availability while checkouts are in progress for this date range (…). Try again once they complete or expire." From v6.5.0, the message lists the references of those checkouts.

**Awaiting payment** reservations created in the Control Panel don't block it either (see [Manual reservations](./manual-reservations)). If one is cancelled or its payment deadline passes, its quantity is added back on top of the value you set, like a refunded booking.

Deleting availability is stricter. You can't delete it while an active reservation overlaps those dates, **Awaiting payment** ones included. The error reads "Cannot delete availability while active reservations exist for this date range." You also can't delete an entry that has pending, confirmed or **Awaiting payment** reservations.

Reservations created with **Decrease availability** turned off (see [Overbooking](./manual-reservations#overbooking-and-view-only-reservations)) never took availability, so they don't block either.
