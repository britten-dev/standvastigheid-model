// The colours: the ensign, the masthead pennant and the jack.
//
// She flies one of three things (`buildShip({ ensign })`, research 05): the Dutch
// red-white-blue horizontal tricolour (the default), the British blue ensign with the
// post-1801 Union (her ruse in the book), or the French vertical tricolour. Each comes
// with its own long pennant at the main truck and its own jack.
//
// Three ideas hold this module together.
//
// The first is that the flags are *drawn*, not loaded. A Union flag is a construction
// — a cross of one width fimbriated at another, a saltire of a third — and every one of
// those widths is a fraction of the canton's hoist. So the flag is painted on a canvas
// the same way textures.js paints planking, out of numbers that live in the spec, which
// means the pre-1801 Union and the post-1801 Union are the same drawing with one band
// added. (She is modelled in 1811, so the post-1801 Union is the default for the ruse.)
// A tricolour is three stripes of one canvas.
//
// The second is that a flag is a sheet whose only fixed edge is the hoist. Everything
// else — the stream downwind, the sag of heavy wool bunting at the fly, the long slow
// wave along the cloth — is a displacement that grows from nothing at the hoist to its
// full value at the fly. One function makes all three flags, because a commissioning
// pennant is only an ensign that is twenty times longer than it is deep and tapers.
//
// The third is that nothing here knows where the masts are. The rig is its own module
// and publishes where the spanker gaff ends (`ctx.spanker`) and where the main truck is
// (`ctx.rig`); the ensign and the pennant are hung from those points, and only fall back
// to this module's own spec if the rig has published nothing. Everything else is sited off
// the hull model, so it moves when the hull does.
import * as THREE from 'three';
import { SPEC, PAINT } from '../spec/spec.js';
import { ropeCurve, ropeTube, ropeLines, spar } from '../util/solids.js';
import { mergeGeometries } from '../util/loft.js';
import { lerp } from '../util/math.js';
import {dressBunting,installBuntingLight} from './bunting.js';

const S = (key) => SPEC[key].value;

// ---------------------------------------------------------------- the drawing

/**
 * The Union, drawn into a rectangle of a canvas. Widths are fractions of the
 * rectangle's *hoist*, which is how a bunting-maker set one out: the canton of an
 * ensign is not the 1:2 of a Union flag proper, so the construction is stretched along
 * the fly and everything stays keyed to the hoist.
 *
 * @param {boolean} post1801 add St Patrick's saltire, counterchanged with St Andrew's.
 */
function drawUnion(g, ox, oy, w, h, post1801) {
  const blue = PAINT.ensign_blue.hex;
  const white = PAINT.ensign_white.hex;
  const red = PAINT.ensign_red.hex;

  g.save();
  g.beginPath();
  g.rect(ox, oy, w, h);
  g.clip();

  g.fillStyle = blue;
  g.fillRect(ox, oy, w, h);

  // A diagonal band as a polygon of constant *vertical* thickness. On a canton that is
  // stretched along the fly this is what the eye reads as a saltire arm of even width,
  // and it is how the arms were actually cut and sewn.
  const band = (down, halfThickness, colour, half) => {
    const y0 = down ? oy : oy + h;             // at the hoist
    const y1 = down ? oy + h : oy;             // at the fly
    // `half` is -1 for the hoist half of the arm, +1 for the fly half, 0 for the whole.
    if (half !== 0) {
      g.save();
      g.beginPath();
      g.rect(half < 0 ? ox : ox + w / 2, oy, w / 2, h);
      g.clip();
    }
    g.fillStyle = colour;
    g.beginPath();
    g.moveTo(ox, y0 - halfThickness);
    g.lineTo(ox + w, y1 - halfThickness);
    g.lineTo(ox + w, y1 + halfThickness);
    g.lineTo(ox, y0 + halfThickness);
    g.closePath();
    g.fill();
    if (half !== 0) g.restore();
  };

  // St Andrew: the whole diagonal band, white.
  const saltireHalf = (h * S('union_saltire_width_frac')) / 2;
  band(true, saltireHalf, white, 0);
  band(false, saltireHalf, white, 0);

  if (post1801) {
    // St Patrick, counterchanged. The rule that decides the offsets is the one every
    // seaman knew: in the arm nearest the top of the hoist, the broad white band is
    // *above* the red. Each diagonal therefore carries its red offset one way in the
    // hoist half and the other way in the fly half, and the two diagonals are opposite
    // to each other so the pattern turns about the centre.
    const patrickHalf = (h * S('union_patrick_frac')) / 2;
    const off = h * S('union_patrick_offset_frac');
    const shifted = (down, half, sign) => {
      g.save();
      g.translate(0, sign * off);
      band(down, patrickHalf, red, half);
      g.restore();
    };
    // Top-hoist arm belongs to the diagonal that runs down from the hoist: red below.
    shifted(true, -1, +1);
    shifted(true, +1, -1);
    // Bottom-hoist arm belongs to the diagonal that runs up from the hoist: red above.
    shifted(false, -1, -1);
    shifted(false, +1, +1);
  }

  // St George over the top, fimbriated white.
  const cw = h * S('union_cross_width_frac');
  const fw = h * S('union_fimbriation_frac');
  const cross = (thickness, colour) => {
    g.fillStyle = colour;
    g.fillRect(ox, oy + h / 2 - thickness / 2, w, thickness);
    g.fillRect(ox + w / 2 - thickness / 2, oy, thickness, h);
  };
  cross(cw + 2 * fw, white);
  cross(cw, red);

  g.restore();
}

