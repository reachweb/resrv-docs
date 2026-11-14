# Surcharges

Surcharges let you add a **flat fee to a reservation when two of the customer's selections relate in a certain way**. A common example is a car-rental **one-way fee** that only applies when the pickup location is different from the drop-off location.

A surcharge compares the customer's choice in one [Option](./options) against their choice in another, and adds its fee when the two **differ** (or, if you prefer, when they **match**). It is a generic primitive: nothing about it is rental-specific, so you can model cross-zone delivery fees, mismatched start/end depots, "different from / same as" pricing, and similar rules without writing any code.

::: info Surcharge vs. payment surcharge
This page is about **booking surcharges**, a pricing rule you create. Don't confuse it with the per-gateway **payment surcharge** (a processing fee added by a [payment gateway](./payment-gateways)). They are separate features that both happen to use the word "surcharge".
:::

## How matching works

A surcharge references **two Options** and compares the **names of the values** the customer selected in each.

It compares by **name**, not by internal id, because the two Options are independent and have their own separate values. So for "the same place" to be recognised on both ends, you must give the matching values the **same name** in both Options. Comparison is case-insensitive and ignores surrounding spaces.

A surcharge only ever fires when **both** referenced Options have a value selected. If either side is left unselected, no fee is added.

#### Example: a one-way rental fee

1. Create an Option called **Pickup location** with values `Airport` and `Downtown`.
2. Create an Option called **Return location** with the **same value names**, `Airport` and `Downtown`.
3. Create a surcharge that references those two Options, set **Apply the fee when** to *The two selections differ*, and set the fee.

Now a customer who picks up at `Airport` and returns at `Downtown` is charged the one-way fee, while a customer who returns to the same place they picked up from is not.

## Managing surcharges

Surcharges are managed in the Control Panel under **Resrv → Surcharges**, where you can create, edit, reorder and delete them. Each surcharge has the following fields:

| Field | Description |
| --- | --- |
| **Name** | A label for the fee. It is shown to the customer as the line-item name (e.g. `One-way fee`) on the checkout totals and on the reservation emails. |
| **First option** | The first Option to compare (e.g. *Pickup location*). |
| **Second option** | The second Option to compare (e.g. *Return location*). Must be different from the first. |
| **Apply the fee when** | *The two selections differ* or *The two selections match*. |
| **Fee** | The flat amount added to the reservation once it applies. |
| **Published** | Unpublished surcharges are ignored during pricing. |

The fee is a single flat amount applied **once per reservation**. It is not multiplied by quantity, and (for multi-rate cart bookings) not multiplied per item in the cart.

## How the fee is charged

- The surcharge is added to the reservation **total** and shown as its own line on the checkout summary and on the confirmation/made emails.
- It is **always collected up front**. On a deposit booking the full surcharge is added on top of the deposit and charged immediately; only the remaining base balance is deferred.
- It is **never discounted by coupons**. Applying or removing a discount coupon leaves the surcharge untouched.
- The applied surcharge's name and price are **snapshotted onto the reservation** at checkout, so editing or deleting the surcharge rule afterwards never changes what a past booking was charged or what its email shows.
