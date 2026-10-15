// The world bounding box of every mesh in the ship, and the pairs that overlap.
//
// This is the tool the module contract points people at for finding parts in the wrong
// place, so it must not lie by omission: it prints everything, and it looks for parts
// occupying the same volume, which is the failure mode when regions are built in
// parallel by people who cannot see each other's work.
import { openHarness } from '../harness.js';

const args = process.argv.slice(2);
const filter = args.find((a) => !a.startsWith('--'));
const overlapsOnly = args.includes('--overlaps');

const h = await openHarness();
const data = await h.page.evaluate(() => {
  const THREE = window.THREE;
  const ship = window.build({ lod: 'hero', sails: 'full' });
  ship.updateWorldMatrix(true, true);
  const rows = [];
  ship.traverse((o) => {
    if (!o.isMesh && !o.isLineSegments) return;
    const b = new THREE.Box3().setFromObject(o);
    if (b.isEmpty()) return;
    // The region is the top-level group the part belongs to, which is what you need to
    // know when two modules disagree.
    let region = o, p = o.parent;
    while (p && p.parent) { region = p; p = p.parent; }
    rows.push({
      name: o.name || o.type,
      region: region.name || '?',
      min: b.min.toArray().map((v) => +v.toFixed(2)),
      max: b.max.toArray().map((v) => +v.toFixed(2)),
      tris: o.isMesh
        ? Math.round(((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3)
          * (o.isInstancedMesh ? o.count : 1))
        : 0,
    });
  });
  return rows;
});
await h.close();

const shown = filter ? data.filter((r) => (r.name + r.region).includes(filter)) : data;

if (!overlapsOnly) {
  console.log('region'.padEnd(16) + 'part'.padEnd(30) + 'x'.padStart(16) + 'y'.padStart(16) + 'z'.padStart(16) + 'tris'.padStart(9));
  console.log('-'.repeat(103));
  for (const r of shown) {
    const span = (i) => `${r.min[i].toFixed(1)}…${r.max[i].toFixed(1)}`;
    console.log(
      r.region.slice(0, 15).padEnd(16) + r.name.slice(0, 29).padEnd(30) +
      span(0).padStart(16) + span(1).padStart(16) + span(2).padStart(16) +
      String(r.tris).padStart(9)
    );
  }
  console.log(`\n${data.length} parts.`);
}

// Parts from DIFFERENT regions occupying the same space.
//
// This is done on the vertices, not on bounding boxes. Most of this ship is built as
// merged meshes — all twenty-four gun breechings are one object — so a bounding box
// round one of them is a box round the whole ship and overlaps everything. Quantising
// the actual vertices into a coarse grid and counting shared cells finds the collisions
// that matter and almost nothing else.
const cells = await (async () => {
  const h2 = await openHarness();
  const out = await h2.page.evaluate((size) => {
    const THREE = window.THREE;
    const ship = window.build({ lod: 'hero', sails: 'full' });
    ship.updateWorldMatrix(true, true);
    const rows = [];
    const v = new THREE.Vector3();
    ship.traverse((o) => {
      if (!o.isMesh) return;
      let region = o, p = o.parent;
      while (p && p.parent) { region = p; p = p.parent; }
      const pos = o.geometry.attributes.position;
      const step = Math.max(1, Math.ceil(pos.count / 6000));
      const set = new Set();
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        set.add(`${Math.round(v.x / size)},${Math.round(v.y / size)},${Math.round(v.z / size)}`);
      }
      rows.push({ name: o.name || o.type, region: region.name || '?', cells: [...set] });
    });
    return rows;
  }, 0.12);
  await h2.close();
  return out;
})();

const hits = [];
for (let i = 0; i < cells.length; i++) {
  for (let j = i + 1; j < cells.length; j++) {
    if (cells[i].region === cells[j].region) continue;
    const small = cells[i].cells.length < cells[j].cells.length ? cells[i] : cells[j];
    const big = new Set((small === cells[i] ? cells[j] : cells[i]).cells);
    let shared = 0;
    for (const c of small.cells) if (big.has(c)) shared++;
    if (shared >= 25) hits.push({ a: cells[i], b: cells[j], f: shared / small.cells.length, shared });
  }
}
hits.sort((x, y) => y.shared - x.shared);
if (hits.length) {
  console.log(`\n${hits.length} cross-region collision(s), worst first. Shared cells are 12 cm cubes`);
  console.log('containing vertices of both parts. A few is a part resting on another; hundreds is one built through the other.');
  for (const hit of hits.slice(0, 25)) {
    console.log(`  ${String(hit.shared).padStart(5)} cells  ${(hit.f * 100).toFixed(0).padStart(3)}% of the smaller  ` +
      `${hit.a.region}/${hit.a.name}  ×  ${hit.b.region}/${hit.b.name}`);
  }
} else {
  console.log('\nno cross-region collisions.');
}
