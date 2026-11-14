// Recapture the two screenshots on the Rates docs page at 2x (Statamic 6 / Resrv v6).
//
//   1) resrv-rates-list.webp  - Resrv > Rates: collection picker + two-level rate tree
//   2) resrv-rates-panel.webp - the Edit rate slide-over (General/Pricing/Availability/Restrictions)
//
// Run:  node scripts/recapture-rates-2x.mjs
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { png, toWebp, snooze } from './shot-utils.mjs';

// Tall viewport so the rate panel's sections are visible without scrolling.
const { ctx, page } = await launchCP({ width: 1440, height: 2650 });

// ============ 1) RATES LIST ============
console.log('Capturing rates list...');
await page.goto(`${CP_BASE}/cp/resrv/rates`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await snooze(page);

const listClip = await page.evaluate(() => {
  const h = document.querySelector('.main-content h1');
  const hr = h.getBoundingClientRect();
  const add = [...document.querySelectorAll('button')].find((b) => /Add rate/.test(b.textContent));
  const right = add.getBoundingClientRect().right;
  const last = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Last-Minute Escape');
  let row = last;
  while (row && row.getBoundingClientRect().width < 700) row = row.parentElement;
  const bottom = row.getBoundingClientRect().bottom;
  const x = Math.round(hr.left - 28);
  return { x, y: Math.round(hr.top - 28), width: Math.round(right + 28 - x), height: Math.round(bottom + 36 - (hr.top - 28)) };
});
await page.screenshot({ path: png('resrv-rates-list'), clip: listClip });

// ============ 2) RATE PANEL ============
console.log('Capturing rate panel...');
await page.getByText('Bed & Breakfast', { exact: true }).first().click();
await page.getByText('Edit rate', { exact: true }).waitFor({ timeout: 8000 });
await page.waitForTimeout(1200);

const panelClip = await page.evaluate(() => {
  const title = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Edit rate');
  let panel = title;
  while (panel && panel.getBoundingClientRect().width < 900) panel = panel.parentElement;
  const p = panel.getBoundingClientRect(); // header bar: gives the slide-over's x/width
  // bottom of the Restrictions card: climb from the "Max stay" label to a wide card
  const ms = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Max stay');
  let card = ms;
  while (card && card.getBoundingClientRect().width < 1000) card = card.parentElement;
  const bottom = card.getBoundingClientRect().bottom;
  return { x: Math.round(p.left + 2), y: Math.round(p.top + 2), width: Math.round(p.width - 4), height: Math.round(bottom + 24 - p.top) };
});
await page.screenshot({ path: png('resrv-rates-panel'), clip: panelClip });

await ctx.close();

console.log('Converting to webp...');
['resrv-rates-list', 'resrv-rates-panel'].forEach(toWebp);
console.log('Done. Updated 2 files in public/img/');
