// The bunting: every flag she can fly is textured wool cloth with the right colours in the
// right places. 'dutch' (the default) is red over white over blue; 'french' is blue, white,
// red from the hoist; 'blue' is the British blue ensign with the post-1801 Union; 'white'
// and 'red' still work.
import assert from 'node:assert/strict';
import {openHarness} from './harness.js';
const h=await openHarness();
try{
 const report=await h.page.evaluate(()=>{
  const rows=[];
  // The colour classes the check looks for, from RGB: it only has to tell cloth red from
  // cloth white from cloth blue, not match a swatch.
  const cls=([r,g,b])=>r>g*1.7&&r>b*1.3?'red':b>r*1.5&&b>g*1.1?'blue':(r>170&&g>165&&b>150)?'white':'other';
  for(const [ensign,flagYear]of [[undefined,undefined],['dutch',1811],['french',1811],['blue',1811],['blue',1798],['white',1798],['white',1805],['red',1805]]) {
   const ship=window.build({lod:'game',crew:false,ensign,flagYear}),flag=ship.getObjectByName('ensign'),m=flag.material;
   const c=m.map.image,g=c.getContext('2d'),w=c.width,h=c.height,p=g.getImageData(0,0,w,h).data;
   const pixel=(u,v)=>Array.from(p.slice((Math.floor(v*h)*w+Math.floor(u*w))*4,(Math.floor(v*h)*w+Math.floor(u*w))*4+3));
   let cantonRed=0;
   for(let y=0;y<h*.44;y++)for(let x=0;x<w*.46;x++){
    const i=(y*w+x)*4;if(p[i]>p[i+1]*1.7&&p[i]>p[i+2]*1.3)cantonRed++;
   }
   const pennant=ship.getObjectByName('pennant').material.map.image,pp=pennant.getContext('2d').getImageData(0,0,pennant.width,pennant.height).data;
   const ppix=(u,v)=>Array.from(pp.slice((Math.floor(v*pennant.height)*pennant.width+Math.floor(u*pennant.width))*4,(Math.floor(v*pennant.height)*pennant.width+Math.floor(u*pennant.width))*4+3));
   const jack=ship.getObjectByName('jack').material.map.image,jp=jack.getContext('2d').getImageData(0,0,jack.width,jack.height).data;
   const jpix=(u,v)=>Array.from(jp.slice((Math.floor(v*jack.height)*jack.width+Math.floor(u*jack.width))*4,(Math.floor(v*jack.height)*jack.width+Math.floor(u*jack.width))*4+3));
   rows.push({ensign:ensign??'(default)',flagYear,colours:flag.userData.colours,centre:pixel(.8,.5),field:pixel(.8,.2),cantonRed,
    ensignGrid:{top:cls(pixel(.5,.1)),mid:cls(pixel(.5,.5)),bottom:cls(pixel(.5,.9)),hoist:cls(pixel(.1,.5)),fly:cls(pixel(.9,.5)),midFly:cls(pixel(.5,.5))},
    pennantGrid:{top:cls(ppix(.5,.12)),mid:cls(ppix(.5,.5)),bottom:cls(ppix(.5,.88)),hoist:cls(ppix(.1,.5)),mid3:cls(ppix(.5,.5)),fly:cls(ppix(.9,.5))},
    jackGrid:{top:cls(jpix(.5,.1)),bottom:cls(jpix(.5,.9)),hoist:cls(jpix(.1,.5)),fly:cls(jpix(.9,.5))},
    textured:!!(m.bumpMap&&m.roughnessMap),opaque:!m.transparent,roughness:m.roughness,
    key:m.customProgramCacheKey(),dimensions:[w,h,m.bumpMap.image.width,m.bumpMap.image.height]});
  }
  const fair=window.build({lod:'game',crew:false,ensign:'white',flagYear:1805,weather:'fair'});
  const heavy=window.build({lod:'game',crew:false,ensign:'white',flagYear:1805,weather:'heavy'});
  if(fair.getObjectByName('ensign').material.map!==heavy.getObjectByName('ensign').material.map)
    throw Error('Weather models should share cloth textures');
  try{window.build({lod:'game',crew:false,ensign:'spanish'});}catch(e){rows.unknown=String(e.message);}
  return {rows,unknown:rows.unknown};
 });
 const by=(e,y)=>report.rows.find(r=>r.ensign===e&&(y===undefined||r.flagYear===y));
 for(const r of report.rows){
  assert.ok(r.textured&&r.opaque&&r.key==='sewn-wool-bunting-v1');assert.deepEqual(r.dimensions.slice(0,2),r.dimensions.slice(2));
  if(r.ensign!=='(default)')assert.equal(r.colours.field,r.ensign);
 }
 // The default is the Dutch tricolour.
 assert.equal(by('(default)').colours.field,'dutch');
 for(const r of [by('(default)'),by('dutch')]){
  assert.deepEqual([r.ensignGrid.top,r.ensignGrid.mid,r.ensignGrid.bottom],['red','white','blue'],'Dutch ensign is red over white over blue');
  assert.deepEqual([r.pennantGrid.top,r.pennantGrid.mid,r.pennantGrid.bottom],['red','white','blue'],'Dutch pennant is red-white-blue');
  assert.deepEqual([r.jackGrid.top,r.jackGrid.bottom],['red','blue'],'Dutch jack is a small tricolour');
 }
 const fr=by('french');
 assert.deepEqual([fr.ensignGrid.hoist,fr.ensignGrid.midFly,fr.ensignGrid.fly],['blue','white','red'],'French ensign is blue at the hoist, then white, then red');
 assert.deepEqual([fr.pennantGrid.hoist,fr.pennantGrid.mid3,fr.pennantGrid.fly],['blue','white','red'],'French pennant is blue-white-red along its length');
 assert.deepEqual([fr.jackGrid.hoist,fr.jackGrid.fly],['blue','red'],'French jack is a small tricolour');
 // The British blue ensign: a blue field with the Union, and the post-1801 Union has St Patrick's red diagonals.
 assert.equal(by('blue',1811).colours.post1801,true);assert.equal(by('blue',1798).colours.post1801,false);
 assert.equal(cls0(by('blue',1811).field),'blue');
 assert.ok(by('blue',1811).cantonRed>by('blue',1798).cantonRed*1.08,'the post-1801 Union has St Patrick red diagonals');
 for(const r of report.rows.filter(r=>r.ensign==='white')){
  assert.ok(r.centre[0]>r.centre[1]*1.7,'white ensign must have St George across the fly');
  assert.ok(r.field.every(v=>v>170),'fly field must be cloth white');
 }
 assert.ok(by('white',1805).cantonRed>by('white',1798).cantonRed*1.08,'1805 includes St Patrick red diagonals');
 assert.match(report.unknown??'', /Unknown ensign: spanish/,'an unknown ensign is refused');
 assert.deepEqual(h.problems.filter(p=>!/404|procedural ship detail/.test(p)),[]);console.log(JSON.stringify(report.rows,null,2));
}finally{await h.close();}
function cls0([r,g,b]){return b>r*1.3&&b>g*1.1?'blue':'other';}
