// Create a confirmed testbed reservation via the frontend checkout.
//   node scripts/make-booking.mjs [afid]
// Books Garden View Double, Best Flexible, 20-27 Jul 2026 (7 nights so the
// "Stay 7+ nights" dynamic pricing campaign applies), King bed, one extra,
// pays with the Pay Later / Bank Transfer gateway.
// Optional afid argument first visits the site with ?afid=CODE so the
// reservation is credited to that affiliate.
import { launchCP, CP_BASE } from './cp-browser.mjs';

const AFID = process.argv[2];
const START = process.argv[3] || '2026-07-20';
const END = process.argv[4] || '2026-07-27';
const FIRST = process.argv[5] || 'Elena';
const LAST = process.argv[6] || 'Papadopoulou';
const EMAIL = process.argv[7] || 'elena@example.test';
const { ctx, page } = await launchCP({ width: 1440, height: 1800 });

const shot = (n) => page.screenshot({ path: `.tmp-shots/booking-${n}.png`, fullPage: true });
const dump = async (label) => console.log(`--- ${label} ---\n` + (await page.evaluate(() => document.body.innerText.replace(/\n{2,}/g, '\n').slice(300, 1800))));

if (AFID) {
  await page.goto(`${CP_BASE}/?afid=${AFID}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  console.log('visited with afid', AFID);
}

// 1) dates + rate
await page.goto(`${CP_BASE}/rooms/garden-view-double`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.locator('input[name="datepicker"]').click();
await page.waitForTimeout(800);
await page.locator(`[id^="day-${START}"]`).first().click();
await page.waitForTimeout(400);
await page.locator(`[id^="day-${END}"]`).first().click();
await page.waitForTimeout(1500);
await page.getByText('Book now', { exact: true }).first().click();
await page.waitForURL(/checkout/, { timeout: 15000 });
await page.waitForTimeout(2000);
console.log('on checkout');

// 2) options: Bed setup King (required); add Champagne on Arrival extra
await page.getByText('King', { exact: true }).first().click();
await page.waitForTimeout(600);
try {
  // extras usually have a checkbox/add control near their name
  const champ = await page.evaluateHandle(() => {
    const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Champagne on Arrival');
    let n = el;
    while (n && !n.querySelector('input[type=checkbox], button')) n = n.parentElement;
    return n.querySelector('input[type=checkbox], button');
  });
  if (champ.asElement()) { await champ.asElement().click(); await page.waitForTimeout(600); }
} catch (e) { console.log('extra add skipped:', e.message.split('\n')[0]); }
await shot('options');

// 3) continue to customer info
await page.getByText('Continue to customer info', { exact: false }).first().click();
await page.waitForTimeout(2000);
await dump('customer info');
// fill the form by label (inputs have no name attributes)
const { fillByLabel } = await import('./shot-utils.mjs');
await fillByLabel(page, 'First name', FIRST);
await fillByLabel(page, 'Last name', LAST);
await fillByLabel(page, 'Email', EMAIL);
await fillByLabel(page, 'Repeat email', EMAIL);
await fillByLabel(page, 'Phone', '+30 694 000 0001');
await shot('customer');

// 4) continue to payment
const cont = page.getByText(/Continue to payment|Continue/, { exact: false }).first();
await cont.click();
await page.waitForTimeout(2500);
await dump('payment step');
await shot('payment');

// 5) confirm (Pay Later / Bank Transfer is the only gateway, pre-selected)
await page.getByRole('button', { name: 'Confirm reservation' }).click();
await page.waitForTimeout(4000);
await dump('after confirm');
await shot('done');
console.log('final URL:', page.url());
await ctx.close();
