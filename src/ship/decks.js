// The decks and the inboard works.
//
// A two-decker: the lower deck carries the 32-pounders and runs the length of her, the
// upper deck carries the 24-pounders and is open to the sky in the waist, and over it the
// quarterdeck aft and the forecastle forward, joined along the sides by gangways. The
// heights come from the port sills measured on the Washington's draught (hull.js), so
// the decks follow her sheer and meet her side wherever it happens to be.
//
// Mesh names: `gundeck` is the lower deck, as the Royal Navy named it on a two-decker;
// `upper_deck` is the deck in the waist.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { V } from './hull.js';
import { loftSections, mergeGeometries, weldByPosition } from '../util/loft.js';
import { sweep } from '../util/solids.js';
import { lerp, clamp } from '../util/math.js';
import { audit } from '../audit/measure.js';
import {sternDeckBoundary,sternLanding} from './stern.js';
import {walkingDeckMaterial,deckWaterways} from './deck-finish.js';
import {cutGunOpenings,gunOpenings} from './gun-openings.js';

/**
 * One deck surface, cambered. A deck is not flat: it is rounded up toward the
 * centreline so that water runs off it to the scuppers at the side.
 *
 * @param {'lower'|'upper'|'forecastle'|'quarterdeck'} which
 */
function deckEdge(model, which, z) {
  if (which === 'lower') return model.lowerDeckAt(z);
  if (which === 'upper') return model.upperDeckAt(z);
  return model.standingDeckAt(z);
}

/**
 * The cambered surface of one deck: its height at (x, z), and its half-breadth at z.
 * Abaft the station where the stern lands on the hull, a deck that runs into the stern is
 * as wide as the stern, so its camber spreads with it. Exported so that anything standing
 * on a deck — the stern chasers on the upper deck under the counter — stands on what is
 * drawn rather than on a narrower hull section.
 */
export function deckSurfaceAt(model, cfg, which, closeStern=false) {
  const camber = SPEC.deck_camber.value;
  let stern=null;
  const widthAt=(z,edge)=>{
    const hull=model.halfBreadthAt(Math.min(z,model.zAft),edge);
    return stern&&z>stern.landing?Math.max(hull,stern.halfBreadthAt(z)):hull;
  };
  const heightAt=(x,z)=>{
    const station=Math.min(z,model.zAft);
    const edge=deckEdge(model,which,station);
    const width=Math.max(.001,widthAt(z,edge));
    return edge+camber*(1-(x/width)**2);
  };
  // Where the stern meets the deck is found against the deck at mid-camber, because the
  // camber's width is not known until the stern is.
  const meetHeight=(x,z)=>deckEdge(model,which,Math.min(z,model.zAft))+camber*.5;
  stern=closeStern?sternDeckBoundary(cfg,model,meetHeight):null;
  return { heightAt, widthAt:(z)=>Math.max(.001,widthAt(z,deckEdge(model,which,Math.min(z,model.zAft)))), stern };
}

