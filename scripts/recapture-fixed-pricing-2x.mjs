// Recapture resrv-fixed-pricing.webp at 2x (Statamic 6 / Resrv v6).
//
// Prerequisite: the rooms blueprint temporarily contains a resrv_fixed_pricing
// field (added directly in the testbed's room.yaml; restored via git afterwards).
// Fixed-pricing rows are Resrv data saved via the panel; this script creates the
// doc's example rows (2d/60, 3d/80, 4d/100, extra day 15), screenshots the field,
// then DELETES the rows again so the testbed pricing is unchanged.
//
// Run:  node scripts/recapture-fixed-pricing-2x.mjs
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { png, toWebp, snooze, fillByLabel } from './shot-utils.mjs';

const { ctx, page } = await launchCP({ width: 1440, height: 1800 });

await page.goto(`${CP_BASE}/cp/collections/rooms/entries/garden-view-double`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);
await snooze(page);
await page.getByText('Booking', { exact: true }).first().click();
await page.waitForTimeout(1200);
await page.getByRole('button', { name: 'Add fixed pricing' }).scrollIntoViewIfNeeded();

async function addRow(days, price) {
  await page.getByRole('button', { name: 'Add fixed pricing' }).click();
  await page.getByText('Fixed pricing', { exact: true }).first().waitFor({ timeout: 8000 });
  await page.waitForTimeout(600);
  await fillByLabel(page, 'Days', String(days));
  await fillByLabel(page, 'Price', String(price));
  await page.getByRole('button', { name: 'Save', exact: true }).last().click();
  await page.waitForTimeout(1200);
}

console.log('Adding fixed pricing rows...');
await addRow(2, 60);
await addRow(3, 80);
await addRow(4, 100);
console.log('Adding extra day price...');
await page.getByRole('button', { name: 'Add extra day price' }).click();
await page.waitForTimeout(800);
await fillByLabel(page, 'Price', '15');
await page.getByRole('button', { name: 'Save', exact: true }).last().click();
await page.waitForTimeout(1200);

console.log('Capturing...');
await page.evaluate(() => document.activeElement?.blur());
await page.evaluate(() => {
  const sc = document.querySelector('.main-content');
  const el = [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Resrv Fixed Pricing');
  sc.scrollTop += el.getBoundingClientRect().top - 120;
});
await page.waitForTimeout(800);
await page.screenshot({ path: '.tmp-shots/fp-filled.png' });

const clip = await page.evaluate(() => {
  const sc = document.querySelector('.main-content');
  const lbl = [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Resrv Fixed Pricing');
  const lr = lbl.getBoundingClientRect();
  const btns = [...sc.querySelectorAll('button')].filter((b) => /Add fixed pricing|Add extra day price/.test(b.textContent));
  const bottom = Math.max(...btns.map((b) => b.getBoundingClientRect().bottom));
  // width: match the options card above for consistent framing
  const opt = [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Breakfast');
  let card = opt;
  while (card && card.getBoundingClientRect().width < 500) card = card.parentElement;
  const cr = card.getBoundingClientRect();
  const x = Math.round(lr.left - 20);
  return { x, y: Math.round(lr.top - 16), width: Math.round(cr.right + 20 - x), height: Math.round(bottom + 20 - (lr.top - 16)) };
});
await page.screenshot({ path: png('resrv-fixed-pricing'), clip });

// ---- clean up the created rows so testbed pricing is unchanged ----
console.log('Deleting the fixed pricing rows again...');
console.log(await page.evaluate(() => {
  const sc = document.querySelector('.main-content');
  const lbl = [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Resrv Fixed Pricing');
  let sec = lbl;
  while (sec && !/Add extra day price/.test(sec.textContent)) sec = sec.parentElement;
  return sec.innerText.replace(/\n{2,}/g, '\n');
}));
// each row should have a menu/delete control; find buttons inside the section
const rowButtons = await page.evaluate(() => {
  const sc = document.querySelector('.main-content');
  const lbl = [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Resrv Fixed Pricing');
  let sec = lbl;
  while (sec && !/Add extra day price/.test(sec.textContent)) sec = sec.parentElement;
  return [...sec.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || b.textContent.trim().slice(0, 25));
});
console.log('section buttons:', JSON.stringify(rowButtons));

await ctx.close();
console.log('Converting to webp...');
toWebp('resrv-fixed-pricing');
console.log('Done (rows still need deleting if no delete control was found).');
