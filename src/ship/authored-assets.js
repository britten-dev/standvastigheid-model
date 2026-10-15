import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';

const libraries = new Map(), pending = new Map();
export async function preloadAuthoredAssets({ crew = true } = {}) {
  const key = crew ? 'full' : 'fittings';
  if (!pending.has(key)) pending.set(key, (async () => {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 25000);
    try {
      const url = crew ? new URL('../assets/quarterdeck-detail.glb', import.meta.url)
        : new URL('../assets/quarterdeck-fittings.glb', import.meta.url);
      const response = await fetch(url, { signal: abort.signal });
      if (!response.ok) throw new Error(`Detailed ship assets: HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      const [{ GLTFLoader },{ MeshoptDecoder }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/libs/meshopt_decoder.module.js'),
      ]);
      const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes, '');
      const library = gltf.scene;
      libraries.set(key, library);
      library.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = o.receiveShadow = true;
        for (const m of [o.material].flat()) {
          m.envMapIntensity = .65;
          for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) {
            if (m[key]) m[key].anisotropy = 4;
          }
        }
      });
      return true;
    } catch (error) {
      // The original ship remains usable on a slow/offline connection.
      console.warn('Using the procedural ship detail.', error.message);
      return false;
    } finally { clearTimeout(timeout); }
  })());
  return pending.get(key);
}

export function authoredPart(name, cfg) {
  if (cfg.textureSize < 1024) return null;
  const original = libraries.get('full')?.getObjectByName(name) ?? libraries.get('fittings')?.getObjectByName(name);
  if (!original) return null;
  const part = original.clone(true);
  part.userData.authored = true;
  return part;
}

/** Same pose contract as the procedural figures, with separately articulated hands. */
export function authoredFigure(cfg, { rank, pose = 'stand', seed = 0 }) {
  const officer = ['captain', 'officer', 'midshipman'].includes(rank);
  const f = authoredPart(officer ? 'authored_officer' : rank === 'oilskin' ? 'authored_oilskin' : 'authored_seaman', cfg);
  if (!f) return null;
  // Blender disambiguates repeated joint names with suffixes. Each figure has its
  // own hierarchy, so restore the public names used by the animation layer.
  f.traverse(o => {
    for (const name of ['arm_port', 'arm_starboard', 'elbow', 'hand', 'grip', 'head',
      'eye_port', 'eye_starboard', 'lid_port', 'lid_starboard']) {
      if (new RegExp(`^${name}([._]?\\d+)?$`).test(o.name)) {
        if (!o.isMesh) o.name = name;
      }
    }
  });
  const height = SPEC[officer ? 'crew_officer_height' : 'crew_figure_height'].value;
  const scale = height / 1.76 * (1 + Math.sin(seed * 7.19) * .025);
  f.scale.setScalar(scale);
  const head=f.getObjectByName('head');
  head.scale.set(1+Math.sin(seed*2.71)*.045,1+Math.cos(seed*1.91)*.018,1+Math.sin(seed*1.37)*.03);
  // Texture detail stays shared; a little variation in complexion and cloth
  // prevents eleven repeated instances from looking like one identical man.
  const localMaterials=new Map();
  f.traverse(o=>{
    if(!o.isMesh || !/Weathered|Indigo|Unbleached/.test(o.material.name)) return;
    if(!localMaterials.has(o.material)) {
      const material=o.material.clone();
      const s=Math.sin(seed*1.79);
      if(/Weathered/.test(material.name)) material.color.setRGB(.97+s*.035,.96+s*.035,.95+s*.035);
      else material.color.setScalar(.94+Math.sin(seed*3.13)*.055);
      localMaterials.set(o.material,material);
    }
    o.material=localMaterials.get(o.material);
  });
  const arms = [f.getObjectByName('arm_port'), f.getObjectByName('arm_starboard')];
  const angle = THREE.MathUtils.degToRad;
  const poses = {
    stand: [-8, 16], watch: [18, 35], helm: [-62, -50],
    hold: [-38, -30], haul: [-65, -55],
  };
  const [shoulder, elbow] = poses[pose] ?? poses.stand;
  arms.forEach((a, i) => {
    a.rotation.x = angle(shoulder);
    a.rotation.z = (i ? -1 : 1) * angle(pose === 'helm' ? 7 : 4);
    a.getObjectByName('elbow').rotation.x = angle(elbow);
  });
  f.userData.crew = { pose, rank, height, lean: 0, elbow: angle(elbow),
    officer, authored: true, armLen: .595, shoulderY: 1.35,
    home: { y: 0 } };
  return f;
}
