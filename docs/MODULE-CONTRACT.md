# Writing a ship module

Every region of the ship — the stern, the head, the channels, the guns — is one module
in `src/ship/`. This is the contract they all keep, so that several can be written at
once without colliding and so the audit can check all of them the same way.

Read `docs/CONVENTIONS.md` first. Metres, degrees in the spec and radians in the code,
`-Z` forward, `+X` starboard, `+Y` up, `y = 0` at the design load waterline.

## The shape of a module

```js
// src/ship/stern.js
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { audit } from '../audit/measure.js';

export function buildStern(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'stern';
  // …
  return group;
}
```

* `cfg` — the LOD configuration from `src/ship/lod.js`. **Honour it.** Ask it for
  segment counts and for whether a thing exists at all; never hard-code a segment
  count. If your region needs a switch the config does not have, add one to all four
  levels in `lod.js` — that file is shared, so keep the edit to your own new keys.

  This is not a style rule. Four hard-coded segment counts were found the day the
  `cinematic` level was added — the running rigging's rope tubes, the spritsail yard, and
  the tube cross-sections of two torus fittings — and every one of them stayed exactly as
  coarse at the most expensive level as at the cheapest. A hard-coded count does not show
  up until somebody builds a level willing to spend, and then it is the one part of the
  ship that refuses to.
* `mats` — the materials from `src/ship/materials.js`: `hull`, `deck`, `timber`,
  `mast`, `mastBlack`, `black`, `ochre`, `red`, `white`, `gilt`, `iron`, `brass`,
  `glass`, `sail`, `copper`, `crew`, `standingRigging`, `runningRigging`, and
  `mats.bunting(key)`. Use them. Do not construct a new material for a colour that
  already exists.

  `crew` is the odd one: it has `vertexColors`, and crew.js writes each part's colour
  into the vertices as it builds it. That is the trick to reach for when one object needs
  many colours — a figure needs six, and six materials would be six draw calls a man.

  `crew` is not the only one any more. `deck`, `timber`, `mastBlack`, `black`, `ochre`,
  `red`, `white`, `iron`, `brass`, `gilt`, `copper` and `hull` all have `vertexColors`
  too, because `src/ship/occlusion.js` writes baked contact shadows into whichever of
  them a mesh uses, after the whole ship is assembled. This asks nothing of you: it runs
  automatically, it finds a mesh by its material rather than by name, and it multiplies
  its darkening into a `color` attribute the mesh already has (yours, if you paint your
  own, as hull.js and crew.js do) or one it adds and fills with white if the mesh has
  none. The one thing it needs from you is a `normal` attribute — the loft and solid
  helpers in `src/util/` already call `computeVertexNormals()`, so this is only worth
  knowing if you build raw `BufferGeometry` by hand. A mesh with no normals is left
  undarkened rather than guessed at; it is not an error. `mast`, `sail`, `glass`,
  `standingRigging` and `runningRigging` are deliberately left out — see the head of
  `occlusion.js` for why the rig and the canvas neither cast nor receive this shading.
* `model` — the hull, described below.
* `ctx` — `{ cfg, mats, model, sails, lod, zFcBreak, zQdBreak, ports }`, and after the
  rig has been built, `ctx.rig`, `ctx.yards` and `ctx.spanker`. A module that needs to
  stand something aloft — the crew's two topmen do — must be assembled after the rig.

Return one `THREE.Group`. Do not add it to the scene yourself; `src/ship/index.js`
does the assembling.

## Asking the hull where things are

`model` (from `hullModel()` in `src/ship/hull.js`) is how a module finds out the shape
of the ship without knowing anything about the offset table:

| Call | Gives you |
| --- | --- |
| `model.fromStem(metres)` | `z` for a position given as so many metres abaft the stem along the gundeck. **The research files are written this way**, so most positions arrive needing this. |
| `model.toStem(z)` | the reverse |
| `model.lengthOnDeck` | length on the gundeck, in metres |
| `model.zFwd`, `model.zAft` | `z` at the stem and at the sternpost |
| `model.halfBreadthAt(z, y)` | half-breadth of the hull at a station and height |
| `model.featureYAt(z)` | `{ keel_bottom, rabbet, floor, bilge, waterline, wale_bottom, wale_top, sheer_strake, deck, port_sill, port_head, rail }` — the height of each named line of the ship at that station |
| `model.pointAt(z, feature, side)` | a `Vector3` on the hull surface at a named feature; `side` is `+1` starboard, `-1` port |
| `model.featureCurve(feature, side, samples, from, to)` | a `CatmullRomCurve3` following a named line the length of the ship — the sheer, a wale, the rail. Sweep mouldings and site channels along these. |
| `model.bulwarkHeightAt(z)` | height of the rail above the deck at side |

Use `pointAt` and `featureCurve` rather than computing positions yourself. When the
hull's offsets are replaced by the traced ones, everything sited this way moves with it
and everything sited by hand does not.

## Where your numbers live

