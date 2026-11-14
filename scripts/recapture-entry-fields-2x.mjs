// Recapture the entry-field screenshots at 2x (Statamic 6 / Resrv v6):
//
//   1) resrv-options-field.webp - Resrv Options field on the Rooms entry
//   2) resrv-cutoff-field.webp  - Resrv Cutoff field on a Spa Treatments entry,
//      toggled on with a summer schedule row (nothing is saved)
//
// Run:  node scripts/recapture-entry-fields-2x.mjs
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { png, toWebp, snooze, scrollContentTo } from './shot-utils.mjs';

const { ctx, page } = await launchCP({ width: 1440, height: 1600 });

// ============ 1) OPTIONS FIELD ============
console.log('Capturing Options field...');
await page.goto(`${CP_BASE}/cp/collections/rooms/entries/garden-view-double`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await snooze(page);
await page.getByText('Booking', { exact: true }).first().click();
await page.waitForTimeout(1200);
await scrollContentTo(page, 'Options', 90);

const optClip = await page.evaluate(() => {
  const sc = document.querySelector('.main-content');
  const label = [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Options');
  const lr = label.getBoundingClientRect();
  const add = [...sc.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Add option');
  const ar = add.getBoundingClientRect();
  // width: match the option group card
  const group = [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Breakfast');
  let card = group;
  while (card && card.getBoundingClientRect().width < 500) card = card.parentElement;
  const cr = card.getBoundingClientRect();
  const x = Math.round(lr.left - 20);
  return { x, y: Math.round(lr.top - 16), width: Math.round(cr.right + 20 - x), height: Math.round(ar.bottom + 20 - (lr.top - 16)) };
});
await page.screenshot({ path: png('resrv-options-field'), clip: optClip });

// ============ 2) CUTOFF FIELD ============
console.log('Capturing Cutoff field...');
await page.goto(`${CP_BASE}/cp/collections/spa_treatments/entries/spa-couples-ritual`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await snooze(page);
await page.getByText('Booking', { exact: true }).first().click();
await page.waitForTimeout(1200);

// Turn the field on for the screenshot (NOT saved - we never click Save & Publish).
await page.evaluate(() => {
  const lbl = [...document.querySelectorAll('.main-content *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Enable Cutoff Rules');
  let n = lbl;
  while (n && !n.querySelector('[role=switch], button[aria-checked]')) n = n.parentElement;
  n.querySelector('[role=switch], button[aria-checked]').click();
});
await page.waitForTimeout(800);
await page.getByRole('button', { name: 'Add Schedule' }).click();
await page.waitForTimeout(800);

// Illustrate the docs' "later starting time during summer" example (still not saved).
// The date range is a reka-ui segmented field: click a segment, type the digits.
const seg = (type, part) => page.locator(`[data-reka-date-field-segment="${part}"][data-reka-date-range-field-segment-type="${type}"]`);
await seg('start', 'month').click();
await page.keyboard.type('07012026', { delay: 60 });
await seg('end', 'month').click();
await page.keyboard.type('08312026', { delay: 60 });
await page.waitForTimeout(400);

// Schedule overrides: Starting Time 06:00 PM, Cutoff Hours 2 (in the schedule row card).
await page.evaluate(() => {
  const dr = [...document.querySelectorAll('.main-content *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Date Range');
  let card = dr;
  while (card && !/Starting Time[\s\S]*Cutoff Hours/.test(card.textContent)) card = card.parentElement;
  card.setAttribute('data-shot-schedule-card', '1');
});
const schedCard = page.locator('[data-shot-schedule-card]');
const hourSeg = schedCard.locator('[data-reka-date-field-segment="hour"]').first();
if (await hourSeg.count()) {
  await hourSeg.click();
  await page.keyboard.type('06', { delay: 60 });
  const min = schedCard.locator('[data-reka-date-field-segment="minute"]').first();
  if (await min.count()) { await min.click(); await page.keyboard.type('00', { delay: 60 }); }
}
const hoursInput = schedCard.locator('input').last();
if (await hoursInput.count()) {
  await hoursInput.click({ clickCount: 3 });
  await hoursInput.press('Backspace');
  await hoursInput.type('2');
}
await page.mouse.click(1200, 300); // blur
await page.waitForTimeout(400);

await scrollContentTo(page, 'Cutoff', 70);
const cutClip = await page.evaluate(() => {
  const sc = document.querySelector('.main-content');
  const label = [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Cutoff');
  const lr = label.getBoundingClientRect();
  // whole Schedules card: climb from the "Schedules" header until the card also contains the row
  const sched = [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Schedules');
  let card = sched;
  while (card && !/Date Range/.test(card.textContent)) card = card.parentElement;
  const cr = card.getBoundingClientRect();
  const x = Math.round(lr.left - 20);
  return { x, y: Math.round(lr.top - 16), width: Math.round(cr.right + 20 - x), height: Math.round(cr.bottom + 20 - (lr.top - 16)) };
});
await page.screenshot({ path: png('resrv-cutoff-field'), clip: cutClip });

await ctx.close();

console.log('Converting to webp...');
['resrv-options-field', 'resrv-cutoff-field'].forEach(toWebp);
console.log('Done. Updated 2 files in public/img/');
