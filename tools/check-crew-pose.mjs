// The photographed watch keeps its feet and its grip.
//
// Builds the ship in storm and in fair weather — the watch is dressed, and so built,
// differently in each — with the crew from src/ship/crew-assets.js, runs the motion layer
// through a minute of heel, pitch and helm, and asks of every frame:
//
//   - every man of the watch at hero and cinematic is a photographed figure, and none is at
//     game, which keeps the figures it builds;
//   - no bone of any man has gone to NaN;
//   - both helmsmen have their hands within 3 cm of the rim;
//   - every man on deck still has his feet within 10 cm of the deck he stands on.
//
//   node tools/check-crew-pose.mjs
import assert from 'node:assert/strict';
import { openHarness } from './harness.js';

const h = await openHarness();
try {
  const report = await h.page.evaluate(async () => {
    const THREE = await import('three');
    const { preloadCrew } = await import('/src/ship/crew-assets.js');
    const { buildShip } = await import('/src/ship/index.js');
    const { createMotion } = await import('/src/ship/motion.js');
    if (!await preloadCrew()) return { loaded: false };
    const foot = new THREE.Vector3();
    let nan = 0, grip = 0, feet = 0, worst = '', count = Infinity, others = 0;
    // Hero and cinematic: the whole watch. Game: nobody.
    const at = {};
    for (const lod of ['hero', 'cinematic', 'game']) {
      const crew = buildShip({ lod, sails: 'full' }).getObjectByName('crew');
      at[lod] = { men: crew.children.length, photographed: crew.children.filter((f) => f.userData.crew?.skinned).length };
    }
    for (const sails of ['storm', 'full']) {
      const ship = buildShip({ lod: 'cinematic', sails });
      const motion = createMotion(ship);
      const crew = ship.getObjectByName('crew');
      const men = crew.children.filter((f) => f.userData.crew?.skinned);
      count = Math.min(count, men.length);
      others += crew.children.length - men.length;
      for (let t = 0; t < 60; t += 0.5) {
        const heel = -.16 + .12 * Math.sin(t * .9), pitch = .05 * Math.sin(t * .6), helm = Math.sin(t * .37);
        ship.rotation.set(pitch, 0, heel, 'YXZ');
        ship.updateMatrixWorld(true);
        motion.update(t, { heel, pitch, helm, windSpeed: 24, windDeg: 155 });
        for (const f of men) {
          f.traverse((o) => { if (o.isBone && !o.quaternion.toArray().every(Number.isFinite)) nan++; });
          if (f.userData.crew.role === 'helm') grip = Math.max(grip, f.userData.crew.gripError ?? 1);
          if (f.userData.crew.role === 'aloft') continue;
          const home = motion.parts.crew.find((c) => c.node === f).home.position;
          for (const name of ['mixamorigLeftToeBase', 'mixamorigRightToeBase']) {
            crew.worldToLocal(f.getObjectByName(name).getWorldPosition(foot));
            const off = Math.abs(foot.y - home.y);
            if (off > feet) { feet = off; worst = `${f.name} at t=${t} (${sails})`; }
          }
        }
      }
    }
    return { loaded: true, men: count, others, at, nan, grip, feet, worst };
  });
  assert.ok(report.loaded, 'the crew figures load');
  assert.equal(report.others, 0, 'every station at cinematic uses a photographed figure');
  assert.ok(report.men >= 18, `a 74's watch is photographed (${report.men} men)`);
  for (const lod of ['hero', 'cinematic']) {
    assert.equal(report.at[lod].photographed, report.at[lod].men, `${lod}: every man is photographed`);
  }
  assert.equal(report.at.game.photographed, 0, 'game keeps the figures it builds');
  assert.ok(report.at.game.men > 0, 'game still has its watch');
  assert.equal(report.nan, 0, 'no bone goes to NaN');
  assert.ok(report.grip < .03, `helmsmen reach the rim (worst ${report.grip.toFixed(3)} m short)`);
  assert.ok(report.feet < .10, `feet stay on the deck (worst ${report.feet.toFixed(3)} m, ${report.worst})`);
  assert.deepEqual(h.problems.filter((p) => p.startsWith('[pageerror]')), []);
  console.log(`crew pose: ${report.men} men, grip within ${(report.grip * 100).toFixed(1)} cm, `
    + `feet within ${(report.feet * 100).toFixed(1)} cm of the deck over a minute of weather`);
} finally { await h.close(); }
