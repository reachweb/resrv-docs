// Recapture the add-affiliate form at 2x (Statamic 6 / Resrv v6).
//   resrv-affiliates-add.webp - Resrv > Affiliates > "Add a new affiliate" panel,
//   filled with sample values but NEVER saved (closed with Escape).
//
// Run:  node scripts/recapture-affiliates-2x.mjs
import { launchCP, CP_BASE } from './cp-browser.mjs';
import { png, toWebp, snooze, fillByLabel } from './shot-utils.mjs';

const { ctx, page } = await launchCP({ width: 1440, height: 1800 });

await page.goto(`${CP_BASE}/cp/resrv/affiliates`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await snooze(page);

await page.getByRole('button', { name: /Add a new affiliate/i }).click();
await page.waitForTimeout(1200);
console.log(await page.evaluate(() => document.body.innerText.replace(/\n{2,}/g, '\n').slice(500, 1500)));

await fillByLabel(page, 'Name', 'Island Concierge');
await fillByLabel(page, 'Code', 'ISLAND');
await fillByLabel(page, 'Email', 'bookings@islandconcierge.example');
await fillByLabel(page, 'Cookie duration in days', '30');
await fillByLabel(page, 'Fee', '10');
// let the affiliate book on behalf of clients without paying (doc example)
const skip = page.getByRole('switch', { name: /Allow skipping payment/i }).first();
if (await skip.count()) await skip.click();
else {
  await page.evaluate(() => {
    const lbl = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Allow skipping payment/.test(e.textContent));
    let n = lbl;
    while (n && !n.querySelector('[role=switch], button[aria-checked]')) n = n.parentElement;
    n.querySelector('[role=switch], button[aria-checked]').click();
  });
}
await page.waitForTimeout(500);

const clip = await page.evaluate(() => {
  // the slide-over is a narrow right panel: find it by climbing from the header SPAN
  // (the panel title) until the element is 300-700px wide
  const leaves = [...document.querySelectorAll('*')]
    .filter((e) => e.children.length === 0 && e.textContent.trim() === 'Add a new affiliate');
  const title = leaves.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
  let panel = title;
  while (panel && panel.getBoundingClientRect().width < 300) panel = panel.parentElement;
  while (panel.parentElement && panel.parentElement.getBoundingClientRect().width < 700) panel = panel.parentElement;
  const p = panel.getBoundingClientRect();
  const pub = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Published' && e.getBoundingClientRect().left > p.left - 50);
  const bottom = pub.getBoundingClientRect().bottom;
  return { x: Math.round(p.left + 1), y: Math.round(p.top + 1), width: Math.round(p.width - 2), height: Math.round(bottom + 32 - p.top) };
});
await page.screenshot({ path: png('resrv-affiliates-add'), clip });
await page.keyboard.press('Escape'); // close without saving

await ctx.close();
console.log('Converting to webp...');
toWebp('resrv-affiliates-add');
console.log('Done.');
