import * as T from 'three';

// Small-scale sky occlusion and runoff tied to the built fittings. This is
// separate from the coarse whole-ship AO and never paints a sun direction.
export function finishHullContact(ship,cfg,model,ports) {
 if(!cfg.surfaceDetail)return;
 const width=cfg.textureSize>=1024?1024:512,rows=cfg.textureSize>=1024?256:128;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=rows*2;
 const context=canvas.getContext('2d'),image=context.createImageData(width,rows*2);
 const yMin=-.75,yMax=Math.max(...[model.zFwd,0,model.zAft].map(z=>model.railYAt(z)))+.4;
 const channels=[];
 ship.traverse(o=>{if(o.isMesh&&/^(fore|main|mizzen)_channel$/.test(o.name)){
  o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
  channels.push({lo:b.min.z,hi:b.max.z,y:b.min.y,reference:model.featureYAt((b.min.z+b.max.z)/2).rail});
 }});
 const below=(y,edge,spread)=>y<=edge?Math.exp(-(edge-y)/spread):0;
 for(let x=0;x<width;x++){
  const z=T.MathUtils.lerp(model.zFwd,model.zAft,x/(width-1)),f=model.featureYAt(z);
  const nearby=ports.filter(p=>Math.abs(z-p.z)<p.width*.65);
  for(let side=0;side<2;side++)for(let j=0;j<rows;j++){
   const y=T.MathUtils.lerp(yMin,yMax,j/(rows-1));
   let shade=.32*below(y,f.wale_bottom,.14)+.18*below(y,f.sheer_strake,.08),runoff=0;
   for(const p of nearby){
    const dz=Math.abs(z-p.z),edge=1-T.MathUtils.smoothstep(dz,p.width*.43,p.width*.65);
    shade+=edge*.30*below(y,f.port_sill,.13);
    const distance=Math.min(Math.abs(z-p.z-p.width*.34),Math.abs(z-p.z+p.width*.34));
    const streak=Math.exp(-distance*distance/(.032*.032));
    runoff+=streak*below(y,f.port_sill, .65+side*.16)*.65;
   }
   for(const c of channels)if(z>c.lo-.15&&z<c.hi+.15){
    const fade=T.MathUtils.smoothstep(z,c.lo-.15,c.lo+.16)*(1-T.MathUtils.smoothstep(z,c.hi-.16,c.hi+.15));
    const edge=c.y+f.rail-c.reference;
    shade+=fade*.42*below(y,edge,.25);
    // Drainage at the channel's ends and its closely spaced iron fastenings.
    const track=Math.sin((z-c.lo)*13.1+side*.7)*.5+.5;
    runoff+=fade*Math.pow(track,14)*below(y,edge,1.1)*.25;
   }
   const i=((side*rows+(rows-1-j))*width+x)*4;
   image.data[i]=255*(1-Math.min(.63,shade));
   image.data[i+1]=255*Math.min(1,runoff);
   image.data[i+2]=128+9*Math.sin(z*.28+side*2.3)*Math.sin(y*2.1+z*.13);
   image.data[i+3]=255;
  }
 }
 context.putImageData(image,0,0);
 const map=new T.CanvasTexture(canvas);map.name='hull-fitting-contact';map.channel=1;map.anisotropy=4;
 for(const name of ['hull_shell','hull_side_joinery']){
  const mesh=ship.getObjectByName(name);if(!mesh)continue;
  const p=mesh.geometry.attributes.position,uv=[];
  for(let i=0;i<p.count;i++){
   const u=T.MathUtils.clamp((p.getZ(i)-model.zFwd)/(model.zAft-model.zFwd),0,1);
   const v=T.MathUtils.clamp((p.getY(i)-yMin)/(yMax-yMin),0,1);
   // CanvasTexture is flipped on upload. Keep a half-texel guard between sides.
   const row=p.getX(i)<0?1:0;
   uv.push((.5+u*(width-1))/width,(row*rows+.5+v*(rows-1))/(rows*2));
  }
  mesh.geometry.setAttribute('uv1',new T.Float32BufferAttribute(uv,2));
  mesh.material=mesh.material.clone();mesh.material.aoMap=map;mesh.material.aoMapIntensity=.85;
 }
}
