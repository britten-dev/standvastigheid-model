import * as THREE from 'three';
import { detailChoice } from './detail-lod.js';
import { SPEC } from '../spec/spec.js';
import { ropeCurve, ropeTube } from '../util/solids.js';
import { mergeGeometries } from '../util/loft.js';
const S = key => SPEC[key].value;

// The axes of one lid: +X outside, +Y up, +Z along the hinge. Mirror the whole
// assembly for port; never give a lid a different shape just because it is open.
function board(depth, height, width, radius) {
  if (!radius) return new THREE.BoxGeometry(depth, height, width);
  const r = Math.min(radius, depth / 4);
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + r, -height / 2 + r);
  shape.lineTo(width / 2 - r, -height / 2 + r);
  shape.lineTo(width / 2 - r, height / 2 - r);
  shape.lineTo(-width / 2 + r, height / 2 - r); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: depth - 2 * r,
    bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 2, steps: 1 });
  g.translate(0, 0, -depth / 2 + r); g.rotateY(Math.PI / 2);
  return g;
}

function add(parent, geometry, material, name, at = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material); mesh.name = name;
  mesh.position.set(...at); parent.add(mesh); return mesh;
}

function ring(radius, iron, cfg) {
  // A lifting ring stands out from its eye, in the X/Y plane.
  return new THREE.TorusGeometry(radius, iron, Math.max(6, cfg.ropeRadial), cfg.latheSegments);
}

export function portLid(cfg, mats, model, p, side, shut) {
  const h = S('gunport_height'), t = S('gunport_lid_thickness'), overlap = S('gunport_lid_overlap');
  const z0 = p.cutZ0 ?? p.z - p.width / 2, z1 = p.cutZ1 ?? p.z + p.width / 2;
  const width = Math.max(p.width, z1 - z0) + overlap * 2, height = h + overlap * 2;
  const centreZ = (z0 + z1) / 2;
  const head = model.pointAt(centreZ, 'port_head', side), sill = model.pointAt(centreZ, 'port_sill', side);
  const lean = Math.atan2(Math.abs(sill.x) - Math.abs(head.x), head.y - sill.y);
  const r = S('gunport_hinge_barrel_diameter') / 2;
  const root = new THREE.Group(); root.name = `port_${side > 0 ? 'starboard' : 'port'}_${p.index}`;
  root.rotation.z = side * lean; root.scale.x = side;
  const hingeOffset = new THREE.Vector3(side * (S('gunport_lid_closed_proud') + t + r), overlap, 0)
    .applyAxisAngle(new THREE.Vector3(0, 0, 1), side * lean);
  root.position.copy(head).add(hingeOffset); root.position.z = centreZ;
  const moving = new THREE.Group(); moving.name = 'lid';
  moving.rotation.z = shut ? 0 : S('gunport_lid_open_degrees') * Math.PI / 180;
  root.add(moving);

  const detailed = !!cfg.portFittings, count = detailed ? S('gunport_lid_board_count') : 1;
  const seam = detailed ? S('gunport_lid_seam_width') : 0;
  const inner = t * S('gunport_lid_inner_fraction'), outer = t - inner;
  for (let i = 0; i < count; i++) {
    // Fore-and-aft outside boards; inner boards cross them. The small seams are
    // backed by a thin central web, so crossing seams never make pinholes.
    add(moving, board(outer, height / count - seam, width, detailed ? S('gunport_lid_edge_radius') : 0),
      mats.black, 'outer_board', [-r - outer / 2, -height + (i + .5) * height / count, 0]);
    add(moving, board(inner, height, width / count - seam, detailed ? S('gunport_lid_edge_radius') : 0),
      mats.red, 'inner_board', [-r - outer - inner / 2, -height / 2, -width / 2 + (i + .5) * width / count]);
  }
  if (detailed) add(moving, new THREE.BoxGeometry(seam, height, width), mats.black,
    'lid_core', [-r - outer, -height / 2, 0]);
  const attachments = [];
  if (detailed) {
    const strapW = S('gunport_hinge_strap_width'), strapT = S('gunport_hinge_strap_thickness');
    const strapL = Math.min(S('gunport_hinge_strap_length'), height - S('gunport_lift_ring_from_bottom'));
    const fixedH = S('gunport_hinge_fixed_height'), barrelL = S('gunport_hinge_barrel_length');
    const boltR = S('gunport_hinge_bolt_diameter') / 2;
    const ringR = S('gunport_lift_ring_diameter') / 2, ringIron = S('gunport_lift_ring_iron') / 2;
    const fixedX = -r - t - S('gunport_lid_closed_proud') + strapT / 2;
    for (const end of [-1, 1]) {
      const z = end * width * S('gunport_hinge_spacing_fraction') / 2;
      // Moving strap and rolled hinge eye. The fixed leaf lies on the ship's side
      // and bends out to the same axle, rather than floating alongside the lid.
      add(moving, board(strapT, strapL, strapW, strapT / 3), mats.iron, 'hinge_strap', [-r + strapT / 2, -strapL / 2, z]);
      const barrel = new THREE.CylinderGeometry(r, r, barrelL, cfg.latheSegments);
      barrel.rotateX(Math.PI / 2); add(root, barrel, mats.iron, 'hinge_barrel', [0, 0, z]);
      add(root, board(strapT, fixedH, strapW, strapT / 3), mats.iron, 'fixed_hinge_leaf', [fixedX, fixedH / 2, z]);
      add(root, new THREE.BoxGeometry(Math.abs(fixedX), strapT, strapW), mats.iron, 'hinge_return', [fixedX / 2, 0, z]);
      for (let i = 0; i < 4; i++) {
        const bolt = new THREE.SphereGeometry(boltR, Math.max(10, cfg.latheSegments / 2), 6, 0, Math.PI * 2, 0, Math.PI / 2);
        bolt.scale(1, S('gunport_hinge_bolt_height') / boltR, 1); bolt.rotateZ(-Math.PI / 2);
        add(moving, bolt, mats.iron, 'clenched_hinge_bolt', [-r + strapT, -(i + .5) * strapL / 4, z]);
      }
      const fixedBolt = new THREE.SphereGeometry(boltR, 12, 6);
      fixedBolt.scale(S('gunport_hinge_bolt_height') / boltR, 1, 1);
      add(root, fixedBolt, mats.iron, 'fixed_hinge_bolt', [fixedX + strapT / 2, fixedH * .7, z]);
      const liftY = -height + S('gunport_lift_ring_from_bottom');
      // A ring projects out of the face; its eye and the rope splice are visible.
      const lift = new THREE.Vector3(-r + ringR, liftY, z);
      add(moving, ring(ringR, ringIron, cfg), mats.iron, 'lifting_ring', lift.toArray());
      const eye = new THREE.CylinderGeometry(ringIron, ringIron, ringR * 2, 10);
      eye.rotateZ(Math.PI / 2); add(moving, eye, mats.iron, 'ring_bolt', [-r, liftY, z]);
      moving.updateMatrix();
      const a = lift.clone().add(new THREE.Vector3(ringR, 0, 0)).applyMatrix4(moving.matrix);
      const b = new THREE.Vector3(fixedX, S('gunport_lift_entry_above_head'), z);
      const curve = ropeCurve(a, b, shut ? .012 : .002, cfg.ropeSegments);
      add(root, ropeTube(curve, S('gunport_lift_rope_diameter') / 2,
        { tubular: cfg.ropeSegments, radial: cfg.ropeRadial }), mats.runningRigging, 'port_lifting_span');
      attachments.push({ ring: a.toArray(), entry: b.toArray() });
    }
  }
  root.updateMatrixWorld(true);
  const outerNormal = new THREE.Vector3(1, 0, 0).transformDirection(moving.matrixWorld);
  root.userData.portLid = { side, index: p.index, shut, width, height, thickness: t,
    hinge: root.position.toArray(), angle: moving.rotation.z, detailed,
    innerNormal: outerNormal.clone().negate().toArray(), spans: attachments };
  return root;
}

