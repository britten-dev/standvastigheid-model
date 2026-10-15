import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {openHarness} from './harness.js';
const h=await openHarness();
try{
 const report=await h.page.evaluate(async()=>{
  const T=window.THREE,{hullModel}=await import('/src/ship/hull.js'),{SPEC}=await import('/src/spec/spec.js'),m=hullModel(),rows=[];
  for(const lod of ['distant','game','hero','cinematic']){
   const s=window.build({lod,crew:false});s.updateMatrixWorld(true);
   const shell=s.getObjectByName('stern_shell'),r=new T.Raycaster(),checks=[];
   for(const name of ['gundeck','quarterdeck']){
    const deck=s.getObjectByName(name),g=deck.geometry,b=new T.Box3().setFromObject(deck);
    let missing=0,probes=0,maxError=0;
    const base=name==='gundeck'?m.featureYAt(m.zAft).deck:m.standingDeckAt(m.zAft);
    for(let j=0;j<25;j++){
     const z=T.MathUtils.lerp(m.zAft-.45,b.max.z-.18,j/24);
     r.set(new T.Vector3(10,base+.045,z),new T.Vector3(-1,0,0));
     const side=r.intersectObject(shell)[0];if(!side)continue;
     for(const f of [-.85,-.4,0,.4,.85]){
      const x=side.point.x*f;r.set(new T.Vector3(x,8,z),new T.Vector3(0,-1,0));
      const hit=r.intersectObject(deck)[0];probes++;if(!hit){missing++;continue;}
      const station=Math.min(z,m.zAft),edge=name==='gundeck'?m.featureYAt(station).deck:m.standingDeckAt(station);
      const width=m.halfBreadthAt(station,edge),want=edge+SPEC.deck_camber.value*(1-(x/width)**2);
      maxError=Math.max(maxError,Math.abs(hit.point.y-want));
     }
    }
    checks.push({name,probes,missing,maxError,aft:b.max.z,sternpost:m.zAft});
    if(![...g.attributes.position.array,...g.attributes.normal.array,...g.attributes.uv.array].every(Number.isFinite))throw Error('Nonfinite deck');
   }
   const cabin=s.getObjectByName('stern').userData.cabin;
   let intrusion=0;
   if(cabin){const qd=s.getObjectByName('quarterdeck');
    for(const x of [-cabin.width*.4,0,cabin.width*.4])for(const z of [cabin.front+.3,cabin.rear-.3]){
     r.set(new T.Vector3(x,8,z),new T.Vector3(0,-1,0));const hit=r.intersectObject(qd)[0];
     if(!hit)throw Error('Cabin has no deck over it');intrusion=Math.max(intrusion,cabin.ceiling-hit.point.y);
    }
    if(cabin.head>=cabin.ceiling)throw Error('Windows extend above cabin ceiling');
   }
   rows.push({lod,checks,cabinIntrusion:intrusion});
  }return rows;
 });
 for(const r of report)for(const c of r.checks){assert.ok(c.probes>=80);assert.equal(c.missing,0);assert.ok(c.aft-c.sternpost>1.5);assert.ok(c.maxError<.015,`camber continuity ${c.maxError}`);}
 assert.ok(report.every(r=>r.cabinIntrusion===0));assert.deepEqual(h.problems,[]);
 await writeFile('build/afterdeck-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await h.close();}
