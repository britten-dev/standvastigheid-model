// The decks and the inboard works.
//
// A frigate's deck arrangement is what makes her read as a frigate: one continuous
// battery deck, a forecastle forward and a quarterdeck aft raised above it, and between
// them an open waist crossed only by narrow gangways. Everything here is built from the
// hull model, so the decks follow the sheer and meet the ship's side wherever it
// happens to be.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { V } from './hull.js';
import { loftSections, mergeGeometries, weldByPosition } from '../util/loft.js';
import { sweep } from '../util/solids.js';
import { lerp, clamp } from '../util/math.js';
import { audit } from '../audit/measure.js';
import {sternDeckBoundary} from './stern.js';
import {walkingDeckMaterial,deckWaterways} from './deck-finish.js';
import {cutGunOpenings,upperGunOpenings} from './gun-openings.js';

/**
 * One deck surface, cambered. A deck is not flat: it is rounded up toward the
 * centreline so that water runs off it to the scuppers at the side.
 *
 * @param {'gundeck'|'forecastle'|'quarterdeck'} which
 */
function deckSurface(model, cfg, which, zFrom, zTo, closeStern=false) {
  const camber = SPEC.deck_camber.value;
  const heightAt=(x,z)=>{
    const station=Math.min(z,model.zAft);
    const edge=which==='gundeck'?model.featureYAt(station).deck:model.standingDeckAt(station);
    const width=Math.max(.001,model.halfBreadthAt(station,edge));
    return edge+camber*(1-(x/width)**2);
  };
  const stern=closeStern?sternDeckBoundary(cfg,model,heightAt):null;
  const baseRows=Math.max(6,Math.round(cfg.hullStations*(zTo-zFrom)/model.lengthOnDeck));
  const stations=Array.from({length:baseRows},(_,i)=>lerp(zFrom,zTo,i/(baseRows-1)));
  if(stern)stations.push(...stern.stations.filter(z=>z>zTo+1e-5),stern.aft);
  stations.sort((a,b)=>a-b);
  const zs=stations.filter((z,i)=>!i||z-stations[i-1]>1e-5),nz=zs.length;
  const nx = Math.max(5, Math.round(cfg.hullPoints / 5));

  const pos = [], uvs = [], idx = [];
  for (let i = 0; i < nz; i++) {
    const z = zs[i];
    const f = model.featureYAt(Math.min(z,model.zAft));
    // The deck at side, then the camber added toward the centreline. Above the gundeck
    // the deck sits at the side where the hull has narrowed, which is why the
    // quarterdeck and forecastle are narrower than the waist.
    //
    // The height of the upper decks comes from the hull model rather than from a fixed
    // rise above the gundeck, because the rail is derived from them: taking a fixed rise
    // put both of them above the rail, and left the sixteen guns on them standing in the
    // open air with nothing round them.
    const yEdge = which === 'gundeck' ? f.deck : model.standingDeckAt(z);
    const xEdge = stern&&z>=model.zAft?stern.halfBreadthAt(z):model.halfBreadthAt(z, yEdge);
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
 * The inboard face of the ship's side, from the deck up to the rail. Red, as the
 * inboard works were painted, and it is what stops you seeing straight through the
 * ship from one side to the other.
 */
function innerBulwark(model, cfg, zFrom, zTo) {
  const thickness = SPEC.side_thickness.value;
  const n = Math.max(10, Math.round(cfg.hullStations * 0.6));
  const sections = [];
  for (let i = 0; i < n; i++) {
    const z = lerp(zFrom, zTo, i / (n - 1));
    const f = model.featureYAt(z);
    const points = [];
    // From the deck up to the rail, inset by the thickness of the side.
    const steps = 4;
    for (let k = 0; k <= steps; k++) {
      const y = lerp(f.deck - 0.05, f.rail, k / steps);
      points.push([Math.max(0.05, model.halfBreadthAt(z, y) - thickness), y]);
    }
    sections.push({ z, points });
  }
  // The inboard face looks toward the centreline, so its winding is the reverse of the
  // hull's.
  const starboard = loftSections(sections, { mirror: false });
  starboard.index.array.reverse();
  const port = loftSections(sections.map((s) => ({ z: s.z, points: s.points.map(([x, y]) => [-x, y]) })), { mirror: false });
  const g = mergeGeometries([starboard, port]);
  g.computeVertexNormals();
  const openings=upperGunOpenings(model);
  for(let i=0;i<SPEC.gunport_count_per_side.value;i++){
    const z=model.fromStem(SPEC.gunport_first_from_stem.value)+i*SPEC.gunport_spacing.value,f=model.featureYAt(z);
    openings.push({z0:z-SPEC.gunport_width.value/2,z1:z+SPEC.gunport_width.value/2,y0:f.port_sill,y1:f.port_head});
  }
  const cut=cutGunOpenings(g,openings);g.dispose();return cut;
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

  const L = model.lengthOnDeck;
  const zStem = model.zFwd;
  const zFcBreak = model.fromStem(SPEC.forecastle_break_u.value * L);
  const zQdBreak = model.fromStem(SPEC.quarterdeck_break_u.value * L);
  const zStern = model.zAft;

  // The gundeck runs the whole length of the ship. Forward of the forecastle break and
  // abaft the quarterdeck break it is covered over, but it is still there, and in the
  // waist it is the deck you stand on.
  const gundeck = new THREE.Mesh(deckSurface(model, cfg, 'gundeck', zStem + 0.6, zStern, true), surface);
  gundeck.name = 'gundeck';
  // The height of this deck is audited from a marker at the midship station in hull.js,
  // not from the mesh: the deck sweeps up at both ends with the sheer, so its average
  // height is a good foot above the figure the spec gives for amidships.
  group.add(gundeck);

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
    const inner = new THREE.Mesh(innerBulwark(model, cfg, zStem + 0.5, zStern), mats.red);
    inner.name = 'inner_bulwark';
    group.add(inner);
  }

  // The cap rail all round, port and starboard.
  const caps = [];
  for (const side of [1, -1]) caps.push(railCap(model, cfg, zStem + 0.5, zStern - 0.3, side));
  const cap = new THREE.Mesh(mergeGeometries(caps), mats.black);
  cap.name = 'rail_cap';
  group.add(cap);

  return { group, zFcBreak, zQdBreak };
}
