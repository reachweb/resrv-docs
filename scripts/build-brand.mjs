// Builds the Resrv brand kit in brand/ from the vector geometry in this file.
//
//   node scripts/build-brand.mjs          everything: SVG, PNG, PDF, EPS, favicons, social, Statamic
//   node scripts/build-brand.mjs --svg    the SVG masters only (fast, for checking geometry)
//
// Needs Playwright's Chromium (npx playwright install chromium), ImageMagick (magick) for favicon.ico
// and Ghostscript (gs) for EPS. Every raster and PDF file is rendered from the SVG markup below, so
// change the geometry here and re-run rather than editing the output files.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'brand');
const SVG_ONLY = process.argv.includes('--svg');

export const COLORS = {
  orange: '#F56B3C',
  amber: '#F8AD22',
  ink: '#171718',
  white: '#FFFFFF',
  black: '#000000',
};
const TAGLINE = 'Booking system for Statamic';

// The RESRV letters from the previous logo (public/logo-light.svg), with its 1.186 horizontal
// stretch baked in and moved to 0,0. Units: the cap height is 216.23.
const WORDMARK = {
  w: 1143.61,
  h: 216.23,
  paths: [
    'M 207.96 86.98 L 207.96 81.16 C 207.96 28.79 181.62 0 120.36 0 L 9.19 0 C 3.37 0 0 3.37 0 9.19 L 0 207.04 C 0 212.86 3.37 216.23 9.19 216.23 L 45.33 216.23 C 51.15 216.23 54.52 212.86 54.52 207.04 L 54.52 166.92 L 113.32 166.92 L 140.27 210.1 C 142.72 214.39 146.4 216.23 151.29 216.23 L 192.65 216.23 C 199.99 216.23 202.75 211.63 198.46 205.2 L 167.53 160.79 C 196.31 149.15 207.96 122.2 207.96 86.98 Z M 54.52 52.07 L 115.77 52.07 C 139.66 52.07 153.13 55.44 153.13 81.47 L 153.13 86.37 C 153.13 112.4 138.74 115.46 115.77 115.46 L 54.52 115.46 L 54.52 52.07 Z',
    'M 248.69 216.23 L 413.16 216.23 C 418.97 216.23 422.34 212.86 422.34 207.04 L 422.34 173.35 C 422.34 167.53 418.97 164.16 413.16 164.16 L 293.72 164.16 L 293.72 131.08 L 366.3 131.08 C 372.12 131.08 375.48 127.71 375.48 121.9 L 375.48 93.11 C 375.48 87.29 372.12 83.92 366.3 83.92 L 293.72 83.92 L 293.72 52.07 L 413.16 52.07 C 418.97 52.07 422.34 48.7 422.34 42.88 L 422.34 9.19 C 422.34 3.37 418.97 0 413.16 0 L 248.69 0 C 242.87 0 239.5 3.37 239.5 9.19 L 239.5 207.04 C 239.5 212.86 242.87 216.23 248.69 216.23 Z',
    'M 516.98 216.23 L 579.15 216.23 C 630.92 216.23 651.74 191.42 651.74 149.77 C 651.74 109.34 633.05 90.96 586.51 87.59 L 517.29 82.39 C 504.73 81.47 499.83 77.79 499.83 66.77 C 499.83 55.74 505.65 52.07 519.13 52.07 L 576.09 52.07 C 585.58 52.07 591.1 55.74 593.24 64.01 C 594.77 69.83 597.23 72.89 602.73 72.89 L 639.19 72.89 C 645 72.89 648.68 69.52 648.37 63.4 C 645.31 22.66 622.34 0 576.09 0 L 518.51 0 C 466.75 0 445.92 24.81 445.92 66.46 C 445.92 107.19 464.3 124.65 511.17 128.33 L 580.39 133.53 C 592.94 134.45 597.83 138.13 597.83 149.46 C 597.83 160.49 592.02 164.16 578.55 164.16 L 516.98 164.16 C 507.49 164.16 501.97 160.49 499.83 152.22 C 498.3 146.4 495.85 143.33 490.34 143.33 L 453.9 143.33 C 448.07 143.33 444.39 146.7 444.7 152.83 C 447.76 193.56 470.74 216.23 516.98 216.23 Z',
    'M 892.77 86.98 L 892.77 81.16 C 892.77 28.79 866.44 0 805.18 0 L 694 0 C 688.19 0 684.82 3.37 684.82 9.19 L 684.82 207.04 C 684.82 212.86 688.19 216.23 694 216.23 L 730.15 216.23 C 735.96 216.23 739.33 212.86 739.33 207.04 L 739.33 166.92 L 798.13 166.92 L 825.08 210.1 C 827.54 214.39 831.22 216.23 836.12 216.23 L 877.46 216.23 C 884.81 216.23 887.56 211.63 883.28 205.2 L 852.34 160.79 C 881.14 149.15 892.77 122.2 892.77 86.98 Z M 739.33 52.07 L 800.59 52.07 C 824.48 52.07 837.96 55.44 837.96 81.47 L 837.96 86.37 C 837.96 112.4 823.55 115.46 800.59 115.46 L 739.33 115.46 L 739.33 52.07 Z',
    'M 997.21 216.23 L 1047.14 216.23 C 1052.34 216.23 1056.01 213.78 1057.85 209.18 L 1140.85 10.72 C 1143.61 4.29 1140.54 0 1133.81 0 L 1094.91 0 C 1089.7 0 1086.33 2.14 1084.49 7.04 L 1022.32 159.87 L 960.15 7.04 C 958.31 2.14 954.65 0 949.43 0 L 910.54 0 C 903.8 0 900.73 4.29 903.5 10.72 L 986.5 209.18 C 988.32 213.78 992 216.23 997.21 216.23 Z',
  ],
};

