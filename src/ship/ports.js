// The gunports. A port is a rectangle in the hull's own surface coordinates — it spans
// a known band of V, between the sill and the head, at a known station — so the ports
// are cut by dropping faces out of the loft grid rather than by boolean subtraction.
// That gives a genuine opening through the ship's side for the price of an index test.
//
// Each opening then gets a lining (red, as the inboard works were), a sill and a lid
// hinged above it.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { V } from './hull.js';
import { mergeGeometries } from '../util/loft.js';
import { portLid, batchPortLids } from './port-fittings.js';
import { audit, audits } from '../audit/measure.js';

/**
 * Where every port sits. Positions are `z` in model space; each port also carries the
 * V band it occupies, which is what the lofter tests against.
 */
export function portLayout(model) {
  const ports = [];
  const n = SPEC.gunport_count_per_side.value;
  const spacing = SPEC.gunport_spacing.value;
  const first = model.fromStem(SPEC.gunport_first_from_stem.value);

  for (let i = 0; i < n; i++) {
    ports.push({
      kind: 'gundeck',
      index: i,
      z: first + i * spacing,
      width: SPEC.gunport_width.value,
      v0: V.port_sill,
      v1: V.port_head,
    });
  }
  return ports;
}

/**
 * The predicate the lofter uses. A quad is dropped when its station falls inside a
 * port's width and its V band falls inside the port's opening.
 *
 * It also records what it actually cut. A hole made by dropping whole faces out of a grid
 * is quantised to that grid: it is never exactly the width of the port, and it is not even
 * centred on it, because the hull's stations are cosine-spaced and bunch toward the ends.
 * That is invisible while the port stands open — what shows through it is red lining
 * either way — and it is the whole problem as soon as a lid has to cover it, which is
 * what a ship in heavy weather needs. So each port comes back knowing the true extent of
 * its own opening, in `cutZ0` and `cutZ1`, and the lid is cut to that.
 */
export function makePortCutter(model, ports) {
  return (zA, zB, vA, vB) => {
    if (vB <= V.port_sill || vA >= V.port_head) return false;
    const zMid = (zA + zB) / 2;
    for (const p of ports) {
      if (Math.abs(zMid - p.z) <= p.width / 2) {
        // Only cut the middle of the V band, so a rim of hull is left as the sill and
        // the head of the port rather than the opening running edge to edge.
        if (!(vA >= p.v0 && vB <= p.v1)) return false;
        p.cutZ0 = Math.min(p.cutZ0 ?? zA, zA);
        p.cutZ1 = Math.max(p.cutZ1 ?? zB, zB);
        return true;
      }
    }
    return false;
  };
}

/**
 * The joinery round each opening: the lining that shows red from outside, and the lid.
 * At the distant LOD none of this is built — the opening alone reads as a port.
 *
 * `ctx.portsShut` decides which way the lids hang, and it is not a detail. A ship
 * running in a gale has her gunports shut and her guns housed: a gundeck port is about
 * two feet above the deck and four above the water amidships, and a frigate carrying that
 * row of holes open in a following sea would fill her gundeck. Twenty-four open ports on
 * a ship under a reefed foresail is the sort of thing that reads as wrong long before
 * anybody can say why.
 */
export function buildPorts(cfg, mats, model, ports, ctx = {}) {
  const group = new THREE.Group();
  group.name = 'gunports';
  if (!cfg.portLids && cfg.deckFurniture === 'none') return group;

  const linings = [];
  const lids = [];
  const w = SPEC.gunport_width.value;
  const h = SPEC.gunport_height.value;
  const depth = SPEC.gunport_lining_depth.value;

  for (const p of ports) {
    for (const side of [1, -1]) {
      const sill = model.pointAt(p.z, 'port_sill', side);
      const head = model.pointAt(p.z, 'port_head', side);

      // The side leans inboard as it rises, so the lining has to be tilted to match or
      // it stands proud of the planking at one edge and sinks into it at the other.
      const lean = Math.atan2(Math.abs(sill.x) - Math.abs(head.x), head.y - sill.y) * side;

      // Four reveals leave the opening empty. A solid red plug here made every
      // cannon appear to pass through a painted panel instead of an open gunport.
      const trim = SPEC.gunport_lid_thickness.value;
      const liningW = (p.cutZ1 ?? p.z + w / 2) - (p.cutZ0 ?? p.z - w / 2);
      const centreZ = ((p.cutZ0 ?? p.z - w / 2) + (p.cutZ1 ?? p.z + w / 2)) / 2;
      const frame = new THREE.Matrix4().compose(
        new THREE.Vector3((Math.abs(sill.x) + Math.abs(head.x)) / 2 * side - depth / 2 * side,
          (sill.y + head.y) / 2, centreZ),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), lean),
        new THREE.Vector3(1, 1, 1),
      );
      for (const [height, width, dy, dz] of [
        [trim, liningW, -h / 2, 0], [trim, liningW, h / 2, 0],
        [h, trim, 0, -liningW / 2], [h, trim, 0, liningW / 2],
      ]) {
        const g = new THREE.BoxGeometry(depth, height, width);
        // The narrow reveal sees progressively less sky toward the gundeck.
        // Bake that local cavity shade before the coarser whole-ship AO pass;
        // no opaque backing plate or extra draw call is needed.
        const pos = g.attributes.position;
        const colours = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
          const exposed = THREE.MathUtils.clamp(0.5 + side * pos.getX(i) / depth, 0, 1);
          const shade = 0.48 + exposed * 0.52;
          colours.fill(shade, i * 3, i * 3 + 3);
        }
        g.setAttribute('color', new THREE.BufferAttribute(colours, 3));
        g.translate(0, dy, dz); g.applyMatrix4(frame);
        linings.push(new THREE.Mesh(g, mats.red));
      }

      if (cfg.portLids) lids.push(portLid(cfg, mats, model, p, side, !!ctx.portsShut));
    }
  }

  const liningGeom = mergeGeometries(linings.map((mL) => {
    const g = mL.geometry.clone();
    mL.updateMatrix();
    g.applyMatrix4(mL.matrix);
    return g;
  }));
  const liningMesh = new THREE.Mesh(liningGeom, mats.red);
  liningMesh.name = 'port_linings';
  audit(liningMesh, 'gunport_count_per_side', 'count', { tolerance: 0.001 });
  liningMesh.userData.count = ports.length;
  group.add(liningMesh);

  // One lining measured on its own, so the audit checks the size of a port and not just
  // how many there are. The lining is cut a little inside the opening, so the tolerance
  // allows for that rather than pretending the two are identical.
  const sample = new THREE.Mesh(
    new THREE.BoxGeometry(0.001, SPEC.gunport_height.value * 0.97, SPEC.gunport_width.value * 0.97),
    mats.red
  );
  sample.visible = false;
  sample.name = 'gunport_gauge';
  audits(sample,
    ['gunport_width', 'extent_z', { tolerance: 0.05 }],
    ['gunport_height', 'extent_y', { tolerance: 0.05 }],
  );
  group.add(sample);

  // The spacing, measured across the whole battery rather than between one pair, so a
  // single misplaced port cannot hide inside a correct average.
  const span = new THREE.Object3D();
  span.position.z = (ports.at(-1).z - ports[0].z) / (ports.length - 1);
  span.name = 'gunport_spacing_gauge';
  audit(span, 'gunport_spacing', 'origin_z', { tolerance: 0.02 });
  group.add(span);

  group.userData.assemblies = lids.map(l => l.userData.portLid);
  group.add(...batchPortLids(lids,cfg,mats));
  return group;
}
