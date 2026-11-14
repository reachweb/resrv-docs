// Builds the Statamic Marketplace images in the "Daylight" style: white canvas, ink type in
// Archivo, the darker orange for labels, real screenshots with soft shadows, and the logo's
// three bars as a quiet signature.
//
//   node scripts/build-marketplace.mjs
//
// In:  brand/statamic/screens/*.webp (cropped captures from the demo hotel and its control panel)
// Out: brand/statamic/marketplace/product-image-1280.png and 01-…08-*.png at 2400 × 1600
//
// Slides are laid out at 1200 × 800 CSS px and rendered at 2x. The Marketplace shows screenshots
// at up to 1280 px wide, so 2400 stays sharp on high-density screens.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAND = path.join(ROOT, 'brand');
const SCREENS = process.env.SCREENS ?? path.join(BRAND, 'statamic', 'screens');
const OUT = process.env.OUT ?? path.join(BRAND, 'statamic', 'marketplace');

const C = { ink: '#171718', orange: '#F56B3C', amber: '#F8AD22', label: '#C4461B', body: '#5C5C63', line: '#E4E4E7' };
const TAGLINE = 'Booking system for Statamic';

const b64 = (buf) => Buffer.from(buf).toString('base64');
const dataURL = async (file, type) => `data:${type};base64,${b64(await fs.readFile(file))}`;

async function fontCSS() {
  const font = await dataURL(path.join(BRAND, 'font', 'Archivo[wdth,wght].ttf'), 'font/ttf');
  return `@font-face{font-family:"Archivo";src:url(${font}) format("truetype");font-weight:100 900;font-stretch:62% 125%}`;
}

const sizeCache = new Map();
function size(file) {
  if (!sizeCache.has(file)) {
    const [w, h] = execFileSync('magick', ['identify', '-format', '%w %h', file]).toString().split(' ').map(Number);
    sizeCache.set(file, { w, h });
  }
  return sizeCache.get(file);
}

// A screenshot placed by its left/top and either its height or its width (the other follows
// the image's proportions).
async function shot(name, { x, y, w, h, alt = '', cls = '' }) {
  const file = path.join(SCREENS, `${name}.webp`);
  const s = size(file);
  const width = w ?? Math.round((h * s.w) / s.h);
  const height = h ?? Math.round((w * s.h) / s.w);
  return `<div class="shot ${cls}" style="left:${x}px;top:${y}px;width:${width}px;height:${height}px"><img src="${await dataURL(file, 'image/webp')}" alt="${alt}"></div>`;
}

const bars = (style) => `<div class="bars" style="${style}"><i></i><i></i><i></i></div>`;

const CSS = `
html,body{margin:0}
.ab{position:relative;overflow:hidden;background:#fff;color:${C.ink};font-family:"Archivo",sans-serif}
.slide{width:1200px;height:800px}
.eyebrow{font-weight:600;font-size:19px;letter-spacing:.16em;text-transform:uppercase;color:${C.label}}
.h{font-weight:700;font-stretch:112%;font-size:58px;line-height:1.04;letter-spacing:-.012em;margin:18px 0 22px;text-wrap:balance}
.p{font-size:24px;line-height:1.45;color:${C.body}}
.txt{position:absolute;left:72px;top:92px;width:440px}
.txt.top{width:860px;top:64px}
.txt.top .h{margin:14px 0 12px}
.shot{position:absolute;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 0 0 1px ${C.line},0 34px 70px -28px rgba(23,23,24,.35),0 4px 10px rgba(23,23,24,.05)}
.shot img{display:block;width:100%;height:100%}
.shot.phone{border-radius:34px;border:7px solid ${C.ink};box-shadow:0 34px 70px -28px rgba(23,23,24,.45)}
.shot.phone img{border-radius:27px}
.bars{position:absolute;display:grid;gap:14px}
.bars i{display:block;height:30px;border-radius:15px}
.bars i:nth-child(1){width:300px;background:${C.orange}}
.bars i:nth-child(2){width:310px;margin-left:90px;background:${C.amber}}
.bars i:nth-child(3){width:250px;margin-left:180px;background:${C.ink}}
.facts{position:absolute;display:flex;flex-wrap:wrap;gap:10px}
.facts span{font-size:18px;font-weight:600;padding:9px 15px;border-radius:999px;background:#F4F4F5;color:${C.ink}}
.product{width:1280px;height:1280px}
.product .logo{position:absolute;left:230px;top:282px;width:820px}
.product .tagline{position:absolute;left:0;right:0;top:902px;text-align:center;font-weight:600;font-stretch:112%;font-size:50px;color:${C.body}}
.product .rule{position:absolute;left:0;right:0;bottom:0;height:18px;background:linear-gradient(90deg,${C.orange},${C.amber})}
`;

