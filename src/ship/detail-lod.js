// Screen-sized detail, independent of the ship's sailing/animation state.
// A coarse fitting shares the same Mesh, transform and material as its close-up
// version. No second ship or geometry construction on zoom.
import * as T from 'three';
const choices = new WeakMap();
export function detailChoice(mesh, featureMetres, coarse = null) {
  choices.set(mesh, { featureMetres, coarse });
  return mesh;
}
const triangles = mesh => (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3
  * (mesh.isInstancedMesh ? mesh.count : 1);

export function createDetailLOD(model) {
  const entries = [], inverse = new T.Matrix4(), eye = new T.Vector3(), nearest = new T.Vector3();
  let fullTriangles = 0, enabled = true;
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    fullTriangles += triangles(mesh);
    const choice = choices.get(mesh);
    if (!choice) return;
    const full = mesh.geometry, coarse = choice.coarse;
    if (mesh.isInstancedMesh) mesh.computeBoundingBox();
    else full.computeBoundingBox();
    // Match the baked average contact shade on the simpler fitting. Keep the
    // detailed geometry's original UVs, normals and AO entirely untouched.
    if (coarse && full.attributes.color && !coarse.attributes.color) {
      const source = full.attributes.color, mean = new T.Color(0, 0, 0);
      for (let i = 0; i < source.count; i++) {
        mean.r += source.getX(i); mean.g += source.getY(i); mean.b += source.getZ(i);
      }
      mean.multiplyScalar(1 / source.count);
      const color = new Float32Array(coarse.attributes.position.count * 3);
      for (let i = 0; i < color.length; i += 3) { color[i] = mean.r; color[i+1] = mean.g; color[i+2] = mean.b; }
      coarse.setAttribute('color', new T.BufferAttribute(color, 3));
    }
    const lowTriangles = coarse ? (coarse.index?.count ?? coarse.attributes.position.count) / 3
      * (mesh.isInstancedMesh ? mesh.count : 1) : 0;
    entries.push({ mesh, full, coarse, bounds: (mesh.boundingBox ?? full.boundingBox).clone(),
      featureMetres: choice.featureMetres, mask: mesh.layers.mask,
      high: true, fullTriangles: triangles(mesh), lowTriangles });
  });
  const stats = { fullTriangles, selectedTriangles: fullTriangles, batches: entries.length, closeBatches: entries.length, switches: 0 };
  function select(entry, high) {
    if (entry.high !== high) stats.switches++;
    entry.high = high;
    entry.mesh.geometry = high || !entry.coarse ? entry.full : entry.coarse;
    // Layers leave visibility owned by damage and sail handling. All render
    // passes get the main camera's selection, including reflections and shadows.
    entry.mesh.layers.mask = high || entry.coarse ? entry.mask : 0;
  }
  return {
    stats,
    update(camera, pixelHeight) {
      model.updateWorldMatrix(true, true);
      camera.updateWorldMatrix(true, false);
      const focalPixels = pixelHeight * Math.abs(camera.projectionMatrix.elements[5]) * .5;
      let selected = fullTriangles, close = 0;
      for (const entry of entries) {
        inverse.copy(entry.mesh.matrixWorld).invert();
        eye.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inverse);
        entry.bounds.clampPoint(eye, nearest);
        // Distance to this fitting's bounds, not the ship's centre: inspecting
        // the stern need not bring every fitting at the bow to full detail.
        const distance = Math.max(.1, eye.distanceTo(nearest));
        const pixels = camera.isOrthographicCamera ? focalPixels * entry.featureMetres
          : focalPixels * entry.featureMetres / distance;
        // A dead band prevents gentle heave or a finger resting on the zoom
        // control from repeatedly changing levels near the boundary.
        const high = !enabled || pixels >= (entry.high ? .65 : .9);
        select(entry, high);
        if (high) close++;
        else selected -= entry.fullTriangles - entry.lowTriangles;
      }
      stats.selectedTriangles = selected; stats.closeBatches = close;
      return stats;
    },
    setEnabled(value) {
      enabled = !!value;
      if (!enabled) {
        for (const entry of entries) select(entry, true);
        stats.selectedTriangles = fullTriangles; stats.closeBatches = entries.length;
      }
    },
    get enabled() { return enabled; },
    // Useful when an owning host releases a model; the original ship remains valid.
    dispose() { for (const entry of entries) { select(entry, true); entry.coarse?.dispose(); } },
  };
}
