// Can every part of her rig be shot away without leaving anything hanging in the air?
//
// The game takes masts and yards off a ship one at a time. The rig is nested so that this
// works, and recorded in `ship.userData.rigParts` so that the game can ask what falls with
// what; src/ship/damage.js does the hiding. Nothing about that is checked by the geometry
// checks, so this one does it directly. For every part the rig registers, at the hero and
// game levels (and the distant one, which draws its ropes as lines):
//
//   * carry the part away, and what it says it carries goes with it;
//   * no rope that is still shown is made fast to a spar that is gone: by the record (every
//     part the rope names is still there), by its bindings (every node it follows is still
//     shown), and by the rope itself (neither end of it lies on a hidden spar and on no
//     spar that remains: this one does not trust the record);
//   * no sail that is still shown has lost its yard, its stay or its gaff;
//   * the motion layer and the sail handling run for a few frames without throwing, with the
//     handling made before the loss and, on a second ship, after it;
//   * restore the part, and everything is shown again.
//
// It also proves the rig has what a Dutch 74 has and what she has not: poles for topgallant
// masts and no royal anywhere, the same fifteen sails, a spritsail yard, a gaff spanker.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { openHarness } from './harness.js';

const h = await openHarness();
try {
  const report = await h.page.evaluate(async () => {
    const T = window.THREE;
    const { buildShip } = await import('/src/ship/index.js');
    const { createMotion } = await import('/src/ship/motion.js');
    const { createSailHandling } = await import('/src/ship/sail-handling.js');
    const { carryAway, restore, partsCarriedBy, rigPartNames } = await import('/src/ship/damage.js');
    const { SUIT } = await import('/src/ship/sails.js');

    const issues = [];
    const check = (ok, text) => { if (!ok && issues.length < 60) issues.push(text); };

    // Is this node shown, all the way up to the ship?
    const shown = (node, ship) => { for (let o = node; o; o = o.parent) { if (!o.visible) return false; if (o === ship) return true; } return false; };

    /** The spars of a ship, each as the line down its middle and how thick it is. */
    function spars(ship) {
      const out = [];
      const re = /(_lower_mast|_topmast|_topgallant|_yard|^bowsprit|^jibboom|^spanker_gaff|^spanker_boom|^dolphin_striker)$/;
      ship.updateMatrixWorld(true);
      ship.getObjectByName('rig').traverse((o) => {
        if (!o.isMesh || !re.test(o.name)) return;
        o.geometry.computeBoundingBox();
        const b = o.geometry.boundingBox;
        const isYard = /_yard$/.test(o.name);
        // Masts and the rest are built along +Y from their own origin; yards are laid along X.
        const a = isYard ? new T.Vector3(b.min.x, 0, 0) : new T.Vector3(0, b.min.y, 0);
        const z = isYard ? new T.Vector3(b.max.x, 0, 0) : new T.Vector3(0, b.max.y, 0);
        out.push({ name: o.name, node: o, a: o.localToWorld(a), b: o.localToWorld(z),
          radius: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) * (isYard ? 0 : 1) / 2 + (isYard ? (b.max.y - b.min.y) / 2 : 0) });
      });
      return out;
    }
    const line = new T.Line3(), nearest = new T.Vector3();
    /** How far a point is from the skin of a spar: nothing if it is inside it. */
    const skin = (p, s) => { line.set(s.a, s.b); line.closestPointToPoint(p, true, nearest); return Math.max(0, nearest.distanceTo(p) - s.radius); };
    /** The spars a rope end is made fast to: the nearest, or all of them if it is inside several (a heel in a head). */
    function fastTo(p, sparList) {
      const d = sparList.map((s) => [s, skin(p, s)]);
      const least = Math.min(...d.map(([, v]) => v));
      return least > 0.3 ? [] : d.filter(([, v]) => v <= least + 0.01).map(([s]) => s);
    }

    /** Every rope in the ship, with both of its ends in the world and what it says it is made fast to. */
    function ropes(ship) {
      const out = [];
      ship.traverse((o) => {
        if (!o.userData.ropeKind) return;
        const ends = o.geometry.userData.ropeEnds, points = [];
        if (ends) for (let i = 0; i < ends.length; i += 3) points.push(o.localToWorld(new T.Vector3(ends[i], ends[i + 1], ends[i + 2])));
        out.push({ node: o, name: o.name, kind: o.userData.ropeKind, needs: o.userData.needs ?? [], points });
      });
      return out;
    }

    function audit(ship, label, motion, sparList, ropeList) {
      const reg = ship.userData.rigParts;
      const gone = new Set(Object.keys(reg).filter((n) => !shown(ship.getObjectByName(reg[n].object), ship)));
      // 1. every rope still shown
      for (const r of ropeList) {
        if (!shown(r.node, ship)) continue;
        for (const need of r.needs) check(!gone.has(need), `${label}: ${r.name} is shown but is made fast to ${need}, which is gone`);
        for (const p of r.points) {
          const to = fastTo(p, sparList);
          check(!to.length || to.some((q) => shown(q.node, ship)), `${label}: an end of ${r.name} is made fast to ${to.map((q) => q.name)}, which is gone`);
        }
      }
      // 2. every running rope still shown follows nodes that are still shown
      for (const b of motion.parts.rigging.bindings) {
        if (!shown(b.mesh, ship)) continue;
        for (const end of [b.from, b.to]) if (end) check(end.node && shown(end.node, ship), `${label}: ${b.mesh.name} follows ${end.node?.name} (${b.label}), which is gone`);
      }
      // 3. every sail still shown still has what it hangs from
      for (const [name, part] of Object.entries(reg)) {
        if (part.kind !== 'sail' || gone.has(name)) continue;
        const sail = ship.getObjectByName(part.object);
        check(sail && shown(sail, ship), `${label}: ${name} should be shown`);
        for (const need of part.needs) check(shown(ship.getObjectByName(reg[need].object), ship), `${label}: ${name} is shown without ${need}`);
        if (/_sail$/.test(part.object) && sail.parent) check(shown(sail.parent, ship), `${label}: ${name} hangs from something hidden`);
      }
      // 4. what was carried away is not shown
      for (const name of gone) for (const o of reg[name].objects) {
        const node = ship.getObjectByName(o);
        check(!node || !shown(node, ship), `${label}: ${o} (part ${name}) is still shown`);
      }
    }

    const rows = [];
    for (const lod of ['hero', 'game', 'distant']) {
      const ship = buildShip({ lod, sails: 'full', animatedSails: true, crew: lod !== 'distant' });
      const reg = ship.userData.rigParts;
      check(!!reg, `${lod}: no rigParts record`);
      const bundles = lod !== 'distant';   // the distant level stows no canvas on the yards
      const names = rigPartNames(ship);

      // ------------------------------------------------ what a Dutch 74 has, and has not
      let royals = 0;
      ship.traverse((o) => { if (/royal|skysail/i.test(o.name)) royals++; });
      for (const k of Object.keys(reg)) if (/royal|skysail/i.test(k)) royals++;
      check(royals === 0, `${lod}: she has no royals, and there are ${royals} in her`);
      for (const m of ['fore', 'main', 'mizzen']) {
        for (const p of [`${m}_lower_mast`, `${m}_topmast`, `${m}_topgallant`]) check(reg[p], `${lod}: no part ${p}`);
        check(reg[`${m}_topgallant`]?.kind === 'topgallant', `${lod}: ${m} topgallant is not a pole of its own`);
      }
      for (const p of ['bowsprit', 'jibboom', 'spritsail_yard', 'spanker_gaff', 'spanker_boom', 'crossjack_yard']) check(reg[p], `${lod}: no part ${p}`);
      for (const sail of SUIT.full.set) check(reg[`${sail}_sail`], `${lod}: no sail ${sail}`);
      check(!bundles || reg.spritsail_sail, `${lod}: no spritsail furled on her yard`);
      check(names.filter((n) => reg[n].kind === 'sail').length === (bundles ? 16 : 15), `${lod}: expected the fifteen sails (and the spritsail, where canvas is stowed), got ${names.filter((n) => reg[n].kind === 'sail').length}`);
      // A sanity check of the canvas against Steel's Table IV (vol. 1 p.149), which gives the
      // main topsail of a 74 as 19 3/4 yards deep and the whole suit as some 3,000 square
      // yards: the sails are shaped between her own yards, not from the table, so this says
      // only that they have come out the size of a 74's.
      if (lod === 'hero') {
        let area = 0;
        const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
        for (const sail of SUIT.full.set) {
          const mesh = ship.getObjectByName(`${sail}_sail`), p = mesh.geometry.attributes.position, idx = mesh.geometry.index;
          for (let i = 0; i < idx.count; i += 3) {
            a.fromBufferAttribute(p, idx.getX(i)); b.fromBufferAttribute(p, idx.getX(i + 1)); c.fromBufferAttribute(p, idx.getX(i + 2));
            area += b.sub(a).cross(c.sub(a)).length() / 2;
          }
        }
        const topsail = new T.Box3().setFromObject(ship.getObjectByName('main_topsail_sail')).getSize(new T.Vector3()).y;
        const steelDepth = 19.75 * 0.9144 * 0.955;
        rows.push({ lod, sailAreaSquareMetres: Math.round(area), mainTopsailDepthMetres: +topsail.toFixed(2), steelDepthMetres: +steelDepth.toFixed(2) });
        check(area > 2500 && area < 4200, `${lod}: the suit comes to ${Math.round(area)} square metres, which is not a 74's`);
        check(Math.abs(topsail - steelDepth) / steelDepth < 0.12, `${lod}: the main topsail is ${topsail.toFixed(1)} m deep against Steel's ${steelDepth.toFixed(1)}`);
      }
      // Every node the record names is in the ship, and every rope in the ship is in the record.
      for (const n of names) for (const o of reg[n].objects) check(ship.getObjectByName(o), `${lod}: ${n} names ${o}, which is not in the ship`);
      const inRecord = new Set(names.flatMap((n) => reg[n].ropes));
      const ropeList = ropes(ship);
      for (const r of ropeList) {
        check(r.kind === 'ratlines' || inRecord.has(r.name), `${lod}: rope ${r.name} is in no part's record`);
        for (const need of r.needs) check(reg[need], `${lod}: rope ${r.name} names ${need}, which is not a part`);
      }
      // The carries relation: the fore lower mast carries everything above it, and the
      // jib hangs from the fore topmast and from the jib-boom both.
      const foreAll = partsCarriedBy(ship, 'fore_lower_mast');
      for (const p of ['fore_topmast', 'fore_topgallant', 'fore_yard', 'fore_topsail_yard', 'fore_topgallant_yard', 'fore_course_sail', 'fore_topsail_sail', 'fore_topgallant_sail', 'jib_sail', 'fore_topmast_staysail_sail'])
        check(foreAll.includes(p), `${lod}: fore_lower_mast should carry ${p}`);
      check(partsCarriedBy(ship, 'jibboom').includes('jib_sail') && partsCarriedBy(ship, 'jibboom').includes('flying_jib_sail'), `${lod}: the jib-boom should carry the jibs`);
      check(!partsCarriedBy(ship, 'fore_topmast').includes('fore_course_sail'), `${lod}: the fore topmast should not carry the course`);
      check(partsCarriedBy(ship, 'bowsprit').includes('jibboom'), `${lod}: the bowsprit should carry the jib-boom`);

      const handling = createSailHandling(ship);
      const motion = createMotion(ship);
      const sparList = spars(ship);
      let t = 0;
      const frames = (n) => {
        for (let i = 0; i < n; i++) {
          handling.update(0.25); t += 0.25;
          motion.update(t, { windSpeed: 22, windDeg: 100 + 25 * i, heel: 0.12, pitch: 0.03, helm: 0.3, spray: 0.4 });
        }
      };
      frames(2);
      audit(ship, `${lod}: nothing carried away`, motion, sparList, ropeList);

      let tried = 0;
      for (const name of names) {
        const carried = carryAway(ship, name);
        check(carried[0] === name && carried.length === 1 + reg[name].carries.length, `${lod}: carryAway(${name}) returned ${carried.length} names`);
        check(ship.userData.carriedAway.includes(name), `${lod}: ${name} is not recorded as carried away`);
        audit(ship, `${lod}: ${name} carried away`, motion, sparList, ropeList);
        // The sail handling and the motion layer carry on.
        try {
          handling.setState(tried % 2 ? 'furled' : 'topsails');
          frames(3);
          handling.setState('full', { immediate: true });
        } catch (error) { check(false, `${lod}: ${name} carried away, and the motion layer or sail handling threw: ${error.message}`); }
        restore(ship, name);
        const stillHidden = [];
        ship.traverse((o) => { if (o.userData.shotAway) stillHidden.push(o.name); });
        check(stillHidden.length === 0, `${lod}: restoring ${name} left ${stillHidden.slice(0, 4)} hidden`);
        check(ship.userData.carriedAway.length === 0, `${lod}: ${name} is still recorded as carried away after restore`);
        audit(ship, `${lod}: ${name} restored`, motion, sparList, ropeList);
        tried++;
      }

      // The check must be able to fail: hide a mast on its own, leaving its ropes, and it
      // has to notice. (Not a part: only a rope hanging in the air is being tested for.)
      {
        const spar = ship.getObjectByName('main_lower_mast'), before = issues.length;
        spar.visible = false;
        audit(ship, 'self-test', motion, sparList, ropeList);
        const noticed = issues.length > before;
        issues.length = before; spar.visible = true;
        check(noticed, `${lod}: the rope check did not notice a lower mast hidden with its ropes left hanging`);
      }

      // What is flown or stood on a spar goes with it: the masthead pendant from the main
      // topgallant, the ensign from the gaff, the two men in the main top from the mast.
      for (const [part, thing] of [['main_topgallant', 'pennant'], ['spanker_gaff', 'ensign'], ['main_lower_mast', 'topman_port']]) {
        const node = ship.getObjectByName(thing);
        if (!node) continue;
        carryAway(ship, part);
        check(!shown(node, ship), `${lod}: ${thing} is still shown with ${part} gone`);
        restore(ship, part);
        check(shown(node, ship), `${lod}: ${thing} did not come back with ${part}`);
      }

      // Two losses at once, then mending one: what the other holds down stays down.
      carryAway(ship, 'fore_topmast');
      carryAway(ship, 'jibboom');
      restore(ship, 'fore_topmast');
      check(!shown(ship.getObjectByName('jib_sail'), ship), `${lod}: the jib came back though the jib-boom is still gone`);
      check(shown(ship.getObjectByName('fore_topsail_yard'), ship), `${lod}: the fore topsail yard did not come back with the topmast`);
      audit(ship, `${lod}: topmast mended, jib-boom gone`, motion, sparList, ropeList);
      frames(2);
      restore(ship);
      const left = [];
      ship.traverse((o) => { if (o.userData.shotAway) left.push(o.name); });
      check(left.length === 0 && ship.userData.carriedAway.length === 0, `${lod}: restore() left ${left.slice(0, 4)}`);
      motion.dispose();

      let meshes = 0, lines = 0, tris = 0;
      ship.getObjectByName('rig').traverse((o) => {
        if (o.isMesh) { meshes++; tris += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3; }
        else if (o.isLine) lines++;
      });
      rows.push({ lod, parts: names.length, ropeMeshes: ropeList.length, rigMeshes: meshes, rigLines: lines, rigTriangles: Math.round(tris) });
    }

    // ------------------------------------------- handling made AFTER the loss, on a fresh ship
    for (const part of ['fore_topmast', 'main_lower_mast', 'jibboom', 'spanker_gaff', 'main_topsail_yard']) {
      const ship = buildShip({ lod: 'game', sails: 'full', animatedSails: true, crew: false });
      carryAway(ship, part);
      try {
        const handling = createSailHandling(ship), motion = createMotion(ship);
        handling.setState('furled'); handling.update(3); handling.update(30); handling.setState('full');
        for (let i = 0; i < 4; i++) { handling.update(1); motion.update(i, { windSpeed: 20, windDeg: 120 }); }
        check(handling.parts.size === 15, `handling made after losing ${part} found ${handling.parts.size} sails`);
        restore(ship, part);
        for (let i = 0; i < 2; i++) { handling.update(1); motion.update(5 + i, { windSpeed: 20, windDeg: 120 }); }
        motion.dispose();
      } catch (error) { check(false, `handling or motion made after losing ${part} threw: ${error.message}`); }
    }

    // ----------------------------------------------- the other sail states carry away too
    for (const sails of ['topsails', 'storm', 'furled']) {
      const ship = buildShip({ lod: 'game', sails, crew: false });
      const motion = createMotion(ship), reg = ship.userData.rigParts;
      for (const name of Object.keys(reg)) {
        try { carryAway(ship, name); motion.update(1, { windDeg: 100 }); restore(ship, name); }
        catch (error) { check(false, `${sails}: carrying away ${name} threw: ${error.message}`); }
      }
      check(Object.keys(reg).filter((n) => reg[n].kind === 'sail').length >= 8, `${sails}: every sail, set or furled, should be a part`);
      motion.dispose();
    }

    return { rows, issues };
  });
  await writeFile('build/rig-parts-check.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  assert.deepEqual(report.issues, []);
  assert.deepEqual(h.problems.filter((p) => !/Detailed ship assets|404 \(Not Found\)/.test(p)), []);
  console.log('every part of her rig can be shot away and mended.');
} finally {
  await h.close();
}
