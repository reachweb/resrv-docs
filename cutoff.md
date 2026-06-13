# Cutoff Rules

Cutoff rules let you stop accepting bookings a set number of hours before a reservation's starting time. This is useful for tours, activities, and appointments where staff need lead time to prepare: for example, "no bookings within 3 hours of a 16:00 start."

## Enabling the Feature

Cutoff rules are off by default. Enable them globally in the Control Panel under **Resrv → Settings → Engine settings** by turning on **Enable cutoff rules**.

This sets the `enable_cutoff_rules` config key (default `false`). While it is off, the cutoff field is inert: the [Resrv Cutoff](#the-resrv-cutoff-field) field augments to `false` on the frontend and no validation runs, even if you have rules configured on an entry.

::: tip
The global toggle is the master switch. You configure the actual rules per entry using the blueprint field below.
:::

## The Resrv Cutoff Field

Once the feature is enabled, add a **Resrv Cutoff** field to your Blueprint to configure cutoff rules on each entry.

<Image src="./img/resrv-cutoff-field.webp" alt="The Resrv Cutoff field configured on an entry." />

The field exposes the following settings:

| Setting | Type | Default | Description |
| ------- | ---- | ------- | ----------- |
| Enable cutoff | Toggle | `false` | Turns cutoff rules on for this specific entry. |
| Default Starting Time | Time | `16:00` | The time the activity or service typically starts. |
| Default Cutoff Hours | Integer | `3` | How many hours before the starting time bookings stop being accepted (min `0`, max `240`). |
| Schedules | Repeatable | None | Optional per-date-range overrides (see below). |

If no schedules are configured, the default starting time and default cutoff hours apply to every date.

### Schedules

Schedules let you override the defaults for specific date ranges: for example a later starting time during summer. Each schedule row has:

| Setting | Type | Description |
| ------- | ---- | ----------- |
| Date Range | Range | The date span this schedule applies to. |
| Starting Time | Time | Overrides the default starting time for these dates. |
| Cutoff Hours | Integer | Overrides the default cutoff hours for these dates (min `0`, max `240`). |

When a requested date falls inside a schedule's range, that schedule's starting time and cutoff hours are used. If the date matches no schedule, the field falls back to the default starting time and cutoff hours.

::: info
Cutoff rules are stored per entry, even when the Resrv Cutoff field lives on a Collection blueprint. On a Collection blueprint the field reminds you that each entry stores its own values.
:::

## How It Works

When a visitor searches, Resrv resolves the schedule that applies to their requested start date, builds the start datetime, and subtracts the cutoff hours to get the cutoff moment. If the current time is past that moment, the booking is blocked.

For example, with a `16:00` starting time and `3` cutoff hours, the cutoff is `13:00` on the start date. Once the current time passes `13:00`, that date can no longer be booked.

Cutoff times are evaluated in your application's timezone, taken from `config('app.timezone')`.

Validation runs automatically inside the availability components: [Availability Results](./availability-results), the multiple-results flow, and the [Availability Collection](./availability-search-multiple#the-availability-collection-component) component. When a date is past its cutoff, Resrv surfaces an error message:

> Reservations are allowed at least :hours hours before the starting time (:time). Please select a date from tomorrow onwards.

The `:hours` and `:time` placeholders are filled from the matching schedule. You can customise this message via the `cutoffTimeExceeded` translation key. See [Languages](./languages).

## Displaying the Cutoff Error in Custom Views

The cutoff error is added to the `cutoff` error bag, separate from the standard `availability` error. The stock `availability-results.blade.php` (and the multi-results view) already render it, with a `youAreTooLate` heading above the error message:

```blade
@if ($errors->has('cutoff') && $data->hasDates())
    <div class="flex flex-col py-4">
        <dt class="text-lg font-medium">{{ trans('statamic-resrv::frontend.youAreTooLate') }}</dt>
        <dd class="mb-1 text-gray-500">{{ $errors->first('cutoff') }}</dd>
    </div>
@endif
```

::: warning OVERRIDING STOCK VIEWS
If you have published and customised `availability-results.blade.php`, make sure you keep this block. Without it, dates past their cutoff are silently blocked with no message shown to the visitor.
:::

## The `resrv:cutoff` Antlers Tag

Use the <code v-pre>{{ resrv:cutoff }}</code> tag to read an entry's resolved cutoff information for a given date, handy for showing a "last booking time" badge on a listing or detail page.

```antlers
{{ resrv:cutoff }}
    {{ if has_cutoff_rules }}
        Last booking by {{ cutoff_time }}
    {{ /if }}
{{ /resrv:cutoff }}
```

The tag accepts two optional parameters:

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| `entry` | The current entry's `id` from context | The Statamic entry ID to look up. |
| `date` | Today's date (`Y-m-d`) | The reservation date to resolve the schedule against. |

```antlers
{{ resrv:cutoff entry="{id}" date="2026-07-01" }}
    ...
{{ /resrv:cutoff }}
```

It exposes the following variables:

| Variable | Type | Description |
| -------- | ---- | ----------- |
| `has_cutoff_rules` | Boolean | Whether a cutoff schedule applies for this entry and date. |
| `starting_time` | String | The resolved starting time (e.g. `16:00`). `null` when no rules apply. |
| `cutoff_time` | String | The cutoff time in `H:i` format (starting time minus cutoff hours). |
| `cutoff_datetime` | String | The full cutoff datetime as an ISO 8601 string. |
| `cutoff_hours` | Integer | The number of cutoff hours used for this date. |
| `schedule_name` | String | The name of the matched schedule, or `Default Schedule` when the defaults are used. |
| `is_past_cutoff` | Boolean | Whether the current time is already past the cutoff. |

When the feature is disabled, no entry has cutoff rules configured, or no schedule matches the date, `has_cutoff_rules` is `false` and the time fields are `null`.

## Related

- [Availability](./availability): set up the availability your cutoff rules apply to.
- [Availability Results](./availability-results): where cutoff errors are displayed.
- [Languages](./languages): translate the cutoff error message.
- [Configuration](./configuration): the Engine settings that hold the global toggle.
