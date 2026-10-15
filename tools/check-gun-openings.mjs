import assert from 'node:assert/strict';
import {openHarness} from './harness.js';
const h=await openHarness();
try{
 const rows=await h.page.evaluate(async()=>{
  const {hullModel}=await import('/src/ship/hull.js'),{upperGunOpenings}=await import('/src/ship/gun-openings.js');
  const T=THREE,model=hullModel(),rows=[];
  for(const lod of ['cinematic','hero','game'])for(const weather of ['fair','heavy']){
   const ship=build({lod,sails:'full',weather,crew:false});ship.updateMatrixWorld(true);
   const sides=['hull_shell','inner_bulwark'].map(n=>ship.getObjectByName(n));
   sides.forEach(o=>o.material.side=T.DoubleSide);
   const ray=new T.Raycaster(),blocked=[];
   for(const o of upperGunOpenings(model))for(const side of [-1,1]){
    const y=(o.y0+o.y1)/2;
    ray.set(new T.Vector3(side*.1,y,o.z),new T.Vector3(side,0,0));ray.far=8;
    if(ray.intersectObjects(sides,false).length)blocked.push({side,z:o.z});
    // A point beside the opening must still hit timber: don't delete entire strakes.
    ray.set(new T.Vector3(side*.1,y,o.z1+.12),new T.Vector3(side,0,0));
    if(!ray.intersectObjects(sides,false).length)throw Error('Missing side beside gunport');
   }
   let triangles=0,barrels=0;
   ship.traverse(o=>{if(!o.isMesh)return;for(const a of Object.values(o.geometry.attributes))if(!a.array.every(Number.isFinite))throw Error(`Nonfinite ${o.name}`);
    triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count??1);
    if(o.name.endsWith('_barrels'))barrels+=o.count;
   });
   rows.push({lod,weather,blocked,triangles,barrels});
  }return rows;
 });
 for(const r of rows){assert.deepEqual(r.blocked,[],`${r.lod} ${r.weather} blocked gunports`);assert.equal(r.barrels,40);assert.ok(r.triangles<(r.lod==='cinematic'?1600000:r.lod==='hero'?960000:84000),JSON.stringify(r));}
 assert.deepEqual(h.problems,[]);console.log(JSON.stringify(rows,null,2));
}finally{await h.close();}
