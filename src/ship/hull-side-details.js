// Raised structural timber follows the actual loft, including its UV mapping.
// Projections and eased edges are reconstruction; locations retain the existing spec.
import * as THREE from 'three';
import { SPEC, PAINT } from '../spec/spec.js';
import { V } from './hull.js';

export function hullSideDetails(cfg, sections) {
  if (!cfg.hullSideJoinery) return null;
  const pos = [], uv = [], indices = [];
  const n = sections.length, np = sections[0].points.length;
  // Sample the rendered shell rather than another approximation of the offsets.
  const shell = (u, v) => {
    const s = Math.min(n - 2, Math.floor(u * (n - 1))), a = u * (n - 1) - s;
    const r = Math.min(np - 2, Math.floor(v * (np - 1))), b = v * (np - 1) - r;
    const p = sections[s].points, q = sections[s + 1].points;
    return [0, 1].map(k => (p[r][k] * (1-b) + p[r+1][k] * b) * (1-a)
      + (q[r][k] * (1-b) + q[r+1][k] * b) * a).concat(sections[s].z * (1-a) + sections[s+1].z * a);
  };
  const beamAllowance = (SPEC.hull_beam_extreme.value - SPEC.hull_beam_moulded.value) / 2;
  const bands = [{ name: 'main-wale', v0: V.wale_bottom, v1: V.wale_top,
    projection: Math.min(.1016, beamAllowance), bevel: .008 }];
  if (cfg.hullSideJoinery === 'full') bands.push({ name: 'sheer-moulding',
    v0: V.sheer_strake - PAINT.ochre_moulding_v.value / 2,
    v1: V.sheer_strake + PAINT.ochre_moulding_v.value / 2,
    projection: .026, bevel: .005 });
  const counts = [];
  for (const band of bands) {
    const { v0, v1, projection, bevel } = band;
    const span = shell(.5, v1)[1] - shell(.5, v0)[1];
    const bv = Math.min((v1-v0)*.2, bevel / span * (v1-v0));
    // Horizontal upper/lower landings, eased corners, closed back sunk into the shell.
    const profile = [[v0,-.008],[v0,projection-bevel],[v0+bv,projection],
      [v1-bv,projection],[v1,projection-bevel],[v1,-.008]];
    const start = indices.length;
    for (const side of [1,-1]) {
      const vertex = (i,j) => {
        const u = i/(n-1), [v,out] = profile[j], p = shell(u,v);
        // Feather into the stem and quarter over the end 2%: no detached ends.
        const t = Math.min(1,u/.02,(1-u)/.02), taper = .015 + .985*t*t*(3-2*t);
        const k=pos.length/3;
        pos.push((p[0] + (out+.008)*taper-.008)*side,p[1],p[2]);
        // Stay clear of the copper/paint filter boundary: timber must not
        // inherit the metalness of the adjacent copper sheathing.
        const inset = band.name === 'main-wale' ? .002 : .0003;
        uv.push(u*SPEC.hull_length_gundeck.value/PAINT.hull_map_metres.value,
          Math.max(v0+inset,Math.min(v1-inset,v)));
        return k;
      };
      const tri=(a,b,c)=>side>0?indices.push(a,b,c):indices.push(a,c,b);
      // Separate vertices at each profile corner retain the edge shape. Normals
      // remain continuous along the timber's run rather than faceting at stations.
      for(let j=0;j<profile.length;j++) {
        const next=(j+1)%profile.length, first=pos.length/3;
        for(let i=0;i<n;i++){vertex(i,j);vertex(i,next);}
        for(let i=0;i<n-1;i++) {
          const a=first+i*2,b=a+1,c=a+2,d=a+3;
          tri(a,b,c);tri(b,d,c);
        }
      }
      // Closed end grain is buried inside the shell after the feathering.
      for (const i of [0,n-1]) {
        const rim=profile.map((_,j)=>vertex(i,j));
        for(let j=1;j<rim.length-1;j++) {
          if(i===0)tri(rim[0],rim[j+1],rim[j]);
          else tri(rim[0],rim[j],rim[j+1]);
        }
      }
    }
    counts.push({ name:band.name, projection, triangles:(indices.length-start)/3 });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  geometry.userData.bands=counts;
  return geometry;
}
