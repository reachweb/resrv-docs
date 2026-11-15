// Recapture the home page's Reservations Calendar at 2x, in light and dark:
//
//   public/home/cp-calendar-light.webp
//   public/home/cp-calendar-dark.webp
//
// It shows one week, 13 to 19 December 2026, with a booking from each of the demo's three
// collections: the Sea View Suite (Mon to Fri), a Mediterranean Massage (Wed) and a dinner
// sitting at La Marea (Thu). Make those once with scripts/make-collection-bookings.mjs.
// The month's other weeks are hidden before the capture, so the toolbar, the weekday header
// and that one week sit together.
//
// Run:  node scripts/recapture-home-calendar-2x.mjs
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { png, snooze, TMP } from './shot-utils.mjs';

const MONTH = 'December 2026';
const WEEK_OF = '2026-12-13';
const HOME = path.resolve('public/home');

for (const theme of ['light', 'dark']) {
  console.log(`Capturing the calendar (${theme})...`);
  // 1600 wide: the one-day bookings show more of their names than at 1440, and the week still
  // shows close to its real size in the home page's 74rem container.
  const { ctx, page } = await launchCP({ width: 1600, height: 1400, colorScheme: theme, headless: true });
  await page.goto(`${CP_BASE}/cp/resrv/reservations/calendar`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.fc', { timeout: 15000 });
  await page.waitForTimeout(1500);
  await snooze(page);

  for (let i = 0; i < 12; i++) {
    const title = await page.locator('.fc-toolbar-title').first().textContent();
    if (title.trim() === MONTH) break;
    await page.locator('.fc-next-button').first().click();
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(1200);

  // Keep only the week of WEEK_OF and let it size to its bookings: FullCalendar fixes the month's
  // height inline, so one week left on its own would stretch to fill it. Then drop focus and park
  // the cursor away from the bars.
  await page.addStyleTag({
    content: `
      .fc-view-harness { height: auto !important; padding-bottom: 0 !important; }
      .fc-view-harness > .fc-view { position: relative !important; inset: auto !important; }
      .fc-scroller { height: auto !important; overflow: visible !important; }
      .fc-scroller-harness, .fc-scroller-harness-liquid { height: auto !important; }
      .fc-scroller-liquid-absolute { position: static !important; }
      .fc-scrollgrid-sync-table { height: auto !important; }
      .fc-daygrid-day-frame { min-height: 7.5rem !important; }
    `,
  });
  await page.evaluate((day) => {
    for (const row of document.querySelectorAll('.fc-daygrid-body tbody tr')) {
      if (!row.querySelector(`[data-date="${day}"]`)) row.style.display = 'none';
    }
    document.activeElement?.blur();
  }, WEEK_OF);
  await page.waitForTimeout(800);
  await page.mouse.move(10, 1300);
  await page.waitForTimeout(800);

  const clip = await page.evaluate((day) => {
    const toolbar = document.querySelector('.fc-header-toolbar').getBoundingClientRect();
    const row = document.querySelector(`.fc-daygrid-body [data-date="${day}"]`).closest('tr').getBoundingClientRect();
    const fc = document.querySelector('.fc').getBoundingClientRect();
    // Stop short of the status legend above the toolbar.
    const pad = 14;
    const top = toolbar.top - 14;
    return {
      x: Math.round(fc.left - pad),
      y: Math.round(top),
      width: Math.round(fc.width + 2 * pad),
      height: Math.round(row.bottom + pad - top),
    };
  }, WEEK_OF);
  await page.screenshot({ path: png(`cp-calendar-${theme}`), clip });
  await ctx.close();

  execFileSync('cwebp', ['-q', '92', png(`cp-calendar-${theme}`), '-o', path.join(HOME, `cp-calendar-${theme}.webp`)], {
    stdio: 'ignore',
  });
  console.log(`  ${clip.width * 2} x ${clip.height * 2} -> public/home/cp-calendar-${theme}.webp`);
}

rmSync(TMP, { recursive: true, force: true });
