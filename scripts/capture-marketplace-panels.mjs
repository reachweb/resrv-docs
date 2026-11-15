// Captures the home page's redrawn control panel panels for the Statamic Marketplace images, so
// the slides show the same panels, names and numbers as the site.
//
//   npm run dev                                   (in another terminal)
//   node scripts/capture-marketplace-panels.mjs
//
// In:  the running home page (SITE, default http://localhost:4321), in its light theme
// Out: brand/statamic/screens/site-*.webp at 3x, with transparent corners
//
// Run it again whenever those panels change on the home page, then rebuild the slides with
// node scripts/build-marketplace.mjs.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = process.env.SITE ?? 'http://localhost:4321';
const OUT = process.env.OUT ?? path.join(ROOT, 'brand', 'statamic', 'screens');

const PANELS = [
  // The three collections band: each collection's Availability field for the week of 13 December
  { file: 'site-week-rooms', selector: '.collection:nth-child(1) .cp-card' },
  { file: 'site-week-spa', selector: '.collection:nth-child(2) .cp-card' },
  { file: 'site-week-restaurant', selector: '.collection:nth-child(3) .cp-card' },
  // The three steps: the fieldtype picker, the Rooms rates and the Livewire tags
  { file: 'site-step-field', selector: '.step:nth-child(1) .step-visual > *' },
  { file: 'site-step-rates', selector: '.step:nth-child(2) .step-visual > *' },
  { file: 'site-step-code', selector: '.step:nth-child(3) .step-visual > *' },
  // The demo's control panel door: the sign-in card with the demo login
  { file: 'site-login', selector: '.login-card' },
];

// Clear the backgrounds behind the panels, so their rounded corners come out transparent.
const CLEAR = `html, body, main, section, .section, .tinted, .demo, .step, .step-visual, .collection,
  .door, .door-media, .login { background: transparent !important; }`;

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3, colorScheme: 'light' });
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.addStyleTag({ content: CLEAR });
  await page.evaluate(() => document.fonts.ready);

  for (const { file, selector } of PANELS) {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    const png = path.join(OUT, `${file}.png`);
    await el.screenshot({ path: png, omitBackground: true, animations: 'disabled' });
    const webp = path.join(OUT, `${file}.webp`);
    execFileSync('magick', [png, '-define', 'webp:lossless=true', webp]);
    await fs.rm(png);
    const [w, h] = execFileSync('magick', ['identify', '-format', '%w %h', webp]).toString().split(' ');
    console.log(`${file}.webp: ${w} × ${h}`);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
