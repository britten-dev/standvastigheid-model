// Compare fittings against ray hits on the actual rendered deck geometry.
import assert from 'node:assert/strict';
import { openHarness } from './harness.js';
const h = await openHarness();
try {
  const result = await h.page.evaluate(async () => {
    const { SPEC } = await import('/src/spec/spec.js');
    const T = window.THREE;
    const ship = window.build({ lod: 'hero', sails: 'topsails', weather: 'fair' });
    ship.updateMatrixWorld(true);
    const decks = ['forecastle', 'quarterdeck', 'gundeck'].map(name => ship.getObjectByName(name));
    const ray = new T.Raycaster();
    const down = new T.Vector3(0, -1, 0);
    const deckAt = (x, z) => {
      ray.set(new T.Vector3(x, 30, z), down);
      const hit = ray.intersectObjects(decks, false)[0];
      if (!hit) throw new Error(`No deck below ${x}, ${z}`);
      return hit.point.y;
    };
    const wheel = ship.getObjectByName('ships_wheel');
    const errors = [{ name: 'wheel axle above deck', error: wheel.position.y
      - deckAt(wheel.position.x, wheel.position.z) - SPEC.wheel_axle_above_deck.value }];
    const matrix = new T.Matrix4(), p = new T.Vector3();
    for (const name of ['four_pounder_carriages', 'carronade_slides']) {
      const mesh = ship.getObjectByName(name);
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, matrix); p.setFromMatrixPosition(matrix);
        errors.push({ name: `${name} ${i}`, error: p.y - deckAt(p.x, p.z) });
      }
    }
    return errors;
  });
  for (const r of result) assert.ok(Math.abs(r.error) < 0.015, `${r.name}: ${(r.error * 1000).toFixed(1)} mm from deck`);
  console.log(`${result.length} deck placement checks passed; largest error ${Math.max(...result.map(r => Math.abs(r.error) * 1000)).toFixed(2)} mm`);
} finally { await h.close(); }
