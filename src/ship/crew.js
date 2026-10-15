// The watch on deck of a Dutch 74 of 1811.
//
// Two dozen figures do more for this ship than any other twenty thousand triangles in her,
// and not because anybody looks at them. They are what she is measured against. Without
// a man on her, a 74 is a shape with no size: the eye has nothing it knows the height of,
// so the gunports could be a foot high or four feet, and the whole ship reads as a model
// on a bench. Put one man at the wheel and every dimension on board is fixed at once.
//
// So they are built to be right at the two things that carry that: **height**, which
// comes from the muster rolls by way of the spec, and **posture**, which is what says
// these are people working a ship in a gale rather than mannequins set out on a deck.
// Nothing else about them matters much. Each is a few hundred triangles of jacket and
// tarpaulin, and at any distance where you could see a face there is a whole ship in the
// way of it.
//
// They are Dutch (research 05, §1): officers in dark blue coats with light-blue or red
// facings and cocked hats; the captain, as the book describes him, in a LIGHT-BLUE coat with
// brass buttons, smoking a short clay pipe; seamen in short jackets and round hats.
//
// Every figure is its own Group with its arms as separate children, because
// src/ship/motion.js poses them: the helmsmen work the wheel, the men aloft sway with
// the mast, and everyone leans against the heel. A figure merged into the deck could not
// do any of that.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SPEC, PAINT, OFFSETS } from '../spec/spec.js';
import { mergeGeometries } from '../util/loft.js';
import { deg, rng } from '../util/math.js';
import { audit } from '../audit/measure.js';
import { deckYAt, deckHalfBreadth } from './deck-level.js';
import { fittingStations } from './furniture.js';

const S = (k) => SPEC[k].value;

/**
 * The dress of the ship's company.
 *
 * A 74's people are not a uniform. The officers wear a dark blue coat with a facing colour
 * at collar, lapels and cuffs (light blue or red) and a cocked hat athwartships; the
 * captain's coat is light blue, with brass buttons; the seamen wear a short blue jacket,
 * white duck trousers and a low round hat, and about one in four has a red waistcoat from
 * the purser's slops. Those are different silhouettes and different patterns of light and
 * dark, and at any distance where a face is a smudge they are the whole of how one man is
 * told from another.
 *
 * `tails` is the officer's coat; `cocked` his hat. Between them they are most of what the
 * eye reads as rank. `trim` is the colour of the lapel panel on the chest and of the
 * cuffs.
 */
