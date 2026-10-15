import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {openHarness} from './harness.js';
const h=await openHarness();
try {
 const report=await h.page.evaluate(async()=>{
  const T=window.THREE;
  const {createMotion}=await import('/src/ship/motion.js');
  const {createSailHandling}=await import('/src/ship/sail-handling.js');
  const {mastGeometry}=await import('/src/ship/rig.js');
  const {hullModel}=await import('/src/ship/hull.js');
  const {createDetailLOD}=await import('/src/ship/detail-lod.js');
  const geo=mastGeometry(hullModel()),report=[];
  for(const lod of ['game','cinematic']) {
   const ship=window.build({lod,sails:'full',animatedSails:true,crew:false});
   const handling=createSailHandling(ship),motion=createMotion(ship),rig=motion.parts.rigging;
   const mesh=rig.mesh,g=mesh.geometry,t=g.attributes.aRopeT,free=g.attributes.aRopeFreedom;
   let time=0,maxGap=0,checks=0,updateMs=0;
   const inverse=new T.Matrix4(),at=new T.Vector3(),actual=new T.Vector3(),tmp=new T.Vector3();
   function check() {
    ship.updateMatrixWorld(true);inverse.copy(mesh.matrixWorld).invert();
    for(const r of rig.bindings)for(const [end,binding,rest] of [[0,r.from,r.restA],[1,r.to,r.restB]]) {
     if(binding) {
      if(binding.vertex!==undefined)binding.node.getVertexPosition(binding.vertex,at);else at.copy(binding.point);
      at.applyMatrix4(binding.node.matrixWorld).applyMatrix4(inverse);
     }else at.copy(rest);
     const ids=[];for(let i=r.start;i<r.start+r.count;i++)if(Math.abs(t.getX(i)-end)<1e-6)ids.push(i);
     if(mesh.isMesh)ids.pop(); // tube seam duplicates the first radial vertex
     actual.set(0,0,0);
     for(const i of ids){actual.add(tmp.fromBufferAttribute(g.attributes.position,i));if(free.getX(i)!==0)throw Error('An attachment can sway');}
     actual.divideScalar(ids.length);maxGap=Math.max(maxGap,actual.distanceTo(at));checks++;
    }
   }
   for(const [state,wind,seconds] of [['full',75,25],['furled',280,9],['full',280,8],['furled',90,30],['storm',280,30]]) {
    handling.setState(state);
    for(let i=0;i<seconds*4;i++) {
     handling.update(.25);time+=.25;
     ship.position.set(17,2,-9);ship.rotation.set(.12,1.3,-.21);ship.updateMatrixWorld(true);
     const began=performance.now();motion.update(time,{windSpeed:28,windDeg:wind});updateMs+=performance.now()-began;
     if(i%4===0)check();
    }
   }
   if(![...g.attributes.position.array].every(Number.isFinite))throw Error('Nonfinite rope');
   let aboveTruck=0;
   for(const r of rig.bindings.filter(r=>r.label.endsWith(':lift'))) {
    const mast=geo[r.from.node.name==='crossjack_yard'?'mizzen':r.from.node.name.split('_')[0]];
    aboveTruck=Math.max(aboveTruck,r.restB.y-mast.along(mast.truckH).y);
   }
   const robands=[];ship.traverse(o=>{if(o.name.endsWith('_robands'))robands.push(o);});
   if(robands.length!==(lod==='cinematic'?8:0))throw Error('Wrong yard lashings for detail level');
   for(const tie of robands){
    if(!tie.parent.name.endsWith('_yard'))throw Error('Lashing is not carried by its yard');
    if(!tie.geometry.attributes.position.array.every(Number.isFinite))throw Error('Nonfinite lashing');
   }
   const detail=createDetailLOD(ship),camera=new T.PerspectiveCamera(50,1,.1,2000);
   camera.position.set(0,100,1500);camera.updateMatrixWorld();detail.update(camera,1000);
   if(robands.some(t=>t.layers.mask!==0))throw Error('Distant lashings waste draw calls');
   if(robands.length){
    robands[0].getWorldPosition(camera.position);camera.position.z+=2;
    camera.updateMatrixWorld();detail.update(camera,1000);
    if(!robands[0].layers.mask)throw Error('Close lashings were not restored');
   }
   // Moving across the sea must not accelerate the flutter phase of a rope.
   const phase=()=>{
    const p=new T.Vector4(3,24,-5,1).applyMatrix4(ship.matrixWorld);
    return motion.uniforms.uShipRowX.value.dot(p)*1.3+motion.uniforms.uShipRowZ.value.dot(p)*.7;
   };
   const originalPhase=phase();ship.position.add(new T.Vector3(800,3,-1200));
   motion.update(time,{windSpeed:28,windDeg:280});
   if(Math.abs(phase()-originalPhase)>1e-6)throw Error('Travel over the sea changes rig flutter');
   report.push({lod,bindings:rig.bindings.length,checks,maxGap,aboveTruck,
    lashings:robands.reduce((n,t)=>n+t.geometry.userData.robandCount,0),meanMotionMs:updateMs/(time*4)});
   detail.dispose();
   motion.dispose();
  }
  // Static export suits must not retain a sheet attached to an absent sail.
  for(const sails of ['topsails','storm','furled']) {
   const ship=window.build({lod:'hero',sails,crew:false}),motion=createMotion(ship);
   motion.update(1,{windDeg:280});report.push({sails,bindings:motion.parts.rigging.bindings.length});motion.dispose();
  }
  return report;
 });
 for(const row of report.filter(r=>r.lod)){
  assert.ok(row.bindings>=48);assert.ok(row.maxGap<.0001,`floating endpoint ${row.maxGap}m`);assert.equal(row.aboveTruck,0);
 }
 assert.deepEqual(h.problems,[]);
 await writeFile('build/rigging-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await h.close();}
