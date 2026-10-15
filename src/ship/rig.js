// The rig. Masts, spars, standing and running rigging, for a 74.
//
// The whole rig is built from one idea: `mastGeometry()` works out, once, where every
// spar and every attachment point in the ship is, in world space. Everything after that
// — the shrouds, the ratlines, the stays, the braces, the sails — is drawn between
// points that object hands out. Nothing measures anything twice, so nothing can
// disagree with anything else.
//
// A mast rakes aft, so it is not a vertical line. Each mast has its own local frame:
// the origin at the step on the keelson, +Y up the mast, rotated aft about X by the
// rake. Heights along a mast are therefore distances up that leaning line, and the
// world position of a point on it comes from `alongMast()`.
//
// THE RIG IS NESTED THE WAY IT IS FITTED, so that any part of it can be shot away:
//
//   rig
//   ├ fore                          lower mast, masthead and cap, top, lower shrouds, stays
//   │ │                             and ratlines, the course yard with its sail and ropes
//   │ └ fore_topmast_assembly       topmast, crosstrees, topmast shrouds, backstays and stays,
//   │   │                           topsail yard with its sail and ropes
//   │   └ fore_topgallant_assembly  the pole topgallant, its rigging, its yard and sail
//   ├ main, mizzen                  the same; the mizzen also carries the spanker, boom and gaff
//   └ bowsprit_assembly             bowsprit, jib-boom, spritsail yard, the headsails
//
// Every group is the identity transform: the spars keep the world positions they were
// built at, so the groups are only a record of what stands on what. The same record, with
// the dependencies that cross assemblies (a jib is set on a stay from the fore topmast and
// on the jib-boom), is `ship.userData.rigParts`; src/ship/damage.js reads it.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { spar } from '../util/solids.js';
import { mergeGeometries } from '../util/loft.js';
import { deg, lerp, clamp } from '../util/math.js';
import { audit, audits } from '../audit/measure.js';
import { buildSails } from './sails.js';
import { channelAnchors, mastStation } from './channels.js';
import { mastWooldings, yardBindings, woodenLeadBlock } from './rig-detail.js';
import { sparMaterials, sparUV } from './spar-finish.js';
import { mastConstruction, yardFurniture } from './spar-details.js';
import { buildMastTop, mastTopAnchor } from './mast-tops.js';
import { ropeMaterials } from './rope-finish.js';
import { createRigRegistry } from './damage.js';
import { RopeSet, RunningSet, RatlineSet } from './rig-ropes.js';

const S = (k) => SPEC[k].value;
const MASTS = ['fore', 'main', 'mizzen'];

/**
 * Steel's fractional taper table, for "yards in general" and for standing masts.
 * Multiply the tabulated maximum diameter by these to get the diameter at each quarter
 * from the partners (masts) or the slings (yards).
 */
const TAPER = {
  mast: [1, 60 / 61, 14 / 15, 6 / 7, 3 / 4, 2 / 3],
  topmast: [1, 60 / 61, 14 / 15, 6 / 7, 9 / 13, 6 / 11],
  yard: [1, 30 / 31, 7 / 8, 7 / 10, 3 / 7],
  bowsprit: [1, 60 / 61, 11 / 12, 4 / 5, 5 / 9],
};

/** Sample a taper table at fraction `t` along the spar. */
function taperAt(table, t) {
  const n = table.length - 1;
  const x = clamp(t, 0, 1) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return lerp(table[i], table[i + 1], x - i);
}

/** A yard tapers from the slings at its middle out to both arms. */
const yardRadius = (maxDia) => (t) => (maxDia / 2) * taperAt(TAPER.yard, Math.abs(t - 0.5) * 2);

/**
 * Where everything is. Call once; everything else reads from the result.
 */
