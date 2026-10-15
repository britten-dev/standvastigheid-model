import * as T from 'three';
import {mergeGeometries} from '../util/loft.js';
import {SPEC, OFFSETS} from '../spec/spec.js';

// Every port in her side, as a rectangle in side elevation: the two batteries, the
// quarterdeck, and the bridle ports for the bow chasers. Positions, widths, sills and
// heads are the ones measured off the Washington's sheer plan (docs/offsets.json); the
// bridle ports are reconstructed (docs/research/03-hull-decks-guns.md).
export function portRecords(model) {
 const S=k=>SPEC[k].value, out=[];
 for(const [kind,list] of [['lower',OFFSETS.ports.lower],['upper',OFFSETS.ports.upper],['quarterdeck',OFFSETS.ports.quarterdeck]])
  list.forEach((p,index)=>out.push({kind,index,z:p.z,width:p.width,y0:p.sill,y1:p.head,height:p.head-p.sill}));
 // The bridle ports: one a side in the bluff of the bow on the lower deck, abaft the
 // hawse holes, sized and sited like the lower battery's ports.
 const zB=model.fromStem(S('bridle_port_from_stem'));
 const sill=model.featureYAt(zB).lower_port_sill+S('bridle_port_sill_rise');
 out.push({kind:'bridle',index:0,z:zB,width:S('bridle_port_width'),y0:sill,y1:sill+S('bridle_port_height'),height:S('bridle_port_height')});
 return out;
}

export function gunOpenings(model, kinds=null) {
 return portRecords(model).filter(p=>!kinds||kinds.includes(p.kind))
  .map(p=>({z0:p.z-p.width/2,z1:p.z+p.width/2,y0:p.y0,y1:p.y1,z:p.z,kind:p.kind}));
}

// The quarterdeck's own openings, for the inboard planking of its bulwark.
export const upperGunOpenings = (model) => gunOpenings(model, ['quarterdeck']);

// Subtract Y/Z rectangles by clipping triangles and interpolating every vertex
// attribute. No quantised oversized holes, CSG dependency or faceted normals.
export function cutGunOpenings(geometry, openings) {
 const attrs=[['position',geometry.attributes.position],...Object.entries(geometry.attributes).filter(([name])=>name!=='position')], stride=attrs.reduce((n,[,a])=>n+a.itemSize,0);
 const offsets=[];let offset=0;for(const [,a]of attrs){offsets.push(offset);offset+=a.itemSize;}
 const p=geometry.attributes.position, index=geometry.index, data=[],indices=[],lookup=new Map();
 const vertex=id=>attrs.flatMap(([,a])=>Array.from({length:a.itemSize},(_,k)=>a.array[id*a.itemSize+k]));
 const half=(polygon,axis,bound,positive)=>{
  const out=[];for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],da=(a[axis]-bound)*(positive?1:-1),db=(b[axis]-bound)*(positive?1:-1);
   if(da>=-1e-8)out.push(a);
   if((da>1e-8&&db< -1e-8)||(da< -1e-8&&db>1e-8)){
    const t=da/(da-db);out.push(a.map((v,k)=>v+(b[k]-v)*t));
   }
  }return out;
 };
 const emit=poly=>{
  if(poly.length<3)return;
  const ids=poly.map(v=>{const key=v.map(x=>x.toFixed(6)).join(',');if(lookup.has(key))return lookup.get(key);
   const id=data.length/stride;data.push(...v);lookup.set(key,id);return id;});
  for(let i=1;i<ids.length-1;i++)if(ids[0]!==ids[i]&&ids[i]!==ids[i+1]&&ids[i+1]!==ids[0])indices.push(ids[0],ids[i],ids[i+1]);
 };
 for(let i=0;i<(index?.count??p.count);i+=3){
  const tri=[0,1,2].map(k=>vertex(index?index.getX(i+k):i+k));let polygons=[tri];
  for(const o of openings){
   if(Math.max(...tri.map(v=>v[2]))<=o.z0||Math.min(...tri.map(v=>v[2]))>=o.z1||Math.max(...tri.map(v=>v[1]))<=o.y0||Math.min(...tri.map(v=>v[1]))>=o.y1)continue;
   const next=[];
   for(const poly of polygons){
    let inside=poly;
    for(const [axis,bound,positive]of [[2,o.z0,true],[2,o.z1,false],[1,o.y0,true],[1,o.y1,false]]){
     const outside=half(inside,axis,bound,!positive);if(outside.length>=3)next.push(outside);
     inside=half(inside,axis,bound,positive);if(inside.length<3)break;
    }
   }polygons=next;
  }
  polygons.forEach(emit);
 }
 const out=new T.BufferGeometry();
 attrs.forEach(([name,a],j)=>{const array=new Float32Array(data.length/stride*a.itemSize);
  for(let v=0;v<data.length/stride;v++)for(let k=0;k<a.itemSize;k++)array[v*a.itemSize+k]=data[v*stride+offsets[j]+k];
  out.setAttribute(name,new T.BufferAttribute(array,a.itemSize));});
 out.setIndex(indices);out.userData={...geometry.userData};return out;
}

// Four timber reveals bridge the exterior shell and inboard planking. They sit
// outside the aperture; no panel is placed behind the barrel.
export function upperGunLinings(model,material){
 const parts=[],depth=SPEC.side_thickness.value+.018,trim=.035;
 for(const o of upperGunOpenings(model))for(const side of [-1,1]){
  const centreY=(o.y0+o.y1)/2,w=o.z1-o.z0,h=o.y1-o.y0;
  const bottom=model.halfBreadthAt(o.z,o.y0),top=model.halfBreadthAt(o.z,o.y1);
  const lean=Math.atan2(bottom-top,h)*side;
  for(const [sy,sz,dy,dz]of [[trim,w+trim,-h/2-trim/2,0],[trim,w+trim,h/2+trim/2,0],[h,trim,0,-w/2-trim/2],[h,trim,0,w/2+trim/2]]){
   const g=new T.BoxGeometry(depth,sy,sz);g.translate(0,dy,dz);g.rotateZ(lean);
   g.translate(((bottom+top)/2-depth/2)*side,centreY,o.z);parts.push(g);
  }
 }
 const mesh=new T.Mesh(mergeGeometries(parts),material);mesh.name='upper_gunport_linings';return mesh;
}
