// Recapture the three screenshots on the Availability docs page at 2x, in the
// Statamic 6 / Resrv v6 Control Panel, and overwrite the existing .webp files.
//
//   1) public/img/resrv-availabilty-field.webp        - Resrv Availability field settings
//   2) public/img/resrv-availability-calendar.webp    - in-entry availability calendar
//   3) public/img/resrv-availability-calendar-edit.webp - "Change availability" modal
//
// Run:  node scripts/recapture-availability-2x.mjs
// (First run opens a browser; log into the CP once, then it captures automatically.)
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const IMG = path.resolve('public/img');
const TMP = path.resolve('.tmp-shots');
mkdirSync(TMP, { recursive: true });

// --- test data (this Resrv testbed) ---
const ROOM = 'garden-view-double';          // a multi-rate room
const RATE = 'Best Flexible';               // its base rate
const AVAILABLE = '7', PRICE = '100';       // values shown in the modal

const png = (n) => path.join(TMP, `${n}.png`);
const toWebp = (name) =>
  execFileSync('cwebp', ['-q', '92', png(name), '-o', path.join(IMG, `${name}.webp`)], { stdio: 'ignore' });

async function main() {
  const { ctx, page } = await launchCP({ width: 1440, height: 1600 });

  // ============ 1) FIELD SETTINGS ============
  console.log('Capturing field settings...');
  await page.goto(`${CP_BASE}/cp/fields/blueprints/collections/rooms/room/edit`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Booking', { exact: true }).first().click();      // blueprint tab
  await page.getByText('Availability', { exact: true }).first().click(); // open the field editor
  await page.getByText('Display Label', { exact: true }).first().waitFor();

  // Set the doc's default label/handle (NOT saved - we never click Save).
  await fillByLabel(page, 'Display Label', 'Resrv Availability');
  await fillByLabel(page, 'Handle', 'resrv_availability');
  await page.mouse.click(540, 165); // blur

  const fieldClip = await page.evaluate(() => {
    // The outer slide-over panel (absolute/fixed, ~1215px wide) - includes the Save/close header.
    const panel = [...document.querySelectorAll('div')]
      .filter((e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); const t = e.textContent || '';
        return (s.position === 'absolute' || s.position === 'fixed') && t.includes('Display Label') && b.width > 1000 && b.width < 1400; })
      .sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0];
    const p = panel.getBoundingClientRect();
    const listable = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Listable');
    const lb = listable.getBoundingClientRect();
    // find the listable row bottom (climb until a wide row)
    let row = listable; while (row && row.getBoundingClientRect().width < 400) row = row.parentElement;
    const bottom = row.getBoundingClientRect().bottom;
    return { x: Math.round(p.x + 2), y: 10, width: Math.round(p.width - 23), height: Math.round(bottom + 40 - 10) };
  });
  await page.screenshot({ path: png('resrv-availabilty-field'), clip: fieldClip });

  // ============ 2) CALENDAR + 3) MODAL ============
  console.log('Opening entry / selecting rate...');
  await page.goto(`${CP_BASE}/cp/collections/rooms/entries/${ROOM}`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Booking', { exact: true }).first().click();     // entry tab
  await page.getByText('Select rate', { exact: true }).first().click();
  await page.getByText(RATE, { exact: true }).first().click();
  await page.waitForSelector('.fc', { timeout: 15000 });
  await page.waitForTimeout(1200); // let the grid paint

  console.log('Capturing calendar...');
  const calClip = await page.evaluate(() => {
    const avail = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Availability');
    const a = avail.getBoundingClientRect();
    const fc = document.querySelector('.fc').getBoundingClientRect();
    const x = Math.round(fc.left - 16);
    return { x, y: Math.round(a.top - 12), width: Math.round(fc.right - fc.left + 35), height: Math.round(fc.bottom - (a.top - 12) + 8) };
  });
  await page.screenshot({ path: png('resrv-availability-calendar'), clip: calClip });

  console.log('Opening change-availability modal...');
  // Derive the visible month from today's cell, then drag-select the 9th -> 11th.
  const ym = await page.evaluate(() => {
    const today = document.querySelector('.fc-day-today')?.getAttribute('data-date')
      || document.querySelector('[data-date]')?.getAttribute('data-date');
    return today.slice(0, 7); // YYYY-MM
  });
  const cells = await page.evaluate((ym) => {
    const pick = (d) => { const el = document.querySelector(`[data-date="${d}"]`); const r = el.getBoundingClientRect();
      return { cx: r.x + r.width / 2, dragY: r.top + r.height * 0.6 }; }; // empty lower area, below the pills
    return { a: pick(`${ym}-09`), b: pick(`${ym}-11`) };
  }, ym);
  await page.mouse.move(cells.a.cx, cells.a.dragY);
  await page.mouse.down();
  await page.mouse.move((cells.a.cx + cells.b.cx) / 2, cells.a.dragY, { steps: 5 });
  await page.mouse.move(cells.b.cx, cells.b.dragY, { steps: 5 });
  await page.mouse.up();
  await page.getByText('Change availability', { exact: true }).waitFor({ timeout: 8000 });

  await fillByLabel(page, 'Available', AVAILABLE);
  await fillByLabel(page, 'Price', PRICE);
  // Hide the calendar's "today" button in case it bleeds through the modal backdrop.
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().toLowerCase() === 'today');
    if (t) t.style.visibility = 'hidden';
  });
  await page.waitForTimeout(300);

  console.log('Capturing modal...');
  const modalClip = await page.evaluate(() => {
    const panel = [...document.querySelectorAll('div')]
      .filter((e) => { const b = e.getBoundingClientRect(); const t = e.textContent || '';
        return t.includes('Change availability') && t.includes('Save') && b.width > 300 && b.width < 800; })
      .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
    const b = panel.getBoundingClientRect();
    return { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) };
  });
  await page.screenshot({ path: png('resrv-availability-calendar-edit'), clip: modalClip });

  await ctx.close();

  // ---- convert to webp, overwrite originals ----
  console.log('Converting to webp...');
  ['resrv-availabilty-field', 'resrv-availability-calendar', 'resrv-availability-calendar-edit'].forEach(toWebp);
  rmSync(TMP, { recursive: true, force: true });
  console.log('Done. Updated 3 files in public/img/');
}

/** Fill the text input/textarea that belongs to a given label, replacing its contents. */
async function fillByLabel(page, labelText, value) {
  const el = await page.evaluateHandle((lt) => {
    const label = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === lt);
    let n = label;
    while (n && !(n.querySelector && n.querySelector('input, textarea'))) n = n.parentElement;
    return n.querySelector('input, textarea');
  }, labelText);
  const input = el.asElement();
  await input.click({ clickCount: 3 });
  await input.press('Backspace');
  await input.type(value);
}

main().catch((e) => { console.error(e); process.exit(1); });
