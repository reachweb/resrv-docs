# Configuration

Resrv splits its configuration between **two owners**, and it helps to know which is which before you start:

- **CP-managed settings**: business information, the reservation engine, checkout, emails, and currency. You edit these in the Control Panel under **Resrv → Settings**, and Statamic stores them on your site at `resources/addons/statamic-resrv.yaml`. Commit that file to version control.
- **Developer keys**: the payment gateway(s), Stripe credentials, and the nested checkout-form / reservation-email override structures. These live in the publishable `config/resrv-config.php` file.

At boot, Resrv merges all three layers (blueprint defaults, then `config/resrv-config.php`, then your CP-saved values) into a single `resrv-config.*` config. The order matters: **the Control Panel value always wins** over the same key defined in the config file.

::: info Migrating from v5
In v5 every setting lived in `config/resrv-config.php`. In v6 the business and engine settings moved to the Control Panel. If you are upgrading, run `php please resrv:settings:migrate` to move your existing values across, see [Migrating from a published config](#migrating-from-a-published-config) below and the [upgrade guide](./upgrading).
:::

## Settings reference

Open **Resrv → Settings** in the Control Panel. The settings are organised into five tabs: **General**, **Engine**, **Checkout**, **Emails**, and **Currency**.

### General

Business information that is used in the reservation email templates.

| Field | Default | Description |
|---|---|---|
| Business name | `Resrv` | Your business name. |
| Business address | `Somestreet 8` | Street address. |
| ZIP & City | `00000 City` | ZIP code and city. |
| Country | `Greece` | Country. |
| Phone | `+30 0000 000000` | Contact phone. |
| Email | `resrv@resrv.app` | Contact email. |
| Logo | *(empty)* | Leave empty to use your business name, or enter an **absolute URL** (including `https://`) to an image. |

::: tip The Logo field now works
In v6 the Logo field is functional. Paste an absolute `https://…` URL and the email header renders it automatically as an image. No template editing required. Leave it empty to fall back to your business name. See [Emails](./emails) for details.
:::

### Engine

Controls how the reservation engine behaves.

| Field | Default | Description |
|---|---|---|
| Enable time | `false` | Require an explicit pick-up and drop-off time for each reservation. *Not yet implemented in the frontend.* |
| Enable affiliates | `true` | Enable the [affiliate system](./affiliates). Also controls whether the **Affiliates** nav item appears. |
| Enable cutoff rules | `false` | Enable per-entry [cutoff times](./cutoff) based on starting times and schedules. |
| Minimum days before | `0` | Minimum number of days allowed between today and the reservation start date. Useful to block last-minute bookings. |
| Minimum reservation period (in days) | `1` | Minimum number of days a reservation must span. |
| Maximum reservation period (in days) | `30` | Maximum number of days a reservation may span. |
| Free cancellation (in days) | `0` | Days before the start date the customer may cancel. Cancellations are manual; this drives the displayed cancellation label. |
| Require full payment if free cancellation has passed | `false` | Require full payment when the free-cancellation window has already passed at booking time. |
| Maximum quantity | `8` | Maximum quantity allowed in one reservation. |
| Ignore quantity for prices | `false` | Track quantity without multiplying the price by it (e.g. seats at a restaurant). |
| Calculate days using time | `false` | With *Enable time*, charge an extra day when the return time is after the start time. *Not yet implemented in the frontend.* |
| Decrease availability for extra time | `false` | Block the final day's availability when the return time is after the start time. |
| Admin email | *(empty)* | Comma-separated list of emails notified about new reservations and refunds. Leave empty to disable admin notifications. |

::: tip Cancellation policy is now per-rate
**Free cancellation (in days)** and **Require full payment if free cancellation has passed** are now the *fallback* used when a rate has no explicit policy of its own. Each rate can declare its own free-cancellation window or be marked non-refundable. See [Rates → Cancellation policy](./rates#cancellation-policy). Non-refundable bookings always require full payment at checkout.
:::

### Checkout

Controls the checkout process and which form each reservation uses. See the [Checkout](./checkout) page for the full flow.

| Field | Default | Description |
|---|---|---|
| Default checkout form | *(none)* | The form used when no entry-specific or collection-specific mapping matches. **Required.** |
| Collection checkout form mappings | *(none)* | Map collection handles to checkout forms. Each row has a **Collection** (handle, e.g. `pages`) and a **Form**. |
| Entry checkout form mappings | *(none)* | Map specific entries to checkout forms. **Entry mappings take precedence over collection mappings.** |
| Checkout Entry | *(none)* | The Statamic entry that loads the [Livewire checkout](./checkout#checkout-component) component. **Required.** |
| Checkout Redirect Entry | *(none)* | The [checkout complete](./checkout#checkout-complete) page that includes the `resrv_checkout_redirect` tag. **Required.** |
| Payment type | `full` | What the customer pays online to complete a reservation (see below). |
| Fixed amount | `50` | The amount charged. Shown only when **Payment type** is *Charge a fixed amount*. |
| Percentage | `20` | The percentage of the base price charged. Shown only when **Payment type** is *Charge a percentage of the base price*. |
| Minutes to hold | `10` | How long availability is temporarily blocked when a customer starts checkout, to prevent double bookings. |

**Payment type** options:

| Value | Charges |
|---|---|
| `full` | The whole reservation amount. |
| `everything` | The whole amount plus any options and extras. |
| `fixed` | A fixed amount. |
| `percent` | A percentage of the base price. |

#### Checkout form mappings

Resrv picks the checkout form for a reservation in this order of precedence:

1. **Entry mapping**: a form mapped to that specific entry.
2. **Collection mapping**: a form mapped to the entry's collection.
3. **Default checkout form**: the fallback used when nothing else matches.

You can configure all three from this tab. Developers who prefer to define the mapping in code rather than the Control Panel can set the nested `checkout_forms` array in `config/resrv-config.php` instead, see [Developer config](#developer-config). The deeper walkthrough lives on the [Checkout](./checkout) page.

### Emails

Resrv sends event-based emails (customer confirmation, admin notification, refund, and abandoned-reservation recovery), and you can customise them per event or per checkout form from this tab.

- **Global email event settings**: add a row per event to set recipient sources (customer, admins, affiliate), extra email addresses, the From address/name, subject, and template.
- **Per-form email event overrides**: override a specific event for a specific checkout form (form overrides win over global, which win over the built-in defaults).
- **Abandoned reservation emails**: enable recovery emails for customers who started but did not complete a reservation, and set how many days to wait after the reservation expires.

This tab is described in full on the [Emails](./emails) page, including recipient resolution and the template picker. Do not duplicate it here.

| Field | Default | Description |
|---|---|---|
| Enable abandoned reservation emails | `false` | When enabled, the `resrv:send-abandoned-emails` command sends recovery emails to customers with expired reservations. |
| Delay (in days) | `1` | Days after a reservation expires before the recovery email is sent (`1` = next day). |

::: tip Choosing a template
The email **Template** field is a dropdown that auto-populates from the available templates. To add a custom one, publish the email views (`--tag=resrv-emails`) and drop a Blade file into `resources/views/vendor/statamic-resrv/email/reservations/`; it then appears in the dropdown. See [Emails](./emails).
:::

### Currency

Sets the currency used site-wide.

| Field | Default | Description |
|---|---|---|
| Currency name | `Euro` | Display name of the currency. |
| Currency ISO code | `EUR` | ISO currency code. |
| Currency symbol | `€` | Symbol shown in prices. |
| Currency delimiter | `,` | Thousands/decimal delimiter. |

## Developer config

The following developer-only keys live in `config/resrv-config.php`. Publish the file with:

```bash
php artisan vendor:publish --tag=resrv-config
```

| Key | Description |
|---|---|
| `payment_gateway` | The single payment gateway class. Defaults to `StripePaymentGateway`. See [Payment gateways](./payment-gateways). |
| `payment_gateways` | Optional array of multiple gateways the customer can choose between at checkout. See [Payment gateways](./payment-gateways). |
| `stripe_secret_key` | Stripe secret key (`RESRV_STRIPE_SECRET` env). See [Stripe](./stripe). |
| `stripe_publishable_key` | Stripe publishable key (`RESRV_STRIPE_PUBLISHABLE` env). |
| `stripe_webhook_secret` | Stripe webhook signing secret (`RESRV_STRIPE_WEBHOOK_SECRET` env). |
| `checkout_forms` | Nested `default` / `collections` / `entries` override of the CP checkout-form mappings. |
| `reservation_emails` | Nested `global` / `forms` override of the CP email settings. |

::: warning Nested overrides win
The nested `checkout_forms` and `reservation_emails` arrays **take precedence over** their flat CP counterparts when set. Use them only if you want to define the mapping in code rather than the Control Panel, and do not mix nested config with the equivalent CP settings for the same key.
:::

These are the only keys this file should contain. Defining a CP-managed key (business info, engine, currency, etc.) here has **no effect** once a value exists in the Control Panel: the CP value silently wins.

## Migrating from a published config

If you are upgrading from v5, your CP-managed settings still live in `config/resrv-config.php`. Move them into the Control Panel with:

```bash
php please resrv:settings:migrate
```

Add `--dry-run` to preview the changes without saving anything:

```bash
php please resrv:settings:migrate --dry-run
```

The command:

- **Seeds** the CP-managed keys from your published config into the CP settings store. It **skips** any key that already has a CP value (your saved value always wins), is `null`, or still equals the blueprint default.
- **Reports conflicts** where the file and the CP store disagree (the CP value stays active; the file value is shown for review).
- **Lists keys you can delete** from `config/resrv-config.php`: both the now-CP-managed keys and any **stale keys** that v6 no longer uses (such as `enable_advanced_availability`, `enable_connected_availabilities`, and `form_name`).
- **Reminds you which developer keys to keep** in the file.

When you upgrade to `6.0.0`, Resrv runs this migration automatically once. The manual command is for re-running it, previewing with `--dry-run`, or installs where the automatic step did not fire.

::: warning Published config file detected
While `config/resrv-config.php` still defines CP-managed keys, a warning section titled **"⚠ Published config file detected"** appears at the top of the **General** settings tab, listing the affected keys. The CP values override the file at runtime. Remove those keys from the file (or run `resrv:settings:migrate`) and the banner disappears.
:::

## Removed in v6

These v5 config keys no longer do anything and are reported as stale keys by `resrv:settings:migrate`:

- `enable_advanced_availability`: replaced by the collection-scoped [Rates](./rates) system.
- `enable_connected_availabilities`: connected availabilities were removed; use [Rates](./rates) instead.
- `form_name`: replaced by the [checkout form mappings](#checkout-form-mappings) (default / collection / entry).
