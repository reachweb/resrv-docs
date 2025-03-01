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

Besides the Livewire scripts, Resrv also requires [Vanilla Calendar Pro](https://vanilla-calendar.pro/) and [Day.js](https://day.js.org/).

You can always install them via npm and include them in your build process (make sure you also import the necessary CSS file), but it's highly suggested that you can include them directly in your layout file using a pre-compiled version that ships with Resrv:

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

::: info
We have forked Vanilla Calendar Pro in order to better support minimum and maximum ranges plus to make it easier to style using CSS variables. You can always use the upstream version but you might have some minor annoyances.
:::


## Frontend styles & TailwindCSS

Resrv's Livewire components are styled using TailwindCSS. On a default Statamic installation, TailwindCSS is already included, and if you published the views as recommended during the [installation process](./installation), running `npm run dev` will automatically include the required TailwindCSS styles.

It's highly recommended to install the TailwindCSS Forms plugin:

```bash
npm install @tailwindcss/forms
```

And then add it to your `tailwind.config.js` file:

```js{16-18}
export default {
    content: [
        './resources/**/*.antlers.html',
        './resources/**/*.antlers.php',
        './resources/**/*.blade.php',
        './resources/**/*.vue',
        './content/**/*.md',
    ],

    theme: {
        extend: {},
    },

    plugins: [
        require('@tailwindcss/typography'),
        require("@tailwindcss/forms")({
            strategy: 'class'
        }),
    ],
}
```

If you are not using TailwindCSS, it's recommended that you style the Livewire components using your own CSS. However, to help you get started, we've included a `resrv-tailwind.css` file in the `vendor/statamic-resrv/frontend/css` directory that you can import so that you can get Resrv running and then customize it to your liking.

::: warning
The `resrv-tailwind.css` file should only be included if you don't use TailwindCSS. Since it contains what are known as reset styles, it can mess up your site's styling. The suggested approach is to use it as a starting point and then style the components yourself using your own CSS.
:::

## CSS Variables

You can set the following CSS variables in your style file in order to style Vanilla Calendar Pro:

```css
--calendar-day-font-size: 1rem;
--calendar-price-font-size: 0.75rem;
--calendar-day-font-weight: 400;
--calendar-day-padding: 0px;
--calendar-day-border-radius: 0.5rem;
--calendar-color-white: #ffffff;
--calendar-color-slate-50: #f8fafc;
--calendar-color-slate-100: #f1f5f9;
--calendar-color-slate-200: #e2e8f0;
--calendar-color-slate-300: #cbd5e1;
--calendar-color-slate-400: #94a3b8;
--calendar-color-slate-500: #64748b;
--calendar-color-slate-600: #475569;
--calendar-color-slate-900: #0f172a;
--calendar-color-main: #06b6d4;
--calendar-color-weekend-enabled: #f43f5e;
--calendar-color-weekend-disabled: #fff1f2;
```

Use `!important` in case your changes are not visible.
