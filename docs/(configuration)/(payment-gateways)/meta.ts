import { defineMeta } from "blume";

export default defineMeta({
  title: "Payment gateways",
  display: "group",
  collapsed: false,
  pages: ["payment-gateways", "stripe", "mollie", "custom-payment-gateway"],
});
