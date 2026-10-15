import * as T from 'three';
import {asTexture,normalFrom,woodGrain} from './textures.js';
import {SPEC} from '../spec/spec.js';
import {mergeGeometries} from '../util/loft.js';
const cache=new WeakMap();

// A dedicated walking-surface finish: sharing the old deck material with boats,
// furniture and the cabin must not change their texture scale or shading.
export function walkingDeckMaterial(cfg,base){
 if(!cfg.surfaceDetail)return base;
 if(cache.has(base.map))return cache.get(base.map);
 const size=Math.min(2048,cfg.textureSize);
 const canvas=()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;};
 const source=canvas(),height=canvas(),rough=canvas();
 const sg=source.getContext('2d',{willReadFrequently:true}),hg=height.getContext('2d'),rg=rough.getContext('2d');
 sg.drawImage(base.map.image,0,0,size,size);
 const data=sg.getImageData(0,0,size,size).data,hd=hg.createImageData(size,size),rd=rg.createImageData(size,size);
 const l=new Float32Array(size*size);
 for(let i=0;i<l.length;i++)l[i]=(data[i*4]*.299+data[i*4+1]*.587+data[i*4+2]*.114)/255;
 const at=(x,y)=>l[((y+size)%size)*size+(x+size)%size];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const k=y*size+x,v=l[k];
  // Fine grain rides on shallow relief. Dark caulking is recessed, but broad
  // photographed colour variation does not become enormous physical dents.
  const blur=(at(x+4,y)+at(x-4,y)+at(x,y+4)+at(x,y-4))*.25;
  const fibre=T.MathUtils.clamp((v-blur)*.32,-.045,.045);
  const caulk=1-T.MathUtils.smoothstep(v,.22,.45);
  const h=.52+fibre-caulk*.11;
  const r=T.MathUtils.clamp(.76+(v-.58)*.07+caulk*.13,.65,.92);
  hd.data.set([h*255,h*255,h*255,255],k*4);rd.data.set([r*255,r*255,r*255,255],k*4);
 }
 hg.putImageData(hd,0,0);rg.putImageData(rd,0,0);
 const mat=base.clone(),repeat=base.map.repeat.toArray();
 mat.name='holystoned deck with recessed caulking';mat.userData.bakedOcclusion=true;
 mat.normalMap=asTexture(normalFrom(height,7),{repeat,srgb:false});
 mat.normalScale.set(.64,.64);mat.roughness=1;mat.roughnessMap=asTexture(rough,{repeat,srgb:false});
 cache.set(base.map,mat);return mat;
}

