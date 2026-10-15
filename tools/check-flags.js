import assert from 'node:assert/strict';
import { openHarness } from './harness.js';

const h = await openHarness();
try {
  const report = await h.page.evaluate(async () => {
    const { createMotion } = await import('/src/ship/motion.js');
    const T = window.THREE, ship = window.build({ lod: 'game', sails: 'topsails' });
    const motion = createMotion(ship), flags = motion.parts.flags;
    let time = 0;
    const run = (seconds, wind, extra = {}) => {
      for (let i = 0; i < seconds * 60; i++) motion.update(time += 1 / 60, { apparentWind: wind, ...extra });
    };
    const centre = (flag, u) => {
      const g = flag.node.geometry, { segsU, segsV } = g.userData.flag;
      const p = new T.Vector3(), sum = new T.Vector3();
      for (let v = 0; v <= segsV; v++) sum.add(p.fromBufferAttribute(g.attributes.position, u * segsU * (segsV + 1) + v));
      return sum.divideScalar(segsV + 1);
    };
    const span = flag => centre(flag, 1).sub(centre(flag, 0));
    const hoists = flags.map(f => Array.from(f.node.geometry.attributes.position.array.slice(0, (f.node.geometry.userData.flag.segsV + 1) * 3)));
    run(3, new T.Vector3(0, 0, -22));
    const strong = flags.map(f => ({ span: -span(f).z / f.node.geometry.userData.flag.fly, phase: f.phase }));
    run(1, new T.Vector3(0, 0, -22));
    const fastRate = flags.map((f, i) => f.phase - strong[i].phase);
    run(3, new T.Vector3(0, 0, 22));
    const reversal = flags.map(f => f.stream.z);
    run(2, new T.Vector3(0, 0, 2));
    const phases = flags.map(f => f.phase);
    run(1, new T.Vector3(0, 0, 2));
    const slowRate = flags.map((f, i) => f.phase - phases[i]);
    run(2, new T.Vector3());
    const calmPhases = flags.map(f => f.phase);
    run(2, new T.Vector3());
    const calm = flags.map((f, i) => ({ reach: Math.abs(span(f).z) / f.node.geometry.userData.flag.fly,
      drop: -span(f).y / f.node.geometry.userData.flag.fly, phaseChange: f.phase - calmPhases[i] }));
    ship.rotation.set(.2, .6, -.3);
    run(1, new T.Vector3());
    const gravity = flags.map(f => span(f).applyQuaternion(ship.quaternion).normalize().dot(new T.Vector3(0, -1, 0)));
    run(3, null, { windDeg: 90, windSpeed: 18 });
    const fallbackDirection = flags.map(f => f.stream.x);
    const fixed = flags.map((f, i) => hoists[i].every((v, j) => v === f.node.geometry.attributes.position.array[j]));
    const finite = flags.every(f => Array.from(f.node.geometry.attributes.position.array).every(Number.isFinite)
      && Array.from(f.node.geometry.attributes.normal.array).every(Number.isFinite));
    motion.dispose();
    return { names: flags.map(f => f.node.name), strong, fastRate, slowRate, reversal, calm, gravity, fallbackDirection, fixed, finite };
  });
  assert.ok(report.names.length >= 2);
  for (let i = 0; i < report.names.length; i++) {
    assert.ok(report.strong[i].span > .85, 'strong wind extends the cloth');
    assert.ok(report.fastRate[i] > report.slowRate[i] * 2, 'flutter rate responds to apparent speed');
    assert.ok(report.reversal[i] > .99, 'a 180-degree reversal must turn the flag');
    assert.ok(report.calm[i].reach < .05 && report.calm[i].drop > .8, 'still-air cloth hangs instead of streaming');
    assert.equal(report.calm[i].phaseChange, 0, 'still air does not drive endless flutter');
    assert.ok(report.gravity[i] > .99, 'slack cloth hangs toward world-down while the ship rolls');
    assert.ok(report.fallbackDirection[i] > .99, 'model viewers also respond to wind direction');
    assert.equal(report.fixed[i], true, 'the entire hoist stays attached');
  }
  assert.equal(report.finite, true);
  assert.deepEqual(h.problems, []);
  console.log(JSON.stringify(report, null, 2));
} finally { await h.close(); }
