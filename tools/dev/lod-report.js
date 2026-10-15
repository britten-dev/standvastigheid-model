// Triangles by region at each level of detail. The budget is set per LOD, but it is spent
// per region, and when a level goes over this is the only quick way to see who spent it.
import { openHarness } from '../harness.js';
const h = await openHarness();
const rows = await h.page.evaluate(() => {
  const out = {};
  for (const lod of ['hero', 'game', 'distant']) {
    const ship = window.build({ lod, sails: 'full' });
    const byGroup = {};
    for (const child of ship.children) {
      let tris = 0, lines = 0;
      child.traverse((o) => {
        if (o.isMesh) {
          const g = o.geometry;
          tris += ((g.index ? g.index.count : g.attributes.position.count) / 3) * (o.isInstancedMesh ? o.count : 1);
        } else if (o.isLineSegments) lines += o.geometry.attributes.position.count / 2;
      });
      byGroup[child.name] = { tris: Math.round(tris), lines };
    }
    out[lod] = byGroup;
  }
  return out;
});
await h.close();

const names = [...new Set(Object.values(rows).flatMap((r) => Object.keys(r)))];
console.log('region'.padEnd(20) + ['hero', 'game', 'distant'].map((l) => l.padStart(11)).join('') + '   game%  distant%');
console.log('-'.repeat(74));
const total = {};
for (const lod of ['hero', 'game', 'distant']) {
  total[lod] = Object.values(rows[lod]).reduce((a, b) => a + b.tris, 0);
}
for (const n of names.sort((a, b) => (rows.distant[b]?.tris ?? 0) - (rows.distant[a]?.tris ?? 0))) {
  const g = (l) => rows[l][n]?.tris ?? 0;
  console.log(
    n.padEnd(20) +
    [g('hero'), g('game'), g('distant')].map((v) => String(v).padStart(11)).join('') +
    `   ${(g('game') / Math.max(1, g('hero')) * 100).toFixed(0).padStart(4)}%` +
    `   ${(g('distant') / Math.max(1, g('hero')) * 100).toFixed(0).padStart(6)}%`
  );
}
console.log('-'.repeat(74));
console.log('TOTAL'.padEnd(20) + ['hero', 'game', 'distant'].map((l) => String(total[l]).padStart(11)).join(''));
