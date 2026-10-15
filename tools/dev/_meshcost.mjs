import { openHarness } from '../harness.js';
const h = await openHarness();
const [lod, ...groups] = process.argv.slice(2);
const r = await h.page.evaluate(([lod, groups]) => {
  const ship = window.build({ lod, sails: 'full', crew: false }), rows = [];
  for (const gname of groups) {
    const g = ship.getObjectByName(gname), agg = new Map();
    g.traverseVisible((o) => {
      if (!o.isMesh) return;
      const n = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
      const k = `${gname}: ${o.name || '(' + o.parent.name + ')'}`;
      const a = agg.get(k) || { tris: 0, n: 0, inst: o.isInstancedMesh ? o.count : 0 }; a.tris += n; a.n++; agg.set(k, a);
    });
    for (const [k, v] of agg) rows.push([k, Math.round(v.tris), v.n, v.inst]);
  }
  return rows.sort((a, b) => b[1] - a[1]).slice(0, 40);
}, [lod, groups]);
for (const [k, t, n, i] of r) console.log(String(t).padStart(8), String(n).padStart(4), i ? `x${i}` : '   ', k);
await h.close();
