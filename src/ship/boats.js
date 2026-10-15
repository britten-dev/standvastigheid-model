// The ship's boats.
//
// A frigate carried her boats on the booms — the skid beams laid across the waist —
// and in the reference photograph they are the brightest thing on the ship: white
// outside, bright wood inside, sitting high above the rail between the fore and main
// masts. Research file 06 §8.3 reconstructs the outfit as a launch, a pinnace, a cutter
// and a jolly boat, and that is what is built here.
//
// There is one boat, not four. `makeBoat` lofts a little hull from a set of ratios —
// entry, run, transom width, sheer, rocker, section fullness — scaled by a length, a
// beam and a depth, so a 24 ft launch and a 16 ft jolly boat are the same code with
// different numbers. The lofter is `loftSections`, the one the ship's own hull uses.
//
// Everything is sited through `model`: the stow height is measured up from the gundeck
// at the station the boats sit at, and the quarter davits are stepped on the rail curve
// where the spec puts them, so when the offsets change the boats move with the ship.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { loftSections, mergeGeometries } from '../util/loft.js';
import { sweep, spar, ropeCurve, ropeTube } from '../util/solids.js';
import { clamp, lerp } from '../util/math.js';
import { audit } from '../audit/measure.js';

const S = (key) => SPEC[key].value;
const clamp01 = (v) => clamp(v, 0, 1);

/**
 * The lines of a boat, as functions of `t` — 0 at the stem, 1 at the transom.
 *
 * A ship's boat is a very simple shape beside the ship herself: a fine entry, the
 * maximum breadth a little abaft midships, a run aft to a square transom, a sheer that
 * lifts at both ends and lifts more forward, and a keel whose rocker sweeps up into the
 * forefoot. All of those are in the spec as ratios.
 */
function boatLines(P) {
  const mb = S('boat_max_beam_station');
  const entry = S('boat_entry_power');
  const run = S('boat_run_power');
  const transom = S('boat_transom_width_frac');
  const sheerPow = S('boat_sheer_power');
  const rockPow = S('boat_rocker_power');
  const stemHalf = S('boat_stem_siding') / 2;

  // How far forward of, and how far abaft, the station of maximum breadth a point lies.
  const fwd = (t) => clamp01(1 - t / mb);
  const aft = (t) => clamp01((t - mb) / (1 - mb));

  return {
    halfBreadth: (t) => Math.max(
      stemHalf,
      (P.beam / 2) * Math.pow(clamp01(t / mb), entry) * (1 - (1 - transom) * Math.pow(aft(t), run))
    ),
    sheer: (t) => P.depth * (1
      + S('boat_sheer_rise_fwd') * Math.pow(fwd(t), sheerPow)
      + S('boat_sheer_rise_aft') * Math.pow(aft(t), sheerPow)),
    keel: (t) => P.depth * (
      S('boat_rocker_fwd') * Math.pow(fwd(t), rockPow)
      + S('boat_rocker_aft') * Math.pow(aft(t), rockPow)),
  };
}

/**
 * The station sections of a boat, in the form `loftSections` wants them.
 *
 * The section is a superellipse quarter running from the keel on the centreline out and
 * up to the gunwale. Its exponent is what tells a launch from a cutter: a high one gives
 * the flat floor and hard bilge Steel describes for a launch, a low one the rounder
 * section of a pulling boat.
 *
 * `inset` builds the inboard face of the planking from the same rule, so that the boat
 * is a shell with a thickness rather than one surface you can see straight through.
 */
