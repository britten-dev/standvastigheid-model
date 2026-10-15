// Write SPECS.md.
//
// The prose is authored here; the dimension tables are generated from src/spec/spec.js
// and docs/offsets.json. That is deliberate. A specification kept by hand beside a
// generator drifts from it within a week, and a drifted specification is worse than
// none because it is still believed. So the numbers in this document are the numbers
// the generator uses, by construction, and what a human maintains is the part a machine
// cannot: where each number came from, how far it is to be trusted, and what is still
// guesswork.
//
// `npm run trace` then closes the loop from the other side: it fails if a generator
// dimension has no row here, or if a row has no source.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT } from './serve.js';

const { SPEC, PAINT } = await import(path.join(ROOT, 'src/spec/spec.js'));
const OFFSETS = JSON.parse(await fs.readFile(path.join(ROOT, 'docs/offsets.json'), 'utf8'));

const FOOT = 0.3048;
const toFtIn = (m) => {
  const total = m / FOOT;
  const ft = Math.floor(Math.abs(total));
  const inches = (Math.abs(total) - ft) * 12;
  const sign = total < 0 ? '-' : '';
  return `${sign}${ft} ft ${inches.toFixed(1).replace(/\.0$/, '')} in`;
};

const GRADE = (src) => (src.match(/^(PRIMARY|SECONDARY|RECONSTRUCTED|FICTIONAL|MEASURED)/) || ['—'])[0];

// Which keys belong in which table, in the order they should be read.
const GROUPS = [
  ['Principal dimensions', /^hull_(length|beam|depth|tons|draught|tumblehome)/],
  ['Decks and bulwarks', /^(gundeck|quarterdeck|forecastle|deck_camber|bulwark|side_thickness|rail_cap|gangway)/],
  ['Backbone', /^keel_/],
  ['Gunports', /^(gunport|qd_port|fc_port)/],
  ['Wales', /^wale_/],
  ['Masts and their stations', /^(fore_mast|main_mast|mizzen_mast|mast_step)/],
  ['Topmasts, topgallants and poles', /^(fore_topmast|main_topmast|mizzen_topmast|fore_topgallant_(length|diameter)|main_topgallant_(length|diameter)|mizzen_topgallant_(length|diameter)|fore_royal_pole|main_royal_pole|mizzen_royal_pole)/],
  ['Bowsprit, jibboom and dolphin striker', /^(bowsprit|jibboom|dolphin_striker|gammoning)/],
  ['Yards and booms', /(yard|boom|gaff)/],
  ['Tops', /^(main_top_|fore_top_|mizzen_top_|top_platform)/],
  ['Standing rigging', /(shroud|backstay|bobstay|ratline|stay_diameter|running_rigging_diameter)/],
  ['Sails', /^(sail_|square_sails|furled_)/],
  ['Channels, deadeyes and chainplates', /^(channel_|fore_channel|main_channel|mizzen_channel|deadeye|mizzen_deadeye|chainplate|mizzen_chainplate|chain_bolt|mizzen_chain_bolt|supporter_)/],
  ['Stern, galleries and rudder', /^(stern_|taffrail_|quarter_gallery|rudder_|tiller_|ensign_staff_step)/],
  ['Head, beakhead and figurehead', /^(head_|stem_|cutwater|beakhead|knighthead|cathead|figurehead|bowsprit_partner|seat_of_ease|hair_bracket|trailboard|bow_chase)/],
  ['Deck furniture', /^(wheel_|binnacle_|capstan_|main_hatch|fore_hatch|after_hatch|ladderway|coaming_|grating_|riding_bitt|jeer_bitt|main_jeer_bitt|main_topsail_sheet_bitt|fore_topsail_sheet_bitt|chain_pump|pump_|elm_pump|belfry_|bell_|galley_|steam_grating|skylight_|companion_|skid_|hammock_|belaying_|fife_|ladder_|furniture_)/],
  ['Armament', /^(gun_|carronade_)/],
  ['Boats', /^(boat_|launch_|pinnace_|cutter_|jolly_|davit_)/],
  ['Ground tackle', /^(anchor|cable_|hawse|cat_block|fish_|sheet_anchor|kedge_anchor|stowed_anchor|stowed_stock|shank_painter)/],
  ['Colours', /^(ensign_|pennant_|jack_|union_|flag_|canton_)/],
  ['The watch on deck', /^crew_/],
  ['Motion', /^motion_/],
];

