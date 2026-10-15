import assert from 'node:assert/strict';
import {openHarness} from './harness.js';
const h=await openHarness();
try{
 const report=await h.page.evaluate(()=>{
  const rows=[];
  for(const [ensign,flagYear]of [['blue',1798],['white',1798],['white',1805],['red',1805]]) {
   const ship=window.build({lod:'game',crew:false,ensign,flagYear}),flag=ship.getObjectByName('ensign'),m=flag.material;
   const c=m.map.image,g=c.getContext('2d'),w=c.width,h=c.height,p=g.getImageData(0,0,w,h).data;
   const pixel=(u,v)=>Array.from(p.slice((Math.floor(v*h)*w+Math.floor(u*w))*4,(Math.floor(v*h)*w+Math.floor(u*w))*4+3));
   let cantonRed=0;
   for(let y=0;y<h*.44;y++)for(let x=0;x<w*.46;x++){
    const i=(y*w+x)*4;if(p[i]>p[i+1]*1.7&&p[i]>p[i+2]*1.3)cantonRed++;
   }
   rows.push({ensign,flagYear,colours:flag.userData.colours,centre:pixel(.8,.5),field:pixel(.8,.2),cantonRed,
    textured:!!(m.bumpMap&&m.roughnessMap),opaque:!m.transparent,roughness:m.roughness,
    key:m.customProgramCacheKey(),dimensions:[w,h,m.bumpMap.image.width,m.bumpMap.image.height]});
  }
  const fair=window.build({lod:'game',crew:false,ensign:'white',flagYear:1805,weather:'fair'});
  const heavy=window.build({lod:'game',crew:false,ensign:'white',flagYear:1805,weather:'heavy'});
  if(fair.getObjectByName('ensign').material.map!==heavy.getObjectByName('ensign').material.map)
    throw Error('Weather models should share cloth textures');
  return rows;
 });
 for(const r of report){assert.equal(r.colours.field,r.ensign);assert.equal(r.colours.post1801,r.flagYear>=1801);
  assert.ok(r.textured&&r.opaque&&r.key==='sewn-wool-bunting-v1');assert.deepEqual(r.dimensions.slice(0,2),r.dimensions.slice(2));}
 for(const r of report.filter(r=>r.ensign==='white')){
  assert.ok(r.centre[0]>r.centre[1]*1.7,'white ensign must have St George across the fly');
  assert.ok(r.field.every(v=>v>170),'fly field must be cloth white');
 }
 assert.ok(report[2].cantonRed>report[1].cantonRed*1.08,'1805 includes St Patrick red diagonals');
 assert.deepEqual(h.problems,[]);console.log(JSON.stringify(report,null,2));
}finally{await h.close();}
