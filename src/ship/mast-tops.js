import * as T from 'three';
import {mergeGeometries} from '../util/loft.js';
import {sparMaterials} from './spar-finish.js';
import {detailChoice} from './detail-lod.js';
import {eyeHoles, pairSeparation, pairAttachment, reeveLanyard} from './deadeyes.js';

// Steel (1794), pp.37–39 gives the breadth and the construction: a broad opening, close
// deal flooring, elm rim, radial ribs and an AFTER rail. The Dutch top is not Steel's
// British half-moon: the Rijksmuseum Vrijheid model shows it broad, nearly square, with
// well-rounded corners and planked radially. Small scantlings and the rail height below
// are reconstruction.
export function mastTopLayout(m) {
 const B=m.topBreadth,L=m.topLength,holeWidth=B*2/5,holeDepth=holeWidth*13/14;
 const holeAft=L*.3,holeFore=holeAft-holeDepth,centerZ=-L*.05;
 const beamWidth=m.lowerDia*.27,beamX=m.lowerDia*.41+beamWidth/2;
 return {B,L,centerZ,holeWidth,holeDepth,holeFore,holeAft,beamWidth,beamX,
  corner:m.topCorner??Math.min(B,L)*.2,mastDia:m.lowerDia,
  rimWidth:m.name==='mizzen'?.1524:.1778,eyeRadius:m.lowerDia*.14};
}

// One coordinate contract for the hardware, topmast shrouds and futtock shrouds.
export function mastTopAnchor(m,side,i,count,thickness) {
 const l=mastTopLayout(m),r=l.eyeRadius;
 // Keep the shroud fan abaft the mast: down the side of the rim from just abaft the
 // mast and on round the aft corner. The fore half is a working area, not an anchorage.
 const [px,z]=rimAnchor(l,count===1?.5:i/(count-1)),x=side*px;
 const y=thickness/2+r+.04,base=new T.Vector3(x,y,z);
 const origin=m.along(m.houndsH).add(new T.Vector3(0,0,l.centerZ));
 return {base,shroud:base.clone().add(new T.Vector3(0,pairAttachment(r),0)).add(origin),
  futtock:new T.Vector3(x,-thickness/2-.14,z).add(origin),radius:r};
}

// A point a fraction `f` of the way along the starboard rim path that carries the shroud
// anchors: down the straight side, then round the aft corner.
function rimAnchor(l,f) {
 const inset=l.rimWidth*.55,w=l.B/2-inset,h=l.L/2-inset,r=Math.max(.05,l.corner-inset);
 const z0=-l.centerZ+Math.max(.10,l.mastDia*1.1),z1=h-r,straight=Math.max(0,z1-z0),arc=Math.PI/2*r;
 const s=T.MathUtils.clamp(f,0,1)*(straight+arc*.8);
 if(s<=straight)return [w,z0+s];
 const a=(s-straight)/r;
 return [w-r+r*Math.cos(a),h-r+r*Math.sin(a)];
}

// The rounded-corner outline, counter-clockwise in plan: a rectangle whose four corners
// are quarter circles. `inset` shrinks it evenly, for the inner edge of the rim and the bead.
function outline(l,steps=20,inset=0) {
 const w=l.B/2-inset,h=l.L/2-inset,r=Math.max(.05,l.corner-inset),k=Math.max(2,Math.round(steps/4)),pts=[];
 for(const [sx,sz,start] of [[1,1,0],[-1,1,Math.PI/2],[-1,-1,Math.PI],[1,-1,Math.PI*1.5]])
  for(let i=0;i<=k;i++){const a=start+Math.PI/2*i/k;pts.push([sx*(w-r)+r*Math.cos(a),sz*(h-r)+r*Math.sin(a)]);}
 return pts;
}
// Evenly spaced points round the rim, for the radial ribs.
function rimPoints(l,count,inset) {
 const pts=outline(l,160,inset),cum=[0];
 for(let i=1;i<=pts.length;i++){const a=pts[i-1],b=pts[i%pts.length];cum.push(cum[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]));}
 const total=cum[pts.length],out=[];
 for(let n=0;n<count;n++){
  const target=total*(n+.5)/count;let i=1;while(cum[i]<target)i++;
  const a=pts[i-1],b=pts[i%pts.length],f=(target-cum[i-1])/Math.max(1e-6,cum[i]-cum[i-1]);
  out.push([T.MathUtils.lerp(a[0],b[0],f),T.MathUtils.lerp(a[1],b[1],f)]);
 }
 return out;
}
function shapeOf(points) {const s=new T.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,z):s.moveTo(x,z));s.closePath();return s;}
function holeOf(l) {return new T.Path([new T.Vector2(-l.holeWidth/2,l.holeFore),new T.Vector2(-l.holeWidth/2,l.holeAft),
 new T.Vector2(l.holeWidth/2,l.holeAft),new T.Vector2(l.holeWidth/2,l.holeFore),new T.Vector2(-l.holeWidth/2,l.holeFore)]);}
