// The sails, in four states.
//
// A square sail is not a flat sheet. It is bent to the yard above it, its clews are
// hauled out to the yardarms of the yard below, and the wind puts a belly in it. So
// each sail is built as a curved surface between two yards, with the head the width of
// its own yard and the foot the width of the yard beneath — which is why a topsail is
// wider at the foot than at the head, and why the whole suit sits in a pyramid.
//
// The four states the brief asks for:
//   full      courses, topsails, topgallants, staysails and three headsails
//   topsails  topsails and the spanker only — the usual cruising rig
//   storm     a reefed foresail and a close-reefed main topsail, nothing else
//   furled    every sail handed and stowed on its yard
import * as THREE from 'three';
import { sailCordage, headRobands } from './sail-detail.js';
import { canvasDepth } from './canvas-shape.js';
import { detailChoice } from './detail-lod.js';
import { SPEC, PAINT } from '../spec/spec.js';
import { spar } from '../util/solids.js';
import { lerp, clamp, deg } from '../util/math.js';
import { audit } from '../audit/measure.js';

const S = (k) => SPEC[k].value;

// Which sails are set in each state. A sail named here is drawn; anything not named is
// either furled on its yard or not there at all.
export const SUIT = {
  full: {
    set: ['fore_course', 'main_course',
      'fore_topsail', 'main_topsail', 'mizzen_topsail',
      'fore_topgallant', 'main_topgallant', 'mizzen_topgallant',
      'main_staysail', 'main_topmast_staysail', 'mizzen_staysail',
      'fore_topmast_staysail', 'jib', 'flying_jib',
      'spanker'],
    reefs: {},
  },
  topsails: {
    set: ['fore_topsail', 'main_topsail', 'mizzen_topsail', 'fore_topmast_staysail', 'spanker'],
    reefs: {},
  },
  storm: {
    // Reefed foresail and close-reefed main topsail: what she would show in a gale.
    set: ['fore_course', 'main_topsail'],
    reefs: { fore_course: 0.62, main_topsail: 0.45 },
  },
  furled: { set: [], reefs: {} },
};

/**
 * A square sail: a surface hung from the head yard, spread to the foot yard, bellying
 * away from the wind. `reef` shortens the drop, as taking in a reef does.
 */
