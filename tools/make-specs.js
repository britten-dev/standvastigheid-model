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
  ['Principal dimensions', /^hull_(length|beam|depth|tons|draught|tumblehome|displacement)/],
  ['Decks and bulwarks', /^(gundeck|weather_deck|between_decks|deck_thickness|quarterdeck|forecastle|deck_camber|bulwark|side_thickness|rail_cap|gangway)/],
  ['Backbone', /^keel_/],
  ['Gunports', /^(gunport|lower_gunport|lower_port|qd_port|fc_port|bridle_port)/],
  ['Wales', /^(wale_|middle_wale)/],
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
  s += '| station | z | rabbet y | ' + wl.map((y) => `y ${y}`).join(' | ') + ' | lower deck y | half-b | top of side y | half-b |\n';
  s += '|---|---|---|' + wl.map(() => '---').join('|') + '|---|---|---|---|\n';
  for (let i = 0; i < OFFSETS.stationZ.length; i++) {
    s += `| ${OFFSETS.stationLabel[i]} | ${OFFSETS.stationZ[i].toFixed(2)} | ${OFFSETS.rabbetY[i].toFixed(2)} | `
      + OFFSETS.halfBreadth[i].map((v) => (v === null ? '—' : v.toFixed(3))).join(' | ')
      + ` | ${OFFSETS.deckAtSideY[i].toFixed(2)} | ${OFFSETS.deckAtSideX[i].toFixed(3)}`
      + ` | ${OFFSETS.topOfSideY[i].toFixed(2)} | ${OFFSETS.railX[i].toFixed(3)} |\n`;
  }
  return s;
};

const paintTable = () => {
  let s = '| key | colour | roughness | metalness | source |\n|---|---|---|---|---|\n';
  for (const [key, row] of Object.entries(PAINT)) {
    s += `| \`${key}\` | ${row.hex ?? (typeof row.value === 'number' ? Number(row.value.toFixed(4)) : row.value !== undefined ? String(row.value) : '—')} `
      + `| ${row.roughness ?? '—'} | ${row.metalness ?? (row.hex ? 0 : '—')} | ${row.source} |\n`;
  }
  return s;
};

const groupSections = GROUPS.map(([title, re]) => `### ${title}\n\n${table(rowsFor(re))}`).join('\n');
const leftovers = Object.entries(SPEC).filter(([k]) => !used.has(k));

const D = OFFSETS.dimensions;
const doc = `# Waakzaamheid — specification

The contract this model is built against. Every dimension in the generator traces to a
row below, and \`npm run audit\` measures the geometry that was actually produced and
diffs it against these numbers.

**How this file is maintained.** The prose is written by hand in \`tools/make-specs.js\`.
The dimension tables are generated from \`src/spec/spec.js\` and \`docs/offsets.json\`, so
they cannot drift from the code. \`npm run trace\` fails the build if a generator dimension
has no row here, or if a row has no source.

---

## 1. What ship this is

The **Waakzaamheid** is fictional: the Dutch seventy-four that chases the Leopard through
the Southern Ocean in Patrick O'Brian's *Desolation Island* (1978), set in early 1811, and
is lost when a shot brings down her foremast and she broaches in a breaking sea. The book
gives her 32-pounders on the lower deck and 24-pounders above, a black hull, a broad stern,
bluff bows, bridle-port chasers and pole topgallant masts (\`docs/research/01-the-book.md\`).

Her **hull is real**: it is lofted from the lines of the Dutch 74 **Washington**, laid down
at Amsterdam in 1795 and launched on 9 August 1796, taken by the British at the Vlieter in
1799 and renamed HMS Princess of Orange. Her draught survives at the Nationaal Archief
(4.MST inv. 59), in Amsterdam feet: 179 ft on the lower deck, 48 9/11 ft inside the plank,
22 ft in the hold.

### The modelling rule

The draught decides the hull; the book decides what is fictional (guns, paint, the
chasers, the topgallants); period rules fill the rest, and every row says which is which.

## 2. Source register

| # | Source | Grade | What it gives |
|---|---|---|---|
| 1 | Nationaal Archief **4.MST inv. 59**, "Aftekening van het Schip de Washington à 76 Stukken Canon", I. Vos, 1795. [Record](https://www.nationaalarchief.nl/onderzoeken/archief/4.MST/invnr/59) | PRIMARY | The hull: every station of the body plan, the sheer, the decks, both tiers of ports, the wales, the stem and sternpost, the masts' stations. |
| 2 | British survey of HMS Princess of Orange (ex-Washington), via [Wikipedia](https://en.wikipedia.org/wiki/HMS_Princess_of_Orange_(1799)) | PRIMARY | Length 168 ft 5 in, breadth 46 ft 2 in, 1,565 tons bm. |
| 3 | RMG SLR0591, dockyard model of the Washington, 1797. [Catalogue](https://www.rmg.co.uk/collections/objects/rmgc-object-66552) | SECONDARY | Her stern, head and figurehead. |
| 4 | Rijksmuseum NG-MC-500, rigged model of the Dutch 74 Vrijheid, 1782 (public domain) | SECONDARY | Dutch tops, caps, pole topgallants; black wales, red port linings; the crowned lion. |
| 5 | **David Steel, "The Elements and Practice of Rigging and Seamanship" (1794)**, vol 1 p.49, "74 GUNS. 1799 Tons." [Scan](https://archive.org/download/bim_eighteenth-century_the-elements-and-practic_steel-david_1794_1/page/n66.jpg) | SECONDARY | Every spar, scaled by Steel's own rule to her size. |
| 6 | A. Ruijter, *In dienst van twee republieken: het linieschip Staten-Generaal/Bato*, RCE | SECONDARY | The Dutch rules for 74s: lower ports 6 1/2 ft above the water, 6 7/11 ft between decks. |
| 7 | C. Toussaint, drawing of the Batavian 74 Jupiter, 1800, Rijksmuseum RP-T-1889-A-2234 | SECONDARY | Her paint: black, no bands, ochre masts. |
| 8 | Patrick O'Brian, *Desolation Island* (1978) | FICTIONAL | Everything marked FICTIONAL. |
| 9 | \`docs/research/\` | — | Every citation, and an honest account of what could not be found. |

---

## 3. Dimensions

${groupSections}
${leftovers.length ? `### Other\n\n${table(leftovers)}` : ''}
---

