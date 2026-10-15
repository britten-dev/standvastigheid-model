// The crew option: `crew: false` leaves her with nobody on deck and without the figures'
// cost, and the default watch is the size a 74's should be (twenty-four at hero, fewer at
// game), Dutch-dressed, with the captain in his light-blue coat.
import assert from 'node:assert/strict';
import {openHarness} from './harness.js';
import {writeFile} from 'node:fs/promises';
const h=await openHarness();
try {
  const rows=await h.page.evaluate(()=>['game','hero','cinematic'].map(lod=>{
    const opts={lod,sails:'full',batchStatic:false},withCrew=window.stats(opts),withoutCrew=window.stats({...opts,crew:false});
    const original=window.build(opts),bare=window.build({...opts,crew:false});
    if(bare.getObjectByName('crew').children.length)throw new Error('Visible crew remain');
    const crew=original.getObjectByName('crew');
    if(!crew.children.length)throw new Error('Default crew option regressed');
    for(const name of ['ships_wheel','wheel_stand','binnacle','capstan','main_hatch_grating','fore_hatch_grating','companion'])
      if(!bare.getObjectByName(name))throw new Error(`Ship fitting lost without crew: ${name}`);
    const names=crew.children.map(f=>f.name);
    return {lod,withCrew,withoutCrew,savedTriangles:withCrew.tris-withoutCrew.tris,savedMeshes:withCrew.meshes-withoutCrew.meshes,
      figures:crew.children.length,names,helmsmen:names.filter(n=>n.startsWith('helmsman')).length,
      topmen:names.filter(n=>n.startsWith('topman')).length,captain:names.includes('captain')};
  }));
  for(const r of rows){assert.ok(r.savedTriangles>0);assert.ok(r.savedMeshes>0);assert.ok(r.captain,'the captain is on deck');assert.ok(r.helmsmen>=2,'the wheel is manned');}
  const by=lod=>rows.find(r=>r.lod===lod);
  assert.ok(by('hero').figures>=18&&by('hero').figures<=26,'a 74\'s watch at hero is 18 to 26 men');
  assert.ok(by('cinematic').figures===by('hero').figures,'cinematic and hero keep the same watch');
  // Twenty-four photographed figures of about ten thousand triangles each: well worth skipping.
  assert.ok(by('cinematic').savedTriangles>100000,'the photographed watch is what crew: false saves');
  assert.ok(by('game').figures<by('hero').figures/2+1,'fewer at game');
  assert.ok(by('hero').topmen>=2,'topmen in the main top at hero');
  assert.deepEqual(h.problems.filter(p=>p.startsWith('[pageerror]')),[]);
  await writeFile('build/crew-option-check.json',JSON.stringify(rows.map(({names,...r})=>r),null,2));
  console.log(JSON.stringify(rows.map(({names,...r})=>r),null,2));
}finally{await h.close();}
