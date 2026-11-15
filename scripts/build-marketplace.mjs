// Builds the Statamic Marketplace images. The eight slides tell the home page's story in its order
// and its look (pages/index.astro, DESIGN.md): wide Archivo headings, Inter text, real screenshots
// in the site's browser frames with the demo's own addresses, ink caption tags (an orange dot for
// the guest site, amber for the control panel), and the logo's bars only where they mark three
// things in order: the collections, the steps and the track record.
//
//   node scripts/capture-marketplace-panels.mjs   (with the site running: npm run dev)
//   node scripts/build-marketplace.mjs            (or `… 05` for one slide, `… product`)
//
// In:  public/home/*.webp         the home page's captures of the demo hotel and its control panel
//      brand/statamic/screens/    Marketplace-only captures, and the home page's redrawn panels
//                                 (site-*.webp, from capture-marketplace-panels.mjs)
// Out: brand/statamic/marketplace/product-image-1280.png and 01-…08-*.png at 2400 × 1600
//
// Slides are laid out at 1200 × 800 CSS px and rendered at 2x. The Marketplace shows screenshots
// at up to 1280 px wide, so 2400 stays sharp on high-density screens.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { demoUrl, demoCpUrl } from '../site.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAND = path.join(ROOT, 'brand');
const HOME = path.join(ROOT, 'public', 'home');
const SCREENS = process.env.SCREENS ?? path.join(BRAND, 'statamic', 'screens');
const OUT = process.env.OUT ?? path.join(BRAND, 'statamic', 'marketplace');

const C = { ink: '#171718', orange: '#F56B3C', amber: '#F8AD22', deep: '#C4461B', body: '#5C5C63' };
const TAGLINE = 'Booking system for Statamic';
const host = (url) => new URL(url).host;

const b64 = (buf) => Buffer.from(buf).toString('base64');
const dataURL = async (file, type) => `data:${type};base64,${b64(await fs.readFile(file))}`;

// Archivo from the brand kit for headings, and the site's Inter (latin, 400 to 700) for text.
let fonts;
async function fontCSS() {
  if (!fonts) {
    const archivo = await dataURL(path.join(BRAND, 'font', 'Archivo[wdth,wght].ttf'), 'font/ttf');
    const inter = await dataURL(path.join(BRAND, 'statamic', 'font', 'Inter-latin.woff2'), 'font/woff2');
    fonts = `@font-face{font-family:"Archivo";src:url(${archivo}) format("truetype");font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:"Inter";src:url(${inter}) format("woff2");font-weight:400 700}`;
  }
  return fonts;
}

const sizeCache = new Map();
function size(file) {
  if (!sizeCache.has(file)) {
    const [w, h] = execFileSync('magick', ['identify', '-format', '%w %h', file]).toString().split(' ').map(Number);
    sizeCache.set(file, { w, h });
  }
  return sizeCache.get(file);
}

// A capture by name: "home/…" is one of the home page's in public/home, anything else is in SCREENS.
const source = (name) => (name.startsWith('home/') ? path.join(HOME, `${name.slice(5)}.webp`) : path.join(SCREENS, `${name}.webp`));

// An image shown `w` px wide, cropped to `crop` ({ x, y, w, h } in the image's own pixels) if given.
async function pic(name, w, crop) {
  const file = source(name);
  const s = size(file);
  const c = crop ?? { x: 0, y: 0, w: s.w, h: s.h };
  const k = w / c.w;
  const h = Math.round(c.h * k);
  const style = `width:${(s.w * k).toFixed(2)}px;left:${(-c.x * k).toFixed(2)}px;top:${(-c.y * k).toFixed(2)}px`;
  return { h, html: `<div class="pic" style="width:${w}px;height:${h}px"><img src="${await dataURL(file, 'image/webp')}" style="${style}" alt=""></div>` };
}

// Placed at x/y on the slide, or in the flow of a stack when they're left out.
const at = ({ x, y, z }) => (x == null ? '' : `position:absolute;left:${x}px;top:${y}px;`) + (z ? `z-index:${z};` : '');

const LOCK = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';

// The ink caption tag that hangs off a frame's bottom edge: [text, "site" | "cp"].
const caption = (cap, side) => (cap ? `<figcaption class="${side}"><span class="dot ${cap[1]}"></span>${cap[0]}</figcaption>` : '');

