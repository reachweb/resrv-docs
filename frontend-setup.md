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

Besides the Livewire scripts, Resrv also requires [Flatpickr](https://flatpickr.js.org/) and [Day.js](https://day.js.org/).

You can either install them via npm and include them in your build process (make sure you also import Flatpickr's CSS), or you can include them directly in your layout file using a pre-compiled version that ships with Resrv:

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
