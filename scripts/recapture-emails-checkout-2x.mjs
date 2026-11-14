// Recapture at 2x (Statamic 6 / Resrv v6), requires a super-user session:
//
//   1) resrv-emails-global.webp - Resrv Settings > Emails > Global email event
//      settings grid with one illustrative row (NOT saved)
//   2) resrv-checkout-form.webp - the checkout form's blueprint editor
//
// Run:  node scripts/recapture-emails-checkout-2x.mjs
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { png, toWebp, snooze, fillByLabel } from './shot-utils.mjs';

const { ctx, page } = await launchCP({ width: 1440, height: 2000 });

// ============ 1) GLOBAL EMAIL EVENT SETTINGS ============
console.log('Capturing global email event settings...');
await page.goto(`${CP_BASE}/cp/addons/statamic-resrv/settings`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await snooze(page);
await page.getByText('Emails', { exact: true }).first().click();
await page.waitForTimeout(1200);
await page.getByRole('button', { name: 'Add Row' }).first().click();
await page.waitForTimeout(1000);

// Event select: pick the "confirmed" event
const evTrigger = await page.evaluateHandle(() => {
  const lbl = [...document.querySelectorAll('.main-content *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Event');
  let n = lbl;
  while (n && !n.querySelector('[aria-haspopup="listbox"]')) n = n.parentElement;
  return n.querySelector('[aria-haspopup="listbox"]');
});
await evTrigger.asElement().click();
await page.waitForTimeout(600);
console.log('event options:', await page.evaluate(() => [...document.querySelectorAll('[role=option]')].map((o) => o.textContent.trim()).join(' | ')));
await page.getByRole('option', { name: /confirm/i }).first().click();
await page.waitForTimeout(500);

// Recipient sources: Customer
await page.getByRole('checkbox', { name: 'Customer', exact: true }).first().click();
await page.waitForTimeout(300);
// Extra recipients + sender + subject
const ta = await page.evaluateHandle(() => {
  const lbl = [...document.querySelectorAll('.main-content *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Extra email addresses');
  let n = lbl;
  while (n && !n.querySelector('textarea')) n = n.parentElement;
  return n.querySelector('textarea');
});
await ta.asElement().click();
await ta.asElement().type('frontdesk@resrv-hotel.test');
await fillByLabel(page, 'From address', 'stay@resrv-hotel.test');
await fillByLabel(page, 'From name', 'Resrv Hotel');
await fillByLabel(page, 'Subject', 'Your reservation is confirmed');
await page.evaluate(() => document.activeElement?.blur());
await page.waitForTimeout(500);

const emailClip = await page.evaluate(() => {
  const hdr = [...document.querySelectorAll('.main-content *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Reservation email overrides');
  const hr = hdr.getBoundingClientRect();
  // right edge: the grid row card (contains the Event select)
  const ev = [...document.querySelectorAll('.main-content *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Event');
  let rowCard = ev;
  while (rowCard && rowCard.getBoundingClientRect().width < 400) rowCard = rowCard.parentElement;
  const rr = rowCard.getBoundingClientRect();
  // bottom: the visually-first Add Row button below the header
  const addRows = [...document.querySelectorAll('.main-content button')]
    .filter((b) => b.textContent.trim() === 'Add Row')
    .map((b) => b.getBoundingClientRect().bottom)
    .filter((b) => b > hr.top)
    .sort((a, b) => a - b);
  const bottom = addRows[0];
  const x = Math.round(hr.left - 24);
  return { x, y: Math.round(hr.top - 20), width: Math.round(Math.min(rr.right + 24, window.innerWidth) - x), height: Math.round(Math.min(bottom + 24, window.innerHeight) - (hr.top - 20)) };
});
await page.screenshot({ path: png('resrv-emails-global'), clip: emailClip });
// leave WITHOUT saving

// ============ 2) CHECKOUT FORM BLUEPRINT ============
console.log('Capturing checkout form blueprint...');
await page.goto(`${CP_BASE}/cp/fields/blueprints/forms/checkout/edit`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await snooze(page);
const formClip = await page.evaluate(() => {
  const h = document.querySelector('.main-content h1');
  const hr = h.getBoundingClientRect();
  const save = [...document.querySelectorAll('.main-content button')].find((b) => b.textContent.trim() === 'Save');
  const add = [...document.querySelectorAll('.main-content *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Add Section');
  let box = add;
  while (box && box.getBoundingClientRect().width < 700) box = box.parentElement;
  const br = box.getBoundingClientRect();
  const x = Math.round(Math.min(hr.left, br.left) - 24);
  return { x, y: Math.round(hr.top - 24), width: Math.round(Math.max(br.right, save.getBoundingClientRect().right) + 24 - x), height: Math.round(br.bottom + 24 - (hr.top - 24)) };
});
await page.screenshot({ path: png('resrv-checkout-form'), clip: formClip });

await ctx.close();
console.log('Converting to webp...');
['resrv-emails-global', 'resrv-checkout-form'].forEach(toWebp);
console.log('Done. Updated 2 files in public/img/');
