// The colours: the ensign, the masthead pennant and the jack.
//
// Three ideas hold this module together.
//
// The first is that the canton is *drawn*, not loaded. A Union flag is a construction
// — a cross of one width fimbriated at another, a saltire of a third — and every one of
// those widths is a fraction of the canton's hoist. So the flag is painted on a canvas
// the same way textures.js paints planking, out of numbers that live in the spec, which
// means the pre-1801 Union and the post-1801 Union are the same drawing with one band
// added. The default model is 1798; hosts can select `flagYear: 1805` to include
// St Patrick's saltire for a later scene.
//
// The second is that a flag is a sheet whose only fixed edge is the hoist. Everything
// else — the stream downwind, the sag of heavy wool bunting at the fly, the long slow
// wave along the cloth — is a displacement that grows from nothing at the hoist to its
// full value at the fly. One function makes all three flags, because a commissioning
// pennant is only an ensign that is twenty times longer than it is deep and tapers.
//
// The third is that nothing here knows where the masts are. The rig was built in
// parallel with this module, so the four points the flags hang from — the gaff peak,
// the taffrail staff, the main truck and the jackstaff — are reconstructed in this
// module's own spec and marked for reconciliation. They have since been trued to the
// spars the rig builds, but nothing enforces the agreement, so a change to the rig's
// masting is a change this spec has to follow. Everything else is sited off the hull
// model, so it moves when the hull does.
import * as THREE from 'three';
import { SPEC, PAINT } from '../spec/spec.js';
import { ropeCurve, ropeTube, ropeLines } from '../util/solids.js';
import { mergeGeometries } from '../util/loft.js';
import { lerp } from '../util/math.js';
import { audits } from '../audit/measure.js';
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

/** The ensign: a plain field with the Union in the upper hoist quarter. */
function drawEnsign(hoistPx, fieldKey, post1801) {
  const aspect = S('ensign_fly') / S('ensign_hoist');
  const { c, g } = flagCanvas(hoistPx, aspect);
  g.fillStyle = PAINT[fieldKey].hex;
  g.fillRect(0, 0, c.width, c.height);
  // A white squadron ensign carries St George across the whole field.
  // Colour alone never turns a blue ensign into a white naval ensign.
  if(fieldKey==='ensign_white') {
    const cross=c.height/10;
    g.fillStyle=PAINT.ensign_red.hex;
    g.fillRect(0,(c.height-cross)/2,c.width,cross);
    g.fillRect((c.width-cross)/2,0,cross,c.height);
    drawUnion(g,0,0,(c.width-cross)/2,(c.height-cross)/2,post1801);
  }else drawUnion(g, 0, 0, c.width * S('ensign_canton_fly_frac'), c.height * S('ensign_canton_hoist_frac'), post1801);
  return c;
}

/**
 * The commissioning pennant. Pre-1801 it is St George at the hoist with the squadron's
 * colour in the fly — the single long St George cross of the modern pennant is a
 * post-war standardisation, and would be as wrong here as St Patrick's saltire.
 */
