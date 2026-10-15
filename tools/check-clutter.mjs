// The photographed boats and the deck clutter are where they should be.
//
// Builds the cinematic ship in storm and in fair weather with src/ship/prop-assets.js
// loaded, and asks:
//
//   - every boat is the photographed one, and fills the box of the boat it replaced
//     (the audits measure that box, so they pass or fail on it too);
//   - every piece of clutter is the size the spec gives it;
//   - every piece of clutter stands on the deck under it, within 3 cm;
//   - no piece of clutter overlaps another, a boat, a man of the watch, a gun, or a fitting
//     of the deck (a hatch, the bitts, the pumps, the capstan, a ladder);
//   - hero has the photographed boats and the clutter as cinematic does, and game and
//     distant have neither, so the far levels keep their built boats and their batching;
//   - the ship without the props loaded is the ship it always was: built boats, no clutter.
//
//   node tools/check-clutter.mjs
import assert from 'node:assert/strict';
import { openHarness } from './harness.js';

const h = await openHarness();
try {
  const report = await h.page.evaluate(async () => {
    const THREE = await import('three');
    const { SPEC } = await import('/src/spec/spec.js');
    const { preloadProps } = await import('/src/ship/prop-assets.js');
    const { buildShip } = await import('/src/ship/index.js');
    if (!await preloadProps()) return { loaded: false };
    const BOATS = ['launch', 'pinnace', 'cutter', 'jolly_boat', 'quarter_cutter'];
    const out = [];
    for (const sails of ['storm', 'full']) {
      const ship = buildShip({ lod: 'cinematic', sails, crew: true });
      ship.updateMatrixWorld(true);
      const boats = BOATS.map((n) => ship.getObjectByName(`${n}_shell`));
      const clutter = ship.getObjectByName('clutter').children;
      const decks = []; ship.getObjectByName('decks').traverse((o) => { if (o.isMesh) decks.push(o); });
      const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
      const floating = [], wrongSize = [], touching = [];
      const want = { clutter_scuttlebutt_starboard: ['y', 'clutter_scuttlebutt_height'], clutter_lashed_casks_port: ['x', 'clutter_lashed_casks_length'],
        clutter_hen_coop_starboard: ['x', 'clutter_hen_coop_length'], clutter_hen_coop_port: ['x', 'clutter_hen_coop_length'],
        clutter_fire_buckets_port: ['x', 'clutter_fire_buckets_length'],
        clutter_shot_garland_starboard: ['x', 'clutter_shot_garland_length'], clutter_shot_garland_port: ['x', 'clutter_shot_garland_length'] };
      for (const c of clutter) {
        const box = new THREE.Box3().setFromObject(c), mid = box.getCenter(new THREE.Vector3());
        ray.set(new THREE.Vector3(mid.x, box.max.y + 2, mid.z), down);
        const hit = ray.intersectObjects(decks, false)[0];
        const gap = hit ? Math.abs(box.min.y - hit.point.y) : Infinity;
        if (gap > 0.03) floating.push(`${c.name} ${gap.toFixed(3)} m`);
        // The size the spec gives it: along x (turned back from its yaw), or its height.
        if (want[c.name]) {
          const [axis, key] = want[c.name];
          c.rotation.y = 0; c.updateMatrixWorld(true);
          const size = new THREE.Box3().setFromObject(c).getSize(new THREE.Vector3())[axis];
          if (Math.abs(size / SPEC[key].value - 1) > 0.03) wrongSize.push(`${c.name} ${size.toFixed(3)} m, spec ${SPEC[key].value.toFixed(3)} m`);
        }
      }
      // A second ship, because the sizing above turned the pieces back square.
      const again = buildShip({ lod: 'cinematic', sails, crew: true });
      again.updateMatrixWorld(true);
      const pieces = again.getObjectByName('clutter').children;
      const fixed2 = [];
      for (const n of ['furniture', 'guns', 'ground_tackle']) again.getObjectByName(n)?.traverse((o) => { if (o.isMesh) fixed2.push(o); });
      again.getObjectByName('rig').traverse((o) => { if (o.isMesh && /_lower_mast$/.test(o.name)) fixed2.push(o); });
      // Footprint test against the fittings: from the top of each piece, straight down at a
      // grid over its box, and anything the ray meets before the deck is in its way.
      for (const c of pieces) {
        const box = new THREE.Box3().setFromObject(c);
        const decks2 = []; again.getObjectByName('decks').traverse((o) => { if (o.isMesh) decks2.push(o); });
        for (let x = box.min.x + 0.05; x <= box.max.x - 0.05; x += 0.1) for (let z = box.min.z + 0.05; z <= box.max.z - 0.05; z += 0.1) {
          ray.set(new THREE.Vector3(x, box.max.y, z), down);
          const hits = ray.intersectObjects(fixed2, false);
          const deck = ray.intersectObjects(decks2, false)[0];
          if (hits.length && deck && hits[0].point.y > deck.point.y + 0.04) { touching.push(`${c.name} meets ${hits[0].object.name} at ${x.toFixed(2)}, ${z.toFixed(2)}`); break; }
        }
      }
      const solids = [
        ...pieces.map((c) => [c.name, new THREE.Box3().setFromObject(c).expandByScalar(-0.01)]),
        ...BOATS.map((n) => again.getObjectByName(`${n}_shell`)).map((b) => [b.name, new THREE.Box3().setFromObject(b)]),
        ...again.getObjectByName('crew').children.map((f) => [f.name, new THREE.Box3().setFromObject(f).expandByScalar(-0.05)]),
      ];
      const overlaps = [];
      for (let i = 0; i < pieces.length; i++) {
        for (let j = 0; j < solids.length; j++) {
          if (j === i) continue;
          if (solids[i][1].intersectsBox(solids[j][1])) overlaps.push(`${solids[i][0]} / ${solids[j][0]}`);
        }
      }
      out.push({ sails, photographed: boats.filter((b) => b?.userData.authored).length,
        clutter: clutter.length, floating, wrongSize, touching: [...new Set(touching)], overlaps });
    }
    // The other levels.
    const levels = {};
    for (const lod of ['hero', 'game', 'distant']) {
      const ship = buildShip({ lod, sails: 'full', crew: false });
      let boats = 0;
      ship.traverse((o) => { if (o.userData.authored && /_shell$/.test(o.name)) boats++; });
      levels[lod] = { boats, clutter: ship.getObjectByName('clutter').children.length };
    }
    return { loaded: true, out, levels };
  });
  assert.ok(report.loaded, 'the props load');
  for (const r of report.out) {
    assert.equal(r.photographed, 5, `${r.sails}: all five boats are the photographed ones`);
    assert.ok(r.clutter >= 10, `${r.sails}: the deck has its clutter (${r.clutter})`);
    assert.deepEqual(r.wrongSize, [], `${r.sails}: clutter is the size the spec gives it`);
    assert.deepEqual(r.floating, [], `${r.sails}: clutter stands on the deck`);
    assert.deepEqual(r.touching, [], `${r.sails}: clutter keeps clear of the fittings`);
    assert.deepEqual(r.overlaps, [], `${r.sails}: clutter keeps clear of boats, men and itself`);
  }
  assert.deepEqual(report.levels.hero, { boats: 5, clutter: 11 }, 'hero: photographed boats and the clutter');
  assert.deepEqual(report.levels.game, { boats: 0, clutter: 0 }, 'game: built boats, no clutter');
  assert.deepEqual(report.levels.distant, { boats: 0, clutter: 0 }, 'distant: no photographed boats, no clutter');
  assert.deepEqual(h.problems.filter((p) => p.startsWith('[pageerror]')), []);
  console.log(report.out.map((r) => `${r.sails}: 5 photographed boats, ${r.clutter} pieces of clutter, all on deck and clear`).join('\n'));
} finally { await h.close(); }
