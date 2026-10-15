import assert from 'node:assert/strict';
import { openHarness } from './harness.js';
import { writeFile } from 'node:fs/promises';
const h = await openHarness();
try {
  const report = await h.page.evaluate(async () => {
    const T = THREE;
    const { deadeyeAsset } = await import('/src/ship/deadeye-assets.js');
    const { eyeHoles, reeveLanyard } = await import('/src/ship/deadeyes.js');
    const { channelAnchors } = await import('/src/ship/channels.js');
    const { hullModel } = await import('/src/ship/hull.js');
    const { lodConfig } = await import('/src/ship/lod.js');
    const asset = deadeyeAsset(), issues = [], rows = [];
    const check = (ok, text) => { if (!ok) issues.push(text); };
    check(!!asset?.material.map, 'Blender wood/material did not load');
    const prototype = new T.Mesh(asset.geometry, asset.material);
    const box = new T.Box3().setFromObject(prototype);
    check(Math.abs(box.max.x - 1) < .001 && Math.abs(box.max.y - 1) < .001 && Math.abs(box.max.z - .5) < .001, 'glTF axes or normalized size changed');
    const ray = (x, y) => new T.Raycaster(new T.Vector3(x, y, 2), new T.Vector3(0, 0, -1)).intersectObject(prototype);
    for (const p of eyeHoles(1)) {
      check(ray(p.x, p.y).length === 0, 'A bored hole is capped');
      check(ray(p.x + .13, p.y).length === 0, 'Lanyard clearance is obstructed');
      check(ray(p.x + .19, p.y).length > 0, 'Wood around a hole is missing');
    }
    check(ray(0, 0).length > 0, 'Deadeye centre is hollow');
    const colours = asset.geometry.getAttribute('color');
    check(colours.array.every(x => x >= 0 && x <= 1), 'Contact colours were not normalized');
    check(colours.array.some(x => x < .95), 'Baked cavity shading is absent');
    const model = hullModel();
    for (const lod of ['cinematic', 'hero', 'game']) {
      const ship = build({ lod, sails: 'full', crew: false }), cfg = lodConfig(lod);
      const anchors = channelAnchors(model, cfg);
      let pairs = 0, triangles = 0, meshes = 0;
      const expected = cfg.deadeyes === true ? 58 : 0;
      ship.getObjectByName('channels').traverse(o => {
        if (!o.isMesh) return;
        meshes++; triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
        for (const a of Object.values(o.geometry.attributes)) check(a.array.every(Number.isFinite), `${lod}: invalid geometry`);
        // New fittings must retain outward winding on each side. Existing lofted
        // platform normals share corners; they are outside this fitting check.
        const p = o.geometry.attributes.position, n = o.geometry.attributes.normal, index = o.geometry.index;
        for (let i = 0; !o.name.endsWith('_channel') && i < (index?.count ?? p.count); i += 3) {
          const ids = [0,1,2].map(k => index ? index.getX(i+k) : i+k);
          const v = ids.map(j => new T.Vector3().fromBufferAttribute(p,j));
          const cross = v[1].sub(v[0]).cross(v[2].sub(v[0])), normal = new T.Vector3();
          ids.forEach(j => normal.add(new T.Vector3().fromBufferAttribute(n,j)));
          check(cross.dot(normal) > -1e-7, `${lod}: reversed face in ${o.name}`);
        }
        if (!o.userData.deadeyePairs) return;
        const mast = o.name.split('_')[0], feet = [...anchors[mast].shrouds, ...anchors[mast].topmastBackstays, ...anchors[mast].topgallantBackstays];
        const records = o.userData.deadeyePairs; pairs += records.length * 2;
        records.forEach((r, i) => {
          check(r.authored, `${lod}: procedural fallback used unexpectedly`);
          check(feet[i].distanceTo(new T.Vector3(...r.anchor)) < 1e-6, `${lod}: shroud detached from seized neck`);
          const lanyard = reeveLanyard(r.radius, r.thickness), matrix = new T.Matrix4().fromArray(r.frame);
          // Verify the actual upper/lower bores from BOTH sides after placement.
          for (const mirror of [1,-1]) for (const hole of [...lanyard.lower, ...lanyard.upper]) {
            const p = new T.Vector3(hole.x, hole.y, r.thickness).applyMatrix4(matrix); p.x *= mirror;
            const direction = new T.Vector3(0,0,-1).transformDirection(matrix); direction.x *= mirror;
            const hits = new T.Raycaster(p, direction, 0, r.thickness * 2.1).intersectObject(o);
            check(hits.length === 0, `${lod}/${mast}: filled hole on side ${mirror}`);
          }
          check(lanyard.curve.curves.length === 12, 'Lanyard does not traverse six bores and six spans');
          check(lanyard.radius < r.radius * .14, 'Rope too thick for hole');
        });
      });
      check(pairs === expected, `${lod}: expected ${expected} pairs, got ${pairs}`);
      const stats = window.stats({ lod, sails: 'full', crew: false });
      check(stats.tris < (lod === 'cinematic' ? 1600000 : lod === 'hero' ? 960000 : 84000), `${lod}: host budget exceeded`);
      rows.push({ lod, pairs, channelTriangles: triangles, channelMeshes: meshes, shipTriangles: stats.tris });
    }
    const sample = build({ lod: 'cinematic', sails: 'full', crew: false }).getObjectByName('main_deadeyes').userData.deadeyePairs[4];
    return { rows, sample, assetTriangles: (asset.geometry.index?.count ?? asset.geometry.attributes.position.count) / 3, issues };
  });
  await writeFile('build/deadeye-check.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, issues: report.issues.slice(0,20) }, null, 2));
  assert.deepEqual(report.issues, []); assert.deepEqual(h.problems, []);
} finally { await h.close(); }