// The site's browser frame: a chrome bar with the demo's address, then the screen (an image, or
// `body` HTML `bodyH` px tall).
async function frame({ name, w, crop, url, cap, side = 'left', bg, body, bodyH, ...pos }) {
  const inner = body ? { html: `<div class="body" style="height:${bodyH}px">${body}</div>` } : await pic(name, w - 2, crop);
  return `<figure class="shot" style="${at(pos)}width:${w}px"><div class="frame"${bg ? ` style="background:${bg}"` : ''}>`
    + `<div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="address">${LOCK}${url}</span></div>`
    + `${inner.html}</div>${caption(cap, side)}</figure>`;
}

// A part of a page without browser chrome, such as a summary or a pop-up, lifted like a frame.
async function card({ name, w, crop, cap, side = 'left', bg, ...pos }) {
  const inner = await pic(name, w - 2, crop);
  return `<figure class="shot" style="${at(pos)}width:${w}px"><div class="frame"${bg ? ` style="background:${bg}"` : ''}>${inner.html}</div>${caption(cap, side)}</figure>`;
}

// One of the home page's redrawn control panel panels, with the panel card shadow.
const panel = async (name, w) => `<div class="panel">${(await pic(name, w)).html}</div>`;

const CSS = `
:root{--ink:${C.ink};--orange:${C.orange};--amber:${C.amber};--deep:${C.deep};--muted:${C.body};
  --line:oklch(0.88 0.006 260 / 0.72);--band:#f7f7f7;
  --lift:0 1px 2px rgb(23 23 24 / .06),0 28px 56px -28px rgb(23 23 24 / .32)}
*{box-sizing:border-box}
html,body{margin:0}
.ab{position:relative;overflow:hidden;background:#fff;color:var(--ink);font-family:"Inter",sans-serif}
.slide{width:1200px;height:800px;-webkit-font-smoothing:antialiased}
.h{font-family:"Archivo",sans-serif;font-weight:750;font-stretch:115%;font-size:54px;line-height:1.04;letter-spacing:-.025em;margin:0;text-wrap:balance}
.p{font-size:21px;line-height:1.55;color:var(--muted);margin:20px 0 0;text-wrap:pretty}
.txt{position:absolute;left:72px;top:88px;width:440px}
.stack{position:absolute;left:72px;top:64px;width:1056px;display:flex;flex-direction:column}
.stack .p{max-width:1010px;margin-top:16px}
.pic{position:relative;overflow:hidden}
.pic img{position:absolute;top:0;left:0;display:block;max-width:none}
.shot{position:relative;margin:0}
.frame{overflow:hidden;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:var(--lift)}
.bar{display:flex;align-items:center;gap:12px;height:34px;padding:0 13px;border-bottom:1px solid var(--line);background:var(--band)}
.dots{display:flex;gap:6px}
.dots i{width:10px;height:10px;border-radius:50%;background:color-mix(in oklab,var(--ink) 16%,transparent)}
.address{display:inline-flex;align-items:center;gap:6px;margin-inline:auto;padding:3px 12px;border-radius:999px;background:#fff;color:var(--muted);font-size:12.5px;font-weight:500;white-space:nowrap}
.body{display:grid;place-items:center;background:#f5f5f5}
figcaption{position:absolute;bottom:0;translate:0 50%;display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:8px;background:var(--ink);color:#fff;font-size:15px;font-weight:600;white-space:nowrap;box-shadow:0 6px 16px -8px rgb(0 0 0 / .5)}
figcaption.left{left:14px}
figcaption.right{right:14px}
.dot{width:11px;height:11px;border-radius:2px}
.dot.site{background:var(--orange)}
.dot.cp{background:var(--amber)}
.panel{border-radius:10px;box-shadow:0 1px 2px rgb(0 0 0 / .05),0 14px 30px -20px rgb(0 0 0 / .35)}
.cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;align-items:start;margin:0;padding:0;list-style:none}
.cols .t{font-family:"Archivo",sans-serif;font-weight:650;font-stretch:108%;font-size:22px;letter-spacing:-.01em;line-height:1.2}
.cols .s{margin-top:5px;font-size:16px;line-height:1.5;color:var(--muted)}
.cols .panel{margin-top:16px}
.cap{display:block;width:56px;height:10px;margin-bottom:14px;border-radius:999px}
.b1{background:var(--orange)}.b2{background:var(--amber)}.b3{background:var(--ink)}
.track{position:relative;height:52px}
.track i{position:absolute;height:12px;border-radius:999px}
.track i:nth-child(1){top:0;left:0;width:44%;background:var(--orange)}
.track i:nth-child(2){top:20px;left:calc(100% / 3 + 8px);width:44%;background:var(--amber)}
.track i:nth-child(3){top:40px;left:calc(200% / 3 + 16px);width:calc(100% / 3 - 16px);background:var(--ink)}
.num{display:inline-grid;place-items:center;width:36px;height:36px;margin-bottom:14px;border-radius:9px;font-family:"Archivo",sans-serif;font-stretch:112%;font-weight:800;font-size:19px}
.num.b3{color:#fff}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:28px}
.chips span{padding:7px 13px;border:1px solid oklch(0.85 0.006 260);border-radius:8px;font-size:16px;font-weight:600}
.chips small{margin-left:6px;color:var(--muted);font-weight:500;font-size:14px}
.go{display:inline-flex;align-items:center;gap:6px;margin-top:22px;color:var(--deep);font-size:22px;font-weight:600}
.facts{position:absolute;left:72px;bottom:68px;display:grid;gap:22px;width:404px;margin:0;padding:0;list-style:none}
.facts li{font-family:"Archivo",sans-serif;font-weight:750;font-stretch:115%;font-size:22px;line-height:1.12;letter-spacing:-.02em}
.facts .cap{width:100px;margin-bottom:10px}
.facts .cap.short{width:64px}
.product{width:1280px;height:1280px;font-family:"Archivo",sans-serif}
.product .logo{position:absolute;left:230px;top:282px;width:820px}
.product .tagline{position:absolute;left:0;right:0;top:902px;text-align:center;font-weight:600;font-stretch:112%;font-size:50px;color:var(--muted)}
.product .rule{position:absolute;left:0;right:0;bottom:0;height:18px;background:linear-gradient(90deg,var(--orange),var(--amber))}
`;

