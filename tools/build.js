// Export a GLB for every LOD and every sail state.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { openHarness, ROOT } from './harness.js';
import { TRI_BUDGET as BUDGET } from '../src/ship/lod.js';

const LODS = ['hero', 'game', 'distant'];
const SAILS = ['full', 'topsails', 'storm', 'furled'];

// The distant LOD is a silhouette; four sail states of it is waste. It gets the full
// suit and the furled state only.
const MATRIX = LODS.flatMap((lod) =>
  (lod === 'distant' ? ['full', 'furled'] : SAILS).map((sails) => ({ lod, sails }))
);

const h = await openHarness();
await fs.mkdir(path.join(ROOT, 'build'), { recursive: true });

const report = [];
let failures = 0;

for (const opts of MATRIX) {
  const name = `surprise-${opts.lod}-${opts.sails}.glb`;
  const b64 = await h.page.evaluate((o) => window.exportGLB(o), opts);
  const bytes = Buffer.from(b64, 'base64');
  await fs.writeFile(path.join(ROOT, 'build', name), bytes);
  const stats = await h.page.evaluate((o) => window.stats(o), opts);
  const [lo, hi] = BUDGET[opts.lod];
  const inBudget = stats.tris >= lo && stats.tris <= hi;
  if (!inBudget) failures++;
  report.push({ name, ...opts, ...stats, kb: Math.round(bytes.length / 1024), inBudget });
  console.log(
    `${inBudget ? 'ok  ' : 'OVER'} ${name.padEnd(34)} ${String(stats.tris).padStart(7)} tris  ` +
    `${String(stats.meshes).padStart(4)} meshes  ${String(stats.lines).padStart(5)} lines  ` +
    `${String(Math.round(bytes.length / 1024)).padStart(6)} kB   budget ${lo}-${hi}`
  );
}

await fs.writeFile(path.join(ROOT, 'build', 'manifest.json'), JSON.stringify(report, null, 2));

if (h.problems.length) {
  console.log('\npage problems:');
  h.problems.slice(0, 20).forEach((p) => console.log('  ' + p));
}
await h.close();

if (failures) {
  console.error(`\n${failures} export(s) outside the triangle budget.`);
  process.exit(1);
}
console.log(`\n${report.length} GLB files written to build/`);
