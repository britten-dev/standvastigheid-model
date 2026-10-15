// The named camera stations used for verification renders.
//
// `azimuth` is where the camera stands, measured round the ship from dead ahead: 0 puts
// the camera in front of her looking aft at her bow, 90 on her starboard beam, 180
// astern looking forward, 270 on her port beam. `elevation` is above the waterline
// plane. Most views here are taken from the port side, because that is the side the
// reference photograph shows. `fill` is how much of the frame the ship takes up: 1.0
// fits her bounding sphere exactly inside the field of view, so a close study is a
// number well below 1 and a whole-ship view is a little above it. Framing that way
// means a view keeps working when the ship changes size, and that the same view of the
// full suit and of the furled state is shot from the same place.
export const VIEWS = {
  // Matched to The Model Shipyard's photograph: a museum model photographed from the
  // port bow, a little above deck level, the whole rig in frame.
  // Matched to The Model Shipyard's photograph by laying the two side by side: the
  // photograph is taken from the port bow but much closer to the beam than it first
  // looks, from a little above the rail, with the ship filling the frame.
  reference: { azimuth: 308, elevation: 9, fill: 0.84, fov: 30, aim: [0, 0.44, 0.02] },

  bow: { azimuth: 348, elevation: 9, fill: 1.04, fov: 34, aim: [0, 0.44, 0] },
  beam: { azimuth: 270, elevation: 7, fill: 1.02, fov: 32, aim: [0, 0.48, 0] },
  quarter: { azimuth: 218, elevation: 14, fill: 1.05, fov: 34, aim: [0, 0.46, 0] },
  stern: { azimuth: 183, elevation: 10, fill: 1.02, fov: 34, aim: [0, 0.42, 0] },
  masthead: { azimuth: 296, elevation: 44, fill: 0.80, fov: 40, aim: [0, 0.62, 0] },
  // Standing on the quarterdeck looking forward along the ship, which is the view that
  // shows the guns, the boats on the skid beams and the waist. Far enough aft and high
  // enough to clear the spanker and the ensign, which otherwise fill the frame.
  deck: { azimuth: 209, elevation: 19, fill: 0.44, fov: 50, aim: [0, 0.26, 0.02] },

  // Close studies, used when iterating on one region.
  head: { azimuth: 322, elevation: 6, fill: 0.30, fov: 36, aim: [0, 0.17, -0.40] },
  gallery: { azimuth: 214, elevation: 6, fill: 0.26, fov: 36, aim: [0, 0.16, 0.42] },
  channels: { azimuth: 266, elevation: 5, fill: 0.30, fov: 36, aim: [0, 0.18, 0] },
  underwater: { azimuth: 292, elevation: -14, fill: 0.72, fov: 34, aim: [0, 0.02, 0] },
  waist: { azimuth: 244, elevation: 26, fill: 0.42, fov: 40, aim: [0, 0.28, 0] },
};

/**
 * Place a camera at a named view.
 *
 * @param camera
 * @param view    one of VIEWS
 * @param bounds  `{ radius, centre }` of the whole ship, which sets the distance
 * @param frame   `{ length, height }` of the ship, which the aim point is a fraction of
 */