function squareSail(headCentre, headWidth, footCentre, footWidth, cfg, { reef = 1, belly = S('sail_belly'), braceRad = 0, roach = S('sail_roach') } = {}) {
  const [nu, nv] = cfg.sailSegments;
  const drop = headCentre.distanceTo(footCentre) * reef;
  const foot = new THREE.Vector3().lerpVectors(headCentre, footCentre, reef);

  // The sail bellies to leeward. The yards are braced round by `braceRad`, so leeward
  // is square to the yard, not square to the ship.
  // Bow is -Z. Drawing canvas fills FORWARD of its yard, away from the
  // mast and the shroud ladders. +Z inverted the pressure shape through them.
  const lee = new THREE.Vector3(-Math.sin(braceRad), 0, -Math.cos(braceRad));
  const across = new THREE.Vector3(Math.cos(braceRad), 0, -Math.sin(braceRad)).normalize();

  const leechCurve = S('sail_leech_curve');

  const pos = [], uvs = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      // The roach: the foot of a square sail is not cut straight across. It is scooped
      // upward in the middle so that it clears the stay and the top of the sail below,
      // and that curve is one of the things the eye reads as "a sail" rather than "a
      // rectangle of cloth". The clews at the corners stay down where the sheets hold
      // them; only the middle rises.
      const vv = v * (1 - roach * Math.sin(Math.PI * u));
      const centre = new THREE.Vector3().lerpVectors(headCentre, foot, vv);
      // The leeches bow outward a little between the head and the clew, for the same
      // reason: a sail under strain is a curved surface, not a flat trapezoid.
      const width = lerp(headWidth, footWidth, vv) * (1 + leechCurve * Math.sin(Math.PI * vv));
      const s = (u - 0.5) * width;
      // The belly: fullest in the middle of the sail and dying away at head, foot and
      // both leeches, where the sail is held to a spar or a rope.
      const b = canvasDepth(u, v, vv, width, drop, belly, cfg.textureSize >= 1024);
      const p = centre.clone().addScaledVector(across, s).addScaledVector(lee, b);
      pos.push(p.x, p.y, p.z);
      uvs.push(u, 1 - v);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * A fore-and-aft sail: a triangle for a staysail or a headsail, a quadrilateral for the
 * spanker. Given its corners in order, it bellies the same way a square sail does.
 */
function foreAndAftSail(corners, cfg, { belly = S('sail_belly'), side = 1 } = {}) {
  const [nu, nv] = cfg.sailSegments;
  const [head, tack, clew, throat] = corners.length === 4 ? corners : [corners[0], corners[1], corners[2], corners[0]];
  const pos = [], uvs = [], idx = [];
  // Bilinear across the quadrilateral head-throat / tack-clew.
  const span = Math.max(head.distanceTo(tack), throat.distanceTo(clew));
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const luff = new THREE.Vector3().lerpVectors(head, tack, v);
    const leech = new THREE.Vector3().lerpVectors(throat, clew, v);
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const p = new THREE.Vector3().lerpVectors(luff, leech, u);
      p.x += side * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * belly * span * 0.8;
      pos.push(p.x, p.y, p.z);
      uvs.push(u, 1 - v);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * Move a sail's UVs into one square of the cloth map's variant grid.
 *
 * The map is drawn as a grid of independently seeded sails — different stains, different
 * mildew, a patch in a different place — and this is what hands each sail its own. It is
 * done to the finished geometry rather than inside each sail generator so that all three
 * kinds of canvas, square, fore-and-aft and furled, get it from one place.
 *
 * Sails are given variants in the order they are built, so the same sail on two ships
 * built the same way carries the same cloth. That is wanted: a ship should not change her
 * patches when she shortens sail.
 */
function retileUV(geometry, index) {
  const n = Math.max(1, Math.round(PAINT.weather_sail_variants.value));
  if (n === 1) return geometry;
  const tx = index % n;
  const ty = Math.floor(index / n) % n;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    // Held a little inside its own square, so that a mipmap of the grid cannot fetch a
    // texel from the sail next door and hang another sail's patch on this one's leech.
    const inset = 0.002;
    const u = clamp(uv.getX(i), inset, 1 - inset);
    const v = clamp(uv.getY(i), inset, 1 - inset);
    uv.setXY(i, (tx + u) / n, (ty + v) / n);
  }
  uv.needsUpdate = true;
  return geometry;
}

/** A sail handed and stowed along its yard: a long tapered bundle. */
function furledBundle(yard, cfg) {
  const len = yard.length * 0.82;
  const d = S('furled_bundle_diameter');
  const g = spar({
    length: len,
    // Fat in the middle where the bulk of the canvas gathers, tapering to the arms.
    radiusAt: (t) => (d / 2) * (0.35 + 0.65 * Math.sin(Math.PI * clamp(t, 0, 1)) ** 0.6),
    // A furled sail is a lumpy sausage, and at silhouette range it only has to be a
    // thicker line along the yard, so it scales with the level like every other spar.
    segments: Math.max(3, cfg.sparSegments + 1), radial: Math.max(3, cfg.sparRadial - 1),
  });
  g.translate(0, -len / 2, 0);
  g.rotateZ(Math.PI / 2);
  return g;
}

/**
 * Build the sails, each as a part of its own.
 *
 * Every sail is a separate mesh hung on the spar or the stay that carries it, and is
 * entered in the rig's record of parts (`env.reg`) with what it stands on, so that it can
 * be shot away with its yard or its mast and nothing is left hanging. A square sail is a
 * child of its head yard, so bracing the yard brings the canvas round; a fore-and-aft sail
 * is a child of the assembly whose stay or gaff carries it. A sail that is not set is
 * furled on its yard as a bundle of its own, which stands in for the sail in the record.
 *
 * Returns the objects to add to the rig group.
 */
export function buildSails(cfg, mats, model, ctx, geo, yards, env) {
  const { reg, G, bowGroup } = env;
  const suit = SUIT[ctx.sails] ?? SUIT.full;
  const setNames = new Set(suit.set);
  const braceRad = deg(ctx.sails === 'storm' ? 22 : 12);

  const squares = [];
  // Which square of the cloth map the next sail takes.
  let cloth = 0;

  // The square sails, each between its own yard and the one below it. The lowest sail
  // on each mast — the course — has no yard below, so its clews come down toward the
  // rail instead.
  const SQUARES = [
    ['fore_course', 'fore_yard', null],
    ['main_course', 'main_yard', null],
    ['fore_topsail', 'fore_topsail_yard', 'fore_yard'],
    ['main_topsail', 'main_topsail_yard', 'main_yard'],
    ['mizzen_topsail', 'mizzen_topsail_yard', 'crossjack_yard'],
    ['fore_topgallant', 'fore_topgallant_yard', 'fore_topsail_yard'],
    ['main_topgallant', 'main_topgallant_yard', 'main_topsail_yard'],
    ['mizzen_topgallant', 'mizzen_topgallant_yard', 'mizzen_topsail_yard'],
  ];
  const mastOf = (name) => /^(fore|main|mizzen)_/.test(name) ? name.split('_')[0] : name === 'spanker' ? 'mizzen' : 'bowsprit';

  // A sail not set is stowed on its own yard, unless the whole state is 'furled', in which
  // case every yard gets a bundle. It is the sail's stand-in in the record of parts.
  const furl = (sailName, headYard, length, mastName) => {
    const geometry = retileUV(furledBundle({ length }, cfg), cloth++);
    const mesh = new THREE.Mesh(geometry, mats.sail);
    mesh.name = `${sailName}_furled`;
    mesh.position.y -= S('furled_bundle_diameter') * 0.45;
    headYard.add(mesh);
    reg.part(`${sailName}_sail`, { kind: 'sail', mast: mastName, object: mesh.name, needs: [headYard.name] });
  };
  const bundles = ctx.sails === 'furled' || cfg.deckFurniture !== 'none';

  for (const [sailName, headYardName, footYardName] of SQUARES) {
    const head = yards[headYardName];
    if (!head) continue;
    const foot = footYardName ? yards[footYardName] : null;

    if (!setNames.has(sailName)) {
      if (bundles) furl(sailName, head.node, head.length, head.mast.name);
      continue;
    }

    // The head of the sail is bent to its yard, a little inside the arms.
    const headWidth = head.length * 0.94;
    const headCentre = head.centre.clone();
    headCentre.y -= 0.12;

    // The foot is spread to the yard below, or, for a course, hauled down toward the
    // rail. A course drops to about the height of the rail; that is what makes the
    // waist of the ship disappear behind canvas in the reference photograph.
    let footCentre, footWidth;
    if (foot) {
      footCentre = foot.centre.clone();
      footCentre.y += 0.15;
      footWidth = foot.length * 0.97;
    } else {
      const railY = model.featureYAt(head.mast.z0).rail;
      footCentre = head.mast.along(0).clone();
      footCentre.y = railY + 0.9;
      footCentre.z = head.mast.z0;
      footCentre.z -= head.node.userData.yardPivot.clearance;
      footWidth = head.length * 1.0;
    }

    const reef = suit.reefs[sailName] ?? 1;
    // The arched foot clears the lower masthead and its stay collar. A course's
    // shallow foot cut is not suitable for a topsail or a topgallant.
    const footRoach = foot ? Math.min(.48, Math.max(.15,
      (head.mast.along(foot.tier === 'lower' ? head.mast.capH : head.mast.topmastCapH).y + .45 - footCentre.y)
      / (headCentre.y - footCentre.y))) : S('sail_roach');
    const geometry = retileUV(
      squareSail(headCentre, headWidth, footCentre, footWidth, cfg, { reef, braceRad, roach: footRoach,
        // These two fore sails draw close to the bowsprit stays; leave room
        // for their breathing/flutter rather than testing only the still pose.
        belly: sailName === 'fore_course' || sailName === 'fore_topgallant' ? .065 : S('sail_belly') }),
      cloth++
    );
    // Into the yard's own frame, so that swinging the yard swings the sail. The sail was
    // lofted in the ship's coordinates, which is the right place to loft it — its head
    // and foot are on two different spars — and this is the one transform that moves it
    // onto the spar that carries it.
    head.node.updateMatrix();
    geometry.applyMatrix4(new THREE.Matrix4().copy(head.node.matrix).invert());
    geometry.userData.handling = { name: sailName, kind: 'square', headWidth, tiles: Math.round(PAINT.weather_sail_variants.value), reef: sailName === 'fore_course' ? .62 : .45 };
    geometry.userData.sheetFrame = { foot: foot?.node.name ?? null, footCentre: footCentre.toArray(),
      headCentre: head.centre.toArray(), brace: braceRad };
    squares.push({ geometry, yard: head, headName: headYardName, name: `${sailName}_sail`, sailName });
  }

  // ------------------------------------------------------------------- fore-and-aft
  //
  // Headsails and staysails are narrow. Their tack is far forward and low, on the
  // bowsprit or the jibboom; their head is up the stay; and their clew is sheeted DOWN
  // to the rail a little abaft the tack — not up the mast. Running the clew up to the
  // masthead turns each of them into an enormous triangle that fills the whole space
  // between the masts, hides the square sails behind it and makes a ship read as a
  // schooner. The photograph shows the opposite: slim headsails and small staysails, with
  // the square pyramid dominating.
  const fa = [];
  const lee = -1;                                  // the sails belly to leeward
  // Each is entered with the assembly that carries it, and the parts it is made fast to:
  // the stay it is set on and the spar its tack is on.
  const addTriangle = (name, head, tack, clew, parent, needs) => {
    const g = retileUV(foreAndAftSail([head, tack, clew], cfg, { side: lee }), cloth++);
    g.userData.handling = { name, kind: 'stay', tack: tack.toArray(), tiles: Math.round(PAINT.weather_sail_variants.value) };
    fa.push({ geometry: g, name, parent, needs });
  };

  // A sheeting point at the rail, so many metres abaft a mast and to leeward.
  const sheetAt = (mast, abaft, above = 0.9) => {
    const z = mast.z0 + abaft;
    const f = model.featureYAt(z);
    return new THREE.Vector3(lee * model.halfBreadthAt(z, f.rail) * 0.55, f.rail + above, z);
  };

  const bs = geo.bowsprit;
  if (setNames.has('fore_topmast_staysail')) {
    addTriangle('fore_topmast_staysail',
      geo.fore.along(geo.fore.topmastHeel + (geo.fore.topmastHoundsH - geo.fore.topmastHeel) * 0.72),
      bs.at(bs.length * 0.58),
      sheetAt(geo.fore, -1.4, 1.1),
      G.fore.topmast, ['fore_topmast', 'bowsprit']
    );
  }
  if (setNames.has('jib')) {
    addTriangle('jib',
      geo.fore.along(geo.fore.topmastHoundsH),
      bs.cap.clone().lerp(bs.end, 0.42),
      bs.at(bs.length * S('jib_clew_along_bowsprit')).add(new THREE.Vector3(0, -0.5, 0)),
      G.fore.topmast, ['fore_topmast', 'jibboom']
    );
  }
  if (setNames.has('flying_jib')) {
    addTriangle('flying_jib',
      geo.fore.along(geo.fore.tgStayH).lerp(bs.end, 0.1),
      bs.end,
      bs.at(bs.length * S('flying_jib_clew_along_bowsprit')).add(new THREE.Vector3(0, -0.4, 0)),
      G.fore.tg, ['fore_topgallant', 'jibboom']
    );
  }

  // The staysails between the masts are set on the stays that run forward and down from
  // each masthead, and are sheeted to the deck abaft the mast in front. They are modest
  // sails, filling the lower half of the gap and no more.
  if (setNames.has('main_staysail')) {
    const z = geo.fore.z0 + 2.4;
    addTriangle('main_staysail',
      geo.main.along(geo.main.above(0.86)),
      new THREE.Vector3(0, model.standingDeckAt(z) + 0.5, z),
      sheetAt(geo.main, -1.6, 0.7),
      G.main.lower, ['main_lower_mast']
    );
  }
  if (setNames.has('main_topmast_staysail')) {
    addTriangle('main_topmast_staysail',
      geo.main.along(geo.main.topmastHeel + (geo.main.topmastHoundsH - geo.main.topmastHeel) * 0.78),
      geo.fore.along(geo.fore.houndsH + 0.4),
      geo.main.along(geo.main.capH - S('main_topmast_staysail_clew_below_cap')),
      G.main.topmast, ['main_topmast', 'fore_lower_mast']
    );
  }
  if (setNames.has('mizzen_staysail')) {
    addTriangle('mizzen_staysail',
      geo.mizzen.along(geo.mizzen.above(0.88)),
      geo.main.along(geo.main.above(0.16)),
      sheetAt(geo.mizzen, -1.2, 0.6),
      G.mizzen.lower, ['mizzen_lower_mast', 'main_lower_mast']
    );
  }

  // The spanker: a four-cornered sail on the gaff and boom abaft the mizzen.
  if (setNames.has('spanker') && ctx.spanker) {
    const sp = ctx.spanker;
    const g = retileUV(foreAndAftSail([sp.gaffRoot, sp.boomRoot, sp.boomEnd, sp.gaffEnd], cfg, { side: lee }), cloth++);
    g.userData.handling = { name: 'spanker', kind: 'spanker', root: sp.boomRoot.toArray(), end: sp.boomEnd.toArray(), tiles: Math.round(PAINT.weather_sail_variants.value) };
    fa.push({ geometry: g, name: 'spanker', parent: G.mizzen.lower, needs: ['spanker_gaff', 'spanker_boom'] });
  }

  // The square sails are hung on their own yards rather than merged into one mesh.
  //
  // This is the one place where the obvious optimisation is the wrong answer. Merging
  // eight sails costs one draw call instead of eight, and it welds every sail in the ship
  // to the hull: the yards can then never be braced, because their canvas would stay
  // where it was and the sails would come off the spars. A square-rigged ship whose yards
  // cannot come round cannot answer a change of wind, which is most of what a square rig
  // is *for*.
  //
  // So each sail is built in its own yard's frame and added as a child of it. The foot of
  // each sail is spread to the yard below, which is braced with it — yards on a mast come
  // round together — so the sail stays bent to both spars however far round they go.
  // sail-sheeting.js then follows the actual lower-yard angle (which can stop sooner at
  // its shrouds) and keeps course feet sheeted to the hull rather than rigidly orbiting
  // with the head.
  const out = [];
  for (const { geometry, yard, headName, name, sailName } of squares) {
    const mesh = new THREE.Mesh(geometry, mats.sail);
    mesh.name = name;
    yard.node.add(mesh);
    const also = [];
    const ties = headRobands(yard, cfg);
    if (ties) {
      const robands = new THREE.Mesh(ties, mats.runningRigging);
      robands.name = name.replace(/_sail$/, '_robands');
      detailChoice(robands, .055);
      yard.node.add(robands);
      also.push(robands.name);
    }
    const cordage = sailCordage(geometry, cfg);
    if (cordage) {
      const cord = new THREE.Mesh(cordage, mats.sailCord);
      cord.name = name.replace(/_sail$/, '_cordage_sail');
      cord.geometry.userData.handling = geometry.userData.handling;
      cord.geometry.userData.sheetFrame = geometry.userData.sheetFrame;
      yard.node.add(cord);
      also.push(cord.name);
    }
    reg.part(name, { kind: 'sail', mast: yard.mast.name, object: name, objects: also, needs: [headName] });
  }
  if (squares.length) {
    // The audit counts the suit, and one mesh has to carry the tag. It is put on a marker
    // rather than on a sail, because the sails live under the yards and the count is a
    // fact about the suit and not about any one of them.
    const tally = new THREE.Object3D();
    tally.name = 'square_sail_tally';
    tally.userData.count = squares.length;
    audit(tally, 'square_sails_set', 'count', { tolerance: 0.001 });
    out.push(tally);
  }

  // The fore-and-aft sails, each a mesh of its own so that each can be carried away.
  for (const { geometry, name, parent, needs } of fa) {
    const mesh = new THREE.Mesh(geometry, mats.sail);
    mesh.name = `${name}_sail`;
    parent.add(mesh);
    reg.part(mesh.name, { kind: 'sail', mast: mastOf(name), object: mesh.name, needs });
  }

  // The spritsail is furled on its yard in every state: she is not set in a seaway, and
  // the yard under the bowsprit is bare without it.
  if (bundles) furl('spritsail', env.spritsail, S('spritsail_yard_length'), 'bowsprit');

  return out;
}

/** How many square sails each state sets — the audit checks the built count matches. */
export const SQUARE_SAIL_COUNT = {
  full: 8, topsails: 3, storm: 2, furled: 0,
};
