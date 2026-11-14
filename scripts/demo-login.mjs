// Log the persistent 2x capture profile into the CP using the demo credentials
// that are publicly advertised on the login screen itself.
import { chromium } from 'playwright';
import path from 'node:path';
import os from 'node:os';

const CP_BASE = process.env.RESRV_CP_BASE || 'https://resrv-hotel.test';
const PROFILE_DIR = path.join(os.homedir(), '.cache', 'resrv-cp-shot-profile');

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  viewport: { width: 1440, height: 1600 },
  deviceScaleFactor: 2,
  ignoreHTTPSErrors: true,
});
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto(`${CP_BASE}/cp/`, { waitUntil: 'domcontentloaded' });

if (/\/auth\/login/.test(page.url())) {
  await page.fill('input[name="email"]', 'demo@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.getByRole('button', { name: 'Continue' }).click();
  try {
    await page.waitForURL((u) => !/auth\/login/.test(u.href), { timeout: 10000 });
  } catch {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 1500));
    console.log('STILL ON LOGIN. Page text:\n', body);
    await page.screenshot({ path: '.tmp-shots/login-debug.png' });
    await ctx.close();
    process.exit(1);
  }
}
console.log('Logged in, now at:', page.url());
await ctx.close();