export function mastGeometry(model) {
  function mast(name) {
    const { z0, rake, stepY, along } = mastStation(model, name);

    const lower = S(`${name}_mast_length`);
    const head = S(`${name}_mast_head`);
    // The trestletrees, and therefore the top, sit at the foot of the lower masthead.
    const houndsH = lower - head;
    // The topmast is fidded on the trestletrees and overlaps the lower mast by exactly
    // the length of the lower masthead.
    const topmastHeel = houndsH;
    const topmast = S(`${name}_topmast_length`);
    const topmastHead = S(`${name}_topmast_head`);
    const topmastHoundsH = topmastHeel + topmast - topmastHead;
    // The topgallant is a pole: one spar from the crosstrees to the truck, with a small
    // shoulder at the hounds. Its tabulated length is the whole spar, so the working part
    // below the hounds is what is left after the head above them.
    const tgHeel = topmastHoundsH;
    const tg = S(`${name}_topgallant_length`);
    const tgHead = S(`${name}_topgallant_head`);
    const tgStop = tg - tgHead;
    const truckH = tgHeel + tg;
    // The topgallant stay is set up on the pole above the yard, where the shoulder is, and
    // not below it, where it would lead through the sail.
    const tgStayH = tgHeel + tgStop + tgHead * S('topgallant_stay_above_hounds');

    // How far up the mast the deck is. Everything that lands on deck — a stay's foot, a
    // staysail's clew, the heel of the spanker boom — has to be expressed against this
    // rather than against a fraction of the mast's length, because a mast is stepped on
    // the keelson and a fraction of its length lands somewhere in the hold.
    const f = model.featureYAt(z0);
    const deckY = f.deck;
    const railY = f.rail;
    const deckH = (deckY - stepY) / Math.cos(rake);
    const railH = (railY - stepY) / Math.cos(rake);
    /** A height up the mast, as a fraction of the run from the deck to the hounds. */
    const above = (k) => deckH + (houndsH - deckH) * k;

    const topBreadth = S(`${name}_top_breadth`);
    const topLength = topBreadth * S('top_length_ratio');
    const crossWidth = topmast * S('crosstrees_width_fraction');

    return {
      name, z0, rake, along, deckH, railH, above, deckY, railY,
      stepY,
      lowerLength: lower, lowerHead: head, lowerDia: S(`${name}_mast_diameter`),
      houndsH, capH: lower,
      topmastHeel, topmastLength: topmast, topmastHead, topmastDia: S(`${name}_topmast_diameter`),
      topmastHoundsH, topmastCapH: topmastHeel + topmast,
      tgHeel, tgLength: tg, tgDia: S(`${name}_topgallant_diameter`), poleLength: tgHead, tgStop,
      truckH, tgStayH,
      topBreadth, topLength, topCorner: Math.min(topBreadth, topLength) * S('top_corner_radius_ratio'),
      crossWidth, crossLength: crossWidth * S('crosstrees_length_ratio'),
      // The heights the yards hang at. A course yard hangs just below the top; a
      // topsail yard just below the topmast crosstrees; a topgallant yard just under the
      // shoulder of the pole.
      yardH: {
        lower: houndsH - S('lower_yard_below_hounds'),
        topsail: topmastHoundsH - S('topsail_yard_below_hounds'),
        topgallant: tgHeel + tgStop - S('topgallant_yard_below_hounds'),
      },
    };
  }

  const [fore, main, mizzen] = MASTS.map(mast);

  // The bowsprit. Its heel steps on the beam next before the foremast and it rises over
  // the stem head at its steeve; the jibboom runs out beyond it. The head module builds
  // the knightheads and the partners about the same line, from its own heel position, so
  // the rig takes that position when the head has one.
  const steeve = deg(S('bowsprit_steeve_deg'));
  const heelFromStem = SPEC.bowsprit_heel_from_stem?.value;
  const zHeel = heelFromStem !== undefined ? model.fromStem(heelFromStem) : fore.z0 + S('bowsprit_heel_abaft_foremast');
  const heelAbove = SPEC.bowsprit_heel_above_gundeck?.value ?? S('bowsprit_diameter') / 2;
  const bowspritHeel = new THREE.Vector3(0, model.featureYAt(zHeel).deck + heelAbove, zHeel);
  const bowspritDir = new THREE.Vector3(0, Math.sin(steeve), -Math.cos(steeve));
  const bowspritCap = bowspritHeel.clone().addScaledVector(bowspritDir, S('bowsprit_length'));
  const jibboomOut = S('jibboom_length') * (1 - S('jibboom_housing_fraction'));
  const jibboomEnd = bowspritCap.clone().addScaledVector(bowspritDir, jibboomOut);

  return {
    masts: [fore, main, mizzen], fore, main, mizzen,
    bowsprit: {
      heel: bowspritHeel, dir: bowspritDir, cap: bowspritCap, end: jibboomEnd,
      length: S('bowsprit_length'), steeve,
      at: (d) => bowspritHeel.clone().addScaledVector(bowspritDir, d),
    },
  };
}

/** The lower mast, masthead and cap, top, topmast, crosstrees and the pole topgallant for one mast. */
function buildMast(m, cfg, mats, g, reg) {
  const seg = cfg.sparSegments;
  const radial = cfg.sparRadial;
  const finish = sparMaterials(cfg);

  const stick = (length, maxDia, radiusAt, heelH, material) => {
    const geometry = spar({ length, radiusAt, segments: seg, radial });
    sparUV(geometry, length, maxDia);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(m.along(heelH));
    mesh.rotation.x = m.rake;
    return mesh;
  };
  const radii = (maxDia, table) => (t) => (maxDia / 2) * taperAt(table, t);

  // Lower masts were left bright — varnished, not painted — with the mastheads black.
  const lowerRadius = radii(m.lowerDia, TAPER.mast);
  const lower = stick(m.lowerLength, m.lowerDia, lowerRadius, 0, finish.bright);
  lower.name = `${m.name}_lower_mast`;
  lower.add(mastWooldings(m, cfg, mats, (t) => lowerRadius(t)));
  lower.add(mastConstruction(m, cfg, mats, (t) => lowerRadius(t)));
  audits(lower, [`${m.name}_mast_rake_deg`, 'rake_deg']);
  audit(lower, `${m.name}_mast_length`, 'extent_max', { self: true });
  g.lower.add(lower);

  // The masthead above the hounds, blacked, and the cap over it, through which the
  // topmast passes: a plain block, as the Dutch fitted them. One mesh for both.
  const headGeometry = new THREE.BoxGeometry(m.lowerDia * 0.82, m.lowerHead, m.lowerDia * 0.82);
  headGeometry.rotateX(m.rake);
  headGeometry.translate(...m.along(m.houndsH + m.lowerHead / 2).toArray());
  const capGeometry = new THREE.BoxGeometry(m.lowerDia * S('cap_breadth_ratio'), m.lowerDia * 0.45, m.lowerDia * 1.05);
  capGeometry.translate(0, m.along(m.capH).y, m.along(m.capH).z);
  const masthead = new THREE.Mesh(mergeGeometries([headGeometry, capGeometry]), mats.mastBlack);
  masthead.name = `${m.name}_masthead`;
  g.lower.add(masthead);

  // The top: the platform on the trestletrees at the lower masthead.
  const t = S('top_platform_thickness');
  const top = buildMastTop(m, t, cfg, mats, S(`${m.name}_topmast_shroud_pairs`));
  if (m.name === 'main') audit(top, 'main_top_breadth', 'extent_x');
  g.lower.add(top);

  const topmast = stick(m.topmastLength, m.topmastDia, radii(m.topmastDia, TAPER.topmast), m.topmastHeel, finish.bright);
  topmast.name = `${m.name}_topmast`;
  audit(topmast, `${m.name}_topmast_length`, 'extent_max', { self: true });
  g.topmast.add(topmast);

  // Topmast crosstrees are an open timber frame with no platform: the Dutch fitted them
  // light. The old solid box filled the spaces between the beams, and its outer corners
  // poked through braced canvas.
  const beams = [];
  const crossDepth = t * 1.4;
  for (const side of [-1, 1]) {
    beams.push(new THREE.BoxGeometry(m.crossWidth, crossDepth, m.crossLength * .11)
      .translate(0, 0, side * m.crossLength * .29));
    beams.push(new THREE.BoxGeometry(m.crossWidth * .09, crossDepth, m.crossLength)
      .translate(side * m.crossWidth * .15, 0, 0));
  }
  const cross = new THREE.Mesh(mergeGeometries(beams), mats.mastBlack);
  cross.name = `${m.name}_topmast_crosstrees`;
  const cp = m.along(m.topmastHoundsH);
  cross.position.set(0, cp.y, cp.z);
  g.topmast.add(cross);

  // The pole topgallant: a long spar tapering to a point above a small shoulder at the
  // hounds, where the yard stops. No royal mast above it.
  const stopAt = m.tgStop / m.tgLength;
  const base = radii(m.tgDia, TAPER.topmast);
  const shoulder = S('topgallant_shoulder_fraction'), tip = S('topgallant_pole_tip_ratio');
  const poleRadius = (u) => {
    if (u <= stopAt) return base(u) * (u > stopAt - shoulder ? S('topgallant_shoulder_ratio') : 1);
    return base(stopAt) * (1 - (1 - tip) * (u - stopAt) / (1 - stopAt));
  };
  const tg = stick(m.tgLength, m.tgDia, poleRadius, m.tgHeel, finish.bright);
  tg.name = `${m.name}_topgallant`;
  audit(tg, `${m.name}_topgallant_length`, 'extent_max', { self: true });
  g.tg.add(tg);

  // The record of what each stands on.
  reg.part(`${m.name}_lower_mast`, { kind: 'mast', mast: m.name, object: lower.name,
    objects: [masthead.name, top.name], attachments: m.name === 'main' ? ['topman_port', 'topman_starboard'] : [] });
  reg.part(`${m.name}_topmast`, { kind: 'topmast', mast: m.name, object: g.topmast.name, needs: [`${m.name}_lower_mast`] });
  reg.part(`${m.name}_topgallant`, { kind: 'topgallant', mast: m.name, object: g.tg.name, needs: [`${m.name}_topmast`],
    attachments: m.name === 'main' ? ['pennant'] : [] });
}

