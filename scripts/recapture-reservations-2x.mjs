// Recapture the reservation-related screenshots at 2x (Statamic 6 / Resrv v6):
//
//   reservations.md
//     1) resrv-reservations.webp            - the reservations list
//     2) resrv-reservation-refund.webp      - row menu with the Refund action
//     3) resrv-reservation-details.webp     - details page (reservation #11)
//     4) resrv-reservation-calendar.webp    - Resrv > Calendar
//     5) resrv-reservation-reports.webp     - Resrv > Reports (range with data)
//     6) resrv-reservations-export.webp     - Resrv > Export
//   dynamic-pricing.md
//     7) resrv-dynamic-pricing-applied.webp - applied-campaigns section on #11
//   affiliates.md
//     8) resrv-reservation-affiliate-credit.webp - affiliate section on #12
//
// Run:  node scripts/recapture-reservations-2x.mjs
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { png, toWebp, snooze } from './shot-utils.mjs';

const { ctx, page } = await launchCP({ width: 1440, height: 2400 });

/** Crop a details-page section: from its heading down to just above the next heading. */
async function sectionClip(headingText, nextHeadingText) {
  return page.evaluate(({ ht, nt }) => {
    const sc = document.querySelector('.main-content') || document.body;
    const leaf = (t) => [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === t);
    const hr = leaf(ht).getBoundingClientRect();
    const nr = leaf(nt).getBoundingClientRect();
    // width: match the payment card (widest content card on the page)
    let card = leaf(nt);
    while (card && card.getBoundingClientRect().width < 700) card = card.parentElement;
    const cr = card.getBoundingClientRect();
    const x = Math.round(cr.left - 4);
    return { x, y: Math.round(hr.top - 12), width: Math.round(cr.right + 4 - x), height: Math.round(nr.top - 14 - (hr.top - 12)) };
  }, { ht: headingText, nt: nextHeadingText });
}

