import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from '../util/loft.js';
import { detailChoice } from './detail-lod.js';
import { ropeTube } from '../util/solids.js';
import {laidRopeUV} from './rope-finish.js';

// Steel, 1794: served slings, 13–15 turns per mast woolding and wooden
// rope-strapped blocks. Placement and small dimensions are reconstruction.
function strand(points, radius, steps=64, radial=6, physical=true) {
  const c=new THREE.CatmullRomCurve3(points);
  const g=ropeTube(c,radius,{tubular:steps,radial});
  return physical?laidRopeUV(g,c,radius):g;
}
function batch(parent,geometries,material,name) {
  if(!geometries.length) return;
  const mesh=new THREE.Mesh(mergeGeometries(geometries),material);
  mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

/** Geometry is local to the actual mast, so taper, rake and motion stay shared. */
export function mastWooldings(m,cfg,mats,radiusAt) {
  const group=new THREE.Group();group.name=`${m.name}_mast_wooldings`;
  if(cfg.textureSize<2048) return group;
  const ropes=[],hoops=[],coarse=[];
  const count=m.name==='main'?10:m.name==='fore'?9:1;
  for(let k=0;k<count;k++) {
    const h=count===1?m.houndsH-.65:3+(m.houndsH-4)*k/(count-1);
    const r=radiusAt(h/m.lowerLength), cord=.012;
    const points=[];
    for(let j=0;j<=13*24;j++) {
      const a=j/24*Math.PI*2;
      points.push(new THREE.Vector3((r+cord)*Math.cos(a),h+(j/(13*24)-.5)*13*cord*2.05,(r+cord)*Math.sin(a)));
    }
    ropes.push(strand(points,cord,13*24));
    if(cfg.adaptiveDetail) {
      // The served band stays on the mast; individual turns resolve only near it.
      coarse.push(new THREE.CylinderGeometry(r+cord*1.6,r+cord*1.6,13*cord*2.05,16,1,true).translate(0,h,0));
    }
    for(const side of [-1,1]) {
      const hoop=new THREE.CylinderGeometry(r+.010,r+.010,.027,32,1,true);
      hoop.translate(0,h+side*.18,0);hoops.push(hoop);
    }
  }
  const served=batch(group,ropes,mats.standingRigging,'served_mast_wooldings');
  if(cfg.adaptiveDetail)detailChoice(served,.024,mergeGeometries(coarse));
  batch(group,hoops,mats.iron,'mast_hoops');
  return group;
}

/** Served eyes and sling collars are attached to the bracing yard itself. */
export function yardBindings(length,diameter,cfg,mats) {
  const root=new THREE.Group();root.name='yard_served_slings';
  if(cfg.textureSize<2048) return root;
  const rope=[],cleats=[],coarse=[];
  for(const side of [-1,1]) {
    const x=side*diameter*1.1;
    for(let turn=0;turn<6;turn++) {
      const points=[];
      for(let j=0;j<=24;j++) {
        const a=j/24*Math.PI*2;
        points.push(new THREE.Vector3(x+(turn-2.5)*.024,(diameter*.5+.017)*Math.sin(a),(diameter*.5+.017)*Math.cos(a)));
      }
      rope.push(strand(points,.0115,24,5));
    }
    if(cfg.adaptiveDetail) {
      const band=new THREE.CylinderGeometry(diameter*.5+.025,diameter*.5+.025,.144,12,1,true);
      band.rotateZ(Math.PI/2);band.translate(x,0,0);coarse.push(band);
    }
    const stop=new RoundedBoxGeometry(.055,diameter*.35,diameter*.55,2,.008);
    stop.translate(x+side*.14,diameter*.47,0);cleats.push(stop);
  }
  const served=batch(root,rope,mats.standingRigging,'served_yard_collars');
  if(cfg.adaptiveDetail)detailChoice(served,.023,mergeGeometries(coarse));
  batch(root,cleats,mats.timber,'yard_sling_cleats');
  return root;
}

/** Open cheeks, sheave, axle and an external rope strop; the gap is real. */
export function woodenLeadBlock(cfg,mats) {
  const root=new THREE.Group();root.name='halliard_lead_block';
  const wood=[],iron=[],rope=[];
  for(const side of [-1,1]) {
    wood.push(new RoundedBoxGeometry(.044,.24,.15,3,.023).translate(side*.051,0,0));
  }
  const sheave=new THREE.CylinderGeometry(.082,.082,.041,24);sheave.rotateZ(Math.PI/2);
  wood.push(sheave);
  const axle=new THREE.CylinderGeometry(.014,.014,.156,12);axle.rotateZ(Math.PI/2);iron.push(axle);
  const strop=[];
  for(let j=0;j<=64;j++) {
    const a=j/64*Math.PI*2;
    strop.push(new THREE.Vector3(.077*Math.cos(a),.145*Math.sin(a),0));
  }
  rope.push(strand(strop,.012,64));
  batch(root,wood,mats.timber,'block_cheeks_and_sheave');
  batch(root,iron,mats.iron,'block_axle');
  batch(root,rope,mats.standingRigging,'block_strop');
  root.userData.rigDetail=true;
  return root;
}

/** A pin's crossed turns and a hung working hank, rather than a flat spiral. */
export function belayedHank(x,y,z,radius,seed=0,coarse=false) {
  const rope=[];
  for(let turn=0;turn<(coarse?1:3);turn++) {
    const points=[];
    for(let i=0;i<=32;i++) {
      const a=i/32*Math.PI*2;
      points.push(new THREE.Vector3(x+Math.sin(a)*(radius+.013),y+.083*Math.cos(a),z+Math.sin(a*2)*.028+(turn-1)*.013));
    }
    rope.push(strand(points,coarse?.015:.009,coarse?12:32,coarse?3:6,false));
  }
  for(let turn=0;turn<(coarse?2:4);turn++) {
    const points=[];
    for(let j=0;j<=32;j++) {
      const a=j/32*Math.PI*2;
      points.push(new THREE.Vector3(x+(.088+turn*.009)*Math.sin(a)+.014*Math.sin(a*2+seed),
        y-.27+(.24+turn*.009)*Math.cos(a),z+.09+turn*.017+.018*Math.sin(a*3+seed)));
    }
    rope.push(strand(points,coarse?.015:.009,coarse?12:32,coarse?3:6,false));
  }
  if(!coarse)rope.push(strand([new THREE.Vector3(x,y+.03,z+.026),new THREE.Vector3(x+.035,y-.02,z+.07),new THREE.Vector3(x,y-.035,z+.12)],.009,12,6,false));
  return mergeGeometries(rope);
}