/** One yard, hung across a mast at a given height, braced round by `braceDeg`. */
function buildYard(m, heightH, length, maxDia, braceDeg, cfg, mats, parent, name, auditKey, tier) {
  const g = spar({
    length,
    radiusAt: yardRadius(maxDia),
    segments: Math.max(4, cfg.sparSegments),
    radial: cfg.sparRadial,
  });
  // The spar helper builds along +Y from the origin; a yard lies athwartships, so it is
  // laid down onto the X axis and then swung to the brace angle.
  sparUV(g, length, maxDia);
  g.translate(0, -length / 2, 0);
  g.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(g, sparMaterials(cfg).black);
  const p = m.along(heightH);
  const mastDia = tier === 'lower' ? m.lowerDia : tier === 'topsail' ? m.topmastDia : m.tgDia;
  const clearance = mastDia * .5 + maxDia * .5 + .24;
  mesh.userData.yardPivot = { mast: p.toArray(), clearance };
  p.x -= Math.sin(deg(braceDeg)) * clearance;
  p.z -= Math.cos(deg(braceDeg)) * clearance;
  mesh.position.copy(p);
  mesh.rotation.y = deg(braceDeg);
  mesh.name = name;
  mesh.add(yardBindings(length, maxDia, cfg, mats));
  mesh.add(yardFurniture(length, maxDia, tier, cfg, mats, yardRadius(maxDia)));
  // `self`, because this yard will have its sail bent to it: sails.js hangs each square
  // sail on its own yard so that bracing the yard brings its canvas round. Measured over
  // its descendants instead, a yard is as long as the sail hanging from it.
  if (auditKey) audit(mesh, auditKey, 'extent_horizontal', { self: true });
  parent.add(mesh);
  return mesh;
}

/** The two ends of a yard, in world space, after bracing. */
function yardArms(p, length, braceDeg) {
  const a = deg(braceDeg);
  const half = length / 2;
  const dx = Math.cos(a) * half, dz = Math.sin(a) * half;
  return [
    new THREE.Vector3(p.x + dx, p.y, p.z - dz),
    new THREE.Vector3(p.x - dx, p.y, p.z + dz),
  ];
}