const used = new Set();
function rowsFor(re) {
  const out = [];
  for (const [key, row] of Object.entries(SPEC)) {
    if (used.has(key) || !re.test(key)) continue;
    used.add(key);
    out.push([key, row]);
  }
  return out;
}

const table = (rows) => {
  if (!rows.length) return '_none_\n';
  let s = '| key | metric | period figure | grade | source |\n|---|---|---|---|---|\n';
  for (const [key, row] of rows) {
    const v = row.value;
    // Counts and angles are not lengths and must not be shown as feet and inches.
    const isLength = /_(length|breadth|width|height|depth|diameter|spacing|thickness|siding|moulding|beam|draught|camber|sill|from_stem|step_y|housing|above_wl|above_deck|above_gundeck|below_deck)$|^keel_|^wale_/.test(key)
      && !/_deg$|_pairs$|_count|_ratio$|_u$|_fraction$/.test(key);
    const period = isLength ? toFtIn(v) : '—';
    s += `| \`${key}\` | ${Number(v.toFixed(4))} | ${period} | ${GRADE(row.source)} | ${row.source.replace(/^(PRIMARY|SECONDARY|RECONSTRUCTED|FICTIONAL|MEASURED)\s*/, '')} |\n`;
  }
  return s;
};

const offsetTable = () => {
  const wl = OFFSETS.waterlineY.map((y) => y.toFixed(2));
  let s = `Half-breadths in metres, at ${OFFSETS.stationZ.length} stations and ${wl.length} waterlines.\n`
    + `Station \`z\` is metres from the station of maximum breadth, negative forward. Waterline \`y\`\n`
    + `is metres above the design load waterline, so most are negative. \`—\` means the station does\n`
    + `not reach that waterline.\n\n`;
  s += '| station | z | rabbet y | ' + wl.map((y) => `y ${y}`).join(' | ') + ' | deck y | deck half-b | top of side y | top of side half-b |\n';
  s += '|---|---|---|' + wl.map(() => '---').join('|') + '|---|---|---|---|\n';
  for (let i = 0; i < OFFSETS.stationZ.length; i++) {
    s += `| ${i} | ${OFFSETS.stationZ[i].toFixed(2)} | ${OFFSETS.rabbetY[i].toFixed(2)} | `
      + OFFSETS.halfBreadth[i].map((v) => (v === null ? '—' : v.toFixed(3))).join(' | ')
      + ` | ${OFFSETS.deckAtSideY[i].toFixed(2)} | ${OFFSETS.deckAtSideX[i].toFixed(3)}`
      + ` | ${OFFSETS.topOfSideY[i].toFixed(2)} | ${OFFSETS.railX[i].toFixed(3)} |\n`;
  }
  return s;
};

const paintTable = () => {
  let s = '| key | colour | roughness | metalness | source |\n|---|---|---|---|---|\n';
  for (const [key, row] of Object.entries(PAINT)) {
    s += `| \`${key}\` | ${row.hex ?? (row.value !== undefined ? Number(row.value.toFixed(4)) : '—')} `
      + `| ${row.roughness ?? '—'} | ${row.metalness ?? (row.hex ? 0 : '—')} | ${row.source} |\n`;
  }
  return s;
};

const groupSections = GROUPS.map(([title, re]) => `### ${title}\n\n${table(rowsFor(re))}`).join('\n');
const leftovers = Object.entries(SPEC).filter(([k]) => !used.has(k));

