# The host game

**Done.** The game at [britten-dev/hms-surprise](https://github.com/britten-dev/hms-surprise)
takes its ship from this package — see
[PR #1](https://github.com/britten-dev/hms-surprise/pull/1). What follows is the record of
how it was fitted, and what a different host would need to know.

## How it is wired

```js
import { buildShip } from 'surprise-model';
import { SPEC } from 'surprise-model/spec';

this.model = buildShip({ lod: 'game', sails: 'storm' });
this.group.add(this.model);
```

The host keeps what the model still knows nothing about — the wave field, the hull's own
heave and roll, the wake, the spray, the mood lighting — and takes the mesh. What the model
now brings with it, if the host asks for it, is everything that moves *on* her: see the
motion layer below. It reads her dimensions from
`SPEC` rather than repeating them, so the wake and the flag stations follow the hull.

Its flags are animated, and the model's are baked into one attitude, so the model's are
hidden and used only for their positions. That keeps the model the authority on *where* a
flag flies and the animation the host's.

## What it costs

| | |
| --- | --- |
| Build | about 920 ms cold, 90 ms after. Materials are cached per level, so changing canvas at runtime is a geometry rebuild and not another download. |
| Triangles | 61,774 at the `game` level, of which about 1,900 are the thirteen figures of the watch |
| Meshes | 228, up from 167. The square sails are one mesh each so that they can be braced, and the heavy-weather fittings add their own |
| Materials | 24, all `MeshStandardMaterial` with baked procedural maps |
| three | a peer dependency, so the host provides it and there is exactly one copy |

## What already matches

| | Host game (`HULL` in `ship.js`) | This model | |
| --- | --- | --- | --- |
| Local frame origin | waterline amidships | waterline amidships (`y = 0`, `z = 0` at the midship station) | ✅ |
| Bow direction | `-Z` | `-Z` | ✅ |
| Keel depth | `-4.3` m | `-4.28` m | ✅ |
| Half beam | `4.95` m | `4.83` m moulded, `4.93` m over the wales | ✅ |
| Length, stem to sternpost | `39` m | `38.4` m on the gundeck, `36.9` m between perpendiculars | ✅ within 1.5 % |
| Triangles | procedural, a few thousand | 59.7 k at the game LOD | see below |

The `game` GLB therefore drops straight in without a scale factor or a rotation. Load it,
add it to `this.group`, and delete the procedural hull builder.

## What a host has to decide

**1. The wave field is sampled in the host, not here.** `ship.js` samples at
`±13 m` fore and aft and `±4.4 m` on each beam, and eases heave, pitch and roll toward
those samples. Those numbers are the host's and they stay the host's — this model has no
motion of its own. The only thing to check is that `±13 m` is still the right lever arm
for a hull whose perpendiculars are 36.9 m apart: the fore and aft sample points sit at
about 0.70 of the half-length, which is a reasonable place to take a ship's trim from and
is what the existing ship uses.

**2. The flags are baked — unless the motion layer is running.** `buildShip` flies the
ensign, the pennant and the jack as static meshes with a wind curve frozen into them. A
host that animates its own should hide these and read their positions: the meshes are
named `ensign`, `pennant` and `jack` inside the `flags` group. That is what hms-surprise
does today, and it remains a perfectly good arrangement.

The alternative, now, is to let the model fly them: `createMotion(ship)` re-evaluates each
flag's own surface every frame at a running phase, which is the same curve the static mesh
has, moving. A host doing that should drop its own flag animation rather than run both.

**2a. The motion layer.** `createMotion(ship)` is opt-in and additive — it clones the
materials it patches, so the built ship and the exported GLB are untouched. Call it once
after building and then once a frame, *after* the host has set the hull's own heave, pitch
and roll:

```js
import { buildShip, createMotion } from 'surprise-model';

const ship = buildShip({ lod: 'game', sails: 'storm' });
const motion = createMotion(ship);

// in the frame loop, after ship.position/rotation have been set for this frame:
motion.update(elapsedSeconds, {
  windSpeed: 24,     // m/s; the spec's amplitudes are written for a 22 m/s gale
  windDeg: 155,      // where the wind is going, from dead ahead, turning to starboard
  heel: ship.rotation.z,
  pitch: ship.rotation.x,
  helm: -0.35,       // -1 hard a-port to +1 hard a-starboard; the wheel and the two men on it follow
  spray: bowBuried ? 1 : 0,   // she goes dark and glossy where the sea has been, and dries over ~9 s
});
```

It reads the ship's own world matrix each frame, so a host may move, rotate and scale her
freely. Costs: no geometry is rebuilt, three flags of about 150 vertices each are rewritten
on the processor, and everything else is a vertex shader. The one thing to get right is the
order — `update` last, after the hull has been moved, or the rig lags a frame behind her.

**2b. Secured for sea.** `sails: 'storm'` also sets `weather: 'heavy'`, which shuts the
gundeck ports and houses the battery, ships deadlights over the stern windows, battens the
hatches under tarpaulins, rigs lifelines through the waist, gripes the boats down and puts
tompions in the guns on the open decks. A host that wants any of it decoupled from the
canvas passes `weather` or `ports` explicitly. All of it is build-time state, not runtime:
securing a ship for sea is a `buildShip` away, at the same cost as changing her canvas.

**2c. Bracing.** Each square sail is now hung on its own yard instead of being merged into
one mesh, and `motion.update` braces the yards to `windDeg` — square when the wind is aft,
sharp up when it is forward, hauled round at nine degrees a second. If your game has a
wind that shifts, the rig answers it. The cost is seven more draw calls for the canvas.

Two things follow for a host. Yards are found by name (`*_yard`), so the sails are found
by theirs (`*_sail`) — `tools/check-motion.js` holds both files to that. And the belly of
each sail is lofted for a wind forward of the beam, so a dead-astern wind wants a rebuild
rather than a brace.

**3. Sail state.** Building from source rather than loading a GLB is what makes this
cheap: the materials are cached per level, so a second `buildShip` at a different sail
state costs about 80 ms of geometry and no download at all. A ship can shorten sail in
front of you.

**4. Triangle count.** 59.7 k against the host's few thousand. That is the point of the
exchange, but it is a real cost on a scene that also carries a wave field, spume and
cloud. Measure before committing; if it is too much, the levers in
`src/ship/lod.js` under `game` are, in order of triangles saved per unit of appearance
lost: `gunCarriages` to `'simple'`, `boats` to `'block'`, `deckFurniture` to `'none'`,
`ratlines` to `false`. `crew` to `false` is on that list too, and it is the last one to
reach for rather than the first: thirteen figures cost about 1,900 triangles and they are
what give the ship her scale.

The budget itself was raised from 60 k to 80 k when the watch came aboard, so a host that
was measuring against the old ceiling should measure again.

**5. Materials.** 23 materials at the game LOD, all `MeshStandardMaterial` with baked
procedural maps. Nothing needs the host's lighting to change. If the host batches by
material, the count could come down by merging the timber and mast materials, which differ
only in roughness.

## The thing that was actually wrong

The host's `HULL.length` was 39 m, and it is read by more than the drawing — the wake, the
spume emitters and the bounds all use it. Her gundeck is 38.4 m. It now comes from
`SPEC.hull_length_gundeck`, so everything that reads it follows the hull rather than a
number somebody typed once.
