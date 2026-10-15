// Compare fittings against ray hits on the actual rendered deck geometry: every gun
// carriage stands on the deck it was sited for, and the wheel on the quarterdeck.
import assert from 'node:assert/strict';
import { openHarness } from './harness.js';
const h = await openHarness();
try {
  const result = await h.page.evaluate(async () => {
    const { SPEC } = await import('/src/spec/spec.js');
    const T = window.THREE;
    const ship = window.build({ lod: 'hero', sails: 'topsails', weather: 'fair' });
    ship.updateMatrixWorld(true);
    const ray = new T.Raycaster();
    const down = new T.Vector3(0, -1, 0);
    const deckAt = (deck, x, z) => {
      ray.set(new T.Vector3(x, 30, z), down);
      const hit = ray.intersectObject(ship.getObjectByName(deck), false)[0];
      if (!hit) throw new Error(`No ${deck} below ${x}, ${z}`);
      return hit.point.y;
    };
    // The deck each kind of gun stands on. The stern chasers are on the upper deck, the
    // bow chasers on the lower.
    const deckOf = (g) => g.kind === 'lower' || (g.kind === 'chaser' && g.side === 'bow') ? 'gundeck'
      : g.kind === 'upper' || g.kind === 'chaser' ? 'upper_deck'
        : g.kind === 'quarterdeck' ? 'quarterdeck' : 'forecastle';
    const errors = [];
    const wheel = ship.getObjectByName('ships_wheel');
    if (wheel && SPEC.wheel_axle_above_deck) {
      errors.push({ name: 'wheel axle above deck', error: wheel.position.y
        - deckAt('quarterdeck', wheel.position.x, wheel.position.z) - SPEC.wheel_axle_above_deck.value });
    }
    const matrix = new T.Matrix4(), p = new T.Vector3();
    for (const g of ship.getObjectByName('guns').userData.gunnery.guns) {
      const mesh = ship.getObjectByName(g.moving[0]);
      mesh.getMatrixAt(g.index, matrix); p.setFromMatrixPosition(matrix);
      // Abaft the sternpost the upper deck is the stern module's own closure, a few
      // metres wide on a camber lofted for the hull's narrow end, so its chords are long.
      errors.push({ name: `${g.kind} ${g.side} ${g.index} (${g.moving[0]})`, error: p.y - deckAt(deckOf(g), p.x, p.z),
        tolerance: g.side === 'stern' ? 0.04 : 0.015 });
    }
    return errors;
  });
  for (const r of result) assert.ok(Math.abs(r.error) < (r.tolerance ?? 0.015), `${r.name}: ${(r.error * 1000).toFixed(1)} mm from deck`);
  console.log(`${result.length} deck placement checks passed; largest error ${Math.max(...result.map(r => Math.abs(r.error) * 1000)).toFixed(2)} mm`);
} finally { await h.close(); }
