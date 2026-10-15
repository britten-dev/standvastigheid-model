# What changes on a two-decker

This repo started as a copy of surprise-model (a one-deck frigate) at commit `81b2ee8`.
Read `docs/CONVENTIONS.md` and `docs/MODULE-CONTRACT.md` first; this file says what is
different here. The plan is `PLAN.md`; the evidence is `docs/research/`.

## Units and sources

* Her draught is in **Amsterdam feet** of 11 inches: `aft(feet, inches)` from
  `src/util/math.js` (`aft(48, 9)` = 48 9/11 ft). British/Steel figures stay in `ft()`.
* Grades in spec sources: `PRIMARY`, `MEASURED` (off the draught by `tools/draught/`),
  `SECONDARY`, `RECONSTRUCTED`, `FICTIONAL` (O'Brian). §n means `docs/research/0n-*.md`.
* Everything measured off the draught is in `docs/offsets.json` → `src/spec/offsets.js`
  (`OFFSETS`): sections, feature lines, every port (`OFFSETS.ports.lower/upper/quarterdeck`,
  each `{z, width, sill, head}`), masts (`OFFSETS.masts.{fore,main,mizzen}.z`), deck
  breaks, capstan, hawse holes, the stem and sternpost profiles, the keel.

## The hull model (`src/ship/hull.js`)

`featureYAt(z)` now returns, bottom to top:

| key | what |
| --- | --- |
| `keel_bottom`, `keel_top`, `rabbet`, `floor`, `bilge`, `waterline` | as before |
| `wale_bottom`, `wale_top` | the **main** wale (about at the waterline amidships) |
| `lower_deck` | lower deck at side (the RN "gundeck") |
| `lower_port_sill`, `lower_port_head` | the lower battery (32-pdrs) |
| `middle_wale_bottom`, `middle_wale_top` | the wale between the tiers |
| `deck` = `upper_deck` | upper deck at side — the deck in the waist, where fittings stand |
| `port_sill`, `port_head` | the **upper** battery (24-pdrs) |
| `quarterdeck`, `forecastle` | those decks at side (each meaningful only over its own length) |
| `sheer_strake`, `rail` | top of the planked side (quarterdeck rail abaft the break) |

Also: `lowerDeckAt(z)`, `upperDeckAt(z)`, `standingDeckAt(z)` (QD abaft `zQdBreak`, FC
forward of `zFcBreak`, upper deck between), `railYAt(z)`, `zStem` and
`fromStem(m)` — metres abaft the **stem rabbet at the lower deck**, the draught's zero for
its 179 ft. `lengthOnDeck` is 179 Amsterdam ft = 50.68 m. `zFwd`/`zAft` are the ends of the
loft (stem and sternpost rabbets), z = 0 is station 10 (the dead flat), -Z forward.

Key numbers (metres, y above the load waterline, amidships): lower deck at side 1.25,
lower sills 1.84, upper deck at side 3.38, upper sills 3.98, waist rail 5.65,
quarterdeck rail aft up to ~8, keel underside -5.70. Breadth moulded 13.84, draught 5.82.

## Ports (`src/ship/gun-openings.js`)

`portRecords(model)` lists every port as `{kind, index, z, width, y0 (sill), y1 (head),
height}`, kind `'lower' | 'upper' | 'quarterdeck' | 'bridle'`. The hull, the inboard
linings and the lids are all cut from it. 14 + 14 + 5 a side, plus one bridle port a side
for the bow chasers. The forecastle has **no** ports: an open rail on timberheads.

## Decks (`src/ship/decks.js`)

Meshes: `gundeck` (the lower deck), `upper_deck`, `quarterdeck`, `forecastle`,
`gangway_starboard/port`, `inner_bulwark` (upper deck to rail), `lower_deck_lining`
(between the decks, seen through the lower ports), `upper_deck_underside`, `rail_cap`.

## Paint

Black hull, black tarred wales, no bands; white stuff below the waterline (not copper:
`PAINT.bottom_sheathed` is false); red ochre port linings and inboard works; ochre and gilt
carving at the stern and head (`mats.ochre`, `mats.gilt`). §6.

## Shared files

`src/ship/index.js`, `src/ship/lod.js`, `src/ship/hull.js`, `src/spec/spec.js`,
`src/ship/materials.js` and `src/spec/parts/index.js` are shared. A module that needs a
change in one keeps it as small as possible and says exactly what it changed.