/** A canvas, sized to the flag's own proportion so the drawing is never squashed. */
function flagCanvas(hoistPx, aspect) {
  const c = document.createElement('canvas');
  c.height = Math.max(8, Math.round(hoistPx));
  c.width = Math.max(8, Math.round(hoistPx * aspect));
  return { c, g: c.getContext('2d',{willReadFrequently:true}) };
}

// ---------------------------------------------------------------- the colours

/** The tricolour's three stripes, in order from the top (horizontal) or the hoist (vertical). */
const TRICOLOUR = {
  // The Dutch: red over white over blue.
  dutch: { direction: 'horizontal', stripes: ['ensign_red', 'ensign_white', 'ensign_tricolour_blue'] },
  // The French: blue at the hoist, then white, then red at the fly.
  french: { direction: 'vertical', stripes: ['ensign_tricolour_blue', 'ensign_white', 'ensign_red'] },
};

/** Fill a canvas with a tricolour, horizontal or vertical. */
function drawTricolour(g, w, h, { direction, stripes }) {
  stripes.forEach((key, i) => {
    g.fillStyle = PAINT[key].hex;
    if (direction === 'horizontal') {
      const y0 = Math.round((i * h) / stripes.length), y1 = Math.round(((i + 1) * h) / stripes.length);
      g.fillRect(0, y0, w, y1 - y0);
    } else {
      const x0 = Math.round((i * w) / stripes.length), x1 = Math.round(((i + 1) * w) / stripes.length);
      g.fillRect(x0, 0, x1 - x0, h);
    }
  });
}

/**
 * The ensign. 'dutch' and 'french' are plain tricolours; the British squadron colours
 * ('blue', 'white', 'red') are a field with the Union in the upper hoist quarter.
 */
function drawEnsign(hoistPx, kind, post1801) {
  const fly = kind === 'dutch' ? S('ensign_fly_dutch') : kind === 'french' ? S('ensign_fly_french') : S('ensign_fly');
  const { c, g } = flagCanvas(hoistPx, fly / S('ensign_hoist'));
  if (TRICOLOUR[kind]) {
    drawTricolour(g, c.width, c.height, TRICOLOUR[kind]);
    return c;
  }
  const fieldKey = `ensign_${kind}`;
  g.fillStyle = PAINT[fieldKey].hex;
  g.fillRect(0, 0, c.width, c.height);
  // A white squadron ensign carries St George across the whole field.
  // Colour alone never turns a blue ensign into a white naval ensign.
  if (kind === 'white') {
    const cross = c.height / 10;
    g.fillStyle = PAINT.ensign_red.hex;
    g.fillRect(0, (c.height - cross) / 2, c.width, cross);
    g.fillRect((c.width - cross) / 2, 0, cross, c.height);
    drawUnion(g, 0, 0, (c.width - cross) / 2, (c.height - cross) / 2, post1801);
  } else drawUnion(g, 0, 0, c.width * S('ensign_canton_fly_frac'), c.height * S('ensign_canton_hoist_frac'), post1801);
  return c;
}

