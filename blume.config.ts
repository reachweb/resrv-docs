import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { defineConfig } from "blume";
import {
  githubUrl,
  issuesUrl,
  license,
  marketplaceUrl,
  partnerUrl,
  price,
  requirements,
  sellerUrl,
  supportEmail,
  version,
} from "./site";

// Antlers, Statamic's template language, isn't one of Shiki's bundled languages. The grammar
// embeds HTML, so HTML loads first.
const antlers = JSON.parse(
  readFileSync(new URL("./languages/antlers.tmLanguage.json", import.meta.url), "utf8")
);
const antlersLanguage = { ...antlers, name: "antlers", embeddedLangs: ["html"] };

// Blume knows a fence's language only if Shiki bundles it, and warns BLUME_UNKNOWN_CODE_LANGUAGE
// for any other. Adding Antlers to Shiki's bundled list makes it one of them, for that check and
// for Blume's own highlighting (inline `code`{:antlers}, <CodeBlock>). The list must be the very
// object Blume reads: Shiki resolved from Blume's own folder (it may install its own version),
// through Node's native require (Node 22.12+ requires ES modules), since jiti, which loads this
// file, would hand an `import` a copy of its own.
const blumeRequire = createRequire(createRequire(import.meta.url).resolve("blume"));
const { bundledLanguages }: typeof import("shiki/langs") = blumeRequire("shiki/langs");
if (!Object.hasOwn(bundledLanguages, "antlers")) {
  Object.assign(bundledLanguages, {
    antlers: async () => ({
      default: [...(await bundledLanguages.html()).default, antlersLanguage],
    }),
  });
}

// Astro highlights the fences with its own Shiki config, so the grammar goes there too.
const antlersHighlighting = {
  name: "resrv-antlers",
  hooks: {
    "astro:config:setup": ({ updateConfig }) => {
      updateConfig({
        markdown: {
          shikiConfig: {
            langs: ["html", antlersLanguage],
          },
        },
      });
    },
  },
};

// Brand settings come from brand/README.md: ink #171718, orange #F56B3C, amber #F8AD22.
export default defineConfig({
  title: "Resrv",
  description:
    "Resrv is a booking system for Statamic: availability, rates, extras, checkout and payments for hotels, rentals, tours, restaurants and more.",

  // The horizontal logo already spells the name, so no text beside it. Sources: brand/logo/svg.
  logo: {
    image: {
      light: "/brand/resrv-logo-horizontal-color.svg",
      dark: "/brand/resrv-logo-horizontal-reversed.svg",
      alt: "Resrv",
    },
    text: "",
  },

  theme: {
    // The brand orange (#F56B3C) is too light for text on white (3:1), so light mode uses a
    // darker orange that meets AA (4.9:1); dark mode uses the brand orange itself.
    accent: { light: "#c4461b", dark: "#f56b3c" },
    background: { dark: "#141415" },
    radius: "md",
    mode: "system",
    // The brand guide's face for text next to the logo.
    fonts: { display: { name: "Archivo", weights: [600, 700, 800] } },
  },

  // The sidebar comes from the docs/ folders: (group) folders add a sidebar group without a
  // URL segment, so every page keeps its old flat route (/rates, /stripe, ...).
  navigation: {
    // The home page (pages/index.astro) has no sidebar, so the header links into the docs.
    actions: [
      { label: "Docs", href: "/introduction" },
      // The home page's demo section: both ways into the live demo, with the control panel login.
      { label: "Demo", href: "/#demo" },
      // Stands in for the old "v6.5.0" menu (Upgrading to v6, Changelog, Support). The other
      // two are in the sidebar; the changelog isn't, so the version links there.
      { label: `v${version}`, href: "/changelog" },
    ],
    cta: { label: "Buy", href: marketplaceUrl },
  },

  footer: {
    copyright: "© 2026 Reach Web Agency",
    links: [
      { label: "Statamic Marketplace", href: marketplaceUrl },
      { label: "GitHub", href: githubUrl },
      { label: "Support", href: "/support" },
    ],
    socials: { github: githubUrl },
  },

  // {{name}} in the pages: see site.ts. Blume replaces these inside code blocks too, so never
  // give one the name of an Antlers variable a code example uses ({{ title }}, {{ url }}, ...).
  variables: {
    price,
    license,
    version,
    marketplaceUrl,
    githubUrl,
    issuesUrl,
    supportEmail,
    partnerUrl,
    sellerUrl,
    phpVersion: requirements.php,
    laravelVersion: requirements.laravel,
    statamicVersion: requirements.statamic,
    livewireVersion: requirements.livewire,
  },

  seo: {
    og: {
      // One link preview for every page. Remove it to get a generated card per page instead,
      // which uses the logo below: the cards are light, so they get the ink logo.
      image: "/brand/link-preview-1200x630-light.png",
      logo: "/brand/resrv-logo-horizontal-color.svg",
    },
    x: { handle: "@afonic", creator: "@afonic" },
  },

  integrations: [antlersHighlighting],

  deployment: {
    site: process.env.DOCS_SITE_URL ?? "https://resrv.dev",
  },
});
