# Rates

Rates are how Resrv handles multiple pricing and availability options on a single Entry. A common example is a hotel room type that you sell at a "Standard" rate, a discounted "Non-refundable" rate, and a "Breakfast included" rate, all sharing the same inventory but priced differently.

::: info REPLACES ADVANCED & CONNECTED AVAILABILITY
Rates are a new feature in v6 and replace the old "Advanced availability" (per-entry properties) and "Connected availabilities" features from v5. If you are upgrading an existing site, read [Upgrading to v6](./upgrading) for the migration path.
:::

## What is a Rate?

A Rate is a record scoped to a **Statamic collection**, not to a single Entry. One collection can have many rates, and a rate can apply to every Entry in the collection or just a hand-picked few.

Each rate carries:

- A **pricing type**: its own prices, or prices derived from another rate.
- An **availability type**: its own inventory pool, or a pool shared with another rate.
- Optional **restrictions**: date window, booking lead time, and minimum/maximum stay.
- An optional **cancellation policy**.
- A **published** flag and a sort **order**.

When an Entry has more than one published rate, your visitors get to pick which rate to book on the frontend.

## Managing rates

Rates live in their own **Rates** section in the admin panel, under the Resrv navigation.

<Image src="./img/resrv-rates-list.webp" alt="The Rates management page with the collection picker and rate tree." />

At the top of the screen you pick a **collection**. Only collections that use the [Resrv Availability](./availability) field appear here.

Rates are shown as a **two-level tree**. Top-level (base or standalone) rates appear first, with any rates derived from them nested and indented underneath. Drag handles let you reorder rates within a level.

The list shows badges for each rate, such as a published/draft indicator, "All entries" (when the rate applies to the whole collection), a "Non-refundable" warning, and on parent rates a count of how many rates derive from them.

To create a rate, click **Add rate**. To edit one, click its title. Both open the rate panel.

<Image src="./img/resrv-rates-panel.webp" alt="The Add/Edit rate panel with its General, Pricing, Availability and Restrictions sections." />

## Apply to all vs specific entries

In the **General** section, the **Apply to all entries in collection** switch controls where the rate is available:

- **On**: the rate applies to every Entry in the collection.
- **Off**: an entry picker appears so you can select exactly which Entries the rate applies to. Use **Select all** / **Remove all** to manage the list quickly.

The collection is fixed once a rate is created; you cannot move a rate to another collection later.

## Pricing type

A rate's **pricing type** decides where its prices come from.

- **Independent** (default): the rate has its own per-day prices. For a standard rate that also owns its inventory, prices come from the Entry's [Availability calendar](./availability) rows for that rate.
- **Relative**: the rate has no prices of its own. It derives them from a **base rate** by applying a modifier.

When you choose **Relative**, you set three modifier fields:

| Field | Values | Description |
| ------------- | ------------- | ------------- |
| Modifier type | `Percent` or `Fixed` | Whether the adjustment is a percentage or a flat amount. |
| Modifier operation | `Increase` or `Decrease` | Whether the adjustment raises or lowers the base price. |
| Modifier amount | A number (no `%` character) | The amount or percentage to apply. |

Behaviour:

- **Percent** raises or lowers the base price by that percentage. A `Percent` + `Decrease` modifier is capped at 100.
- **Fixed** adds or subtracts a flat amount **per day** (for a multi-day booking the amount is multiplied by the number of nights).
- A decrease that would push the price below zero is floored at zero.

::: warning PRICING TYPE IS IMMUTABLE
The pricing type cannot be changed after a rate is created. If you need to switch between independent and relative pricing, delete the rate and recreate it.
:::

A base rate used for relative pricing must be in the **same collection**, must be **published**, and must itself be an **independent, non-shared** rate. Relative and shared rates cannot be used as a base.

## Availability type

A rate's **availability type** decides where its inventory comes from.

- **Independent** (default): the rate has its own inventory pool, stored against its rate in the Availability calendar.
- **Shared**: the rate does not own inventory. It shares the **base rate's** pool, so booking the shared rate decrements the base rate's availability. You can optionally cap how many units are bookable on the shared rate with **Max available**, even when the underlying pool is larger.

When you choose **Shared**, a base rate is required (the same base-rate field serves both relative pricing and shared availability).

