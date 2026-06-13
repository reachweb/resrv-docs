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

Besides the Livewire scripts, Resrv's date picker is built on [@reachweb/alpine-calendar](https://github.com/reachweb/alpine-calendar), an AlpineJS-native calendar component, and uses [Day.js](https://day.js.org/) for date handling.

AlpineJS ships with Livewire 3, so it is already on the page once you add <code v-pre>{{ livewire:scripts }}</code>. The calendar plugin registers itself on Alpine's `alpine:init` event, and Day.js is bundled into the precompiled JS and exposed as `window.dayjs`.

You can install these via npm and include them in your own build process, but the simplest supported path is to include the precompiled version that ships with Resrv directly in your layout file. These files are published to `public/vendor/statamic-resrv/frontend/` during [installation](./installation).

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

Resrv's Livewire components are styled using TailwindCSS. Statamic 6 ships with **Tailwind v4**, which is configured CSS-first: there is no `tailwind.config.js`.

So that Tailwind doesn't purge the utility classes used by Resrv's components, point it at the published Resrv blade views with the `@source` directive in your main CSS file:

```css
@import "tailwindcss";

@source "../../vendor/reachweb/statamic-resrv/resources/views/**/*.blade.php";
```

::: tip
Adjust the relative path in `@source` to match where your CSS lives relative to the `vendor/` directory.
:::

It's highly recommended to install the TailwindCSS Forms plugin, since Resrv's inputs use the `form-input`, `form-select`, `form-checkbox` and `form-radio` classes:

```bash
npm install -D @tailwindcss/forms
```

In Tailwind v4 the plugin is registered in CSS with the `@plugin` directive instead of a JS config:

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

The calendar is themed with CSS custom properties. The defaults are declared at zero specificity, so any override you set in your own stylesheet wins regardless of load order. You do **not** need `!important`.

The accent color (selected days and active states) is `--color-calendar-primary`.

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

Override only what you need in your own stylesheet:

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

With the assets in place, you're ready to add the reservation components to your templates. Start with the [Availability Search component](./availability-search-component) to let visitors pick dates and check availability.