function extrude(s,t,y,bevel=0) {
 const g=new T.ExtrudeGeometry(s,{depth:t,bevelEnabled:!!bevel,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,curveSegments:6});
 return g.rotateX(Math.PI/2).translate(0,y,0);
}
function woodUV(g,shift=0) {
 const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++)uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i))/.8+shift,
  (Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i))/4+shift*.37);
 return g;
}
function merge(parts){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return g;}
function batch(root,parts,mat,name,feature=0,coarse=null) {
 if(!parts.length)return;const mesh=new T.Mesh(merge(parts),mat);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;
 if(feature)detailChoice(mesh,feature,coarse);root.add(mesh);return mesh;
}
function clip(poly,axis,limit,greater) {
 const out=[];if(!poly.length)return out;
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],ia=greater?a[axis]>=limit:a[axis]<=limit,ib=greater?b[axis]>=limit:b[axis]<=limit;
  if(ia)out.push(a);if(ia!==ib){const t=(limit-a[axis])/(b[axis]-a[axis]);out.push([T.MathUtils.lerp(a[0],b[0],t),T.MathUtils.lerp(a[1],b[1],t)]);}
 }return out;
}
function floorGeometry(l,t,detailed,far=false) {
 const poly=outline(l,detailed?32:far?8:12);
 if(!detailed){const s=shapeOf(poly);s.holes.push(holeOf(l));return woodUV(extrude(s,t,t/2));}
 const cuts=[-l.B/2,l.B/2,-l.holeWidth/2,l.holeWidth/2];
 const n=Math.ceil(l.B/.23);for(let i=1;i<n;i++)cuts.push(-l.B/2+i*l.B/n);cuts.sort((a,b)=>a-b);
 const parts=[];
 for(let i=0;i<cuts.length-1;i++){
  const a=cuts[i]+.0018,b=cuts[i+1]-.0018;if(b<=a)continue;
  let plank=clip(clip(poly,0,a,true),0,b,false);const center=(a+b)/2;
  const pieces=Math.abs(center)<l.holeWidth/2?[clip(plank,1,l.holeFore,false),clip(plank,1,l.holeAft,true)]:[plank];
  for(const p of pieces){if(p.length<3)continue;const g=woodUV(extrude(shapeOf(p),t-.004,t/2-.002,.002),i*.213);
   const colors=new Float32Array(g.attributes.position.count*3),shade=.9+.16*Math.sin(i*12.43);
   for(let k=0;k<colors.length;k+=3)colors.set([shade,shade,shade],k);g.setAttribute('color',new T.BufferAttribute(colors,3));parts.push(g);}
 }return merge(parts);
}
function tube(a,b,r,radial=5) {return new T.TubeGeometry(new T.LineCurve3(a,b),1,r,radial,false);}
function rib(a,b,width,height) {
 const length=a.distanceTo(b),g=new T.BoxGeometry(width,height,length),p=g.attributes.position;
 for(let i=0;i<p.count;i++)if(p.getY(i)>0)p.setY(i,-height/2+T.MathUtils.lerp(.014,height,(p.getZ(i)/length+.5)));
 g.computeVertexNormals();g.translate(0,height/2,0);g.rotateY(Math.atan2(b.x-a.x,b.z-a.z));
 g.translate((a.x+b.x)/2,a.y,(a.z+b.z)/2);return woodUV(g);
}
function simpleEyes(r,thickness) {
 const parts=[];for(const y of [0,pairSeparation(r)]){const g=new T.CylinderGeometry(r,r,thickness,8,1);g.rotateX(Math.PI/2);g.translate(0,y,0);parts.push(g);}return merge(parts);
}
function boredEyes(r,thickness) {
 const parts=[];
 for(const upper of [false,true]){
  const s=new T.Shape();s.absarc(0,0,r,0,Math.PI*2,false);
  for(const p of eyeHoles(r,upper)){const hole=new T.Path();hole.absarc(p.x,p.y-(upper?pairSeparation(r):0),r*.14,0,Math.PI*2,true);s.holes.push(hole);}
  parts.push(new T.ExtrudeGeometry(s,{depth:thickness-.004,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,curveSegments:10})
   .translate(0,upper?pairSeparation(r):0,-thickness/2+.002));
 }return merge(parts);
}