function deckSurface(model, cfg, which, zFrom, zTo, closeStern=false, rowScale=1) {
  const camber = SPEC.deck_camber.value;
  const { heightAt, stern } = deckSurfaceAt(model, cfg, which, closeStern);
  const baseRows=Math.max(6,Math.round(rowScale*cfg.hullStations*(zTo-zFrom)/model.lengthOnDeck));
  const stations=Array.from({length:baseRows},(_,i)=>lerp(zFrom,zTo,i/(baseRows-1)));
  if(stern)stations.push(...stern.stations.filter(z=>z>stern.landing+1e-5),stern.aft);
  stations.sort((a,b)=>a-b);
  const zs=stations.filter((z,i)=>!i||z-stations[i-1]>1e-5),nz=zs.length;
  const nx = Math.max(5, Math.round(cfg.hullPoints / 5));

  const pos = [], uvs = [], idx = [];
  for (let i = 0; i < nz; i++) {
    const z = zs[i];
    // The deck at side, then the camber added toward the centreline.
    const yEdge = deckEdge(model, which, Math.min(z, model.zAft));
    const xEdge = stern&&z>stern.landing?stern.halfBreadthAt(z):model.halfBreadthAt(z, yEdge);
    for (let j = 0; j < nx; j++) {
      const t = (j / (nx - 1)) * 2 - 1;           // -1 port, +1 starboard
      const x = t * xEdge;
      const y = heightAt(x,z);
      pos.push(x, y, z);
      uvs.push(z / 2.4, x / 2.4);                 // planks run fore and aft
    }
  }
  for (let i = 0; i < nz - 1; i++) {
    for (let j = 0; j < nx - 1; j++) {
      const a = i * nx + j, b = a + 1, c = a + nx, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  // Collapse the final point at the centre of the rounded transom. Welding
  // keeps its normals continuous and the deck a single connected surface.
  if(stern){
    weldByPosition(g,1e-6);
    const clean=[];for(let i=0;i<g.index.count;i+=3){
      const a=g.index.getX(i),b=g.index.getX(i+1),c=g.index.getX(i+2);
      if(a!==b&&b!==c&&c!==a)clean.push(a,b,c);
    }
    g.setIndex(clean);g.userData.sternClosure={sternpost:model.zAft,aft:stern.aft};
  }
  g.computeVertexNormals();
  return g;
}

/**
 * The inboard face of the ship's side between two heights, inset by the thickness of the
 * side. Red, as the inboard works were painted, and it is what stops you seeing straight
 * through the ship from one side to the other — above the upper deck to the rail, and
 * between the decks, where it is all an open lower port shows.
 */
function innerLining(model, cfg, zFrom, zTo, yLow, yHigh, openings) {
  const thickness = SPEC.side_thickness.value;
  const n = Math.max(10, Math.round(cfg.hullStations * 0.6));
  const sections = [];
  for (let i = 0; i < n; i++) {
    const z = lerp(zFrom, zTo, i / (n - 1));
    const points = [];
    const steps = 4;
    const lo = yLow(z), hi = Math.max(lo + 0.05, yHigh(z));
    for (let k = 0; k <= steps; k++) {
      const y = lerp(lo, hi, k / steps);
      points.push([Math.max(0.05, model.halfBreadthAt(z, y) - thickness), y]);
    }
    sections.push({ z, points });
  }
  const starboard = loftSections(sections, { mirror: false });
  starboard.index.array.reverse();
  const port = loftSections(sections.map((s) => ({ z: s.z, points: s.points.map(([x, y]) => [-x, y]) })), { mirror: false });
  const g = mergeGeometries([starboard, port]);
  g.computeVertexNormals();
  const cut=cutGunOpenings(g,openings);g.dispose();return cut;
}

/**
 * The underside of the upper deck, seen from the lower deck through an open port: the
 * deck's own planking, a hand's breadth lower, facing down.
 */
function deckUnderside(model, cfg, zFrom, zTo) {
  const g = deckSurface(model, cfg, 'upper', zFrom, zTo, false, 0.5);
  g.translate(0, -SPEC.deck_thickness.value, 0);
  g.index.array.reverse();
  g.computeVertexNormals();
  return g;
}

/** The cap rail: the timber that finishes the top of the bulwark all round. */
function railCap(model, cfg, zFrom, zTo, side) {
  const curve = model.featureCurve('rail', side, cfg.mouldingSweeps, zFrom, zTo);
  const w = SPEC.side_thickness.value * 1.5;
  const t = SPEC.rail_cap_thickness.value;
  const b = cfg.surfaceDetail ? Math.min(t * 0.18, 0.012) : 0;
  return sweep(curve, [[-w / 2 + b, 0], [w / 2 - b, 0], [w / 2, b],
    [w / 2, t - b], [w / 2 - b, t], [-w / 2 + b, t],
    [-w / 2, t - b], [-w / 2, b]], {
    steps: cfg.mouldingSweeps, closed: true,
  });
}

export function buildDecks(cfg, mats, model) {
  const group = new THREE.Group();
  group.name = 'decks';
  const surface=walkingDeckMaterial(cfg,mats.deck);

  const zStem = model.zFwd;
  const zFcBreak = model.zFcBreak;
  const zQdBreak = model.zQdBreak;
  const zStern = Math.min(model.zAft, sternLanding(model));

  // The lower deck runs the length of her. Nobody sees it except through an open port,
  // so it is built at half the stations of the decks above.
  if (cfg.lowerDeck !== false) {
    const lower = new THREE.Mesh(deckSurface(model, cfg, 'lower', zStem + 1.4, zStern - 0.6, false, 0.5), surface);
    lower.name = 'gundeck';
    group.add(lower);
  }

  // The upper deck runs the whole length too. Forward of the forecastle break and abaft
  // the quarterdeck break it is covered over, but it is still there, and in the waist it
  // is the deck you stand on.
  const gundeck = new THREE.Mesh(deckSurface(model, cfg, 'upper', zStem + 0.8, zStern, true), surface);
  gundeck.name = 'upper_deck';
  group.add(gundeck);
  if (cfg.innerBulwarks) {
    const under = new THREE.Mesh(deckUnderside(model, cfg, zStem + 1.0, zStern - 0.4), mats.timber);
    under.name = 'upper_deck_underside';
    group.add(under);
  }

  // The forecastle and the quarterdeck, raised above it.
  const fc = new THREE.Mesh(
    deckSurface(model, cfg, 'forecastle', zStem + 0.8, zFcBreak),
    surface
  );
  fc.name = 'forecastle';
  group.add(fc);

  const qd = new THREE.Mesh(
    deckSurface(model, cfg, 'quarterdeck', zQdBreak, zStern, true),
    surface
  );
  qd.name = 'quarterdeck';
  group.add(qd);

  // The gangways: narrow walkways along each side of the waist joining the forecastle
  // to the quarterdeck. Without them the two ends of the ship are not connected, and
  // in the reference photograph they are what the boats' skid beams rest against.
  for (const side of [1, -1]) {
    const n = 20;
    const pos = [], uvs = [], idx = [];
    const w = SPEC.gangway_width.value;
    for (let i = 0; i < n; i++) {
      const z = lerp(zFcBreak, zQdBreak, i / (n - 1));
      // The gangways run at the level of the two decks they join, so they take their
      // height from the same place those decks do.
      const y = lerp(model.standingDeckAt(zFcBreak), model.standingDeckAt(zQdBreak), i / (n - 1));
      const xOuter = model.halfBreadthAt(z, y) - SPEC.side_thickness.value;
      for (let j = 0; j < 2; j++) {
        const x = (xOuter - j * w) * side;
        pos.push(x, y, z);
        uvs.push(z / 2.4, x / 2.4);
      }
    }
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = c + 1;
      if (side > 0) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const gw = new THREE.Mesh(g, surface);
    gw.name = `gangway_${side > 0 ? 'starboard' : 'port'}`;
    group.add(gw);
  }

  const waterways=deckWaterways(cfg,model,[['gundeck',zFcBreak,zQdBreak],['forecastle',zStem+.8,zFcBreak],['quarterdeck',zQdBreak,zStern-.12]]);
  if(waterways)group.add(waterways);

  if (cfg.innerBulwarks) {
    const upperOpenings = gunOpenings(model, ['upper', 'quarterdeck']);
    const inner = new THREE.Mesh(innerLining(model, cfg, zStem + 0.5, zStern,
      (z) => model.upperDeckAt(z) - 0.05, (z) => model.railYAt(z), upperOpenings), mats.red);
    inner.name = 'inner_bulwark';
    group.add(inner);
    const lowerOpenings = gunOpenings(model, ['lower', 'bridle']);
    const between = new THREE.Mesh(innerLining(model, cfg, zStem + 1.2, zStern - 0.4,
      (z) => model.lowerDeckAt(z) - 0.05, (z) => model.upperDeckAt(z) - SPEC.deck_thickness.value, lowerOpenings), mats.red);
    between.name = 'lower_deck_lining';
    group.add(between);
  }

  // The cap rail all round, port and starboard.
  const caps = [];
  for (const side of [1, -1]) caps.push(railCap(model, cfg, zStem + 0.5, zStern, side));
  const cap = new THREE.Mesh(mergeGeometries(caps), mats.black);
  cap.name = 'rail_cap';
  group.add(cap);

  return { group, zFcBreak, zQdBreak };
}
