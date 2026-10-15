import { openHarness } from '../harness.js';
const h = await openHarness();
const group = process.argv[2], lod = process.argv[3] || 'game';
const r = await h.page.evaluate(([group, lod]) => {
  const ship = window.build({ lod, sails: 'full' });
  const g = ship.getObjectByName(group), out = [];
  g.traverseVisible((o) => { if (o.isMesh || o.isLine) out.push(`${o.parent.name}/${o.name} [${o.material.name || o.material.type}] ${o.isInstancedMesh ? 'inst' : ''} ${o.geometry.morphAttributes && Object.keys(o.geometry.morphAttributes).length ? 'morph' : ''} ${Math.round((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3)}`); });
  return out;
}, [group, lod]);
console.log(r.join('\n'));
await h.close();
