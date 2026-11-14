# Surcharges

A surcharge compares the customer's choices in two [Options](./options) and adds a **flat fee** to the reservation when they **differ** (or when they **match**). It works for any pair of Options. A typical use is a car rental one-way fee, charged when the pickup and return locations are different.

::: info Surcharge vs. payment surcharge
This page covers **booking surcharges**, a pricing rule you create. The **payment surcharge** is a separate processing fee added by a [payment gateway](./payment-gateways).
:::

## How matching works

A surcharge compares the **names** of the values the customer selected in its two Options. Each Option has its own values, so give the values that mean the same thing the **same name** in both. The comparison ignores case and surrounding spaces.

The fee only applies when both Options have a value selected.

#### Example: a one-way rental fee

1. Create an Option called **Pickup location** with values `Airport` and `Downtown`.
2. Create an Option called **Return location** with the **same value names**, `Airport` and `Downtown`.
3. Create a surcharge that references those two Options, set **Apply the fee when** to *The two selections differ*, and set the fee.

A customer who picks up at `Airport` and returns at `Downtown` pays the one-way fee. One who returns to the pickup location doesn't.

## Managing surcharges

You manage surcharges in the **Surcharges** section of the Control Panel. Each surcharge has these fields:

| Field | Description |
| --- | --- |
| **Name** | Shown to the customer as the line item (e.g. `One-way fee`) in the checkout totals and reservation emails. |
| **First option** | The first Option to compare (e.g. *Pickup location*). |
| **Second option** | The second Option to compare (e.g. *Return location*). Must be different from the first. |
| **Apply the fee when** | *The two selections differ* or *The two selections match*. |
| **Fee** | The flat amount to add. |
| **Published** | Unpublished surcharges are ignored. |

The fee is charged **once per reservation**. It isn't multiplied by quantity or by the number of items in a multi-rate cart booking.

## How the fee is charged

The surcharge is added to the reservation total and shown as its own line in the checkout summary and the reservation emails. Coupons never discount it.

It's always collected up front. On a deposit booking, the full surcharge is charged with the deposit and only the rest of the base price is deferred.

The reservation keeps a copy of the surcharge's name and price, so editing or deleting the surcharge later doesn't change past bookings or their emails.
