# Options

Options are a great way to add a bit of flexibility to your Reservations. They allow you to add a number of values to a specific Option and let the user choose between them.

They are similar to Extras, but they are less advanced and bound to each Entry by default. You can read the diferences between Extras and Options in the [Extras](./extras#extras-or-options) docs.

## Managing Options

To manage your Options, you need to add the `Resrv Options` field to your Blueprint. Then in your entry you can add as many options as you want.

<Image src="./img/resrv-options-field.webp" alt="The Resrv Options field in your Entry." />

Each option can be `Required` or `Optional`. If an option is required, the user will have to select a value during checkout.

Each option value's price can be set to be Free, Per day or Fixed. Per day and Fixed values are multiplied by the reservation quantity unless **Ignore quantity for prices** is enabled in your [configuration](./configuration); a rate can change what counts as one unit with **[Booked units per add-on](./rates#booked-units-per-add-on)**.

## Where options apply

Options are **collection-scoped**, the same way [Rates](./rates) are. When you create an option from an entry's Options field it is bound to that entry's collection, and by default it applies to the entry you created it on. Internally an option stores the `collection` it belongs to plus the list of entries it is attached to, so the same option can be reused across several entries of a collection instead of being re-created on each one.

::: tip
Assigning a single option to multiple entries (or to a whole collection) is available through the backend API in this release; the Control Panel screen for managing that assignment centrally is coming in a later release. Creating and editing options per entry works as before.
:::

## Disabling a value for an entry

Sometimes a value should exist for most entries but not for a specific one. For example, a "Child seat" value that one particular vehicle can't offer. From the entry's Options editor, open the menu next to any value and choose **Disable for this entry**. The value is then hidden from the frontend and can't be selected during checkout **for that entry only**; every other entry keeps it. Choose **Enable for this entry** to bring it back.

A disabled value is an exception, so it never affects the option elsewhere. If you disable *every* value of a required option for an entry, that option is simply skipped for the entry (checkout will not deadlock waiting for a selection that can't be made).

## Price snapshots

When a reservation is made, the chosen option's name, computed price and price type are **frozen onto the reservation**. Editing or deleting an option, changing a value's price, or disabling a value later will **not** change what a past reservation charged or what its confirmation email shows. This keeps historical bookings accurate and makes it safe to reuse one option across many entries.