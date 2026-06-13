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