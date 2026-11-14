# Emails

Resrv sends transactional emails throughout the reservation lifecycle. Each email is tied to an **event**, and each event ships with a default template, subject, and set of recipients. You can customize every part of this (who receives an email, the from address and name, the subject, the template, or whether the email is sent at all) entirely from the Control Panel, with no code.

## Email events

There are seven main events. Each maps to a mailable and a default template, and goes out automatically when its trigger fires.

| Event | Sent when | Default recipients |
| --- | --- | --- |
| `customer_confirmed` | A reservation is confirmed (payment succeeds) | Customer |
| `admin_made` | A reservation is confirmed (sent alongside the confirmation) | Admins, affiliate |
| `customer_refunded` | A reservation is refunded | Customer, admins |
| `customer_cancelled` | A reservation is cancelled without a refund: a customer cancels outside the free-cancellation window, a booking that collected nothing is voided from the Control Panel, or an unpaid [manual reservation](./manual-reservations) is cancelled or its payment hold lapses (see [Manual reservation emails](#manual-reservation-emails)) | Customer |
| `customer_abandoned` | A customer started but didn't complete a reservation (opt-in, see below) | Customer |
| `customer_payment_request` | A [manual reservation](./manual-reservations) asks the customer to pay (see [Payment request](#payment-request)) | Customer |
| `admin_cancelled` | A customer cancels their own reservation from the [reservation status](./reservation-status) page, or an unpaid manual reservation's payment hold lapses | Admins |

::: info
An eighth event, `admin_orphaned_payment`, notifies your admins when a payment succeeds for a reservation that can no longer be confirmed (expired, refunded, partner or, from v6.5.0, cancelled). From v6.5.0 it also flags manual reservations whose online payment needs checking, for example a booking you marked as paid while an online payment also went through ("The customer may have paid twice"). Each case has its own subject and a recommended action. It isn't listed in the Control Panel email settings, so it always uses its defaults: it is enabled and goes to the addresses in **Admin email**. See [Reconciliation alerts](./manual-reservations#reconciliation-alerts) and [The orphan-payment race](./custom-payment-gateway#the-orphan-payment-race).
:::

The `admins` recipient resolves to the addresses in the **Admin email** field (Settings → Engine). Leave that field empty to disable admin notifications. The `affiliate` recipient resolves to related affiliates that have email notifications enabled, and only when [affiliates](./affiliates) are turned on.

## Customizing emails from the Control Panel

Go to **Resrv → Settings → Emails**. The **Reservation email overrides** section lets you tailor each event globally, or per checkout form.

### Global email event settings

Add a row to the **Global email event settings** grid for any event you want to change. Each row has these fields:

| Field | Description |
| --- | --- |
| Event | The event this row applies to: `customer_confirmed`, `admin_made`, `customer_refunded`, `customer_cancelled`, `customer_abandoned`, `customer_payment_request`, or `admin_cancelled`. |
| Enabled | On by default. Turn it off to stop that email from being sent entirely. |
| Recipient sources | Checkboxes for the built-in recipient groups: `customer`, `admins`, `affiliate`. |
| Extra email addresses | A textarea for additional recipients, one per line, or comma-separated. |
| From address | Overrides the From address for this email. |
| From name | Overrides the From name for this email. |
| Subject | Overrides the subject line. |
| Email template | The template to use, picked from the [available templates](#editing-the-templates). Leave empty to use the default template for the event. |

::: warning RECIPIENTS REPLACE, NOT ADD
If you set **either** Recipient sources or Extra email addresses on a row, those recipients fully **replace** the event defaults. Leave both empty to keep the defaults. All addresses are validated and de-duplicated; invalid ones are dropped silently. If an event resolves to zero valid recipients, the email is not sent.
:::

<Image src="./img/resrv-emails-global.webp" alt="Global email event settings grid in the Control Panel" />

### Per-form overrides

The **Per-form email event overrides** grid has the same fields as the global grid, plus a leading **Form** picker. Use it to override a single event for a specific [checkout form](./checkout), for example, a different subject and template for bookings made through your VIP checkout form.

The checkout form for a reservation is resolved from your per-entry and per-collection checkout form mappings (see [Configuration](./configuration)). If no form can be resolved, per-form overrides are simply skipped.

### Precedence

For any given event, settings are layered:

```text
per-form override  >  global override  >  built-in default
```

A matching per-form row wins over a global row, which wins over the built-in event default. Anything you leave empty on a higher layer falls through to the layer below.

## Abandoned reservation emails

Resrv can send a gentle recovery email to customers who started a reservation but didn't finish. This is **off by default**.

To enable it, go to **Resrv → Settings → Emails → Abandoned reservation emails**:

| Setting | Default | Description |
| --- | --- | --- |
| Enable abandoned reservation emails | `false` | When on, the `resrv:send-abandoned-emails` command sends recovery emails to customers with expired reservations. |
| Delay (in days) | `1` | Days after a reservation expires before the recovery email is sent. `1` = next day. |

The emails are sent by a console command, which you must schedule. Add it to your app's `routes/console.php`:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('resrv:send-abandoned-emails')->daily();
```

::: warning REQUIRES CRON
Scheduled commands only run if your server's cron is configured to run `php artisan schedule:run` every minute. Without it, no abandoned emails are sent.
:::

The command targets reservations that are expired, have customer data, and haven't already received the email. It de-duplicates by **customer email**, so a person who abandoned several checkouts receives a single email. If abandoned emails are disabled, the command exits without doing anything.

You can also run it manually:

```bash
php please resrv:send-abandoned-emails
```

## Manual reservation emails <Badge type="tip" text="NEW" />

[Manual reservations](./manual-reservations) add one email event, **Customer payment request**, and reuse the cancellation events when an unpaid reservation is cancelled. Once the customer pays (the payment gateway's webhook confirms it) or you **Mark as paid**, the usual **Customer confirmed** and **Admin made** emails go out, as for any checkout booking.

### Payment request

The `customer_payment_request` event (**Customer payment request** in the **Event** dropdown) tells the customer how much to pay and how. It is **enabled by default**, goes to the **customer** only, and uses the `payment-request` template. You can override it globally or per checkout form, like any other event.

It is sent:

- when you create a reservation that requests a payment with **Send payment request email** switched on (the default);
- when you click **Send payment request** or **Resend payment request** on the reservations listing or the reservation page;
- when you change the deadline with **Extend hold** and tick the option to email the payment request.

Each successful send is stamped on the reservation, and the reservation page shows it under **Payment request emailed**. If you turn the event's **Enabled** switch off, nothing is sent and nothing is stamped: creating the reservation shows "Reservation created, but the payment request email was not sent. You can send it from the reservation.", and **Send payment request** fails with "The payment request email is disabled in the email settings, so it was not sent."

The email has no built-in subject, so Laravel falls back to *Reservation Payment Request*. Set a **Subject** on the event to use your own.

The email contains:

- your business details and, when the checkout form has a `first_name` field, a greeting with the customer's first name;
- the booking reference and the **Amount to pay** (including any payment surcharge);
- "Please pay by" and the date, only when the reservation has a payment deadline ("Please pay by the end of your arrival day" when the arrival day ends first);
- the reservation details, extras and options, and the remaining amount when you requested less than the total;
- for online payment methods, a **Pay now** button that opens the [payment page](./payment-page), with the link repeated as text in case the button doesn't work;
- for offline methods, your [Offline Payment Instructions](./configuration#manual-reservations) under "How to pay", and a request to include the booking reference with the payment. If you left the instructions empty, the email says that payment is arranged directly with you and asks the customer to contact you, quoting the booking reference.

The first request opens with "We have created a reservation for you. Please complete the payment to confirm it." Every later send is worded as a reminder: "Here is the payment link for your reservation again." (online methods) or "Here are the payment details for your reservation again." (offline methods), followed by "Please complete the payment to confirm it." A reminder sent from **Extend hold** with a new deadline ends with "Your payment deadline is now …" and that deadline instead.

::: info NOTHING TO COLLECT
A manual reservation that collects nothing is confirmed as soon as you create it, so no payment request is sent. The switch on the create page then reads **Send confirmation email** and controls only the **Customer confirmed** email. The **Admin made** email is always sent.
:::

### Lapsed holds

When the [lapsed-hold sweep](./configuration#scheduling-the-lapsed-hold-sweep) cancels a reservation whose payment deadline has passed, Resrv emails both the customer and your admins:

| Recipient | Email event | Default subject | Opening line |
| --- | --- | --- | --- |
| Customer | **Customer cancelled (no refund)** (`customer_cancelled`) | Reservation cancelled — payment not received | "We did not receive your payment by …, so your reservation has been cancelled and the dates have been released." |
| Admins | **Admin cancelled (by customer)** (`admin_cancelled`) | Reservation cancelled — payment hold lapsed | "A reservation has been cancelled because its payment hold lapsed — the customer did not pay in time." |

The customer email also lists the reservation details and invites the customer to contact you if they still want the dates. Despite its label, the **Admin cancelled (by customer)** event covers lapsed holds too. There is no separate switch for lapsed holds: turning either event off silences its lapsed-hold email along with that event's other emails. A **Subject** set on the event replaces the default subject.

### Cancelling an unpaid reservation

When you cancel an **Awaiting payment** reservation with **Cancel reservation**, the dialog has an **Email the customer a cancellation notice** checkbox. It is ticked by default only if a payment request was emailed for that reservation; otherwise the customer may not know the booking exists. When it is ticked, the customer gets the **Customer cancelled (no refund)** email, which says "Your reservation has been cancelled." and "No payment was collected for this reservation, so there is nothing to refund." No admin email is sent for a cancellation you make yourself.

::: warning PAYMENTS IN FLIGHT
If the customer's online payment had already gone through, or was still going through, when the reservation was cancelled (by you or by the sweep), the customer is emailed even if you unticked the checkbox (as long as the **Customer cancelled (no refund)** event is enabled): "If you had just completed the payment for this reservation, don't worry — we have been notified and the charge will be refunded." Your admins get a "Captured payment on a cancelled reservation" alert (for a lapsed hold, in place of the lapsed-hold email). Resrv does **not** refund this charge for you: refund it in your payment provider's dashboard.
:::

## Adding a logo

To show your logo at the top of every email, go to **Resrv → Settings → General** and set the **Logo** field to an **absolute URL** (including `https://`):

```text
https://yourdomain.com/img/logo.png
```

The email header renders it as an image automatically (constrained to a max width of 200px). Leave the field empty to fall back to your business name as text. No template editing is required.

## Editing the templates

If you want full control over the markup, publish the email views:

```bash
php artisan vendor:publish --tag=resrv-emails
```

The templates are published to `resources/views/vendor/statamic-resrv/email`, which contains two subdirectories.

The `reservations/` directory holds the per-event templates:

- `confirmed.blade.php`: customer confirmation (`customer_confirmed`)
- `made.blade.php`: admin notification (`admin_made`)
- `refunded.blade.php`: refund notice (`customer_refunded`)
- `cancelled-customer.blade.php`: customer cancellation notice, including lapsed holds (`customer_cancelled`)
- `abandoned.blade.php`: recovery email (`customer_abandoned`)
- `payment-request.blade.php`: payment request for manual reservations (`customer_payment_request`)
- `cancelled.blade.php`: admin cancellation alert for customer cancellations and lapsed holds (`admin_cancelled`)
- `orphaned-payment.blade.php`: admin orphaned-payment alert (`admin_orphaned_payment`)

The `theme/` directory holds the shared HTML and CSS components (layout, header, footer, message, panel, table, button, subcopy) used to style and lay out every email. Publishing lets you customize both the per-event templates and the shared theme.

::: tip CUSTOM TEMPLATES APPEAR IN THE PICKER
Drop a new Blade file into `resources/views/vendor/statamic-resrv/email/reservations/` and it automatically becomes a selectable option in the **Email template** dropdown in Settings → Emails. The option label is the filename with dashes turned into spaces.
:::

::: info
These templates were originally built during Laravel 9.x, so they use the older Markdown mail syntax (`@component('mail::message')`, `mail::table`, `mail::panel`, `mail::button`). They work fine; we're gradually modernizing them.
:::

### Template changes in v6.5

v6.5.0 changes six templates and adds one. If you published the email views, or picked a custom template for an event or form, your copies keep working but don't pick up these changes:

- **`confirmed` and `made`:** when nothing was charged online (offline payment methods, reservations you marked as paid), the payment row reads "Amount already paid" instead of "Already paid by credit card". The payment rows now also appear with the **Payment type** "Charge the whole amount plus any options and extras" whenever less than the total was paid.
- **`refunded`:** when a refund isn't returned through the payment gateway (offline payments, reservations you marked as paid), the email adds "Your payment of … will be returned to you separately." When Resrv doesn't know whether the customer paid, for example a checkout booking made with an offline method, it reads "If you have already paid for this reservation, your payment of … will be returned to you separately." instead.
- **`cancelled`:** a lapsed hold tells admins the reservation was cancelled "because its payment hold lapsed" rather than "by the customer".
- **`cancelled-customer`:** the "Date" row is now labelled "Cancelled on", and lapsed holds and payments in flight get their own wording (see [Manual reservation emails](#manual-reservation-emails)).
- **`orphaned-payment`:** each reconciliation case gets its own explanation and recommended action.
- **`payment-request`:** new. If you haven't published it, Resrv uses the packaged copy.

::: warning RE-PUBLISH OR MERGE
Old copies of the changed templates ignore the new `$holdLapsed`, `$paymentInFlight`, `$paymentCollected`, `$context`, `$refundedAutomatically` and `$returnedSeparately` data and keep the old wording. For example, an old `cancelled` template tells admins that a lapsed hold was "cancelled by the customer". Merge the changes into your copies, or re-publish them with `php artisan vendor:publish --tag=resrv-emails --force` (which overwrites your edits) and re-apply your changes.
:::

## Extending emails (advanced)

Sibling add-ons can mutate an outgoing reservation email through the `Reach\StatamicResrv\Events\BuildingReservationEmail` event. It fires while a reservation mailable is being built and **before** it is sent, carrying the `Mailable` and the related `Reservation`. A listener can use the full Laravel mailable API: `attachData()`, `withSymfonyMessage(...)` to embed inline images, `subject(...)`, `with([...])`, and so on.

::: warning LISTENERS MUST BE SYNCHRONOUS
A listener that mutates the mailable must **not** implement `ShouldQueue`. The event fires inside the same `build()` call that sends the email, so queueing would let the email go out before your changes land.
:::

The canonical example is the `reachweb/statamic-resrv-vouchers` add-on, which attaches a PDF voucher and embeds an inline QR code onto the confirmation email.

## Sending emails

All emails are sent out automatically. Just make sure your Statamic installation is configured [to send emails](https://statamic.dev/email).