export function buildMastTop(m,t,cfg,mats,count) {
 const root=new T.Group();root.name=`${m.name}_top`;const l=mastTopLayout(m),detailed=cfg.textureSize>=2048,medium=cfg.textureSize>=1024;
 root.position.copy(m.along(m.houndsH));root.position.z+=l.centerZ;
 root.userData.topLayout={...l,thickness:t};
 const finish=sparMaterials(cfg),floorMat=finish.black.clone();floorMat.name='weathered top deals';floorMat.color.setRGB(1.3,1.27,1.2);
 floorMat.vertexColors=true;floorMat.userData.bakedOcclusion=true;
 const floor=new T.Mesh(floorGeometry(l,t,detailed,cfg.textureSize<512),floorMat);floor.name='top_deal_floor';floor.castShadow=floor.receiveShadow=true;
 if(detailed&&cfg.adaptiveDetail)detailChoice(floor,.014,floorGeometry(l,t,false));root.add(floor);
 const timbers=[],ribs=[],iron=[],pegs=[],eyes=[],lowEyes=[],hemp=[],strops=[];
 const timber=finish.black.clone();timber.color.setRGB(1.2,1.17,1.1);timber.userData.bakedOcclusion=true;timber.vertexColors=true;
 const far=cfg.textureSize<512,steps=medium?32:far?8:12;
 const rim=shapeOf(outline(l,steps));rim.holes.push(new T.Path(outline(l,steps,l.rimWidth).map(p=>new T.Vector2(...p)).reverse()));
 timbers.push(woodUV(extrude(rim,.028,t/2+.028)));
 // A raised, narrow outer bead leaves the broad flat rim readable against the deals.
 if(medium){const bead=shapeOf(outline(l,32));bead.holes.push(new T.Path(outline(l,32,.035).map(p=>new T.Vector2(...p)).reverse()));timbers.push(woodUV(extrude(bead,.036,t/2+.064)));}
 // Fore-and-aft trestletrees; transverse crosstrees border, never bridge, access.
 for(const side of [-1,1])timbers.push(woodUV(new T.BoxGeometry(l.beamWidth,.26,l.holeDepth+.44).translate(side*l.beamX,-t/2-.13,(l.holeFore+l.holeAft)/2)));
 for(const z of [l.holeFore-.10,l.holeAft+.10])timbers.push(woodUV(new T.BoxGeometry(l.B*.94,.18,.20).translate(0,-t/2-.085,z)));
 // Inner edging frames the opening without closing the two climbing passages.
 // (A silhouette at the distant level has no use for the edging or the rail.)
 if(!far)for(const side of [-1,1])timbers.push(woodUV(new T.BoxGeometry(.045,.055,l.holeDepth).translate(side*(l.holeWidth/2+.0225),t/2+.0275,(l.holeFore+l.holeAft)/2)));
 if(!far)for(const z of [l.holeFore-.0225,l.holeAft+.0225])timbers.push(woodUV(new T.BoxGeometry(l.holeWidth+.09,.055,.045).translate(0,t/2+.0275,z)));
 // The raised ribs taper down towards the opening, leaving a working floor.
 if(medium){
  const edges=rimPoints(l,28,l.rimWidth*.55);
  const cz=(l.holeFore+l.holeAft)/2;
  for(const [x,z] of edges){const dx=x,dz=z-cz,k=Math.min(l.holeWidth/2/Math.max(.0001,Math.abs(dx)),l.holeDepth/2/Math.max(.0001,Math.abs(dz)));
   const a=new T.Vector3(dx*k,t/2+.001,cz+dz*k),b=new T.Vector3(x,t/2+.001,z);ribs.push(rib(a,b,.07,.085));
   for(const f of [.2,.83]){const p=a.clone().lerp(b,f);p.y+=T.MathUtils.lerp(.014,.085,f)+.0025;pegs.push(new T.CylinderGeometry(.012,.012,.006,6).translate(p.x,p.y,p.z));}
  }
 }
 // Four octagonal stanchions and a rounded after rail, not a crow's-nest fence.
 const railY=t/2+.78,railZ=l.L/2-.07,railHalf=l.B/2-l.corner;
 for(let i=0;i<(far?0:4);i++){
  const x=T.MathUtils.lerp(-railHalf,railHalf,i/3);
  timbers.push(woodUV(new T.CylinderGeometry(.036,.042,.76,medium?8:4).translate(x,t/2+.4,railZ)));
  if(medium){iron.push(new T.BoxGeometry(.025,.19,.012).translate(x,t/2+.12,railZ+.043));}
 }
 if(!far){const rail=new T.CylinderGeometry(.039,.039,railHalf*2+.1,medium?12:6);rail.rotateZ(Math.PI/2);rail.translate(0,railY,railZ);timbers.push(woodUV(rail));}
 for(const side of [-1,1])for(let i=0;i<(cfg.textureSize<512?0:count);i++){
  const a=mastTopAnchor(m,side,i,count,t),r=a.radius,th=r*.52;
  const place=g=>g.rotateY(Math.PI/2).translate(a.base.x,a.base.y,a.base.z);
  eyes.push(place(medium?boredEyes(r,th):simpleEyes(r,th)));if(medium&&cfg.adaptiveDetail)lowEyes.push(place(simpleEyes(r,th)));
  const ly=reeveLanyard(r,th);
  if(medium)hemp.push(place(new T.TubeGeometry(ly.curve,detailed?72:40,ly.radius,detailed?5:3,false)));
  // Below the medium level the lanyards are not drawn: each would cost a draw call.
  const pts=[new T.Vector3(-.008,pairAttachment(r),0)];
  for(let j=0;j<=20;j++){const angle=2.4+(Math.PI*2+.74-2.4)*j/20;pts.push(new T.Vector3((r+.007)*Math.cos(angle),pairSeparation(r)+(r+.007)*Math.sin(angle),0));}
  pts.push(new T.Vector3(.008,pairAttachment(r),0));
  if(medium)strops.push(place(new T.TubeGeometry(new T.CatmullRomCurve3(pts),28,.009,detailed?5:3,false)));
  // The lower deadeye's iron strop continues through the rim into a futtock plate.
  const plateBottom=-t/2-.14,plateTop=a.base.y;
  iron.push(new T.BoxGeometry(.018,plateTop-plateBottom+.035,.045).translate(a.base.x,(plateTop+plateBottom)/2,a.base.z));
  if(medium){const ring=new T.TorusGeometry(r+.005,.008,4,24);iron.push(place(ring));}
 }
 // Below the medium level the futtock plates and the deadeyes are folded into the timber
 // batch: a draw call each on three tops, for fittings the size of a hand.
 if(!medium)timbers.push(...iron.splice(0),...eyes.splice(0));
 batch(root,timbers,timber,'top_rim_trestles_crosstrees_and_rail');
 batch(root,ribs,timber,'top_tapered_radial_ribs');
 batch(root,iron,mats.iron,'top_futtock_plates');
 batch(root,eyes,mats.timber,'topmast_deadeyes',medium&&cfg.adaptiveDetail?.02:0,lowEyes.length?merge(lowEyes):null);
 batch(root,hemp,mats.runningRigging,'topmast_deadeye_lanyards',cfg.adaptiveDetail?.008:0);
 batch(root,strops,mats.standingRigging,'topmast_deadeye_strops',cfg.adaptiveDetail?.012:0);
 batch(root,pegs,mats.iron,'top_rib_fasteners',cfg.adaptiveDetail?.024:0);
 return root;
}
