import * as T from 'three';
import {asTexture, normalFrom} from './textures.js';
const cache=new Map();

// One tile represents 0.8 m across the timber and 4 m along it. These maps
// are shared by all spars; UVs, rather than per-object textures, set the scale.
export function sparUV(g,length,diameter) {
 const uv=g.attributes.uv,n=g.attributes.normal;
 const seams=new Map();
 for(let i=0;i<uv.count;i++)if(Math.abs(n.getY(i))<.99&&(uv.getX(i)===0||uv.getX(i)===1)){
  const key=uv.getY(i),other=seams.get(key);
  if(other===undefined)seams.set(key,i);
  else{const avg=new T.Vector3().fromBufferAttribute(n,other).add(new T.Vector3().fromBufferAttribute(n,i)).normalize();
   n.setXYZ(other,avg.x,avg.y,avg.z);n.setXYZ(i,avg.x,avg.y,avg.z);}
 }
 for(let i=0;i<uv.count;i++) {
  if(Math.abs(n.getY(i))>.99)continue; // retain the small end-face UVs
  uv.setXY(i,uv.getX(i)*Math.PI*diameter/.8,uv.getY(i)*length/4);
 }
 return g;
}

export function sparMaterials(cfg){
 const size=cfg.textureSize>=1024?512:128;
 if(cache.has(size))return cache.get(size);
 const canvas=()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;};
 const bright=canvas(),black=canvas(),rough=canvas(),height=canvas();
 const contexts=[bright,black,rough,height].map(c=>c.getContext('2d'));
 const images=contexts.map(c=>c.createImageData(size,size));
 const tau=Math.PI*2;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;
  // Periodic growth lines and long checks: no plank-grid pattern or baked light.
  const bend=.015*Math.sin(tau*v)+.006*Math.sin(tau*(v*3+u));
  const grain=Math.sin(tau*(u*47+bend*20))*.42+Math.sin(tau*(u*109+bend*43))*.18;
  const broad=Math.sin(tau*(u*7+.11*Math.sin(v*tau)))*.34+Math.sin(tau*(u*17-v))*.16;
  const check=Math.pow(Math.max(0,Math.sin(tau*(u*13+.025*Math.sin(v*tau)))),40)
    *Math.pow(Math.max(0,Math.sin(tau*(v*2+u*3))),4);
  const worn=(grain+broad)*.7-check*.55,i=(y*size+x)*4;
  const values=[[143+worn*27,113+worn*25,73+worn*20,255],
   [36+worn*9,35+worn*8,31+worn*7,255],
   [199-broad*15+check*12,199-broad*15+check*12,199-broad*15+check*12,255],
   [128+grain*9-check*16,128+grain*9-check*16,128+grain*9-check*16,255]];
  for(let k=0;k<4;k++)images[k].data.set(values[k],i);
 }
 contexts.forEach((c,i)=>c.putImageData(images[i],0,0));
 const normal=cfg.surfaceDetail?asTexture(normalFrom(height,.8),{srgb:false}):null;
 const roughness=asTexture(rough,{srgb:false});
 const make=(name,map,scale)=>new T.MeshStandardMaterial({name,map:asTexture(map),color:0xffffff,
  roughness:1,roughnessMap:roughness,normalMap:normal,normalScale:new T.Vector2(scale,scale),metalness:0});
 const top=canvas(),topHeight=canvas(),tc=top.getContext('2d'),th=topHeight.getContext('2d');
 tc.drawImage(black,0,0);th.drawImage(height,0,0);
 for(const c of [tc,th]){
  c.strokeStyle=c===tc?'#181713':'#6d6d6d';c.lineWidth=1;
  for(let i=0;i<4;i++){
   const x=i*size/4;c.beginPath();c.moveTo(x,0);c.lineTo(x,size);c.stroke();
   const y=((i*137)%size);c.beginPath();c.moveTo(x,y);c.lineTo(x+size/4,y);c.stroke();
  }
 }
 const topMat=make('mast top planking',top,.13);
 if(cfg.surfaceDetail)topMat.normalMap=asTexture(normalFrom(topHeight,.8),{srgb:false});
 const result={bright:make('weathered spar timber',bright,.2),black:make('tarred yard timber',black,.13),top:topMat};
 cache.set(size,result);return result;
}
