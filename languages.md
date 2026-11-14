# Languages

Most of the texts in Resrv are read from the addon's language file. This page explains how to change them or add new translations.

## Publishing the language file

If you didn't publish them during installation, you first need to publish the language files:

```bash
php artisan vendor:publish --tag=resrv-language
```

You should now see the language file in `lang/vendor/statamic-resrv/en/frontend.php`.

You can edit this file in order the change the wording used in most areas of Resrv's frontend.

## Adding new translations

When using multisite, you can simply create a new folder with the handle of your other sites in `lang/vendor/statamic-resrv/`. Then, simply copy frontend.php to the new folder and translate the strings.

## Updated keys in v6 <Badge type="tip" text="NEW" />

::: warning RE-PUBLISH OR MERGE
v6 changes the wording of several keys and adds new ones. If you already translated `frontend.php` in v5, the new keys won't exist in your published copy. Re-publish the file (and re-apply your translations) or merge the new keys into your existing file.
:::

### "Property" keys now read "Rate"

The v5 "advanced availability" feature has been replaced by the collection-scoped [Rates](./rates) system. The existing `property`-themed keys were kept for backward compatibility, but their English values now read "rate":

| Key | v5 value | v6 value |
| --- | --- | --- |
| `selectProperty` | Select property | Select rate |
| `property` | Property | Rate |
| `multipleAvailable` | Multiple properties available. | Multiple rates available. |
| `pleaseSelectProperty` | Please select a property… | Please select a rate from the search form to check prices and continue. |
| `pleaseSelectPropertyToBook` | Please select a property to book | Please select a rate to book |

Because the old keys still exist, a v5 translation file keeps working, but the rate selector now reads the new `selectRate` key (and the cart results read `pleaseSelectRateToBook`), so update the new keys below to translate the rate UI.

### New rate keys

| Key | Default value |
| --- | --- |
| `selectRate` | Select rate |
| `multipleRatesAvailable` | Multiple rates available. |
| `pleaseSelectRate` | Please select a rate from the search form to check prices and continue. |
| `pleaseSelectRateToBook` | Please select a rate to book |

### Cancellation policy keys

Used by the [cancellation policy](./rates#cancellation-policy) label rendered on availability results, the checkout sidebar, reservation details and the confirmation email.

| Key | Default value |
| --- | --- |
| `cancellationPolicy` | Cancellation policy |
| `nonRefundable` | Non-refundable |
| `freeCancellationUntilDate` | Free cancellation until :date |

The `:date` placeholder is replaced with the resolved free-cancellation date.

### Cart keys

Used by the [cart booking](./cart-booking) flow when booking multiple items in one go.

| Key | Default value |
| --- | --- |
| `addToBooking` | Add to booking |
| `yourBooking` | Your booking |
| `clear` | Clear |

### Payment page keys <Badge type="tip" text="NEW" />

From v6.5.0, `frontend.php` has 23 new keys for the [payment page](./payment-page), the page customers open from the payment request email of a [manual reservation](./manual-reservations). If you published or translated `frontend.php` before v6.5.0, your copies don't have these keys: add them to every locale folder you created in `lang/vendor/statamic-resrv/`. Only English ships with Resrv, and keys missing from your translations fall back to English, so the payment page shows English text until you translate them.

| Key | Default value |
| --- | --- |
| `completeYourPayment` | Complete your payment |
| `paymentHeadingInstructions` | How to pay |
| `paymentHeadingProcessing` | Payment processing |
| `paymentHeadingConfirmed` | Reservation confirmed |
| `paymentHeadingExpired` | Payment link expired |
| `paymentHeadingUnavailable` | Reservation unavailable |
| `amountToPay` | Amount to pay |
| `paymentDeadline` | Payment deadline (defined, but not currently used by the page) |
| `paymentDueBy` | Please pay by :date |
| `paymentDueByArrival` | Please pay by the end of your arrival day: :date |
| `remainingBalance` | Remaining balance |
| `remainingBalanceNote` | Not included in this payment. |
| `paymentMethodIs` | Payment method: :method |
| `contactPhone` | Phone |
| `paymentLinkFailed` | We couldn't open your reservation from that link. Please check the link in your email or contact us for assistance. |
| `paymentLinkExpired` | This payment link has expired. Please contact us to arrange your booking. |
| `paymentArrivalPassed` | The arrival date for this reservation has passed, so it can no longer be paid online. Please contact us to arrange your booking. |
| `paymentAlreadyCompleted` | This reservation has already been paid and confirmed. Thank you! |
| `paymentProcessing` | Your payment is being processed. You will receive a confirmation email as soon as it completes. |
| `paymentUnavailable` | This reservation is no longer available for payment. Please contact us for assistance. |
| `paymentOfflineInstructions` | Please include your booking reference :reference with your payment. We will confirm your reservation as soon as the payment arrives. |
| `paymentOfflineNoInstructions` | This reservation is not paid online: payment is arranged directly with us. Please contact us for the payment details and quote your booking reference :reference. We will confirm your reservation as soon as the payment arrives. |
| `paymentMountFailed` | We could not start the payment process. Please try again or contact us for assistance. |

Keep the `:date`, `:method` and `:reference` placeholders in your translations: Resrv replaces them with the payment deadline, the payment method's label and the booking reference. The page also reuses existing keys you may have translated already: `pay`, `bookingReference`, `emailAddress`, `reservationPeriod`, `to`, `extras`, `options`, `total`, `paymentSurcharge` and `reservationItemUnavailable`.

::: info EMAIL AND CONTROL PANEL TEXT
Most email and Control Panel text isn't in `frontend.php`. Those sentences go through Laravel's `__()` helper, so you translate them with JSON files such as `lang/el.json`. v6.5.0 adds new email and Control Panel sentences for manual reservations; if you translate Resrv this way, add them to your JSON files.
:::