function shellSections(P, lines, ns, np, inset) {
  const e = 2 / P.fullness;
  const sections = [];
  for (let i = 0; i < ns; i++) {
    const t = i / (ns - 1);
    const outer = lines.halfBreadth(t);
    // Never let the inboard face reach the centreline, or the two surfaces coincide at
    // the stem and the shading breaks up along it.
    const half = Math.max(outer - inset, outer * 0.4);
    const yKeel = lines.keel(t) + inset;
    const ySheer = lines.sheer(t);
    const depth = Math.max(ySheer - yKeel, 1e-3);
    const points = [];
    for (let k = 0; k < np; k++) {
      const th = (k / (np - 1)) * Math.PI / 2;
      points.push([
        half * Math.pow(Math.sin(th), e),
        yKeel + depth * (1 - Math.pow(Math.cos(th), e)),
      ]);
    }
    sections.push({ z: (t - 0.5) * P.length, points });
  }
  return sections;
}

/**
 * The transom. The loft leaves the after end of the boat open, so it is closed with a
 * fan from the heel of the sternpost, round the section, and back up the centreline.
 */
function transomCap(section, apexY) {
  const pos = [], uvs = [], idx = [];
  for (const sign of [1, -1]) {
    const base = pos.length / 3;
    const ring = [...section.points.map(([x, y]) => [x * sign, y]), [0, apexY]];
    for (const [x, y] of ring) {
      pos.push(x, y, section.z);
      uvs.push(0.5 + x, y);
    }
    for (let j = 1; j < ring.length - 1; j++) {
      if (sign > 0) idx.push(base, base + j, base + j + 1);
      else idx.push(base, base + j + 1, base + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A flat lid over the gunwale. Only the distant LOD uses it, in place of an interior. */
function blockLid(P, lines, ns) {
  const pos = [], uvs = [], idx = [];
  for (let i = 0; i < ns; i++) {
    const t = i / (ns - 1);
    const z = (t - 0.5) * P.length;
    const x = lines.halfBreadth(t);
    const y = lines.sheer(t);
    pos.push(-x, y, z, x, y, z);
    uvs.push(0, z, 1, z);
  }
  for (let i = 0; i < ns - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** The curve the gunwale follows, for the capping and the washstrake to be swept along. */
function gunwaleCurve(P, lines, side, samples) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    pts.push(new THREE.Vector3(lines.halfBreadth(t) * side, lines.sheer(t), (t - 0.5) * P.length));
  }
  return new THREE.CatmullRomCurve3(pts);
}

/** A box centred on a point. Boxes are all the small joinery in a boat needs. */
function boxAt(w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

/**
 * The thwarts. A boat without them reads as a bathtub; it is the row of cross-benches
 * that makes it a boat, and in the photograph they are the strongest thing you see
 * inside the white hulls on the skids.
 */
function thwarts(P, lines) {
  const geoms = [];
  const count = Math.max(2, Math.round(P.length / S('boat_thwart_spacing')) - 1);
  const plank = S('boat_plank_thickness');
  const w = S('boat_thwart_width');
  const th = S('boat_thwart_thickness');
  const drop = S('boat_thwart_below_gunwale');
  for (let i = 0; i < count; i++) {
    // Spread over the working length of the boat, clear of the stem and the transom.
    const t = lerp(0.24, 0.86, count === 1 ? 0.5 : i / (count - 1));
    const span = (lines.halfBreadth(t) - plank) * 2;
    geoms.push(boxAt(span, th, w, 0, lines.sheer(t) - drop, (t - 0.5) * P.length));
  }
  return geoms;
}

/** An oar: a tapered loom with a flat blade on the end, stowed fore and aft in the boat. */
function oar(cfg) {
  const len = S('boat_oar_length');
  const r = S('boat_oar_diameter') / 2;
  const bladeLen = len * 0.22;
  const loom = spar({
    length: len - bladeLen,
    radiusAt: (t) => lerp(r, r * 0.6, t),
    segments: Math.max(2, Math.round(cfg.sparSegments / 3)),
    radial: Math.max(3, cfg.sparRadial - 4),
  });
  loom.rotateX(Math.PI / 2);
  const blade = boxAt(S('boat_oar_blade_width'), r * 0.7, bladeLen, 0, 0, len - bladeLen / 2);
  return mergeGeometries([loom, blade]);
}

/**
 * One boat, complete, in her own coordinates: `z` along her length with the stem at
 * `-length/2`, `x` from her centreline, `y` measured up from the top of her keel
 * amidships.
 *
 * The geometry is grouped by material, so a boat costs three or four draw calls rather
 * than thirty.
 */
function makeBoat(P, cfg, mats) {
  const lines = boatLines(P);
  const ns = cfg.boatStations;
  const np = cfg.boatPoints;
  const plank = S('boat_plank_thickness');
  const solid = cfg.boats === 'block';

  const white = [];
  const timber = [];
  const cloth = [];
  const gear = [];

  // ---------------------------------------------------------------- the shell
  const outer = shellSections(P, lines, ns, np, 0);
  white.push(loftSections(outer, { mirror: true }));
  white.push(transomCap(outer[ns - 1], lines.sheer(1)));

  if (solid) {
    // At the distant LOD a boat is one shape: a lid instead of an interior.
    timber.push(blockLid(P, lines, ns));
  } else {
    // The inboard face of the planking, bright wood as the photograph shows. Its
    // winding is reversed so that it faces into the boat.
    const inner = loftSections(shellSections(P, lines, ns, np, plank), { mirror: true });
    inner.index.array.reverse();
    inner.computeVertexNormals();
    timber.push(inner);

    // The gunwale capping, and under it the washstrake standing proud of the planking.
    // Both follow the sheer, which is why they are swept and not lofted.
    const steps = Math.max(8, Math.round(ns * 1.5));
    const gw = S('boat_gunwale_width'), gt = S('boat_gunwale_thickness');
    const wh = S('boat_washstrake_height');
    for (const side of [1, -1]) {
      const curve = gunwaleCurve(P, lines, side, steps);
      timber.push(sweep(curve, [[-gw / 2, 0], [gw / 2, 0], [gw / 2, gt], [-gw / 2, gt]],
        { steps, closed: true }));
      white.push(sweep(curve, [[-plank, -wh], [plank, -wh], [plank, 0], [-plank, 0]],
        { steps, closed: true }));
    }

    // The keel, swept along the rocker, and the stem standing at the fore end of it.
    const keelPts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      keelPts.push(new THREE.Vector3(0, lines.keel(t), (t - 0.5) * P.length));
    }
    const ks = S('boat_keel_siding') / 2, km = S('boat_keel_moulding');
    white.push(sweep(new THREE.CatmullRomCurve3(keelPts),
      [[-ks, 0], [ks, 0], [ks, -km], [-ks, -km]], { steps, closed: true }));

    const stemLow = lines.keel(0) - km, stemHigh = lines.sheer(0);
    white.push(boxAt(S('boat_stem_siding'), stemHigh - stemLow, km,
      0, (stemLow + stemHigh) / 2, -P.length / 2 + km * 0.3));

    timber.push(...thwarts(P, lines));
  }

  // ---------------------------------------------------------------- her gear
  // The rudder is kept out of the shell so that the audit measures the boat's length on
  // her own planking and not on her rudder head.
  if (P.rudder && !solid) {
    const rd = S('boat_rudder_depth'), rw = S('boat_rudder_width'), rt = S('boat_rudder_thickness');
    const head = lines.sheer(1);
    gear.push(boxAt(rt, rd, rw, 0, head - rd / 2, P.length / 2 + rw / 2));
    const tl = S('boat_tiller_length');
    timber.push(boxAt(rt, rt, tl, 0, head + rt, P.length / 2 - tl / 2 + rw / 2));
  }

  if (P.gear && cfg.boatGear && !solid) {
    // The oars stowed fore and aft across the thwarts, two boat hooks beside them, and
    // the boat's own mast with her lug sail furled to it.
    const dia = S('boat_oar_diameter');
    const rowY = lines.sheer(0.5) - S('boat_thwart_below_gunwale') + dia;
    const spread = (lines.halfBreadth(0.5) - plank * 3) * 2;
    const count = S('boat_oar_count');
    for (let i = 0; i < count; i++) {
      const g = oar(cfg);
      const u = count === 1 ? 0.5 : i / (count - 1);
      g.translate((u - 0.5) * spread, rowY + (i % 2) * dia * 0.6,
        -P.length * 0.32 + (i % 2) * dia);
      timber.push(g);
    }

    const hookLen = S('boat_hook_length');
    for (let i = 0; i < S('boat_hook_count'); i++) {
      const h = spar({
        length: hookLen,
        radiusAt: () => dia * 0.32,
        segments: 2,
        radial: Math.max(3, cfg.sparRadial - 5),
      });
      h.rotateX(Math.PI / 2);
      h.translate((i - 0.5) * spread * 0.55, rowY + dia, -P.length * 0.1);
      timber.push(h);
    }

    const mastLen = S('boat_mast_length');
    const mastX = spread * 0.3;
    const mastY = rowY + dia * 1.4;
    const mast = spar({
      length: mastLen,
      radiusAt: (t) => lerp(dia * 0.6, dia * 0.34, t),
      segments: Math.max(2, Math.round(cfg.sparSegments / 3)),
      radial: Math.max(4, cfg.sparRadial - 3),
    });
    mast.rotateX(Math.PI / 2);
    mast.translate(mastX, mastY, -mastLen / 2 + P.length * 0.1);
    timber.push(mast);

    const furlR = S('boat_furled_sail_diameter') / 2;
    const furlLen = S('boat_furled_sail_length');
    const furl = spar({
      length: furlLen,
      radiusAt: (t) => furlR * (0.55 + 0.45 * Math.sin(Math.PI * clamp01(t))),
      segments: Math.max(3, Math.round(cfg.sparSegments / 2)),
      radial: Math.max(5, cfg.sparRadial - 2),
    });
    furl.rotateX(Math.PI / 2);
    furl.translate(mastX, mastY + furlR * 0.4, -furlLen / 2 + P.length * 0.08);
    cloth.push(furl);
  }

  const group = new THREE.Group();
  group.name = P.name;
  const add = (geoms, material, suffix) => {
    if (!geoms.length) return null;
    const mesh = new THREE.Mesh(mergeGeometries(geoms), material);
    mesh.name = `${P.name}_${suffix}`;
    group.add(mesh);
    return mesh;
  };
  const shell = add(white, mats.white, 'shell');
  add(timber, mats.timber, 'inboard');
  add(gear, mats.white, 'rudder');
  add(cloth, mats.sail, 'furled_sail');
  return { group, shell, lines };
}

/**
 * The chocks a stowed boat sits in. §8.2: "boat chocks, two per boat, shaped to the
 * boat's bilges". They stand on the skid beams and take her keel clear of them, and
 * because the keel has rockered up by the time it reaches them, each chock is cut to a
 * different height.
 */
function chocks(length, lines, skidY, keelY0) {
  const geoms = [];
  const w = S('boat_chock_width');
  const spread = S('boat_chock_spread');
  const km = S('boat_keel_moulding');
  for (const dt of [-S('boat_chock_station'), S('boat_chock_station')]) {
    const t = 0.5 + dt;
    const top = keelY0 + lines.keel(t) - km;
    const h = Math.max(w * 0.5, top - skidY);
    geoms.push(boxAt(lines.halfBreadth(t) * spread * 2, h, w, 0, skidY + h / 2, (t - 0.5) * length));
  }
  return geoms;
}

export function buildBoats(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'boats';
  if (!cfg.boats) return group;

  const fullLaunch = S('boat_section_fullness_launch');
  const fullPull = S('boat_section_fullness_pulling');
  const solid = cfg.boats === 'block';

  // Where the boats stand. The furniture module owns the skid beams themselves; if it
  // has published the height of their tops the boats sit on that, and if it has not
  // they sit on this module's own reconstruction of the same figure.
  const stowAbove = SPEC.skid_beam_top_above_deck?.value ?? S('boat_stow_height');
  const zStow = model.fromStem(S('boat_stow_station'));
  const skidY = model.featureYAt(zStow).deck + SPEC.deck_camber.value + stowAbove;
  const keelRest = skidY + S('boat_chock_height');
  const stowY = keelRest + S('boat_keel_moulding');

  const chockGeoms = [];
  const gripeGeoms = [];

  /**
   * The gripes: bands of canvas and rope passed over a stowed boat and set up hard to
   * ring bolts in the deck each side of the skids.
   *
   * A boat lies in her chocks under her own weight and nothing else, which is enough in
   * a quiet sea and nothing like enough in this one. Two and a half tons of launch adrift
   * on the booms would go through the bulwark and take the mainmast's rigging with it, so
   * before it comes on to blow she is gripped down. Two bands to a boat, over her gunwales
   * at the quarters of her length.
   */
  const gripe = (boat, length, x) => {
    const w = SPEC.boat_gripe_width.value;
    const t = SPEC.boat_gripe_thickness.value;
    boat.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(boat.group);
    const top = box.max.y, bottom = skidY;
    // Her beam where the gripe crosses her. Taken from the built boat rather than from
    // her offsets, so a gripe fits whichever boat it is passed over.
    const half = (box.max.x - box.min.x) / 2;
    for (const f of [-0.24, 0.24]) {
      const z = zStow + f * length;
      // Over the top of her, and down each side to the deck.
      gripeGeoms.push(boxAt(half * 2.1, t, w, x, top + t / 2, z));
      for (const sx of [-1, 1]) {
        gripeGeoms.push(boxAt(t, top - bottom, w, x + sx * half * 1.05, (top + bottom) / 2, z));
      }
    }
  };

  /** Stow a boat upright on the skids, with her chocks under her. */
  const stow = (boat, length, x) => {
    boat.group.position.set(x, stowY, zStow);
    group.add(boat.group);
    if (ctx.heavyWeather && !solid) gripe(boat, length, x);
    if (solid) return;
    for (const g of chocks(length, boat.lines, skidY, stowY)) {
      g.translate(x, 0, zStow);
      chockGeoms.push(g);
    }
  };

  // ------------------------------------------------------------------ the launch
  const launch = makeBoat({
    name: 'launch',
    length: S('launch_length'), beam: S('launch_beam'), depth: S('launch_depth'),
    fullness: fullLaunch, gear: false, rudder: false,
  }, cfg, mats);
  const launchX = S('launch_stow_offset');
  stow(launch, S('launch_length'), launchX);
  audit(launch.shell, 'launch_length', 'extent_z');

  // ------------------------------------------------------------------ the pinnace
  const pinnace = makeBoat({
    name: 'pinnace',
    length: S('pinnace_length'), beam: S('pinnace_beam'), depth: S('pinnace_depth'),
    // The oars, the boat hooks and the mast with her lug sail furled to it go in the
    // pinnace and not in the launch, because the launch has the cutter nested in her
    // and anything stowed under it would be both invisible and inside the cutter.
    fullness: fullPull, gear: true, rudder: false,
  }, cfg, mats);
  stow(pinnace, S('pinnace_length'), -S('pinnace_stow_offset'));
  audit(pinnace.shell, 'pinnace_length', 'extent_z');

  // ------------------------------------------------------------------ the cutter
  // Nested inside the launch, resting on her thwarts, which is how the smaller boats
  // were carried: "stowed upon the deck, sometimes nested one atop the other".
  const cutter = makeBoat({
    name: 'cutter',
    length: S('cutter_length'), beam: S('cutter_beam'), depth: S('cutter_depth'),
    fullness: fullPull, gear: false, rudder: false,
  }, cfg, mats);
  cutter.group.position.set(launchX, stowY + S('cutter_nest_rise'), zStow + S('cutter_nest_shift'));
  group.add(cutter.group);
  audit(cutter.shell, 'cutter_length', 'extent_z');

  // ------------------------------------------------------------------ the jolly boat
  // §8.4: quarter davits enter the Royal Navy in the 1790s and are defensible for 1798,
  // while transom davits are marginal before 1800. So the boat the photograph carries
  // aft is hung on the quarter here rather than over the taffrail.
  const side = 1;
  const zDavit = model.fromStem(S('davit_station'));
  const half = S('davit_spacing') / 2;
  const out = S('davit_outreach');
  const rise = S('davit_height_above_rail');

  const davitGeoms = [];
  const heads = [];
  for (const z of [zDavit - half, zDavit + half]) {
    const rail = model.pointAt(z, 'rail', side);
    const deckY = model.standingDeckAt(z);
    const head = new THREE.Vector3(rail.x + out * side, rail.y + rise * 0.92, z);
    heads.push(head);
    davitGeoms.push(new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(rail.x * 0.94, deckY, z),
        new THREE.Vector3(rail.x * 0.99, rail.y + rise * 0.55, z),
        new THREE.Vector3(rail.x + out * 0.45 * side, rail.y + rise, z),
        head,
      ]),
      Math.max(6, cfg.sparSegments), S('davit_diameter') / 2,
      Math.max(4, cfg.sparRadial - 3), false
    ));
  }
  const davits = new THREE.Mesh(mergeGeometries(davitGeoms), mats.timber);
  davits.name = 'quarter_davits';
  group.add(davits);

  const jolly = makeBoat({
    name: 'jolly_boat',
    length: S('jolly_length'), beam: S('jolly_beam'), depth: S('jolly_depth'),
    fullness: fullPull, gear: false, rudder: true,
  }, cfg, mats);
  const mid = new THREE.Vector3().addVectors(heads[0], heads[1]).multiplyScalar(0.5);
  jolly.group.position.set(mid.x, mid.y - S('jolly_hang_below_davit') - S('jolly_depth'), mid.z);
  // The rail is curving in toward the stern, so the boat hangs along the rail rather
  // than along the ship's centreline.
  jolly.group.rotation.y = Math.atan2(heads[1].x - heads[0].x, heads[1].z - heads[0].z);
  group.add(jolly.group);
  audit(jolly.shell, 'jolly_length', 'extent_max');

  // The falls: the tackle each davit head carries the boat by.
  if (cfg.boatGear) {
    const falls = [];
    heads.forEach((head, i) => {
      const t = i === 0 ? 0.22 : 0.78;
      const end = new THREE.Vector3(0, jolly.lines.sheer(t), (t - 0.5) * S('jolly_length'))
        .applyEuler(jolly.group.rotation).add(jolly.group.position);
      falls.push(ropeTube(
        ropeCurve(head, end, 0, cfg.ropeSegments),
        S('davit_fall_diameter') / 2,
        { tubular: cfg.ropeSegments, radial: cfg.ropeRadial }
      ));
    });
    const fallMesh = new THREE.Mesh(mergeGeometries(falls), mats.runningRigging);
    fallMesh.name = 'boat_falls';
    group.add(fallMesh);
  }

  if (chockGeoms.length) {
    const ch = new THREE.Mesh(mergeGeometries(chockGeoms), mats.timber);
    ch.name = 'boat_chocks';
    group.add(ch);
  }

  if (gripeGeoms.length) {
    const gr = new THREE.Mesh(mergeGeometries(gripeGeoms), mats.black);
    gr.name = 'boat_gripes';
    group.add(gr);
  }

  group.userData.count = S('boat_count');
  audit(group, 'boat_count', 'count');
  return group;
}
