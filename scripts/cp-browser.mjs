// Reusable launcher for capturing Statamic/Resrv Control Panel screenshots at 2x.
//
// Opens a headed Chromium with deviceScaleFactor:2 and a PERSISTENT profile, so:
//   - screenshots render at true retina (2x) resolution with the correct 1440 CSS layout, and
//   - you only log into the Control Panel ONCE (the session is remembered across runs).
//
// Used by scripts/recapture-availability-2x.mjs and any future screenshot-update script.
//
// Requirements (one-time):  npm i -D playwright  &&  npx playwright install chromium
import { chromium } from 'playwright';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';

export const CP_BASE = process.env.RESRV_CP_BASE || 'https://resrv-hotel.test';
// Stable profile dir so login is reused across runs / across different capture scripts.
const PROFILE_DIR = path.join(os.homedir(), '.cache', 'resrv-cp-shot-profile');

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a); }));
}

/**
 * Launch (or reuse) a logged-in 2x Control Panel browser.
 * @returns {{ ctx: import('playwright').BrowserContext, page: import('playwright').Page }}
 */
export async function launchCP({ width = 1440, height = 1600, colorScheme = 'light', headless = false } = {}) {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width, height },
    deviceScaleFactor: 2,          // <-- true 2x output; layout stays at `width` CSS px
    ignoreHTTPSErrors: true,       // local Valet/Herd TLS cert
    colorScheme,                   // the CP follows the system theme: 'dark' captures its dark mode
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(`${CP_BASE}/cp/`, { waitUntil: 'domcontentloaded' });

  // If not authenticated, let the human log in once.
  const needsLogin = /\/(login|auth)/.test(page.url()) || (await page.$('input[type="password"]'));
  if (needsLogin) {
    console.log(`\n>>> Log into the Control Panel in the opened window (${CP_BASE}/cp).`);
    await prompt('>>> Press Enter here once you are on the dashboard... ');
    await page.goto(`${CP_BASE}/cp/`, { waitUntil: 'domcontentloaded' });
  }
  return { ctx, page };
}

/** Clip helper: screenshot a bounding box computed in the page (CSS px in, 2x px out). */
export async function shotClip(page, file, clip) {
  await page.screenshot({ path: file, clip });
}
