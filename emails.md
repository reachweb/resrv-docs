# Emails

Resrv sends automated emails when a reservation is made: one goes to the user, and one goes to the [admin](./configuration#reservation-settings) (or admins). In this section, we'll go over how to edit these emails to fit your needs.

## Getting started

If you haven't already published the email views during the [installation process](./installation#install-script), you'll need to do so now.

```bash
php artisan vendor:publish --tag=resrv-emails
```

You can then find the email templates in `resources/views/vendor/statamic-resrv/email`.

## Editing emails

Inside the `email` folder, you'll find two subdirectories: `reservations` and `theme`.

The `reservations` directory contains the templates that include the reservation details:

- **confirmed.blade.php**: The email sent to the user when a reservation is confirmed.
- **made.blade.php**: The email sent to the admin(s) when a reservation is confirmed.
- **refunded.blade.php**: The email sent to the user when a reservation is refunded.

These files use Markdown. You'll likely need to modify the reservation table to fit your specific needs.

::: info
These emails were originally built during Laravel 9.x, so they use the older Markdown syntax. We are currently working on improving them.
:::

## Editing the theme

Inside the `theme` directory, you'll find the HTML and CSS files used to style the emails and generate the components referenced in the templates.

If you want to add your logo to the emails, you need to edit the `message.blade.php` file and insert it at the beginning:

```blade
{{-- Header --}}
@slot('header')
@component('mail::header', ['url' => config('app.url')])
{{ config('resrv-config.name') }} // [!code --]
<img src="https://yourdomain.com/yourlogo.png" style="width: 160px" alt="{{ config('resrv-config.name') }}"> // [!code ++]
@endcomponent
@endslot
```

## Sending emails

All emails are sent out automatically. Just make sure that your Statamic installation is properly set up [to send emails](https://statamic.dev/email).