// Text on the left, screenshots on the right, the bars under the text.
const side = (t, visuals) => `<div class="txt"><div class="eyebrow">${t.eb}</div><div class="h">${t.h}</div><div class="p">${t.p}</div></div>${bars('left:72px;bottom:72px')}${visuals}`;
// Text across the top, a wide screenshot below it, small bars in the top right corner.
const top = (t, visuals) => `<div class="txt top"><div class="eyebrow">${t.eb}</div><div class="h">${t.h}</div><div class="p">${t.p}</div></div>${bars('right:72px;top:72px;transform:scale(.6);transform-origin:100% 0')}${visuals}`;

// Every claim here comes from the docs: keep them in step. Positions are in the 1200 × 800 layout.
const SLIDES = [
  {
    file: '01-availability.png',
    body: async () => side(
      { eb: 'Availability & rates', h: 'Set availability and prices for every day', p: 'Each entry gets its own calendar in the control panel. Guests see the price of every night while they pick their dates.' },
      (await shot('cp-entry-availability', { x: 556, y: 72, h: 600, alt: 'Availability calendar of a room in the control panel, with a price on every day' })) +
      (await shot('front-datepicker-prices', { x: 700, y: 456, w: 440, alt: 'Date picker on the hotel site with a price under every day' })),
    ),
  },
  {
    file: '02-frontend.png',
    body: async () => side(
      { eb: 'Your website', h: 'Search and checkout, ready to use', p: 'Livewire components handle the search, the results and the checkout. Publish their views and style them to match your site.' },
      (await shot('front-search-results', { x: 556, y: 72, w: 572, alt: 'Search results on the hotel site, with prices for the chosen dates' })) +
      (await shot('front-room-rates', { x: 896, y: 300, h: 440, alt: 'A room\'s rates for the chosen dates' })),
    ),
  },
  {
    file: '03-checkout.png',
    body: async () => side(
      { eb: 'Checkout', h: 'Extras, options and coupons', p: 'Guests add extras like breakfast or a transfer, pick options and apply a coupon. The checkout form is a Statamic form you control.' },
      (await shot('front-checkout-extras', { x: 556, y: 72, w: 480, alt: 'Checkout step with options and extras' })) +
      (await shot('front-checkout-summary', { x: 768, y: 318, h: 420, alt: 'Booking summary with a coupon applied' })),
    ),
  },
  {
    file: '04-payments.png',
    body: async () => side(
      { eb: 'Payments', h: 'Take payments your way', p: 'Stripe for cards, bank transfer or pay on arrival, and Mollie. Offer more than one at checkout, or write your own gateway.' },
      (await shot('front-mobile-checkout', { x: 896, y: 72, h: 520, cls: 'phone', alt: 'The checkout on a phone' })) +
      (await shot('front-checkout-payment', { x: 556, y: 372, w: 520, alt: 'Payment step of the checkout on the hotel site' })),
    ),
  },
  {
    file: '05-reservations.png',
    body: async () => top(
      { eb: 'Reservations', h: 'Every booking in one place', p: 'Filter, export and refund reservations, see them on a calendar, and check revenue and best sellers in Reports.' },
      (await shot('cp-reservations', { x: 72, y: 264, w: 1000, alt: 'Reservations list in the control panel' })) +
      (await shot('cp-reports', { x: 668, y: 532, w: 460, alt: 'Reports with reservations, revenue and outstanding payments' })),
    ),
  },
  {
    file: '06-rates-pricing.png',
    body: async () => top(
      { eb: 'Rates & pricing', h: 'One room, several rates', p: 'Standard, non-refundable or with breakfast, all sharing one inventory. Dynamic pricing adds discounts, increases and coupons on top.' },
      (await shot('cp-rates', { x: 72, y: 264, w: 1000, alt: 'Rates in the control panel, with derived rates under their base rate' })) +
      (await shot('cp-dynamic-pricing', { x: 608, y: 560, w: 520, alt: 'Dynamic pricing campaigns and a coupon' })),
    ),
  },
  {
    file: '07-manual-reservations.png',
    body: async () => side(
      { eb: 'Bookings by phone', h: 'Book on behalf of your customers', p: 'Create a reservation in the control panel, set a deposit or a payment deadline, and Resrv emails the customer a link to pay.' },
      (await shot('cp-manual-create', { x: 556, y: 72, w: 572, alt: 'Creating a reservation in the control panel' })) +
      (await shot('cp-calendar', { x: 712, y: 420, w: 428, alt: 'Reservations calendar, with bookings awaiting payment' })),
    ),
  },
  {
    file: '08-demo.png',
    body: async () => side(
      { eb: 'See it live', h: 'Try the demo hotel', p: 'Book a room, a spa treatment or a dinner table on the demo site, then log in to its control panel and see the reservation arrive.' },
      (await shot('front-home-hero', { x: 556, y: 72, w: 572, alt: 'The demo hotel site' })) +
      (await shot('cp-reservations-dark', { x: 596, y: 436, w: 544, alt: 'The demo control panel in dark mode' })),
    ).replace(bars('left:72px;bottom:72px'), `<div class="facts" style="left:72px;bottom:72px;width:440px"><span>Statamic 6</span><span>Livewire</span><span>Docs at resrv.dev</span></div>`),
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
