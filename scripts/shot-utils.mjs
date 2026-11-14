// Shared helpers for the per-page 2x recapture scripts.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export const IMG = path.resolve('public/img');
export const TMP = path.resolve('.tmp-shots');
mkdirSync(TMP, { recursive: true });

export const png = (n) => path.join(TMP, `${n}.png`);

/** Convert a captured PNG to webp, overwriting the doc image of the same name. */
export const toWebp = (name) =>
  execFileSync('cwebp', ['-q', '92', png(name), '-o', path.join(IMG, `${name}.webp`)], { stdio: 'ignore' });

/** Dismiss the trial-mode "Licensing Alert" toast if it shows up. */
export async function snooze(page) {
  try {
    const b = page.getByRole('button', { name: 'Snooze' });
    await b.waitFor({ timeout: 2500 });
    await b.click();
    await page.waitForTimeout(400);
  } catch {}
}

/** Fill the input/textarea belonging to a label, replacing its contents. */
export async function fillByLabel(page, labelText, value) {
  const el = await page.evaluateHandle((lt) => {
    const label = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === lt);
    let n = label;
    while (n && !(n.querySelector && n.querySelector('input, textarea'))) n = n.parentElement;
    return n.querySelector('input, textarea');
  }, labelText);
  const input = el.asElement();
  await input.click({ clickCount: 3 });
  await input.press('Backspace');
  await input.type(value);
}

/** Scroll the CP's inner content container so an element (by exact leaf text) is in view. */
export async function scrollContentTo(page, leafText, offset = 80) {
  await page.evaluate(({ lt, off }) => {
    const sc = document.querySelector('.main-content') || document.scrollingElement;
    const el = [...sc.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === lt);
    if (el && sc) sc.scrollTop += el.getBoundingClientRect().top - off;
  }, { lt: leafText, off: offset });
  await page.waitForTimeout(500);
}

/** Compute a clip rect that covers the union of element rects (found by callback in page). */
export function pad(rect, p = 16) {
  return { x: Math.max(0, Math.round(rect.x - p)), y: Math.max(0, Math.round(rect.y - p)), width: Math.round(rect.width + 2 * p), height: Math.round(rect.height + 2 * p) };
}
