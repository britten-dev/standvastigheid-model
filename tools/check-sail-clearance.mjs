import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {openHarness} from './harness.js';
const h=await openHarness();
try {
 const rows=await h.page.evaluate(async()=>{
  const T=window.THREE,{lodConfig}=await import('/src/ship/lod.js');
  const {createMotion}=await import('/src/ship/motion.js'),{createSailHandling}=await import('/src/ship/sail-handling.js');
  const {sheetPosition}=await import('/src/ship/sail-sheeting.js'),{SPEC}=await import('/src/spec/spec.js');
  const rows=[],ray=new T.Raycaster(),dir=new T.Vector3(),tmp=new T.Vector3();
  for(const lod of ['game','hero','cinematic']) {
   const cfg=lodConfig(lod),ship=window.build({lod,sails:'full',animatedSails:true,crew:false});
   const handling=createSailHandling(ship),motion=createMotion(ship),cloth=[],segments=[];
   ship.traverse(o=>{if(o.geometry?.userData.handling?.kind==='square'&&o.name.endsWith('_sail')&&!o.name.includes('cordage'))cloth.push(o);});
   const proxies=cloth.map(c=>{
    const g=new T.BufferGeometry();g.setIndex(c.geometry.index);g.setAttribute('position',c.geometry.attributes.position.clone());
    const p=new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide}));p.name=c.name;return p;
   });
   const standing=ship.getObjectByName('standing_rigging');
   for(const mesh of standing.children) {
    const p=mesh.geometry.attributes.position;
    if(mesh.isLineSegments){for(let i=0;i<p.count;i+=2)segments.push([new T.Vector3().fromBufferAttribute(p,i),new T.Vector3().fromBufferAttribute(p,i+1),mesh.name||'standing lines']);}
    else if(mesh.name==='shrouds_and_stays') {
     const ring=cfg.ropeRadial+1,stride=(cfg.ropeSegments+1)*ring;
     for(let i=0;i<p.count;i+=stride){let prev;for(let j=0;j<=cfg.ropeSegments;j++){
      const point=new T.Vector3();for(let k=0;k<cfg.ropeRadial;k++)point.add(tmp.fromBufferAttribute(p,i+j*ring+k));point.divideScalar(cfg.ropeRadial);
      if(prev)segments.push([prev,point,'shrouds and stays']);prev=point;
     }}
    }
   }
   let poses=0,tests=0,maxHeadGap=0;const failures=[];
   function check(state,angle,flutterTime=null) {
    for(const {node} of motion.parts.yards) {
     const a=T.MathUtils.clamp(T.MathUtils.degToRad(angle),-node.userData.braceLimit,node.userData.braceLimit),p=node.userData.yardPivot;
     node.rotation.y=a;node.position.x=p.mast[0]-Math.sin(a)*p.clearance;node.position.z=p.mast[2]-Math.cos(a)*p.clearance;
    }
    motion.parts.sheeting.update();ship.updateMatrixWorld(true);motion.parts.rigging.update();
    for(const c of cloth) {
     const p=c.geometry.attributes.position;
     for(let i=0;i<=cfg.sailSegments[0];i++)maxHeadGap=Math.max(maxHeadGap,c.getVertexPosition(i,tmp).distanceTo(new T.Vector3().fromBufferAttribute(p,i)));
    }
    for(let k=0;k<cloth.length;k++){
     const c=cloth[k],proxy=proxies[k],p=proxy.geometry.attributes.position;
     const entry=motion.parts.sheeting.entries.find(e=>e.mesh===c),g=c.geometry,uv=g.attributes.uv;
     const size=new T.Box3().setFromBufferAttribute(g.attributes.position).getSize(new T.Vector3());
     let hash=0;for(const letter of c.name)hash=(hash*31+letter.charCodeAt(0))>>>0;
     const phase=(hash%1000)/1000*Math.PI*2,n=new T.Vector3(),mn=new T.Vector3();
     for(let i=0;i<p.count;i++){
      if(flutterTime===null)c.getVertexPosition(i,tmp);
      else {
       entry.getVertex.call(c,i,tmp);n.fromBufferAttribute(g.attributes.normal,i);
       for(let j=0;j<(c.morphTargetInfluences?.length??0);j++)n.addScaledVector(mn.fromBufferAttribute(g.morphAttributes.normal[j],i).sub(new T.Vector3().fromBufferAttribute(g.attributes.normal,i)),c.morphTargetInfluences[j]);
       const tiles=g.userData.handling.tiles,qx=T.MathUtils.clamp((uv.getX(i)*tiles%1-.002)/.996,0,1),qy=T.MathUtils.clamp((uv.getY(i)*tiles%1-.002)/.996,0,1);
       const across=Math.max(0,Math.sin(Math.PI*qx)),down=Math.max(0,Math.sin(Math.PI*qy));
       const wave=2*Math.PI/SPEC.motion_sail_wave_length.value*qx*Math.max(2,size.x,size.z)-flutterTime*SPEC.motion_sail_wave_speed.value*2.4+phase;
       const ripple=Math.sin(wave+qy*1.4)+.32*Math.sin(wave*1.73+qy*4+phase);
       const breath=SPEC.motion_sail_breathe.value*3.6*(.7*Math.sin(flutterTime*.43+phase-qy*1.1)+.3*Math.sin(flutterTime*.79+phase*1.7-qy*2));
       const leech=T.MathUtils.lerp(1,SPEC.motion_sail_luff_shiver.value,(1-across)**3);
       // Worst-case luffing edge motion, alongside gale-strength body flutter.
       const edge=(1-across)**5*down**1.2,gust=.8+.2*Math.sin(flutterTime*.67+phase);
       const shake=Math.sin(flutterTime*6.2-qy*9+phase)+.28*Math.sin(flutterTime*6.2*1.87-qy*15+phase*1.7);
       const edgeMotion=edge*Math.sqrt(1.6)*gust*.48*shake;
       const offset=c.userData.sailSpread.value*(SPEC.motion_sail_flutter.value*1.6*across**.85*down**.8*(ripple*.16*leech+breath)+edgeMotion);
       tmp.addScaledVector(n,offset);const u=entry.uniforms;sheetPosition(tmp,u.uSheetRestFoot.value,u.uSheetFoot.value,u.uSheetTurn.value);
      }
      tmp.applyMatrix4(c.matrixWorld);p.setXYZ(i,tmp.x,tmp.y,tmp.z);
     }
     proxy.geometry.computeBoundingBox();proxy.geometry.computeBoundingSphere();
    }
    for(const [a,b,type] of segments){
     ray.set(a,dir.subVectors(b,a).normalize());ray.near=.001;ray.far=a.distanceTo(b)-.001;tests++;
     for(const hit of ray.intersectObjects(proxies,false))if(failures.length<30)failures.push({state,angle,flutterTime,type,sail:hit.object.name,at:hit.point.toArray()});
    }
    poses++;
   }
   for(const state of ['full','topsails','storm','furled']) {
    handling.setState(state,{immediate:true});for(const angle of [-55,-40,-20,0,20,40,55])check(state,angle);
   }
   handling.setState('full',{immediate:true});handling.setState('furled');
   for(let i=0;i<8;i++){handling.update(3);check(`handling-${i}`,(i%2?1:-1)*50);}
   for(const state of ['full','storm']){
    handling.setState(state,{immediate:true});for(const angle of [-55,55])for(const time of [0,2.7,8.1])check(state,angle,time);
   }
   rows.push({lod,poses,segmentTests:tests,maxHeadGap,failures,limits:motion.parts.yards.map(y=>[y.node.name,T.MathUtils.radToDeg(y.node.userData.braceLimit)])});
   motion.dispose();
  }
  return rows;
 });
 await writeFile('build/sail-clearance-check.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
 for(const row of rows){assert.equal(row.failures.length,0,JSON.stringify(row));assert.ok(row.maxHeadGap<.001);}
 assert.deepEqual(h.problems,[]);
} finally {await h.close();}