// ============ 1) LIST ============
console.log('Capturing reservations list...');
await page.goto(`${CP_BASE}/cp/resrv/reservations`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await snooze(page);
// Temporarily hide a few columns so the table fits the 1440 layout without a
// horizontal scrollbar (restored via the dialog's Reset button afterwards).
async function setColumns(action) {
  await page.getByRole('button', { name: 'Customize Columns' }).click();
  await page.waitForTimeout(800);
  if (action === 'trim') {
    for (const col of ['Type', 'Deposit', 'Payment method', 'Created at']) {
      const box = page.getByRole('checkbox', { name: col, exact: true });
      for (let i = 0; i < 3; i++) {
        await box.click();
        await page.waitForTimeout(400);
        if ((await box.getAttribute('aria-checked')) === 'false') break;
      }
    }
  } else {
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.waitForTimeout(800);
  }
  // Save applies the change; after Reset the modal may auto-apply and leave Save disabled.
  const save = page.locator('button:enabled', { hasText: 'Save' }).first();
  try {
    await save.waitFor({ timeout: 4000 });
    await save.click();
  } catch {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(1500);
}
await setColumns('trim');
// park the cursor and drop focus so no tooltip is anchored to the toolbar button
await page.mouse.move(720, 1200);
await page.evaluate(() => document.activeElement?.blur());
await page.waitForTimeout(800);
const listClip = await page.evaluate(() => {
  const h = document.querySelector('.main-content h1');
  const hr = h.getBoundingClientRect();
  const table = document.querySelector('table').getBoundingClientRect();
  const pag = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /1–\d+ of \d+/.test(e.textContent.trim()));
  const bottom = pag ? pag.getBoundingClientRect().bottom : table.bottom;
  const x = Math.round(hr.left - 28);
  return { x, y: Math.round(hr.top - 28), width: Math.round(table.right + 24 - x), height: Math.round(bottom + 24 - (hr.top - 28)) };
});
await page.screenshot({ path: png('resrv-reservations'), clip: listClip });
await setColumns('reset'); // restore the default column set

// ============ 2) REFUND MENU ============
console.log('Capturing refund menu...');
const row = page.locator('table tr').filter({ hasText: 'Elena' }).first();
await row.locator('button').last().click();
await page.getByRole('menuitem', { name: 'Refund' }).waitFor({ timeout: 5000 });
await page.getByRole('menuitem', { name: 'Refund' }).hover();
await page.waitForTimeout(400);
const refundClip = await page.evaluate(() => {
  const menu = document.querySelector('[role="menu"]').getBoundingClientRect();
  const thead = document.querySelector('table thead').getBoundingClientRect();
  // frame: right side of the table incl. headers + the open menu
  const x = Math.round(thead.right - 620);
  const y = Math.round(thead.top - 8);
  return { x, y, width: Math.round(thead.right + 24 - x), height: Math.round(menu.bottom + 24 - y) };
});
await page.screenshot({ path: png('resrv-reservation-refund'), clip: refundClip });
await page.keyboard.press('Escape');

// ============ 3) DETAILS + 7) APPLIED CAMPAIGNS ============
console.log('Capturing reservation details...');
await page.goto(`${CP_BASE}/cp/resrv/reservation/11`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await snooze(page);
const detailsClip = await page.evaluate(() => {
  const back = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Back');
  const br = back.getBoundingClientRect();
  let card = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Total price/.test(e.textContent.trim()));
  while (card && card.getBoundingClientRect().width < 700) card = card.parentElement;
  const cr = card.getBoundingClientRect();
  const mc = document.querySelector('.main-content').getBoundingClientRect();
  const x = Math.round(cr.left - 20);
  const y = Math.round(Math.max(br.top - 16, mc.top + 4)); // stay inside the light content area
  return { x, y, width: Math.round(cr.right + 20 - x), height: Math.round(cr.bottom + 20 - y) };
});
await page.screenshot({ path: png('resrv-reservation-details'), clip: detailsClip });
await page.screenshot({ path: png('resrv-dynamic-pricing-applied'), clip: await sectionClip('Dynamic pricing policies applied', 'Payment information') });

// ============ 8) AFFILIATE CREDIT ============
console.log('Capturing affiliate credit...');
await page.goto(`${CP_BASE}/cp/resrv/reservation/12`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await snooze(page);
await page.screenshot({ path: png('resrv-reservation-affiliate-credit'), clip: await sectionClip('Affiliate', 'Payment information') });

// ============ 4) CALENDAR ============
console.log('Capturing calendar...');
await page.goto(`${CP_BASE}/cp/resrv/reservations/calendar`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await snooze(page);
const calClip = await page.evaluate(() => {
  const h = document.querySelector('.main-content h1');
  const hr = h.getBoundingClientRect();
  const toggle = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Only show start dates/.test(e.textContent.trim()));
  // the calendar card: a wide box that is tall but not the full-height page wrapper
  const boxes = [...document.querySelectorAll('.main-content div')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 700 && r.height > 500 && r.height < 1300);
  const big = boxes.sort((a, b) => b.height - a.height)[0];
  const right = Math.max(hr.right, toggle ? toggle.getBoundingClientRect().right : 0, big.right);
  const x = Math.round(hr.left - 28);
  return { x, y: Math.round(hr.top - 28), width: Math.round(right + 28 - x), height: Math.round(big.bottom + 28 - (hr.top - 28)) };
});
await page.screenshot({ path: png('resrv-reservation-calendar'), clip: calClip });

// ============ 5) REPORTS ============
console.log('Capturing reports...');
await page.goto(`${CP_BASE}/cp/resrv/reports`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await snooze(page);
// widen the range so all seeded + new bookings are covered (May-Aug 2026)
const seg = (type, part) => page.locator(`[data-reka-date-field-segment="${part}"][data-reka-date-range-field-segment-type="${type}"]`);
await seg('start', 'month').click();
await page.keyboard.type('05012026', { delay: 40 });
await seg('end', 'month').click();
await page.keyboard.type('08312026', { delay: 40 });
await page.waitForTimeout(2000); // let the report refresh
await page.evaluate(() => document.activeElement?.blur()); // drop the date-segment focus highlight
await page.waitForTimeout(400);
const reportsClip = await page.evaluate(() => {
  const h = document.querySelector('.main-content h1');
  const hr = h.getBoundingClientRect();
  // bottom of the "Top selling extras" card: its last row is the "No data" placeholder
  const nd = [...document.querySelectorAll('.main-content *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'No data');
  const bottom = nd.getBoundingClientRect().bottom + 30;
  const cards = [...document.querySelectorAll('.main-content div')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 900 && r.height > 60 && r.height < 1200);
  const right = Math.max(...cards.map((r) => r.right));
  const x = Math.round(hr.left - 28);
  return { x, y: Math.round(hr.top - 28), width: Math.round(right + 28 - x), height: Math.round(bottom + 20 - (hr.top - 28)) };
});
await page.screenshot({ path: png('resrv-reservation-reports'), clip: reportsClip });

// ============ 6) EXPORT ============
console.log('Capturing export...');
await page.goto(`${CP_BASE}/cp/resrv/export`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await snooze(page);
const exportClip = await page.evaluate(() => {
  const h = document.querySelector('.main-content h1');
  const hr = h.getBoundingClientRect();
  const dl = [...document.querySelectorAll('button')].find((b) => /Download CSV/.test(b.textContent));
  const dr = dl.getBoundingClientRect();
  const x = Math.round(hr.left - 28);
  return { x, y: Math.round(hr.top - 28), width: Math.round(dr.right + 28 - x), height: Math.round(dr.bottom + 28 - (hr.top - 28)) };
});
await page.screenshot({ path: png('resrv-reservations-export'), clip: exportClip });

await ctx.close();

console.log('Converting to webp...');
['resrv-reservations', 'resrv-reservation-refund', 'resrv-reservation-details', 'resrv-reservation-calendar',
 'resrv-reservation-reports', 'resrv-reservations-export', 'resrv-dynamic-pricing-applied', 'resrv-reservation-affiliate-credit'].forEach(toWebp);
console.log('Done. Updated 8 files in public/img/');
