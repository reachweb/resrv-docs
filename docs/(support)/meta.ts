import { defineMeta } from "blume";

// The support page is this group's hidden index, so the group header itself links to /support,
// as the old sidebar's last item did. A group needs a visible page to show, and the changelog
// is it. Blume lists loose pages above groups, so a group keeps this last.
export default defineMeta({
  title: "Support & Pricing",
  order: 5,
});
