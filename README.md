# Waakzaamheid — parametric model

The Dutch seventy-four that chases the Leopard through the Southern Ocean in Patrick
O'Brian's *Desolation Island*, built for The Helmsman's Watch the way HMS Surprise is
built in `surprise-model`: a parametric generator that lofts her hull from a real draught
and builds her at four levels of detail, in four states of canvas, with the same API.

She is fictional; **her hull is not**. It is lofted from the lines of the Dutch 74
*Washington* (Amsterdam, launched 1796), whose own draught survives at the Nationaal
Archief (4.MST inv. 59). Every station of its body plan was followed by machine off the
archive's scan and calibrated on the drawing's own scale of feet. What the book says of
her — black-hulled, broad-sterned, bluff-bowed, 32-pounders below and 24s above, chasers
in bridle ports, pole topgallant masts — is built as the book says it.

| | |
| --- | --- |
| Length on the lower deck | 50.68 m (179 Amsterdam ft) |
| Breadth | 13.84 m moulded, 14.07 m extreme |
| Draught | 5.82 m |
| Displacement | 2,282 t |
| Guns | 28 × 32-pdr, 28 × 24-pdr, 16 × 12-pdr, two bow chasers, two stern chasers |
| Rig | Steel's 74, fitted to her size; Dutch tops; pole topgallants; no royals |
| Colours | Dutch tricolour (default), French tricolour, or the British blue ensign of her ruse |

`python3 tools/draught/lines_overlay.py out.png` draws her built lines back over the
draught they were traced from (the archive's scan is fetched into `.cache/` for that and
is not redistributed here).

## What it produces

| LOD | Triangles (no people) | Draw calls | Use |
| --- | --- | --- | --- |
| `cinematic` | 1.72 M | 404 | A camera flying close round her |
| `hero` | 1.01 M | 337 | Close inspection |
| `game` | 95 k | 150 | The chaser at gameplay range |
| `distant` | 7.8 k | 88 | On the horizon |

Sail states, as Surprise's: `full`, `topsails`, `storm` (reefed foresail and close-reefed
main topsail) and `furled`. `weather: 'heavy'` shuts her ports and houses her guns — except
the chasers, which stay manned unless `chasers: 'secured'`.

## For the game

```js
import { buildShip, createMotion, createSailHandling } from 'waakzaamheid-model';
import { SPEC } from 'waakzaamheid-model/spec';
import { carryAway, restore } from 'waakzaamheid-model/damage';

const ship = buildShip({ lod: 'game', sails: 'full', animatedSails: true, crew: false });
const handling = createSailHandling(ship, 'full');
const motion = createMotion(ship);
carryAway(ship, 'fore_lower_mast');   // the book's ending
```

The same exports and subpaths as `surprise-model` (`npm test` holds them to it), plus
`./damage`. Everything a host needs — her numbers in `SPEC`, the chasers' locators and
gunnery records, the shoot-away registry, what each level costs, and the one naming trap
(`gundeck` is the **lower** deck on a two-decker) — is in
[docs/GAME-INTEGRATION.md](docs/GAME-INTEGRATION.md).

## Commands

```bash
npm install
npm run viewer    # http://127.0.0.1:8099/viewer/ — with colours and a shoot-away panel
npm run check     # the gate: specs, trace, audit, every check, cost, build, verify
npm run render    # verification renders to renders/
```

`npm run check` runs `make-specs` (SPECS.md from the spec), `trace` (every dimension
sourced), `audit` (78 measurements of the built geometry against the spec), the region
checks (stern closure, motion, shot-away parts, chasers, colours, rigging anchors, port
lids, deadeyes, windows, wales), `check-cost` (triangles and draw calls per level), then
builds and reloads all ten GLB exports.

`python3 tools/compare.py reference-hero-furled.png` lays a render beside the
Rijksmuseum's photograph of a real Dutch 74 model of 1782.

## How it is organised

```
PLAN.md                 the plan Matthew approved, and what was deliberately left out
SPECS.md                the contract — every dimension, with its source and grade
docs/research/          the evidence: the book, the draught, hull, rig, flags, paint, tracing
docs/TWO-DECKER.md      what differs from surprise-model, for anyone changing a module
docs/GAME-INTEGRATION.md  for the game
docs/offsets.json       the traced offset table (src/spec/offsets.js is generated from it)
docs/trace/             the seeds and readings the tracing started from
tools/draught/          the tracer: calibration, line following, extraction, overlays
src/spec/               the spec as code; the only place a number may be written
src/ship/               the generator, one module per region of the ship
src/ship/damage.js      shooting away her rig
src/ship/batch.js       draw-call batching at the far levels
tools/                  build, audit, trace, checks, render, serve
viewer/                 the inspection page and the render harness
```

The code started as a copy of `surprise-model` at commit `81b2ee8`; modules keep their
names so fixes can be ported file to file. `surprise-model` itself was not changed.

## Where the evidence is thin

* **Her topsides above the main wale** — hidden by the hatched wales on the scan; the dead
  flat's tumblehome is measured and the other stations reconstructed from it.
* **Her waterline** — set by the Dutch rule for 74s (lower sills 6 ft 6 in above water).
* **Her masts and yards** — a British table (Steel, 1794) fitted to her; no Dutch table found.
* **Her paint and bottom** — the book, one Dutch drawing of 1800, and a few models.
* **Her colours in 1811** — history leans French; the book calls her Dutch.
* **Her bridle ports** — the book's; Dutch ships of her date chased from the forecastle.

The research behind every one of these is in `docs/research/`, with sources.
