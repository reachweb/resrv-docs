// Facts the docs pages ({{name}} variables, set in blume.config.ts) and the home page
// share, so each one changes in one place.

export const marketplaceUrl = "https://statamic.com/addons/reach/resrv";
export const githubUrl = "https://github.com/reachweb/statamic-resrv";
export const issuesUrl = "https://github.com/reachweb/statamic-resrv/issues";
export const supportEmail = "info@reach.gr";
export const partnerUrl = "https://statamic.com/partners/iosif-chatzimichail";
export const sellerUrl = "https://statamic.com/sellers/reach";

// The Composer package, from installation.md.
export const composerPackage = "reachweb/statamic-resrv";

// The live demo isn't public yet. It's the Resrv Hotel site (rooms, spa treatments and
// restaurant tables, each from its own collection) and its control panel, which shows its
// own demo login. These addresses are placeholders: set the real ones once it's online.
export const demoUrl = "https://demo.resrv.dev";
export const demoCpUrl = "https://demo.resrv.dev/cp";

// The demo control panel's login, which its login screen shows. The demo user isn't a super user.
export const demoLogin = { email: "demo@example.com", password: "password" } as const;

// From the Marketplace listing: one price, paid once.
export const price = "$195";
export const license = "Single-site license";

export const version = "6.5.3";

// From installation.md: keep in step with it.
export const requirements = {
  php: "8.4+",
  laravel: "12 or 13",
  statamic: "6",
  livewire: "3.6.4+ or 4",
} as const;

// Reach, who make Resrv, and their other Statamic addons (listed on sellerUrl).
export const reachUrl = "https://reach.gr";
export const easyFormsUrl = "https://statamic.com/addons/reach/easy-forms";
export const livewireFiltersUrl = "https://livewirefilters.com";
