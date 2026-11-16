import { defineMeta } from "blume";

// Reach's add-ons that extend Resrv, one page each. The Mollie gateway is an add-on too, but
// it lives with the other payment gateways.
export default defineMeta({
  title: "Add-ons",
  order: 5,
  pages: ["vouchers"],
});
