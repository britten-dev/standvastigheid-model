import assert from 'node:assert/strict';
import {openHarness} from './harness.js';
import {writeFile} from 'node:fs/promises';
const h=await openHarness();
try {
  const rows=await h.page.evaluate(()=>['game','hero','cinematic'].map(lod=>{
    const opts={lod,sails:'full'},withCrew=window.stats(opts),withoutCrew=window.stats({...opts,crew:false});
    const original=window.build(opts),bare=window.build({...opts,crew:false});
    if(bare.getObjectByName('crew').children.length)throw new Error('Visible crew remain');
    if(!original.getObjectByName('crew').children.length)throw new Error('Default crew option regressed');
    if(!bare.getObjectByName('ships_wheel')||!bare.getObjectByName('rudder_hinge'))throw new Error('Ship fittings lost');
    return {lod,withCrew,withoutCrew,savedTriangles:withCrew.tris-withoutCrew.tris,savedMeshes:withCrew.meshes-withoutCrew.meshes};
  }));
  for(const r of rows){assert.ok(r.savedTriangles>0);assert.ok(r.savedMeshes>0);}
  assert.ok(rows.find(r=>r.lod==='cinematic').savedTriangles>200000);
  assert.deepEqual(h.problems.filter(p=>p.startsWith('[pageerror]')),[]);
  await writeFile('build/crew-option-check.json',JSON.stringify(rows,null,2));
  console.log(JSON.stringify(rows,null,2));
}finally{await h.close();}
