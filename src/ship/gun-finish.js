import * as T from 'three';
import {asTexture,normalFrom,woodGrain} from './textures.js';
import {rng} from '../util/math.js';
const cache=new Map();

// Gun wood uses metres, not the unrelated UV conventions of boxes and extrusions.
// Side grain follows the cheek; horizontal timber follows the same fore-aft axis.
export function metreGrain(g){
 const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){
  const side=Math.abs(n.getZ(i))>Math.abs(n.getY(i));
  uv[i*2]=p.getX(i)/.72;uv[i*2+1]=(side?p.getY(i):p.getZ(i))/.72;
 }
 g.setAttribute('uv',new T.BufferAttribute(uv,2));return g;
}
export function gunMaterials(cfg){
 const size=cfg.textureSize>=1024?512:128;
 if(cache.has(size))return cache.get(size);
 const canvas=()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;};
 const iron=canvas(),rough=canvas(),height=canvas(),r=rng(1796);
 const ig=iron.getContext('2d'),rg=rough.getContext('2d'),hg=height.getContext('2d');
 const a=ig.createImageData(size,size),b=rg.createImageData(size,size),h=hg.createImageData(size,size);
 for(let i=0;i<a.data.length;i+=4){
  const p=r(),v=48+p*13,rr=181+p*34,hh=127+(p-.5)*9;
  a.data.set([v*.96,v,v*1.03,255],i);b.data.set([rr,rr,rr,255],i);h.data.set([hh,hh,hh,255],i);
 }
 ig.putImageData(a,0,0);rg.putImageData(b,0,0);hg.putImageData(h,0,0);
 const fine=cfg.surfaceDetail;
 const gunIron=new T.MeshStandardMaterial({name:'blackened cast iron',map:asTexture(iron),color:0xffffff,
  roughness:1,roughnessMap:asTexture(rough,{srgb:false}),metalness:.36,envMapIntensity:.55,
  normalMap:fine?asTexture(normalFrom(height,.65),{srgb:false}):null,normalScale:new T.Vector2(.10,.10),vertexColors:true});
 const wood=woodGrain({base:'#704438',dark:'#432e26',light:'#956552',size,streaks:220,seed:1805});
 const gunPaint=new T.MeshStandardMaterial({name:'worn red ochre carriage timber',map:asTexture(wood),roughness:.83,
  normalMap:fine?asTexture(normalFrom(wood,.7),{srgb:false}):null,normalScale:new T.Vector2(.14,.14),vertexColors:true});
 const gunBlock=new T.MeshStandardMaterial({name:'oiled tackle block elm',map:asTexture(woodGrain({base:'#715638',dark:'#483b2a',light:'#9e7d50',size,seed:81})),roughness:.76,vertexColors:true});
 const mats={gunIron,gunPaint,gunBlock};cache.set(size,mats);return mats;
}
