// The chasers. The game fires them by name and by the record in guns.userData.gunnery, so
// this holds the ship to what the game reads:
//
//   * two bow-chaser locators, at the bridle ports, with local +X down the bore, pointing
//     within 15 degrees of dead ahead (-Z) and a little outboard, with a clear line ahead;
//   * two stern-chaser locators, pointing within 15 degrees of dead astern (+Z);
//   * exactly two 'bow' and two 'stern' guns in the gunnery record, whose barrels exist,
//     and whose barrel instance matrix agrees with the locator (the game takes the
//     direction from +X of that matrix and the muzzle from the record);
//   * a heavy-weather ship built with chasers: 'manned' keeps all four ready, and the
//     broadside is secured (and, at the game level, not built behind its lids);
//   * chasers: 'secured' puts them away with the rest.
//
// Locator convention: the node's local +X is the bore, muzzle-first, the same axis the
// gunnery record and the barrel instance matrices use. Its position is the muzzle face.
import assert from 'node:assert/strict';
import { openHarness } from './harness.js';

const MAX_OFF_AXIS_DEG = 15;
// Half the width of a bridle port, with a little over for the gun's own width.
const PORT_REACH = 0.6;
const h = await openHarness();
try {
  const result = await h.page.evaluate(async (maxOff) => {
    const { hullModel } = await import('/src/ship/hull.js');
    const { portRecords } = await import('/src/ship/gun-openings.js');
    const T = window.THREE;
    const model = hullModel();
    const bridle = portRecords(model).find((p) => p.kind === 'bridle');
    const degs = (r) => (r * 180) / Math.PI;
    const out = { builds: [] };

    const inspect = (label, opts) => {
      const ship = window.build({ sails: 'furled', crew: false, ...opts });
      ship.updateMatrixWorld(true);
      const guns = ship.getObjectByName('guns');
      const record = guns.userData.gunnery;
      const row = { label, ports: ship.userData.ports, chasers: ship.userData.chasers, problems: [], bow: [], stern: [] };
      const list = record.guns;
      row.counts = {
        bow: list.filter((g) => g.side === 'bow').length,
        stern: list.filter((g) => g.side === 'stern').length,
        broadside: list.filter((g) => g.side === 'port' || g.side === 'starboard').length,
      };
      row.secured = record.secured;
      row.ids = list.every((g, i) => g.id === i);
      const hull = ship.getObjectByName('hull_shell');
      const ray = new T.Raycaster();
      const matrix = new T.Matrix4();
      for (const g of list.filter((x) => x.side === 'bow' || x.side === 'stern')) {
        const entry = { side: g.side, kind: g.kind, locator: g.locator };
        const node = ship.getObjectByName(g.locator);
        const barrel = ship.getObjectByName(g.barrel);
        entry.node = !!node; entry.barrel = !!barrel && g.index < barrel.count;
        if (node && barrel) {
          const pos = new T.Vector3(), quat = new T.Quaternion(), scale = new T.Vector3();
          node.matrixWorld.decompose(pos, quat, scale);
          const dir = new T.Vector3(1, 0, 0).applyQuaternion(quat);
          entry.hullSide = g.locator.endsWith('starboard') ? 1 : -1;
          entry.pos = pos.toArray(); entry.dir = dir.toArray();
          const ahead = g.side === 'bow' ? -1 : 1;
          entry.offAxis = degs(Math.acos(Math.min(1, dir.z * ahead)));
          entry.outboard = dir.x * entry.hullSide;
          // The game's way: +X of the barrel's instance matrix, and the record's muzzle.
          barrel.getMatrixAt(g.index, matrix);
          const gameDir = new T.Vector3(1, 0, 0).transformDirection(matrix);
          const gameMuzzle = new T.Vector3().fromArray(g.muzzle).applyMatrix4(matrix).applyMatrix4(barrel.matrixWorld);
          entry.dirError = degs(gameDir.angleTo(dir));
          entry.muzzleError = gameMuzzle.distanceTo(pos);
          if (g.side === 'bow') {
            const y = (bridle.y0 + bridle.y1) / 2;
            const surface = model.halfBreadthAt(bridle.z, y);
            entry.dz = pos.z - bridle.z;
            entry.dy = pos.y - y;
            entry.beyondSide = Math.abs(pos.x) - surface;
            entry.insidePortHeight = pos.y > bridle.y0 && pos.y < bridle.y1;
            // A clear line ahead: the bore does not run into her own bow.
            ray.set(pos.clone().addScaledVector(dir, 0.05), dir);
            ray.far = 60;
            hull.material.side = T.DoubleSide;
            entry.hitsOwnBow = ray.intersectObject(hull, false).length;
          }
        }
        row[g.side].push(entry);
      }
      return row;
    };

    out.builds.push(inspect('game fair', { lod: 'game' }));
    out.builds.push(inspect('hero fair', { lod: 'hero' }));
    out.builds.push(inspect('game heavy manned', { lod: 'game', weather: 'heavy' }));
    out.builds.push(inspect('hero heavy manned', { lod: 'hero', weather: 'heavy', chasers: 'manned' }));
    out.builds.push(inspect('game heavy secured', { lod: 'game', weather: 'heavy', chasers: 'secured' }));
    out.builds.push(inspect('hero heavy secured', { lod: 'hero', weather: 'heavy', chasers: 'secured' }));
    return out;
  }, MAX_OFF_AXIS_DEG);

  const by = Object.fromEntries(result.builds.map((b) => [b.label, b]));
  const ready = (b) => {
    assert.equal(b.counts.bow, 2, `${b.label}: bow chasers in the gunnery record`);
    assert.equal(b.counts.stern, 2, `${b.label}: stern chasers in the gunnery record`);
    assert.ok(b.ids, `${b.label}: gunnery ids are the list positions`);
    for (const e of [...b.bow, ...b.stern]) {
      assert.ok(e.node, `${b.label}: locator ${e.locator} exists`);
      assert.ok(e.barrel, `${b.label}: barrel of ${e.locator} exists`);
      assert.ok(e.offAxis <= MAX_OFF_AXIS_DEG, `${b.label}: ${e.locator} is ${e.offAxis.toFixed(1)} degrees off the keel line`);
      assert.ok(e.dirError < 0.01, `${b.label}: ${e.locator} disagrees with its barrel matrix by ${e.dirError} degrees`);
      assert.ok(e.muzzleError < 0.01, `${b.label}: ${e.locator} is ${e.muzzleError} m from the record's muzzle`);
    }
    for (const e of b.bow) {
      assert.ok(e.offAxis > 0.5, `${b.label}: ${e.locator} should be trained a little outboard`);
      assert.ok(e.outboard > 0, `${b.label}: ${e.locator} points inboard`);
      assert.ok(Math.abs(e.dz) < PORT_REACH, `${b.label}: ${e.locator} is ${e.dz} m from the bridle port in z`);
      assert.ok(e.insidePortHeight, `${b.label}: ${e.locator} muzzle is ${e.dy} m from the middle of the port, outside it`);
      assert.ok(e.beyondSide > -0.5 && e.beyondSide < 0.5, `${b.label}: ${e.locator} muzzle is ${e.beyondSide} m outside the planking`);
      assert.equal(e.hitsOwnBow, 0, `${b.label}: ${e.locator} bore runs into her own bow`);
    }
    for (const e of b.stern) assert.ok(e.outboard >= 0, `${b.label}: ${e.locator} points inboard`);
  };
  ready(by['game fair']);
  ready(by['hero fair']);
  assert.equal(by['game fair'].counts.broadside, 72, 'game fair: the whole broadside');
  assert.equal(by['hero fair'].counts.broadside, 72, 'hero fair: the whole broadside');
  assert.equal(by['hero fair'].secured, false);

  // Heavy weather, chasers manned: ready, and the ship says so.
  for (const label of ['game heavy manned', 'hero heavy manned']) {
    ready(by[label]);
    assert.equal(by[label].ports, 'shut');
    assert.equal(by[label].chasers, 'manned');
    assert.equal(by[label].secured, true, `${label}: the broadside is secured`);
  }
  // At the game level nobody can see behind a shut lid, so the batteries are not built;
  // only the forecastle's six, which stand in the open, and the four chasers remain.
  assert.equal(by['game heavy manned'].counts.broadside, 6, 'game heavy: forecastle guns only');
  assert.equal(by['hero heavy manned'].counts.broadside, 72, 'hero heavy: the battery is housed, not absent');

  // Heavy weather, chasers secured: put away with the rest.
  assert.equal(by['game heavy secured'].counts.bow, 0, 'game heavy secured: no bow chasers built behind their lids');
  assert.equal(by['game heavy secured'].counts.stern, 0, 'game heavy secured: no stern chasers built behind their lids');
  assert.equal(by['hero heavy secured'].chasers, 'secured');
  assert.equal(by['hero heavy secured'].counts.bow, 2);
  assert.equal(by['hero heavy secured'].counts.stern, 2);

  assert.deepEqual(h.problems.filter((p) => !/404|procedural/.test(p)), []);
  for (const b of result.builds) {
    const first = b.bow[0];
    console.log(`${b.label.padEnd(20)} bow ${b.counts.bow} stern ${b.counts.stern} broadside ${b.counts.broadside}` +
      (first ? `  bow chaser ${first.offAxis.toFixed(1)} deg off ahead, muzzle ${first.beyondSide.toFixed(2)} m outside the planking` : ''));
  }
  console.log('chaser checks passed');
} finally { await h.close(); }
