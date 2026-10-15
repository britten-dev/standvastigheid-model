// Smoke test. Imports every path in package.json "exports" under plain Node, the way a
// consumer would (through the package's own name, so the exports map itself is tested).
// Needs no browser. Run with `npm test`.
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

let bad = 0;
for (const [subpath, target] of Object.entries(pkg.exports)) {
  const specifier = pkg.name + subpath.slice(1);
  try {
    const mod = await import(specifier, target.endsWith('.json') ? { with: { type: 'json' } } : undefined);
    if (!Object.keys(mod).length) throw new Error('imported, but exports nothing');
    console.log(`ok    ${specifier}`);
  } catch (err) {
    bad++;
    console.error(`FAIL  ${specifier} -> ${target}\n      ${err.message}`);
  }
}

// The same API as surprise-model, so the game can load either ship the same way. The
// list is written down here so the check works without the sister repo; if it is checked
// out beside this one, the live list is compared as well.
const SURPRISE_API = {
  subpaths: ['.', './spec', './hull', './lod', './views', './package.json', './motion', './crew', './detail'],
  main: ['buildShip', 'LODS', 'SAIL_STATES', 'createMotion', 'createSailHandling', 'createDetailLOD', 'preloadSurfaceAssets'],
};
try {
  const sister = JSON.parse(await readFile(new URL('../../surprise-model/package.json', import.meta.url), 'utf8'));
  for (const sp of Object.keys(sister.exports)) if (!SURPRISE_API.subpaths.includes(sp)) SURPRISE_API.subpaths.push(sp);
} catch { /* the sister repo is not checked out here; the written list stands */ }
for (const sp of SURPRISE_API.subpaths) {
  if (!(sp in pkg.exports)) { bad++; console.error(`FAIL  surprise-model exports ${sp}; this package does not`); }
}
const main = await import(pkg.name);
for (const name of SURPRISE_API.main) {
  if (!(name in main)) { bad++; console.error(`FAIL  surprise-model's main entry exports ${name}; this one does not`); }
}

const total = Object.keys(pkg.exports).length;
console.log(`\n${total - bad} of ${total} export paths import cleanly.`);
if (bad) process.exit(1);
