import * as T from 'three';
import {mergeGeometries} from '../util/loft.js';
import {SPEC} from '../spec/spec.js';

// Upper batteries share the gun module's established stations. Their sides
// are present in the loft: they require real openings, not barrels through wood.
export function upperGunOpenings(model) {
 const S=k=>SPEC[k].value, stations=[];
 const n=S('gun_quarterdeck_carronades_forward')+S('gun_4pdr_count')/2-1;
 for(let i=0;i<n;i++)stations.push([model.fromStem(S('gun_quarterdeck_first_from_stem')+i*S('gun_quarterdeck_spacing')),i<2?'carronade':'gun_4pdr']);
 stations.push([model.fromStem(S('gun_forecastle_carronade_from_stem')),'carronade'],[model.fromStem(S('gun_forecastle_gun_from_stem')),'gun_4pdr']);
 return stations.map(([z,nature])=>{
  const centre=model.standingDeckAt(z)+S(nature==='carronade'?'carronade_axis_above_deck':'gun_4pdr_axis_above_deck');
  const width=S('qd_port_width'),height=S('qd_port_height');
  return {z0:z-width/2,z1:z+width/2,y0:centre-height/2,y1:centre+height/2,z};
 });
}

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
