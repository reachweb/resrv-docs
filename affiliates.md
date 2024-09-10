# Affiliates

Resrv offers a basic affiliate system that allows you to track any reservations made through an affiliate link. In this page, we'll go over how to set up and use the affiliate system.

## Basics

To use the affiliate system, you need to enable it in the addon's [configuration](./configuration#reservation-settings) page. Once enabled, you can find the Affiliates link in the Control Panel.

When adding an affiliate, you will be presented with the following options:

<Image src="./img/resrv-affiliates-add.webp" alt="Adding a new affiliate." />

- **Name**: The name of the affiliate, for your own reference.
- **Code**: The affiliate code that will be part of the affiliate link.
- **Email**: The email address of the affiliate.
- **Cookie duration in days**: How long the affiliate cookie should remain valid. After this time, the cookie will expire, and the affiliate will no longer be credited for any reservation by that user.
- **Fee**: The fee as a percentage of the reservation that the affiliate earns. This is only for your reference; the affiliate does not see this.
- **Allow skipping payment**: If enabled, the affiliate will be able to skip the payment step in the checkout process.
- **Send reservation email**: If enabled, the affiliate will receive a confirmation email whenever a reservation is made through their link.
- **Published**: If disabled, the affiliate will be temporarily unpublished.

## Getting the affiliate link

Once you've added an affiliate, you can get the affiliate link by clicking on the action menu in the affiliate list and selecting "Copy affiliate link," or you can manually add `?afid=CODE` at the end of any URL on your website (where `CODE` is the affiliate code you set in the affiliate settings).

## How it works

When a user visits your site using the affiliate link, a cookie is set on their browser. This cookie contains the affiliate code and remains active for the number of days you specified in the affiliate settings. If a reservation is made through this affiliate link, the affiliate will be credited for that reservation.

The cookie gets overwritten each time a new visit is made using a different affiliate link, so the most recent visit always sets the active cookie.

However, this approach has some limitations. For instance, if a user blocks cookies by default, the reservation will not be credited to the affiliate.

## Skipping payment

As previously mentioned, if you enable the **Allow skipping payment** option, the affiliate will be able to bypass the payment step during the checkout process. This feature is useful if you want an affiliate to book a reservation on behalf of a client without immediate payment—for example, if an agency or concierge is booking for a client who will pay later. Be cautious when using this feature, as sharing the affiliate code may allow other users to bypass payment unintentionally.

When skipping payment is allowed, a new button labeled **Complete reservation and pay later** will appear in the checkout process after entering the client's details.

## How to credit affiliates

In the [reservation details](reservations#reservation-details) page, you can see the affiliate that was credited for the reservation:

<Image src="./img/resrv-reservation-affiliate-credit.webp" alt="What appears in the reservations details page when an affiliate is credited." />

The fees displayed here are for your convienience only, the affiliate does not see this information.