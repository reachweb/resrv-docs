// Serve every docs page at its route with no redirect, as the VitePress site did.
//
// Blume writes each page as dist/<route>/index.html. Cloudflare Pages answers /<route> for that
// file with a 308 to /<route>/, so every link and every indexed URL would take a redirect, and
// the canonical URL (/<route>) would point at one. Moved to dist/<route>.html, the page is served
// at /<route> itself, and Pages redirects /<route>.html and /<route>/ to it, which keeps old
// links to the .html URLs working too.
//
// Only folders that hold nothing but a page whose canonical URL is that folder's route are moved.
// Blume's pages use root-relative links, so moving them up a level breaks none.
//
// Runs after `blume build` (see the build script in package.json).
import { existsSync } from 'node:fs';
import { readdir, readFile, rename, rmdir } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve('dist');

// Every folder under dist, listed before any is moved
const folders = (await readdir(DIST, { withFileTypes: true, recursive: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(entry.parentPath, entry.name));

let moved = 0;
for (const folder of folders) {
  const entries = await readdir(folder);
  if (entries.length !== 1 || entries[0] !== 'index.html') continue;

  const route = path.relative(DIST, folder).split(path.sep).join('/');
  const index = path.join(folder, 'index.html');
  const canonical = (await readFile(index, 'utf8')).match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical || new URL(canonical).pathname !== `/${route}`) continue;

  const target = `${folder}.html`;
  if (existsSync(target)) throw new Error(`Both ${route}/index.html and ${route}.html exist`);
  await rename(index, target);
  await rmdir(folder);
  moved++;
}

console.log(`Flattened ${moved} pages to <route>.html`);
