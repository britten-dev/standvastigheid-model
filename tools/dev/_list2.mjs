import { openHarness } from '../harness.js';
const h = await openHarness();
const group = process.argv[2], lod = process.argv[3] || 'game';
const r = await h.page.evaluate(([group, lod]) => {
  const ship = window.build({ lod, sails: 'full' });
  const g = ship.getObjectByName(group), out = [];
  g.traverseVisible((o) => { if (o.isMesh) { const m=o.material; out.push(`${o.name} | ${m.type}:${m.name}:${m.color?.getHexString()}:${m.roughness}:${m.map?'map':''}${m.onBeforeCompile?'+patch':''} | ${Object.keys(o.geometry.attributes).sort().join(',')}${o.geometry.index?':i':''} ${o.layers.mask}`); } });
  return out;
}, [group, lod]);
console.log(r.join('\n'));
await h.close();
