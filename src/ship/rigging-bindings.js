import * as T from 'three';
import { ropeLines, ropeTube } from '../util/solids.js';
import { mergeGeometries } from '../util/loft.js';
import {laidRopeUV} from './rope-finish.js';

// Keep one render batch, with the provenance of each span. Node names and local
// points/cloth vertex indices keep build metadata free of scene references.
//
// A ship has one of these batches for each yard, so that taking a yard away takes its
// ropes with it (src/ship/damage.js). Each carries its own bindings and its own record
// of where every rope ends, `ropeEnds`, which tools/check-rig-parts.mjs reads to prove
// that no rope is left made fast to a spar that is gone.
export function runningRopeGeometry(spans,radius,cfg) {
  const pieces=[],bindings=[],ends=[];let start=0;
  for(const span of spans) {
    const g=cfg.ropesAsTubes
      ? ropeTube(span.curve,radius,{tubular:cfg.ropeSegments,radial:cfg.ropeRadial})
      : ropeLines([span.curve],cfg.ropeSegments);
    const count=g.attributes.position.count,t=new Float32Array(count),freedom=new Float32Array(count);
    for(let i=0;i<count;i++) {
      t[i]=cfg.ropesAsTubes?g.attributes.uv.getX(i):(Math.floor(i/2)+i%2)/cfg.ropeSegments;
      freedom[i]=t[i]===0||t[i]===1?0:Math.sin(Math.PI*t[i]);
    }
    g.setAttribute('aRopeT',new T.BufferAttribute(t,1));
    g.setAttribute('aRopeFreedom',new T.BufferAttribute(freedom,1));
    // Preserve the normalized attachment coordinate above before scaling texture U.
    if(cfg.ropesAsTubes)laidRopeUV(g,span.curve,radius);
    ends.push(...span.curve.getPoint(0).toArray(),...span.curve.getPoint(1).toArray());
    if(span.from||span.to)bindings.push({start,count,from:span.from,to:span.to,
      a:span.curve.getPoint(0).toArray(),b:span.curve.getPoint(1).toArray(),label:span.label});
    start+=count;pieces.push(g);
  }
  const geometry=mergeGeometries(pieces);
  geometry.userData.riggingBindings=bindings;
  geometry.userData.ropeEnds=ends;
  for(const g of pieces)g.dispose();
  return geometry;
}

// Is this node still part of the ship and shown? A carried-away part is hidden, and one
// a host has taken out of the scene altogether is detached; either way nothing is made
// fast to it any more.
const live=(node,ship)=>{
  for(let o=node;o;o=o.parent){if(!o.visible)return false;if(o===ship)return true;}
  return false;
};

/**
 * Keep every running rope made fast to the spars and cloth it is bound to as they move.
 * There is one rope mesh for each yard, so the bindings are kept for each mesh. A rope
 * whose mesh is hidden, or one of whose ends is made fast to something that is hidden or
 * gone, is left where it was: it is not drawn, and nothing is thrown.
 */
export function createRiggingBindings(ship) {
  const meshes=[];
  ship.traverse(o=>{if(o.geometry?.userData.riggingBindings?.length)meshes.push(o);});
  const batches=meshes.map(mesh=>{
    const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal;
    const anchor=desc=>{
      if(!desc)return null;
      const node=ship.getObjectByName(desc.node);
      // A part the host has already removed is simply not there to hold a rope.
      return {...desc,node:node??null,point:desc.point?new T.Vector3().fromArray(desc.point):null};
    };
    // `along` is the gradient of the rope's own coordinate, its chord over its length
    // squared: t runs 0 to 1 from one end of the span to the other.
    const bindings=g.userData.riggingBindings.map(r=>{
      const restA=new T.Vector3().fromArray(r.a),restB=new T.Vector3().fromArray(r.b);
      const along=restB.clone().sub(restA),length2=along.lengthSq();
      return {...r,mesh,from:anchor(r.from),to:anchor(r.to),restA,restB,
        along:length2>1e-12?along.divideScalar(length2):along.set(0,0,0),
        deltaA:new T.Vector3(),deltaB:new T.Vector3()};
    });
    mesh.frustumCulled=false;
    return {mesh,g,p,n,t:g.attributes.aRopeT,rest:p.array.slice(),restN:n?.array.slice(),bindings,inverse:new T.Matrix4()};
  });
  const a=new T.Vector3(),b=new T.Vector3(),d=new T.Vector3();
  function resolve(binding,out,restPoint,inverse) {
    if(!binding)return out.copy(restPoint);
    // getVertexPosition includes the current reef/furl morph, including reversals.
    if(binding.vertex!==undefined)binding.node.getVertexPosition(binding.vertex,out);
    else out.copy(binding.point);
    return out.applyMatrix4(binding.node.matrixWorld).applyMatrix4(inverse);
  }
  function update() {
    for(const batch of batches) {
      const {mesh,p,n,t,rest,restN,bindings,inverse}=batch;
      if(!live(mesh,ship))continue;
      mesh.updateWorldMatrix(true,false);inverse.copy(mesh.matrixWorld).invert();
      let changed=false;
      for(const r of bindings) {
        if((r.from&&!live(r.from.node,ship))||(r.to&&!live(r.to.node,ship)))continue;
        r.from?.node.updateWorldMatrix(true,false);r.to?.node.updateWorldMatrix(true,false);
        resolve(r.from,a,r.restA,inverse).sub(r.restA);resolve(r.to,b,r.restB,inverse).sub(r.restB);
        if(a.distanceToSquared(r.deltaA)+b.distanceToSquared(r.deltaB)<1e-14)continue;
        r.deltaA.copy(a);r.deltaB.copy(b);changed=true;
        // Each span is moved by its two ends' displacements blended along it, p + dA(1-t) + dB t:
        // a shear, whose Jacobian is I + (dB-dA) along^T. Normals go through its inverse
        // transpose, which Sherman-Morrison gives in closed form,
        //   n' = n - along ((dB-dA).n) / (1 + (dB-dA).along),
        // so only the spans that moved are touched, from the normals the rope was built with.
        // Recomputing every normal of every rope from its faces each frame was the slowest
        // thing here, and left a crease along the seam of each tube, where the ring's first
        // and last vertices are separate and each saw only the faces on its own side.
        const grad=r.along;
        // A span squashed to nothing has no normals to speak of; keep the sum off zero.
        const stretch=Math.max(1e-3,1+d.subVectors(b,a).dot(grad));
        for(let i=r.start;i<r.start+r.count;i++) {
          const u=t.getX(i),v=1-u,k=i*3;
          p.setXYZ(i,rest[k]+a.x*v+b.x*u,rest[k+1]+a.y*v+b.y*u,rest[k+2]+a.z*v+b.z*u);
          if(!n)continue;
          const s=(d.x*restN[k]+d.y*restN[k+1]+d.z*restN[k+2])/stretch;
          const x=restN[k]-grad.x*s,y=restN[k+1]-grad.y*s,z=restN[k+2]-grad.z*s,m=1/Math.hypot(x,y,z);
          n.setXYZ(i,x*m,y*m,z*m);
        }
      }
      if(changed){p.needsUpdate=true;if(n)n.needsUpdate=true;}
    }
  }
  update();
  const bindings=batches.flatMap(x=>x.bindings);
  return {update,bindings,meshes,mesh:meshes[0]??null,batches};
}
