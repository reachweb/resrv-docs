// Create the three confirmed testbed reservations that the home page's "three collections"
// section shows on one calendar: a room, a spa treatment and a restaurant table, all in the
// week of 13 to 19 December 2026, all booked through the demo's one checkout.
//
//   Rooms           Sea View Suite, Best Flexible, Mon 14 to Fri 18 Dec, King bed
//   Spa Treatments  Mediterranean Massage, 60 minutes, Wed 16 Dec at 16:00 (the spa is closed on Tuesdays)
//   Restaurant      La Marea, Dinner Sitting, Thu 17 Dec, standard seating for 2
//
// Each one goes through the frontend checkout and pays with the Pay Later / Bank Transfer gateway.
//   node scripts/make-collection-bookings.mjs [rooms|spa|restaurant ...]
// With no arguments it makes all three. Run it once: every run adds new reservations.
import { chromium } from 'playwright';
import { fillByLabel } from './shot-utils.mjs';

const BASE = process.env.RESRV_CP_BASE || 'https://resrv-hotel.test';

const bookings = {
  rooms: {
    path: '/rooms/sea-view-suite',
    days: ['2026-12-14', '2026-12-18'],
    rate: 'Best Flexible',
    options: ['King'],
    guest: ['Marianne', 'Laurent', 'marianne@example.test'],
  },
  spa: {
    path: '/spa/mediterranean-massage',
    days: ['2026-12-16'],
    rate: '60 minutes',
    options: ['16:00'],
    guest: ['Sofia', 'Demetriou', 'sofia@example.test'],
  },
  restaurant: {
    path: '/dining',
    days: ['2026-12-17'],
    rate: 'Dinner Sitting',
    options: ['Standard seating', '2 guests'],
    guest: ['James', 'Okafor', 'james@example.test'],
  },
};

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(bookings);
const browser = await chromium.launch();

for (const key of wanted) {
  const b = bookings[key];
  if (!b) throw new Error(`Unknown booking "${key}"`);
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, ignoreHTTPSErrors: true });
  console.log(`Booking ${key}...`);

  // 1) dates, then the rate's Book now button
  await page.goto(`${BASE}${b.path}`, { waitUntil: 'networkidle' });
  await page.locator('input[name="datepicker"]').first().click();
  await page.waitForTimeout(800);
  for (const day of b.days) {
    for (let i = 0; i < 4 && !(await page.locator(`[id^="day-${day}"]`).count()); i++) {
      await page.locator('[data-vc-arrow="next"]').first().click();
      await page.waitForTimeout(500);
    }
    await page.locator(`[id^="day-${day}"]`).first().click();
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);
  const card = page
    .locator('div', { has: page.getByText(b.rate, { exact: true }) })
    .filter({ has: page.getByText('Book now', { exact: true }) })
    .last();
  await card.getByText('Book now', { exact: true }).click();
  await page.waitForURL(/checkout/, { timeout: 15000 });
  await page.waitForTimeout(2000);

  // 2) the required options
  for (const option of b.options) {
    await page.getByText(option, { exact: true }).first().click();
    await page.waitForTimeout(600);
  }
  await page.getByText('Continue to customer info', { exact: false }).first().click();
  await page.waitForTimeout(2000);

  // 3) the guest's details
  const [first, last, email] = b.guest;
  await fillByLabel(page, 'First name', first);
  await fillByLabel(page, 'Last name', last);
  await fillByLabel(page, 'Email', email);
  await fillByLabel(page, 'Repeat email', email);
  await fillByLabel(page, 'Phone', '+30 694 000 0001');
  await page.getByText(/Continue to payment|Continue/, { exact: false }).first().click();
  await page.waitForTimeout(2500);

  // 4) confirm with the offline gateway
  await page.getByRole('button', { name: 'Confirm reservation' }).click();
  await page.waitForTimeout(4000);
  console.log(`  done: ${page.url()}`);
  await page.close();
}

await browser.close();
