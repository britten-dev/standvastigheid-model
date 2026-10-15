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

const total = Object.keys(pkg.exports).length;
console.log(`\n${total - bad} of ${total} export paths import cleanly.`);
if (bad) process.exit(1);
