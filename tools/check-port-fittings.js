import assert from 'node:assert/strict';
import { openHarness } from './harness.js';
const h = await openHarness();
try {
 const report = await h.page.evaluate(async () => {
  const T = window.THREE;
  const { portLid, batchPortLids } = await import('/src/ship/port-fittings.js');
  const { portLayout, makePortCutter } = await import('/src/ship/ports.js');
  const { hullModel, buildHull } = await import('/src/ship/hull.js');
  const { makeMaterials } = await import('/src/ship/materials.js');
  const { lodConfig } = await import('/src/ship/lod.js');
  const { SPEC } = await import('/src/spec/spec.js');
  const issues=[], rows=[];
  const check=(ok, message)=>{if(!ok)issues.push(message);};
  for(const lod of ['cinematic','hero','game']) {
   const cfg=lodConfig(lod),mats=makeMaterials(cfg),model=hullModel(),ports=portLayout(model);
   buildHull(cfg,mats,model,{skipQuad:makePortCutter(model,ports)});
   const assemblies=[];
   for(const p of ports)for(const side of [1,-1]) {
    const open=portLid(cfg,mats,model,p,side,false),shut=portLid(cfg,mats,model,p,side,true);
    const label=`${lod}/${side}/${p.index}`;
    const a=open.userData.portLid,b=shut.userData.portLid;
    check(a.width===b.width&&a.height===b.height,`${label}: lid changes size when raised`);
    check(a.innerNormal[1]<-.7,`${label}: inner face does not face down when raised`);
    check(b.innerNormal[0]*side<-.7,`${label}: inner face is outside when shut`);
    const z0=p.cutZ0??p.z-p.width/2,z1=p.cutZ1??p.z+p.width/2;
    // Shoot through the actual quantised aperture. A closed lid must block every
    // sampled ray, including near the four edges, on both sides and at phone LOD.
    for(const fz of [.015,.25,.5,.75,.985])for(const fy of [.015,.25,.5,.75,.985]){
     const z=z0+(z1-z0)*fz,f=model.featureYAt(z),y=f.port_sill+(f.port_head-f.port_sill)*fy;
     const origin=new T.Vector3(side*12,y,z),dir=new T.Vector3(-side,0,0);
     const hits=new T.Raycaster(origin,dir).intersectObject(shut,true);
     check(hits.length>0,`${label}: unsealed aperture at ${fz},${fy}`);
    }
    for(const root of [open,shut]){
     const moving=root.getObjectByName('lid');
     moving.updateMatrix();
     const spans=root.children.filter(o=>o.name==='port_lifting_span');
     const rings=moving.children.filter(o=>o.name==='lifting_ring');
     check(spans.length===(cfg.portFittings?2:0),`${label}: missing lifting spans`);
     for(let i=0;i<spans.length;i++){
      const attr=spans[i].geometry.attributes.position;
      const centre=new T.Vector3();
      // TubeGeometry duplicates the closing radial vertex; omit that duplicate.
      for(let r=0;r<cfg.ropeRadial;r++)centre.add(new T.Vector3().fromBufferAttribute(attr,r));
      centre.divideScalar(cfg.ropeRadial);
      const ringTip=rings[i].position.clone().add(new T.Vector3(SPEC.gunport_lift_ring_diameter.value/2,0,0)).applyMatrix4(moving.matrix);
      check(centre.distanceTo(ringTip)<1e-5,`${label}: rope detached from ring`);
     }
    }
    assemblies.push(shut);
   }
   const batch=batchPortLids(assemblies);
   check(batch.length===(cfg.portFittings?4:2),`${lod}: unbatched small fittings`);
   let triangles=0,negativeFaces=0;
   for(const mesh of batch){
    const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index;
    const count=idx?.count??p.count;
    triangles+=count/3;
    for(const attr of Object.values(g.attributes))check(attr.array.every(Number.isFinite),`${lod}: nonfinite geometry`);
    for(let i=0;i<count;i+=3){
     const ids=[0,1,2].map(k=>idx?idx.getX(i+k):i+k),v=ids.map(j=>new T.Vector3().fromBufferAttribute(p,j));
     const cross=v[1].sub(v[0]).cross(v[2].sub(v[0]));
     const normal=new T.Vector3();ids.forEach(j=>normal.add(new T.Vector3().fromBufferAttribute(n,j)));
     if(cross.dot(normal)<-1e-9)negativeFaces++;
    }
   }
   check(negativeFaces===0,`${lod}: ${negativeFaces} faces reversed after port-side mirroring`);
   rows.push({lod,lids:assemblies.length,batches:batch.length,triangles,negativeFaces});
  }
  return {rows,issues};
 });
 console.log(JSON.stringify(report,null,2));
 assert.deepEqual(report.issues,[]);
 assert.deepEqual(h.problems,[]);
}finally{await h.close();}
