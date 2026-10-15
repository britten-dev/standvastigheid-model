// The host's budget: triangles and draw calls she costs a browser host without people,
// at every level, in fair weather and foul, against HOST_BUDGET in src/ship/lod.js. She is
// the second ship on screen in the chase, so at `game` and `distant` the draw calls are
// held as well as the triangles.
import assert from 'node:assert/strict';
import { openHarness } from './harness.js';
import { HOST_BUDGET } from '../src/ship/lod.js';

const h = await openHarness();
try {
  const rows = await h.page.evaluate(() => {
    const out = [];
    for (const lod of ['cinematic', 'hero', 'game', 'distant']) for (const sails of ['full', 'storm']) {
      const ship = window.build({ lod, sails, crew: false });
      let tris = 0, calls = 0;
      ship.traverseVisible((o) => {
        if (o.isMesh) {
          tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
          calls += Array.isArray(o.material) ? o.material.length : 1;
        } else if (o.isLine) calls++;
      });
      out.push({ lod, sails, tris: Math.round(tris), calls });
    }
    return out;
  });
  for (const r of rows) {
    const b = HOST_BUDGET[r.lod];
    console.log(`${r.lod.padEnd(9)} ${r.sails.padEnd(5)} ${String(r.tris).padStart(8)} tris (≤ ${b.tris})  ${String(r.calls).padStart(4)} calls${b.calls ? ` (≤ ${b.calls})` : ''}`);
    assert.ok(r.tris <= b.tris, `${r.lod}/${r.sails}: ${r.tris} triangles over ${b.tris}`);
    if (b.calls) assert.ok(r.calls <= b.calls, `${r.lod}/${r.sails}: ${r.calls} draw calls over ${b.calls}`);
  }
  assert.deepEqual(h.problems, []);
  console.log('\nevery level is inside the host budget.');
} finally { await h.close(); }
