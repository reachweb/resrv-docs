// Recapture the home page's Reservations list and Reports, in light and dark:
//
//   public/home/hero-cp-{light,dark}.webp     the hero's control panel, 1600 x 752
//   public/home/cp-list-{light,dark}.webp     the viewer's Reservations tab, 1800 wide
//   public/home/cp-reports-{light,dark}.webp  the viewer's Reports tab (2026), 1800 x 1267
//
// The list starts with the three December bookings the collections band shows on the calendar
// (scripts/make-collection-bookings.mjs), so every screenshot tells the same story. Refund any
// test reservations first: the list only shows confirmed, partner and awaiting-payment ones,
// and Reports counts every confirmed one.
//
// All three are taken at the CP's 1440 layout and scaled to the sizes above, the scale the phone
// crops in pages/index.astro are measured against. The hero is the top of the whole window; the
// viewer's screens are the content card. The local install's "Pro – Trial Mode" label is hidden:
// it comes from the testbed's license, not from Resrv.
//
// Run:  node scripts/recapture-home-reservations-2x.mjs
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { png, snooze, TMP } from './shot-utils.mjs';

const HOME = path.resolve('public/home');
const YEAR = '2026';

const toHome = (name, width, height = 0) =>
  execFileSync('cwebp', ['-q', '92', '-resize', String(width), String(height), png(name), '-o', path.join(HOME, `${name}.webp`)], {
    stdio: 'ignore',
  });

async function open(page, cpPath) {
  await page.goto(`${CP_BASE}/cp/resrv/${cpPath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snooze(page);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length || !/Trial Mode/.test(el.textContent)) continue;
      // Hide the label's whole badge, so no gap is left beside "Statamic"
      let badge = el;
      while (badge.parentElement && badge.parentElement.textContent.trim() === el.textContent.trim()) badge = badge.parentElement;
      badge.style.display = 'none';
    }
    document.activeElement?.blur();
  });
  await page.mouse.move(5, 5);
  await page.waitForTimeout(600);
}

// The content card, from its top down to a fixed height or to just below the list's table
const card = (page, height) =>
  page.evaluate((height) => {
    const box = document.querySelector('.content-card').getBoundingClientRect();
    let bottom = box.top + height;
    if (!height) {
      const col = document.querySelector('.max-w-page').getBoundingClientRect();
      // The table scrolls sideways inside a wrapper as wide as the content column
      let wrap = document.querySelector('table');
      while (wrap && wrap.getBoundingClientRect().width > col.width + 8) wrap = wrap.parentElement;
      bottom = wrap.getBoundingClientRect().bottom + 29;
    }
    return { x: Math.round(box.left), y: Math.round(box.top), width: Math.round(box.width), height: Math.round(bottom - box.top) };
  }, height);

// The light list sets the height, so the light and dark versions share one size
let listHeight;

for (const theme of ['light', 'dark']) {
  console.log(`Capturing the Reservations list, Reports and the hero (${theme})...`);
  const { ctx, page } = await launchCP({ width: 1440, height: 1500, colorScheme: theme, headless: true });

  await open(page, 'reservations');
  await page.screenshot({ path: png(`hero-cp-${theme}`), clip: { x: 0, y: 0, width: 1440, height: 677 } });
  const list = await card(page);
  listHeight ??= list.height;
  await page.screenshot({ path: png(`cp-list-${theme}`), clip: { ...list, height: listHeight } });

  await open(page, `reports?start=${YEAR}-01-01&end=${YEAR}-12-31&date_field=date_start`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: png(`cp-reports-${theme}`), clip: await card(page, 873) });

  await ctx.close();
  toHome(`hero-cp-${theme}`, 1600, 752);
  toHome(`cp-list-${theme}`, 1800);
  toHome(`cp-reports-${theme}`, 1800);
}

rmSync(TMP, { recursive: true, force: true });
console.log('Done. Check the width and height attributes and the alt text in pages/index.astro.');
