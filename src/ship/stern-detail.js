// The timber finish of the stern's shell, and the carved work on it.
import * as T from 'three';
import {PAINT} from '../spec/spec.js';
import {mergeGeometries} from '../util/loft.js';
import {S} from './stern-profile.js';
import {carved,giltUV,plain,standingFigure,seatedWarrior,lionCouchant,trophyOfArms,scrollRun} from './stern-carving.js';
import {normalFrom,asTexture} from './textures.js';
import {carvedGiltFinish} from './stern-finishes.js';

const finishes=new Map();
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


/**
 * The carved work of the stern, gilt on the black: the device on the counter between the
 * two chase ports, the bosses on the pilasters of the lights, the frieze over them and the
 * frieze of the taffrail, the crest of the taffrail with its seated warrior, lions and
 * trophies of arms, and a Hercules at each corner. None of it carries a name.
 */
export function addSternOrnament(cfg,mats,sp,lights,walk,group){
 if(cfg.sternOrnament==='none')return;
 const fine=cfg.sternOrnament==='carved',gold=carvedGiltFinish(cfg);
 const seg=Math.max(5,Math.round(cfg.latheSegments/(fine?2:3)));
 const details=[],grounds=[],figures=[];
 const on=(x,y,d)=>sp.surfaceAtX(y,x,d);
 const tube=(points,radius=.009,steps=32)=>{
  const curve=new T.CatmullRomCurve3(points.map(([x,y,d])=>on(x,y,d)));
  return plain(new T.TubeGeometry(curve,fine?steps:Math.max(6,Math.round(steps/3)),radius,fine?6:3,false));
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
  g.computeVertexNormals();return plain(g);
 };
 const relief=S('stern_carving_relief'),bevel=S('stern_carving_bevel');
 const nb=fine?12:8;

 // ------------------------------------------------ the device on the counter
 // Between the two chase ports: a shield in a wreath under a crown, with scrolls
 // running out toward the quarters over the ports.
 {
  const f=sp.f,cy=(f.lower_port_head+sp.yCounterTop)/2+.02;
  const w=S('stern_counter_device_width'),h=S('stern_counter_device_height');
  grounds.push(panel(0,cy,w,h,.012,h*.32));
  details.push(oval(0,cy,w*.46,h*.43,.035,.012));
  details.push(oval(0,cy,w*.34,h*.33,.034,.006));
  details.push(plain(carved((u,v,o)=>on(u,v,o+.012),0,w*.2,cy-h*.02,h*.26,{crown:relief,bevel,corner:2.6,nu:nb,nv:4})));
  // The laurel either side of the shield, and a crown over it.
  for(const sgn of [-1,1])for(let i=0;i<5;i++){
   const a=(i/4)*1.0+.25,r=w*.3;
   details.push(leaf(sgn*Math.sin(a)*r*.82,cy-Math.cos(a)*h*.34,sgn*Math.sin(a+.28)*r,cy-Math.cos(a+.28)*h*.4,h*.16,.034));
  }
  for(let i=0;i<5;i++){const x=(i-2)*w*.045;details.push(tube([[x,cy+h*.3,.035],[x,cy+h*.42+(2-Math.abs(i-2))*h*.04,.04]],.009,6));}
  details.push(tube([[-w*.1,cy+h*.3,.035],[w*.1,cy+h*.3,.035]],.01,6));
  if(fine)for(const sgn of [-1,1])details.push(scrollRun((u,y,d)=>on(sgn*u,y,d+.01),1.95,3.3,cy,h*.7,3,{relief:S('stern_scroll_relief'),radius:.011,fine}));
 }

 // ------------------------------------------------ the pilasters of the lights
 // A gilt boss at the head and the foot of each, on the ochre of the pilaster.
 if(fine){
  const depth=.016+S('stern_light_frame_depth');
  for(let i=0;i<=lights.count;i++){
   const x=(i-lights.count/2)*lights.pitch+(i===0?-S('stern_quarter_piece_width')/2:i===lights.count?S('stern_quarter_piece_width')/2:0);
   const half=(i===0||i===lights.count?S('stern_quarter_piece_width'):S('stern_light_munion'))*.3;
   for(const y of [lights.yHead-.14,lights.ySill+.14,lights.yHead+.12]){
    details.push(plain(carved((u,v,o)=>on(u,v,o+depth),x,half,y,y>lights.yHead?.045:.09,{crown:relief*.5,bevel,nu:fine?10:6,nv:3})));
   }
  }
 }

 // ------------------------------------------------ the frieze over the lights
 {
  const y0=lights.yHead+S('stern_glazing_bar')*2+.015,y1=sp.yWalk-S('stern_counter_rail_depth')*1.2;
  if(fine&&y1>y0+.05)details.push(scrollRun((u,y,d)=>on(u,y,d+.012),-lights.halfSpan,lights.halfSpan,(y0+y1)/2,y1-y0,Math.max(8,lights.count*2),
   {relief:S('stern_scroll_relief'),radius:.008,fine}));
 }

 // ------------------------------------------------ the taffrail: frieze, crest, figures
 const fr=walk.frieze,hf=S('stern_figure_height'),pedestal=S('stern_figure_pedestal');
 if(fine)details.push(scrollRun((u,y,d)=>on(u,y,d-.035),-fr.xHalf+.15,fr.xHalf-.15,(fr.yTop+fr.yBot)/2,fr.depth*.9,14,
  {relief:S('stern_scroll_relief')*.6,radius:.009,fine}));
 {
  const top=sp.yTaff,zc=sp.surfaceAtX(top,0).z;
  const crestW=S('stern_crest_width'),crestH=S('stern_crest_height');
  // The arched ground of the crest, in black, carved through its middle.
  const s=new T.Shape();
  s.moveTo(-crestW/2,0);s.lineTo(crestW/2,0);s.lineTo(crestW/2,crestH*.28);
  s.quadraticCurveTo(crestW/2,crestH*.62,crestW*.2,crestH*.72);
  s.quadraticCurveTo(crestW*.07,crestH*.76,0,crestH);
  s.quadraticCurveTo(-crestW*.07,crestH*.76,-crestW*.2,crestH*.72);
  s.quadraticCurveTo(-crestW/2,crestH*.62,-crestW/2,crestH*.28);s.closePath();
  const gg=new T.ExtrudeGeometry(s,{depth:.07,bevelEnabled:true,bevelSize:.012,bevelThickness:.01,bevelSegments:1,curveSegments:fine?10:4,steps:1});
  gg.translate(0,0,zc-.2);gg.translate(0,top,0);
  grounds.push(plain(gg));
  const at=(g,x,y,z,ry=0)=>{g.rotateY(ry);g.translate(x,y,z);return g;};
  // The seated warrior in the middle, a lion couchant either side, a trophy beyond each.
  figures.push(at(seatedWarrior(crestH*.86,seg),0,top+crestH*.0,zc-.06));
  for(const sgn of [-1,1]){
   figures.push(at(lionCouchant(crestH*.34,seg),sgn*crestW*.28,top,zc-.06,sgn>0?.25:-.25));
   if(fine)figures.push(at(trophyOfArms(crestH*.82,seg),sgn*crestW*.42,top,zc-.16,sgn*.35));
  }
  // The corner giants, a Hercules each, on their piers, facing aft and a little outboard.
  for(const sgn of [-1,1]){
   const c=walk.corner[sgn];
   figures.push(at(standingFigure(hf,seg,{pedestal}),c.x,c.y,c.z-.02,sgn*.45));
  }
 }

 const base=new T.Mesh(mergeGeometries(grounds),mats.black);base.name='stern_carving_ground';group.add(base);
 const carving=new T.Mesh(giltUV(mergeGeometries(details.map(plain))),gold);carving.name='stern_carving';group.add(carving);
 const figs=new T.Mesh(giltUV(mergeGeometries(figures.map(plain))),gold);figs.name='stern_figures';group.add(figs);
}
