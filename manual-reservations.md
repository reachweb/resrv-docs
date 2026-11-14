# Manual Reservations <Badge type="tip" text="NEW" />

Manual reservations let you create a booking for a customer straight from the Control Panel, for example one taken by phone, by email or at your front desk. Resrv prices it with the same rules as your checkout, holds the availability, and emails the customer a secure link to a [payment page](./payment-page) where they pay without logging in or re-entering their details. You can also give the booking a payment deadline, after which it cancels itself if it is still unpaid.

Any Control Panel user with the existing **Use Statamic Resrv** permission can create manual reservations, mark them as paid, send payment requests, extend their holds and cancel them. There is no separate permission and no feature toggle: the **Create reservation** button is always available. In this page, we'll go over the setup, the create page, and how to follow a reservation until it is paid or cancelled.

::: info NEW IN v6.5
Manual reservations are new in v6.5. If you are upgrading an existing site, run the migrations and update any custom payment gateways first, as described in [Upgrading](./upgrading#upgrading-to-v6-5-0).
:::

## When to use manual reservations

Use a manual reservation whenever a booking doesn't come through your website's checkout:

- A customer books by phone or email and pays online later, through the payment link you send them.
- A customer pays by bank transfer or on arrival, and you confirm the booking once the money arrives.
- You need something checkout can't do: a custom price, a deposit of your choice, or a booking on dates that are already full.
- A complimentary booking that collects nothing. It is confirmed immediately.

## Online and offline payment methods

A manual reservation that collects money is tied to one of your configured [payment gateways](./payment-gateways), which you choose when you create it. Resrv handles them in two groups:

| | Online methods (e.g. Stripe) | Offline methods (e.g. the [Offline gateway](./payment-gateways#the-offline-gateway)) |
| --- | --- | --- |
| How the customer pays | On your payment page, through the link in the payment request email. | Outside Resrv, following your **Offline Payment Instructions** (for example a bank transfer). |
| How the booking is confirmed | Automatically, by the gateway's webhook. | By you, with **Mark as paid**. |
| What you need | A **Payment Page Entry**, and a gateway that confirms payments through webhooks. | A manual-confirmation gateway (e.g. Offline) registered in `payment_gateways`. No payment page needed. |

Offline methods are the gateways that support manual confirmation. A default install only has Stripe, so register the [Offline gateway](./payment-gateways#the-offline-gateway) yourself if you need one. Online payments are confirmed **only** by the gateway's webhook, so make sure it is set up (see [Webhook routes](./payment-gateways#webhook-routes) and, for Stripe, [Setup the webhook](./stripe#setup-the-webhook)). Without a working webhook, a reservation paid by card stays **Awaiting payment**. For how each kind of gateway behaves with manual reservations, see [Gateways for manual reservations](./payment-gateways#gateways-for-manual-reservations).

::: warning GATEWAYS ARE SHARED WITH CHECKOUT
Every gateway in `payment_gateways` is offered both at checkout (within its [amount limits](./payment-gateways#amount-limits)) and on the **Create reservation** page. There is no manual-only option. Adding the Offline gateway for manual bookings also lets website customers choose it at checkout, where it confirms the booking immediately without payment.
:::

## Before you start

1. **Set up the payment page** if customers will pay online. Create a published, non-private entry whose template renders the `reservation-payment` Livewire component, and select it under **Resrv → Settings → Checkout → Manual reservations → Payment Page Entry**. The [Payment page](./payment-page#setting-up-the-page) guide covers the template and the assets its layout needs. Without a usable entry, online payment methods are disabled on the create page. Offline methods still work.
2. **Register an offline payment method** if customers will pay by bank transfer or on arrival. The default config only has Stripe, so add the Offline gateway (or another gateway whose `supportsManualConfirmation()` returns `true`) under `payment_gateways` in `config/resrv-config.php`. See [The Offline gateway](./payment-gateways#the-offline-gateway), and note that it is offered at checkout too.
3. **Optionally add Offline Payment Instructions** in the same settings section as the payment page, for example your bank details. They appear as plain text, with line breaks kept, on the payment page and in the payment request email of reservations that use an offline method. Leave the field empty and customers are told that payment is arranged directly with you and to quote their booking reference.
4. **Schedule the lapsed-hold sweep** if you will give reservations a payment deadline. See [The lapsed-hold sweep](#the-lapsed-hold-sweep).
5. **Use a cache store that supports locks.** The payment page serializes payment attempts with `Cache::lock()`. The `file`, `database`, `redis`, `memcached`, `dynamodb` and `array` stores support locks; `apc` doesn't, and on it every online payment fails with "We could not start the payment process. Please try again or contact us for assistance." If you run more than one app server, use a shared store (`redis`, `database` or `memcached`). See [Cache store with lock support](./configuration#cache-store-with-lock-support).
6. **Update your payment gateways for v6.5.** Custom gateways, and the Mollie (`reachweb/resrv-payment-mollie`) or PayPal (`reachweb/resrv-payment-paypal`) add-ons, must support the v6.5 payment interface. See [Writing a custom payment gateway](./custom-payment-gateway) and the add-on note in [Upgrading](./upgrading#_1-update-custom-payment-gateways-first).

<Image src="./img/resrv-settings-manual-reservations.webp" alt="The Manual reservations settings: the payment page entry, and the instructions shown to customers who pay with an offline method." />

Both settings are optional and have no default. See [Configuration](./configuration#checkout) for the rest of the Checkout tab.

## Creating a reservation

Click **Create reservation** at the top of the Reservations listing. The form sits on the left and a sticky **Summary** on the right. The form grows as you fill it in: choose an entry and dates first, and the other sections follow.

Every change re-prices the booking on the server, using the same pricing code as checkout. While a new price is being calculated, the panels show "Updating" and the Summary dims the old figures. If the figures no longer match the form, for example because the price couldn't be calculated, the Summary marks them **Out of date**.

<Image src="./img/resrv-manual-create.webp" alt="The Create reservation page with the booking, extras and options, and customer details filled in, next to a Summary that itemises the price." />

### Booking

- **Entry**: search for the entry to book. Only entries with reservations enabled are listed, grouped by collection (each option shows its collection when the entries span more than one).
- **Dates**: the calendar starts at today plus your **Minimum days before** setting, and the stay must fit your minimum and maximum reservation period. When **Maximum reservation period (in days)** is `1`, you pick a single **Date** instead.
- **Quantity**: shown only when **Maximum quantity** is above 1.
- **Rate**: the entry's published [rates](./rates), defaulting to the first one. The rate's own [restrictions](./rates#restrictions) still apply. Dates the rate doesn't allow (outside its date window, stay limits or booking lead time) show as **Not available**, even when stock is free, so choose another rate. If you use **Overbook anyway** instead, creating the reservation is refused with "The selected rate does not allow these dates."

Every night of the stay needs availability and a price on the entry. If one is missing, the dates field says so and links to the entry so you can check its availability calendar.

### Availability and overbooking

Once the dates are set, the **Booking** header and the Summary show an availability badge: the number available, **Not available**, **Will overbook**, or **Availability not decreased** when you have turned off **Decrease availability**.

When there isn't enough stock, an alert reads "Not enough availability for these dates: 0 available, 1 requested." next to an **Overbook anyway** button. Clicking it turns off **Decrease availability** (under **Advanced**), and the alert turns into a warning that the reservation will overbook. Click **Undo** to switch back.

<Image src="./img/resrv-manual-overbook.webp" alt="When there isn't enough availability, the Booking panel shows a Not available badge and an Overbook anyway button." />

Overbooking skips only the stock check (and a shared rate's **Max available** cap). The entry must still have reservations enabled, every night still needs a price, and the rate must be published and allow the dates. An overbooked reservation is view-only: it never takes stock and never gives any back. See [Overbooking and view-only reservations](#overbooking-and-view-only-reservations).

### Extras and options

The **Extras & options** section appears once the dates are set, if the entry has any. Extras and option values are priced for the selected stay, as at checkout.

- **Extras**: use the − and + buttons to set a quantity. An extra that doesn't allow multiples is capped at 1, and the others at their maximum, if they have one. Extras priced from a checkout-form field are re-priced as you fill in the customer details.
- **Required extras**: extras that the entry's [extra conditions](./extras#conditions) make required get a **Required** badge and the reason, for example "Required for these dates" or "Required because … is selected".
- **Options**: one select per option. A required option must have a value. Optional ones can stay at **None**.

You can't create the reservation until every required extra and option is chosen. The Summary tells you what is missing ("Add the required extras: …" / "Select a value for: …"), and the server checks the same rules.

### Customer details

The **Customer** section renders the entry's own checkout form, chosen the same way as at checkout (see [Choosing the checkout form](./checkout#choosing-the-checkout-form)), with its field widths, instructions and validation rules. The customer's email address is always required, since that is where the payment request goes.

- Confirmation fields, such as a repeated email address, copy their source automatically until you edit them ("Copied from … automatically.").
- If you switch to another entry, the values you typed carry over to the fields the new form also has.
- Supported field types are text, textarea, select, checkboxes, radio, toggle, integer and dictionary. Hidden fields are not shown.

### Pricing

The Summary itemises the **Base price**, any dynamic pricing discount or surcharge, **Extras**, **Options** and the **Total**. [Dynamic pricing](./dynamic-pricing) applies as it does at checkout.

There is no coupon field, and a coupon applied in your own browser session is ignored, so dynamic pricing that needs a coupon doesn't apply. To charge a different price, use **Override total** under [Advanced](#advanced).

### Amount to request

**Amount to request** sets how much the customer is asked to pay now:

- **Checkout amount**: what online checkout would charge for this booking, following your **Payment type** setting. If free cancellation is no longer possible (a non-refundable rate, or **Require full payment if free cancellation has passed** applies), it is the full total, as at checkout. Unlike checkout, it never exceeds the total.
- **Full amount**: the whole total.
- **Custom amount**: a deposit or partial payment you choose. It must be more than zero and no more than the total. To request more, raise the total with **Override total**.

When checkout would charge the whole total anyway, the first two choices merge into a single **Full amount**. Whatever you don't request appears in the Summary as **Balance not collected now**, and the customer sees it as not included in this payment.

If there is nothing to request (a free or complimentary booking), the section shows "This booking collects no payment, so it will be confirmed immediately. No payment method is needed." and hides the payment method and hold fields.

To make a priced booking complimentary, open [Advanced](#advanced), turn on **Override total** and enter `0`. This only works when no priced extras or options are selected, because the total can't be lower than the extras and options together. **Custom amount** can't be used for this, since it must be more than zero.

<Image src="./img/resrv-manual-create-payment.webp" alt="The Payment section: the amount to request, the payment method, the payment request email switch and a seven-day hold with its deadline preview." />

### Payment method

Choose how the customer pays. Each method explains itself: offline methods read "Customer pays outside Resrv (e.g. bank transfer); you mark the reservation as paid." and online methods "Customer pays online through the payment link; the reservation confirms automatically." The method **can't be changed** after the reservation is created.

Methods that can't be used for this booking stay in the list but are disabled, with the reason:

- the method can confirm neither through webhooks nor manually, so it can't collect a payment;
- it is an online method and no payment page entry is configured;
- the amount is outside the method's [amount limits](./payment-gateways#amount-limits).

A gateway [surcharge](./payment-gateways#surcharges) is calculated on the requested amount, and the Summary then adds **Payment surcharge** and **Customer pays** rows.

### Emailing the customer

**Send payment request email** is on by default. Creating the reservation then emails the customer the amount due and how to pay it: a **Pay now** button for online methods, or your instructions for offline ones. Turn it off to create the reservation without emailing, for example when you'll share the link yourself. You can send the request later from the reservation.

When the booking collects nothing, the switch becomes **Send confirmation email** and controls only the customer's confirmation. Your admins are notified either way.

### Hold for a limited time

Turn on **Hold for a limited time** to cancel the reservation automatically if it is still unpaid after a number of days. Enter the days in **Hold for** (1 to 365, default 3). The field previews the deadline ("If it is still unpaid, it will be cancelled automatically around …"), which counts from the moment you create the reservation.

If the hold would end after the arrival day, a warning suggests a shorter one: customers can't pay online once the arrival day has passed. See [Payment deadlines](#payment-deadlines).

Without a hold, the reservation has no deadline and stays **Awaiting payment** until it is paid or you cancel it. The automatic cancellation needs the scheduled [lapsed-hold sweep](#the-lapsed-hold-sweep).

### Advanced

The **Advanced** section is collapsed by default. Badges in its header show when one of its settings is active.

- **Override total**: replace the computed total with a **New reservation total**. The difference is applied to the base price, so extras and options keep their prices, and the new total can't be lower than the extras and options together. Dynamic pricing isn't recorded on an overridden booking. The Summary shows a **Manual adjustment** row, an **Overridden** badge and the computed total struck through, and **Checkout amount** applies your checkout payment rule to the overridden price.
- **Decrease availability**: on by default. Turn it off to create a view-only reservation that doesn't take stock. **Overbook anyway** turns it off for you.
- **Affiliate**: credit the reservation to one of your published [affiliates](./affiliates). The commission is calculated as at checkout. Shown only when **Enable affiliates** is on and published affiliates exist.

### The Summary and the Create button

Below the price breakdown, the Summary shows **Requested now**, any **Payment surcharge** and **Customer pays**, the **Balance not collected now**, the **Payment method** and, with a hold, **Auto-cancels if unpaid**. Above the button, a sentence spells out what will happen, for example "The reservation waits for payment, and the customer is emailed a request to pay €135.00."

The button, repeated in the page header, is labelled after what it will do:

| Button | When |
| --- | --- |
| **Create and send payment request** | The booking collects a payment and the email switch is on. |
| **Create without emailing** | The booking collects a payment and the email switch is off. |
| **Create and confirm** | The booking collects nothing. |

While something is missing, the button is disabled and a hint says what to fix, such as "Choose the dates.", "Select a payment method." or "Not enough availability. Use "Overbook anyway" to create it without decreasing availability."

After creating, you land on the new reservation's page. If the payment request couldn't be emailed (for example because the email event is disabled), a message says so, and you can send it from the reservation once the cause is fixed (for example, after enabling the **Customer payment request** event).

### Safe submits

The create page protects you from the usual ways a manual booking goes wrong:

- **Changed prices.** Resrv recalculates everything when you click create. If the total or the amount to request differs from what the page showed (another admin edited a price, a dynamic pricing rule expired, the free cancellation window closed at midnight), nothing is created and the page explains, for example "The total changed from … to … since it was shown. Review the updated figures, then create again."
- **Double submits.** A double click or a retry never books twice. If an earlier attempt already created the reservation, you're told so and taken to it. If you changed the form since then, you can **Open the existing reservation** or **Create a separate reservation**.
- **Lost connections.** If the server doesn't confirm the submit, the page says the reservation may have been created. Check the list before trying again: creating again from the same page won't book it twice.
- **Errors** appear under the field they belong to. An error inside the collapsed **Advanced** section opens it.
- **Unsaved changes.** Once you have chosen an entry, leaving the page asks for confirmation.

## What happens when you create it

The outcome depends on the amount you request.

**It collects a payment.** The reservation is created as **Awaiting payment**. It takes the booked stock (unless it is view-only), so the dates can't be sold twice. If you left the email switch on, the customer receives the payment request. No confirmation emails go out yet: they follow when the reservation is paid.

**It collects nothing.** The reservation is confirmed straight away, with no payment method and no hold. The customer receives the usual confirmation email (if **Send confirmation email** was on), and your admins the usual new reservation email.

Either way, the reservation page shows who created it under **Created by**.

## The Awaiting payment status

**Awaiting payment** (`awaiting_payment`) is the status of a manual reservation that is waiting for its payment.

- It holds availability like a confirmed booking, unless it is view-only.
- It is not a checkout: **Minutes to hold** doesn't apply, it never becomes **Expired**, it gets no abandoned-reservation emails, and housekeeping never purges it.
- It leaves this status in only two ways: paid, it becomes **Confirmed** (through the gateway webhook or **Mark as paid**); cancelled, it becomes **Cancelled** (by you or by the lapsed-hold sweep).
- It can't be refunded, because nothing has been collected. Cancel it instead.

The Reservations listing shows awaiting-payment reservations by default: the status filter now defaults to **Confirmed**, **Partner** and **Awaiting payment**.

## Managing awaiting-payment reservations

### In the reservations list

Awaiting-payment rows have their own status badge, and their amount is marked "(unpaid)". Once the customer can no longer pay through the link, a red **Hold expired** or **Arrival date passed** badge appears under the status (see [Overdue reservations](#overdue-reservations)).

The row menu offers:

- **Mark as paid…** for offline methods, or **Mark as paid manually…** for online methods.
- **Send payment request**, or **Resend payment request** once one was sent. Hidden once the payment window has closed.
- **Copy payment link**, when a link exists and the payment window is open.
- **Extend hold…**, hidden once the arrival day has passed.
- **Cancel reservation**.

**Refund** and **Resend confirmation email** aren't offered for awaiting-payment rows.

<Image src="./img/resrv-manual-listing.webp" alt="Awaiting-payment reservations in the listing, with their unpaid amounts and the row menu open." />

### On the reservation page

An awaiting-payment reservation's page has:

- A header with the status badge (and the overdue badge, if any), a primary action button, and a **More actions** menu with the other actions and **Cancel reservation**.
- **Created by** and **Decreases availability** in the Reservation Details.
- An **Awaiting payment** section: a sentence saying who is paying what and by which method, when the payment request was emailed, and the deadline, for example "Cancels automatically if not paid by … (in 7 days)." or "No payment deadline: the reservation stays on hold until you mark it as paid or cancel it." Below it are **Amount requested**, **Balance not requested**, **Payment method**, **Hold deadline**, **Payment request emailed** and the **Payment link**.

The primary button follows the payment method: **Mark as paid** for offline methods, and **Send payment request** (or **Resend payment request**) for online methods, since the customer is expected to pay through the link. Once the hold has expired it becomes **Extend hold**, and once the arrival date has passed, **Mark as paid**.

<Image src="./img/resrv-manual-show-awaiting.webp" alt="A reservation awaiting payment, with its deadline, the amount requested and the customer's payment link." />

### Mark as paid

Use **Mark as paid** when the customer has paid you outside Resrv: a bank transfer arrived, or they paid at your desk. The dialog summarises the reservation and asks you to confirm, for example "Record €135.00 as received and confirm the reservation?". When you confirm:

- the reservation becomes **Confirmed**, and the requested amount, plus any payment surcharge, is recorded as received;
- the customer receives the confirmation email, and your admins the usual new reservation email. Where these emails list the amount paid, the row reads "Amount already paid" instead of "Already paid by credit card";
- the payment link stops accepting payments.

On a reservation with an online method, the action reads **Mark as paid manually…** and the dialog warns: "Only do this if the customer paid you another way. The payment link will stop accepting payments, and any online payment the customer started will be cancelled." If the customer had in fact already paid online, Resrv keeps that payment and alerts your admins about a possible duplicate (see [Refunds and reconciliation](#refunds-and-reconciliation)).

You can mark a reservation as paid at any time while it is awaiting payment, even after its deadline or arrival date has passed.

### Send or resend the payment request

**Send payment request** emails the payment request to the customer. A confirmation dialog shows the address it will go to. Once a request has been sent, the action reads **Resend payment request**, and the email opens with "Here is the payment link for your reservation again." (or "Here are the payment details for your reservation again." for offline methods). Every successful send is recorded under **Payment request emailed**.

Resrv refuses to send the request when:

- the payment window has closed (the hold deadline or the arrival date has passed);
- the customer has no valid email address;
- the **Customer payment request** email event is disabled in your email settings. Unlike **Resend confirmation email**, this action respects that switch;
- the reservation uses an online method and the payment page entry isn't configured or published, or its payment method is no longer configured;
- the email couldn't be sent, in which case you are asked to check your mail settings.

Offline methods don't need a payment page: their email carries your instructions instead of a link.

### Copy the payment link

To share the link another way, such as a chat message, copy it from the **Payment link** field on the reservation page, or use **Copy payment link** in the listing. The link opens the payment page without a login, so share it only with the customer. Details on how it is secured are on the [Payment page](./payment-page#the-payment-link).

A link exists only while the reservation is awaiting payment, a usable payment page entry is configured, and the customer has an email address. Once the payment window closes, the field reads "The payment link no longer accepts payments." A link the customer already has keeps opening the page, which then explains the reservation's current state (see [What the customer sees](./payment-page#what-the-customer-sees)).

### Extend hold

**Extend hold…** opens the **Extend payment hold** dialog, which shows the current deadline. Enter **Hold for (days from now)** (1 to 365): the new deadline counts from now, not from the old deadline, and the dialog previews it. You can also add a deadline to a reservation that has none, or tick **Remove the deadline** to keep the reservation on hold until you mark it as paid or cancel it.

A checkbox such as **Email the payment request again with the new deadline** sends the request again. It is ticked by default only if a request was sent before. If a payment request was sent before and you set a new deadline, the email tells the customer "Your payment deadline is now …". Otherwise the customer gets the regular payment request, which shows the new "Please pay by" date when there is one.

Extending works even after the deadline has passed, as long as the sweep hasn't cancelled the reservation yet. It isn't offered once the arrival day has passed, because the customer can no longer pay online.

<Image src="./img/resrv-manual-extend-hold.webp" alt="The Extend payment hold dialog, with the new deadline preview and options to remove the deadline or email the payment request again." />

### Cancel reservation

**Cancel reservation** ends an unpaid reservation. It becomes **Cancelled**, the stock it took is released, any affiliate commission is voided, and any online payment the customer had started is cancelled with the provider.

The dialog has an **Email the customer a cancellation notice** checkbox. It is ticked by default only if a payment request was emailed, because otherwise the customer may not know about the booking. The notice tells the customer that the reservation was cancelled and that nothing was collected, so there is nothing to refund. Your admins are not emailed about cancellations you make yourself.

If the customer's online payment was already going through when you cancelled, the customer is emailed even if you unticked the box (unless the **Customer cancelled (no refund)** event is disabled), and told that the charge will be refunded. Resrv doesn't refund it automatically: see [Refunds and reconciliation](#refunds-and-reconciliation).

<Image src="./img/resrv-manual-cancel-modal.webp" alt="Cancelling an unpaid reservation releases its availability and can email the customer a cancellation notice." />

### Overdue reservations

An awaiting-payment reservation becomes overdue in two ways. The listing flags it with a red badge, and the reservation page with a warning:

- **Hold expired — will be cancelled by the next sweep**: the hold deadline has passed. The payment link no longer works and payment requests can't be sent. Extend the hold to give the customer more time, mark the reservation as paid, or cancel it now. Otherwise the sweep cancels it.
- **Arrival date passed**: the stay has started, so the customer can no longer pay through the link. Nothing cancels the reservation automatically: mark it as paid if you collected the money another way, or cancel it.

## Payment deadlines

A manual reservation can stop accepting online payment at two points:

- **The hold deadline**, if you set one. When it passes, the payment link and the send action stop working straight away, and the [lapsed-hold sweep](#the-lapsed-hold-sweep) then cancels the reservation.
- **The end of the arrival day**, always. A customer can't pay online once the arrival day has ended (in your app's time zone), even without a hold, so same-day bookings stay payable until the end of that day. Nothing cancels these reservations automatically.

Customers see a "Please pay by …" line on the payment page and in the email only when the reservation has a hold. It shows whichever cut-off comes first, either the hold deadline or "Please pay by the end of your arrival day: …". Without a hold, the arrival-day cut-off still applies but isn't announced.

An online payment the customer started before the cut-off can still complete, and the webhook then confirms the reservation.

### The lapsed-hold sweep

Resrv registers the `resrv:cancel-lapsed-holds` command but doesn't schedule it. Add it to your `routes/console.php`:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('resrv:cancel-lapsed-holds')->everyFifteenMinutes()->withoutOverlapping();
```

::: warning REQUIRES CRON
Scheduled commands only run if your server's cron runs `php artisan schedule:run` every minute. Without the sweep, lapsed holds stay **Awaiting payment**, keep their availability, and nobody is emailed. The CP keeps flagging them "Hold expired — will be cancelled by the next sweep".
:::

Each run cancels every awaiting-payment reservation whose hold deadline has passed. For each one, it:

- moves it to **Cancelled** and releases the stock it took;
- voids any affiliate commission and cancels any open online payment;
- emails the customer that their payment wasn't received ("We did not receive your payment by …, so your reservation has been cancelled and the dates have been released.") and tells your admins that the hold lapsed.

It leaves alone reservations that were paid, or whose hold was extended, at the last moment, and it never touches reservations without a hold. Every fifteen minutes is a suggestion: the payment page enforces the deadline on its own, and the schedule only decides how soon the cancellation, the stock release and the emails follow.

To see how many holds would be cancelled without changing anything, run:

```bash
php please resrv:cancel-lapsed-holds --dry-run
```

## Overbooking and view-only reservations

A reservation created with **Decrease availability** off, including through **Overbook anyway**, is view-only:

- It never takes stock, and cancelling it never gives any back.
- Availability checks ignore it, so the dates stay on sale, and it doesn't block availability edits for those dates.
- The calendar doesn't show it while it is awaiting payment. Once confirmed, it appears like any other booking.
- The reservation page shows **Decreases availability: No**, and the cancel dialog says it never took inventory.

Use it to record a booking that doesn't use your Resrv stock, or to overbook knowingly. If the booking does use up a unit, lower the availability yourself.

## Calendar, reports and activity log

### Calendar

The [Reservations Calendar](./reservations#reservations-calendar) shows awaiting-payment reservations that took stock next to your confirmed and partner bookings, drawn with a dashed border. The legend reads "Awaiting payment (holds availability)", and hovering one shows its deadline ("Awaiting payment — cancels automatically if not paid by …" or "Awaiting payment — no payment deadline.").

<Image src="./img/resrv-manual-calendar.webp" alt="Awaiting-payment holds that take availability appear on the calendar with a dashed style, next to confirmed bookings." />

### Reports

[Reports](./reservations#reports) have an **Outstanding payments** card: the total requested from reservations in the report range that are still awaiting payment, and how many there are. It follows the report's date range and **Filter by** choice, and its amount excludes payment surcharges. **View these reservations** opens the listing filtered to them. Awaiting-payment reservations don't count as revenue until they are paid.

<Image src="./img/resrv-reports-outstanding.webp" alt="The Outstanding payments card totals what is still awaiting payment in the report range." />

### Activity log

With the [activity log](./activity-log) enabled, the stock a manual reservation takes or releases is recorded like any other booking's. Its reservation events add two reasons: **Created in the Control Panel**, and **Confirmed in the Control Panel** (when you mark it as paid, or create one that collects nothing). Cancellations, by you or by the sweep, are logged as **Reservation cancelled**, and payments through the link as **Confirmed by payment webhook**.

These entries don't record which user acted. The reservation page's **Created by** shows who created the booking.

### Export

On the [Export](./reservations#export) page you can tick **Awaiting payment** in the Status filter. It isn't selected by default. In the CSV, the status column holds the raw value `awaiting_payment`.

## Refunds and reconciliation

### Refunding a paid manual reservation

Once a manual reservation is **Confirmed**, you refund it from the listing like any other booking (see [Refunds](./reservations#refunds)):

- **Paid online through the payment link**: refunded automatically through the gateway, as for checkout bookings.
- **Marked as paid**: the money never went through a gateway, so Resrv can't return it. The reservation becomes **Refunded**, the dialog asks you to return the amount yourself, and the confirmation reads "Refund recorded — return the payment to the customer manually". The reservation page keeps a **Return the payment manually** notice, and the refund email tells the customer "Your payment of … will be returned to you separately."
- **Collected nothing**: there is nothing to refund, so the reservation is cancelled instead.

Customers can't cancel a booking you marked as paid from the [Reservation Status](./reservation-status) page: they see a "contact us" note instead. Bookings paid through the link follow the normal self-cancellation rules.

### Reconciliation alerts

An online payment can cross with one of your actions: the customer pays just as you cancel, or you mark as paid a booking the customer also paid online. Resrv doesn't lose track of that money. When money has moved, or may still move, it emails your admins a reconciliation alert with a recommended action:

- **Cancelled while a payment was going through** (by you or by the sweep): the alert reads "Captured payment on a cancelled reservation" and recommends refunding the payment in your provider's dashboard. The customer is told the charge will be refunded, but Resrv doesn't refund it automatically.
- **Marked as paid while an online payment also went through**: Resrv keeps the online payment's reference and sends a "Possible duplicate payment" alert ("The customer may have paid twice"). Check your provider and refund the duplicate.
- **Marked as paid, but the online payment couldn't be checked or cancelled**: if Resrv can't verify the customer's online payment with the provider, your admins get a "Payment intent could not be verified" alert. If it can't cancel it and the customer could still pay it, they get "Open payment intent could not be cancelled". Check the payment in your provider, and cancel it there if it is still open.

After a cancellation, by you or by the sweep, an online payment that Resrv couldn't confirm as cancelled is not emailed about straight away. Resrv flags the reservation in the Control Panel (see below) and logs a warning. Your admins are emailed only if the reservation's payment method is no longer configured ("Payment intent could not be verified"), or later, if that payment actually goes through ("Orphaned payment detected").

Reservations in these situations show a red warning icon next to their status in the listing ("The online payment needs checking in your payment provider. Open the reservation for details.") and a **Check this payment with your payment provider** alert on their page. If you later refund such a reservation from the CP, Resrv checks the kept payment first and refunds it through the gateway only if it actually went through.

## Emails

| What happens | The customer receives | Your admins receive |
| --- | --- | --- |
| Created, collecting a payment, email switch on | The payment request | Nothing |
| Created, collecting nothing | The confirmation (if the switch is on) | The new reservation email |
| **Send / Resend payment request**, or **Extend hold** with the email box ticked | The payment request | Nothing |
| Paid through the link, or marked as paid | The confirmation | The new reservation email |
| Cancelled by you | A cancellation notice, if ticked | Nothing |
| Hold lapsed (sweep) | A "payment not received" cancellation | A "payment hold lapsed" notice |
| Cancelled while an online payment was going through | A cancellation notice saying the charge will be refunded (even if you unticked the box, unless the **Customer cancelled (no refund)** event is disabled) | A reconciliation alert |

The payment request uses the new **Customer payment request** email event (`customer_payment_request`). It is enabled by default, goes to the customer, and like the other events you can change its recipients, subject and template globally or per form (see [Emails](./emails#email-events)). The event has no built-in subject, so the email goes out as "Reservation Payment Request" until you set your own. The email includes a greeting (when the checkout form has a `first_name` field), the booking reference, the amount to pay including any surcharge, the "Please pay by" line when there is a hold, the reservation details, extras and options, the remaining amount, and either a **Pay now** button with a fallback link (online methods) or your payment instructions (offline methods).

The other emails use the existing events: confirmations use **Customer confirmed** and **Admin made**, cancellation notices use **Customer cancelled (no refund)**, and the lapsed-hold admin notice uses **Admin cancelled (by customer)**. Disabling one of these events also silences the matching manual reservation email. The exact wording of each email is described in [Manual reservation emails](./emails#manual-reservation-emails).

## Limitations and FAQ

**Can one manual reservation cover several entries?** No. A manual reservation books one entry with one rate. Cart (multi-entry) bookings aren't supported, so create a separate reservation for each entry.

**Can I apply a coupon?** No. There is no coupon field and coupon-only dynamic pricing doesn't apply. Use **Override total** to give a special price.

**Can I edit a reservation after creating it?** No. Its dates, price, requested amount and payment method are fixed. Cancel it and create a new one.

**Can I change the affiliate's commission?** No. It is calculated from the affiliate's settings, as at checkout.

**Does Resrv collect the remaining balance of a deposit?** No. Resrv requests only the amount you chose. The customer sees the balance as not included in this payment, and you collect it the way you normally would.

**Can customers see an awaiting-payment reservation on the reservation status page?** No. The [Reservation Status](./reservation-status) page doesn't show awaiting-payment reservations, so the payment link is the customer's way in. Once paid, the booking shows there as **Confirmed**.

**Do I need the payment page?** Only for online payment methods. Offline methods work without it, and you confirm them with **Mark as paid**.

**What if the customer pays after the hold lapsed?** If the reservation is still awaiting payment (the sweep hasn't run yet) and the payment was started before the deadline, the webhook confirms it as usual. If the sweep has already cancelled it, your admins receive a reconciliation alert and you refund the payment in your provider's dashboard.

**Can I edit availability on dates with an unpaid reservation?** Yes, you can still set an availability count for those dates. If the reservation is later cancelled or lapses, its quantity is added back on top of the value you set, as when a confirmed booking is refunded. Deleting availability is blocked while an awaiting-payment reservation that took stock overlaps the dates, and an entry can't be deleted while it has any awaiting-payment reservation.

::: info DEVELOPER NOTE
Manual reservations use the `awaiting_payment` status (`ReservationStatus::AWAITING_PAYMENT`), which can only move to `confirmed` or `cancelled`. Confirmations from the Control Panel dispatch `ReservationConfirmed` with `ReservationConfirmed::VIA_CP` and a `$notifyCustomer` flag, which is `false` when a booking that collects nothing was created with **Send confirmation email** off. Custom listeners that email customers on `ReservationConfirmed` should honour it too. Cancellations dispatch `ReservationCancelled` with a context (`CONTEXT_UNPAID_HOLD`, `CONTEXT_HOLD_LAPSED` or `CONTEXT_PAYMENT_IN_FLIGHT`) and a `$notifyCustomer` flag that custom listeners which email customers should honour. Gateway changes are covered in [Writing a custom payment gateway](./custom-payment-gateway).
:::

## Related

- [Payment page](./payment-page): the page your customers pay on, and what they see there.
- [Reservations](./reservations): the listing, refunds, calendar, reports and export.
- [Payment gateways](./payment-gateways): surcharges, amount limits and the Offline gateway.
- [Emails](./emails): customize the payment request and the other reservation emails.
- [Upgrading](./upgrading#upgrading-to-v6-5-0): migrations and gateway updates for v6.5.
