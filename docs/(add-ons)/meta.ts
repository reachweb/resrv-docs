import { defineMeta } from "blume";

// Reach's add-ons that extend Resrv, one page each. The Mollie and PayPal gateways are add-ons
// too, but they live with the other payment gateways.
export default defineMeta({
  title: "Add-ons",
  order: 5,
  pages: ["vouchers"],
});