/**
 * The commissioning pennant. The Dutch is three stripes the whole length, red over white
 * over blue, tapering with the cloth; the French is blue at the hoist, white, then red,
 * in thirds along its length. The British (the ruse) is St George at the hoist with the
 * squadron's colour in the fly — pre-1801 and post-1801 alike, the single long St George
 * cross of the modern pennant is a post-war standardisation.
 */
function drawPennant(hoistPx, kind) {
  const aspect = S('pennant_length') / S('pennant_hoist');
  const { c, g } = flagCanvas(hoistPx, aspect);
  if (TRICOLOUR[kind]) {
    drawTricolour(g, c.width, c.height, TRICOLOUR[kind]);
    return c;
  }
  const fieldKey = `ensign_${kind}`;
  g.fillStyle = PAINT[fieldKey].hex;
  g.fillRect(0, 0, c.width, c.height);

  const georgeW = c.height * S('pennant_george_frac');
  g.fillStyle = PAINT.ensign_white.hex;
  g.fillRect(0, 0, georgeW, c.height);
  const cw = c.height * S('union_cross_width_frac');
  g.fillStyle = PAINT.ensign_red.hex;
  g.fillRect(0, c.height / 2 - cw / 2, georgeW, cw);
  g.fillRect(georgeW / 2 - cw / 2, 0, cw, c.height);
  return c;
}

/** The jack: a small tricolour for the Dutch and French, the Union for the ruse. */
function drawJack(hoistPx, kind, post1801) {
  if (TRICOLOUR[kind]) {
    const { c, g } = flagCanvas(hoistPx, S('jack_fly_tricolour') / S('jack_hoist'));
    drawTricolour(g, c.width, c.height, TRICOLOUR[kind]);
    return c;
  }
  const aspect = S('jack_fly') / S('jack_hoist');
  const { c, g } = flagCanvas(hoistPx, aspect);
  drawUnion(g, 0, 0, c.width, c.height, post1801);
  return c;
}

const buntingMaps = new Map();
function buntingMaterial(mats, mapKey, canvasEl, dimensions) {
  // The material's own colour is overwritten with white below, because the cloth map
  // carries the colour; any bunting key will do for the base.
  const mat = mats.bunting('ensign_white');
  // Fair/heavy weather models share immutable cloth maps. Their geometry and
  // materials stay independent, but changing weather does not double texture memory.
  const key = [mapKey, canvasEl.width, canvasEl.height, dimensions.fly, dimensions.hoist,
    dimensions.breadths, dimensions.post1801 ?? false].join(':');
  if (!buntingMaps.has(key)) buntingMaps.set(key, dressBunting(canvasEl, dimensions));
  Object.assign(mat, buntingMaps.get(key));
  mat.color.set(0xffffff); mat.roughness = 1; mat.bumpScale = .0018;
  mat.userData.bunting = 'sewn-wool-v1';
  installBuntingLight(mat);
  return mat;
}

// ------------------------------------------------------------------ the cloth

/**
 * One flag, as a sheet hanging by its hoist and streaming to leeward.
 *
 * The geometry is built about the head of the hoist, and the mesh is then placed at
 * the point the flag is bent to, so that the object's own origin is the peak, the truck
 * or the staff head and the audit can measure it directly. The cloth runs `fly` metres
 * along `dir` and `hoist` metres straight down. Three displacements are added on top of
 * that, each of them zero at the hoist because that edge is bent to the halliard and
 * cannot move: the sag of the fly under the weight of wet wool, the long wave running
 * down the cloth, and the shortening that the wave itself takes up.
 */
