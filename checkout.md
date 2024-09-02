# Checkout

The `Checkout` component handles the whole checkout process: it allows the user to select extras or options, lets them add a coupon for a discount, gets the user's personal details and handles the payment.

In this page we'll go over the set up required for the `Checkout` component to function correctly and how to customize it to fit your needs.

## Component basics

Before using this component, lets go through of the required steps to get it working:

1. You need to create an Entry that will be used as the checkout page. This Entry can follow your website's design but must have a different template that will include the `Checkout` component.
2. You also need to create a "Checkout complete" page. Again, this page can be like any page of your but in its template you must include the `resrv_checkout_redirect` tag.
3. You need to create the checkout form. If you used the installer, a sample checkout form is already published for you to edit.
4. You must configure Stripe and include its Javascript in your layout page. This is explained in the [Stripe](./stripe) page.

## Checkout Component

To load the Checkout component, first create a new Entry in your default collection (for example "Pages"). Create a custom template for this page and include the `Checkout` component:

```antlers
{{ livewire:checkout }}
```

As simple as that! The component has a few properties that you can set to customize it to your needs:

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| enableExtrasStep | boolean | true | By default the component starts with a step that allows the user to select Extras / Options. If you don't use them, you can disable it by setting this to false. |
| enableCoupon | boolean | true | By default the component allows the user to add a discount coupon, you can disable this here if you don't use them. |
| view | string | "checkout" | You can override the view that is used to render the component. Expects a `name.blade.php` file in the `/resources/views/vendor/statamic-resrv/livewire` folder. |

<Image src="./img/resrv-checkout.webp" alt="The checkout component." />

## Checkout form

We are leveraging the [Statamic form builder](https://statamic.dev/forms) in order to allow you to customize the checkout form. If you published it during the installation process, you will find it in your Blueprints.

You can use Statamic's validation tab to add validation to your fields. The fields that are implemented in the frontend are:

- Text
- Radio
- Checkboxes
- Select
- Textarea
- Integer
- Toggle

<Image src="./img/resrv-checkout-form.webp" alt="The checkout form in the Statamic form builder." />

<Image src="./img/resrv-checkout-form-frontend.webp" alt="And the same checkout form in the frontend." />

