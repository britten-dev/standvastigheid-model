import * as T from 'three';
import {asTexture,normalFrom} from './textures.js';
const cache=new Map();
// TubeGeometry's U runs along the rope. One U is one six-diameter lay;
// V runs once around it. The pattern therefore survives different rope lengths.
export function laidRopeUV(g,curve,radius){
 const uv=g.attributes.uv;if(!uv)return g;
 const turns=curve.getLength()/Math.max(.025,radius*12);
 for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*turns);
 return g;
}
export function ropeMaterials(cfg){
 const fine=!!cfg.surfaceDetail;if(cache.has(fine))return cache.get(fine);
 const size=128,c=document.createElement('canvas');c.width=c.height=size;
 const context=c.getContext('2d'),data=context.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const phase=Math.PI*6*(y-x)/size,h=128+38*Math.cos(phase)+3*Math.cos(phase*11),i=(y*size+x)*4;
  data.data.set([h,h,h,255],i);
 }
 context.putImageData(data,0,0);
 const normal=fine?asTexture(normalFrom(c,1),{srgb:false}):null;
 const make=(name,color,scale)=>new T.MeshStandardMaterial({name,color,roughness:.94,metalness:0,
  normalMap:normal,normalScale:new T.Vector2(scale,scale)});
 const result={standingRigging:make('tarred laid hemp',0x29271f,.28),runningRigging:make('working hemp cordage',0x9c8b68,.22)};
 cache.set(fine,result);return result;
}