**No number may be written in a module.** Every dimension goes in your own file,
`src/spec/parts/<region>.js`, as:

```js
import { ft, m, n } from '../units.js';

export const STERN_SPEC = {
  stern_light_count: n(7, 'PRIMARY §2 counted on the ZAZ3067 body plan'),
  stern_light_width: m(ft(1, 9), 'RECONSTRUCTED §5 transom width divided by the lights and their pilasters'),
};
```

* `m(metres, source)` for lengths, `n(value, source)` for counts and angles.
* `ft(feet, inches)` converts the period figure. Write `ft(1, 9)`, not `0.533`.
* Every row needs a `source` beginning with its grade — `PRIMARY`, `SECONDARY`,
  `RECONSTRUCTED` or `FICTIONAL` — and saying where it came from. `npm run trace`
  fails on a row with no source.
* Add `noAudit: true` to a row nothing in the model is measured against.
* Keys are `snake_case` and must be unique across the whole ship; `src/spec/parts/index.js`
  throws if two regions define the same one.

## Getting measured

Tag the things that matter so the audit can check them:

```js
import { audit, audits } from '../audit/measure.js';

audit(spankerBoom, 'spanker_boom_length', 'extent_max');
audits(mizzenMast, ['mizzen_mast_height', 'max_y'], ['mizzen_mast_rake_deg', 'rake_deg']);
```

Metrics: `extent_x`, `extent_y`, `extent_z`, `extent_max`, `min_y`, `max_y`, `min_z`,
`max_z`, `centre_x`, `centre_y`, `centre_z`, `origin_x`, `origin_y`, `origin_z`,
`rake_deg`, `steeve_deg`, `count`. For `count` on a merged mesh, set
`mesh.userData.count`.

Tag at least the two or three dimensions that would be most obviously wrong if the
module drifted. Not every row needs a tag; a row that will never be measured gets
`noAudit: true` instead.

**If your part carries another part, tag it `{ self: true }`.** A measurement is a bounding
box over the object *and its descendants*, so a yard with its sail bent to it measures as
long as the sail. `self` measures the object's own geometry and ignores what is hung on
it. The main topsail yard came out thirty-nine per cent too long the moment the canvas was
hung on it — which is the audit working, and is why this exists.

## If your region should move

`src/ship/motion.js` is a layer over the finished ship, not part of the build, and it
finds what it moves **by mesh name**. A new region needs nothing done to it to be still,
and two things to move:

* **Name the mesh.** Anything inside the `rig` group moves with the rig automatically. A
  moving part anywhere else — something rigid with a node of its own, like the wheel — is
  found by name and posed there. Two name patterns are load-bearing: `*_yard` is braced,
  and `*_sail` is given the canvas shader and expected to hang on a yard.
* **Run `npm run motion` after any renaming.** It builds her, runs her for two instants
  and measures what changed. When the square sails were split out of one merged mesh
  nothing threw — they simply stopped shivering — and that check is what noticed.
* **Do not bake an attitude into geometry that has to change.** The flags used to have
  their wind curve frozen into their vertices; making them fly meant pulling the surface
  back out into `poseFlag`, which now writes it at any phase. If your region has a pose,
  keep the function that produced it and the parameters it took.

Amplitudes and periods are dimensions like any other and go in `src/spec/parts/motion.js`
with `noAudit: true` — the audit measures geometry, and how far a thing may move is not
geometry.

## Triangles

The budget is real and the build fails when it is missed: cinematic 380–500 k, hero
200–500 k, game 30–80 k, distant under 5 k. It is written once, as `TRI_BUDGET` in `src/ship/lod.js`. Merge repeated geometry with `mergeGeometries` from
`src/util/loft.js` or use `THREE.InstancedMesh`. Twelve gun carriages as twelve
separate object trees is a waste of both triangles and draw calls.

Helpers in `src/util/solids.js`: `spar` (a tapered mast or yard), `ropeCurve`,
`ropeTube`, `ropeLines`, `sweep` (a moulding along a curve), `block`, `post`.
In `src/util/loft.js`: `loftSections`, `mergeGeometries`, `weldByPosition`.
In `src/util/interp.js`: `monotoneCubic`, `naturalCubic`, `resampleByArcLength`.

## Files you may touch

Only these:

* `src/ship/<your-region>.js`
* `src/spec/parts/<your-region>.js`
* your own new keys in `src/ship/lod.js`

**Do not** edit `src/ship/index.js`, `src/spec/spec.js`, `src/ship/hull.js`,
`src/ship/materials.js`, `SPECS.md`, or another region's files.

## Checking your work

```bash
node tools/render.js quarter --studio     # or bow, beam, stern, head, gallery, channels, deck
```

Renders land in `renders/`. **Look at them.** A module that has never been rendered is
a module that does not work. Iterate until the region reads correctly from the outside,
then say in your report what you rendered and what you saw.

`node tools/dev/probe.js` prints the world bounding box of every mesh, which is the
quickest way to find a part that has ended up in the wrong place.