export function buildRig(cfg, mats, model, ctx) {
  mats = { ...mats, ...ropeMaterials(cfg) };
  const group = new THREE.Group();
  group.name = 'rig';
  const geo = mastGeometry(model);
  ctx.rig = geo;
  const reg = createRigRegistry();

  // The reference photograph shows her with the wind on the quarter and the yards
  // braced up a little; square yards look wrong dead square unless she is running.
  const BRACE = ctx.sails === 'storm' ? 22 : 12;

  // ---------------------------------------------------------------- the assemblies
  const G = {};
  for (const m of geo.masts) {
    const lower = new THREE.Group(); lower.name = m.name;
    const topmast = new THREE.Group(); topmast.name = `${m.name}_topmast_assembly`;
    const tg = new THREE.Group(); tg.name = `${m.name}_topgallant_assembly`;
    lower.add(topmast); topmast.add(tg); group.add(lower);
    G[m.name] = { lower, topmast, tg };
  }
  const bowGroup = new THREE.Group(); bowGroup.name = 'bowsprit_assembly'; group.add(bowGroup);
  /** The group that holds the spars of one tier of one mast. */
  const tierGroup = (m, tier) => G[m.name][tier === 'lower' ? 'lower' : tier === 'topsail' ? 'topmast' : 'tg'];
  /** The part a tier's spar is fitted to. */
  const tierPart = (m, tier) => `${m.name}_${tier === 'lower' ? 'lower_mast' : tier === 'topsail' ? 'topmast' : 'topgallant'}`;

  for (const m of geo.masts) buildMast(m, cfg, mats, G[m.name], reg);

  // ------------------------------------------------------------------- the bowsprit
  const bs = geo.bowsprit;
  const bsG = spar({
    length: bs.length,
    radiusAt: (t) => (S('bowsprit_diameter') / 2) * taperAt(TAPER.bowsprit, t),
    segments: cfg.sparSegments, radial: cfg.sparRadial,
  });
  sparUV(bsG, bs.length, S('bowsprit_diameter'));
  const bsMesh = new THREE.Mesh(bsG, sparMaterials(cfg).bright);
  bsMesh.position.copy(bs.heel);
  bsMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bs.dir);
  bsMesh.name = 'bowsprit';
  audit(bsMesh, 'bowsprit_steeve_deg', 'steeve_deg');
  audit(bsMesh, 'bowsprit_length', 'extent_caliper');
  bowGroup.add(bsMesh);

  const jbLen = bs.end.distanceTo(bs.cap);
  const jbGeometry = spar({
    length: jbLen,
    radiusAt: (t) => (S('jibboom_diameter') / 2) * taperAt(TAPER.bowsprit, t * 0.8),
    segments: Math.max(3, cfg.sparSegments - 2), radial: cfg.sparRadial,
  });
  sparUV(jbGeometry, jbLen, S('jibboom_diameter'));
  const jb = new THREE.Mesh(jbGeometry, sparMaterials(cfg).bright);
  jb.position.copy(bs.cap);
  jb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bs.dir);
  jb.name = 'jibboom';
  bowGroup.add(jb);

  // The spritsail yard, across the bowsprit.
  const syLength = S('spritsail_yard_length'), syDia = S('spritsail_yard_diameter');
  const syGeometry = spar({
    length: syLength,
    radiusAt: yardRadius(syDia),
    // Length-wise taper steps, from the level like every other spar's. Hard-coded at
    // five, this one spritsail yard stayed coarse while the rest of the rig refined.
    segments: Math.max(4, cfg.sparSegments), radial: cfg.sparRadial,
  });
  sparUV(syGeometry, syLength, syDia);
  syGeometry.translate(0, -syLength / 2, 0);
  syGeometry.rotateZ(Math.PI / 2);
  const sy = new THREE.Mesh(syGeometry, sparMaterials(cfg).black);
  sy.add(yardFurniture(syLength, syDia, 'lower', cfg, mats, yardRadius(syDia)));
  sy.position.copy(bs.at(bs.length * 0.62));
  sy.name = 'spritsail_yard';
  bowGroup.add(sy);

  // ---------------------------------------------------------------------- the yards
  const YARDS = [
    ['fore', 'lower', 'fore_yard'],
    ['fore', 'topsail', 'fore_topsail_yard'],
    ['fore', 'topgallant', 'fore_topgallant_yard'],
    ['main', 'lower', 'main_yard'],
    ['main', 'topsail', 'main_topsail_yard'],
    ['main', 'topgallant', 'main_topgallant_yard'],
    ['mizzen', 'lower', 'crossjack_yard'],
    ['mizzen', 'topsail', 'mizzen_topsail_yard'],
    ['mizzen', 'topgallant', 'mizzen_topgallant_yard'],
  ];
  const AUDITED = new Set(['main_yard', 'main_topsail_yard', 'main_topgallant_yard', 'fore_yard', 'fore_topsail_yard', 'fore_topgallant_yard', 'crossjack_yard']);
  const yards = {};
  for (const [mastName, tier, name] of YARDS) {
    const m = geo[mastName];
    const h = m.yardH[tier];
    const length = S(`${name}_length`), diameter = S(`${name}_diameter`);
    const mesh = buildYard(m, h, length, diameter, BRACE, cfg, mats, tierGroup(m, tier), name,
      AUDITED.has(name) ? `${name}_length` : null, tier);
    yards[name] = {
      mast: m, tier, h, length, diameter,
      arms: yardArms(mesh.position, length, BRACE),
      centre: mesh.position.clone(),
      // The angle she is braced to as built, and the node that carries it. A sail is
      // hung on this node rather than merged into the ship, so that bracing the yard
      // brings its canvas round with it — see the head of src/ship/sails.js.
      brace: deg(BRACE),
      node: mesh,
    };
    reg.part(name, { kind: 'yard', mast: mastName, needs: [tierPart(m, tier)] });
  }
  ctx.yards = yards;

  // ------------------------------------------------------------ the spanker boom and gaff
  const miz = geo.mizzen;
  // The spanker boom is slung from the mizzen a little above the rail, and cocks up
  // slightly toward its outer end so that it clears the taffrail.
  const boomDir = new THREE.Vector3(0, 0.09, 1).normalize();
  const boomRoot = miz.along(miz.railH + 0.6);
  const boomGeometry = spar({
    length: S('spanker_boom_length'),
    radiusAt: (t) => (S('spanker_boom_diameter') / 2) * taperAt([1, 40 / 41, 11 / 12, 5 / 6, 2 / 3], t),
    segments: cfg.sparSegments, radial: cfg.sparRadial,
  });
  sparUV(boomGeometry, S('spanker_boom_length'), S('spanker_boom_diameter'));
  const boom = new THREE.Mesh(boomGeometry, sparMaterials(cfg).black);
  boom.position.copy(boomRoot);
  boom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), boomDir);
  boom.name = 'spanker_boom';
  audit(boom, 'spanker_boom_length', 'extent_horizontal');
  G.mizzen.lower.add(boom);

  const gaffRoot = miz.along(miz.above(0.52));
  const gaffDir = new THREE.Vector3(0, Math.sin(deg(S('spanker_gaff_peak_deg'))), Math.cos(deg(S('spanker_gaff_peak_deg'))));
  const gaffGeometry = spar({
    length: S('spanker_gaff_length'),
    radiusAt: (t) => (S('spanker_gaff_diameter') / 2) * taperAt([1, 40 / 41, 11 / 12, 4 / 5, 5 / 9], t),
    segments: cfg.sparSegments, radial: cfg.sparRadial,
  });
  sparUV(gaffGeometry, S('spanker_gaff_length'), S('spanker_gaff_diameter'));
  const gaff = new THREE.Mesh(gaffGeometry, sparMaterials(cfg).black);
  gaff.position.copy(gaffRoot);
  gaff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), gaffDir);
  gaff.name = 'spanker_gaff';
  G.mizzen.lower.add(gaff);
  ctx.spanker = {
    boomRoot, boomEnd: boomRoot.clone().addScaledVector(boomDir, S('spanker_boom_length')),
    gaffRoot, gaffEnd: gaffRoot.clone().addScaledVector(gaffDir, S('spanker_gaff_length')),
  };

  reg.part('bowsprit', { kind: 'bowsprit', mast: 'bowsprit', object: 'bowsprit', objects: ['dolphin_striker'] });
  reg.part('jibboom', { kind: 'jibboom', mast: 'bowsprit', needs: ['bowsprit'] });
  reg.part('spritsail_yard', { kind: 'yard', mast: 'bowsprit', needs: ['bowsprit'] });
  reg.part('spanker_gaff', { kind: 'gaff', mast: 'mizzen', needs: ['mizzen_lower_mast'], attachments: ['ensign'] });
  reg.part('spanker_boom', { kind: 'boom', mast: 'mizzen', needs: ['mizzen_lower_mast'] });

  // ------------------------------------------------------------------ standing rigging
  const env = { reg, G, bowGroup, mats, place: null };
  const place = (set, parent) => {
    const object = set.build(mats);
    if (!object) return;
    parent.add(object);
    reg.rope(object.name, object.userData.needs);
  };
  env.place = place;
  buildStandingRigging(cfg, mats, model, geo, ctx, env);

  // Braces stop at the standing rigging. Test the actual shroud paths at the
  // yard's height, with room for the spar and cloth head below it. This is done
  // once at construction, not as a per-frame collision search.
  for (const y of Object.values(yards)) {
    const pivot = y.node.userData.yardPivot, at = new THREE.Vector3();
    // The foremast's long stay to the jibboom also bounds the drawing cloth
    // between yards. Its conservative envelope is checked through every furl.
    const requestedLimit = Math.min(S('motion_brace_max_deg'), y.mast.name === 'fore' ? 45 : Infinity);
    let limit = requestedLimit;
    for (let degrees = 0; degrees <= requestedLimit; degrees += .5) {
      const a = deg(degrees), s = Math.sin(a), c = Math.cos(a);
      let blocked = false;
      for (const { curve, radius, mast, set } of ctx.shroudPaths) {
        if (mast !== y.mast.name) continue;
        const first = curve.getPoint(0), last = curve.getPoint(1);
        if (first.y < y.centre.y || last.y > y.centre.y - .12) continue;
        // The spar and its bent-on cloth head. Below this the pressure shape
        // moves forward; treating it as a rigid plane would over-limit bracing.
        for (const below of [0, .12]) {
          const height = y.centre.y - below; if (height > first.y || height < last.y) continue;
          at.copy(pointOnShroudAtHeight({ curve }, height));
          if (Math.abs(at.x) > y.length * .5) continue;
          const ahead = (at.z - pivot.mast[2]) * c - Math.abs(at.x) * s + pivot.clearance;
          if (ahead < y.diameter * .5 + radius + .04) { blocked = `${set} at (${at.x.toFixed(2)}, ${at.y.toFixed(1)}, ${at.z.toFixed(2)}) ahead ${ahead.toFixed(2)} need ${(y.diameter * .5 + radius + .04).toFixed(2)} yardz ${pivot.mast[2].toFixed(2)}`; break; }
        }
        if (blocked) break;
      }
      if (blocked) { limit = Math.max(0, degrees - 1); y.node.userData.braceBlockedBy = blocked; break; }
    }
    y.node.userData.braceLimit = deg(limit);
  }
  delete ctx.shroudPaths;

  // --------------------------------------------------------------------- the sails
  const tally = buildSails(cfg, mats, model, ctx, geo, yards, { reg, G, bowGroup, spritsail: sy });
  for (const object of tally) group.add(object);

  // ------------------------------------------------------------------ running rigging
  if (cfg.runningRigging !== 'none') {
    group.updateMatrixWorld(true);
    buildRunningRigging(cfg, mats, model, geo, yards, group, env, tierGroup, tierPart);
  }

  group.userData.rigParts = reg.finish();
  return group;
}