::: warning AVAILABILITY TYPE IS IMMUTABLE
Like the pricing type, the availability type cannot be changed after a rate is created. Delete and recreate the rate to switch it.
:::

### The four configurations

Pricing type and availability type combine into four real-world setups:

| Pricing | Availability | Base rate | What it is |
| ------------- | ------------- | ------------- | ------------- |
| Independent | Independent | Not required | A standalone rate with its own prices and its own inventory. This is the default. |
| Relative | Independent | Required | Own inventory, price derived from the base rate via a modifier. |
| Independent | Shared | Required | Shares the base rate's inventory, but prices are managed independently (see below). |
| Relative | Shared | Required | Shares the base rate's inventory **and** derives its price from the base rate. |

## Independent pricing on shared rates

When a rate is **Shared** and uses **Independent** pricing, it shares the base rate's inventory but keeps its own prices. Those prices are entered in the Entry's [Availability calendar](./availability), not in the Rates screen, where you set a per-day price for the shared rate. (Editing the *inventory* of a shared rate is blocked, since that comes from the base rate.)

A **Require price override** switch controls what happens on dates where you haven't set a price for the shared rate:

- **On**: dates without an explicit price for this rate are **unavailable**.
- **Off**: those dates fall back to the **base rate's** price.

This switch only appears for rates that are Shared with Independent pricing.

## Restrictions

The **Restrictions** section lets you limit when a rate can be booked. Every field is optional.

| Field | Description |
| ------------- | ------------- |
| Date range | The rate is only bookable within this window. The check-in date must fall on or after the start, and the booking must end on or before the end date. |
| Min days before | Early-bird: bookable only at least this many days before the reservation starts. The global minimum still applies. Leave empty for no restriction. |
| Max days before | Last-minute: bookable only at most this many days before the reservation starts. Use **0** for same-day bookings only. Leave empty for no restriction. |
| Min stay | Minimum number of nights. |
| Max stay | Maximum number of nights. |

## Cancellation policy

Each rate can declare its own cancellation policy in the **Cancellation policy** section. This layers on top of the global free-cancellation settings in your [configuration](./configuration).

The **Cancellation policy** select offers three choices:

- **Free cancellation until X days before** (`free_cancellation`): free cancellation up to a number of days before check-in. A **Free cancellation period** input appears so you can set that number of days.
- **Non-refundable** (`non_refundable`): no free-cancellation window. The booking is always prepaid in full.
- **Use global default** (leave empty): the rate inherits the global `free_cancellation_period` setting, which is the v5 behaviour.

A customer-facing label is rendered from this policy on availability results, the checkout sidebar, the reservation details, and the confirmation email, for example "Free cancellation until Mon 03 Jun 2026" or "Non-refundable". If the policy resolves to no configured period, no label is shown.

::: warning NON-REFUNDABLE ALWAYS CHARGES IN FULL
Non-refundable rates always require **full payment at checkout**, regardless of your deposit settings, and this holds even after a coupon is applied or removed.
:::

The resolved policy is **snapshotted onto the reservation at booking time**, so later edits to the rate or to the global settings never change the terms an existing booking was made under. For multi-day bookings that span several rates, Resrv resolves a single strictest policy across them: any non-refundable part makes the whole booking non-refundable.

## Published flag & ordering

The **Settings** section has a **Published** switch. Unpublished (draft) rates are hidden on the frontend, so you can prepare a rate before making it bookable.

Ordering is controlled by dragging rates in the Rates list. The order you set there is the order rates appear in on the frontend rate selector.

::: info DELETING RATES
A rate cannot be deleted while it is used as the base for another rate, or while it has active reservations. Remove or reassign those first.
:::

## On the frontend

When an Entry has multiple published rates, a rate selector appears in the [availability search component](./availability-search-component) so visitors can choose which rate to book. The selected rate flows through to the [availability results](./availability-results), which show the price, availability, and cancellation label for the chosen rate.

If no rate is selected and an Entry has several rates, Resrv shows the cheapest available rate by default.

## Upgrading from v5

If you are coming from v5, where multiple availability options were handled through "Advanced availability" properties and "Connected availabilities", see [Upgrading to v6](./upgrading) for the full migration sequence and the `resrv:upgrade-to-rates` command that converts your existing setup into rates.
