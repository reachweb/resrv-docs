---
name: Resrv
description: The booking system for Statamic. One site for the product page and its docs, in light and dark.
colors:
  ink: "#171718"
  orange: "#f56b3c"
  amber: "#f8ad22"
  deep-orange: "#c4461b"
  deep-orange-strong: "#a03814"
  paper: "#ffffff"
  paper-band: "#f7f7f7"
  muted-ink: "oklch(0.53 0 0)"
  hairline: "oklch(0.88 0.006 260 / 0.72)"
  orange-tint: "#fcede9"
  demo-wash: "#fff5f2"
  night: "#141415"
  night-band: "#19191a"
  night-raised: "#1c1c1e"
  night-hairline: "#29292c"
  night-text: "oklch(0.96 0 0)"
  night-muted: "oklch(0.68 0 0)"
  night-orange-tint: "#271d1a"
  closing-night: "#0d0d0e"
  closing-muted: "#c8c8cc"
  statamic-indigo: "#4f46e5"
  statamic-indigo-night: "#6366f1"
  statamic-green: "#15803d"
  statamic-page: "#f5f5f5"
typography:
  display:
    fontFamily: '"Archivo Wide", Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(2.375rem, 7.4vw, 5.75rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
    fontVariation: '"wdth" 125'
  price:
    fontFamily: '"Archivo Wide", Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: "4rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontVariation: '"wdth" 125'
  headline:
    fontFamily: '"Archivo Wide", Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(1.75rem, 3.6vw, 2.625rem)"
    fontWeight: 750
    lineHeight: 1.06
    letterSpacing: "-0.025em"
    fontVariation: '"wdth" 115'
  title:
    fontFamily: '"Archivo Wide", Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 650
    letterSpacing: "-0.01em"
    fontVariation: '"wdth" 108'
  docs-title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  docs-heading:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.6vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.2
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
  small-label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
  proof:
    fontFamily: '"Archivo Wide", Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(1.25rem, 2.2vw, 1.625rem)"
    fontWeight: 750
    lineHeight: 1.12
    letterSpacing: "-0.02em"
    fontVariation: '"wdth" 115'
  mono:
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
    fontSize: "0.75rem"
    lineHeight: 1.7
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  frame: "14px"
  pill: "999px"
spacing:
  gutter: "1rem"
  gutter-wide: "1.5rem"
  container: "74rem"
  docs-measure: "42rem"
  section: "clamp(4rem, 9vw, 6.5rem)"
  xs: "0.375rem"
  sm: "0.625rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.deep-orange}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.25rem"
    height: "2.875rem"
  button-primary-hover:
    backgroundColor: "{colors.deep-orange-strong}"
  button-primary-night:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.ink}"
  button-primary-night-hover:
    backgroundColor: "#f9825b"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.25rem"
    height: "2.875rem"
  button-link:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    padding: "0.5rem 0.25rem"
  button-ghost-on-ink:
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.25rem"
    height: "2.875rem"
  header-buy:
    backgroundColor: "{colors.deep-orange}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
  chip-news:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.pill}"
    padding: "0.3125rem 0.75rem 0.3125rem 0.3125rem"
  chip-news-tag:
    backgroundColor: "{colors.orange-tint}"
    textColor: "{colors.deep-orange-strong}"
    typography: "{typography.small-label}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.5rem"
  chip-gateway:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.75rem"
  icon-tile:
    backgroundColor: "{colors.orange-tint}"
    textColor: "{colors.deep-orange}"
    rounded: "{rounded.lg}"
    size: "2.5rem"
  step-number:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "2rem"
  tabs:
    backgroundColor: "{colors.paper-band}"
    rounded: "{rounded.xl}"
    padding: "0.25rem"
  tab-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "9px"
    padding: "0.5rem 0.875rem"
  product-frame:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.frame}"
  frame-caption:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.small-label}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.75rem"
  price-card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.frame}"
    padding: "2rem 1.75rem 1.75rem"
  closing-band:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
---

# Design System: Resrv

## Overview

**Creative North Star: "The Booked Calendar Page"**

Everything grows from the logo: a calendar page with three reservations laid on it like a booking timeline. The site borrows that page's structure (a faint seven-column week grid behind the hero), its bars (orange, amber, then ink, staggered like bookings across days), and its honesty: what sits on the page is the real product, shown in frames, with the demo hotel's own names and numbers. The system is the paper and the grid. The bookings and the product are the color.

