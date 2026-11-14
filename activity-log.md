# Activity Log

Resrv can keep a detailed record of every change to your availability and every reservation status change. It answers questions like "why is this date unavailable", "who changed the price for August" or "when was this reservation confirmed". In this page we'll go over how to enable it, what it records, and how to keep it from growing forever.

## Enabling the activity log

The activity log is disabled by default. To use it, enable the **Enable activity log** toggle in the addon's [configuration](./configuration#engine) page. Once enabled, you can find the Activity Log link in the Control Panel.

::: info Logging starts when you enable it
Nothing is recorded retroactively. Changes made while the toggle is off are not in the log.
:::

## Availability changes

Every change to availability or price is recorded per date and per rate, along with the reason it happened:

| Reason | When it is recorded |
|---|---|
| Reservation created | A customer starts checkout, or a user [creates a reservation in the Control Panel](./manual-reservations), and availability is held for the reservation dates. Reservations created with **Decrease availability** turned off don't take availability, so they record nothing here. |
| Reservation expired | A pending reservation times out and the held availability is released. |
| Reservation refunded | A reservation is refunded and its availability is returned. |
| Reservation cancelled | A reservation is cancelled and its availability is returned, for example an unpaid manual reservation that a user cancels or whose payment deadline passes. |
| Edited in the Control Panel | A user changes availability or pricing from the availability calendar. |
| Deleted in the Control Panel | A user deletes availability for a date range. |
| Stuck pending cleared | The cleanup tool restores availability that a stale checkout left blocked. |
| Data import | A CSV import writes availability (see [Data imports](#data-imports) below). |

Each entry records the date, the rate, the field that changed (`available` or `price`), the old and new value, and the user that made the change when it happened in the Control Panel. Changes that were driven by a reservation also record the reservation ID, so you can trace an availability change back to the booking that caused it.

Changes performed together are grouped into a single operation: an edit that spans a whole season appears as one line showing the reason, the user and the number of changes. Expand it to see the individual rows.

You can filter the list by entry, by reason and by availability date.

## Reservation events

The second tab of the Activity Log follows each reservation through its lifecycle. Every entry records the status before and after, the reason, and the user where applicable:

| Event | When it is recorded |
|---|---|
| Checkout started | A customer begins checkout and a pending reservation is created. |
| Created in the Control Panel | A user creates a reservation with **Create reservation** (see [Manual reservations](./manual-reservations)). It starts as **Awaiting payment**. |
| Confirmed at checkout | The reservation is confirmed when the customer returns from payment. |
| Confirmed by payment webhook | The payment provider's webhook confirms the reservation, including payments made from the [payment page](./payment-page). The gateway and payment ID are stored with the entry. |
| Confirmed in the Control Panel | A user marks an **Awaiting payment** reservation as paid, or creates a reservation that collects nothing, which is confirmed straight away. |
| Expired | A pending reservation times out without payment. |
| Refunded in the Control Panel | A user refunds the reservation. The acting user is recorded. |
| Reservation cancelled | A reservation is cancelled without a refund: a user cancels an **Awaiting payment** reservation, its payment deadline passes, a customer cancels after the free-cancellation window, or a user cancels a partner or zero-payment booking. Custom site code can also dispatch the event (see the developer note below). |

The "Created in the Control Panel", "Confirmed in the Control Panel" and "Reservation cancelled" entries don't record the acting user. The reservation page shows who created a reservation under **Created by**.

You can filter the list by reference, by reason and by date.

## Data imports

When the activity log is enabled, each CSV import run is recorded as a single grouped operation. The rows record the values the import wrote for each date, marked with the `import` badge.

Note that these entries show what was **written**, not a before and after comparison. An import overwrites whatever exists for the dates it covers, so the log keeps the values that were set. If you need to know what a date looked like before an import, look at the entries recorded earlier for that date.

## Retention

Log entries are never deleted on their own, so the tables grow with every booking and edit. The [housekeeping command](./upgrading#_2-optional-schedule-housekeeping) prunes entries older than the retention window given by the `--log-days` option (365 days by default):

```bash
php please resrv:housekeeping --log-days=365
```

Use `--dry-run` to preview what would be deleted. If you already schedule housekeeping, activity log pruning is included automatically:

```php
Schedule::command('resrv:housekeeping')->daily();
```

Pruning runs even when the activity log toggle is off, so a site that stops using the feature still gets its old rows cleared.

## Good to know

Log entries are snapshots. They keep the entry title, the rate and the acting user's name at the time of the change, so they remain readable even after the related reservation, availability rows or rates have been deleted or purged by housekeeping.

Writing to the log never interferes with your bookings. If a log write fails for any reason, the booking, refund or edit completes normally and the failure is reported to the application log.

::: info Developer note
Resrv dispatches the `Reach\StatamicResrv\Events\ReservationCancelled` event whenever it cancels a reservation without a refund (the cases listed under [Reservation events](#reservation-events)). It is also a public extension point: if your own site code dispatches it as part of a custom cancellation flow, the addon releases the reservation's availability and, with the activity log enabled, records the event with the "Reservation cancelled" reason. From v6.5.0, the event also carries an optional `$context` (`hold_lapsed`, `unpaid_hold` or `payment_in_flight`) and a `$notifyCustomer` flag. Custom listeners that email the customer should skip the email when `$notifyCustomer` is `false`.
:::