const DRESS = {
  captain: { coat: 'dutch_captain_coat', legs: 'officer_facing', trim: 'officer_facing', cuff: 'dutch_captain_coat',
    hat: 'cocked', tails: true, officer: true, buttons: true, pipe: true, tall: 1.03 },
  officer: { coat: 'officer_coat', legs: 'officer_facing', trim: 'dutch_facing_light_blue', cuff: 'dutch_facing_light_blue',
    hat: 'cocked', tails: true, officer: true, buttons: true, tall: 1.0 },
  officer_red: { coat: 'officer_coat', legs: 'officer_facing', trim: 'dutch_facing_red', cuff: 'dutch_facing_red',
    hat: 'cocked', tails: true, officer: true, buttons: true, tall: 1.0 },
  midshipman: { coat: 'officer_coat', legs: 'slop_duck', trim: 'dutch_facing_light_blue', cuff: 'dutch_facing_light_blue',
    hat: 'round', tails: false, officer: true, buttons: false, tall: 0.93 },
  bosun: { coat: 'slop_jacket', legs: 'slop_duck', trim: 'slop_red', hat: 'round', tails: false, tall: 1.0 },
  seaman: { coat: 'slop_jacket', legs: 'slop_duck', trim: 'slop_tarpaulin', hat: 'round', tails: false, tall: 1.0 },
  // One man in four has a red waistcoat from the purser's slops.
  seaman_red: { coat: 'slop_jacket', legs: 'slop_duck', trim: 'slop_red', hat: 'round', tails: false, tall: 1.0 },
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
 * Roles differ only in what they are wearing and how they stand. `pose` is not an
 * animation — the motion layer does that — it is the attitude the figure is built in:
 * a man hauling stands differently from a man at a rail, and it reads from across the
 * ship when nothing else about him does.
 *
 * Colour is written into the vertices rather than carried by materials, so a man can have
 * six colours about him and still be one draw call. See `mats.crew`.
 */
function figure(mats, { rank = 'seaman', pose = 'stand', seed = 0, detail = false, bake = false } = {}) {
  const group = new THREE.Group();
  const dress = DRESS[rank] ?? DRESS.seaman;
  const r = rng(seed * 7 + 3);

  // No two men are the same size. It is a few per cent and it does more for a group of
  // figures than any amount of work on any one of them.
  const vary = S('crew_build_variation');
  const scale = dress.tall * (1 + (r() - 0.5) * 2 * vary);
  const h = (dress.officer ? S('crew_officer_height') : S('crew_figure_height')) * scale;
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

  // The brass buttons down the front of an officer's coat: two columns of three. They are
  // 72 triangles, and on the captain's light-blue coat they are what the book remarks on.
  if (dress.buttons) {
    const b = S('crew_button_size');
    const zFront = depth * 0.3 + depth * 0.31 + b * 0.25;
    for (const sx of [-1, 1]) for (const f of [0.40, 0.52, 0.64]) {
      box(b, b, b * 0.5, sx * shoulder * 0.09, legH + torsoH * f - b / 2, zFront, 'dutch_button_brass');
    }
  }

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

  // The captain's short clay pipe: a stem from the corner of his mouth, tilted a little up,
  // and a bowl at the end of it. Fourteen triangles.
  if (dress.pipe) {
    const stemLen = S('crew_pipe_stem_length');
    const stem = new THREE.CylinderGeometry(headW * 0.035, headW * 0.035, stemLen, 4, 1);
    stem.rotateX(Math.PI / 2 - deg(14));
    stem.translate(headW * 0.12, headY + headH * 0.2 + stemLen * 0.12, headW * 0.38 + stemLen * 0.46);
    paint(stem, 'officer_facing', solid);
    const bowlH = S('crew_pipe_bowl_height');
    const bowl = new THREE.CylinderGeometry(headW * 0.09, headW * 0.06, bowlH, 6, 1);
    bowl.translate(headW * 0.12, headY + headH * 0.2 + stemLen * 0.24 + bowlH * 0.2, headW * 0.38 + stemLen * 0.93);
    paint(bowl, 'slop_tarpaulin', solid);
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

  // ---------------------------------------------------------------------- the arms
  // Two nodes each: the shoulder, which the motion layer swings, and the elbow hanging
  // off it. The elbow is what makes a pose read as a man doing something rather than a
  // mannequin pointing, and it is what lets the shoulders stay inside their working
  // range — a bent arm reaches where a straight one has to be raised to reach.
  const shoulderY = legH + torsoH * 0.86;
  const upper = armLen * S('crew_upper_arm_fraction');
  const fore = armLen - upper;
  const hand = S('crew_hand_length');
  const cuffDepth = dress.cuff ? S('crew_cuff_depth') : 0;
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
    const cuff = new THREE.CylinderGeometry(armT * 0.34, armT * 0.4, fore - hand - cuffDepth, detail ? 12 : 5, 1);
    cuff.translate(0, -(fore - hand - cuffDepth) / 2, 0);
    paint(cuff, dress.coat, lower);
    // The facing at the wrist of an officer's sleeve.
    if (cuffDepth) {
      const ring = new THREE.CylinderGeometry(armT * 0.42, armT * 0.34, cuffDepth, detail ? 12 : 5, 1);
      ring.translate(0, -(fore - hand - cuffDepth) - cuffDepth / 2, 0);
      paint(ring, dress.cuff, lower);
    }
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

  // At the coarse levels of detail a man is one draw call, not five: his arms are baked into
  // his body in the pose they were built in. He can then no longer swing them — the motion
  // layer finds no arms on him and leaves him to sway with the ship — which is not a thing
  // anyone sees at the range the game LOD is for.
  if (bake) {
    group.updateMatrixWorld(true);
    for (const a of arms) {
      a.traverse((o) => {
        if (!o.isMesh) return;
        const g = o.geometry.clone();
        g.applyMatrix4(o.matrixWorld);
        solid.push(g);
      });
      group.remove(a);
    }
  }
  const body = new THREE.Mesh(mergeGeometries(solid), mats.crew);
  body.name = 'body';
  group.add(body);

  group.userData.crew = {
    pose, rank, armLen, shoulderY, height: h, lean: pick.lean, elbow: pick.elbow,
    officer: Boolean(dress.tails),
  };
  return group;
}

export function buildCrew(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'crew';
  if (!cfg.crew) return group;

  const full = cfg.crew === 'full';
  // Rounded limbs and a modelled face only at the level that is willing to pay for them
  // (about 3,000 triangles a man); every other level gets the plain, cheap figure, and the
  // game level bakes his arms into his body so that he is one draw call.
  const detail = cfg.textureSize >= 2048;
  const bake = !full;
  const st = fittingStations();
  const zFore = S('furniture_foremast_z'), zMain = S('furniture_mainmast_z'), zMiz = S('furniture_mizzenmast_z');

  // What the watch is wearing. In heavy weather every man on deck is in tarpaulin over
  // whatever else he has on, and the tarpaulin is what is seen — except the officers,
  // whose coats go on over the top of it and who are known by them.
  const heavy = Boolean(ctx.heavyWeather);
  const hand = heavy ? 'oilskin' : 'seaman';
  // One man in four has a red waistcoat; in a gale it is under his tarpaulin.
  const hands = (i) => (heavy ? 'oilskin' : i % 4 === 1 ? 'seaman_red' : 'seaman');

  // Every man gets a seed of his own, so that no two are the same height or build.
  let seed = 0;

  /**
   * Put a figure on deck. `z` and `x` are ship coordinates, `which` the deck he stands on
   * (deck-level.js), and `facing` the way he looks about the vertical: 0 is aft, PI is
   * forward, +PI/2 is to starboard.
   */
  const place = (name, { z, x = 0, which = 'standing', facing = Math.PI, rank, pose = 'stand', role }) => {
    const f = figure(mats, { seed: seed++, detail, bake, rank, pose });
    f.position.set(x, deckYAt(model, z, which, x), z);
    // Heading first, then the lean of the pose about his own athwartships axis. YXZ
    // order is what makes that read the way it is written: turn him, then tip him.
    f.rotation.order = 'YXZ';
    f.rotation.y = facing;
    f.rotation.x = f.userData.crew.lean;
    f.name = name;
    if (role) f.userData.crew.role = role;
    // Which way is up for this man, before the ship heels: the motion layer leans him
    // off it. Kept here because a figure has to know its own upright to be leaned.
    f.userData.crew.home = { y: f.rotation.y };
    group.add(f);
    return f;
  };
  /** The turn that puts a man facing the rail on a given side. */
  const toRail = (side) => side * Math.PI / 2;
  const half = (z, which = 'standing') => deckHalfBreadth(model, z, which);

  // ------------------------------------------------------------------- the wheel
  // The double wheel has two men to each wheel, standing either side of it and facing the
  // spokes. This is the group that carries the whole scene: they are the tallest thing on
  // the after deck that is not a mast, and everything else on board is measured off them.
  // At game only the after wheel is manned.
  {
    const wheels = full ? [st.wheelAfter, st.wheelForward] : [st.wheelAfter];
    for (const [k, zw] of wheels.entries()) {
      for (const sx of [-1, 1]) {
        place(`helmsman_${k ? 'fore_' : ''}${sx < 0 ? 'port' : 'starboard'}`, {
          z: zw + S('crew_helm_abaft_wheel'), x: sx * S('crew_helm_off_centre'),
          facing: Math.PI, rank: hands(seed), pose: 'helm', role: 'helm',
        });
      }
    }
  }

  // ----------------------------------------------------------------- the officers
  // The officer of the watch by the binnacles, where he can see the compass; the master
  // on the weather side; the captain abaft the mizzen with his pipe and his eye on the
  // sea; and the signal midshipman at the forward end of the quarterdeck.
  {
    place('officer_of_the_watch', {
      z: st.binnacle + S('crew_con_abaft_binnacle'), x: -S('crew_con_off_centre'),
      facing: Math.PI - 0.25, rank: 'officer', pose: 'stand',
    });
    place('captain', {
      z: zMiz - S('crew_captain_forward_of_mizzen'), x: S('crew_captain_off_centre'),
      facing: Math.PI + 0.3, rank: 'captain', pose: 'watch',
    });
    if (full) place('master', {
      z: st.binnacle - S('crew_master_forward_of_binnacle'), x: S('crew_master_off_centre'),
      facing: Math.PI + 0.2, rank: 'officer_red', pose: 'stand',
    });
    place('midshipman', {
      z: st.binnacle - S('crew_midshipman_forward_of_binnacle'), x: -S('crew_midshipman_off_centre'),
      facing: Math.PI, rank: 'midshipman', pose: 'hold',
    });
  }

  // ---------------------------------------------------------------- the braces
  // Hands standing by the braces: the mizzen's at the quarterdeck rail abreast the mast,
  // the main's on the gangways at the break of the quarterdeck. They face the rail where
  // the braces are belayed and haul.
  {
    for (const sx of [-1, 1]) {
      const z = zMain - S('crew_main_brace_forward_of_mainmast');
      const x = sx * (half(z, 'gangway') - S('side_thickness') - S('gangway_width') * 0.5);
      place(`main_brace_hand_${sx < 0 ? 'port' : 'starboard'}`, {
        z, x, which: 'gangway', facing: toRail(sx), rank: hands(seed), pose: sx < 0 ? 'haul' : 'stand',
      });
    }
    if (full) for (const sx of [-1, 1]) {
      const z = zMiz + S('crew_mizzen_brace_abaft_mizzen');
      place(`mizzen_brace_hand_${sx < 0 ? 'port' : 'starboard'}`, {
        z, x: sx * half(z) * S('crew_rail_inset') * 1.3, facing: toRail(sx), rank: hands(seed), pose: sx > 0 ? 'haul' : 'stand',
      });
    }
  }

  // ----------------------------------------------------------- the guns' quarters
  // A crew at two of the quarterdeck guns, one each side: the gun captain behind the
  // breech and a man beside him. They stand clear of the recoil, facing the port.
  if (full) {
    const ports = [...OFFSETS.ports.quarterdeck].sort((a, b) => a.z - b.z);
    for (const [side, key] of [[-1, 'crew_gun_quarters_port_index'], [1, 'crew_gun_quarters_starboard_index']]) {
      const port = ports[Math.min(S(key), ports.length - 1)];
      if (!port) continue;
      const x = side * Math.max(0.8, half(port.z) - S('crew_gun_quarters_inboard'));
      const tag = side < 0 ? 'port' : 'starboard';
      place(`gun_captain_${tag}`, { z: port.z, x, facing: toRail(side), rank: hands(seed), pose: 'hold' });
      place(`gun_loader_${tag}`, {
        z: port.z + S('crew_gun_quarters_loader_abaft'), x, facing: toRail(side), rank: hands(seed), pose: 'haul',
      });
    }
  }

  // ---------------------------------------------------------------- the waist
  // The hands at the chain pumps, which are at the after end of the waist, and the
  // boatswain by the capstan with his eye on all of it.
  {
    if (full) for (const sx of [-1, 1]) {
      const z = zMain - S('chain_pump_forward_of_mainmast');
      place(`pump_hand_${sx < 0 ? 'port' : 'starboard'}`, {
        z: z + 0.5, x: sx * S('crew_pump_hand_off_centre'), which: 'upper', facing: -toRail(sx), rank: hands(seed), pose: 'haul',
      });
    }
    place('bosun', {
      z: st.capstan, x: -S('crew_bosun_off_centre'), which: 'upper', facing: Math.PI, rank: 'bosun', pose: 'stand',
    });
  }

  // ------------------------------------------------------------------ the forecastle
  // The lookouts at the bow, one each side of the stem.
  {
    const z = zFore - S('crew_lookout_forward_of_foremast');
    for (const sx of full ? [-1, 1] : [1]) {
      place(`lookout_${sx < 0 ? 'port' : 'starboard'}`, {
        z, x: sx * S('crew_lookout_off_centre'), facing: Math.PI, rank: hands(seed), pose: 'hold',
      });
    }
  }

  // ---------------------------------------------------------------------- aloft
  // Hands in the main top. It is the one place on the ship where a figure is seen
  // against the sky, which is where the eye goes first, and it is the only way of
  // saying how high the mast is. They are stood from the rig's own geometry, so a
  // rebuilt rig carries them with it; if the rig publishes no main mast they are left out.
  if (full) {
    const mast = ctx.rig?.main ?? ctx.rig?.masts?.find((x) => x.name === 'main');
    if (mast?.along && Number.isFinite(mast.houndsH)) {
      const p = mast.along(mast.houndsH);
      const breadth = mast.topBreadth ?? 4.4;
      const length = mast.topLength ?? breadth;
      const thick = SPEC.top_platform_thickness?.value ?? 0.1;
      const topmen = [[-1, 'hold', 0], [1, 'haul', 0], [0, 'hold', -0.5]];
      for (const [i, [sx, pose, dz]] of topmen.entries()) {
        const f = figure(mats, { pose, rank: hands(seed), seed: seed++, detail, bake });
        // Stand on the forward part of the top, clear of the topsail's belly aft.
        // At the mast centre the moving cloth sliced through their heads and torsos.
        f.position.set(sx * breadth / 2 * Math.min(S('crew_top_inset'), 0.36), p.y + thick,
          p.z - length * 0.22 + dz);
        f.rotation.order = 'YXZ';
        f.rotation.y = Math.PI + (sx || 0.4) * 0.35 * (i % 2 ? -1 : 1);
        f.rotation.x = f.userData.crew.lean;
        f.name = `topman_${sx < 0 ? 'port' : sx > 0 ? 'starboard' : 'centre'}`;
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
