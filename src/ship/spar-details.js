import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from '../util/loft.js';
import {ropeTube} from '../util/solids.js';
import {detailChoice} from './detail-lod.js';
import {laidRopeUV} from './rope-finish.js';

function batch(root,parts,material,name,cfg,feature=0){
 if(!parts.length)return;
 const g=mergeGeometries(parts);for(const p of parts)p.dispose();
 const mesh=new T.Mesh(g,material);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;
 if(feature&&cfg.adaptiveDetail)detailChoice(mesh,feature);
 root.add(mesh);return mesh;
}
function rope(points,r=.012,steps=16,radial=5){
 const c=new T.CatmullRomCurve3(points);
 return laidRopeUV(ropeTube(c,r,{tubular:steps,radial}),c,r);
}
function band(radius,width,radial=24){
 // A solid section gives both edges a highlight, unlike the former open skin.
 const shape=new T.Shape();shape.moveTo(radius-.008,-width/2);shape.lineTo(radius,-width/2);
 shape.lineTo(radius,width/2);shape.lineTo(radius-.008,width/2);shape.closePath();
 return new T.LatheGeometry(shape.getPoints(1),radial);
}

/** Local to the lower mast; small dimensions are a period-informed reconstruction. */
export function mastConstruction(m,cfg,mats,radiusAt){
 const root=new T.Group();root.name=`${m.name}_mast_construction`;
 if(cfg.textureSize<2048)return root;
 const timber=[],iron=[],seams=[];
 if(m.name!=='mizzen'){
  // Fine longitudinal joints in the built-up spar, disappearing under its wooldings.
  const start=Math.max(m.deckH+.15,0),end=m.houndsH-.12;
  for(const angle of [-Math.PI*.8,-Math.PI*.2,Math.PI*.2,Math.PI*.8]){
   const points=[];for(let i=0;i<=20;i++){
    const h=T.MathUtils.lerp(start,end,i/20),r=radiusAt(h/m.lowerLength)+.001;
    points.push(new T.Vector3(Math.cos(angle)*r,h,Math.sin(angle)*r));
   }
   seams.push(rope(points,.0023,20));
  }
 }
 // Cheeks support the trestletrees, with shouldered lower ends.
 for(const side of [-1,1]){
  const h=m.houndsH-.7,r=radiusAt(h/m.lowerLength);
  const cheek=new RoundedBoxGeometry(m.lowerDia*.24,1.45,m.lowerDia*.58,1,.035);
  cheek.translate(side*(r-.025),h,0);timber.push(cheek);
 }
 // Black masthead straps and flush bolt heads.
 const half=m.lowerDia*.82/2;
 for(const f of [.24,.63,.91]){
  const h=m.houndsH+m.lowerHead*f;
  for(const side of [-1,1]){
   iron.push(new T.BoxGeometry(half*2+.018,.052,.015).translate(0,h,side*(half+.004)));
   iron.push(new T.BoxGeometry(.015,.052,half*2+.018).translate(side*(half+.004),h,0));
   const bolt=new T.CylinderGeometry(.018,.018,.012,8);bolt.rotateX(Math.PI/2);
   bolt.translate(0,h,side*(half+.014));iron.push(bolt);
  }
 }
 batch(root,timber,mats.mastBlack,'mast_hound_cheeks',cfg);
 batch(root,iron,mats.iron,'masthead_straps_and_bolts',cfg,.04);
 batch(root,seams,mats.standingRigging,'made_mast_joints',cfg,.005);
 return root;
}

/** Everything stays in the yard's frame, including its footropes and stirrups. */
export function yardFurniture(length,diameter,tier,cfg,mats,radiusAt){
 const root=new T.Group();root.name='yard_furniture';
 if(cfg.textureSize<1024)return root;
 const iron=[],ties=[],horses=[],cleats=[];
 const simple=cfg.textureSize<2048;
 const yardRope=(points,r,steps)=>rope(points,r,simple?Math.max(6,Math.round(steps/3)):steps,simple?3:5);
 if(!simple)for(const side of [-1,1]){
  // Stops and seized collars where braces and lifts lead off the yardarm.
  const x=side*(length*.5-.06),r=radiusAt(x/length+.5);
  for(let turn=0;turn<3;turn++){
   const pts=[];for(let j=0;j<=24;j++){
    const a=j/24*Math.PI*2;
    pts.push(new T.Vector3(x-side*turn*.025,(r+.012)*Math.sin(a),(r+.012)*Math.cos(a)));
   }
   ties.push(rope(pts,.01,24));
  }
  const cleat=new RoundedBoxGeometry(.14,.055,.065,1,.012);
  cleat.translate(x-side*.13,r+.016,0);cleats.push(cleat);
 }
 if(!simple&&tier==='lower')for(const f of [-.18,-.1,0,.1,.18]){
  const x=length*f,r=radiusAt(f+.5)+.008,b=band(r,.055);b.rotateZ(Math.PI/2);b.translate(x,0,0);iron.push(b);
 }
 if(cfg.footropes&&tier!=='royal')for(const side of [-1,1]){
  const drop=tier==='lower'?.83:tier==='topsail'?.73:.56;
  const back=diameter*.5+.16;
  const inner=.45,outer=length*.46;
  const spans=Math.max(2,Math.ceil((outer-inner)/2.5));
  // Eyes return over the spar; stirrups interrupt the sag instead of hanging free.
  const points=[new T.Vector3(side*inner,0,diameter*.5)];
  const supports=[];
  for(let i=0;i<=spans;i++){
   const x=side*T.MathUtils.lerp(inner+.15,outer,i/spans);
   const p=new T.Vector3(x,-drop,back);points.push(p);supports.push(p);
   if(i<spans){const mid=x+side*(outer-inner-.15)/spans*.5;points.push(new T.Vector3(mid,-drop-.12,back+.035));}
  }
  points.push(new T.Vector3(side*(length*.5-.06),0,radiusAt(.99)));
  horses.push(yardRope(points,.014,spans*12+12));
  for(const p of supports.slice(1,-1)){
   const r=radiusAt(p.x/length+.5),pts=[];
   for(let j=0;j<=20;j++){const a=j/20*Math.PI*2;pts.push(new T.Vector3(p.x,(r+.014)*Math.sin(a),(r+.014)*Math.cos(a)));}
   pts.push(new T.Vector3(p.x,-drop*.48,back*.9),p.clone());
   horses.push(yardRope(pts,.011,28));
  }
  // Topsail Flemish horses give a separate foothold outboard of the long horse.
  if(tier==='topsail'){
   const a=side*length*.36,b=side*(length*.5-.06);
   horses.push(yardRope([new T.Vector3(a,0,radiusAt(a/length+.5)),new T.Vector3((a+b)*.5,-.62,back+.12),
    new T.Vector3(b,0,radiusAt(b/length+.5))],.013,20));
  }
 }
 batch(root,iron,mats.iron,'yard_scarf_hoops',cfg,.05);
 batch(root,cleats,mats.timber,'yardarm_stop_cleats',cfg,.055);
 batch(root,ties,mats.standingRigging,'yardarm_seizings',cfg,.025);
 const foot=batch(root,horses,mats.standingRigging,'yard_footropes_and_stirrups',cfg);
 if(foot)foot.userData.fixedToYard=true;
 return root;
}
