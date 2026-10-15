import assert from 'node:assert/strict';
import * as T from 'three';
import { windowStrip } from '../src/ship/window-joinery.js';
import { openHarness } from './harness.js';

// Closed, outward-facing joinery must keep its real thickness after mirroring.
for (const side of [1, -1]) {
  const g = windowStrip((u,v,d) => new T.Vector3(u*side,v,d),0,.05,0,1,
    {base:.008,top:.1,flip:side<0});
  const edges = new Map(), p = g.attributes.position, index = g.index;
  const key = i => [p.getX(i),p.getY(i),p.getZ(i)].map(x=>x.toFixed(6)).join(',');
  let volume = 0;
  for (let i=0;i<index.count;i+=3) {
    const ids=[0,1,2].map(k=>index.getX(i+k)), v=ids.map(j=>new T.Vector3().fromBufferAttribute(p,j));
    volume+=v[0].dot(v[1].cross(v[2]))/6;
    for(let k=0;k<3;k++){const a=key(ids[k]),b=key(ids[(k+1)%3]),e=[a,b].sort().join('|');edges.set(e,(edges.get(e)??0)+1);}
  }
  assert.ok(volume>.004 && volume<.005);
  assert.ok([...edges.values()].every(n=>n===2),'joinery must be a closed solid');
  const mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld();
  assert.ok(new T.Raycaster(new T.Vector3(side*.025,.5,.3),new T.Vector3(0,0,-1)).intersectObject(mesh).length);
}
const h=await openHarness();
try {
  const report=await h.page.evaluate(()=>{
    const rows=[];
    for(const lod of ['cinematic','hero','game'])for(const weather of ['fair','heavy']) {
      const ship=build({lod,sails:'full',weather,crew:false}),parts=[];
      ship.traverse(o=>{
        if(!o.isMesh||!/^(stern_light_frames|quarter_gallery_frames|stern_glazing_bars|quarter_gallery_glazing_bars|stern_munions|stern_pane_bedding)$/.test(o.name))return;
        for(const a of Object.values(o.geometry.attributes))if(!a.array.every(Number.isFinite))throw new Error('Nonfinite joinery');
        parts.push({name:o.name,solid:o.userData.solidJoinery,triangles:(o.geometry.index?.count??o.geometry.attributes.position.count)/3});
      });
      const frames=parts.filter(p=>p.name.endsWith('_frames'));
      if(frames.length!==3||frames.some(p=>p.solid!==(lod!=='game')))throw new Error('Missing frames or wrong detail tier');
      const bed=ship.getObjectByName('stern_pane_bedding');
      if(!!bed!==(lod!=='game'))throw new Error('Pane bedding must follow the close-detail tier');
      if(bed&&bed.userData.panes!==42)throw new Error('Every individual stern pane needs its own edge');
      for(const name of ['stern_name','stern_carving']){
        const o=ship.getObjectByName(name);if(!o)continue;
        if(!o.geometry.attributes.uv1?.array.every(Number.isFinite))throw new Error('Missing physical gilt coordinates');
        if(![o.material.map,o.material.normalMap,o.material.roughnessMap].every(m=>m?.channel===1))throw new Error('Gilt finish is missing its close maps');
      }
      rows.push({lod,weather,parts,triangles:window.stats({lod,sails:'full',weather,crew:false}).tris});
    }
    return rows;
  });
  for(const r of report)assert.ok(r.triangles<(r.lod==='cinematic'?1600000:r.lod==='hero'?960000:84000));
  assert.deepEqual(h.problems,[]);console.log(JSON.stringify(report,null,2));
} finally {await h.close();}
