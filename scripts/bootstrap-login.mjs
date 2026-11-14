// One-time bootstrap: opens the persistent 2x capture browser at the CP login page
// and waits until a human has logged in, then exits. After this, all capture
// scripts reuse the saved session automatically.
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

const loggedIn = async () => {
  if (/\/(login|auth)/.test(page.url())) return false;
  return !(await page.$('input[type="password"]'));
};

if (await loggedIn()) {
  console.log('Already logged in — profile is ready.');
} else {
  console.log('Waiting for login in the opened browser window...');
  const deadline = Date.now() + 30 * 60 * 1000; // wait up to 30 min
  while (Date.now() < deadline) {
    await page.waitForTimeout(3000);
    try {
      if (await loggedIn()) { console.log('Login detected — profile saved.'); break; }
    } catch { /* navigation in flight */ }
  }
  if (!(await loggedIn())) { console.error('Timed out waiting for login.'); await ctx.close(); process.exit(1); }
}
await ctx.close();