// ---------- the mark, in units on a 120 × 124 grid ----------
const ICON = { w: 120, h: 124 };
const TILE = { x: 0, y: 12, w: 120, h: 112, r: 26 };   // outer edge of the gradient border
const INNER = { x: 9, y: 21, w: 102, h: 94, r: 17 };   // the ink calendar page (border = 9)
const TAB_X = [37, 83];                                // centers of the two binder tabs
const RIM = { w: 21, y: 0, h: 33 };                    // gradient collar around each tab
const TAB = { w: 11, y: 5, h: 23 };                    // the ink tab inside the collar
const BAR_H = 15;
const BARS = [                                         // reservations on a timeline
  { x: 18, y: 45, w: 58, fill: 'orange' },
  { x: 36, y: 66, w: 60, fill: 'amber' },
  { x: 54, y: 87, w: 48, fill: 'white' },
];

const n = (v) => +v.toFixed(2);

// Rounded rectangle as a path. Clockwise by default; ccw=true reverses it (used to cut holes
// with the nonzero fill rule in the one-color mark).
function rr(x, y, w, h, r, ccw = false) {
  r = Math.min(r, w / 2, h / 2);
  const [x0, y0, x1, y1] = [x, y, x + w, y + h].map(n);
  const R = n(r);
  if (!ccw) {
    return `M${n(x + r)} ${y0}H${n(x1 - r)}A${R} ${R} 0 0 1 ${x1} ${n(y + r)}V${n(y1 - r)}A${R} ${R} 0 0 1 ${n(x1 - r)} ${y1}H${n(x + r)}A${R} ${R} 0 0 1 ${x0} ${n(y1 - r)}V${n(y + r)}A${R} ${R} 0 0 1 ${n(x + r)} ${y0}Z`;
  }
  return `M${n(x + r)} ${y0}A${R} ${R} 0 0 0 ${x0} ${n(y + r)}V${n(y1 - r)}A${R} ${R} 0 0 0 ${n(x + r)} ${y1}H${n(x1 - r)}A${R} ${R} 0 0 0 ${x1} ${n(y1 - r)}V${n(y + r)}A${R} ${R} 0 0 0 ${n(x1 - r)} ${y0}H${n(x + r)}Z`;
}
const rimPath = (cx, ccw) => rr(cx - RIM.w / 2, RIM.y, RIM.w, RIM.h, RIM.w / 2, ccw);
const tabPath = (cx, ccw) => rr(cx - TAB.w / 2, TAB.y, TAB.w, TAB.h, TAB.w / 2, ccw);
const barPath = (b) => rr(b.x, b.y, b.w, BAR_H, BAR_H / 2);

