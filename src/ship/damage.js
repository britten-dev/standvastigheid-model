// Shot-away parts.
//
// The rig is built so that every mast, topmast, topgallant, yard, sail, the bowsprit and
// the jib-boom is a part of its own, and so that taking one away takes with it exactly
// what hangs from it. The record of what hangs from what is `ship.userData.rigParts`:
//
//   {
//     fore_topmast: {
//       kind: 'topmast',             // mast | topmast | topgallant | yard | sail | bowsprit | jibboom | gaff | boom
//       mast: 'fore',                // fore | main | mizzen | bowsprit
//       object: 'fore_topmast_assembly',   // the node that is hidden for this part
//       objects: ['fore_topmast_assembly'],// every node hidden for it (its own fittings too)
//       needs: ['fore_lower_mast'],  // what it stands on (the parts it cannot outlive)
//       carries: ['fore_topgallant', 'fore_topsail_yard', 'fore_topsail_sail', ...], // everything that goes with it
//       ropes: ['fore_topmast_shrouds', ...],          // every rope mesh anchored to it
//     }, ...
//   }
//
// `carries` is the whole chain, not one step: the fore lower mast carries the fore topmast
// and so, through it, the topgallant and every yard and sail above. `ropes` lists every rope
// mesh with an end made fast to the part, including ropes that belong to another mast and
// lead to this one (a main yard's braces lead to the mizzen mast), because a rope is gone
// the moment either end is.
//
// Nothing is removed from the scene. A carried-away part is hidden (`visible = false`) and
// restored by showing it again, so that a host can wreck a ship and then mend her, and so
// that motion and sail handling, which find their parts by name, keep finding them.
// `ship.userData.carriedAway` lists the parts carried away by name, in the order it was
// done; what they take with them is worked out from the registry each time, so restoring a
// part brings back only what is not still held down by another.

// ----------------------------------------------------------------- the registry

/**
 * Collects the parts and ropes of a rig as it is built, then closes the registry. Used by
 * src/ship/rig.js; a host never calls it.
 */
export function createRigRegistry() {
  const parts = new Map();
  const ropes = [];
  return {
    part(name, { kind, mast, object = name, objects = [], needs = [], attachments = [] }) {
      if (parts.has(name)) throw new Error(`rig part "${name}" registered twice`);
      parts.set(name, { kind, mast, object, objects: [object, ...objects.filter((o) => o !== object)], needs: [...needs], attachments, ropes: [] });
    },
    /** Add something to a part that is already registered: a fitting that goes with it. */
    attach(name, ...objects) { parts.get(name)?.objects.push(...objects); },
    /** A rope mesh, and every part it is made fast to. */
    rope(meshName, needs) { ropes.push({ meshName, needs: [...new Set(needs)] }); },
    has: (name) => parts.has(name),
    finish() {
      const dependants = new Map([...parts.keys()].map((k) => [k, []]));
      for (const [name, p] of parts) {
        for (const need of p.needs) {
          if (!parts.has(need)) throw new Error(`rig part "${name}" needs "${need}", which is not a part`);
          dependants.get(need).push(name);
        }
      }
      for (const { meshName, needs } of ropes) {
        for (const need of needs) {
          if (!parts.has(need)) throw new Error(`rope "${meshName}" is made fast to "${need}", which is not a part`);
          parts.get(need).ropes.push(meshName);
        }
      }
      const out = {};
      for (const [name, p] of parts) {
        const carries = [], seen = new Set([name]), queue = [name];
        while (queue.length) {
          for (const d of dependants.get(queue.shift())) {
            if (seen.has(d)) continue;
            seen.add(d); carries.push(d); queue.push(d);
          }
        }
        out[name] = { kind: p.kind, mast: p.mast, object: p.object, objects: p.objects,
          attachments: p.attachments, needs: p.needs, carries, ropes: p.ropes };
      }
      return out;
    },
  };
}

// ---------------------------------------------------------------------- the API

// Looking a node up by name walks the whole ship, so each ship keeps its own index.
const indexes = new WeakMap();
function lookup(ship, name) {
  let index = indexes.get(ship);
  if (!index) indexes.set(ship, index = new Map());
  let node = index.get(name);
  // A node that has been taken out of the scene is looked up afresh, not trusted.
  if (!node || !node.parent) {
    node = ship.getObjectByName(name);
    if (node) index.set(name, node); else index.delete(name);
  }
  return node;
}

function registry(ship) {
  const reg = ship.userData.rigParts;
  if (!reg) throw new Error('this ship has no rig parts: build her with buildShip from this package');
  return reg;
}

/** What a rig part takes down with it: every part, however many steps up the chain. */
export function partsCarriedBy(ship, partName) {
  return [...(ship.userData.rigParts?.[partName]?.carries ?? [])];
}

/** Is this part gone, either carried away itself or because what it stands on is? */
export function isCarriedAway(ship, partName) {
  return effective(ship).has(partName);
}

function effective(ship) {
  const reg = registry(ship), gone = new Set();
  for (const root of ship.userData.carriedAway ?? []) {
    gone.add(root);
    for (const c of reg[root].carries) gone.add(c);
  }
  return gone;
}

/**
 * Hide and show exactly what the record says. Only what this module hid is ever shown
 * again, so whatever else a host does with `visible` is left alone.
 */
function apply(ship) {
  const reg = registry(ship), gone = effective(ship);
  const set = (name, hide) => {
    const node = lookup(ship, name);
    if (!node) return;
    if (hide && node.visible) { node.visible = false; node.userData.shotAway = true; }
    else if (!hide && node.userData.shotAway) { node.visible = true; delete node.userData.shotAway; }
  };
  const ropesGone = new Set();
  for (const [name, part] of Object.entries(reg)) {
    const hide = gone.has(name);
    for (const o of part.objects) set(o, hide);
    for (const o of part.attachments) set(o, hide);
    if (hide) for (const r of part.ropes) ropesGone.add(r);
  }
  // A rope is made fast at both ends, so it goes when either end does.
  const every = new Set(Object.values(reg).flatMap((p) => p.ropes));
  for (const r of every) set(r, ropesGone.has(r));
  return gone;
}

/**
 * Carry a part away: hide it, everything it carries and every rope made fast to any of
 * them. Returns the names of the parts that are gone because of it, the part first.
 * A part that is already gone is not an error and is not recorded twice.
 */
export function carryAway(ship, partName) {
  const reg = registry(ship);
  if (!reg[partName]) throw new Error(`no rig part called "${partName}"`);
  const record = (ship.userData.carriedAway ??= []);
  if (!record.includes(partName)) record.push(partName);
  apply(ship);
  return [partName, ...reg[partName].carries];
}

/**
 * Put a part back, or the whole rig if no part is named. A part held down by another that
 * is still gone stays gone. Returns the names of the parts that came back.
 */
export function restore(ship, partName) {
  const reg = registry(ship);
  if (partName !== undefined && !reg[partName]) throw new Error(`no rig part called "${partName}"`);
  const before = effective(ship), record = ship.userData.carriedAway ?? [];
  ship.userData.carriedAway = partName === undefined ? [] : record.filter((r) => r !== partName);
  const after = apply(ship);
  return [...before].filter((n) => !after.has(n));
}

/** Every part a ship can lose, in the order they were built. */
export function rigPartNames(ship) {
  return Object.keys(registry(ship));
}

