import assert from 'node:assert/strict';
import * as T from 'three';
import { hullSideDetails } from '../src/ship/hull-side-details.js';
import { hullModel } from '../src/ship/hull.js';
import { lodConfig, TRI_BUDGET } from '../src/ship/lod.js';
import { openHarness } from './harness.js';

const model=hullModel();
for(const lod of ['cinematic','hero','game','distant']) {
 const cfg=lodConfig(lod),sections=[];
 for(let i=0;i<cfg.hullStations;i++) {
  const t=i/(cfg.hullStations-1),e=.5-.5*Math.cos(t*Math.PI);
  const z=model.zFwd+(model.zAft-model.zFwd)*(t*.45+e*.55);
  sections.push({z,points:model.sectionAt(z,cfg.hullPoints)});
 }
 const g=hullSideDetails(cfg,sections);
 if(lod==='distant'){assert.equal(g,null);continue;}
 for(const a of Object.values(g.attributes))assert.ok(a.array.every(Number.isFinite));
 const edges=new Map(),pos=g.attributes.position,index=g.index;
 const key=i=>[pos.getX(i),pos.getY(i),pos.getZ(i)].map(x=>x.toFixed(5)).join(',');
 for(let i=0;i<index.count;i+=3)for(let j=0;j<3;j++) {
  const a=key(index.getX(i+j)),b=key(index.getX(i+(j+1)%3)),e=[a,b].sort().join('|');
  edges.set(e,(edges.get(e)??0)+1);
 }
 assert.ok([...edges.values()].every(n=>n===2),'closed joinery including buried end grain');

 g.computeBoundingBox();assert.ok(Math.abs(g.boundingBox.min.x+g.boundingBox.max.x)<1e-5);
 const mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld();
 const f=model.featureYAt(0),y=(f.wale_bottom+f.wale_top)/2;
 for(const side of [-1,1]) {
  const hits=new T.Raycaster(new T.Vector3(side*7,y,0),new T.Vector3(-side,0,0)).intersectObject(mesh);
  assert.ok(hits.length,'both outer faces must be visible');
  assert.ok(hits[0].face.normal.x*side>.7,'correct outward winding on both sides');
  assert.ok(Math.abs(hits[0].point.x)>model.halfBreadthAt(0,y)+.075,'wale must project from the hull');
 }
 assert.ok(Math.max(...g.attributes.uv.array.filter((_,i)=>i%2))<.79,'all added timber stays below gunport openings');
 g.dispose();mesh.material.dispose();
}
const h=await openHarness();
try {
 const rows=await h.page.evaluate(()=>{
  const rows=[];
  for(const lod of ['cinematic','hero','game'])for(const weather of ['fair','heavy']) {
   const ship=build({lod,sails:'full',weather,crew:false}),part=ship.getObjectByName('hull_side_joinery');
   if(!part?.userData.hullWetProfile)throw new Error('Raised timber must share the hull water-contact profile');
   if(part.userData.bands.length!==(lod==='game'?1:2))throw new Error('Wrong quality tier');
   rows.push({lod,weather,bands:part.userData.bands,triangles:window.stats({lod,sails:'full',weather,crew:false}).tris});
  }
  return rows;
 });
 for(const r of rows){assert.ok(r.triangles<(r.lod==='cinematic'?1600000:r.lod==='hero'?960000:84000));
  const crew=r.lod==='game'?4648:299096;assert.ok(r.triangles+crew<TRI_BUDGET[r.lod][1]);}
 assert.deepEqual(h.problems,[]);console.log(JSON.stringify(rows,null,2));
}finally{await h.close();}