const GRADIENT_ID = 'resrv-gradient';
const gradientDef = () =>
  `<linearGradient id="${GRADIENT_ID}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${ICON.w}" y2="${ICON.h}">` +
  `<stop offset="0" stop-color="${COLORS.orange}"/><stop offset="1" stop-color="${COLORS.amber}"/></linearGradient>`;

// Full-color mark: gradient border and collars, ink page and tabs, orange/amber/white bars.
function iconColor() {
  const g = `url(#${GRADIENT_ID})`;
  return [
    `<path fill="${g}" d="${rr(TILE.x, TILE.y, TILE.w, TILE.h, TILE.r)}"/>`,
    `<path fill="${COLORS.ink}" d="${rr(INNER.x, INNER.y, INNER.w, INNER.h, INNER.r)}"/>`,
    `<path fill="${g}" d="${TAB_X.map((cx) => rimPath(cx)).join('')}"/>`,
    `<path fill="${COLORS.ink}" d="${TAB_X.map((cx) => tabPath(cx)).join('')}"/>`,
    ...BARS.map((b) => `<path fill="${COLORS[b.fill]}" d="${barPath(b)}"/>`),
  ].join('');
}

// One-color mark: everything that is colored in the full-color mark becomes the one color and
// everything ink becomes a hole, drawn as a single nonzero path so PDF and EPS stay pure vector.
function iconMonoPath() {
  const parts = [rr(TILE.x, TILE.y, TILE.w, TILE.h, TILE.r), rr(INNER.x, INNER.y, INNER.w, INNER.h, INNER.r, true)];
  for (const cx of TAB_X) {
    parts.push(rimPath(cx, false), tabPath(cx, true));
    // where a tab crosses the border band, cancel the border too
    parts.push(rr(cx - TAB.w / 2, TILE.y, TAB.w, INNER.y - TILE.y, 0, true));
  }
  for (const b of BARS) parts.push(barPath(b));
  return parts.join('');
}
const iconMono = (fill) => `<path fill="${fill}" fill-rule="nonzero" d="${iconMonoPath()}"/>`;

const wordmark = (fill) => `<g fill="${fill}">${WORDMARK.paths.map((d) => `<path d="${d}"/>`).join('')}</g>`;
const place = (x, y, s, body) => `<g transform="translate(${n(x)} ${n(y)})${s === 1 ? '' : ` scale(${s})`}">${body}</g>`;

// ---------- logo versions ----------
// Horizontal: the mark is 1.79 × the cap height, 0.35 × cap height from the name, and the name
// sits slightly below the mark's middle (on the calendar page rather than the tabs).
const H_SCALE = 3.125;
const H_GAP = 75;
const H_WORD_Y = 92;
// Stacked: the mark is 2.29 × the cap height, centered over the name.
const S_SCALE = 4;
const S_GAP = 96;

const VERSIONS = {
  icon: { w: ICON.w, h: ICON.h, padRatio: 0.06, draw: (mark) => mark },
  'logo-horizontal': {
    w: ICON.w * H_SCALE + H_GAP + WORDMARK.w,
    h: ICON.h * H_SCALE,
    padRatio: 0.06,
    draw: (mark, word) => place(0, 0, H_SCALE, mark) + place(ICON.w * H_SCALE + H_GAP, H_WORD_Y, 1, word),
  },
  'logo-stacked': {
    w: WORDMARK.w,
    h: ICON.h * S_SCALE + S_GAP + WORDMARK.h,
    padRatio: 0.06,
    draw: (mark, word) => place((WORDMARK.w - ICON.w * S_SCALE) / 2, 0, S_SCALE, mark) + place(0, ICON.h * S_SCALE + S_GAP, 1, word),
  },
  wordmark: { w: WORDMARK.w, h: WORDMARK.h, padRatio: 0.12, draw: (_mark, word) => word },
};

