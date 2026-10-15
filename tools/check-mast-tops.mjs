import assert from 'node:assert/strict';
import {openHarness} from './harness.js';
const h=await openHarness();
try{
 const rows=await h.page.evaluate(async()=>{
  const T=window.THREE,{mastGeometry}=await import('/src/ship/rig.js'),{hullModel}=await import('/src/ship/hull.js');
  const {createDetailLOD}=await import('/src/ship/detail-lod.js');
  const {mastTopAnchor}=await import('/src/ship/mast-tops.js'),{SPEC}=await import('/src/spec/spec.js');
  const geo=mastGeometry(hullModel()),rows=[];
  for(const lod of ['cinematic','hero','game','distant']){
   const ship=window.build({lod,sails:'furled',crew:false,adaptiveDetail:true});ship.updateMatrixWorld(true);
   const detail=createDetailLOD(ship),camera=new T.PerspectiveCamera(50,1,.1,10000);
   for(const distant of [false,true]){
    detail.setEnabled(distant);camera.position.set(0,100,2000);camera.updateMatrixWorld();detail.update(camera,960);
    for(const m of geo.masts){
     const top=ship.getObjectByName(`${m.name}_top`),l=top.userData.topLayout,frame=top.getObjectByName('top_rim_trestles_crosstrees_and_rail');
     const ray=new T.Raycaster(),centerZ=(l.holeFore+l.holeAft)/2,passage=l.holeWidth/2-l.beamX-l.beamWidth/2;
     if(passage<.4)throw Error(`${lod} ${m.name}: a person cannot pass beside the trestletree: ${passage}`);
     for(const side of [-1,1])for(const f of [.25,.5,.75]){
      const x=side*(l.beamX+l.beamWidth/2+passage*f),p=top.localToWorld(new T.Vector3(x,2,centerZ));
      ray.set(p,new T.Vector3(0,-1,0));ray.far=4;
      if(ray.intersectObject(top,true).length)throw Error(`${lod} ${m.name}: lubber's hole blocked (${side},${f},far:${distant})`);
     }
     ray.set(top.localToWorld(new T.Vector3(l.B*.35,2,centerZ)),new T.Vector3(0,-1,0));
     if(!ray.intersectObject(top.getObjectByName('top_deal_floor')).length)throw Error('Missing floor beside hole');
     ray.set(top.localToWorld(new T.Vector3(l.beamX,2,centerZ)),new T.Vector3(0,-1,0));
     if(!ray.intersectObject(frame).length)throw Error('Missing load-bearing trestletree');
     let triangles=0;top.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
      for(const a of Object.values(o.geometry.attributes))if(!a.array.every(Number.isFinite))throw Error('Invalid top geometry');}});
     // The actual bore pair's upper silhouette and physical strop end meet the
     // world-space shroud foot. Check all pairs after nontrivial ship transforms.
     if(!distant&&lod!=='game'&&lod!=='distant'){
      ship.rotation.set(.2,.7,-.1);ship.position.set(23,-2,41);ship.updateMatrixWorld(true);
      const strop=top.getObjectByName('topmast_deadeye_strops'),p=strop.geometry.attributes.position;
      const ropes=ship.getObjectByName('shrouds_and_stays'),rp=ropes.geometry.attributes.position;
      const n=SPEC[`${m.name}_topmast_shroud_pairs`].value;
      for(const side of [-1,1])for(let i=0;i<n;i++){
       const a=mastTopAnchor(m,side,i,n,l.thickness),expected=ship.localToWorld(a.shroud.clone());
       let min=Infinity;const v=new T.Vector3();
       for(let k=0;k<p.count;k++)min=Math.min(min,strop.localToWorld(v.fromBufferAttribute(p,k)).distanceTo(expected));
       if(min>.022)throw Error(`Detached deadeye strop: ${min}`);
       min=Infinity;for(let k=0;k<rp.count;k++)min=Math.min(min,ropes.localToWorld(v.fromBufferAttribute(rp,k)).distanceTo(expected));
       if(min>.022)throw Error(`Floating topmast shroud: ${min}`);
      }
      ship.rotation.set(0,0,0);ship.position.set(0,0,0);ship.updateMatrixWorld(true);
     }
     rows.push({lod,mast:m.name,distant,hole:[l.holeWidth,l.holeDepth],clearPassage:passage,triangles,total:detail.stats.selectedTriangles});
    }
   }detail.dispose();
  }return rows;
 });
 assert.equal(rows.length,24);assert.deepEqual(h.problems,[]);console.log(JSON.stringify(rows,null,2));
 console.log('Library totals',await h.page.evaluate(()=>Object.fromEntries(['cinematic','hero','game','distant'].map(lod=>[lod,window.stats({lod,sails:'full',crew:true})]))));
}finally{await h.close();}
