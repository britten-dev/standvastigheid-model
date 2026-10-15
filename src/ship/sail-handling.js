import * as T from 'three';
import { SUIT } from './sails.js';

const clamp = x => Math.max(0, Math.min(1, x));
const clothUV = x => x < .00201 ? 0 : x > .99799 ? 1 : x;
const ease = x => { x = clamp(x); return x*x*(3-2*x); };
const STATES = ['full', 'topsails', 'storm', 'furled'];

// Morph targets use the same geometry in colour, reflection and shadow passes.
// The head remains bent to the yard. Clews rise first, then the bunt gathers;
// reefed cloth is gathered at the head, not scaled like a rubber sheet.
function makeTargets(mesh) {
  const g = mesh.geometry, meta = g.userData.handling;
  const p = g.attributes.position, uv = g.attributes.uv;
  const targets = [[], [], []], q = new T.Vector3(), rest = new T.Vector3();
  const anchor = new T.Vector3(), bundle = new T.Vector3();
  const root = new T.Vector3().fromArray(meta.root ?? meta.tack ?? [0,-.12,0]);
  const end = new T.Vector3().fromArray(meta.end ?? meta.tack ?? [0,-.12,0]);
  for (let i=0; i<p.count; i++) {
    const u = clothUV(uv.getX(i)*meta.tiles % 1);
    const v = 1-clothUV(uv.getY(i)*meta.tiles % 1);
    rest.fromBufferAttribute(p,i);
    if (meta.kind === 'square') {
      anchor.set((u-.5)*meta.headWidth,-.12,0);
      bundle.copy(anchor);
      bundle.x *= 1-.1*v;
      bundle.y -= .20*Math.sin(Math.PI*v)*(1-.5*Math.abs(u*2-1));
      bundle.z += .14*Math.sin(v*Math.PI*3)*Math.sin(Math.PI*u);
      const clew = .40+.48*Math.pow(Math.abs(2*u-1),.7);
      q.copy(rest).lerp(bundle,clew*Math.pow(v,.45));
      q.z += .18*Math.sin(v*Math.PI*7)*Math.sin(Math.PI*v)*Math.sin(Math.PI*u);
      targets[0].push(...q.toArray());
      targets[1].push(...bundle.toArray());
      const exposed = Math.max(0,v-(1-meta.reef));
      q.copy(anchor).lerp(rest,v>1e-6?exposed/v:0);
      if(v<1-meta.reef) {
        q.y -= .12*Math.sin(v/(1-meta.reef)*Math.PI);
        q.z += .11*Math.sin(v/(1-meta.reef)*Math.PI*3)*Math.sin(Math.PI*u);
      }
      targets[2].push(...q.toArray());
    } else {
      anchor.lerpVectors(root,end,u);
      bundle.copy(anchor);
      bundle.y += .17*(1-v);
      bundle.x += .09*Math.sin(u*Math.PI*6)*Math.sin(Math.PI*v);
      if (meta.kind==='stay') bundle.z += .24*u;
      q.copy(rest).lerp(bundle,.65);
      q.x += .11*Math.sin(v*Math.PI*8)*Math.sin(Math.PI*u);
      targets[0].push(...q.toArray()); targets[1].push(...bundle.toArray());
      targets[2].push(...rest.toArray());
    }
  }
  g.morphAttributes.position = targets.map(a=>new T.Float32BufferAttribute(a,3));
  g.morphAttributes.normal = targets.map(a=>{
    const shape = new T.BufferGeometry(); shape.setIndex(g.index);
    shape.setAttribute('position',new T.Float32BufferAttribute(a,3));
    shape.computeVertexNormals(); const normal=shape.attributes.normal.clone(); shape.dispose(); return normal;
  });
  mesh.updateMorphTargets();
  // Bounds include both the open cloth and its gathered bundle.
  g.computeBoundingBox();g.computeBoundingSphere();
  mesh.userData.sailSpread = {value:1};
}

/** Build with full sails and animatedSails:true, then retain this rig for every order. */
export function createSailHandling(ship, initial='full') {
  const parts = new Map();
  ship.traverse(mesh=>{
    const meta=mesh.geometry?.userData.handling;
    if (!meta) return;
    makeTargets(mesh);
    if(!parts.has(meta.name))parts.set(meta.name,{name:meta.name,meshes:[],furl:0,reef:0});
    parts.get(meta.name).meshes.push(mesh);
  });
  if(parts.size!==15)throw new Error('Sail handling needs buildShip({sails: \'full\', animatedSails: true})');
  let state=initial, elapsed=0, duration=0, effectiveIndex=STATES.indexOf(initial), fromIndex=effectiveIndex;
  function paint(p) {
    const gather=p.furl<=.65?p.furl/.65:(1-p.furl)/.35;
    const stow=Math.max(0,(p.furl-.65)/.35);
    for(const mesh of p.meshes) {
      mesh.morphTargetInfluences[0]=gather;
      mesh.morphTargetInfluences[1]=stow;
      mesh.morphTargetInfluences[2]=p.reef*(1-gather-stow);
      mesh.userData.sailSpread.value=(1-p.furl)*(1-.5*p.reef);
    }
  }
  function setState(next,{immediate=false}={}) {
    if(!SUIT[next])throw new Error(`Unknown sail state: ${next}`);
    if(next===state && duration>0 && !immediate)return;
    state=next;elapsed=0;duration=0;fromIndex=effectiveIndex;
    let i=0;
    for(const p of parts.values()) {
      p.fromFurl=p.furl;p.fromReef=p.reef;
      p.toFurl=SUIT[next].set.includes(p.name)?0:1;
      p.toReef=SUIT[next].reefs[p.name]?1:0;
      p.delay=(i++%3)*1.2;
      p.seconds=(p.name.includes('course')?20:15)+p.delay;
      const changed=Math.abs(p.toFurl-p.furl)+Math.abs(p.toReef-p.reef)>.00001;
      if(changed && !immediate)duration=Math.max(duration,p.seconds+p.delay);
      if(immediate){p.furl=p.toFurl;p.reef=p.toReef;paint(p);}
    }
    if(immediate || duration===0)effectiveIndex=STATES.indexOf(next);
  }
  function update(dt) {
    if(!duration)return;
    elapsed=Math.min(duration,elapsed+Math.max(0,dt));
    for(const p of parts.values()) {
      const t=ease((elapsed-p.delay)/p.seconds);
      p.furl=T.MathUtils.lerp(p.fromFurl,p.toFurl,t);
      p.reef=T.MathUtils.lerp(p.fromReef,p.toReef,t);paint(p);
    }
    effectiveIndex=T.MathUtils.lerp(fromIndex,STATES.indexOf(state),ease(elapsed/duration));
    if(elapsed===duration)duration=0;
  }
  setState(initial,{immediate:true});
  return {
    setState,update,parts,
    get state(){return state;},get active(){return duration>0;},get effectiveIndex(){return effectiveIndex;},
    snapshot(){return {state,elapsed,duration,effectiveIndex,fromIndex,parts:[...parts.values()].map(({meshes,...p})=>({...p}))};},
    restore(saved){
      ({state,elapsed,duration,effectiveIndex,fromIndex}=saved);
      for(const p of saved.parts){const part=parts.get(p.name);if(part){Object.assign(part,p);paint(part);}}
    },
  };
}
