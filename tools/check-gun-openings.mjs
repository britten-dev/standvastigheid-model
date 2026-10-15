// Every port in her side is a real opening, the side beside it is still timber, and the
// guns behind them are all there: 72 in the broadside and the four chasers when her ports
// are open, and what the level can see when they are shut.
import assert from 'node:assert/strict';
import {openHarness} from './harness.js';
const h=await openHarness();
try{
 const rows=await h.page.evaluate(async()=>{
  const {hullModel}=await import('/src/ship/hull.js'),{gunOpenings}=await import('/src/ship/gun-openings.js');
  const T=THREE,model=hullModel(),rows=[];
  for(const lod of ['cinematic','hero','game'])for(const weather of ['fair','heavy']){
   const ship=build({lod,sails:'full',weather,crew:false,batchStatic:false});ship.updateMatrixWorld(true);
   const sides=['hull_shell','inner_bulwark','lower_deck_lining'].map(n=>ship.getObjectByName(n));
   sides.forEach(o=>o.material.side=T.DoubleSide);
   const ray=new T.Raycaster(),blocked=[];
   for(const o of gunOpenings(model))for(const side of [-1,1]){
    const y=(o.y0+o.y1)/2;
    // From just off the centreline, out through the middle of the port.
    ray.set(new T.Vector3(side*.1,y,o.z),new T.Vector3(side,0,0));ray.far=8;
    if(ray.intersectObjects(sides,false).length)blocked.push({kind:o.kind,side,z:o.z});
    // A point beside the opening must still hit timber: don't delete entire strakes.
    ray.set(new T.Vector3(side*.1,y,o.z1+.12),new T.Vector3(side,0,0));
    if(!ray.intersectObjects(sides,false).length)throw Error(`Missing side beside a ${o.kind} gunport`);
   }
   let triangles=0,barrels=0,gunTriangles=0;
   const guns=ship.getObjectByName('guns');
   ship.traverse(o=>{if(!o.isMesh)return;for(const a of Object.values(o.geometry.attributes))if(!a.array.every(Number.isFinite))throw Error(`Nonfinite ${o.name}`);
    const t=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count??1);
    triangles+=t;
    if(o.name.endsWith('_barrels'))barrels+=o.count;
   });
   guns.traverse(o=>{if(o.isMesh)gunTriangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count??1);});
   const gunnery=ship.getObjectByName('guns').userData.gunnery.guns.length;
   rows.push({lod,weather,blocked,triangles,gunTriangles,barrels,gunnery});
  }return rows;
 });
 for(const r of rows){
  assert.deepEqual(r.blocked,[],`${r.lod} ${r.weather} blocked gunports`);
  // The whole armament, unless the level cannot see behind a shut lid: then it is the six
  // forecastle guns, which have no ports, and the four chasers, which stay manned.
  const expected=r.weather==='heavy'&&r.lod==='game'?10:76;
  assert.equal(r.barrels,expected,`${r.lod} ${r.weather} barrels`);
  assert.equal(r.gunnery,expected,`${r.lod} ${r.weather} gunnery record`);
  // The guns' own share of the ship's budget. The whole ship's total is printed, not
  // asserted here: it is every module's, and tools/build.js holds it to TRI_BUDGET.
  assert.ok(r.gunTriangles<(r.lod==='cinematic'?600000:r.lod==='hero'?450000:30000),JSON.stringify(r));
 }
 assert.deepEqual(h.problems.filter(p=>!/404|procedural/.test(p)),[]);console.log(JSON.stringify(rows,null,2));
}finally{await h.close();}
