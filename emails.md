# Emails

Resrv sends transactional emails throughout the reservation lifecycle. Each email is tied to an **event**, and each event ships with a default template, subject, and set of recipients. You can customize every part of this (who receives an email, the from address and name, the subject, the template, or whether the email is sent at all) entirely from the Control Panel, with no code.

## Email events

There are four main events. Each maps to a mailable and a default template, and goes out automatically when its trigger fires.

| Event | Sent when | Default recipients |
| --- | --- | --- |
| `customer_confirmed` | A reservation is confirmed (payment succeeds) | Customer |
| `admin_made` | A reservation is confirmed (sent alongside the confirmation) | Admins, affiliate |
| `customer_refunded` | A reservation is refunded | Customer, admins |
| `customer_abandoned` | A customer started but didn't complete a reservation (opt-in, see below) | Customer |

::: info
A fifth event, `admin_orphaned_payment`, notifies your admins when a payment succeeds for a reservation that can no longer be confirmed (expired, refunded, or partner). It is not shown in the Control Panel email settings and is configurable only through the developer config. See [Payment gateways](./payment-gateways).
:::

The `admins` recipient resolves to the addresses in the **Admin email** field (Settings → Engine). Leave that field empty to disable admin notifications. The `affiliate` recipient resolves to related affiliates that have email notifications enabled, and only when [affiliates](./affiliates) are turned on.

## Customizing emails from the Control Panel

Go to **Resrv → Settings → Emails**. The **Reservation email overrides** section lets you tailor each event globally, or per checkout form.

### Global email event settings

Add a row to the **Global email event settings** grid for any event you want to change. Each row has these fields:

| Field | Description |
| --- | --- |
| Event | The event this row applies to: `customer_confirmed`, `admin_made`, `customer_refunded`, or `customer_abandoned`. |
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

## Developer config (alternative)

If you prefer to keep email configuration in code rather than the Control Panel, you can define it in the developer config file instead. Publish it with:

```bash
php artisan vendor:publish --tag=resrv-config
```

Then edit `config/resrv-config.php`:

```php
'reservation_emails' => [
    'global' => [
        'customer_confirmed' => [
            'enabled' => true,
            'subject' => 'Your booking is confirmed',
            'from' => ['address' => 'hello@example.com', 'name' => 'Example'],
            'markdown' => 'statamic-resrv::email.reservations.confirmed',
            'recipients' => [
                ['type' => 'customer'],
                ['type' => 'custom', 'emails' => 'ops@example.com'],
            ],
        ],
    ],
    'forms' => [
        'vip' => [
            'customer_confirmed' => [
                'subject' => 'Welcome, VIP guest',
            ],
        ],
    ],
],
```

- `global` is keyed by **event** (`customer_confirmed`, `admin_made`, `customer_refunded`, `customer_abandoned`).
- `forms` is keyed by **form handle**, then by event.
- A per-event array accepts `enabled`, `from` (`['address' => ..., 'name' => ...]`), `subject`, `markdown` (a `statamic-resrv::email.reservations.*` view), and `recipients`. Recipient rows can be `['type' => 'customer']`, `['type' => 'admins']`, `['type' => 'affiliate']`, or `['type' => 'custom', 'emails' => 'a@x.com, b@y.com']`.

This nested structure **takes precedence over** the Control Panel grids.

::: warning DON'T MIX NESTED AND FLAT
If you configure the same event in both the developer config (`reservation_emails`) and the Control Panel grid, the **nested config wins** and a warning is logged. Pick one approach per event.
:::

See [Configuration](./configuration) for the full developer config reference.

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
- `abandoned.blade.php`: recovery email (`customer_abandoned`)
- `orphaned-payment.blade.php`: admin orphaned-payment alert (`admin_orphaned_payment`)

The `theme/` directory holds the shared HTML and CSS components (layout, header, footer, message, panel, table, button, subcopy) used to style and lay out every email. Publishing lets you customize both the per-event templates and the shared theme.

::: tip CUSTOM TEMPLATES APPEAR IN THE PICKER
Drop a new Blade file into `resources/views/vendor/statamic-resrv/email/reservations/` and it automatically becomes a selectable option in the **Email template** dropdown in Settings → Emails. The option label is the filename with dashes turned into spaces.
:::

::: info
These templates were originally built during Laravel 9.x, so they use the older Markdown mail syntax (`@component('mail::message')`, `mail::table`, `mail::panel`, `mail::button`). They work fine; we're gradually modernizing them.
:::

## Extending emails (advanced)

Sibling add-ons can mutate an outgoing reservation email through the `Reach\StatamicResrv\Events\BuildingReservationEmail` event. It fires while a reservation mailable is being built and **before** it is sent, carrying the `Mailable` and the related `Reservation`. A listener can use the full Laravel mailable API: `attachData()`, `withSymfonyMessage(...)` to embed inline images, `subject(...)`, `with([...])`, and so on.

::: warning LISTENERS MUST BE SYNCHRONOUS
A listener that mutates the mailable must **not** implement `ShouldQueue`. The event fires inside the same `build()` call that sends the email, so queueing would let the email go out before your changes land.
:::

The canonical example is the `reachweb/statamic-resrv-vouchers` add-on, which attaches a PDF voucher and embeds an inline QR code onto the confirmation email.

## Sending emails

All emails are sent out automatically. Just make sure your Statamic installation is configured [to send emails](https://statamic.dev/email).