const COLORWAYS = {
  color: { mark: () => iconColor(), word: COLORS.ink, gradient: true },
  reversed: { mark: () => iconColor(), word: COLORS.white, gradient: true },
  black: { mark: () => iconMono(COLORS.black), word: COLORS.black },
  white: { mark: () => iconMono(COLORS.white), word: COLORS.white },
};

// The logo files carry a little transparent padding; layouts (social, favicons) use tight=true.
export function buildSVG(version, colorway, { tight = false } = {}) {
  const v = VERSIONS[version];
  const c = COLORWAYS[colorway];
  const pad = tight ? 0 : n(Math.max(v.w, v.h) * v.padRatio * (version === 'wordmark' ? 0.5 : 1));
  const vb = [-pad, -pad, n(v.w + 2 * pad), n(v.h + 2 * pad)];
  const defs = c.gradient && version !== 'wordmark' ? `<defs>${gradientDef()}</defs>` : '';
  const body = v.draw(c.mark(), wordmark(c.word));
  return {
    w: vb[2],
    h: vb[3],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="${Math.round(vb[2])}" height="${Math.round(vb[3])}"><title>Resrv</title>${defs}${body}</svg>\n`,
  };
}

const LOGO_FILES = [];
for (const version of Object.keys(VERSIONS)) {
  for (const colorway of Object.keys(COLORWAYS)) {
    if (version === 'wordmark' && colorway === 'reversed') continue; // the wordmark has no mark to keep in color: use white
    LOGO_FILES.push({ version, colorway, name: `resrv-${version}-${colorway}` });
  }
}

// ---------- helpers ----------
const write = async (rel, data) => {
  const file = path.join(OUT, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  return file;
};
const b64 = (s) => Buffer.from(s).toString('base64');

async function renderPNG(page, svg, w, h, rel, background = null) {
  w = Math.round(w); h = Math.round(h);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;background:${background || 'transparent'}}img{display:block;width:${w}px;height:${h}px}</style></head>` +
    `<body><img src="data:image/svg+xml;base64,${b64(svg)}"></body></html>`,
  );
  await page.waitForFunction(() => document.images[0]?.complete);
  const file = path.join(OUT, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, omitBackground: !background, clip: { x: 0, y: 0, width: w, height: h } });
  return file;
}

async function renderHTML(page, html, w, h, rel) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(OUT, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: h } });
  return file;
}

