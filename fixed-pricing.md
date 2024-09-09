# Fixed Pricing

The Fixed Pricing feature allows you to set a fixed price for a reservation depending on the number of days the reservation lasts. This practice is commonly used in industries like rent a car where the price per day gets lower as the rental duration increases.

## Basics

Using Fixed Pricing is totally optional. To enable it, simply add a `Resrv Fixed Pricing` field to your Blueprint and the relevant section will appear in your Entries.

<Image src="./img/resrv-fixed-pricing.webp" alt="The Fixed Pricing field in action." />

## How it Works

In the Fixed Pricing field, you can set the total reservation price for the duration of the reservation. In the example above, you want $60 for 2 days, $80 for 3 days, and $100 for 4 days. The *extra day* price allows you to support more than 4 days for an extra $15 per day.

Please note that Fixed Pricing only affects the **price** of the reservation. You still need to set up availability using the [Availability](./availability) field.

Also, note that if a duration is missing from the Fixed Pricing field, the system will use the price set in the availability calendar and not fall back to the extra days feature. So, if you delete the 3 days duration from the Fixed Pricing field, the system won't use the 2 days price plus one extra day, but will fall back to the price set in the Availability field instead.

Finally, remember that [Dynamic Pricing](./dynamic-pricing) also applies to prices set by using the Fixed Pricing field.