## 4. Hull form

Every station of the body plan was followed by machine off the archive's scan, calibrated
on the drawing's own scale of feet, and the ends of the ship closed on the traced stem and
sternpost rabbets (\`docs/research/07-tracing.md\`). The dead flat is drawn in both halves
of the body plan and the two agree to within a few centimetres.

| Quantity | Model | Record |
|---|---|---|
| Length on the lower deck | ${(179 * 0.283133).toFixed(2)} m | 179 Amsterdam ft |
| Moulded breadth | ${D.beam_moulded_m.toFixed(2)} m | 48 9/11 ft = 13.82 m |
| Length on the waterline | ${D.length_lwl_m.toFixed(2)} m | — |
| Draught, to the false keel | ${D.draught_m.toFixed(2)} m | not recorded; set by the Dutch rule for the lower ports |
| Displacement | ${D.displacement_t_seawater.toFixed(0)} t | not recorded |
| Block / midship / prismatic | ${D.Cb} / ${D.Cm} / ${D.Cp} | full, as a Dutch hull is |

${offsetTable()}

---

## 5. Materials and paint

Colours are sRGB hex as they should appear under neutral light. She is black all over, with
tarred wales, a white-stuff bottom, red ochre linings and ochre-and-gilt carving.

${paintTable()}

---

## 6. Levels of detail

See \`src/ship/lod.js\` (\`TRI_BUDGET\`) and \`docs/GAME-INTEGRATION.md\` for the measured
cost of each level.

Sail states: \`full\`, \`topsails\`, \`storm\` (reefed foresail and close-reefed main topsail)
and \`furled\` — the same as HMS Surprise's, by the same names.

---

## 7. What is honestly not known

* **Her topsides above the main wale.** The stations vanish into the hatched wales on the
  scan; the dead flat's tumblehome is read off the body plan and the other stations are
  reconstructed from it.
* **Her waterline.** The draught does not mark one. It is set by the Dutch Admiralties'
  rule for the lower ports, on an even keel.
* **Her masts and yards.** No Dutch masting table was found. The lengths are a British table
  fitted to her size; only the mast stations are hers.
* **Her paint, her bottom and her colours in 1811.** One drawing, a few models and the book.
  White stuff or copper is a guess either way; history leans to French colours in 1811,
  the book to Dutch.
* **Her bridle ports.** The book's, not the draught's.
`;
await fs.writeFile(path.join(ROOT, 'SPECS.md'), doc);
console.log(`SPECS.md written — ${Object.keys(SPEC).length} dimension rows, ${Object.keys(PAINT).length} material rows, ${OFFSETS.stationZ.length} stations`);
if (leftovers.length) console.log(`  ${leftovers.length} key(s) fell into "Other": ${leftovers.map(([k]) => k).join(', ')}`);
