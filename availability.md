# Availability

The Resrv Availability field is the cornerstone of the Resrv addon. It is used to bind any Entry to an availability and pricing calendar.

This field also supports advanced features like multiple availability options and connected availabilities.

## Adding it to your blueprint

Using the Blueprint Editor, add a new field of type `Resrv Availability` to your blueprint. (You can find it in the "Special" category).

<Image src="./img/resrv-availabilty-field.webp" alt="The Resrv Availability field in the Blueprint Editor." />

::: warning EDIT THE DEFAULT HANDLE
By default, Statamic appends "_field" to the handle of each new field. For Resrv to work correctly, you need to edit the handle so that it's *exactly* `resrv_availability`, as shown above.
:::

## Adding availability / pricing

After adding the field to your blueprint, simply open an Entry, and you'll see the Availability calendar.

<Image src="./img/resrv-availability-calendar.webp" alt="The Availability calendar when editing availability and pricing for a date range." />

You can use the `Enable reservations` toggle to disable reservations completely for this entry.

To edit the availability for this entry, simply click on the day you want to change or click and drag to select a date range. In case you want to edit more dates, there is a `Bulk edit` button at the top of the calendar that allows you to select multiple months at once.

The availability modal:

<Image src="./img/resrv-availability-calendar-edit.webp" alt="The Availability calendar when editing a field." />

The terms used here:

| Term          | Meaning     |
| ------------- | ------------- |
| Availability  | The quantity of the available items (for example rooms, seats, etc.) |
| Price         | The price for the selected day (or date range) |

To *stop sales* you can set the quantity to 0 or just delete the availability info for that day.

## Advanced availability

There are cases where you might need to attach multiple availabilities to a single Entry. For instance, you might have a room type that has a Sea or Garden view, or you might sell a cruise with different types of boats.

In these cases, you can enable the `Advanced Availability` option in the [global Resrv configuration](./configuration).

Enabling advanced availability will add a new section to the config of the Resrv Availability field where you can enter the slug and the label of each property:

<Image src="./img/resrv-advanced-availability.webp" alt="Adding extra properties to the availability field." />

That way, you get a dropdown in the Resrv Availability field that lets you set the availability and pricing for each property.

In this example, we are selling a lovely cruise called "Three islands cruise" with three different boat types. Using Advanced Availability, we can set the availability and pricing for each boat type separately but still display the cruise information in a single Entry. The user can then see which boat type is available and how much it costs.

<Image src="./img/resrv-advanced-availability-dropdown.webp" alt="Captain Jack handling three boats in one Statamic Entry." />

## Connected availabilities

Now let's take it up a notch. What if you had three boats that can do a number of different cruises? But obviously, if your boat is booked for the "Three islands cruise" this Friday, it can't do "Sailing into the sunset" as well.

Fear not, Resrv has you covered. Enable the `Connected availabilities` option in the [global Resrv configuration](./configuration) to enable the relevant setting in the Availability field:

<Image src="./img/resrv-advanced-availability-connected.webp" alt="Connected availability settings." />

This feature connects the availability of different properties together. This works **everywhere**, meaning that if a user books something, availability will decrease for all other properties that are connected to it. Even changing the availability of one property through the control panel calendar will update the availability of the others.

The available options here are:

- **All availabilities of the same entry:** This will make all availabilities of the same entry connected.

- **Same slug:** will work for availabilities that have the same slug (for example, if "Three islands cruise" and "Sailing into the sunset" have the same "sailingyacht" slug, booking one will also block the other).

- **Select manually:** allows you to set the properties that should be connected by adding the *slugs* below.

## Converting to advanced availability

Even though the advanced availability feature can be enabled easily in the configuration, converting a Collection to use it **that already works without it** is not trivial.

To convert, you can either delete all availabilities of the Entries of said Collection and start anew or edit the `resrv_availabilities` table in the database to change the `property` column from "none" to whatever slug you want to use. Generally, deleting all availabilities for the Entries of the Collection is the easiest way to go.
