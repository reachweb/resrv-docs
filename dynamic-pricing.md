# Dynamic Pricing

Dynamic pricing is a powerful feature that allows you to change the price of a reservation based on various conditions. It’s essentially a fancy term for *campaigns* or *discounts*, but it also allows you to increase the price of a reservation if that's something you want to do. In this section, we’ll go over how to set up and use dynamic pricing.

## Basics

You can set up dynamic pricing by navigating to (you guessed it) the **Dynamic Pricing** section in your Statamic Control Panel. To create a new Dynamic Pricing campaign, simply click on the "Add Dynamic Pricing" button.

<Image src="./img/resrv-dynamic-pricing.webp" alt="The Dynamic Pricing section in the Control Panel." />

This list supports *drag and drop* to reorder the campaigns. Resrv processes the list in sequence and applies each dynamic pricing rule **in order** to the reservation.

::: info
The system doesn’t add the discounts together and apply them all at once. Instead, it applies them one by one. For example, if you have a reservation that costs $100 and two dynamic pricing rules are applied in order, say 10% and 20%, the system will first apply the 10% discount, reducing the cost to $90. Then, it applies the 20% discount, further reducing the price to $72. It will not apply a 30% discount, which would reduce the price to $70.
:::

## General settings

Each Dynamic Pricing campaign should have a title. You can then select the amount by which the price should be increased or decreased, either as a percentage or a fixed amount. Additionally, you need to **assign** the dynamic pricing to specific Entries or Extras.

You can also set an expiry date, after which the dynamic pricing will no longer be applied.

Enabling the **Overrides all other dynamic pricing** option ensures that **only** this dynamic pricing will be applied if the conditions match. If multiple campaigns are set as overriding, the system will apply only the first one in order. This is useful if you want to create non-combining discounts.

<Image src="./img/resrv-dynamic-pricing-off.webp" alt="A dynamic pricing that applies a discount of 10% for reservations that are for August 2025." />

## Conditions

Each Dynamic Pricing campaign has a set of conditions that determine when the campaign should be applied. You can use the following conditions:

- **Date conditions**: Set a date range to specify when the campaign should be applied. You can choose:
    - If all dates in a reservation should fall within that range (for multiple-day reservations).
    - If only the reservation start date should fall within the range.
    - If the majority of the reservation dates should be within the range (e.g., for a 7-day reservation, at least 4 days must be within the date range).

- **Reservation conditions**: Apply dynamic pricing only to reservations that meet specific criteria, such as equal to, not equal to, greater than, less than, or greater than or equal to. The available options are:
    - *Reservation duration* (in days)
    - *Reservation price*
    - *Difference in days between the reservation start date and the current date*

<Image src="./img/resrv-dynamic-pricing-lastminute.webp" alt="A dynamic pricing that only applies to reservations that start in the next 7 days." />

## Coupons

You can set up coupons to apply a discount to a reservation. Simply enter a coupon code of your choice in the appropriate field. The user can then use this coupon code during checkout to apply the discount.

Please note that coupons **always** get applied, even if there are overriding dynamic pricing campaigns in place. You can also apply the other conditions mentioned above to coupons, such as limiting their use to a specific date range.

## Applied Dynamic Pricing

On the [Reservation Details](./reservations#reservation-details) page in the Control Panel, you can view which dynamic pricing campaigns have been applied to a reservation.

<Image src="./img/resrv-dynamic-pricing-applied.webp" alt="The applied dynamic pricing campaigns in the reservation details page." />

