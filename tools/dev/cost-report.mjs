// Triangles and draw calls per top-level group, at each level. Draw calls are visible
// meshes times their material count; line objects count too.
import { openHarness } from '../harness.js';
const h = await openHarness();
const lods = process.argv.slice(2).length ? process.argv.slice(2) : ['game', 'hero', 'cinematic', 'distant'];
for (const lod of lods) {
  const r = await h.page.evaluate((lod) => {
    const out = {};
    for (const crew of [true, false]) {
      const ship = window.build({ lod, sails: 'full', crew });
      const groups = {};
      let total = { tris: 0, calls: 0 };
      for (const g of ship.children) {
        let tris = 0, calls = 0;
        g.traverseVisible((o) => {
          if (o.isMesh) {
            const n = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
            tris += n * (o.isInstancedMesh ? o.count : 1);
            calls += Array.isArray(o.material) ? o.material.length : 1;
          } else if (o.isLine) calls++;
        });
        groups[g.name] = { tris: Math.round(tris), calls };
        total.tris += tris; total.calls += calls;
      }
      out[crew ? 'crew' : 'nocrew'] = { total: { tris: Math.round(total.tris), calls: total.calls }, groups };
    }
    return out;
  }, lod);
  console.log(`\n== ${lod}: with crew ${r.crew.total.tris} tris ${r.crew.total.calls} calls; without ${r.nocrew.total.tris} tris ${r.nocrew.total.calls} calls`);
  for (const [k, v] of Object.entries(r.crew.groups)) console.log(`   ${k.padEnd(16)} ${String(v.tris).padStart(8)} tris ${String(v.calls).padStart(4)} calls`);
}
await h.close();