export function applyView(camera, view, bounds, frame) {
  const a = (view.azimuth * Math.PI) / 180;
  const e = (view.elevation * Math.PI) / 180;
  const fov = view.fov;

  const tx = view.aim[0] * frame.length;
  const ty = view.aim[1] * frame.height;
  const tz = bounds.centre.z + view.aim[2] * frame.length;

  // The exact distance at which every corner of the ship's bounding box is still inside
  // the frame. A bounding sphere would do, but a square-rigged ship is long, thin and
  // tall, so her sphere is far bigger than she is and framing on it leaves her a speck
  // in the middle of the picture.
  //
  // For a corner at offset (right, up, toward-camera) = (p, q, r) from the aim point,
  // the camera at distance D sees it at depth D - r, so it stays in frame when
  // D >= r + |p| / tan(halfHorizontal) and D >= r + |q| / tan(halfVertical).
  const vHalf = Math.tan((fov * Math.PI) / 360);
  // A camera whose aspect is not a finite number — which happens if the page is framed
  // while its container still has zero height — makes every distance below NaN, and the
  // camera then sits at NaN for the rest of the session with nothing on screen and no
  // error anywhere. Fall back to a sane frame rather than propagating it.
  const aspect = Number.isFinite(camera.aspect) && camera.aspect > 0 ? camera.aspect : 16 / 9;
  const hHalf = vHalf * aspect;

  const dir = [
    Math.sin(a) * Math.cos(e),
    Math.sin(e),
    -Math.cos(a) * Math.cos(e),
  ];
  // Camera right and up, from the view direction and world up.
  const rt = [dir[2], 0, -dir[0]];
  const rl = Math.hypot(rt[0], rt[2]) || 1;
  rt[0] /= rl; rt[2] /= rl;
  const up = [
    rt[1] * dir[2] - rt[2] * dir[1],
    rt[2] * dir[0] - rt[0] * dir[2],
    rt[0] * dir[1] - rt[1] * dir[0],
  ];

  let d = 0;
  for (const c of bounds.corners) {
    const o = [c.x - tx, c.y - ty, c.z - tz];
    const p = o[0] * rt[0] + o[1] * rt[1] + o[2] * rt[2];
    const q = o[0] * up[0] + o[1] * up[1] + o[2] * up[2];
    const r = o[0] * dir[0] + o[1] * dir[1] + o[2] * dir[2];
    d = Math.max(d, r + Math.abs(p) / hHalf, r + Math.abs(q) / vHalf);
  }
  d *= view.fill;

  camera.position.set(
    tx + Math.sin(a) * Math.cos(e) * d,
    ty + Math.sin(e) * d,
    tz - Math.cos(a) * Math.cos(e) * d
  );
  camera.fov = fov;
  camera.near = Math.max(0.05, d / 400);
  // Far enough to keep the sky sphere and the sea plane inside the frustum on a close
  // study, where the distance to the subject is small but the backdrop is not.
  camera.far = Math.max(d * 12, 2400);
  camera.updateProjectionMatrix();
  camera.lookAt(tx, ty, tz);
  return { target: [tx, ty, tz] };
}

/**
 * Work out the framing inputs from a built ship. The hull sets the aim point and the
 * fore-and-aft centre, because a spanker boom or a braced yard sticking out would
 * otherwise swing the camera about between one sail state and the next; the whole ship,
 * rig included, sets the distance, because all of it has to be in frame.
 */
export function framingFor(THREE, ship) {
  // The framing is measured off world-space boxes, so the world matrices have to be
  // current. They are not, if this is called before the first render — every child still
  // carries an identity matrix, every box collapses onto the origin, and the camera ends
  // up a couple of metres from the middle of the ship looking at the inside of a sail.
  ship.updateWorldMatrix(true, true);
  const whole = new THREE.Box3().setFromObject(ship);
  const hullMesh = ship.getObjectByName('hull_shell') ?? ship;
  const hullBox = new THREE.Box3().setFromObject(hullMesh);
  const hullSize = hullBox.getSize(new THREE.Vector3());
  const wholeSize = whole.getSize(new THREE.Vector3());
  const centre = hullBox.getCenter(new THREE.Vector3());

  // The points the framing is fitted to: the corners of every part's own bounding box,
  // rather than of one box round the whole ship. The difference matters. A single box
  // has a corner out at (widest, highest, furthest aft) which is empty air — the yards
  // are wide but low, the masts are high but narrow — and fitting to it leaves the ship
  // a third of the size she should be in frame.
  const corners = [];
  ship.traverse((o) => {
    if (!o.isMesh && !o.isLineSegments) return;
    const b = new THREE.Box3().setFromObject(o);
    if (!isFinite(b.min.x) || b.isEmpty()) return;
    for (const x of [b.min.x, b.max.x]) {
      for (const y of [b.min.y, b.max.y]) {
        for (const z of [b.min.z, b.max.z]) corners.push(new THREE.Vector3(x, y, z));
      }
    }
  });
  if (!corners.length) {
    for (const x of [whole.min.x, whole.max.x]) {
      for (const y of [whole.min.y, whole.max.y]) {
        for (const z of [whole.min.z, whole.max.z]) corners.push(new THREE.Vector3(x, y, z));
      }
    }
  }

  return {
    bounds: { corners, centre },
    frame: { length: hullSize.z, height: wholeSize.y },
  };
}
