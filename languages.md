# Languages

Most of the texts in Resrv are read from the addon's language file. This page explains how to change them or add new translations.

## Publishing the language file

To publish the language file just run:

```bash
php artisan vendor:publish --tag=resrv-language
```

You should now see the language file in `lang/vendor/statamic-resrv/en/frontend.php`.

You can edit this file in order the change the wording used in most areas of Resrv's frontend.

## Adding new translations

When using multisite, you can simply create a new folder with the handle of your other sites in `lang/vendor/statamic-resrv/`. Then, simply copy frontend.php to the new folder and translate the strings.