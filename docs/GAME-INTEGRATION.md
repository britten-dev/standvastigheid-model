# Using her in The Helmsman's Watch

She is built to drop in where `surprise-model` does: same imports, same options, same
conventions (metres, -Z forward, +Y up, origin on the load waterline at station 10).

```bash
npm i github:britten-dev/standvastigheid-model
```

```js
import { buildShip, createMotion, createSailHandling, createDetailLOD,
         preloadSurfaceAssets, LODS, SAIL_STATES } from 'standvastigheid-model';
import { SPEC } from 'standvastigheid-model/spec';
import { hullModel } from 'standvastigheid-model/hull';
import { carryAway, restore } from 'standvastigheid-model/damage';

const ship = buildShip({ lod: 'game', sails: 'full', animatedSails: true, crew: false });
const handling = createSailHandling(ship, 'full');
const motion = createMotion(ship);
```

## Her numbers, for the chase

Read them from `SPEC` rather than typing them in. The stand-in in `src/game/pursuit.js`
guessed 51.2 × 14.3 × 6.2 m and 1.7 × 10⁶ kg.

| | `SPEC` key | Value |
| --- | --- | --- |
| Length on the gundeck (lower deck) | `hull_length_gundeck` | 50.68 m |
| Length on the waterline | `hull_length_lwl` | 50.43 m |
| Extreme breadth | `hull_beam_extreme` | 14.07 m |
| Moulded breadth | `hull_beam_moulded` | 13.84 m |
| Draught (to the false keel) | `hull_draught_aft`, `hull_draught_fwd` | 5.82 m, even keel |
| Displacement | `hull_displacement` | 2,282 t (sea water) |
| Lower deck amidships, centreline | `gundeck_above_wl_at_midships` | about 1.4 m |
| **Upper (weather) deck amidships** | `weather_deck_above_wl_at_midships` | about 3.6 m |

**Read this before using `gundeck_*`.** On a two-decker the Royal Navy's gundeck is the
*lower* deck. Surprise's one gun deck was also her weather deck, so code written for her
that reads `gundeck_above_wl_at_midships` to mean "the deck people stand on" should read
`weather_deck_above_wl_at_midships` here.

`hullModel()` keeps every method the game uses (`zFwd`, `zAft`, `zFcBreak`, `zQdBreak`,
`halfBreadthAt`, `sectionAt`, `railYAt`, `standingDeckAt`, `featureYAt`) and adds
`lowerDeckAt(z)`, `upperDeckAt(z)` and `zStem`. Details in `docs/TWO-DECKER.md`.

## Options that differ

| Option | Values | Default |
| --- | --- | --- |
| `ensign` | `'dutch'` (red-white-blue), `'blue'` (a false British blue ensign, as a ruse), `'french'` | `'dutch'` |
| `chasers` | `'manned'` keeps the bow chasers' bridle ports open even when `weather: 'heavy'` shuts the batteries; `'secured'` shuts them too | `'manned'` |

## Bow chasers

Two long 32-pounders in bridle ports in the bow, on the lower deck, trained 8° outboard of
dead ahead. Two long 24-pounders in the counter's chase ports, 5°
outboard of dead astern.

* Nodes `locator_bow_chaser_port`, `locator_bow_chaser_starboard`,
  `locator_stern_chaser_port`, `locator_stern_chaser_starboard` sit at the muzzle face.
  **Local +X is the bore, muzzle first** (`userData.bore === '+X'`, `userData.gunId`) —
  the same axis as the barrel instance matrices, so `gunnery.js`'s
  `new Vector3(1,0,0).transformDirection(home)` agrees with the locator.
* They are entries in `guns.userData.gunnery.guns` in Surprise's record format, with
  `side: 'bow'` or `'stern'`, `kind: 'chaser'` and `locator`. A broadside order to
  `port` or `starboard` never fires them. Broadside guns carry `kind` `'lower'`,
  `'upper'`, `'quarterdeck'` or `'forecastle'`.
* `ship.userData.chasers === 'manned'` (the default) keeps the bridle and counter ports
  open and the chasers run out even when `ship.userData.ports === 'shut'`. The game's
  "ports shut, guns secured" rule should let `kind: 'chaser'` through.

## Shooting away her rig

