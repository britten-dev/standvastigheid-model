// The watch on deck.
//
// Twelve figures do more for this ship than any other twelve thousand triangles in her,
// and not because anybody looks at them. They are what she is measured against. Without
// a man on her, a frigate is a shape with no size: the eye has nothing it knows the
// height of, so the gunports could be a foot high or four feet, and the whole ship reads
// as a model on a bench. Put one man at the wheel and every dimension on board is fixed
// at once.
//
// So they are built to be right at the two things that carry that: **height**, which
// comes from the muster rolls by way of the spec, and **posture**, which is what says
// these are people working a ship in a gale rather than mannequins set out on a deck.
// Nothing else about them matters much. Each is a few hundred triangles of jacket and
// tarpaulin, and at any distance where you could see a face there is a whole ship in the
// way of it.
//
// Every figure is its own Group with its arms as separate children, because
// src/ship/motion.js poses them: the helmsmen work the wheel, the men aloft sway with
// the mast, and everyone leans against the heel. A figure merged into the deck could not
// do any of that.
import * as THREE from 'three';
import { authoredFigure } from './authored-assets.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SPEC, PAINT } from '../spec/spec.js';
import { mergeGeometries } from '../util/loft.js';
import { deg, rng } from '../util/math.js';
import { audit } from '../audit/measure.js';

const S = (k) => SPEC[k].value;

/**
 * One figure, built about the origin at his feet, facing +Z.
 *
 * Roles differ only in what they are wearing and how they stand. `pose` is not an
 * animation — the motion layer does that — it is the attitude the figure is built in:
 * a man hauling stands differently from a man at a rail, and it reads from across the
 * ship when nothing else about him does.
 */
/**
 * The dress of the ship's company.
 *
 * A frigate's people are not a uniform. The officers wear a blue coat with white lapels,
 * waistcoat and breeches, and a cocked hat athwartships; the seamen wear a short blue
 * jacket, white duck trousers and a low round hat, and about one in four has a red
 * waistcoat from the purser's slops. Those are different silhouettes and different
 * patterns of light and dark, and at any distance where a face is a smudge they are the
 * whole of how one man is told from another.
 *
 * `tails` is the officer's coat; `cocked` his hat. Between them they are most of what the
 * eye reads as rank.
 */
const DRESS = {
  captain: { coat: 'officer_coat', legs: 'officer_facing', trim: 'officer_facing', hat: 'cocked', tails: true, tall: 1.03 },
  officer: { coat: 'officer_coat', legs: 'officer_facing', trim: 'officer_facing', hat: 'cocked', tails: true, tall: 1.0 },
  midshipman: { coat: 'officer_coat', legs: 'slop_duck', trim: 'officer_facing', hat: 'round', tails: false, tall: 0.93 },
  bosun: { coat: 'slop_jacket', legs: 'slop_duck', trim: 'slop_red', hat: 'round', tails: false, tall: 1.0 },
  seaman: { coat: 'slop_jacket', legs: 'slop_duck', trim: 'slop_tarpaulin', hat: 'round', tails: false, tall: 1.0 },
  // The men on deck in a gale are in tarpaulin over everything else, and the tarpaulin is
  // what is seen. Kept as its own rank so that a fair-weather watch and a foul-weather one
  // are not the same figures in different colours.
  oilskin: { coat: 'slop_tarpaulin', legs: 'slop_wet_duck', trim: 'slop_duck', hat: 'round', tails: false, tall: 1.0 },
};

/**
 * One figure, built about the origin at his feet, facing +Z.
 *
 * Everything here is in the service of one thing: that he reads as a man from across the
 * ship. That is not achieved with detail — at this size his head is a dozen pixels — it
 * is achieved with **silhouette** and **the pattern of light and dark on him**. A dark
 * jacket over pale trousers, a hat wider than his head, a coat with tails: those work at
 * two hundred metres. A face does not work at two.
 *
 * Colour is written into the vertices rather than carried by materials, so a man can have
 * six colours about him and still be one draw call. See `mats.crew`.
 */