/**
 * Shrouds, ratlines, stays and backstays, each in the batch of the assembly it belongs to.
 *
 * The shrouds are the thing most worth getting right: they are what the eye reads as
 * "rigged". They run from the masthead down to the channel, spreading as they go, and
 * the ratlines are the ladder rungs across them at thirteen inches.
 */
function buildStandingRigging(cfg, mats, model, geo, ctx, env) {
  const { G, bowGroup, place } = env;
  const r = S('shroud_diameter') / 2;
  const shroudPaths = ctx.shroudPaths = [];

  // One batch for each tier of each mast: what belongs to the lower mast, to the topmast
  // and to the pole. The stays are kept apart from the shrouds because a stay leads to
  // another mast, and when that mast goes the stay goes with it but the shrouds do not.
  const R = {};
  for (const m of geo.masts) {
    const n = m.name;
    R[n] = {
      shrouds: new RopeSet(cfg, `${n}_lower_shrouds`, [`${n}_lower_mast`], { mast: n, record: shroudPaths }),
      stays: new RopeSet(cfg, `${n}_lower_stays`, [`${n}_lower_mast`]),
      ratlines: new RatlineSet(`${n}_lower_ratlines`, [`${n}_lower_mast`]),
      topShrouds: new RopeSet(cfg, `${n}_topmast_shrouds`, [`${n}_topmast`], { mast: n, record: shroudPaths }),
      topStays: new RopeSet(cfg, `${n}_topmast_stays`, [`${n}_topmast`]),
      topRatlines: new RatlineSet(`${n}_topmast_ratlines`, [`${n}_topmast`]),
      tg: new RopeSet(cfg, `${n}_topgallant_rigging`, [`${n}_topgallant`], { mast: n, record: shroudPaths }),
    };
  }

  // Where every shroud and backstay is set up. These come from the channels module, so
  // that a shroud ends exactly at the top of its own deadeye instead of at a point the
  // rig guessed at.
  const anchors = channelAnchors(model, cfg);

  for (const m of geo.masts) {
    const name = m.name, a = anchors[name], P = R[name];
    const n = Math.min(S(`${name}_lower_shroud_pairs`), a.shrouds.length);

    for (const side of [1, -1]) {
      const shrouds = [];
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1);
        // The masthead end: the shrouds go over the head in pairs and are all seized
        // within the length of the head, so they start close together.
        const top = m.along(m.houndsH + m.lowerHead * (0.25 + 0.5 * t));
        top.x += side * m.lowerDia * 0.48;
        const e = a.shrouds[i];
        const foot = new THREE.Vector3(e.x * side, e.y, e.z);
        shrouds.push({ top, foot, curve: P.shrouds.add(top, foot, 0.006, r) });
      }

      // Steel pp.158–159: the stave is as far below the trestles as the cap
      // is above them. Sample the hanging shroud, not an imaginary straight line.
      const staveY = m.along(m.houndsH).y - m.lowerHead;
      if (cfg.ratlines) rattle(shrouds, P.ratlines.curves, cfg, { inset: true, ceiling: staveY });
      const stave = shrouds.map((s) => pointOnShroudAtHeight(s, staveY));
      for (let i = 0; i < stave.length - 1; i++) P.shrouds.add(stave[i], stave[i + 1], 0, .026);
      const futtockN = S(`${name}_futtock_shroud_pairs`), tmN = S(`${name}_topmast_shroud_pairs`);
      const futtocks = [];
      for (let i = 0; i < futtockN; i++) {
        const t = futtockN === 1 ? .5 : i / (futtockN - 1);
        const plate = mastTopAnchor(m, side, Math.round(t * (tmN - 1)), tmN, S('top_platform_thickness'));
        const idx = Math.min(shrouds.length - 1, Math.round(t * (shrouds.length - 1)));
        const top = plate.futtock, foot = stave[idx];
        futtocks.push({ top, foot, curve: P.shrouds.add(top, foot, 0, r * .8) });
      }
      if (cfg.ratlines) rattle(futtocks, P.ratlines.curves, cfg, { inset: false });

      // Every shroud terminates at the seized neck of a visible deadeye pair.
      const topmastShrouds = [];
      for (let i = 0; i < tmN; i++) {
        const t = tmN === 1 ? 0 : i / (tmN - 1);
        const top = m.along(m.topmastHoundsH + 0.2 + 0.3 * t);
        top.x += side * m.topmastDia * 0.45;
        const foot = mastTopAnchor(m, side, i, tmN, S('top_platform_thickness')).shroud;
        topmastShrouds.push({ top, foot, curve: P.topShrouds.add(top, foot, 0.005, r * 0.66) });
      }
      // "The topmast-shrouds are rattled in the same manner" — Steel. Without these the
      // upper rigging is bare and a man could not go aloft past the top.
      if (cfg.ratlines) rattle(topmastShrouds, P.topRatlines.curves, cfg, { inset: false });

      // Standing backstays, from the topmast and topgallant heads down to the after end
      // of the same channel, each to its own deadeye.
      a.topmastBackstays.forEach((e) => {
        const top = m.along(m.topmastHoundsH + 0.1);
        top.x += side * m.topmastDia * 0.5;
        P.topShrouds.add(top, new THREE.Vector3(e.x * side, e.y, e.z), 0.004, r * 0.8);
      });
      a.topgallantBackstays.forEach((e) => {
        const top = m.along(m.tgHeel + m.tgStop - 0.2);
        top.x += side * m.tgDia * 0.5;
        P.tg.add(top, new THREE.Vector3(e.x * side, e.y, e.z), 0.003, r * 0.6);
      });

      // Topgallant shrouds, from the topgallant hounds down to the topmast crosstrees.
      const tgN = S(`${name}_topgallant_shroud_pairs`);
      for (let i = 0; i < tgN; i++) {
        const t = tgN === 1 ? 0 : i / (tgN - 1);
        const top = m.along(m.tgHeel + m.tgStop - 0.35 + 0.2 * t);
        top.x += side * m.tgDia * 0.45;
        const cross = m.along(m.topmastHoundsH);
        P.tg.add(top, new THREE.Vector3(
          side * (m.crossWidth / 2) * 0.85,
          cross.y,
          cross.z + lerp(-0.3, 0.4, t)
        ), 0.004, r * 0.5);
      }
    }
  }

  // ------------------------------------------------------------------------- stays
  // Every stay runs forward and down from its masthead: the mizzen to the main, the
  // main to the foremast and the deck, the fore to the bowsprit. The part a stay leads to
  // is named, because it is made fast to it.
  const sr = S('stay_diameter') / 2;
  const deckAt = (z) => model.standingDeckAt(z) + 0.25;
  const { fore, main, mizzen: miz, bowsprit: bs } = geo;

  // Each lower mast has a stay and, beside it, a preventer stay: a second rope of nearly
  // the same size, so that the loss of one in action does not bring the mast down. Steel
  // lists both for the fore and the main.
  R.fore.stays.add(fore.along(fore.capH - .12), bs.at(bs.length * 0.55), 0.012, sr, 'bowsprit');
  R.fore.stays.add(fore.along(fore.capH - .30), bs.at(bs.length * 0.50), 0.012, sr * 0.85, 'bowsprit');
  // Fore topmast stay, out to the jibboom.
  R.fore.topStays.add(fore.along(fore.topmastCapH - .12), bs.end.clone().lerp(bs.cap, 0.25), 0.008, sr * 0.6, 'jibboom');
  R.fore.tg.stay(fore.along(fore.tgStayH), bs.end, 0.006, sr * 0.45, 'jibboom');

  const mainStayFoot = new THREE.Vector3(0, deckAt(fore.z0 + 1.2), fore.z0 + 1.2);
  R.main.stays.add(main.along(main.capH - .12), mainStayFoot, 0.012, sr);
  // The main preventer stay, set up a little abaft the main stay's collar.
  R.main.stays.add(main.along(main.capH - .30),
    new THREE.Vector3(0, deckAt(fore.z0 + 2.4) + 0.2, fore.z0 + 2.4), 0.012, sr * 0.85);
  R.main.topStays.add(main.along(main.topmastCapH - .12), fore.along(fore.capH - .3), 0.008, sr * 0.6, 'fore_lower_mast');
  R.main.tg.stay(main.along(main.tgStayH), fore.along(fore.topmastHoundsH), 0.006, sr * 0.45, 'fore_topmast');

  R.mizzen.stays.add(miz.along(miz.capH - .12), main.along(main.above(0.30)), 0.010, sr * 0.75, 'main_lower_mast');
  R.mizzen.topStays.add(miz.along(miz.topmastCapH - .12), main.along(main.capH - .3), 0.008, sr * 0.55, 'main_lower_mast');
  // Mizzen topgallant stay, forward to the main topmast head.
  R.mizzen.tg.stay(miz.along(miz.tgStayH), main.along(main.topmastHoundsH), 0.006, sr * 0.4, 'main_topmast');

  for (const m of geo.masts) {
    const P = R[m.name];
    place(P.shrouds, G[m.name].lower);
    place(P.stays, G[m.name].lower);
    place(P.ratlines, G[m.name].lower);
    place(P.topShrouds, G[m.name].topmast);
    place(P.topStays, G[m.name].topmast);
    place(P.topRatlines, G[m.name].topmast);
    place(P.tg, G[m.name].tg);
  }

  // ----------------------------------------------------------- the bowsprit's own rigging
  // Bobstays and bowsprit shrouds, holding the bowsprit down and sideways against the
  // pull of every headsail and the fore topmast stay.
  const B = new RopeSet(cfg, 'bowsprit_standing_rigging', ['bowsprit']);
  const stemZ = model.zFwd;
  for (let i = 0; i < S('bobstay_pairs'); i++) {
    const t = 0.42 + 0.2 * i;
    const foot = new THREE.Vector3(0, 0, stemZ + 0.5 + i * 0.35);
    foot.y = lerp(model.featureYAt(foot.z).rabbet + 0.4, model.featureYAt(foot.z).wale_top, 0.35 + 0.3 * i);
    B.add(bs.at(bs.length * t), foot, 0.004, sr * 0.7);
  }
  for (const side of [1, -1]) {
    const fy = model.featureYAt(stemZ + 2.2);
    B.add(bs.at(bs.length * 0.72),
      new THREE.Vector3(side * model.halfBreadthAt(stemZ + 2.2, fy.wale_top), fy.wale_top, stemZ + 2.2),
      0.004, sr * 0.55);
  }

  // The dolphin striker: a short spar hanging straight down from the bowsprit cap, with
  // the martingale stays led over its heel. It is what holds the jibboom down against the
  // pull of the jib and the fore topgallant stay, and without it the whole head of the
  // ship looks unsupported.
  const strikerTop = bs.cap.clone();
  const strikerLen = S('dolphin_striker_length');
  const strikerHeel = strikerTop.clone();
  strikerHeel.y -= strikerLen * Math.cos(deg(S('dolphin_striker_rake_deg')));
  strikerHeel.z += strikerLen * Math.sin(deg(S('dolphin_striker_rake_deg')));
  const strikerGeometry = spar({
    length: strikerLen,
    radiusAt: (t) => (S('dolphin_striker_diameter') / 2) * (1 - 0.35 * t),
    segments: Math.max(2, cfg.sparSegments - 4), radial: cfg.sparRadial,
  });
  sparUV(strikerGeometry, strikerLen, S('dolphin_striker_diameter'));
  const strikerSpar = new THREE.Mesh(strikerGeometry, sparMaterials(cfg).black);
  strikerSpar.position.copy(strikerHeel);
  strikerSpar.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    strikerTop.clone().sub(strikerHeel).normalize()
  );
  strikerSpar.name = 'dolphin_striker';
  audit(strikerSpar, 'dolphin_striker_length', 'extent_caliper');
  bowGroup.add(strikerSpar);

  // The martingale stay: from the jibboom end down to the striker's heel, and on to the
  // bows on both sides. It is made fast to the jibboom, so it is a batch of its own.
  const M = new RopeSet(cfg, 'bowsprit_martingale', ['bowsprit', 'jibboom']);
  M.add(bs.end, strikerHeel, 0.003, sr * 0.5);
  for (const side of [1, -1]) {
    const by = model.featureYAt(stemZ + 1.0);
    M.add(strikerHeel, new THREE.Vector3(
      side * model.halfBreadthAt(stemZ + 1.0, by.wale_top), by.wale_top, stemZ + 1.0
    ), 0.003, sr * 0.45);
  }

  // The gammoning: the lashing that binds the bowsprit down to the stem head. Seven or
  // eight turns through the gammoning slot and over the spar.
  const turns = cfg.gammoning ? S('gammoning_turns') : 0;
  const gStem = new THREE.Vector3(0, model.standingDeckAt(stemZ + 0.4) - 0.2, stemZ + 0.4);
  for (let i = 0; i < turns; i++) {
    const t = 0.10 + (i / Math.max(1, turns - 1)) * 0.10;
    const onSpar = bs.at(bs.length * t);
    for (const side of [1, -1]) {
      const a2 = onSpar.clone(); a2.x += side * S('bowsprit_diameter') * 0.45;
      const b2 = gStem.clone(); b2.x += side * 0.10; b2.z += i * 0.04;
      B.add(a2, b2, 0.002, sr * 0.35);
    }
  }
  place(B, bowGroup);
  place(M, bowGroup);
}