const doc = `# HMS Surprise — specification

The contract this model is built against. Every dimension in the generator traces to a
row below, and \`npm run audit\` measures the geometry that was actually produced and
diffs it against these numbers.

**How this file is maintained.** The prose is written by hand. The dimension tables are
generated from \`src/spec/spec.js\` and \`docs/offsets.json\` by \`node tools/make-specs.js\`,
so they cannot drift from the code. What a person maintains here is the part a machine
cannot: where each number came from, how far it is to be trusted, and what is still
guesswork. \`npm run trace\` closes the loop from the other side — it fails the build if a
generator dimension has no row here, or if a row has no source.

---

## 1. What ship this is

The French corvette **Unité**, launched 16 January 1794 at Le Havre, built by Jean
Fouache to a design attributed to Pierre-Alexandre Forfait. She was taken on 20 April
1796 in the Mediterranean by HMS Inconstant, bought into the Royal Navy, and renamed
**Surprise** because the Navy already had a Unité. Rated a sixth rate; 126 ft on the
gundeck, 31 ft 8 in extreme breadth, 578 73/94 tons burthen. Fitted at Plymouth
January–May 1798 at a cost of £6,992, which is when the only surviving draught of her was
made. She is the ship of Patrick O'Brian's Aubrey–Maturin novels.

The model is of the **real ship as she was in 1798**, not of the San Diego replica used
in the 2003 film — that vessel is a 1970 reconstruction of the 1757 HMS Rose, a
different ship of a different navy and a different generation.

### The modelling rule

Where the published plans and the reference photograph disagree, **the plans decide
dimensions and the photograph decides paint and character**. The photograph is a
hand-crafted museum model and is itself an interpretation; it is trusted for how the
ship should look and read, not for how big anything is.

## 2. Source register

| # | Source | Grade | What it gives |
|---|---|---|---|
| 1 | RMG **ZAZ3067**, "Lines & Profile", Plymouth Yard February 1798, signed John Marshall, titled "SURPRISE late L'UNITE". [Catalogue](https://www.rmg.co.uk/collections/objects/rmgc-object-82858) · [scan](https://collections.rmg.co.uk/media/2/440/707/j5948.jpg) | PRIMARY | The only surviving lines plan of this ship. Her recorded dimensions, the midship section, the sheer, the wales, the stem and stern profiles. |
| 2 | RMG **ZAZ3068**, "Deck, Quarter & Forecastle", same yard, date and hand. [Catalogue](https://www.rmg.co.uk/collections/objects/rmgc-object-82859) | PRIMARY | The deck plan: the waist, the gangways, the catheads, the round bow. |
| 3 | **David Steel, "The Elements and Practice of Rigging and Seamanship" (1794)**, vol 1 p.50, the column headed "28 GUNS. 594 Tons." [Scan](https://archive.org/download/bim_eighteenth-century_the-elements-and-practic_steel-david_1794_1/page/n67.jpg) | SECONDARY | Every spar length and diameter. This is *her own* establishment column, not an interpolation. |
| 4 | Steel 1794 vol 1 p.42, the fractional taper table and the head and hounds rules. [Scan](https://archive.org/download/bim_eighteenth-century_the-elements-and-practic_steel-david_1794_1/page/n59.jpg) | SECONDARY | How every spar tapers; masthead, doubling and pole lengths. |
| 5 | Steel 1794 vol 2, the rigging warrant for a 28-gun ship of 594 tons. | SECONDARY | Shroud, backstay and bobstay counts; ratlines at thirteen inches. |
| 6 | Steel, "The Elements and Practice of Naval Architecture", the "CENTRES OF MASTS" folio. | SECONDARY | Mast stations, mast rake, bowsprit steeve. |
| 7 | Rif Winfield, *British Warships in the Age of Sail 1793–1817*, via [threedecks 6983](https://threedecks.org/index.php?display_type=show_ship&id=6983) and [Wikipedia](https://en.wikipedia.org/wiki/HMS_Surprise_(1796)) | SECONDARY | Dimensions, tonnage, armament, complement, career. |
| 8 | A museum model by **The Model Shipyard**, [published on their site](https://www.stephensandkenau.com/ship/hms-surprise/). Read pixel by pixel in \`docs/PHOTO-ANALYSIS.md\`; the photograph itself is their work and is not redistributed here. | INTERPRETATION | Paint, ornament, sail set, character. Never dimensions. |
| 9 | \`docs/research/\` — eight sourced research files behind all of the above. | — | Every citation, and an honest account of what could not be found. |

**A trap worth recording.** The RMG catalogue links four plans (ZAZ3181–3184) to
"Surprise (captured 1796)". They are of a **different ship**: HMS Unite, ex-*Gracieuse*,
a 32-gun fifth rate of 142 ft 5½ in. The title cartouche of ZAZ3067 reads "SURPRISE late
L'UNITE"; that of ZAZ3181 reads only "L'UNITE". Do not use ZAZ3181–3184.

---

## 3. Dimensions

${groupSections}
${leftovers.length ? `### Other\n\n${table(leftovers)}` : ''}
---

