import assert from 'node:assert/strict';
import * as T from 'three';
import { hullSideDetails } from '../src/ship/hull-side-details.js';
import { hullModel, V } from '../src/ship/hull.js';
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
 const f=model.featureYAt(0);
 // Both wales: the main wale about the waterline and the middle wale between the tiers.
 for(const y of [(f.wale_bottom+f.wale_top)/2,(f.middle_wale_bottom+f.middle_wale_top)/2])for(const side of [-1,1]) {
  const hits=new T.Raycaster(new T.Vector3(side*10,y,0),new T.Vector3(-side,0,0)).intersectObject(mesh);
  assert.ok(hits.length,'both outer faces must be visible');
  assert.ok(hits[0].face.normal.x*side>.7,'correct outward winding on both sides');
  assert.ok(Math.abs(hits[0].point.x)>model.halfBreadthAt(0,y)+.1,'wale must project from the hull');
 }
 // Timber stays clear of both tiers of ports: nothing between a sill and its head.
 const vs=g.attributes.uv.array.filter((_,i)=>i%2);
 for(const v of vs){
  assert.ok(!(v>V.lower_port_sill+1e-4&&v<V.lower_port_head-1e-4),'timber across the lower ports');
  assert.ok(!(v>V.port_sill+1e-4&&v<V.port_head-1e-4),'timber across the upper ports');
 }
 g.dispose();mesh.material.dispose();
}
const h=await openHarness();
try {
 const rows=await h.page.evaluate(()=>{
  const rows=[];
  for(const lod of ['cinematic','hero','game'])for(const weather of ['fair','heavy']) {
   const ship=build({lod,sails:'full',weather,crew:false}),part=ship.getObjectByName('hull_side_joinery');
   if(!part?.userData.hullWetProfile)throw new Error('Raised timber must share the hull water-contact profile');
   if(part.userData.bands.length!==2)throw new Error('Both wales at every tier that has joinery');
   rows.push({lod,weather,bands:part.userData.bands,triangles:window.stats({lod,sails:'full',weather,crew:false}).tris});
  }
  return rows;
 });
 for(const r of rows)assert.ok(r.triangles<=TRI_BUDGET[r.lod][1],`${r.lod}/${r.weather}: ${r.triangles} triangles over budget`);
 assert.deepEqual(h.problems,[]);console.log(JSON.stringify(rows,null,2));
}finally{await h.close();}