/**
 * Rattle a set of shrouds: horizontal ratlines across them at thirteen inches.
 *
 * Steel: "The fore and aftermost shroud are left out for the first six ratlings down from
 * the futtock-staff; and likewise the six lower ratlines next the dead eyes." That is
 * what `inset` does, and it is why a real ship's ratlines narrow at the top and bottom of
 * the shrouds instead of running square across like a ladder.
 */
function rattle(shrouds, out, cfg, { inset = true, ceiling = Infinity } = {}) {
  if (shrouds.length < 2) return;
  const spacing = S('ratline_spacing') * cfg.ratlineEvery;
  const topY = Math.min(shrouds[0].top.y - 0.35, ceiling - S('ratline_spacing'));
  const botY = shrouds[0].foot.y + 0.4;
  const count = Math.max(0, Math.floor((topY - botY) / spacing));
  for (let k = 0; k < count; k++) {
    const y = botY + k * spacing;
    const fromTop = count - 1 - k;
    const skip = inset && (fromTop < 6 || k < 6) ? 1 : 0;
    const first = skip, last = shrouds.length - 1 - skip;
    if (last <= first) continue;
    const pts = [];
    for (let i = first; i <= last; i++) {
      pts.push(pointOnShroudAtHeight(shrouds[i], y));
    }
    for (let i = 0; i < pts.length - 1; i++) {
      out.push(new THREE.CatmullRomCurve3([pts[i], pts[i + 1]]));
    }
  }
}