// A narrow waterway timber follows the real inside of the ship, with camber and
// a rounded inner edge. It catches a grazing highlight without floating above
// the deck or covering the drains. No independent decorative planks per frame.
export function deckWaterways(cfg,model,ranges){
 if(!cfg.surfaceDetail)return null;
 const parts=[],S=SPEC.side_thickness.value;
 for(const [which,start,end]of ranges)for(const side of [-1,1]){
  const n=Math.max(12,Math.ceil((end-start)*3)),pos=[],uv=[],idx=[];
  for(let i=0;i<=n;i++){
   const z=T.MathUtils.lerp(start,end,i/n),edgeY=which==='gundeck'?model.featureYAt(z).deck:model.standingDeckAt(z);
   const edge=model.halfBreadthAt(z,edgeY),outer=Math.max(.06,edge-S),width=Math.min(.22,outer*.35);
   for(const [inset,rise]of [[0,.007],[width-.012,.007],[width,.002],[width,-.006]]){
    const x=(outer-inset)*side,y=edgeY+SPEC.deck_camber.value*(1-(x/Math.max(.01,edge))**2)+rise;
    pos.push(x,y,z);uv.push(z/2.4,inset/.65);
   }
  }
  for(let i=0;i<n;i++)for(let j=0;j<3;j++){
   const a=i*4+j,b=a+1,c=a+4,d=c+1;
   if(side>0)idx.push(a,b,c,b,d,c);else idx.push(a,c,b,b,c,d);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();parts.push(g);
 }
 const grain=woodGrain({base:'#a99c84',dark:'#827762',light:'#c5bba3',size:512,seed:63});
 const mat=new T.MeshStandardMaterial({name:'deck waterway timber',map:asTexture(grain),roughness:.8,
  normalMap:asTexture(normalFrom(grain,1.2),{srgb:false}),normalScale:new T.Vector2(.18,.18),vertexColors:true});
 mat.userData.bakedOcclusion=true;
 const mesh=new T.Mesh(mergeGeometries(parts),mat);mesh.name='deck_waterways';return mesh;
}

// Bake fine contact shade at real truck/deck contacts, not giant rectangular
// silhouettes. Each deck owns its atlas, so guns below cannot shadow the deck
// above. This is static sky occlusion, with no painted sunlight direction.
export function finishDeckContact(ship,cfg){
 if(!cfg.surfaceDetail)return;
 ship.updateMatrixWorld(true);
 const decks=['gundeck','forecastle','quarterdeck','gangway_starboard','gangway_port'].map(n=>ship.getObjectByName(n)).filter(Boolean);
 const feet=[],m=new T.Matrix4();
 for(const name of ['nine_pounder_carriages','four_pounder_carriages','carronade_slides']){
  const mesh=ship.getObjectByName(name);if(!mesh)continue;
  const p=mesh.geometry.attributes.position,points=new Map();
  for(let i=0;i<p.count;i++)if(p.getY(i)<.009){
   const v=new T.Vector3().fromBufferAttribute(p,i),key=[v.x,v.z].map(x=>Math.round(x*20)).join(',');points.set(key,v);
  }
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,m);
   for(const p of points.values())feet.push(p.clone().applyMatrix4(m));
  }
 }
 const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);
 for(const mesh of decks){
  const g=mesh.geometry;g.computeBoundingBox();const b=g.boundingBox,s=b.getSize(new T.Vector3());
  const width=cfg.textureSize>=2048?1536:cfg.textureSize>=1024?1024:512,height=cfg.textureSize>=1024?384:128;
  const c=document.createElement('canvas');c.width=width;c.height=height;
  const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,width,height);
  const marks=new Map();
  for(const p of feet){
   if(p.x<b.min.x||p.x>b.max.x||p.z<b.min.z||p.z>b.max.z)continue;
   ray.set(p.clone().addScaledVector(down,-.075),down);ray.far=.17;
   if(!ray.intersectObject(mesh,false).length)continue;
   // Cluster many vertices on the same 5 cm patch before drawing, avoiding
   // darkness proportional to mesh tessellation.
   const key=[p.x,p.z].map(x=>Math.round(x*8)).join(',');marks.set(key,p);
  }
  for(const p of marks.values()){
   const x=(p.z-b.min.z)/s.z*width,y=(1-(p.x-b.min.x)/s.x)*height;
   ctx.save();ctx.translate(x,y);ctx.scale(width/s.z,height/s.x);
   const grad=ctx.createRadialGradient(0,0,.015,0,0,.16);grad.addColorStop(0,'rgba(0,0,0,.30)');grad.addColorStop(.5,'rgba(0,0,0,.12)');grad.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=grad;ctx.fillRect(-.17,-.17,.34,.34);ctx.restore();
  }
  const uv=[],p=g.attributes.position;
  for(let i=0;i<p.count;i++)uv.push((p.getZ(i)-b.min.z)/s.z,(p.getX(i)-b.min.x)/s.x);
  g.setAttribute('uv1',new T.Float32BufferAttribute(uv,2));
  const map=new T.CanvasTexture(c);map.name='deck-truck-contact';map.channel=1;map.anisotropy=4;
  mesh.material=mesh.material.clone();mesh.material.aoMap=map;mesh.material.aoMapIntensity=.72;
  mesh.userData.deckContacts=marks.size;
 }
}