## 4. Hull form

The offsets below were taken off source 1. **The midship section is measured**; the other
stations are that section scaled by a measured breadth line, lifted by a rising line of
floor and sharpened toward the ends, then tuned until the displacement came right. So
they are a reconstruction, but one anchored at both ends of the problem: a measured
midship shape and a measured displacement.

### It was verified, not just drawn

| Quantity | Model | Record | Verdict |
|---|---|---|---|
| Displacement | 656.1 tons | 657 tons | 0.1 per cent |
| Burthen, Builder's Old Measurement | 578.79 tons | 578 73/94 | exact |
| Midship coefficient Cm | 0.777 | frigates 0.75–0.78 | in band |
| Prismatic coefficient Cp | 0.614 | frigates 0.60–0.64 | in band |
| Block coefficient Cb | 0.477 | frigates 0.45–0.48 | in band |
| Longitudinal centre of buoyancy | 0.502 L | just abaft amidships | correct for a fine hull |
| Maximum beam | 0.51 of the LWL from forward | — | essentially amidships |

Tumblehome above the maximum breadth measures **15.6 degrees from the vertical**, which
is a lot — and contradicts the common claim that a French hull tumbles home less than a
British one. The measurement is what is built.

${offsetTable()}

---

## 5. Materials and paint

Colours are sRGB hex as they should appear under neutral light. Roughness and metalness
are linear. The paint bands are applied in the hull's own surface coordinate, so each one
follows the line of the ship it belongs to — the copper follows the waterline, the wale
and the ochre strake follow the sheer.

${paintTable()}

---

## 6. Levels of detail

| LOD | Triangles | Carries | Drops |
|---|---|---|---|
| \`hero\` | 200–500 k | Every ratline, gun, port lid, gallery light and deadeye. Ropes as tubes. | Nothing. |
| \`game\` | 30–60 k | Hull, decks, guns, boats, full spar plan, shrouds and stays as tubes. Hull about 38 m, sized to replace the host game's procedural ship. | Ratlines become lines, footropes and blocks go, deck furniture reduced to the principal items. |
| \`distant\` | under 5 k | Silhouette: hull, masts, yards, sails, lower shrouds and stays as lines. | Everything else. |

Sail states: \`full\` (courses, topsails, topgallants, staysails, three headsails and the
spanker, as in the reference photograph), \`topsails\`, \`storm\` (reefed foresail and
close-reefed main topsail) and \`furled\`.

---

## 7. What is honestly not known

* **Her lines below the midship section.** One draught survives, at 1:48, readable here
  only as a 1280-pixel scan. The midship section is measured off it; the rest is a fair
  reconstruction that reproduces her recorded displacement.
* **Her figurehead.** Not documented anywhere reachable. The "woman with sword and
  shield" belongs to the film ship, not to her. What is modelled is conjectural and is
  marked so.
* **The exact arrangement of her stern lights.** The body plan shows a single row of
  seven with a quarter gallery each side; the detail is reconstructed.
* **Her moulded breadth.** The row exists on the draught but is illegible at this
  resolution.
* **Which ensign she wore, and when.** That depended on her admiral's squadron. The
  pre-1801 Union canton is correct for 1798 and is what is built.
* **The height the copper was carried to.** Reconstructed at 2 ft 6 in to 3 ft above the
  load waterline.
* **The spanker.** Steel gives a 52 ft driver boom; the photograph shows a much shorter
  gaff spanker. The photograph decides character, so the spanker is what is built and
  the driver boom is recorded beside it.

Every one of these would be closed by two purchases: Karl Heinz Marquardt, *The Frigate
Surprise* (Anatomy of the Ship, 2003), and full-size prints of RMG J5947 and J5948.
`;

await fs.writeFile(path.join(ROOT, 'SPECS.md'), doc);
console.log(`SPECS.md written — ${Object.keys(SPEC).length} dimension rows, ${Object.keys(PAINT).length} material rows, ${OFFSETS.stationZ.length} stations`);
if (leftovers.length) console.log(`  ${leftovers.length} key(s) fell into "Other": ${leftovers.map(([k]) => k).join(', ')}`);