/** Intersection with the actual rope curve, including its sag. */
function pointOnShroudAtHeight(shroud, y) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) { const t = (lo + hi) / 2; if (shroud.curve.getPoint(t).y > y) lo = t; else hi = t; }
  return shroud.curve.getPoint((lo + hi) / 2);
}

/**
 * The running rigging that shows at model scale: the braces that swing the yards, the
 * lifts that hold the yardarms up, and the sheets. Each yard has its own batch, made fast
 * to the yard, to the mast its lifts go to and to the mast its braces lead to; the sheets
 * of the sail it carries are a batch of their own, made fast to the yard below.
 */
function buildRunningRigging(cfg, mats, model, geo, yards, rig, env, tierGroup, tierPart) {
  const { G, place } = env;
  const rr = S('running_rigging_diameter') / 2;
  const armBinding = (y, arm) => ({ node: y.node.name, point: [Math.sign(arm.x) * y.length / 2, 0, 0] });
  const sets = {};

  for (const [name, y] of Object.entries(yards)) {
    const m = y.mast;
    // The braces. The fore and main yards brace aft, to the mast behind them. The mizzen
    // family is the exception and braces FORWARD, to the mainmast: there is nothing
    // abaft the mizzen to lead to, and leading them aft to the quarterdeck rail — which
    // is what this did — is not how the ship was rigged.
    const lead = m.name === 'fore' ? geo.main : m.name === 'main' ? geo.mizzen : geo.main;
    const set = new RunningSet(cfg, `${name}_running_rigging`, [name, tierPart(m, y.tier), `${lead.name}_lower_mast`], rr);
    sets[name] = set;

    // Lifts: from each yardarm up to the masthead above it.
    // Each lift lands on an existing masthead. tgLength already includes the
    // pole; adding that pole again put the upper lifts above the mast truck.
    const aboveH = y.tier === 'lower' ? m.capH : y.tier === 'topsail' ? m.topmastCapH : m.tgHeel + m.tgStop;
    for (const arm of y.arms) set.add(arm, m.along(aboveH), .01, armBinding(y, arm), null, `${name}:lift`);

    const forward = m.name === 'mizzen';
    for (const arm of y.arms) {
      const h = forward
        ? lead.above(y.tier === 'lower' ? 0.55 : 0.85)
        : lead.houndsH * (y.tier === 'lower' ? 0.75 : 0.95);
      set.add(arm, lead.along(h), .03, armBinding(y, arm), null, `${name}:brace`);
    }
  }

  if (cfg.runningRigging === 'full') {
    // Sheets terminate on the actual cloth clews, including during handling.
    // Upper sheets lead to the yard below; course sheets lead to the rail.
    for (const [sail, headKey, footKey] of [
      ['fore_course', 'fore_yard', null], ['main_course', 'main_yard', null],
      ['fore_topsail', 'fore_topsail_yard', 'fore_yard'],
      ['main_topsail', 'main_topsail_yard', 'main_yard'],
      ['mizzen_topsail', 'mizzen_topsail_yard', 'crossjack_yard'],
      ['fore_topgallant', 'fore_topgallant_yard', 'fore_topsail_yard'],
      ['main_topgallant', 'main_topgallant_yard', 'main_topsail_yard'],
      ['mizzen_topgallant', 'mizzen_topgallant_yard', 'mizzen_topsail_yard'],
    ]) {
      const cloth = rig.getObjectByName(`${sail}_sail`); if (!cloth) continue;
      const y = yards[headKey], foot = footKey ? yards[footKey] : null;
      const set = new RunningSet(cfg, `${headKey}_sheets`, [headKey, `${sail}_sail`, ...(footKey ? [footKey] : [])], rr);
      sets[`${headKey}:sheets`] = set;
      const [nu, nv] = cfg.sailSegments;
      for (const side of [-1, 1]) {
        const vertex = nv * (nu + 1) + (side > 0 ? nu : 0);
        const a = cloth.getVertexPosition(vertex, new THREE.Vector3()).applyMatrix4(cloth.matrixWorld);
        const z = y.mast.z0 + 3.5, below = model.standingDeckAt(z) + .3;
        const b = foot ? foot.arms.find((p) => Math.sign(p.x) === side) : new THREE.Vector3(side * model.halfBreadthAt(z, below) * .92, below, z);
        set.add(a, b, .025, { node: cloth.name, vertex }, foot ? armBinding(foot, b) : null, `${sail}:sheet`);
      }
    }
    // Halliards down to the deck at the mast: the topsail yard's, so they ride with it.
    for (const m of geo.masts) {
      const set = sets[`${m.name}_topsail_yard`];
      if (cfg.textureSize < 2048) {
        set.add(m.along(m.topmastHoundsH), new THREE.Vector3(.4, model.featureYAt(m.z0).deck + .4, m.z0 + .5), .02);
        continue;
      }
      const fifeRadius = SPEC.fife_rail_radius?.value ?? 1.07, fifeHeight = SPEC.fife_rail_height?.value ?? .9;
      const z = m.z0 + fifeRadius * .35;
      const y = model.standingDeckAt(z) + S('deck_camber') + fifeHeight + .12;
      const x = fifeRadius;
      const guide = woodenLeadBlock(cfg, mats); guide.position.set(x, y, z);
      G[m.name].lower.add(guide);
      // Lead through the sheave, then around the supporting rail/post. This is
      // a visual deck lead; the purchase above remains simplified.
      set.add(m.along(m.topmastHoundsH), new THREE.Vector3(x, y, z - .085), .012);
      const turn = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + i / 12 * Math.PI;
        turn.push(new THREE.Vector3(x, y + Math.sin(a) * .087, z + Math.cos(a) * .087));
      }
      set.addCurve(new THREE.CatmullRomCurve3(turn));
      set.add(new THREE.Vector3(x, y, z + .085), new THREE.Vector3(x - .15, y - .12, z + .025), .01);
    }
  }

  // Each batch goes into the group of the assembly its yard hangs in.
  for (const [key, set] of Object.entries(sets)) {
    const name = key.replace(/:sheets$/, '');
    const object = set.build(mats);
    if (!object) continue;
    const y = yards[name];
    tierGroup(y.mast, y.tier).add(object);
    env.reg.rope(object.name, object.userData.needs);
  }
}
