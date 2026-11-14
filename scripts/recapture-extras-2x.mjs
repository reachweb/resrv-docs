// Recapture the four screenshots on the Extras docs page at 2x (Statamic 6 / Resrv v6).
//
//   1) resrv-extras-list.webp        - Resrv > Extras management page
//   2) resrv-extras-assign.webp      - row dropdown menu with "Mass assign"
//   3) resrv-extras-field.webp       - Resrv Extras field on an entry (Late Check-out disabled)
//   4) resrv-extras-conditions.webp  - the Conditions slide-over (show when duration >= 7)
//
// Run:  node scripts/recapture-extras-2x.mjs
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { png, toWebp, snooze, fillByLabel, scrollContentTo } from './shot-utils.mjs';

const { ctx, page } = await launchCP({ width: 1440, height: 1600 });

// ============ 1) EXTRAS LIST ============
console.log('Capturing extras list...');
await page.goto(`${CP_BASE}/cp/resrv/extras`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await snooze(page);

const listClip = await page.evaluate(() => {
  const h = document.querySelector('.main-content h1');
  const hr = h.getBoundingClientRect();
  // bottom of the last "Add extra" button (Uncategorized block)
  const adds = [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Add extra');
  const bottom = Math.max(...adds.map((b) => b.getBoundingClientRect().bottom));
  // right edge of the "Add a new category" button
  const cat = [...document.querySelectorAll('button')].find((b) => /Add a new category/.test(b.textContent));
  const right = cat.getBoundingClientRect().right;
  const x = Math.round(hr.left - 28);
  return { x, y: Math.round(hr.top - 28), width: Math.round(right + 28 - x), height: Math.round(bottom + 40 - (hr.top - 28)) };
});
await page.screenshot({ path: png('resrv-extras-list'), clip: listClip });

// ============ 2) DROPDOWN / MASS ASSIGN ============
console.log('Capturing mass-assign dropdown...');
await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Airport Transfer/.test(e.textContent));
  let rowEl = el;
  while (rowEl && !rowEl.querySelector('button[aria-label="Open dropdown menu"]')) rowEl = rowEl.parentElement;
  rowEl.querySelector('button[aria-label="Open dropdown menu"]').click();
});
await page.getByRole('menuitem', { name: 'Mass assign' }).waitFor({ timeout: 5000 });
await page.getByRole('menuitem', { name: 'Mass assign' }).hover();
await page.waitForTimeout(400);

const assignClip = await page.evaluate(() => {
  // union of the Transfers category block and the open menu
  const cat = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Transfers');
  let block = cat;
  while (block && !/Airport Transfer/.test(block.textContent)) block = block.parentElement;
  const b = block.getBoundingClientRect();
  const menu = document.querySelector('[role="menu"]').getBoundingClientRect();
  const x = Math.min(b.left, menu.left) - 20, y = Math.min(b.top, menu.top) - 20;
  return { x: Math.round(x), y: Math.round(y), width: Math.round(Math.max(b.right, menu.right) + 20 - x), height: Math.round(Math.max(b.bottom, menu.bottom) + 20 - y) };
});
await page.screenshot({ path: png('resrv-extras-assign'), clip: assignClip });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// ============ 4) CONDITIONS (before leaving the extras page) ============
console.log('Capturing conditions panel...');
await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Late Check-out/.test(e.textContent));
  let rowEl = el;
  while (rowEl && !rowEl.querySelector('button[aria-label="Open dropdown menu"]')) rowEl = rowEl.parentElement;
  rowEl.querySelector('button[aria-label="Open dropdown menu"]').click();
});
await page.getByRole('menuitem', { name: 'Conditions' }).click();
await page.getByText('Select when to show', { exact: false }).waitFor({ timeout: 8000 });
await page.waitForTimeout(600);
// Match the doc text: at least 7 days (NOT saved - we never click Save).
await fillByLabel(page, 'Value', '7');
await page.waitForTimeout(300);

const condClip = await page.evaluate(() => {
  const title = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Extra conditions for:/.test(e.textContent));
  const t = title.getBoundingClientRect();
  // the slide-over panel: climb from the title to a wide fixed/absolute container
  let panel = title;
  while (panel && panel.getBoundingClientRect().width < 1000) panel = panel.parentElement;
  const p = panel.getBoundingClientRect();
  const add = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Add condition');
  const bottom = add.getBoundingClientRect().bottom;
  return { x: Math.round(p.left + 2), y: Math.round(p.top + 2), width: Math.round(p.width - 4), height: Math.round(bottom + 36 - p.top) };
});
await page.screenshot({ path: png('resrv-extras-conditions'), clip: condClip });
await page.keyboard.press('Escape'); // close without saving
await page.waitForTimeout(400);

// ============ 3) ENTRY EXTRAS FIELD ============
console.log('Capturing entry Extras field...');
await page.goto(`${CP_BASE}/cp/collections/rooms/entries/garden-view-double`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await snooze(page);
await page.getByText('Booking', { exact: true }).first().click();
await page.waitForTimeout(1200);
await scrollContentTo(page, 'Extras', 100);

// Doc caption: "guests of this room type can't order a late checkout" -> toggle it off (NOT saved).
const lateRow = page.locator('[data-draggable]').filter({ hasText: 'Late Check-out' }).last();
await lateRow.scrollIntoViewIfNeeded();
for (let i = 0; i < 3; i++) {
  await lateRow.locator('[data-ui-badge]').click();
  await page.waitForTimeout(800);
  if ((await lateRow.locator('[data-ui-badge]').textContent()).includes('Disabled')) break;
}
const badgeState = await lateRow.locator('[data-ui-badge]').textContent();
console.log('Late Check-out badge now:', badgeState);
if (!badgeState.includes('Disabled')) throw new Error('Could not toggle Late Check-out to Disabled');
await scrollContentTo(page, 'Extras', 100);

const fieldClip = await page.evaluate(() => {
  const label = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Extras' && e.closest('.main-content'));
  const lr = label.getBoundingClientRect();
  const late = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Late Check-out/.test(e.textContent));
  let block = late;
  while (block && !/Uncategorized/.test(block.textContent)) block = block.parentElement;
  const b = block.getBoundingClientRect();
  const x = Math.round(lr.left - 20);
  return { x, y: Math.round(lr.top - 16), width: Math.round(b.right + 20 - x), height: Math.round(b.bottom + 20 - (lr.top - 16)) };
});
await page.screenshot({ path: png('resrv-extras-field'), clip: fieldClip });

await ctx.close();

console.log('Converting to webp...');
['resrv-extras-list', 'resrv-extras-assign', 'resrv-extras-field', 'resrv-extras-conditions'].forEach(toWebp);
console.log('Done. Updated 4 files in public/img/');