It feels **confident, exact and warm**. Confident in the wide, heavy Archivo headlines that state each claim plainly. Exact in the quiet Inter body, the hairline dividers and the panels that redraw the control panel down to its labels. Warm in the brand orange, used sparingly for action and for the three-bar signature, never as wallpaper. Density is moderate: generous section rhythm on the home page, the calm three-column reading layout of Blume in the docs.

Two surfaces share one system. The home page is the marketing surface and carries the wide type, the bars and the framed product. The docs stay in Blume's reading layout with normal-width Archivo headings, so a developer reading while coding is never shouted at. Both ship in light and dark, following the system setting.

**Key Characteristics:**
- Ink on white paper (night `#141415` in dark), with the brand orange as the only accent.
- Wide, heavy Archivo for marketing headlines; Inter for everything you read.
- The three bars (orange, amber, ink or white) as the recurring signature.
- Real product in browser frames, lifted by the system's one long shadow.
- Hairline-divided rows instead of card grids; flat text sections.
- Control panel redraws keep Statamic's own look, inside their frames only.

## Colors

One warm accent on a neutral ink-and-paper base, with the brand's amber and a borrowed Statamic indigo kept to tightly fenced roles.

### Primary
- **Orange** (`{colors.orange}`): the brand orange from the logo. On dark it is the accent: links, filled buttons (with ink text) and focus rings. In both themes it is the first bar, the first step number, the guest-site caption dot and the closing band's filled button. Ink on Orange reads at 6.0:1.
- **Deep Orange** (`{colors.deep-orange}`): the light theme's accent. Links, the header's Buy pill, filled buttons with white text, tick icons, icon glyphs and "more" links. It exists because Orange fails as text on white (3.0:1); Deep Orange reaches 4.95:1. **Deep Orange Strong** (`{colors.deep-orange-strong}`) is its hover shade, and the text of the "New in" tag on light, where Deep Orange on the Orange Tint reads at only 4.3:1 and Strong reaches 5.9:1.

### Secondary
- **Amber** (`{colors.amber}`): the logo's second bar. Only ever the second element in a sequence: the second bar of the step track, the second step number, the control panel caption dot and the control panel demo card's top bar. Never text, never a button.

### Tertiary
- **Statamic Indigo** (`{colors.statamic-indigo}`, `{colors.statamic-indigo-night}` in dark) with **Statamic Green** (`{colors.statamic-green}`) and **Statamic Page** grey (`{colors.statamic-page}`): the control panel's own colors, borrowed only to redraw it. They appear inside the HTML panels that mirror the control panel (Add rate, the active fieldtype, availability counts, live rates) and nowhere else.

### Neutral
- **Ink** (`{colors.ink}`): the brand ink. All headings and body text on light, the frame captions, the closing band in light, the third bar in light.
- **Paper** (`{colors.paper}`): the light background and every surface that sits on it: frames, step cards, the price card, secondary buttons.
- **Paper Band** (`{colors.paper-band}`): the tinted section bands that alternate with white, plus the frame chrome bar and the tabs track. The CSS derives it as 3% ink mixed into the background; `{colors.night-band}` is the same mix in dark.
- **Muted Ink** (`{colors.muted-ink}`): lead paragraphs, supporting text, list text and captions (5.25:1 on white). `{colors.night-muted}` in dark (6.4:1 on night).
- **Hairline** (`{colors.hairline}`): every border and divider. `{colors.night-hairline}` in dark.
- **Night** (`{colors.night}`): the dark background, with `{colors.night-text}` for text and `{colors.night-raised}` for code blocks and muted fills.
- **Orange Tint** (`{colors.orange-tint}`): the 10% accent wash behind icon tiles and the "New in" tag (`{colors.night-orange-tint}` in dark). **Demo Wash** (`{colors.demo-wash}`) is the 7% orange band behind the demo section (4% in dark).
- **Closing Night** (`{colors.closing-night}`) and **Closing Muted** (`{colors.closing-muted}`): the closing band is ink in light and the darker closing night in dark, with closing muted for its paragraph.

### Named Rules
**The Two Oranges Rule.** Deep Orange carries text and fills on light; Orange carries them on dark. Brand Orange never sets text on white.

**The Borrowed Indigo Rule.** Statamic's indigo, green and greys live only inside redrawn control panel panels. Outside a panel, the only accent is orange.