function figure(mats, { rank = 'seaman', pose = 'stand', seed = 0, detail = false, cfg } = {}) {
  const authored = cfg && authoredFigure(cfg, { rank, pose, seed });
  if (authored) return authored;
  const group = new THREE.Group();
  const dress = DRESS[rank] ?? DRESS.seaman;
  const r = rng(seed * 7 + 3);

  // No two men are the same size. It is a few per cent and it does more for a group of
  // figures than any amount of work on any one of them.
  const vary = S('crew_build_variation');
  const scale = dress.tall * (1 + (r() - 0.5) * 2 * vary);
  const h = (dress.coat === 'officer_coat' ? S('crew_officer_height') : S('crew_figure_height')) * scale;
  const broad = 1 + (r() - 0.5) * 2 * vary;

  const legH = h * S('crew_leg_fraction');
  const shoulder = S('crew_shoulder_breadth') * broad;
  const hip = S('crew_hip_breadth') * broad;
  const depth = S('crew_depth') * broad;
  const headH = S('crew_head_height');
  const headW = S('crew_head_breadth');
  const neckH = S('crew_neck_height');
  const armLen = h * S('crew_arm_fraction');
  const armT = S('crew_arm_thickness');
  const legT = S('crew_leg_thickness');
  const stance = S('crew_stance');
  const torsoH = h - legH - headH - neckH;

  // ------------------------------------------------------------------ the palette
  const colours = {};
  const col = (key) => (colours[key] ??= new THREE.Color(PAINT[key].hex));
  /** Paint a chunk of geometry and add it to the pile. Colour lives in the vertices. */
  const paint = (g, key, into) => {
    const c = col(key);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    into.push(g);
    return g;
  };

  const solid = [];
  const box = (w, hh, d, x, y, z, key) => {
    const g = detail ? new RoundedBoxGeometry(w, hh, d, 2, Math.min(w, hh, d) * 0.16)
      : new THREE.BoxGeometry(w, hh, d);
    g.translate(x, y + hh / 2, z);
    return paint(g, key, solid);
  };
  /** A tapered, six-sided solid: a limb, a trunk, a head. Cheaper than it looks and it
   *  is what stops every part of a man being a rectangle. */
  const taper = (rTop, rBot, hh, x, y, z, key, sides = 6) => {
    const g = new THREE.CylinderGeometry(rTop, rBot, hh, detail ? Math.max(12, sides) : sides, 1);
    g.translate(x, y + hh / 2, z);
    return paint(g, key, solid);
  };

  // ----------------------------------------------------------------------- the legs
  // Apart, and bent at the knee. A man on a wet deck stands with his feet well spread and
  // never locks his knees, and that stance is most of what says the deck is moving.
  const thigh = legH * S('crew_thigh_fraction');
  const shin = legH - thigh;
  const knee = deg(S('crew_knee_deg'));
  for (const sx of [-1, 1]) {
    const hipX = sx * stance / 2;
    const t = new THREE.CylinderGeometry(legT * 0.42, legT * 0.5, thigh, detail ? 12 : 5, 1);
    t.translate(0, -thigh / 2, 0);
    t.rotateX(-knee);
    t.translate(hipX, legH, 0);
    paint(t, dress.legs, solid);

    const kneeY = legH - Math.cos(knee) * thigh;
    const kneeZ = Math.sin(knee) * thigh;
    const sh = new THREE.CylinderGeometry(legT * 0.34, legT * 0.42, shin, detail ? 12 : 5, 1);
    sh.translate(0, -shin / 2, 0);
    sh.rotateX(knee * 0.85);
    sh.translate(hipX, kneeY, kneeZ);
    paint(sh, dress.legs, solid);

    // A foot, so that he stands on the deck instead of ending at the ankle.
    box(legT * 0.85, legT * 0.34, legT * 1.9, hipX, 0, legT * 0.35, 'slop_tarpaulin');
  }

  // ---------------------------------------------------------------------- the body
  // Hips, then a trunk that is broader at the shoulder than at the waist.
  taper(hip * 0.52, hip * 0.5, torsoH * 0.34, 0, legH, 0, dress.legs);
  taper(shoulder * 0.48, hip * 0.52, torsoH * 0.7, 0, legH + torsoH * 0.3, 0, dress.coat);
  // Shoulders across, which a tapered trunk alone does not give.
  box(shoulder, torsoH * 0.2, depth * 0.95, 0, legH + torsoH * 0.78, 0, dress.coat);

  // The lapels or the neckerchief: a small band of contrast at the throat. It is two
  // dozen triangles and it is the difference between a coat and a tube.
  box(shoulder * 0.42, torsoH * 0.42, depth * 0.62, 0, legH + torsoH * 0.5, depth * 0.3, dress.trim);

  // The officer's coat tails, hanging behind from the waist. This is the single most
  // recognisable thing about a naval officer of this date at any distance at all.
  if (dress.tails) {
    box(hip * 1.02, legH * S('crew_coat_tail_drop'), depth * 0.32,
      0, legH - legH * S('crew_coat_tail_drop'), -depth * 0.34, dress.coat);
  } else {
    // A seaman's jacket, which ends just below the hip and is cut short so it does not
    // foul him aloft.
    box(hip * 1.06, legH * S('crew_jacket_drop'), depth * 0.9,
      0, legH - legH * S('crew_jacket_drop'), 0, dress.coat);
  }

  // ---------------------------------------------------------------------- the head
  const neckY = legH + torsoH;
  taper(headW * 0.22, headW * 0.26, neckH, 0, neckY, 0, 'crew_skin', 5);
  const headY = neckY + neckH;
  if (detail) {
    const head = new THREE.SphereGeometry(1, 16, 12);
    head.scale(headW * 0.44, headH * 0.5, headW * 0.43);
    head.translate(0, headY + headH * 0.42, 0);
    paint(head, 'crew_skin', solid);
    const nose = new THREE.SphereGeometry(1, 8, 6);
    nose.scale(headW * 0.085, headH * 0.115, headW * 0.14);
    nose.translate(0, headY + headH * 0.40, headW * 0.40);
    paint(nose, 'crew_skin', solid);
    for (const side of [-1, 1]) {
      const ear = new THREE.SphereGeometry(1, 8, 6);
      ear.scale(headW * 0.08, headH * 0.13, headW * 0.12);
      ear.translate(side * headW * 0.43, headY + headH * 0.40, 0);
      paint(ear, 'crew_skin', solid);
    }
  } else taper(headW * 0.36, headW * 0.44, headH * 0.82, 0, headY, 0, 'crew_skin');
  // The queue: the tarred pigtail every seaman of this date wore. It is one of the few
  // silhouette details that is unmistakably of this period and not of any other.
  {
    const q = new THREE.CylinderGeometry(headW * 0.09, headW * 0.06, S('crew_queue_length'), 4, 1);
    q.translate(0, -S('crew_queue_length') / 2, 0);
    q.rotateX(deg(-16));
    q.translate(0, headY + headH * 0.45, -headW * 0.34);
    paint(q, 'slop_tarpaulin', solid);
  }

  // ----------------------------------------------------------------------- the hat
  const crownY = headY + headH * 0.78;
  if (dress.hat === 'cocked') {
    // A cocked hat, worn athwartships: wider than his shoulders and pointed at both ends.
    // Three sides make the points; it is fourteen triangles and it is how an officer is
    // known across a deck.
    const span = S('crew_cocked_hat_span');
    const g = new THREE.CylinderGeometry(span / 2, span / 2, headH * 0.42, 3, 1);
    g.rotateX(Math.PI / 2);
    g.scale(1, 0.42, 1);
    g.translate(0, crownY + headH * 0.16, 0);
    paint(g, 'slop_tarpaulin', solid);
  } else {
    // A low round hat, tarred: a flat brim and a short crown.
    const brim = headW * 0.5 + S('crew_hat_brim');
    const b = new THREE.CylinderGeometry(brim / 2 + headW * 0.2, brim / 2 + headW * 0.2, headH * 0.09, 8, 1);
    b.translate(0, crownY + headH * 0.045, 0);
    paint(b, 'slop_tarpaulin', solid);
    taper(headW * 0.44, headW * 0.46, S('crew_hat_crown'), 0, crownY + headH * 0.09, 0, 'slop_tarpaulin', 8);
  }

  const body = new THREE.Mesh(mergeGeometries(solid), mats.crew);
  body.name = 'body';
  group.add(body);

  // ---------------------------------------------------------------------- the arms
  // Two nodes each: the shoulder, which the motion layer swings, and the elbow hanging
  // off it. The elbow is what makes a pose read as a man doing something rather than a
  // mannequin pointing, and it is what lets the shoulders stay inside their working
  // range — a bent arm reaches where a straight one has to be raised to reach.
  const shoulderY = legH + torsoH * 0.86;
  const upper = armLen * S('crew_upper_arm_fraction');
  const fore = armLen - upper;
  const hand = S('crew_hand_length');
  const arms = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = sx < 0 ? 'arm_port' : 'arm_starboard';
    pivot.position.set(sx * (shoulder / 2 - armT * 0.35), shoulderY, 0);

    const limb = [];
    const sleeve = new THREE.CylinderGeometry(armT * 0.4, armT * 0.48, upper, detail ? 12 : 5, 1);
    sleeve.translate(0, -upper / 2, 0);
    paint(sleeve, dress.coat, limb);
    const upperMesh = new THREE.Mesh(mergeGeometries(limb), mats.crew);
    upperMesh.name = 'limb';
    pivot.add(upperMesh);

    const elbow = new THREE.Group();
    elbow.name = 'elbow';
    elbow.position.set(0, -upper, 0);
    const lower = [];
    const cuff = new THREE.CylinderGeometry(armT * 0.34, armT * 0.4, fore - hand, detail ? 12 : 5, 1);
    cuff.translate(0, -(fore - hand) / 2, 0);
    paint(cuff, dress.coat, lower);
    // The hand: bare skin at the end of a dark sleeve, which is what says the arm is an
    // arm and not a stick.
    const fist = new THREE.CylinderGeometry(armT * 0.36, armT * 0.3, hand, detail ? 12 : 5, 1);
    fist.translate(0, -(fore - hand) - hand / 2, 0);
    paint(fist, 'crew_skin', lower);
    const foreMesh = new THREE.Mesh(mergeGeometries(lower), mats.crew);
    foreMesh.name = 'forearm';
    elbow.add(foreMesh);
    pivot.add(elbow);

    group.add(pivot);
    arms.push(pivot);
  }

  // ---------------------------------------------------------------------- the pose
  //
  // These arms bend at the elbow, which widens the vocabulary a good deal: a straight arm
  // raised much above seventy degrees stops reading as an arm and starts reading as a
  // semaphore, and two of them at once give the figure rabbit's ears. With an elbow he can
  // reach where a straight arm would have to be lifted to reach.
  const A = (k) => deg(S(k));
  const POSES = {
    // Hands down, braced. The watch when there is nothing to do but hold on.
    stand: {
      arms: [[A('crew_arm_rest_deg'), 0, A('crew_arm_rest_splay_deg')],
        [A('crew_arm_rest_deg'), 0, -A('crew_arm_rest_splay_deg')]],
      elbow: A('crew_elbow_deg'), lean: 0,
    },
    // Both arms forward and down onto the spokes of the wheel.
    helm: {
      arms: [[A('crew_arm_helm_deg'), 0, A('crew_arm_helm_splay_deg')],
        [A('crew_arm_helm_deg'), 0, -A('crew_arm_helm_splay_deg')]],
      elbow: A('crew_elbow_helm_deg'), lean: -A('crew_lean_deg') * 0.5,
    },
    // One hand out to a shroud or a rail, the other down. A lookout, or a man standing by
    // a brace waiting for the word.
    hold: {
      arms: [[A('crew_arm_reach_deg'), 0, A('crew_arm_reach_splay_deg')],
        [A('crew_arm_rest_deg'), 0, -A('crew_arm_rest_splay_deg')]],
      elbow: A('crew_elbow_deg'), lean: A('crew_lean_deg') * 0.3,
    },
    // Hauling on a fall: arms forward, weight back, which is the shape of a man pulling
    // and reads as one from right across the ship.
    haul: {
      arms: [[A('crew_arm_haul_deg'), 0, A('crew_arm_haul_splay_deg')],
        [A('crew_arm_haul_deg') * 0.9, 0, -A('crew_arm_haul_splay_deg')]],
      elbow: A('crew_elbow_haul_deg'), lean: A('crew_haul_lean_deg'),
    },
    // Hands behind the back: an officer with nothing to do but watch the sea, which is
    // most of what an officer of the watch does and is unmistakable at any distance.
    watch: {
      arms: [[A('crew_arm_rest_deg') * -1.4, 0, -A('crew_arm_rest_splay_deg')],
        [A('crew_arm_rest_deg') * -1.4, 0, A('crew_arm_rest_splay_deg')]],
      elbow: A('crew_elbow_haul_deg'), lean: 0,
    },
  };
  const pick = POSES[pose] ?? POSES.stand;
  arms[0].rotation.set(...pick.arms[0]);
  arms[1].rotation.set(...pick.arms[1]);
  // The elbow bends the same way on both arms; the shoulders are what differ.
  for (const a of arms) a.getObjectByName('elbow').rotation.x = pick.elbow;

  group.userData.crew = {
    pose, rank, armLen, shoulderY, height: h, lean: pick.lean, elbow: pick.elbow,
    officer: dress.tails,
  };
  return group;
}