// All the lids are static within one sail/weather build. Batch by material so a
// hundred fittings do not become a hundred extra shadow/reflection draw calls.
export function batchPortLids(assemblies, cfg = {}, mats = {}) {
  const batches = new Map();
  for (const root of assemblies) {
    root.updateMatrixWorld(true);
    root.traverse(mesh => {
      if (!mesh.isMesh) return;
      let g = mesh.geometry.clone();
      if (g.index) g = g.toNonIndexed();
      g.applyMatrix4(mesh.matrixWorld);
      if (mesh.matrixWorld.determinant() < 0) {
        for (const attr of Object.values(g.attributes)) {
          const a = attr.array, n = attr.itemSize;
          for (let i = 0; i < attr.count; i += 3) for (let k = 0; k < n; k++) {
            const j = i * n + k, l = (i + 2) * n + k;
            [a[j], a[l]] = [a[l], a[j]];
          }
        }
      }
      if (!batches.has(mesh.material)) batches.set(mesh.material, []);
      batches.get(mesh.material).push(g);
    });
  }
  return [...batches].map(([material, geometries], i) => {
    const mesh = new THREE.Mesh(mergeGeometries(geometries), material);
    mesh.name = `gunport_fittings_${i}`;
    if(cfg.adaptiveDetail && material===mats.iron)detailChoice(mesh,.045);
    if(cfg.adaptiveDetail && material===mats.runningRigging)detailChoice(mesh,.024);
    return mesh;
  });
}
