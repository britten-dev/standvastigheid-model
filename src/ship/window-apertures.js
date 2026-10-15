import * as T from 'three';

// Subtract each window prism from the existing loft, preserving interpolated
// UVs and normals. This cuts the timber itself; transparent glass is not a hole.
//
// `nominalY` undoes the round-up of the stern at a point, so a window cut at one height is
// cut at that height across the whole curved row. A window may carry its own `nominalY`,
// because a chase port in the counter and a light at the cabin do not share a round-up.
export function cutWindowApertures(geometry, windows, nominalY) {
  const attrs=Object.entries(geometry.attributes);
  const source=geometry.index?.array ?? Array.from({length:geometry.attributes.position.count},(_,i)=>i);
  const vertex=i=>Object.fromEntries(attrs.map(([name,a])=>[name,Array.from({length:a.itemSize},(_,k)=>a.array[i*a.itemSize+k])]));
  const mix=(a,b,t)=>Object.fromEntries(attrs.map(([name])=>[name,a[name].map((v,k)=>v+(b[name][k]-v)*t)]));
  function clip(poly,distance,inside) {
    const out=[];
    for(let i=0;i<poly.length;i++) {
      const a=poly[i],b=poly[(i+1)%poly.length],da=distance(a.position),db=distance(b.position);
      const inA=inside?da>=0:da<=0,inB=inside?db>=0:db<=0;
      if(inA)out.push(a);
      if(inA!==inB)out.push(mix(a,b,da/(da-db)));
    }
    return out;
  }
  const out=Object.fromEntries(attrs.map(([name])=>[name,[]]));
  for(let i=0;i<source.length;i+=3) {
    let polys=[[vertex(source[i]),vertex(source[i+1]),vertex(source[i+2])]];
    for(const w of windows) {
      const next=[];
      for(const poly of polys) {
        let remain=poly;
        const ny=w.nominalY??nominalY;
        for(const distance of [p=>p[0]-w.x0,p=>w.x1-p[0],p=>ny(p)-w.y0,p=>w.y1-ny(p)]) {
          if(remain.length<3)break;
          const outside=clip(remain,distance,false);if(outside.length>=3)next.push(outside);
          remain=clip(remain,distance,true);
        }
      }
      polys=next;
    }
    for(const poly of polys)for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]])
      for(const [name] of attrs)out[name].push(...v[name]);
  }
  const result=new T.BufferGeometry();
  for(const [name,a] of attrs)result.setAttribute(name,new T.Float32BufferAttribute(out[name],a.itemSize));
  result.normalizeNormals();geometry.dispose();return result;
}