**The Bar Order Rule.** Orange, then amber, then ink (white in dark). Amber is never first and never alone. The bars mark the three steps, the three collections and the three track-record facts.

## Typography

**Display Font:** Archivo Wide (the brand's Archivo with its width axis, self-hosted as `public/home/fonts/archivo-wide.woff2`, weights 500 to 800, widths 100% to 125%), falling back to Archivo
**Docs Heading Font:** Archivo at normal width, through Blume's font loading
**Body Font:** Inter (with ui-sans-serif, system-ui)
**Mono Font:** the system monospace stack (ui-monospace, SF Mono, Menlo, Consolas)

**Character:** a wide, heavy grotesque that sets claims like a sign, paired with a neutral, highly legible sans for everything you read. The width does the shouting, so the body never has to.

### Hierarchy
- **Display** (800, `clamp(2.375rem, 7.4vw, 5.75rem)`, line height 0.98, width 125%): the home page's single H1, held to 15ch so it breaks into two or three lines.
- **Price** (800, 4rem, width 125%): the price on the price card. One per page.
- **Headline** (750, `clamp(1.75rem, 3.6vw, 2.625rem)`, line height 1.06, width 115%): section headings on marketing pages, balanced with `text-wrap: balance`.
- **Title** (650, 1.0625rem to 1.375rem, width 108%): step, card, list-row and demo-card headings.
- **Docs Title / Docs Heading** (500, 3rem and 1.875rem, tracking -0.02em): Blume's page titles and H2s in the docs. H3s are 1.25rem at the same weight.
- **Lead** (400, `clamp(1.0625rem, 1.6vw, 1.1875rem)`, line height 1.6, muted): hero and section intros, held to 36rem (section heads to 42rem).
- **Body** (400, 1rem, line height 1.5): running text. Supporting paragraphs on the home page run 1.0625rem at 1.6 to 1.65; docs prose stays in Blume's 42rem column.
- **Label** (600, 0.875rem): step labels ("Step 1"), the plan name, chips, tabs and "more" links (0.9375rem).
- **Small Label** (600, 0.8125rem): the "New in" tag, frame captions (0.75rem on phones) and the tabs on phones. Redrawn control panel cards, the code panels from 560px and the demo login's values use the same size at their own weights.
- **Proof** (750, `clamp(1.25rem, 2.2vw, 1.625rem)`, width 115%): the three track-record facts. Stated as plain sentences at one size, never a big number over a small label.
- **Mono** (0.75rem, line height 1.7 in code panels): file names and code in redrawn panels; the docs' code blocks use Blume's own sizing.

### Named Rules
**The Wide-for-Claims Rule.** Wide Archivo (108% to 125%) is for marketing headings only. Docs headings stay normal-width Archivo at 500, and the control panel never loads Archivo at all.

**The Tight Display Rule.** The wider and heavier the type, the tighter the tracking: -0.035em at display, -0.025em at headline, -0.01em at title, -0.02em in the docs (where Blume's default -0.05em crowds Archivo).

## Layout

The home page sits in a 74rem container with a 1rem gutter, widening to 1.5rem from 640px. Sections stack with fluid vertical padding (`clamp(4rem, 9vw, 6.5rem)`) and alternate between white and the paper band, each band bounded by hairlines top and bottom. A section opens with a heading block held to 42rem and 3rem of space below it.

Content inside a section is asymmetric. Text-and-visual splits run 5fr to 6fr (or 5fr to 7fr) from 960px, alternating sides; the hero's lead and actions split into two equal columns. Lists of uses, details and add-ons are hairline-divided rows that reflow from one column to two at 640px. The three steps line up their panels with CSS subgrid at 960px, whatever the length of the text above them.

Product shots overlap on a 12-column grid: in the hero, the guest site spans the first eight columns and the control panel overlaps it from column 7, hanging 4rem below the band. Below 900px they stack, offset by a column, so the overlap survives on phones.

The docs use Blume's three-column reading layout: sidebar, a 42rem content column, and the "On this page" outline. Keep it.

### Named Rules
**The Week Grid Rule.** The hero's background is a seven-column grid of 1px hairlines at 7% ink, masked to fade in and out vertically. Each column is a seventh of the 74rem container's content box, with lines on both content edges, so the headline and the frames start on a line and the grid runs on at the same pitch into the margins. It is the calendar page under the bookings: faint, structural and only behind the hero.

**The Three Collections Rule.** Right after the hero, the "Three collections, one checkout" band proves the lead claim with the demo: Rooms, Spa Treatments and Restaurant as three columns, each marked by a bar in bar order and holding a redraw of its entry's Availability field for the same week. Hairlines join the columns into one checkout node (`{{ livewire:checkout }}`), and the line ends on the real Reservations Calendar, cropped to that week, where the three bookings sit staggered like the logo's bars. The columns stack below 768px, and the week scrolls sideways inside its frame below 640px.

## Elevation & Depth

The system is flat at rest. Depth comes from hairlines and the alternating paper bands, not from shadows. One long, soft shadow exists, and it lifts only real product: framed screenshots, the two demo cards and the price card. Redrawn control panel cards carry a smaller version of Statamic's own card shadow, and a selected tab gets a 1px lift. Text sections, list rows, icon tiles and buttons never cast a shadow.

### Shadow Vocabulary
- **Product lift** (`box-shadow: 0 1px 2px rgb(23 23 24 / 0.06), 0 28px 56px -28px rgb(23 23 24 / 0.32)`; in dark `0 1px 2px rgb(0 0 0 / 0.4), 0 28px 56px -28px rgb(0 0 0 / 0.8)`): browser frames, demo cards, the price card.
- **Panel card** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.05), 0 14px 30px -20px rgb(0 0 0 / 0.35)`): redrawn control panel cards inside step and feature visuals.
- **Caption** (`box-shadow: 0 6px 16px -8px rgb(0 0 0 / 0.5)`): the ink caption tags hanging off frame edges.
- **Selected tab** (`box-shadow: 0 1px 3px rgb(0 0 0 / 0.12)`): the active segment of the tabs control.

### Named Rules
**The Product Lifts Rule.** If it isn't the real product (or the one price card), it stays flat. A shadow on a text block or a feature row is a bug.

## Shapes

Corners are gently rounded and step up with the size of the thing: 4px on the smallest control panel badges, 6px (`{rounded.sm}`) on redrawn fields and selects, 8px (`{rounded.md}`) on chips, captions and step numbers, and the docs' Blume radius (0.5rem). Buttons, icon tiles and code panels take 10px (`{rounded.lg}`), the tabs track and the login card 12px (`{rounded.xl}`), and the big product surfaces 14px (`{rounded.frame}`). Pills (`{rounded.pill}`) are kept for the news chip, the header's Buy button, the frame's address bar and the bars themselves.

The bars are the one silhouette that repeats: fully rounded capsules, staggered like bookings across a week. The step track uses three 0.75rem bars; each demo card wears a 0.5rem bar along its top edge, rounded only on its open end. The orange-to-amber gradient appears only as the price card's 4px top edge, running left to right like the logo's border.

## Components

### Buttons
Precise and quiet: one filled button per group, the rest bordered or plain.
- **Shape:** gently rounded (10px), 2.875rem tall, semibold 0.9375rem labels, icon and text 0.5rem apart.
- **Primary:** Deep Orange fill with white text on light; Orange fill with ink text on dark. Hover deepens on light (`#a03814`) and lightens on dark (`#f9825b`).
- **Secondary:** paper fill, hairline border, ink text. Hover darkens the border to 35% ink.
- **Link:** ink text with a 30% underline that goes solid on hover. Used for "Read the docs".
- **On the closing band:** the primary turns brand Orange with ink text; a ghost button has a 28% white border that strengthens to 60% on hover.
- **Leaving the site:** buttons and links that go to the Marketplace, the demo or another site end in an up-right arrow. The demo's open in a new tab, so the demo login stays on screen beside them.
- **Focus:** a 2px accent outline, 3px offset, on every button, tab and link. Background and border transitions run 0.15s and switch off under reduced motion.

### Chips
- **News chip:** a pill with a hairline border on paper, muted text that turns ink on hover, and an inner Orange Tint tag ("New in 6.5") in Deep Orange semibold.
- **Gateway chips:** 8px corners, hairline border, ink semibold 0.875rem labels, with an optional muted "add-on" note. The border turns accent on hover.

### Cards / Containers
- **Corner Style:** 14px for product surfaces (frames, steps, demo cards, price card).
- **Background:** paper (night in dark); step visuals sit on the paper band below a hairline.
- **Shadow Strategy:** only product surfaces lift (see Elevation & Depth). Step cards are flat with a hairline.
- **Border:** 1px hairline on every container.
- **Internal Padding:** 1.5rem for step and demo-card text; 2rem 1.75rem 1.75rem on the price card.

### Navigation
Blume's header: the horizontal logo (shown 27px tall, set at 2.5rem to carry its clear space), then Docs, Demo and the version link in body text, the Buy pill in the accent, search and the theme toggle. The docs sidebar and outline are Blume's, with the current page on a muted pill. The home page's **tabs** are a segmented control: a 12px paper-band track with a hairline, 9px segments in semibold muted text, the selected one on paper with ink text and a 1px lift.

### Feature Rows
The "who it's for", details and add-on lists are rows, not cards, each with a hairline above or below it, a title and muted text. Only the "who it's for" grid carries icon tiles (2.5rem, Orange Tint with a Deep Orange Lucide glyph), with a semibold accent link to the docs page that backs the claim. The details list is plain: two columns from 640px, each title a link to its docs page with a small accent arrow.

### Product Frame (signature)
Real screenshots sit in a browser frame: a paper-band chrome bar with three muted dots and a centered pill address showing the demo's real host and path, the screenshot below, 14px corners, a hairline and the product lift. An ink caption tag hangs off the bottom edge at a lower corner, half on the frame and half below it, so it names the screen without covering it; it carries a small rounded-square dot in Orange (guest site) or Amber (control panel). Control panel screenshots ship as light and dark pairs that swap with the theme.

Below 560px a whole control panel screen would shrink to 4px text, so each one crops to a single region at about twice the size: a `.crop` box takes the image's width and its left and top offsets as custom properties. The hero's Reservations list drops Statamic's top bar and sidebar, and the tab viewer's three screens crop square, so the frame keeps its size between tabs. The calendar week crops to Monday to Thursday the same way.

### Control Panel Redraws (signature)
Small HTML panels that redraw the Statamic control panel (fieldtype picker, availability calendar, rates tree, login) in Statamic's own look: Inter, neutral greys, indigo actions, green availability counts, 6 to 10px corners. They use the demo's real names and numbers and follow the site's theme.

### Three-Bar Track and Step Numbers (signature)
From 960px, the three steps sit under a track of three staggered capsules (orange, amber, ink or white) that echo the logo's bars. Each step's number is a 2rem, 8px-cornered square in the matching bar color, set in wide Archivo 800.

### Track Record
The "Made by Reach" section comes right before the price and ends on three facts: "5 years in production", "Thousands of bookings processed" and "Millions in revenue generated". Each sits under a capsule bar in bar order (7rem, 7rem and a shorter 4.5rem, 0.75rem tall), in Proof type, three columns from 768px and stacked below. The hero's facts row repeats the first one. Keep the facts at this precision: never exact figures, never stat tiles.

### Closing Band
The page ends on a band of ink (closing night in dark) with the reversed horizontal logo shown 300px wide, a white headline and the orange primary button. It is the only dark band on the light page, like the brand's dark social images.

## Do's and Don'ts

### Do:
- **Do** use Deep Orange (#c4461b) for text, links and filled buttons on light, and Orange (#f56b3c) on dark.
- **Do** keep the bars in their order (orange, amber, then ink or white) when marking three steps or three collections, or orange and amber when pairing the guest site with the control panel.
- **Do** show real product in the browser frame, with the demo's own host, names and numbers, and ship light and dark versions of every control panel screenshot.
- **Do** divide lists with hairlines and keep text sections flat on white or the paper band.
- **Do** keep one filled button per action group; the others are secondary or link buttons.
- **Do** set marketing headings in wide Archivo (108% to 125%) with tight tracking, and leave docs headings in normal-width Archivo at 500.
- **Do** redraw control panel UI in Statamic's look, inside its own panel.
- **Do** use the logo files from `public/brand/` (from `brand/`) at the sizes the brand guide sets.

### Don't:
- **Don't** set text in brand Orange on white; it reads at 3.0:1.
- **Don't** put a shadow on text sections, feature rows, icon tiles or buttons; only real product and the price card lift.
- **Don't** box lists of features into card grids; they are hairline rows.
- **Don't** use Statamic's indigo, green or greys outside a redrawn control panel panel, or the brand orange and Archivo inside one.
- **Don't** use amber as text, as a button, or as the first bar.
- **Don't** spread the orange-to-amber gradient beyond thin edges like the price card's 4px top bar.
- **Don't** load wide Archivo in the docs or the control panel.
- **Don't** retype, recolor or rebuild the logo; the brand guide in `brand/README.md` is binding.