function flagGeometry(params) {
  const g = new THREE.BufferGeometry();
  // The parameters travel with the geometry, because a flag is the one part of this ship
  // that is rebuilt after it is built: `poseFlag` re-evaluates this same surface at a
  // later phase every frame, and it needs to know what the flag is.
  g.userData.flag = { ...params };
  const { segsU, segsV } = params;
  const pos = new Float32Array((segsU + 1) * (segsV + 1) * 3);
  const uvs = new Float32Array((segsU + 1) * (segsV + 1) * 2);
  const idx = [];
  const w = segsV + 1;
  for (let i = 0; i < segsU; i++) {
    for (let j = 0; j < segsV; j++) {
      const a = i * w + j, b = a + 1, c = a + w, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  for (let i = 0; i <= segsU; i++) {
    for (let j = 0; j <= segsV; j++) {
      const k = i * w + j;
      // The canvas is drawn hoist-left, head-up; canvas V runs the other way from UV V.
      uvs[k * 2] = i / segsU;
      uvs[k * 2 + 1] = 1 - j / segsV;
    }
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setIndex(idx);
  poseFlag(g, params.phase);
  return g;
}

/**
 * Write the flag's surface into its own position attribute at a given phase of the wave.
 *
 * This is the whole of a flying flag. The wave that used to be frozen into the geometry
 * at build time is the same wave; all that changes at runtime is the phase, and running
 * the phase forward is what makes the ensign fly instead of standing out to leeward like
 * a piece of sheet metal.
 *
 * It is done on the processor and not in a shader on purpose. A flag is a hundred and
 * fifty vertices, three of them fly on this ship, and the exact surface is worth more
 * than the microsecond: a shader approximation of this would have to guess at the sag and
 * the shortening, and both of them are what make a flag read as cloth.
 */
export function poseFlag(geometry, phase, { direction, wind = 1, gravity } = {}) {
  const { dir, fly, hoist, tipHoist, segsU, segsV } = geometry.userData.flag;
  const ef = (direction ?? dir).clone().normalize();
  const eh = new THREE.Vector3(0, -1, 0);
  const down = (gravity ?? eh).clone().normalize();
  const en = new THREE.Vector3().crossVectors(ef, down);
  if (en.lengthSq() < 1e-6) en.crossVectors(ef, new THREE.Vector3(1, 0, 0));
  en.normalize();

  const strength = Math.max(0, Math.min(1.6, wind));
  const tension = strength * strength / (strength * strength + 0.16 * 0.16);
  const reach = 0.03 + 0.97 * tension;
  const droop = S('flag_droop_frac') / (0.65 + strength * 0.65);
  // A long pennant bends along its length as well as rippling across its width.
  // Hoist-only amplitude made it look like a rigid strip from astern.
  const amp = S('flag_wave_amplitude_frac') * Math.max(hoist, fly * 0.16)
    * (0.04 + 0.96 * Math.min(1.2, strength));
  const k = (Math.PI * 2) / (S('flag_wave_length_frac') * fly);
  const skew = S('flag_wave_skew');
  const slack = S('flag_stream_slack');
  const grow = S('flag_wave_growth_exponent');
  const harm = S('flag_wave_harmonic');

  const pos = geometry.attributes.position;
  const w = segsV + 1;
  const p = new THREE.Vector3();
  for (let i = 0; i <= segsU; i++) {
    const u = i / segsU;
    const along = u * fly * (1 - slack * u);
    const width = lerp(hoist, tipHoist, u);
    // A tapered flag narrows about its own mid-hoist, not about its head.
    const inset = (hoist - width) / 2;
    const swell = Math.pow(u, grow);
    for (let j = 0; j <= segsV; j++) {
      const v = j / segsV;
      const lift = amp * swell * 0.72
        * Math.sin(k * along - phase * 0.87 + v * 0.6);
      // The hoist stays attached to the ship. The free cloth hangs toward
      // world-down in a lull and stretches along the apparent wind under load.
      const fall = (1 - reach) * along + tension * droop * fly * u * u + lift;
      const wave = amp * swell * (
        Math.sin(k * along + skew * v * Math.PI * 2 - phase)
        + harm * Math.sin(2 * k * along - phase * 1.7)
      );
      p.set(0, 0, 0)
        .addScaledVector(ef, along * reach)
        .addScaledVector(eh, inset + v * width)
        .addScaledVector(down, fall)
        .addScaledVector(en, wave);
      pos.setXYZ(i * w + j, p.x, p.y, p.z);
    }
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

// -------------------------------------------------------------------- the build

/**
 * Where the main truck is, from whatever the rig publishes. The rig is its own module and
 * is rebuilt on its own schedule, so this asks it in the two shapes it has published —
 * `ctx.rig.main` with an `along(h)` and a `truckH`, or a `ctx.rig.masts` list of the same —
 * and only if neither is there falls back to this module's own reconstruction.
 */
function mainTruck(ctx, model) {
  const mast = ctx.rig?.main ?? ctx.rig?.masts?.find((x) => x.name === 'main');
  if (mast?.truck?.isVector3) return mast.truck.clone();
  if (mast?.along && Number.isFinite(mast.truckH)) return mast.along(mast.truckH);
  return new THREE.Vector3(0, S('pennant_fallback_height'), model.fromStem(S('pennant_fallback_from_stem')));
}

/** Where the spanker gaff peak is, from `ctx.spanker`, else from this module's reconstruction. */
function gaffPeak(ctx, model) {
  if (ctx.spanker?.gaffEnd) return ctx.spanker.gaffEnd.clone();
  return new THREE.Vector3(0, S('ensign_peak_fallback_height'), model.fromStem(S('ensign_peak_fallback_from_stem')));
}

export function buildFlags(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'flags';
  if (!cfg.flags) return group;

  const [segsU, segsV] = cfg.flagSegments;
  const post1801 = ctx.flagYear === undefined ? S('canton_post_1801') > 0 : ctx.flagYear >= 1801;
  // What she flies: 'dutch' (the default), 'french', or a British squadron colour — 'blue'
  // for the ruse, and 'white' or 'red' for the others.
  const kind = ctx.ensign ?? 'dutch';
  // A tricolour has no Union in it; the post-1801 Union matters only to the British flags.
  const britishUnion = !TRICOLOUR[kind];
  const ensignFly = kind === 'dutch' ? S('ensign_fly_dutch') : kind === 'french' ? S('ensign_fly_french') : S('ensign_fly');
  const jackFly = TRICOLOUR[kind] ? S('jack_fly_tricolour') : S('jack_fly');

  // Where the wind is. Bearing is measured from dead ahead, turning to starboard; the
  // cloth streams the opposite way, which for a wind on the starboard bow is aft and
  // to port — the same tack the sails are drawing on.
  const bearing = (S('flag_wind_bearing_deg') * Math.PI) / 180;
  const stream = new THREE.Vector3(-Math.sin(bearing), 0, Math.cos(bearing)).normalize();

  const halliards = [];
  const halliardTo = (from, to) => {
    halliards.push(ropeCurve(from, to, S('flag_halliard_sag'), cfg.ropeSegments));
  };

  // ------------------------------------------------------------------- ensign
  // At the peak of the spanker gaff, which is where an ensign belongs at sea. The taffrail
  // staff is unshipped when the driver is set, so it is only used if the spec asks for the
  // harbour arrangement.
  let ensignHead;
  if (S('ensign_at_staff') > 0) {
    const zStaff = model.zAft - S('ensign_staff_forward_of_sternpost');
    ensignHead = new THREE.Vector3(0, model.featureYAt(zStaff).rail + S('flag_ensign_staff_height'), zStaff);
  } else {
    // The rig builds the gaff and hands its ends over in ctx.spanker, so the flag is hung
    // from the actual peak rather than from a copy of where the peak was expected to be.
    // Hanging it from a copy is what put the ensign inside the driver, showing through
    // the canvas as a blue diamond.
    ensignHead = gaffPeak(ctx, model).add(new THREE.Vector3(0, 0.15, 0.10));
  }

  const ensign = new THREE.Mesh(
    flagGeometry({
      dir: stream,
      fly: ensignFly, hoist: S('ensign_hoist'), tipHoist: S('ensign_hoist'),
      segsU, segsV, phase: S('flag_wave_phase'),
    }),
    buntingMaterial(mats, `ensign:${kind}`, drawEnsign(cfg.textureSize / 2, kind, post1801),
      { fly: ensignFly, hoist: S('ensign_hoist'), breadths: 12, post1801: britishUnion && post1801 })
  );
  ensign.name = 'ensign';
  ensign.userData.colours = { field: kind, post1801: britishUnion && post1801 };
  ensign.position.copy(ensignHead);
  group.add(ensign);

  // The peak halliard: rove through a block at the peak and belayed at the mizzen fife
  // rail below. It is the one line that tells the eye the flag is bent to something.
  const belayZ = S('furniture_mizzenmast_z') + S('ensign_halliard_belay_abaft_mizzen');
  halliardTo(ensignHead, model.pointAt(belayZ, 'rail', 1));

  // ------------------------------------------------------------------ pennant
  // The commissioning pennant at the main truck, flown day and night while she is in
  // commission. Long enough that it needs its own segment count along the fly.
  if (cfg.flags !== 'ensign') {
    // The commissioning pennant flies at the main truck — the very top of the main
    // topgallant pole. Taken from the rig's own geometry, so that the two cannot
    // disagree about how tall the mast is.
    const truck = mainTruck(ctx, model).add(new THREE.Vector3(0, 0.25, 0));
    const pennant = new THREE.Mesh(
      flagGeometry({
        dir: stream,
        fly: S('pennant_length'), hoist: S('pennant_hoist'), tipHoist: S('pennant_fly_width'),
        segsU: Math.round(segsU * S('pennant_segment_multiple')), segsV,
        phase: S('flag_wave_phase_pennant'),
      }),
      buntingMaterial(mats, `pennant:${kind}`, drawPennant(Math.min(96, cfg.textureSize / 8), kind),
        { fly: S('pennant_length'), hoist: S('pennant_hoist'), breadths: 3 })
    );
    pennant.name = 'pennant';
    pennant.position.copy(truck);
    pennant.userData.trucked = true;
    group.add(pennant);

    halliardTo(truck, new THREE.Vector3(truck.x, truck.y - S('pennant_halliard_drop'), truck.z));
  }

  // --------------------------------------------------------------------- jack
  // The jack on its staff at the stemhead: a small tricolour for the Dutch and French, the
  // Union for the ruse. It is shown by default; `jack_worn_under_way` 0 builds it hidden, and
  // a host can set `visible` either way.
  // (Every level but the distant one, which keeps only the ensign.)
  if (cfg.flags !== 'ensign') {
    const zJack = model.fromStem(S('jack_from_stem'));
    const base = model.featureYAt(zJack).rail;
    const jackHead = new THREE.Vector3(0, base + S('flag_jack_staff_height'), zJack);
    const jack = new THREE.Mesh(
      flagGeometry({
        dir: stream,
        fly: jackFly, hoist: S('jack_hoist'), tipHoist: S('jack_hoist'),
        segsU, segsV, phase: S('flag_wave_phase_jack'),
      }),
      buntingMaterial(mats, `jack:${kind}`, drawJack(cfg.textureSize / 2, kind, post1801),
        { fly: jackFly, hoist: S('jack_hoist'), breadths: 4, post1801: britishUnion && post1801 })
    );
    jack.name = 'jack';
    jack.position.copy(jackHead);
    jack.visible = S('jack_worn_under_way') > 0;
    group.add(jack);

    // The jack staff itself: a thin spar from the rail to the flag's head.
    const staffLen = jackHead.y - base;
    const staff = new THREE.Mesh(
      spar({
        length: staffLen, radiusAt: (t) => (S('flag_jack_staff_diameter') / 2) * (1 - 0.35 * t),
        segments: 2, radial: Math.max(4, cfg.sparRadial - 3),
      }),
      mats.mastBlack
    );
    staff.position.set(0, base, zJack);
    staff.name = 'jack_staff';
    group.add(staff);

    if (jack.visible) {
      halliardTo(jackHead, new THREE.Vector3(jackHead.x, base, jackHead.z));
    }
  }

  // ---------------------------------------------------------------- halliards
  if (cfg.flagHalliards && halliards.length) {
    const r = S('flag_halliard_diameter') / 2;
    if (cfg.ropesAsTubes) {
      const tubes = halliards.map((c) => ropeTube(c, r, { tubular: cfg.ropeSegments, radial: cfg.ropeRadial }));
      const rope = new THREE.Mesh(mergeGeometries(tubes), mats.runningRigging);
      rope.name = 'flag_halliards';
      rope.userData.count = halliards.length;
      group.add(rope);
    } else {
      const lines = new THREE.LineSegments(ropeLines(halliards, cfg.ropeSegments), mats.ropeLine);
      lines.name = 'flag_halliards';
      group.add(lines);
    }
  }

  return group;
}
