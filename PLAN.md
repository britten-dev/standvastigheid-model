# Plan — the Waakzaamheid model

Status: **approved by Matthew on 15 October 2026, and built.** What came out differently
from the plan is at the end, under "As built".

## In one paragraph

Build her the way HMS Surprise was built, from a real draught: the Dutch 74
*Washington* (Amsterdam, 1796), whose own lines plan is at the Nationaal Archief at
high resolution. Copy surprise-model's code into this repo, keep its module layout and
its public API exactly, and rework the parts that assume a one-deck frigate: hull
features, decks, two tiers of ports and guns, the bigger stern and head, and a rig in
which every mast, topmast, yard and sail can be carried away on its own. Then the
game can load either ship the same way.

## What changes, and where

All in this new repo. **surprise-model is not touched.**

| Area | Files | Work |
| --- | --- | --- |
| Scaffold | `package.json`, `src/util/*`, `src/audit/*`, `src/spec/units.js`, `src/spec/parts/index.js`, `tools/serve.js`, `tools/trace.js`, `tools/audit.js`, `tools/check-exports.mjs`, `viewer/*` | Copy from surprise-model at commit `81b2ee8`, rename. Record the commit so later fixes can be ported |
| The draught | new `tools/trace-draught.py`, `tools/make-offsets.js`, `tools/sync-offsets.js`, `docs/offsets.json` | Trace every station of the Washington's body plan and the sheer-plan lines (both decks, both port tiers, both wales, rail, rabbet, keel) off the 11,000-px scans. Check displacement and coefficients |
| Spec | `src/spec/spec.js`, `src/spec/parts/*.js` | Rewrite the core for a two-decker. Every number sourced and graded, Amsterdam feet via a new `aft()` beside `ft()` |
| Hull | `hull.js` | New features: `lower_deck`, `lower_port_sill/head`, `channel_wale_*` beside the existing ones. Keep every `hullModel()` method the game uses |
| Decks | `decks.js`, `deck-level.js`, `deck-finish.js` | Lower deck (seen through ports), upper deck, quarterdeck, forecastle, gangways |
| Ports | `ports.js`, `port-fittings.js`, `gun-openings.js` | Two tiers plus quarterdeck/forecastle and two bridle ports. Cut by triangle clipping, not by dropping loft quads |
| Guns | `guns.js` | 28 × 32-pdr, 28 × 24-pdr, 16 × 12-pdr, **two bow chasers in bridle ports** (as the book has it — see below), two stern chasers in the counter, all with named muzzle locators and the same `gunnery` record format |
| Stern, head | `stern.js`, `stern-detail.js`, `stern-lettering.js`, `head.js` | Round tuck and hollow counter with two chase ports; lower stern windows closed, upper tier an open stern walk behind a carved balustrade; two-tier quarter galleries; carved taffrail with corner figures — as her draught and her 1797 model. A beakhead bulkhead if tracing confirms it, open head rails, a crowned Dutch lion figurehead. No name on the stern (no Dutch ship of the period shows one) |
| Rig and sails | `rig.js`, `sails.js`, `sail-handling.js`, `motion.js`, `rigging-bindings.js`, `mast-tops.js` | Masts where her draught puts them (Steel's rule agrees within 3 ft). Every spar from Steel's 1794 table for a 74, scaled × 0.955 to her size by Steel's own rule. Dutch round-cornered tops and pole topgallants (the *Vrijheid* model; the book), no royals, a spritsail yard, gaff spanker. Same fifteen sails and four states as Surprise. Rig rebuilt as nested per-mast groups with standing and running rigging split per mast section (see below) |
| Channels, boats, anchors, furniture | `channels.js`, `boats.js`, `ground-tackle.js`, `furniture.js` | Respec for a 74: channels on the wale, more boats, more anchors, a double capstan |
| Paint, flags | `materials.js`, `weathering.js`, `flags.js` | Black hull with no bands (the book; a Dutch drawing of the 74 *Jupiter*, 1800), red port linings, ochre masts with black hoops, ochre and gilt stern, white bottom. Dutch tricolour by default; `ensign: 'blue'` flies the false British blue ensign of the book's ruse; `ensign: 'french'` for the likelier history |
| Crew | `crew.js` | Procedural watch only, re-dressed; `crew: false` works |
| LODs | `lod.js`, `detail-lod.js` | Same four tiers, new budgets (below) |
| Checks | `tools/check-*.js` | Copy and retarget; add `check-rig-parts` and `check-chasers` |
| Docs | `README.md`, `SPECS.md` (generated), `docs/GAME-INTEGRATION.md`, `docs/research/*` | |

## The API — the same as surprise-model

```js
import { buildShip, createMotion, createSailHandling, createDetailLOD,
         preloadSurfaceAssets, LODS, SAIL_STATES } from 'waakzaamheid-model';
```

Subpaths `./spec`, `./hull`, `./lod`, `./detail`, `./motion`, `./views`, `./crew`.
`buildShip` takes the same options with the same defaults. The only change is the
values `ensign` accepts. `check-exports` compares the export lists against
surprise-model's so they cannot drift.

The game's chase stand-in (`helmsmans-watch` worktree, `src/game/pursuit.js`) uses
length 51.2 m, beam 14.3 m, draught 6.2 m and mass 1.7 × 10⁶ kg, all guessed from a
British 74. The spec will give her measured `hull_length_gundeck`,
`hull_beam_extreme`, `hull_draught_aft` and a new `hull_displacement`, from the traced
lines, so the game can swap its guesses for hers.

**New, additive:** `./damage` with `carryAway(ship, part)` and
`ship.userData.rigParts`, a registry of every mast, topmast, topgallant, yard, sail and
the bowsprit — what each carries and which ropes go with it.

## Shot-away parts

Today in surprise-model every spar is a separate mesh, but they are all siblings in one
group and the ropes are merged into one mesh. Hide a mast and the topmast floats.

Here the rig is nested the way it is fitted:

```
rig
└ fore                      (group)
  ├ fore_lower_mast, fore_top, fore_lower_standing_rigging, fore_lower_running_rigging
  ├ fore_yard → fore_course_sail
  └ fore_topmast_assembly   (group)
    ├ fore_topmast, crosstrees, fore_topmast_standing_rigging, …
    ├ fore_topsail_yard → fore_topsail_sail
    └ fore_topgallant_assembly → fore_topgallant, its yard, sail and ropes
```

Mesh names stay as surprise-model's (`fore_topsail_yard`, `main_topsail_sail`, …) so
the motion layer and the game find them the same way. `carryAway('fore_topmast')`
hides the assembly and everything it carries, and the motion layer and sail handling
skip what is hidden. A new check carries away every part in turn and fails on any rope
left hanging in the air or any sail left without its yard.

Cost: about twenty more draw calls, because rigging is no longer one batch.

## Bow chasers

Two long guns in bridle ports on the lower deck, abaft the hawse holes, trained right
forward. Each has a node `locator_bow_chaser_port` / `_starboard` at the muzzle,
pointing down the bore, and an entry in `guns.userData.gunnery` in the same format as
the broadside guns, so the game's `gunnery.js` drives them unchanged. Their `side` is
`'bow'`, so a broadside order to port or starboard never fires them. In heavy weather
the lower tier is shut but the bridle ports may stay open (`chasers: 'manned'`, also
written to `ship.userData.chasers` so the game's "ports shut, guns secured" rule can
let the chasers through).

## Levels of detail

| LOD | Budget (triangles) | Surprise for comparison |
| --- | --- | --- |
| cinematic | up to 1.6 M without crew | 0.38–1.88 M |
| hero | up to 1.0 M | 0.2–1.26 M |
| game | 40–100 k | 30–88 k |
| distant | up to 8 k | 1.5–6.5 k |

A 74 has twice the guns and half again the rig. To stay inside the game budget, guns
behind shut lids are not built at `game` and `distant`, and ratlines stop at `game`.

## How she is checked against the evidence

- **Lines overlay.** Her built hull drawn back over the Washington scan — sheer, body
  plan and half-breadth — and the differences measured.
- **A reference view** matched to the Rijksmuseum's public-domain photograph of the
  *Vrijheid* model, so a render can be laid beside a real Dutch 74 of the period, as
  Surprise is laid beside her museum model.
- The audit, as in surprise-model: built geometry measured against every spec number.

## Order of work

1. **Scaffold** — copy, rename, a placeholder hull, `npm run check` green. Publish
   `docs/GAME-INTEGRATION.md` first, so the helmsmans-watch session can build its
   stand-in against the real names and locators now.
2. **Trace the draught** — offsets, displacement check, an overlay of her lines on
   the scan.
3. **Hull and structure** — decks, two port tiers, wales, channels, stern, head.
   **One stop here:** I send you renders of the bare hull beside the draught and the
   Rijksmuseum model, because everything after stands on it. Then I carry on.
4. **Guns and chasers**, with a firing test in the viewer.
5. **Rig and sails** — nested, separable, four sail states, sail handling, motion,
   with a carry-away test in the viewer.
6. **Finish** — paint, weathering, flags, crew, all four LODs inside budget, viewer,
   README, SPECS.md, every check green.
7. **Ask** before creating `britten-dev/waakzaamheid-model` on GitHub and before
   pushing.

## What could break

- **Two copies of the same code.** A fix in surprise-model will not reach her by
  itself. Mitigation: the fork commit is recorded and modules keep their names, so a
  fix ports file to file.
- **The tracing.** Two overlapping photographs of a 230-year-old sheet, so lens and
  paper distortion. Mitigation: calibrate each shot on the drawing's own scale of feet,
  check against the title block, the British survey and displacement. Target: 1 %.
- **Two-deck rework is most of the work.** Hull features, decks, ports, guns and the
  stern all assume one gun deck. Roughly half the ship code is rewritten, not copied.
- **The split rigging** changes the code that binds running ropes to yards and sails.
  That is exactly the code most likely to fail silently, so the motion and
  rigging-anchor checks are kept and extended, not loosened.
- **Game budget.** Two ships on screen, and the game already spends about 1–1.5 M
  triangles and some 420 render calls on Surprise alone (helmsmans-watch
  `docs/DETAIL-PROGRAMME.md`). The chaser is mostly seen at range, so her `game` tier
  must stay small in calls as well as triangles: target under about 120 calls. If that
  is too much, the levers are the same as Surprise's, in the same order.
- **Names.** `gundeck` follows Royal Navy usage (the lower deck), which is not what it
  means on Surprise (her only deck). A host reading `gundeck_above_wl_at_midships` for
  "the deck people stand on" should read `weather_deck_above_wl_at_midships` instead.
  Flagged in `docs/GAME-INTEGRATION.md`.

## Where this plan is weak

- **Rig and paint are reconstructions.** No Dutch masting table or paint order was
  found. The spar lengths are a British table fitted to her size; only the mast
  positions are hers. The paint rests on the book, one Dutch drawing of 1800 and a few
  models. White bottom or copper is a guess either way.
- **The bridle ports are the book's, not history's.** Dutch ships had dropped the bow
  port by the 1770s and chased with two light guns on the forecastle. The plan follows
  the book; the forecastle is the alternative.
- **Close-up she will be plainer than Surprise.** No Blender-authored helm, figures or
  cabin in this version. The camera flying close will see a well-built ship, not
  Surprise's furnished quarterdeck.
- **It is big.** Surprise grew to 17,700 lines over many sessions. This plan reuses most
  of it, but phases 3–5 are each a long session's work.

## What I am NOT doing

- Not changing surprise-model, and not making the two repos share code.
- No falling wreckage, damage physics, broaching or sinking — the game's job. Only the
  separable parts and `carryAway()`.
- No Blender-authored assets, no great-cabin interior, no studdingsails.
- No Netlify site for her yet.
- No GitHub repo and no push until you say so.

## Defaults I have picked — say if you want different

- **Hull:** the Washington's lines, as drawn.
- **Bow chasers:** in bridle ports, as the book says. (History: two light guns on the
  forecastle.)
- **Colours:** the Dutch tricolour by default — it reads as Dutch, as O'Brian calls her.
  History leans French for 1811; that is `ensign: 'french'`. The British blue ensign
  of her ruse is `ensign: 'blue'`.
- **Figurehead:** a crowned Dutch lion. (Her own was a Roman warrior.)
- **Bottom:** white, not copper.
- **Guns:** 32-pdrs below and 24-pdrs above, as the book says; long 12-pdrs on the
  quarterdeck and forecastle.
- **Budgets:** as in the table above.

## As built

* **Budgets.** `game` 95 k triangles and `distant` 7.8 k are inside the plan. `hero` is
  1.01 M (plan 1.0 M) and `cinematic` 1.72 M without people (plan 1.6 M): two decks of
  guns and ports, and close detail for the flyby. Draw calls at `game` are 150 and at
  `distant` 88, against about 120 planned: static fittings are batched, but every rig
  part keeps its own meshes so it can be shot away. `docs/GAME-INTEGRATION.md`, "Cost".
* **Stern chasers** were added (two in the counter's chase ports, which her own 1797 model
  shows), beside the bow chasers in bridle ports.
* **Her stern** turned out, from her 1797 model, to have an open upper stern walk; built so.
* **Her lines** were traced in full, every station, not only the midship section; the
  ends are closed on the traced stem and sternpost (`docs/research/07-tracing.md`).
* **Blender-authored detail**: none, as planned. Surprise's authored helm and figures are
  not loaded.
