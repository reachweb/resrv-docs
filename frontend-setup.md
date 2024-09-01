# Frontend Setup

Resrv provides a number of Laravel Livewire components that you can use to add reservations to your site. This page describes how to setup the assets and vendor files required for the components to work.

## Add Livewire styles and scripts tags

Even though it's not strictly nessesary, it's recommended to add the Livewire styles and scripts tags to your site.

```antlers{9,15}
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