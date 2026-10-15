import * as T from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import lettering from './stern-lettering.js';
import {SPEC,PAINT} from '../spec/spec.js';
import {mergeGeometries} from '../util/loft.js';
import {audit} from '../audit/measure.js';
import {normalFrom,asTexture} from './textures.js';
import {joineryFinish,carvedGiltFinish} from './stern-finishes.js';

const font=new FontLoader().parse(lettering), finishes=new Map();
const hash=n=>{const x=Math.sin(n*127.1+31.7)*43758.5453;return x-Math.floor(x);};

// Four metres of horizontal painted planking. The hull atlas pins its upper V
// to black paint; reusing that V for timber stretched one pixel up the stern.
function sternFinish(size){
 if(finishes.has(size))return finishes.get(size);
 const maps=[];
 for(const kind of ['colour','height','rough']){
  const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),px=size/4;
  g.fillStyle=kind==='height'?'#808080':kind==='rough'?'#b8b8b8':'#c8c8c8';g.fillRect(0,0,size,size);
  const courses=16,h=size/courses;
  for(let row=0;row<courses;row++){
   const y=row*h,v=Math.round((kind==='height'?128:kind==='rough'?177:224)+(hash(row)-.5)*(kind==='height'?3:14));
   g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(0,y,size,h);
   // Fine horizontal grain under paint; keep it shallower than the caulking.
   for(let j=0;j<54;j++){
    const yy=y+(j+.5)*h/54,t=hash(row*73+j);
    g.strokeStyle=`rgba(${kind==='height'?'100,100,100':'55,50,44'},${kind==='height'?.09:.045+t*.07})`;
    g.lineWidth=Math.max(.4,px*.0015);g.beginPath();g.moveTo(0,yy);g.bezierCurveTo(size*.3,yy+h*.012,size*.7,yy-h*.02,size,yy);g.stroke();
   }
   g.fillStyle=kind==='height'?'#484848':kind==='rough'?'#bfbfbf':'#8d8d8d';
   g.fillRect(0,y,size,Math.max(1,px*.003));
   const butt=(hash(row+91)*.75+.1)*size;
   g.fillRect(butt,y,Math.max(.6,px*.0025),h);
   if(kind==='colour')for(let j=0;j<6;j++)for(const fraction of [.22,.76]){
    g.fillStyle='rgba(70,63,52,.11)';g.beginPath();g.arc((j+.3)*size/6,y+h*fraction,px*.008,0,Math.PI*2);g.fill();
   }
  }
  // Salt runs belong in colour and roughness, not raised rock-like bumps.
  if(kind!=='height')for(let j=0;j<48;j++) {
   const x=hash(j+302)*size,y=hash(j+470)*size,len=size*(.012+hash(j+37)*.11);
   const fade=g.createLinearGradient(x,y,x,y+len);
   fade.addColorStop(0,kind==='colour'?'rgba(80,72,60,.11)':'rgba(245,245,245,.17)');fade.addColorStop(1,'rgba(160,160,160,0)');
   g.fillStyle=fade;g.fillRect(x,y,Math.max(1,size*.0018),len);
  }
  maps.push(c);
 }
 const [colour,height,rough]=maps;
 const texture=(canvas,srgb)=>{const t=asTexture(canvas,{srgb});t.channel=1;t.anisotropy=8;return t;};
 const m=new T.MeshStandardMaterial({color:PAINT.topside_black.hex,map:texture(colour,true),
  normalMap:texture(normalFrom(height,2.1),false),normalScale:new T.Vector2(.62,.62),
  roughnessMap:texture(rough,false),roughness:1,metalness:0,vertexColors:true});
 m.name='stern_painted_planking';m.userData.finish='horizontal-stern-planking-v2';finishes.set(size,m);return m;
}

export function finishSternShell(shell,cfg,sp){
 if(!cfg.sternWindows)return;
 const g=shell.geometry,p=g.attributes.position,uv=g.attributes.uv,detail=[];
 for(let i=0;i<p.count;i++)detail.push(Math.sign(p.getX(i))*uv.getX(i)*PAINT.hull_map_metres.value/4+.5,p.getY(i)/4);
 g.setAttribute('uv1',new T.Float32BufferAttribute(detail,2));
 const source=g.index?.array??Array.from({length:p.count},(_,i)=>i),bottom=[],top=[];
 for(let i=0;i<source.length;i+=3){
  const v=(uv.getY(source[i])+uv.getY(source[i+1])+uv.getY(source[i+2]))/3;
  (v>.5+PAINT.copper_line_above_wl_v.value+.0001?top:bottom).push(source[i],source[i+1],source[i+2]);
 }
 g.setIndex([...bottom,...top]);g.clearGroups();g.addGroup(0,bottom.length,0);g.addGroup(bottom.length,top.length,1);
 shell.material=[shell.material,sternFinish(Math.min(2048,cfg.textureSize))];
}

