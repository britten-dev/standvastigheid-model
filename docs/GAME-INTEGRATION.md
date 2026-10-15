# Using her in The Helmsman's Watch

She is built to drop in where `surprise-model` does: same imports, same options, same
conventions (metres, -Z forward, +Y up, origin on the load waterline at station 10).

```bash
npm i github:britten-dev/waakzaamheid-model   # once the repo exists
```

```js
import { buildShip, createMotion, createSailHandling, createDetailLOD,
         preloadSurfaceAssets, LODS, SAIL_STATES } from 'waakzaamheid-model';
import { SPEC } from 'waakzaamheid-model/spec';
import { hullModel } from 'waakzaamheid-model/hull';
import { carryAway, restore } from 'waakzaamheid-model/damage';

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
| `ensign` | `'dutch'` (red-white-blue), `'blue'` (the false British blue ensign of her ruse in the book), `'french'` | `'dutch'` |
| `chasers` | `'manned'` keeps the bow chasers' bridle ports open even when `weather: 'heavy'` shuts the batteries; `'secured'` shuts them too | `'manned'` |

## Bow chasers

Two long guns in bridle ports in the bow, on the lower deck, trained right forward, as
the book has them. Also two stern chasers in the counter.

* Nodes `locator_bow_chaser_port`, `locator_bow_chaser_starboard` (and
  `locator_stern_chaser_*`) sit at the muzzles; their pointing axis is given in
  `guns.userData.gunnery`.
* They are entries in `guns.userData.gunnery.guns` in exactly Surprise's record format,
  with `side: 'bow'` or `'stern'` and `kind: 'chaser'`, so a broadside order to `port` or
  `starboard` never fires them, and `gunnery.js` can recoil them unchanged.
* `ship.userData.chasers === 'manned'` means the chasers may fire although
  `ship.userData.ports === 'shut'`. The game's "guns secured" rule should let them through.

## Shooting away her rig

Every mast, topmast, topgallant, yard, sail, the bowsprit and the jib-boom is a separate
named part, nested the way it is fitted, with its own standing and running rigging:

```
rig ─ fore ─ fore_lower_mast, fore_top, fore_yard → fore_course_sail, lower rigging
          └─ fore_topmast_assembly ─ fore_topmast, fore_topsail_yard → fore_topsail_sail, …
                                   └─ fore_topgallant_assembly ─ fore_topgallant, …
```

```js
carryAway(ship, 'fore_topmast');   // hides it and everything it carries; returns their names
ship.userData.rigParts;            // the registry: what each part carries and its ropes
restore(ship);                     // puts it all back
```

The motion layer and sail handling skip what has been carried away. Mesh names are
Surprise's (`*_yard`, `*_sail`), so code that finds parts by name keeps working. No
falling wreckage or broaching is modelled here — that is the game's.

## Cost

Measured numbers go here when the build is complete: triangles and draw calls per level.
The `game` level is meant for her as the chaser — mostly seen at a few hundred metres —
and is kept small in draw calls as well as triangles, because she is the second ship on
screen.

*Status: in progress. This page is published early so the chase can be built against the
real names. Names marked here will not change without a note in the shared notes folder.*
