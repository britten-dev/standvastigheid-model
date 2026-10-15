// The gunports. A port is a rectangle in the hull's own surface coordinates — it spans
// a known band of V, between the sill and the head, at a known station — so the ports
// are cut by dropping faces out of the loft grid rather than by boolean subtraction.
// That gives a genuine opening through the ship's side for the price of an index test.
//
// Each opening then gets a lining (red, as the inboard works were), a sill and a lid
// hinged above it.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { portRecords } from './gun-openings.js';
import { mergeGeometries } from '../util/loft.js';
import { portLid, batchPortLids } from './port-fittings.js';
import { audit, audits } from '../audit/measure.js';

/**
 * Where every port sits: both batteries, the quarterdeck and the bridle ports. Each
 * record carries its own width, sill and head, because a two-decker's tiers differ.
 */
export function portLayout(model) {
  return portRecords(model);
}

/**
 * The ports are cut by clipping triangles (gun-openings.js), not by dropping loft quads,
 * so the lofter itself has nothing to skip. Kept so a host that passes a cutter still can.
 */
export function makePortCutter() {
  return () => false;
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
  const depth = SPEC.gunport_lining_depth.value;
  const at = (z, y, side) => new THREE.Vector3(model.halfBreadthAt(z, y) * side, y, z);

  for (const p of ports) {
    const w = p.width, h = p.height;
    for (const side of [1, -1]) {
      const sill = at(p.z, p.y0, side);
      const head = at(p.z, p.y1, side);

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

      // A manned bow chaser keeps its bridle port open in any weather: the book has her
      // firing them in a full gale.
      const shut = !!ctx.portsShut && !(p.kind === 'bridle' && ctx.chasers !== 'secured');
      if (cfg.portLids) lids.push(portLid(cfg, mats, model, p, side, shut));
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
  group.add(liningMesh);

  // Counted and measured per tier, so the audit checks each battery against the draught
  // rather than a total that could hide a missing port in one tier and an extra in another.
  for (const [kind, prefix] of [['upper', 'gunport'], ['lower', 'lower_gunport']]) {
    const tier = ports.filter((p) => p.kind === kind);
    const counter = new THREE.Object3D();
    counter.name = `${kind}_port_counter`;
    counter.userData.count = tier.length;
    audit(counter, `${prefix}_count_per_side`, 'count', { tolerance: 0.001 });
    group.add(counter);
    const mean = (f) => tier.reduce((a, p) => a + f(p), 0) / tier.length;
    const gauge = new THREE.Mesh(new THREE.BoxGeometry(0.001, mean((p) => p.height), mean((p) => p.width)), mats.red);
    gauge.visible = false;
    gauge.name = `${kind}_gunport_gauge`;
    audits(gauge, [`${prefix}_width`, 'extent_z', { tolerance: 0.03 }], [`${prefix}_height`, 'extent_y', { tolerance: 0.03 }]);
    group.add(gauge);
    const span = new THREE.Object3D();
    span.position.z = (tier.at(-1).z - tier[0].z) / (tier.length - 1);
    span.name = `${kind}_gunport_spacing_gauge`;
    audit(span, `${prefix}_spacing`, 'origin_z', { tolerance: 0.02 });
    group.add(span);
  }

  group.userData.assemblies = lids.map(l => l.userData.portLid);
  group.add(...batchPortLids(lids,cfg,mats));
  return group;
}
