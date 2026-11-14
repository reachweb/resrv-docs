// Recapture three of the four screenshots on the Dynamic Pricing docs page at 2x.
//
//   1) resrv-dynamic-pricing.webp            - the Dynamic Pricing list
//   2) resrv-dynamic-pricing-off.webp        - Add panel: 10% off for August (date condition)
//   3) resrv-dynamic-pricing-lastminute.webp - Add panel: 15% off starting in the next 7 days
//
// Panels are filled but NEVER saved (closed with the X button).
// (4th shot resrv-dynamic-pricing-applied is captured by the reservations script.)
//
// Run:  node scripts/recapture-dynamic-pricing-2x.mjs
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { png, toWebp, snooze, fillByLabel } from './shot-utils.mjs';

const { ctx, page } = await launchCP({ width: 1440, height: 1800 });

/** Open the select that belongs to a field label and pick an option by (partial) text. */
async function pickSelect(labelText, optionText) {
  const trigger = await page.evaluateHandle((lt) => {
    const lbl = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === lt);
    let n = lbl;
    while (n && !n.querySelector('[aria-haspopup="listbox"]')) n = n.parentElement;
    return n.querySelector('[aria-haspopup="listbox"]');
  }, labelText);
  await trigger.asElement().click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: optionText }).first().click();
  await page.waitForTimeout(400);
}

async function openAddPanel() {
  await page.getByRole('button', { name: /Add Dynamic Pricing/i }).click();
  await page.getByText('Add dynamic pricing', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(800);
}

async function closePanel() {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
}

function panelClip() {
  return page.evaluate(() => {
    const title = [...document.querySelectorAll('*')]
      .filter((e) => e.textContent.trim() === 'Add dynamic pricing')
      .sort((a, b) => a.textContent.length - b.textContent.length)[0];
    let hdr = title;
    while (hdr && hdr.getBoundingClientRect().width < 600) hdr = hdr.parentElement;
    const p = hdr.getBoundingClientRect();
    const pub = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Published' && Math.abs(e.getBoundingClientRect().left - p.left) < 400);
    let card = pub;
    while (card && card.getBoundingClientRect().width < 500) card = card.parentElement;
    const bottom = card.getBoundingClientRect().bottom;
    return { x: Math.round(p.left + 2), y: Math.round(p.top + 2), width: Math.round(p.width - 4), height: Math.round(bottom + 28 - p.top) };
  });
}

await page.goto(`${CP_BASE}/cp/resrv/dynamicpricing`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await snooze(page);

// ============ 1) LIST ============
console.log('Capturing dynamic pricing list...');
const listClip = await page.evaluate(() => {
  const h = document.querySelector('.main-content h1');
  const hr = h.getBoundingClientRect();
  const add = [...document.querySelectorAll('button')].find((b) => /Add Dynamic Pricing/i.test(b.textContent));
  const right = add.getBoundingClientRect().right;
  const last = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /COASTAL10/.test(e.textContent.trim()));
  let row = last;
  while (row && row.getBoundingClientRect().width < 700) row = row.parentElement;
  const bottom = row.getBoundingClientRect().bottom;
  const x = Math.round(hr.left - 28);
  return { x, y: Math.round(hr.top - 28), width: Math.round(right + 28 - x), height: Math.round(bottom + 36 - (hr.top - 28)) };
});
await page.screenshot({ path: png('resrv-dynamic-pricing'), clip: listClip });

// ============ 2) "10% OFF FOR AUGUST" PANEL ============
console.log('Capturing August discount panel...');
await openAddPanel();
await fillByLabel(page, 'Title', '10% Off for August');
await fillByLabel(page, 'Amount', '10');
await pickSelect('Operation', 'Decrease');
await pickSelect('Type', /Percent/i);
await pickSelect('Date condition', /inside this date range/i);
// date range: reka segmented field
const seg = (type, part) => page.locator(`[data-reka-date-field-segment="${part}"][data-reka-date-range-field-segment-type="${type}"]`);
await seg('start', 'month').click();
await page.keyboard.type('08012026', { delay: 50 });
await seg('end', 'month').click();
await page.keyboard.type('08312026', { delay: 50 });
await page.getByText('Select all', { exact: true }).first().click(); // entries
await page.waitForTimeout(600);
await page.screenshot({ path: png('resrv-dynamic-pricing-off'), clip: await panelClip() });
await closePanel();

// ============ 3) "LAST MINUTE" PANEL ============
console.log('Capturing last-minute panel...');
await openAddPanel();
await fillByLabel(page, 'Title', 'Last minute 15% off');
await fillByLabel(page, 'Amount', '15');
await pickSelect('Operation', 'Decrease');
await pickSelect('Type', /Percent/i);
await pickSelect('Reservation condition', /start date/i);
await pickSelect('Comparison', /^Less than/i);
await fillByLabel(page, 'Value', '7');
await page.getByText('Select all', { exact: true }).first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: png('resrv-dynamic-pricing-lastminute'), clip: await panelClip() });
await closePanel();

await ctx.close();

console.log('Converting to webp...');
['resrv-dynamic-pricing', 'resrv-dynamic-pricing-off', 'resrv-dynamic-pricing-lastminute'].forEach(toWebp);
console.log('Done. Updated 3 files in public/img/');
