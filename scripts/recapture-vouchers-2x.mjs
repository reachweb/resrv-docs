// Capture the Vouchers add-on shots for /vouchers at 2x.
//   resrv-vouchers-widget.webp - the Vouchers dashboard widget
//   resrv-vouchers-list.webp   - Resrv > Vouchers > List, one voucher in each status
//   resrv-vouchers-scan.webp   - Resrv > Vouchers > Scan, a valid voucher found by its booking
//                                reference (never marked as used)
//   resrv-vouchers-email.webp  - the top of the confirmation email with the inline QR code
//
// These need a site with reachweb/statamic-resrv-vouchers installed, so they don't run against
// resrv-hotel.test: they default to a fresh starter kit install at resrv-vouchers-demo.test
// (override with RESRV_CP_BASE and RESRV_VOUCHERS_SITE). That site has spa_treatments and
// restaurant in enabled_collections, the widget in config/statamic/cp.php, the QR include in
// its confirmed.blade.php, and six confirmed bookings: A3XN7S, M8QF5J and H2VC6Z issued, R4TB8N
// used, P9WD3L cancelled (invalidated) and K7M2QX past its expiry.
//
// Log in once: RESRV_CP_BASE=http://resrv-vouchers-demo.test node scripts/demo-login.mjs
// Run:         node scripts/recapture-vouchers-2x.mjs
import { execFileSync } from 'node:child_process';

process.env.RESRV_CP_BASE ??= 'http://resrv-vouchers-demo.test';
const SITE = process.env.RESRV_VOUCHERS_SITE ?? '/Volumes/1TB/Sites/resrv-vouchers-demo';
const REFERENCE = 'A3XN7S';

const { launchCP, CP_BASE } = await import('./cp-browser.mjs');
const { png, toWebp, snooze, pad, TMP } = await import('./shot-utils.mjs');

const { ctx, page } = await launchCP({ width: 1440, height: 1400 });

// The Inertia page's title, panels and listing, without the CP sidebar. The page's root
// stretches to the window's height, so the crop ends at its last child instead, and it
// starts just above the title so the padding doesn't reach the CP's header bar.
const pageRect = () => page.evaluate(() => {
  const root = document.querySelector('.max-w-page');
  const r = root.getBoundingClientRect();
  const kids = [...root.children].map((c) => c.getBoundingClientRect()).filter((k) => k.height > 0);
  const top = root.querySelector('h1').getBoundingClientRect().top - 8;
  const bottom = Math.max(...kids.map((k) => k.bottom));
  return { x: r.x, y: top, width: r.width, height: bottom - top };
});

// 1) Dashboard widget
await page.goto(`${CP_BASE}/cp/dashboard`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await snooze(page);
const widget = await page.evaluate(() => {
  const text = [...document.querySelectorAll('p')].find((e) => e.textContent.includes('Scan a guest voucher'));
  let card = text;
  while (card && !card.innerText.trim().startsWith('Vouchers')) card = card.parentElement;
  const r = card.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
await page.screenshot({ path: png('resrv-vouchers-widget'), clip: pad(widget, 12) });

// 2) Voucher list
await page.goto(`${CP_BASE}/cp/resrv-vouchers`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await snooze(page);
await page.evaluate(() => document.activeElement?.blur()); // drop the search box's focus ring
await page.mouse.move(5, 5); // and the hover tint on whichever row is under the pointer
await page.waitForTimeout(300);
await page.screenshot({ path: png('resrv-vouchers-list'), clip: pad(await pageRect(), 16) });

// 3) Scan page with a valid voucher found by its booking reference. Its panels span the page
//    and are mostly empty at 1440, so it's taken tablet-sized, closer to how door staff use it.
await page.setViewportSize({ width: 1024, height: 1400 });
await page.goto(`${CP_BASE}/cp/resrv-vouchers/scan`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await snooze(page);
await page.getByRole('textbox').first().fill(REFERENCE);
await page.getByRole('button', { name: 'Find voucher' }).click();
await page.getByText('Voucher is valid.').waitFor();
await page.waitForTimeout(600);
await page.screenshot({ path: png('resrv-vouchers-scan'), clip: pad(await pageRect(), 16) });

// 4) Confirmation email: Resrv's own mailable rendered by the site, with the QR the add-on
//    embeds swapped in as a data URI (a mail client resolves cid:voucher-qr the same way).
const html = `${TMP}/vouchers-email.html`;
execFileSync('php', ['artisan', 'tinker', '--execute', `
  $reservation = Reach\\StatamicResrv\\Models\\Reservation::where('reference', '${REFERENCE}')->firstOrFail();
  $voucher = Reach\\StatamicResrvVouchers\\Models\\Voucher::where('reservation_id', $reservation->id)->firstOrFail();
  $qr = app(Reach\\StatamicResrvVouchers\\Services\\QrRenderer::class)->png($voucher->token);
  $email = (new Reach\\StatamicResrv\\Mail\\ReservationConfirmed($reservation))->render();
  file_put_contents('${html}', str_replace('cid:voucher-qr', 'data:image/png;base64,'.base64_encode($qr), $email));
`], { cwd: SITE, stdio: 'ignore' });
await page.setViewportSize({ width: 900, height: 1400 });
await page.goto(`file://${html}`);
await page.waitForTimeout(500);
const email = await page.evaluate(() => {
  const body = document.querySelector('.inner-body').getBoundingClientRect();
  const header = document.querySelector('.header').getBoundingClientRect();
  const button = document.querySelector('.button').getBoundingClientRect();
  return { x: body.x - 24, y: header.y, width: body.width + 48, height: button.bottom + 32 - header.y };
});
await page.screenshot({ path: png('resrv-vouchers-email'), clip: email });

await ctx.close();
console.log('Converting to webp...');
for (const name of ['resrv-vouchers-widget', 'resrv-vouchers-list', 'resrv-vouchers-scan', 'resrv-vouchers-email']) toWebp(name);
console.log('Done.');