// Text on the left, screens on the right.
const side = (h, p, extra = '') => `<div class="txt"><h1 class="h">${h}</h1><p class="p">${p}</p>${extra}</div>`;

// The demo's three collections and their week of 13 December, as on the home page.
const COLLECTIONS = [
  { title: 'Rooms', text: 'Sea View Suite, booked by the night', panel: 'site-week-rooms' },
  { title: 'Spa Treatments', text: 'Mediterranean Massage, booked by the day', panel: 'site-week-spa' },
  { title: 'Restaurant', text: 'La Marea, booked by the sitting', panel: 'site-week-restaurant' },
];

const STEPS = [
  { title: 'Add the Availability field', text: "In a collection's blueprint, add a field and pick Resrv Availability.", panel: 'site-step-field' },
  { title: 'Set availability and prices', text: "Fill each entry's calendar, and add rates for room types or pricing tiers.", panel: 'site-step-rates' },
  { title: 'Add the Livewire components', text: 'Put the search, results and checkout components in your templates.', panel: 'site-step-code' },
];

const site = (p) => `${host(demoUrl)}${p}`;
const cp = (p) => `${host(demoCpUrl)}${new URL(demoCpUrl).pathname}${p}`;

// Every claim here comes from the home page and the docs: keep them in step. Positions are in the
// 1200 × 800 layout.
const SLIDES = [
  {
    file: '01-any-entry.png',
    body: async () => {
      const cols = [];
      for (const [i, c] of COLLECTIONS.entries()) {
        cols.push(`<li><i class="cap b${i + 1}"></i><div class="t">${c.title}</div><div class="s">${c.text}</div>${await panel(c.panel, 336)}</li>`);
      }
      return `<div class="stack">
        <h1 class="h">Make any Statamic entry bookable</h1>
        <p class="p">Add the Availability field to a collection's blueprint, and each of its entries gets its own availability and prices. The demo hotel does it for rooms, spa treatments and restaurant tables.</p>
        <ol class="cols" style="margin-top:36px">${cols.join('')}</ol>
        <div style="margin-top:40px">${await frame({ name: 'home/cp-calendar-light', w: 1056, url: cp('/resrv/reservations/calendar'), cap: ['Every booking on one calendar', 'cp'] })}</div>
      </div>`;
    },
  },
  {
    file: '02-three-steps.png',
    body: async () => {
      const cols = [];
      for (const [i, s] of STEPS.entries()) {
        cols.push(`<li><span class="num b${i + 1}">${i + 1}</span><div class="t">${s.title}</div><div class="s">${s.text}</div>${await panel(s.panel, 336)}</li>`);
      }
      return `<div class="stack">
        <h1 class="h">From entry to booking in three steps</h1>
        <p class="p">Resrv builds on Statamic's entries, blueprints and forms, so it fits into a site you already have.</p>
        <div class="track" style="margin-top:36px"><i></i><i></i><i></i></div>
        <ol class="cols" style="margin-top:20px">${cols.join('')}</ol>
      </div>`;
    },
  },
  {
    file: '03-availability.png',
    body: async () => side('Set availability and prices for every day', "Each entry gets its own calendar in the control panel. Guests see each day's price while they pick their dates.")
      + await frame({ name: 'cp-entry-availability', w: 548, crop: { x: 0, y: 0, w: 1552, h: 1240 }, url: cp('/collections/rooms/entries/sea-view-suite'), cap: ['In the control panel', 'cp'], side: 'right', x: 580, y: 72 })
      + await card({ name: 'front-datepicker-prices', w: 400, cap: ['On the spa page', 'site'], side: 'right', x: 520, y: 452, z: 2 }),
  },
  {
    file: '04-checkout.png',
    body: async () => side('Extras, discounts and payments',"Guests add extras like an airport transfer, choose options like breakfast and apply a coupon. You build the form in Statamic's form builder.",
      '<div class="chips"><span>Stripe</span><span>Bank transfer</span><span>Mollie<small>add-on</small></span><span>Your own gateway</span></div>')
      + await frame({ name: 'home/checkout-extras', w: 560, url: site('/checkout'), bg: '#f3eee6', cap: ['Extras and options', 'site'], x: 544, y: 72 })
      + await card({ name: 'home/checkout-summary', w: 300, x: 828, y: 250, z: 2 }),
  },
  {
    file: '05-reservations.png',
    body: async () => side('Every booking in the control panel', 'Reservations live in Statamic next to your content, so your client manages them with the login they already have.')
      + await frame({ name: 'home/hero-cp-light', w: 900, crop: { x: 0, y: 0, w: 1600, h: 712 }, url: cp('/resrv/reservations'), cap: ['You manage bookings in Statamic', 'cp'], x: 548, y: 172 }),
  },
  {
    file: '06-manual-reservations.png',
    body: async () => side('Book by phone and email a payment link', 'Create a reservation in the control panel, ask for a deposit or set a payment deadline, and Resrv emails the customer a link to pay.')
      + await frame({ name: 'home/cp-create-light', w: 560, crop: { x: 0, y: 0, w: 1300, h: 1267 }, url: cp('/resrv/reservations/create'), cap: ['Create reservation', 'cp'], x: 536, y: 72 })
      + await card({ name: 'home/cp-create-light', w: 300, crop: { x: 1230, y: 144, w: 510, h: 1010 }, x: 828, y: 150, z: 2 }),
  },
  {
    file: '07-frontend.png',
    body: async () => side('Search and checkout on your own site', 'Livewire components handle the search, the results and the checkout. Publish their Blade views to change any part, and style them with Tailwind.')
      + await frame({ name: 'home/hero-site', w: 580, url: site('/rooms'), cap: ['Guests book on your site', 'site'], x: 548, y: 72 })
      + await card({ name: 'home/room-rates', w: 270, x: 858, y: 250, z: 2 }),
  },
  {
    file: '08-demo.png',
    body: async () => {
      const login = await pic('site-login', 250);
      return side('Try it on the Resrv Hotel', 'Book a room, a spa treatment or a dinner table, then log in to the control panel and find your booking.',
        `<div class="go">${host(demoUrl)}${ARROW}</div>`)
        + `<ul class="facts"><li><i class="cap b1"></i>5 years in production</li><li><i class="cap b2"></i>Thousands of bookings processed</li><li><i class="cap b3 short"></i>Millions in revenue generated</li></ul>`
        + await frame({ name: 'home/demo-hotel', w: 580, url: site(''), cap: ['Book on the hotel site', 'site'], x: 548, y: 72 })
        + await frame({ w: 440, url: cp(''), body: `<div class="panel">${login.html}</div>`, bodyH: 262, cap: ['Log in to the control panel', 'cp'], side: 'right', x: 688, y: 462, z: 2 });
    },
  },
];

async function render(page, html, w, h, file, scale) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${await fontCSS()}${CSS}</style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, file), clip: { x: 0, y: 0, width: w, height: h } });
  console.log(`${file}: ${w * scale} × ${h * scale}`);
}

async function main() {
  const only = process.argv.slice(2);
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  const one = await browser.newPage({ deviceScaleFactor: 1 });
  if (!only.length || only.includes('product')) {
    const logo = await dataURL(path.join(BRAND, 'logo', 'svg', 'resrv-logo-stacked-color.svg'), 'image/svg+xml');
    await render(one, `<div class="ab product"><img class="logo" src="${logo}" alt="Resrv"><div class="tagline">${TAGLINE}</div><div class="rule"></div></div>`, 1280, 1280, 'product-image-1280.png', 1);
  }

  const two = await browser.newPage({ deviceScaleFactor: 2 });
  for (const s of SLIDES) {
    if (only.length && !only.some((o) => s.file.startsWith(o))) continue;
    await render(two, `<div class="ab slide">${await s.body()}</div>`, 1200, 800, s.file, 2);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
