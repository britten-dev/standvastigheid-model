import * as T from 'three';
import {rng} from '../util/math.js';

// Working wool bunting, not a photograph of a damaged museum flag. The breadth
// count, seam scale and wear are a visual reconstruction; see flags research.
export function dressBunting(design,{fly,hoist,breadths=8}={}) {
  const w=design.width,h=design.height,ctx=design.getContext('2d',{willReadFrequently:true});
  const make=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const height=make(),roughness=make(),hg=height.getContext('2d'),rg=roughness.getContext('2d');
  const colour=ctx.getImageData(0,0,w,h),relief=hg.createImageData(w,h),rough=rg.createImageData(w,h);
  const random=rng(1805),warp=Float32Array.from({length:w},()=>random()-.5),weft=Float32Array.from({length:h},()=>random()-.5);
  const panels=Float32Array.from({length:breadths},()=>.965+random()*.055);
  const hem=.016/hoist*h,header=.04/fly*w;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
    const u=x/(w-1),v=y/(h-1),i=(y*w+x)*4;
    const row=Math.min(breadths-1,Math.floor(v*breadths));
    const seam=Math.abs(v*breadths-Math.round(v*breadths))*h/breadths;
    const edge=Math.min(y,h-1-y,w-1-x);
    const joint=Math.min(seam,Math.abs(edge-hem),Math.abs(x-header));
    const stitch=joint<.9&&(Math.floor(x/3)+Math.floor(y/3))%3===0;
    // Low-contrast weave mips away in distant views instead of sparkling.
    const thread=warp[x]*.012+weft[y]*.012+(random()-.5)*.016;
    const creases=Math.sin(u*38+Math.sin(v*17)*.3)*Math.sin(v*41+u*7);
    const fade=.025*u*u+.008*Math.sin(u*11+v*19);
    const tone=panels[row]+thread+fade-(joint<1.1?.055:0);
    for(let c=0;c<3;c++){
      let value=colour.data[i+c]*tone;
      if(x<header)value=[202,196,174][c]*(.99+thread);
      if(stitch)value=value*.9+18;
      colour.data[i+c]=value;
    }
    const reliefValue=128+thread*150+creases*2+(joint<1.6?20:0)+(edge<hem?6:0)+(stitch?7:0);
    relief.data[i]=relief.data[i+1]=relief.data[i+2]=reliefValue;relief.data[i+3]=255;
    const roughValue=235+thread*95+(joint<1.6?9:0);
    rough.data[i]=rough.data[i+1]=rough.data[i+2]=roughValue;rough.data[i+3]=255;
  }
  ctx.putImageData(colour,0,0);hg.putImageData(relief,0,0);rg.putImageData(rough,0,0);
  // Two modest rows of stitching at the fly and hems. They are baked into UVs,
  // so both sides and the whole animated sheet retain the same construction.
  ctx.strokeStyle='rgba(215,209,185,0.24)';ctx.lineWidth=Math.max(.6,h/1500);
  ctx.setLineDash([Math.max(1,h/480),Math.max(1,h/650)]);
  for(const inset of [hem*.7,hem*1.2])ctx.strokeRect(header+inset,inset,w-header-inset*2,h-inset*2);
  const texture=(canvas,srgb=false)=>{const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;};
  return {map:texture(design,true),bumpMap:texture(height),roughnessMap:texture(roughness)};
}

export function installBuntingLight(material) {
  material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      #if NUM_DIR_LIGHTS > 0
        float throughBunting=pow(max(0.0,dot(-normal,directionalLights[0].direction)),1.5);
        reflectedLight.indirectDiffuse+=diffuseColor.rgb*directionalLights[0].color*throughBunting*.2;
      #endif`);
  };
  material.customProgramCacheKey=()=> 'sewn-wool-bunting-v1';
}
