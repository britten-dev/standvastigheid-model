// A small Blender-made mesh shared by every detailed channel deadeye.
import * as THREE from 'three';
let prototype = null, pending;
export function deadeyeAsset() { return prototype; }
export function preloadDeadeyes() {
  if (!pending) pending = (async () => {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 15000);
    try {
      const response = await fetch(new URL('../assets/rigging-deadeye.glb', import.meta.url), { signal: abort.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { scene } = await new GLTFLoader().parseAsync(bytes, '');
      scene.updateMatrixWorld(true);
      const mesh = scene.getObjectByName('authored_deadeye');
      if (!mesh?.isMesh) throw new Error('Missing deadeye mesh');
      // Bake glTF's coordinate conversion once, before fitting each copy to the ship.
      const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
      for (const name of Object.keys(geometry.attributes)) {
        if (!['position', 'normal', 'uv', 'color'].includes(name)) geometry.deleteAttribute(name);
      }
      const colors = geometry.getAttribute('color');
      if (colors?.normalized) {
        const values = [];
        for (let i = 0; i < colors.count; i++) values.push(colors.getX(i), colors.getY(i), colors.getZ(i));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(values, 3));
      }
      if (!mesh.material.map) throw new Error('Deadeye timber texture is missing');
      mesh.material.envMapIntensity = .5;
      if (mesh.material.map) mesh.material.map.anisotropy = 4;
      prototype = { geometry, material: mesh.material };
      return true;
    } catch (error) {
      console.warn('Using procedural deadeyes.', error.message);
      return false;
    } finally { clearTimeout(timeout); }
  })();
  return pending;
}