async function renderPDF(page, svg, w, h, rel) {
  // Long side 600 CSS px = 450 pt (about 16 cm); it is vector, so the size only sets the default.
  const k = 600 / Math.max(w, h);
  const [pw, ph] = [n(w * k), n(h * k)];
  const inline = svg.replace(/ width="\d+" height="\d+"/, ` width="${pw}" height="${ph}"`);
  await page.setContent(`<!doctype html><html><head><style>@page{size:${pw}px ${ph}px;margin:0}html,body{margin:0}svg{display:block}</style></head><body>${inline}</body></html>`);
  const file = path.join(OUT, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await page.pdf({ path: file, width: `${pw}px`, height: `${ph}px`, printBackground: true, pageRanges: '1', margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  return file;
}

// ---------- build ----------
async function main() {
  const svgs = {};
  for (const f of LOGO_FILES) {
    svgs[f.name] = buildSVG(f.version, f.colorway);
    await write(`logo/svg/${f.name}.svg`, svgs[f.name].svg);
  }
  console.log(`svg: ${LOGO_FILES.length} files`);
  if (SVG_ONLY) return;
  await buildRest(svgs);
}

async function buildRest(svgs) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await fs.mkdir(path.join(OUT, 'logo/eps'), { recursive: true });

  for (const f of LOGO_FILES) {
    const { w, h, svg } = svgs[f.name];
    for (const long of [1000, 4000]) {
      const k = long / Math.max(w, h);
      await renderPNG(page, svg, w * k, h * k, `logo/png/${f.name}-${long}.png`);
    }
    const pdf = await renderPDF(page, svg, w, h, `logo/pdf/${f.name}.pdf`);
    execFileSync('gs', ['-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=eps2write', `-sOutputFile=${path.join(OUT, 'logo/eps', `${f.name}.eps`)}`, pdf]);
  }
  console.log(`png, pdf, eps: ${LOGO_FILES.length} logos`);

  await buildFavicons(page);
  await buildSocial(page);
  await buildStatamic(page);
  await browser.close();
}

// ---------- favicons ----------
// Below 32 px the full mark's tabs and border blur together, so favicon.svg and the 16 px PNG use
// a simplified cut drawn on a 16 px grid: same tile, border, tabs and bars, snapped to pixels.
function smallMark() {
  const R = (x, y, w, h, r) => rr(x, y, w, h, r);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><title>Resrv</title>` +
    `<defs><linearGradient id="${GRADIENT_ID}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="16" y2="16"><stop offset="0" stop-color="${COLORS.orange}"/><stop offset="1" stop-color="${COLORS.amber}"/></linearGradient></defs>` +
    `<path fill="url(#${GRADIENT_ID})" d="${R(0, 1, 16, 15, 4)}"/>` +
    `<path fill="${COLORS.ink}" d="${R(2, 3, 12, 11, 2)}"/>` +
    `<path fill="url(#${GRADIENT_ID})" d="${R(4, 0, 2, 4, 1)}${R(10, 0, 2, 4, 1)}"/>` +
    `<path fill="${COLORS.orange}" d="${R(3, 5, 6, 2, 1)}"/>` +
    `<path fill="${COLORS.amber}" d="${R(5, 8, 7, 2, 1)}"/>` +
    `<path fill="${COLORS.white}" d="${R(7, 11, 6, 2, 1)}"/></svg>\n`;
}

// The full-color mark centered on a square canvas, optionally on a solid background.
function markOnSquare(size, markHeight, background = null, colorway = 'color') {
  const s = markHeight / ICON.h;
  const x = (size - ICON.w * s) / 2;
  const y = (size - ICON.h * s) / 2;
  const c = COLORWAYS[colorway];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><title>Resrv</title>` +
    (c.gradient ? `<defs>${gradientDef()}</defs>` : '') +
    (background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : '') +
    place(x, y, n(s), c.mark()) + `</svg>\n`;
}

async function buildFavicons(page) {
  const small = smallMark();
  await write('favicon/favicon.svg', small);
  const f16 = await renderPNG(page, small, 16, 16, 'favicon/favicon-16.png');
  const f32 = await renderPNG(page, markOnSquare(32, 31), 32, 32, 'favicon/favicon-32.png');
  const f48 = await renderPNG(page, markOnSquare(48, 46), 48, 48, 'favicon/.favicon-48.png');
  execFileSync('magick', [f16, f32, f48, path.join(OUT, 'favicon/favicon.ico')]);
  await fs.rm(f48);
  // Home screen icons: white square, mark inside the maskable safe zone (the middle 80% circle).
  await renderPNG(page, markOnSquare(180, 120, COLORS.white), 180, 180, 'favicon/apple-touch-icon.png');
  for (const size of [192, 512]) {
    await renderPNG(page, markOnSquare(size, Math.round(size * 0.56), COLORS.white), size, size, `favicon/android-chrome-${size}.png`);
  }
  console.log('favicons: done');
}

// ---------- social and Statamic images ----------
let fontCSS = null;
async function getFontCSS() {
  if (!fontCSS) {
    const ttf = await fs.readFile(path.join(OUT, 'font', 'Archivo[wdth,wght].ttf'));
    fontCSS = `@font-face{font-family:"Archivo";src:url(data:font/ttf;base64,${ttf.toString('base64')}) format("truetype");font-weight:100 900;font-stretch:62% 125%}`;
  }
  return fontCSS;
}

const THEMES = {
  light: { bg: COLORS.white, logo: 'color', tagline: '#5C5C63' },
  dark: { bg: COLORS.ink, logo: 'reversed', tagline: '#B9B9C0' },
};

// A centered composition: one logo version at a given width, optionally the tagline below it.
async function poster(page, { w, h, theme, version = 'logo-horizontal', logoWidth, tagline = 0, gap = 0, offsetY = 0 }, rel) {
  const t = THEMES[theme];
  const logo = buildSVG(version, t.logo, { tight: true });
  const logoHeight = n((logo.h / logo.w) * logoWidth);
  const html = `<!doctype html><html><head><style>${await getFontCSS()}
    html,body{margin:0;width:${w}px;height:${h}px;background:${t.bg};overflow:hidden}
    .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${gap}px;transform:translateY(${offsetY}px)}
    .c img{display:block;width:${logoWidth}px;height:${logoHeight}px}
    .t{font-family:"Archivo",sans-serif;font-weight:600;font-stretch:112%;font-size:${tagline}px;line-height:1;letter-spacing:0.01em;color:${t.tagline};white-space:nowrap}
  </style></head><body><div class="c"><img src="data:image/svg+xml;base64,${b64(logo.svg)}" alt="">` +
    (tagline ? `<div class="t">${TAGLINE}</div>` : '') + `</div></body></html>`;
  return renderHTML(page, html, w, h, rel);
}

async function buildSocial(page) {
  for (const theme of ['light', 'dark']) {
    await poster(page, { w: 1200, h: 630, theme, logoWidth: 680, tagline: 40, gap: 40 }, `social/link-preview-1200x630-${theme}.png`);
    await poster(page, { w: 1080, h: 1080, theme, version: 'icon', logoWidth: 560 }, `social/profile-picture-1080-${theme}.png`);
  }
  await poster(page, { w: 1500, h: 500, theme: 'dark', logoWidth: 720, tagline: 36, gap: 34 }, 'social/x-header-1500x500.png');
  await poster(page, { w: 1128, h: 191, theme: 'dark', logoWidth: 330, tagline: 18, gap: 16 }, 'social/linkedin-cover-1128x191.png');
  await poster(page, { w: 1640, h: 624, theme: 'dark', logoWidth: 760, tagline: 40, gap: 40 }, 'social/facebook-cover-1640x624.png');
  await poster(page, { w: 2560, h: 1440, theme: 'dark', logoWidth: 1100, tagline: 56, gap: 52 }, 'social/youtube-banner-2560x1440.png');
  await poster(page, { w: 1280, h: 640, theme: 'dark', logoWidth: 720, tagline: 42, gap: 42 }, 'social/github-social-preview-1280x640.png');
  console.log('social: done');
}

async function buildStatamic(page) {
  // The Marketplace product image and screenshots come from scripts/build-marketplace.mjs.
  // Control panel navigation icon: the 16 px cut in one color (currentColor), so it is crisp at the
  // CP's 16 px icon size and follows the navigation's text color. Nonzero rule: the page is a hole,
  // the tab nubs and bars are filled.
  const mono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" fill-rule="nonzero" d="` +
    rr(0, 1, 16, 15, 4) + rr(2, 3, 12, 11, 2, true) + rr(4, 0, 2, 4, 1) + rr(10, 0, 2, 4, 1) +
    rr(3, 5, 6, 2, 1) + rr(5, 8, 7, 2, 1) + rr(7, 11, 6, 2, 1) + `"/></svg>\n`;
  await write('statamic/cp-nav-icon.svg', mono);
  console.log('statamic: done');
}

main().catch((e) => { console.error(e); process.exit(1); });
