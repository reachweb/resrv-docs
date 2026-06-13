# Availability

The Resrv Availability field is the cornerstone of the Resrv addon. It is used to bind any Entry to an availability and pricing calendar.

For multi-rate setups (room types, packages, boat types, and similar), pair this field with [Rates](./rates), a collection-scoped system that lets a single Entry offer several rates, each with its own availability and pricing.

::: info CHANGED IN v6
The v5 "Advanced availability" and "Connected availabilities" features have been removed. Both are replaced by the new collection-scoped [Rates](./rates) system. The `advanced_availability` and `connected_availabilities` field configs are gone, along with the `property` column. See [Upgrading to v6](./upgrading) for the migration path.
:::

## Adding it to your blueprint

Using the Blueprint Editor, add a new field of type `Resrv Availability` to your blueprint. (You can find it in the "Special" category).

<Image src="./img/resrv-availabilty-field.webp" alt="The Resrv Availability field in the Blueprint Editor." />

## Adding availability / pricing

After adding the field to your blueprint, simply open an Entry, and you'll see the Availability calendar.

<Image src="./img/resrv-availability-calendar.webp" alt="The Availability calendar when editing availability and pricing for a date range." />

You can use the `Enable reservations` toggle to disable reservations completely for this entry.

To edit the availability for this entry, simply click on the day you want to change or click and drag to select a date range. In case you want to edit more dates, there is a `Bulk edit` button at the top of the calendar.

The Bulk edit modal lets you pick a date range, set the availability and price, and optionally limit the change to specific **days of the week** (for example, weekend-only pricing). On an Entry with multiple rates you can also target one or more **rates** at once.

Each calendar day shows the remaining availability count (or **Sold out** when it reaches `0`) and the price for that day.

The availability modal:

<Image src="./img/resrv-availability-calendar-edit.webp" alt="The Availability calendar when editing a field." />

The terms used here:

| Term          | Meaning     |
| ------------- | ------------- |
| Availability  | The quantity of the available items (for example rooms, seats, etc.) |
| Price         | The price for the selected day (or date range) |

To *stop sales* you can set the quantity to 0 or just delete the availability info for that day.

## Per-rate availability

When an Entry has more than one [rate](./rates), a **Rate** selector appears above the calendar. Pick a rate to load and edit that rate's own availability and pricing, each rate keeps a separate calendar. With a single rate the calendar edits it directly and no selector is shown.

Rates that share their inventory with a base rate don't own availability of their own: edit the inventory on the **base rate**, and the shared rate draws from the same pool. (Independent prices for a shared rate are still entered here on the calendar.)

Rates themselves, creating them, choosing pricing and availability modes, restrictions, and assigning them to entries, are managed in the **Rates** section of the Control Panel. See [Rates](./rates) for the full reference.
