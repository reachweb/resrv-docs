# Frontend Setup

Resrv provides a number of Laravel Livewire components that you can use to add the reservation functionality to your site. This page describes how to set up the assets and vendor files required for the components to work.

## Add Livewire styles and script tags

Even though it's not strictly necessary, it's recommended to add the Livewire styles and script tags to your site's layout file.

```antlers{10,16}
<!-- resources/views/layout.antlers.html -->
<!doctype html>
<html lang="{{ site:short_locale }}">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ title ?? site:name }}</title>
        {{ vite src="resources/js/site.js|resources/css/site.css" }}
        {{ livewire:styles }}
    </head>
    <body class="bg-gray-100 font-sans leading-normal text-gray-800">
        <div class="mx-auto px-2 lg:min-h-screen flex flex-col items-center justify-center">
            {{ template_content }}
        </div>
        {{ livewire:scripts }}
    </body>
</html>
```

## Other required assets

Besides the Livewire scripts, Resrv also requires [@reachweb/alpine-calendar](https://github.com/reachweb/alpine-calendar), an AlpineJS calendar, and [Day.js](https://day.js.org/).

AlpineJS comes with Livewire 3, so <code v-pre>{{ livewire:scripts }}</code> already loads it. The precompiled JS registers the calendar on Alpine's `alpine:init` event and exposes Day.js as `window.dayjs`.

You can install them via npm and add them to your build, but we suggest including the precompiled version that ships with Resrv in your layout file. [Installation](./installation) publishes it to `public/vendor/statamic-resrv/frontend/`.

```antlers{11,17}
<!-- resources/views/layout.antlers.html -->
<!doctype html>
<html lang="{{ site:short_locale }}">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ title ?? site:name }}</title>
        {{ vite src="resources/js/site.js|resources/css/site.css" }}        
        {{ livewire:styles }}
        <link rel="stylesheet" href="/vendor/statamic-resrv/frontend/css/resrv-frontend.css">
    </head>
    <body class="bg-gray-100 font-sans leading-normal text-gray-800">
        <div class="mx-auto px-2 lg:min-h-screen flex flex-col items-center justify-center">
            {{ template_content }}
        </div>
        <script src="/vendor/statamic-resrv/frontend/js/resrv-frontend.js"></script>
        {{ livewire:scripts }}    
    </body>
</html>
```

## Frontend styles & TailwindCSS

Resrv's Livewire components are styled using TailwindCSS. Statamic 6 ships with **Tailwind v4**, which you configure in CSS instead of a `tailwind.config.js` file.

Add an `@source` directive for Resrv's Blade views to your main CSS file, so Tailwind keeps the classes they use:

```css
@import "tailwindcss";

@source "../../vendor/reachweb/statamic-resrv/resources/views/**/*.blade.php";
```

::: tip
Adjust the `@source` path to match where your CSS file sits relative to `vendor/`.
:::

It's highly recommended to install the TailwindCSS Forms plugin, since Resrv's inputs use the `form-input`, `form-select`, `form-checkbox` and `form-radio` classes:

```bash
npm install -D @tailwindcss/forms
```

Then register it with the `@plugin` directive:

```css
@import "tailwindcss";
@plugin "@tailwindcss/forms";

@source "../../vendor/reachweb/statamic-resrv/resources/views/**/*.blade.php";
```

If you are not using TailwindCSS, it's recommended that you style the Livewire components using your own CSS. However, to help you get started, a compiled `resrv-tailwind.css` file ships in the `vendor/statamic-resrv/frontend/css` directory that you can include to get Resrv running and then customize to your liking.

::: warning
The `resrv-tailwind.css` file should only be included if you don't use TailwindCSS. Since it contains reset styles, it can clash with your site's existing styling. Use it as a starting point and then style the components yourself with your own CSS.
:::

## CSS Variables

You can style the calendar with these CSS variables. The defaults have zero specificity, so your own values always win and you don't need `!important`. The accent color for selected and active days is `--color-calendar-primary`.

### Color tokens

| Variable | Default | Purpose |
| --- | --- | --- |
| `--color-calendar-bg` | `#fff` | Calendar background |
| `--color-calendar-text` | `oklch(21% .034 264.665)` | Primary text |
| `--color-calendar-border` | `oklch(92.8% .006 264.531)` | Borders / dividers |
| `--color-calendar-hover` | `oklch(96.7% .003 264.542)` | Hover background |
| `--color-calendar-overlay` | `oklch(0 0 0 / .2)` | Popup overlay backdrop |
| `--color-calendar-primary` | `oklch(54.6% .245 262.881)` | Accent: selected / active day |
| `--color-calendar-primary-text` | `#fff` | Text on the accent (selected day) |
| `--color-calendar-muted` | `oklch(44.6% .03 256.802)` | Muted text base |
| `--color-calendar-disabled` | `var(--color-calendar-muted)` | Disabled day text |
| `--color-calendar-other-month` | `var(--color-calendar-muted)` | Days outside the current month |
| `--color-calendar-weekday` | `var(--color-calendar-muted)` | Weekday header labels |
| `--color-calendar-range` | `oklch(97% .014 254.604)` | In-range background (between start/end) |
| `--color-calendar-today-ring` | `oklch(70.7% .165 254.624)` | Ring around "today" |
| `--color-calendar-focus-ring` | `var(--color-calendar-primary)` | Keyboard focus ring |
| `--color-calendar-available` | `oklch(.65 .2 145)` | Availability dot / label color |
| `--color-calendar-available-bg` | `oklch(.95 .05 145)` | Available background tint |
| `--color-calendar-unavailable` | `oklch(70.7% .022 261.325)` | Unavailable (struck-through) day color |

### Radius tokens

| Variable | Default | Purpose |
| --- | --- | --- |
| `--radius-calendar` | `.5rem` | Calendar container + buttons radius |
| `--radius-calendar-day` | `9999px` | Day cell radius (fully round by default) |
| `--radius-calendar-day-range-edge` | `var(--radius-calendar-day)` | Range start/end edge radius |
| `--radius-calendar-day-range-middle` | `0` | In-range middle cells radius |

### Other tokens

| Variable | Default | Purpose |
| --- | --- | --- |
| `--shadow-calendar` | `0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a` | Calendar box shadow |
| `--font-calendar` | `system-ui, -apple-system, sans-serif` | Calendar font family |

Override only what you need:

```css
:root {
  --color-calendar-primary: #06b6d4;
  --color-calendar-primary-text: #ffffff;
  --color-calendar-bg: #ffffff;
  --color-calendar-text: #0f172a;
  --color-calendar-border: #e2e8f0;
  --color-calendar-hover: #f1f5f9;
  --color-calendar-range: #ecfeff;
  --color-calendar-today-ring: #67e8f9;
  --color-calendar-available: #16a34a;
  --color-calendar-unavailable: #94a3b8;
  --radius-calendar: 0.5rem;
  --radius-calendar-day: 9999px;
  --font-calendar: system-ui, -apple-system, sans-serif;
}
```

## Next steps

With the assets in place, start adding components to your templates with the [Availability Search component](./availability-search-component).