function drawPennant(hoistPx, fieldKey) {
  const aspect = S('pennant_length') / S('pennant_hoist');
  const { c, g } = flagCanvas(hoistPx, aspect);
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

/** The jack: the Union flag alone, at its own 1:2. */
function drawJack(hoistPx, post1801) {
  const aspect = S('jack_fly') / S('jack_hoist');
  const { c, g } = flagCanvas(hoistPx, aspect);
  drawUnion(g, 0, 0, c.width, c.height, post1801);
  return c;
}

const buntingMaps=new Map();
function buntingMaterial(mats, fieldKey, canvasEl, dimensions) {
  const mat=mats.bunting(fieldKey);
  // Fair/heavy weather models share immutable cloth maps. Their geometry and
  // materials stay independent, but changing weather does not double texture memory.
  const key=[fieldKey,canvasEl.width,canvasEl.height,dimensions.fly,dimensions.hoist,
    dimensions.breadths,dimensions.post1801??false].join(':');
  if(!buntingMaps.has(key))buntingMaps.set(key,dressBunting(canvasEl,dimensions));
  Object.assign(mat,buntingMaps.get(key));
  mat.color.set(0xffffff);mat.roughness=1;mat.bumpScale=.0018;
  mat.userData.bunting='sewn-wool-v1';
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

export function buildFlags(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'flags';
  if (!cfg.flags) return group;

  const [segsU, segsV] = cfg.flagSegments;
  const post1801=ctx.flagYear===undefined?S('canton_post_1801')>0:ctx.flagYear>=1801;
  // The squadron colour. The reference photograph shows her wearing blue, which
  // research §6.2 accepts as plausible without documenting it; the red and white
  // ensigns are one word away because a ship wore her admiral's colour, not her own.
  const fieldKey=`ensign_${ctx.ensign??'blue'}`;

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
  // At the peak of the mizen gaff, which is where an ensign belongs at sea and where
  // the reference photograph shows it. The taffrail staff is unshipped when the driver
  // is set, so it is only used if the spec asks for the harbour arrangement.
  let ensignHead;
  if (S('ensign_at_staff') > 0) {
    const zStaff = model.fromStem(S('ensign_staff_from_stem'));
    ensignHead = new THREE.Vector3(0, model.featureYAt(zStaff).rail + S('flag_ensign_staff_height'), zStaff);
  } else {
    // The ensign flies at the peak of the mizzen gaff — the outer, upper end of it. The
    // rig builds that spar and hands its ends over in ctx.spanker, so the flag is hung
    // from the actual peak rather than from a copy of where the peak was expected to be.
    // Hanging it from a copy is what put the ensign inside the driver, showing through
    // the canvas as a blue diamond.
    ensignHead = ctx.spanker
      ? ctx.spanker.gaffEnd.clone().add(new THREE.Vector3(0, 0.15, 0.10))
      : new THREE.Vector3(0, S('ensign_peak_height'), model.fromStem(S('ensign_peak_from_stem')));
  }

  const ensign = new THREE.Mesh(
    flagGeometry({
      dir: stream,
      fly: S('ensign_fly'), hoist: S('ensign_hoist'), tipHoist: S('ensign_hoist'),
      segsU, segsV, phase: S('flag_wave_phase'),
    }),
    buntingMaterial(mats, fieldKey, drawEnsign(cfg.textureSize / 2, fieldKey, post1801),
      {fly:S('ensign_fly'),hoist:S('ensign_hoist'),breadths:8,post1801})
  );
  ensign.name = 'ensign';
  ensign.userData.colours={field:ctx.ensign??'blue',post1801};
  ensign.position.copy(ensignHead);
  // The flag's own origin is the point it is bent to, so this measures the gaff peak
  // itself rather than the bounding box of a piece of cloth blowing about.
  if (S('ensign_at_staff') === 0) audits(ensign, ['ensign_peak_height', 'origin_y']);
  group.add(ensign);

  // The peak halliard: rove through a block at the peak and belayed at the mizen fife
  // rail below. It is the one line that tells the eye the flag is bent to something.
  halliardTo(ensignHead, model.pointAt(model.fromStem(S('ensign_halliard_belay_from_stem')), 'rail', 1));

  // ------------------------------------------------------------------ pennant
  // The commissioning pennant at the main truck, flown day and night while she is in
  // commission. Long enough that it needs its own segment count along the fly.
  if (cfg.flags !== 'ensign') {
    // The commissioning pennant flies at the main truck — the very top of the main
    // topgallant pole. Taken from the rig's own geometry, so that the two cannot
    // disagree about how tall the mast is, which they did by 2.5 m.
    const truck = ctx.rig
      ? ctx.rig.main.along(ctx.rig.main.truckH).add(new THREE.Vector3(0, 0.25, 0))
      : new THREE.Vector3(0, S('pennant_height'), model.fromStem(S('pennant_from_stem')));
    const pennant = new THREE.Mesh(
      flagGeometry({
        dir: stream,
        fly: S('pennant_length'), hoist: S('pennant_hoist'), tipHoist: S('pennant_fly_width'),
        segsU: Math.round(segsU * S('pennant_segment_multiple')), segsV,
        phase: S('flag_wave_phase_pennant'),
      }),
      buntingMaterial(mats, fieldKey, drawPennant(Math.min(96,cfg.textureSize / 8), fieldKey),
        {fly:S('pennant_length'),hoist:S('pennant_hoist'),breadths:3})
    );
    pennant.name = 'pennant';
    pennant.position.copy(truck);
    audits(pennant, ['pennant_height', 'origin_y']);
    pennant.userData.trucked = true;
    group.add(pennant);

    halliardTo(truck, new THREE.Vector3(truck.x, truck.y - S('pennant_halliard_drop'), truck.z));
  }

  // --------------------------------------------------------------------- jack
  // Built, and hidden. A jack is worn at the jackstaff at anchor only, and she is under
  // way with her anchors catted; showing one would be a display convention, not a fact
  // about the ship. Set `jack_worn_under_way` to 1 for the ship at her moorings.
  if (cfg.flags === 'full') {
    const zJack = model.fromStem(S('jack_from_stem'));
    const jackHead = new THREE.Vector3(0, model.featureYAt(zJack).rail + S('flag_jack_staff_height'), zJack);
    const jack = new THREE.Mesh(
      flagGeometry({
        dir: stream,
        fly: S('jack_fly'), hoist: S('jack_hoist'), tipHoist: S('jack_hoist'),
        segsU, segsV, phase: S('flag_wave_phase_jack'),
      }),
      buntingMaterial(mats, fieldKey, drawJack(cfg.textureSize / 2, post1801),
        {fly:S('jack_fly'),hoist:S('jack_hoist'),breadths:4,post1801})
    );
    jack.name = 'jack';
    jack.position.copy(jackHead);
    jack.visible = S('jack_worn_under_way') > 0;
    group.add(jack);

    if (jack.visible) {
      halliardTo(jackHead, new THREE.Vector3(jackHead.x, model.featureYAt(zJack).rail, jackHead.z));
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