Every mast, topmast, topgallant, yard, sail, the bowsprit, the jib-boom and the spanker's
gaff and boom is a part of its own (39 parts), nested the way it is fitted, with its own
standing and running rigging:

```
rig ─ fore ─ fore_lower_mast, fore_top, fore_yard → fore_course_sail, lower rigging
          └─ fore_topmast_assembly ─ fore_topmast, fore_topsail_yard → fore_topsail_sail, …
                                   └─ fore_topgallant_assembly ─ fore_topgallant, …
    main …, mizzen …, bowsprit_assembly …
```

```js
import { carryAway, restore, partsCarriedBy, isCarriedAway, rigPartNames } from 'standvastigheid-model/damage';

carryAway(ship, 'fore_topmast');   // hides it, everything it carries and its ropes; returns the names
partsCarriedBy(ship, 'fore_lower_mast');  // ['fore_topmast', 'fore_topgallant', 'fore_yard', ...]
restore(ship, 'fore_topmast');     // mends one part (or everything, with no name)
ship.userData.rigParts;            // { name: { kind, mast, object, objects, needs, carries, ropes, attachments } }
ship.userData.carriedAway;         // names carried away, in order
```

* `carries` is the whole chain: `fore_lower_mast` takes the topmast, the topgallant and
  every yard and sail above. The jib needs both the fore topmast and the jib-boom.
* A rope goes when either of its ends goes, including braces led to another mast.
* The pennant goes with the main topgallant, the ensign with the spanker gaff, the
  topmen with the main lower mast.
* Nothing is removed from the scene, only hidden, so `createMotion` and
  `createSailHandling` keep working through a loss, whether created before or after it.
* Not modelled: falling wreckage, a sail whose lower yard has gone flogging free, the
  broach. Those are the game's.

`carryAway(ship, 'fore_lower_mast')` brings down her foremast and everything it carries.

## Photographed assets

`await preloadSurfaceAssets()` before `buildShip` loads the Meshy figures for the watch, the
five boats, the deck clutter, the crowned lion figurehead, the taffrail crest and its two
corner figures, and the hull planking. They are used at **hero and cinematic
only**. If it was not awaited, or a file fails to load, she is built with her own figures,
boats and drawn planking, and nothing throws. At **game and distant** she always has the
built boats, no clutter and the built figures: five photographed boats alone would add about
49 k triangles to a level with 1 k to spare. Her white-stuff bottom keeps its drawn planking
at every level.

## Cost

Measured with `node tools/check-cost.mjs` (no people, full sail, photographed assets loaded), October 2026:

| Level | Triangles | Draw calls | Use |
| --- | --- | --- | --- |
| `cinematic` | 1.78 M | 409 | A camera flying close round her |
| `hero` | 1.10 M | 342 | Close inspection |
| `game` | 95 k | 150 | The chaser at gameplay range |
| `distant` | 7.8 k | 88 | On the horizon |

Those are with `preloadSurfaceAssets()` finished, which is what hero and cinematic are for:
the photographed boats, deck clutter and carved figures are in them. With the watch on, add
about 248 k triangles at hero and cinematic (24 photographed figures); game adds about 4 k
for its nine built ones.

Building her from source takes a few hundred milliseconds at `game` and a few seconds at
`cinematic`; do it at a loading screen.

Two of the plan's targets are missed, on purpose:

* **Draw calls at `game` and `distant`** (about 120 planned). Static fittings are merged by
  material at these levels (`src/ship/batch.js`), which took `game` from 250 calls to 150.
  What is left is mostly the rig, 84 calls at `game`: every mast, yard and sail is its own
  mesh with its own ropes so that it can be shot away. That is the price of the feature.
* **Triangles at `cinematic`** (1.6 M planned, 1.78 M built): two decks of guns and their
  ports cost more than a frigate's one, and the close detail is what a flyby needs.
  `createDetailLOD()` drops the fine fittings the camera cannot resolve.

**Batching at `game` and `distant` merges named fittings.** The deck, hatch, boat and
carving meshes are not separately named at those levels; the helm, the rudder, the hull
shell, the taffrail, the stern glazing, the muzzle locators, every rig part, the guns and
the colours are. Pass `buildShip({ batchStatic: false })` to keep every fitting separate.

The exported GLB files are large (hero about 78 MB) because the procedural textures are
baked into them; the game builds her from source and does not need them.