export function addSternOrnament(cfg,mats,sp,lights,group){
 if(cfg.sternOrnament==='none')return;
 const fine=cfg.sternOrnament==='carved',gold=carvedGiltFinish(cfg);
 const giltUV=g=>{
  const p=g.attributes.position,uv=[];
  for(let i=0;i<p.count;i++)uv.push(p.getX(i)/.28,p.getY(i)/.22);
  g.setAttribute('uv1',new T.Float32BufferAttribute(uv,2));return g;
 };
 const details=[],grounds=[];
 const on=(x,y,d)=>sp.surfaceAtX(y,x,d);
 const tube=(points,radius=.009,steps=32)=>{
  const curve=new T.CatmullRomCurve3(points.map(([x,y,d])=>on(x,y,d)));
  return new T.TubeGeometry(curve,fine?steps:Math.max(6,Math.round(steps/3)),radius,fine?6:3,false);
 };
 const oval=(cx,cy,rx,ry,d,r=.009)=>tube(Array.from({length:33},(_,i)=>{
  const a=i/32*Math.PI*2;return [cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,d];
 }),r,fine?64:24);
 // Low carved leaves have a broad face, a raised central ridge and edges that
 // return to the timber. This reads as relief in grazing light, not gold wire.
 const leaf=(x0,y0,x1,y1,width,d=.028)=>{
  const nu=fine?10:4,nv=fine?4:2,pos=[],uv=[],idx=[];
  const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
  for(let u=0;u<=nu;u++)for(let v=0;v<=nv;v++){
   const t=u/nu,s=v/nv*2-1,profile=Math.sin(Math.PI*t),across=s*width*.5*profile;
   const p=on(x0+dx*t+nx*across,y0+dy*t+ny*across,d+.012*profile*(1-Math.abs(s)));
   pos.push(p.x,p.y,p.z);uv.push(t,v/nv);
  }
  for(let u=0;u<nu;u++)for(let v=0;v<nv;v++){
   const a=u*(nv+1)+v,b=a+nv+1;idx.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
 };
 const panel=(cx,cy,width,height,depth,corner)=>{
  const s=new T.Shape(),w=width/2,h=height/2,r=corner;
  s.moveTo(-w+r,-h);s.lineTo(w-r,-h);s.quadraticCurveTo(w,-h,w,-h+r);s.lineTo(w,h-r);
  s.quadraticCurveTo(w,h,w-r,h);s.lineTo(-w+r,h);s.quadraticCurveTo(-w,h,-w,h-r);
  s.lineTo(-w,-h+r);s.quadraticCurveTo(-w,-h,-w+r,-h);
  const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:2,curveSegments:fine?12:4,steps:1});
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const v=on(cx+p.getX(i),cy+p.getY(i),.004+p.getZ(i));p.setXYZ(i,v.x,v.y,v.z);}
  g.computeVertexNormals();return g;
 };
 const nameY=T.MathUtils.lerp(sp.yTuck,sp.yWing,.78),w=SPEC.stern_cartouche_width.value,h=SPEC.stern_cartouche_height.value;
 const depth=.026;
 const boardGeometry=panel(0,nameY,w,h,depth,.025),boardUV=[];
 const boardP=boardGeometry.attributes.position;
 for(let i=0;i<boardP.count;i++)boardUV.push(boardP.getX(i)/1.25,boardP.getY(i)/.22);
 boardGeometry.setAttribute('uv1',new T.Float32BufferAttribute(boardUV,2));
 const boardMaterial=joineryFinish(cfg).clone();boardMaterial.vertexColors=false;boardMaterial.userData.bakedOcclusion=false;
 boardMaterial.color.set(PAINT.topside_black.hex);boardMaterial.roughness=.87;
 const board=new T.Mesh(boardGeometry,boardMaterial);board.name='stern_nameboard';group.add(board);
 // Thin, inset frame instead of a swollen brass lozenge.
 const frame=[[-w/2+.09,-h/2+.03],[w/2-.09,-h/2+.03],[w/2-.035,-h/2+.065],
  [w/2-.035,h/2-.065],[w/2-.09,h/2-.03],[-w/2+.09,h/2-.03],[-w/2+.035,h/2-.065],[-w/2+.035,-h/2+.065],[-w/2+.09,-h/2+.03]];
 details.push(tube(frame.map(([x,y])=>[x,nameY+y,depth+.01]),.0045,128));
 const shapes=font.generateShapes('SURPRISE',SPEC.stern_name_letter_height.value);
 // A single sloping chisel cut gives a crisp edge; densely rounded bevels
 // look cast in plastic and spend more triangles than the whole cabin.
 const text=fine?new T.ExtrudeGeometry(shapes,{depth:.0075,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,curveSegments:6,steps:1}):new T.ShapeGeometry(shapes,3);
 text.computeBoundingBox();const box=text.boundingBox,size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),p=text.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=(p.getX(i)-center.x)*SPEC.stern_name_length.value/size.x;
  const y=nameY+(p.getY(i)-center.y)*SPEC.stern_name_letter_height.value/size.y;
  const v=on(x,y,depth+.008+p.getZ(i));p.setXYZ(i,v.x,v.y,v.z);
 }
 text.computeVertexNormals();text.computeBoundingBox();text.computeBoundingSphere();const name=new T.Mesh(giltUV(text),gold);name.name='stern_name';audit(name,'stern_name_length','extent_x');group.add(name);
 const cy=T.MathUtils.lerp(lights.yHead+SPEC.stern_light_munion.value*2,sp.yTaff,.42);
 const ow=SPEC.taffrail_ornament_width.value,oh=SPEC.taffrail_ornament_height.value;
 grounds.push(panel(0,cy,ow*.94,oh*.82,.012,oh*.32));
 details.push(oval(0,cy,ow*.48,oh*.44,.035,.012));
 details.push(oval(0,cy,ow*.42,oh*.35,.034,.006));
 // A shallow shell fan in the centre, with mirrored scrolling foliage.
 // This is restrained period-style reconstruction, not a claimed portrait carving.
 for(let i=0;i<9;i++){
  const a=(i/8-.5)*2.25;
  details.push(tube([[0,cy-oh*.24,.025],[Math.sin(a)*ow*.15,cy+oh*.04,.048],[Math.sin(a)*ow*.29,cy+Math.cos(a)*oh*.26,.025]],.006,12));
  details.push(leaf(0,cy-oh*.22,Math.sin(a)*ow*.29,cy+Math.cos(a)*oh*.26,ow*.073,.029));
 }
 for(const side of [-1,1]){
  const start=ow*.55,end=lights.halfSpan*.84;
  for(let k=0;k<2;k++){
   const cx=T.MathUtils.lerp(start,end,(k+.5)/2),rx=(end-start)*.23,ry=oh*(k?.23:.29);
   const points=[];
   for(let i=0;i<=32;i++){const t=i/32,a=t*Math.PI*3.1,r=1-t*.88;
    points.push([side*(cx+Math.cos(a)*rx*r),cy+Math.sin(a)*ry*r,.024]);}
   details.push(tube(points,.01,48));
   for(let j=0;j<3;j++){
    const x=side*(cx-rx*.7+j*rx*.55),y=cy-ry*.7;
    details.push(tube([[x,y,.02],[x+side*rx*.18,y-ry*.3,.036],[x+side*rx*.42,y-ry*.16,.02]],.008,14));
    details.push(leaf(x,y,x+side*rx*.47,y-ry*.35,ry*.30));
   }
  }
  // Paired narrow channels give the end pieces relief without large gold blobs.
  const x=side*(sp.halfBreadth(cy)-SPEC.stern_term_piece_width.value);
  for(const offset of [-.03,.03])details.push(tube([[x+offset,lights.yHead+.10,.022],[x+offset-side*.035,cy,.034],[x+offset,sp.yTaff-.16,.022]],.011,24));
 }
 const base=new T.Mesh(mergeGeometries(grounds),mats.black);base.name='stern_carving_ground';group.add(base);
 const carving=new T.Mesh(giltUV(mergeGeometries(details)),gold);carving.name='stern_carving';group.add(carving);
}
