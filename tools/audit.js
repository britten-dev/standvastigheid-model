// The audit. It measures the built model and diffs every measurement against the
// number in the spec, so that a change to the generator that quietly moves a mast or
// shortens a yard is caught rather than admired.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { openHarness, ROOT } from './harness.js';

const h = await openHarness();
// The measurement code imports the spec itself and returns each measurement already
// paired with the number it is supposed to match, so the browser is the only place
// that needs to know both sides of the comparison.
const measured = await h.page.evaluate(() => window.measure({ lod: 'hero', sails: 'full' }));
const rows = measured.rows;

const tol = (r) => r.tolerance ?? 0.02;
let bad = 0, warn = 0;
const w = { key: 34, exp: 11, act: 11, dev: 9 };

console.log(
  'key'.padEnd(w.key) + 'expected'.padStart(w.exp) + 'measured'.padStart(w.act) +
  'dev'.padStart(w.dev) + '  source'
);
console.log('-'.repeat(96));

for (const r of rows) {
  const dev = r.expected === 0 ? Math.abs(r.actual) : (r.actual - r.expected) / r.expected;
  const abs = Math.abs(dev);
  const state = abs <= tol(r) ? 'ok' : abs <= tol(r) * 2.5 ? 'warn' : 'FAIL';
  if (state === 'FAIL') bad++;
  if (state === 'warn') warn++;
  const mark = state === 'ok' ? ' ' : state === 'warn' ? '?' : '!';
  console.log(
    mark + r.key.padEnd(w.key - 1) +
    r.expected.toFixed(3).padStart(w.exp) +
    r.actual.toFixed(3).padStart(w.act) +
    `${(dev * 100).toFixed(1)}%`.padStart(w.dev) +
    `  ${r.source ?? ''}`
  );
}

await fs.mkdir(path.join(ROOT, 'build'), { recursive: true });
await fs.writeFile(path.join(ROOT, 'build', 'audit.json'), JSON.stringify(rows, null, 2));

console.log('-'.repeat(96));
console.log(`${rows.length} measurements: ${rows.length - bad - warn} ok, ${warn} warn, ${bad} fail`);

if (measured.missing.length) {
  console.log(`\n${measured.missing.length} broken audit tag(s):`);
  measured.missing.forEach((m) => console.log('  ' + m));
}
if (measured.unchecked.length) {
  console.log(`\n${measured.unchecked.length} spec row(s) nothing is measured against:`);
  console.log('  ' + measured.unchecked.join(', '));
}

if (h.problems.length) {
  console.log('\npage problems:');
  h.problems.slice(0, 20).forEach((p) => console.log('  ' + p));
}
await h.close();
process.exit(bad || measured.missing.length ? 1 : 0);