/**
 * Put a figure on deck at a station, facing a direction.
 *
 * `side` is which side of the ship he stands on and `out` how far toward the rail, as a
 * fraction of the half-breadth there — because a man stands by the rail or at a fitting,
 * never on the centreline for no reason.
 */
function station(model, { fromStem, side = 1, out = 0.6, facing = Math.PI }) {
  const z = model.fromStem(fromStem);
  const y = model.standingDeckAt(z);
  const x = side * model.halfBreadthAt(z, y) * out;
  return { position: new THREE.Vector3(x, y + S('deck_camber') * (1 - out * out), z), facing };
}

export function buildCrew(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'crew';
  if (!cfg.crew) return group;

  // What the watch is wearing. In heavy weather every man on deck is in tarpaulin over
  // whatever else he has on, and the tarpaulin is what is seen — except the officers,
  // whose coats go on over the top of it and who are known by them.
  const heavy = Boolean(ctx.heavyWeather);
  const hand = heavy ? 'oilskin' : 'seaman';

  // Every man gets a seed of his own, so that no two are the same height or build.
  let seed = 0;
  const place = (name, at, opts) => {
    const f = figure(mats, { seed: seed++, detail: cfg.textureSize >= 1024, cfg, ...opts });
    f.position.copy(at.position);
    // Heading first, then the lean of the pose about his own athwartships axis. YXZ
    // order is what makes that read the way it is written: turn him, then tip him.
    f.rotation.order = 'YXZ';
    f.rotation.y = at.facing;
    f.rotation.x = f.userData.crew.lean;
    f.name = name;
    // Which way is up for this man, before the ship heels: the motion layer leans him
    // off it. Kept here because a figure has to know its own upright to be leaned.
    f.userData.crew.home = { y: f.rotation.y };
    group.add(f);
    return f;
  };

  // ------------------------------------------------------------------- the wheel
  // Two men share the single wheel, standing either side and facing the spokes. This
  // is the pair that carries the whole scene: they are the tallest thing on the after
  // deck that is not a mast, and everything else on board is measured off them.
  {
    const zWheel = model.fromStem(SPEC.wheel_station_from_stem.value);
    const y = model.standingDeckAt(zWheel);
    for (const sx of [-1, 1]) {
      const f = figure(mats, { pose: 'helm', rank: heavy ? 'oilskin' : 'seaman', seed: seed++, detail: cfg.textureSize >= 1024, cfg });
      f.position.x = sx * .68;
      f.position.z = zWheel - S('wheel_barrel_length') / 2 - .05 + .40;
      const halfBeam = model.halfBreadthAt(f.position.z, y);
      f.position.y = model.standingDeckAt(f.position.z)
        + S('deck_camber') * (1 - (f.position.x / halfBeam) ** 2);
      f.rotation.order = 'YXZ';
      f.rotation.y = Math.PI;                       // facing forward, at the wheel
      f.rotation.x = f.userData.crew.lean;
      f.name = sx < 0 ? 'helmsman_port' : 'helmsman_starboard';
      f.userData.crew.role = 'helm';
      f.userData.crew.home = { y: f.rotation.y };
      group.add(f);
    }
  }

  // ----------------------------------------------------------------- the officers
  // The officer of the watch by the binnacle, where he can see the compass; a second
  // aft at the taffrail with his eye on the following sea, which in this weather is the
  // whole of the ship's business.
  {
    const zBin = SPEC.binnacle_station_from_stem.value + S('crew_con_abaft_binnacle');
    place('officer_of_the_watch',
      station(model, { fromStem: zBin - .45, side: -1, out: 0.58, facing: Math.PI - .25 }),
      { rank: 'officer', pose: 'stand' });
    // The captain, aft at the taffrail with his eye on the following sea, which running
    // before a gale is the whole of the ship's business. He is the tallest figure on
    // board, in a tailed coat and a cocked hat, and he is the one the eye finds first.
    place('captain',
      station(model, { fromStem: S('crew_taffrail_from_stem'), side: -1, out: S('crew_rail_inset'), facing: 0 }),
      { rank: 'captain', pose: 'watch' });
  }

  // -------------------------------------------------------------------- the watch
  // Hands at the pumps beside the mainmast, hands standing by the braces aft, and a
  // lookout forward. All of them at the rail or at a fitting, none of them in the
  // middle of a deck doing nothing.
  //
  // They are not all the same man. The bosun is a petty officer and dressed as one; the
  // midshipman on the quarterdeck is a boy in a blue jacket and a round hat, which is
  // exactly what he was. Ranks vary the silhouette, and the seed varies the build.
  const watch = [
    ['lookout', S('crew_lookout_from_stem'), 1, 'hold', 0, hand],
    ['pump_hand_port', S('crew_waist_from_stem'), -1, 'haul', Math.PI * 0.5, hand],
    ['pump_hand_starboard', S('crew_waist_from_stem') + 1.2, 1, 'haul', -Math.PI * 0.5, hand],
    ['bosun', S('crew_waist_from_stem') - 3.0, -1, 'stand', Math.PI, 'bosun'],
    ['brace_hand_port', S('crew_brace_from_stem'), -1, 'haul', Math.PI * 0.8, hand],
    ['brace_hand_starboard', S('crew_brace_from_stem') + 1.6, 1, 'stand', Math.PI, hand],
    ['midshipman', SPEC.wheel_station_from_stem.value - 5.0, -1, 'hold', Math.PI, 'midshipman'],
  ];
  for (const [name, fromStem, side, pose, facing, rank] of watch) {
    place(name, station(model, { fromStem, side, out: S('crew_rail_inset'), facing }), { pose, rank });
  }

  // ---------------------------------------------------------------------- aloft
  // Two hands in the main top. It is the one place on the ship where a figure is seen
  // against the sky, which is where the eye goes first, and it is the only way of
  // saying how high the mast is.
  if (ctx.rig && cfg.crew === 'full') {
    const m = ctx.rig.masts.find((x) => x.name === 'main') ?? ctx.rig.masts[1];
    if (m) {
      const p = m.along(m.houndsH);
      const half = (m.topBreadth ?? 3.4) / 2;
      for (const [i, sx] of [-1, 1].entries()) {
        const f = figure(mats, { pose: i ? 'haul' : 'hold', rank: hand, seed: seed++, detail: cfg.textureSize >= 1024 });
        // Stand on the forward part of the top, clear of the topsail's belly aft.
        // At the mast centre the moving cloth sliced through their heads and torsos.
        f.position.set(sx * half * Math.min(S('crew_top_inset'), 0.36), p.y + SPEC.top_platform_thickness.value,
          p.z - m.topLength * 0.22);
        f.rotation.order = 'YXZ';
        f.rotation.y = i ? Math.PI * 0.9 : Math.PI * 1.1;
        f.rotation.x = f.userData.crew.lean;
        f.name = i ? 'topman_starboard' : 'topman_port';
        f.userData.crew.role = 'aloft';
        f.userData.crew.home = { y: f.rotation.y };
        group.add(f);
      }
    }
  }

  // The audit measures one man and counts the rest. Height is the row that matters:
  // it is the ship's scale, and if it drifts the whole ship changes size with it.
  const first = group.children[0];
  if (first) audit(first, 'crew_figure_height', 'extent_y', { tolerance: 0.05 });
  group.userData.count = group.children.length;
  audit(group, 'crew_count', 'count', { tolerance: 0.34 });

  return group;
}
