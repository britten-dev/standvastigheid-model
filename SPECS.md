# Standvastigheid — specification

The contract this model is built against. Every dimension in the generator traces to a
row below, and `npm run audit` measures the geometry that was actually produced and
diffs it against these numbers.

**How this file is maintained.** The prose is written by hand in `tools/make-specs.js`.
The dimension tables are generated from `src/spec/spec.js` and `docs/offsets.json`, so
they cannot drift from the code. `npm run trace` fails the build if a generator dimension
has no row here, or if a row has no source.

---

## 1. What ship this is

The **Standvastigheid** is fictional: the Dutch seventy-four that chases the player in The
Helmsman's Watch, in the Southern Ocean in early 1811. Her character — 32-pounders on the
lower deck and 24s above, a black hull, a broad stern, bluff bows, bridle-port chasers and
pole topgallant masts — comes from the literary research in `docs/research/01-the-book.md`.

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
| 9 | `docs/research/` | — | Every citation, and an honest account of what could not be found. |

---

## 3. Dimensions

### Principal dimensions

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `hull_length_gundeck` | 50.6808 | — | PRIMARY | §2 title block of NA 4.MST inv. 59: "Lang op 't Onder Dek 179 Voet", Amsterdam feet, rabbet to rabbet on the lower deck. The British survey after her capture gives 168 ft 5 in English, 51.33 m |
| `hull_length_british` | 51.3334 | — | PRIMARY | §2 British survey of HMS Princess of Orange (ex-Washington), via Wikipedia; the Dutch figure is the one built to |
| `hull_length_bp` | 50.1711 | — | MEASURED | §7 the loft runs from the stem rabbet to the sternpost rabbet as traced on the sheer plan |
| `hull_length_lwl` | 50.4304 | — | MEASURED | §7 stem rabbet to sternpost rabbet at the load waterline |
| `hull_length_keel` | 42.0815 | — | PRIMARY | §2 British survey, keel for tonnage |
| `hull_beam_extreme` | 14.0716 | — | PRIMARY | §2 British survey, extreme breadth over the plank; 48 9/11 Amsterdam ft inside the plank on the draught, plus two thicknesses of plank, agrees within 5 cm |
| `hull_beam_moulded` | 13.8444 | — | MEASURED | §7 the dead flat on the body plan; the title block gives 48 9/11 Amsterdam ft = 13.82 m "wyt binnen de huid" |
| `hull_depth_in_hold` | 6.2289 | — | PRIMARY | §2 title block, "Hol in 't Ruim 22 Vt", rabbet of the keel to the top of the lower-deck beam at side |
| `hull_tons_burthen` | 1565.2 | — | PRIMARY | §2 British survey, 1,565 20/94 tons bm |
| `hull_draught_aft` | 5.8237 | — | MEASURED | §7 underside of the false keel to the load waterline, which is set 6 ft 6 in (Amsterdam) below the lower port sills amidships by the Dutch Admiralties' rule for their 74s (Ruijter, RCE). Drawn on an even keel |
| `hull_draught_fwd` | 5.8237 | — | MEASURED | §7 the keel is drawn level, and the rule fixes the waterline amidships only; even keel |
| `hull_displacement` | 2282.1 | — | MEASURED | §7 the offsets integrated to the load waterline, in sea water; t |
| `hull_tumblehome_deg` | 11 | — | MEASURED | §7 the dead flat tumbles home 4 ft from the main wale to the rail |

### Decks and bulwarks

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `deck_camber` | 0.1802 | 0 ft 7.1 in | RECONSTRUCTED | §7 the capstan drums stand on the decks at the centreline about 0.6 ft above the deck at side |
| `gundeck_above_wl_at_midships` | 1.426 | — | MEASURED | §7 the lower deck at side 2 ft 1 in below the lower port sills, plus the camber; the 22 ft depth of hold agrees within 0.3 ft |
| `weather_deck_above_wl_at_midships` | 3.5621 | — | MEASURED | §7 the upper deck at side 2 ft 1 in below the upper port sills, plus the camber. Ruijter's 6 7/11 ft between decks agrees |
| `deck_thickness` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §3 deck plank on its beam, as seen from the deck below |
| `between_decks` | 1.879 | — | SECONDARY | §7 Ruijter, the Dutch rule for 74s: "tussendeks 6 7/11 voet" |
| `quarterdeck_above_gundeck` | 2.16 | 7 ft 1 in | MEASURED | §7 quarterdeck (1 ft 9 in below its own port sills) over the upper deck, at the break |
| `forecastle_above_gundeck` | 1.98 | 6 ft 6 in | RECONSTRUCTED | §7 forecastle laid 1 ft below the waist rail, over the upper deck at the break |
| `forecastle_break_u` | 0.2475 | — | MEASURED | §7 the scroll that ends the forecastle rail on the sheer plan, 134 ft from the sternpost |
| `quarterdeck_break_u` | 0.5285 | — | MEASURED | §7 the scroll that ends the quarterdeck rail on the sheer plan, 84 ft 6 in from the sternpost, just forward of the mainmast |
| `forecastle_sheer_rise` | 0 | — | MEASURED | §7 the forecastle follows its own traced sheer |
| `quarterdeck_sheer_rise` | 0 | — | MEASURED | §7 the quarterdeck follows its own traced sheer |
| `bulwark_break_fairing` | 1.8288 | — | RECONSTRUCTED | §7 the planking runs fair from the waist rail up to the quarterdeck rail at the break |
| `bulwark_height_waist` | 2.2672 | — | MEASURED | §7 the waist rail over the upper deck amidships: the side is planked up to the gangways |
| `bulwark_height_quarterdeck` | 1.0038 | — | MEASURED | §7 the quarterdeck rail over the quarterdeck at the break; it rises aft with the rail's own sweep |
| `bulwark_height_forecastle` | 0.2831 | — | MEASURED | §7 the forecastle has a low planked side and an open rail on timberheads above it |
| `side_thickness` | 0.381 | 1 ft 3 in | RECONSTRUCTED | §3 the side of a 74 at the upper deck: plank, timber and inboard plank |
| `rail_cap_thickness` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §3 the capping over the top timbers |
| `gangway_width` | 1.524 | 5 ft 0 in | RECONSTRUCTED | §3 the gangways along a 74's waist, wide enough to work the guns and the braces |

### Backbone

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `keel_straight_length` | 45.8675 | 150 ft 5.8 in | MEASURED | §7 the keel runs straight from the sternpost to where the forefoot turns up, about 162 ft |
| `keel_siding` | 0.592 | 1 ft 11.3 in | MEASURED | §7 the keel 106 px across on the body plan, 2.1 ft |
| `keel_moulding` | 0.704 | 2 ft 3.7 in | MEASURED | §7 keel and false keel below the rabbet on the body plan, 2 ft 6 in |

### Gunports

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `gunport_count_per_side` | 14 | — | PRIMARY | §2 fourteen upper-deck ports a side counted on the sheer plan |
| `gunport_width` | 0.9634 | 3 ft 1.9 in | MEASURED | §7 mean of the fourteen upper-deck ports, 3 ft 5 in Amsterdam |
| `gunport_height` | 0.7801 | 2 ft 6.7 in | MEASURED | §7 mean of the fourteen upper-deck ports, 2 ft 9 in Amsterdam |
| `gunport_sill_above_deck` | 0.592 | 1 ft 11.3 in | RECONSTRUCTED | §7 see weather_deck_above_wl_at_midships |
| `gunport_spacing` | 3.3878 | 11 ft 1.4 in | MEASURED | §7 mean spacing of the upper battery, first port to last |
| `gunport_first_from_stem` | 7.3152 | 24 ft 0 in | RECONSTRUCTED | §4 foremost port clear of the round of the bow on ZAZ3067 |
| `lower_gunport_count_per_side` | 14 | — | PRIMARY | §2 fourteen lower-deck ports a side counted on the sheer plan |
| `lower_gunport_width` | 1.0564 | 3 ft 5.6 in | MEASURED | §7 mean of the fourteen lower-deck ports, 3 ft 9 in Amsterdam |
| `lower_gunport_height` | 0.8081 | 2 ft 7.8 in | MEASURED | §7 mean of the fourteen lower-deck ports, 2 ft 10 in Amsterdam |
| `lower_gunport_spacing` | 3.3663 | 11 ft 0.5 in | MEASURED | §7 mean spacing of the lower battery |
| `lower_port_sill_above_wl` | 1.8532 | 6 ft 1 in | SECONDARY | §7 the Dutch rule for 74s: the lower ports 6 1/2 ft above the water, laden; this is what sets the waterline |
| `gunport_lining_depth` | 0.381 | 1 ft 3 in | RECONSTRUCTED | §3 the side of a 74 at the ports: plank, timber and ceiling |
| `gunport_lid_overlap` | 0.05 | — | RECONSTRUCTED | §4 a port lid is larger than its opening and lands on a rabbet cut round it. It has to be here for a second reason as well: the opening is cut by dropping whole faces out of the loft grid, so its size is quantised to that grid and a lid cut exactly to the port leaves the lining showing along one edge |
| `gunport_lid_closed_proud` | 0.008 | — | RECONSTRUCTED | §4 a shut lid lies against the outside of the planking, not flush in the opening, so it stands its own hinge straps proud of the side |
| `gunport_lid_thickness` | 0.0762 | 0 ft 3 in | SECONDARY | §4 Steel, port-lid thickness |
| `qd_port_width` | 0.7112 | 2 ft 4 in | SECONDARY | §4 Steel, quarterdeck port |
| `qd_port_height` | 0.7112 | 2 ft 4 in | SECONDARY | §4 Steel, quarterdeck port |
| `qd_port_sill_above_deck` | 0.508 | 1 ft 8 in | SECONDARY | §4 Steel, quarterdeck port sill |
| `qd_port_count_per_side` | 6 | — | PRIMARY | §2 threedecks, 8 x 4-pdr and 4 x 12-pdr carronades on the quarterdeck |
| `fc_port_count_per_side` | 2 | — | PRIMARY | §2 threedecks, 2 x 4-pdr and 2 x 12-pdr carronades on the forecastle |
| `bridle_port_from_stem` | 1.55 | 5 ft 1 in | FICTIONAL | §1 the book; RECONSTRUCTED §3 between the hawse holes and the foremost lower port |
| `bridle_port_width` | 0.7839 | 2 ft 6.9 in | RECONSTRUCTED | §3 as the foremost lower-deck port, which is narrower than the rest |
| `bridle_port_height` | 0.8081 | 2 ft 7.8 in | RECONSTRUCTED | §3 as the lower-deck ports |
| `bridle_port_sill_rise` | 0.05 | — | RECONSTRUCTED | §3 the sill follows the lower tier's sheer as it sweeps up at the bow |
| `gunport_lid_board_count` | 4 | — | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_lid_seam_width` | 0.0016 | 0 ft 0.1 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_lid_edge_radius` | 0.0025 | — | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_lid_inner_fraction` | 0.35 | — | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_hinge_strap_width` | 0.045 | 0 ft 1.8 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_hinge_strap_thickness` | 0.006 | 0 ft 0.2 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_hinge_strap_length` | 0.56 | 1 ft 10 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_hinge_fixed_height` | 0.12 | 0 ft 4.7 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_hinge_barrel_diameter` | 0.03 | 0 ft 1.2 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_hinge_barrel_length` | 0.075 | 0 ft 3 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_hinge_bolt_diameter` | 0.02 | 0 ft 0.8 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_hinge_bolt_height` | 0.006 | 0 ft 0.2 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_hinge_spacing_fraction` | 0.6 | — | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_lift_ring_diameter` | 0.066 | 0 ft 2.6 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_lift_ring_iron` | 0.008 | — | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_lift_rope_diameter` | 0.014 | 0 ft 0.6 in | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_lift_entry_above_head` | 0.34 | — | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_lift_ring_from_bottom` | 0.12 | — | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |
| `gunport_lid_open_degrees` | 110 | — | RECONSTRUCTED | §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening |

### Wales

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `wale_projection` | 0.2317 | 0 ft 9.1 in | MEASURED | §7 the main wale's end stands 0.83 Amsterdam ft outside the dead flat on the body plan |
| `middle_wale_projection` | 0.2059 | — | MEASURED | §7 the middle wale's end on the body plan |

### Masts and their stations

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `fore_mast_z` | -17.7645 | — | MEASURED | §02 the lower-mast stump drawn in the sheer plan of NA 4.MST inv. 59, read by tools/draught/; Steel's rule (1/9 of the lower-deck length abaft the stem) agrees within a foot |
| `main_mast_z` | 4.8351 | — | MEASURED | §02 the lower-mast stump drawn in the sheer plan of NA 4.MST inv. 59, read by tools/draught/; Steel's rule (5/9) agrees within 1 1/2 ft |
| `mizzen_mast_z` | 19.194 | — | MEASURED | §02 the lower-mast stump drawn in the sheer plan of NA 4.MST inv. 59, read by tools/draught/; Steel's rule (17/20) puts it 3 ft further forward |
| `main_mast_length` | 32.3103 | 106 ft 0.1 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `main_mast_diameter` | 0.8975 | 2 ft 11.3 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); at the partners |
| `main_mast_head` | 4.4875 | — | RECONSTRUCTED | §4 Steel 1794 v1 p.42, masthead rule (5 in to the yard of the mast for the main and fore, 4 in for the mizzen and for the main and fore topmasts, 3 1/2 in for the mizzen topmast and the topgallants), applied to the §4 lengths |
| `fore_mast_length` | 28.6718 | 94 ft 0.8 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `fore_mast_diameter` | 0.7823 | 2 ft 6.8 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); at the partners |
| `fore_mast_head` | 3.9822 | — | RECONSTRUCTED | §4 Steel 1794 v1 p.42, masthead rule (5 in to the yard of the mast for the main and fore, 4 in for the mizzen and for the main and fore topmasts, 3 1/2 in for the mizzen topmast and the topgallants), applied to the §4 lengths |
| `mizzen_mast_length` | 27.653 | 90 ft 8.7 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `mizzen_mast_diameter` | 0.5397 | 1 ft 9.2 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); at the partners |
| `mizzen_mast_head` | 3.0726 | — | RECONSTRUCTED | §4 Steel 1794 v1 p.42, masthead rule (5 in to the yard of the mast for the main and fore, 4 in for the mizzen and for the main and fore topmasts, 3 1/2 in for the mizzen topmast and the topgallants), applied to the §4 lengths |
| `fore_mast_rake_deg` | 0.1989 | — | RECONSTRUCTED | §4 Steel, Naval Architecture, "Centres of Masts": 1/8 in of rake per yard of mast |
| `main_mast_rake_deg` | 1.5911 | — | RECONSTRUCTED | §4 Steel, "Centres of Masts": 1 in per yard of mast |
| `mizzen_mast_rake_deg` | 1.5911 | — | RECONSTRUCTED | §4 Steel, "Centres of Masts": 1 in per yard of mast |
| `mast_step_above_keel_top` | 0.3048 | — | RECONSTRUCTED | §4 the keelson sits about a foot above the top of the keel, on the floors |

### Topmasts, topgallants and poles

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `mizzen_topmast_backstay_deadeye_diameter` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: 9 in |
| `main_topmast_length` | 19.2115 | 63 ft 0.4 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `main_topmast_diameter` | 0.4669 | 1 ft 6.4 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); at the partners |
| `main_topmast_head` | 2.1346 | — | RECONSTRUCTED | §4 Steel 1794 v1 p.42, masthead rule (5 in to the yard of the mast for the main and fore, 4 in for the mizzen and for the main and fore topmasts, 3 1/2 in for the mizzen topmast and the topgallants), applied to the §4 lengths |
| `fore_topmast_length` | 17.0769 | 56 ft 0.3 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `fore_topmast_diameter` | 0.4669 | 1 ft 6.4 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); read as printed |
| `fore_topmast_head` | 1.8974 | — | RECONSTRUCTED | §4 Steel 1794 v1 p.42, masthead rule (5 in to the yard of the mast for the main and fore, 4 in for the mizzen and for the main and fore topmasts, 3 1/2 in for the mizzen topmast and the topgallants), applied to the §4 lengths |
| `mizzen_topmast_length` | 14.2631 | 46 ft 9.5 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `mizzen_topmast_diameter` | 0.3275 | 1 ft 0.9 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); at the partners |
| `mizzen_topmast_head` | 1.3867 | — | RECONSTRUCTED | §4 Steel 1794 v1 p.42, masthead rule (5 in to the yard of the mast for the main and fore, 4 in for the mizzen and for the main and fore topmasts, 3 1/2 in for the mizzen topmast and the topgallants), applied to the §4 lengths |
| `main_topgallant_length` | 9.6058 | 31 ft 6.2 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `main_topgallant_diameter` | 0.2729 | 0 ft 10.7 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); at the partners |
| `fore_topgallant_length` | 8.5385 | 28 ft 0.2 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `fore_topgallant_diameter` | 0.2244 | 0 ft 8.8 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); at the partners |
| `mizzen_topgallant_length` | 7.1316 | 23 ft 4.8 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `mizzen_topgallant_diameter` | 0.1971 | 0 ft 7.8 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); at the partners |
| `fore_topmast_shroud_pairs` | 5 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `main_topmast_shroud_pairs` | 5 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `mizzen_topmast_shroud_pairs` | 4 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `main_topmast_staysail_clew_below_cap` | 1.524 | — | RECONSTRUCTED | §4 the clew of the main topmast staysail comes down toward the main cap, not to the deck |

### Bowsprit, jibboom and dolphin striker

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `bowsprit_heel_above_deck` | 0.15 | 0 ft 5.9 in | RECONSTRUCTED | the rig sets the spar's centre 0.15 m above the deck at its heel (src/ship/rig.js) |
| `bowsprit_partner_thickness` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the partners under and over the spar at the bulkhead |
| `bowsprit_length` | 19.6482 | 64 ft 5.5 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `bowsprit_diameter` | 0.849 | 2 ft 9.4 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); at the partners |
| `bowsprit_steeve_deg` | 21.9 | — | RECONSTRUCTED | §4 Steel 1 ft 2 1/2 in of stive per yard of length; the 74 figure is not legible, so the frigate rule stands |
| `jibboom_length` | 14.6512 | 48 ft 0.8 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `jibboom_diameter` | 0.3517 | 1 ft 1.8 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); at the cap |
| `jibboom_housing_fraction` | 0.333 | — | RECONSTRUCTED | §4 jib boom housed on the bowsprit for about a third of its length |
| `bowsprit_heel_abaft_foremast` | -0.75 | — | RECONSTRUCTED | §4 the heel steps on the beam next before the foremast, so a little forward of it (negative is forward) |
| `dolphin_striker_length` | 3.5814 | 11 ft 9 in | RECONSTRUCTED | §4 about a quarter of the jib boom; not in Steel 1794 |
| `dolphin_striker_diameter` | 0.2183 | 0 ft 8.6 in | RECONSTRUCTED | §4 in proportion to its length |
| `dolphin_striker_rake_deg` | 12 | — | RECONSTRUCTED | §4 raked slightly forward so the martingale leads fair to the jib boom end |
| `gammoning_turns` | 8 | — | SECONDARY | §4 Steel lists the gammoning first on the standing-rigging plate; seven or eight turns is the period figure |
| `bowsprit_shroud_pairs` | 1 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |

### Yards and booms

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `topgallant_yard_below_hounds` | 0.3048 | — | SECONDARY | §4 Rijksmuseum Vrijheid model (NG-MC-500), seen in the museum's public-domain photographs: the yard is slung just under the shoulder of the pole |
| `main_yard_length` | 28.2351 | 92 ft 7.6 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `main_yard_diameter` | 0.5579 | 1 ft 10 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `main_topsail_yard_length` | 20.3759 | 66 ft 10.2 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `main_topsail_yard_diameter` | 0.3639 | 1 ft 2.3 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `main_topgallant_yard_length` | 13.5354 | 44 ft 4.9 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `main_topgallant_yard_diameter` | 0.2304 | 0 ft 9.1 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `fore_yard_length` | 24.7421 | 81 ft 2.1 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `fore_yard_diameter` | 0.4851 | 1 ft 7.1 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `fore_topsail_yard_length` | 18.0472 | 59 ft 2.5 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `fore_topsail_yard_diameter` | 0.3153 | 1 ft 0.4 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `fore_topgallant_yard_length` | 11.7889 | 38 ft 8.1 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `fore_topgallant_yard_diameter` | 0.2001 | 0 ft 7.9 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `crossjack_yard_length` | 18.0472 | 59 ft 2.5 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `crossjack_yard_diameter` | 0.3153 | 1 ft 0.4 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `mizzen_topsail_yard_length` | 13.6809 | 44 ft 10.6 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `mizzen_topsail_yard_diameter` | 0.2244 | 0 ft 8.8 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `mizzen_topgallant_yard_length` | 9.1691 | 30 ft 1 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `mizzen_topgallant_yard_diameter` | 0.1486 | 0 ft 5.8 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39); the fraction is smudged on the page |
| `spritsail_yard_length` | 18.0472 | 59 ft 2.5 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `spritsail_yard_diameter` | 0.3153 | 1 ft 0.4 in | RECONSTRUCTED | §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39) |
| `lower_yard_below_hounds` | 1.0668 | — | RECONSTRUCTED | §4 the course yard at full hoist is slung a little under the trestletrees, clear of the top's timbers |
| `topsail_yard_below_hounds` | 0.6096 | — | RECONSTRUCTED | §4 the topsail yard at full hoist is slung just under the crosstrees |
| `spanker_boom_length` | 14.0208 | 46 ft 0 in | RECONSTRUCTED | §4 from the mizzen to the taffrail, about 36 ft on her hull, and ten feet beyond it; in proportion to the crossjack yard |
| `spanker_boom_diameter` | 0.2668 | 0 ft 10.5 in | RECONSTRUCTED | §4 in proportion to the crossjack yard (13 in over 62 ft) by length |
| `spanker_gaff_length` | 12.192 | 40 ft 0 in | RECONSTRUCTED | §4 a little shorter than the boom |
| `spanker_gaff_diameter` | 0.2304 | 0 ft 9.1 in | RECONSTRUCTED | §4 in proportion to the crossjack yard by length |
| `spanker_gaff_peak_deg` | 38 | — | RECONSTRUCTED | §4 gaff peaked at about 38 degrees |

### Tops

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `main_top_breadth` | 6.4038 | 21 ft 0.1 in | RECONSTRUCTED | §4 Steel 1794 v1 p.37, one third the length of the topmast; the Vrijheid's tops are as broad |
| `fore_top_breadth` | 5.6924 | 18 ft 8.1 in | RECONSTRUCTED | §4 Steel 1794 v1 p.37, one third the length of the topmast |
| `mizzen_top_breadth` | 4.7544 | 15 ft 7.2 in | RECONSTRUCTED | §4 Steel 1794 v1 p.37, one third the length of the topmast |
| `top_platform_thickness` | 0.0606 | 0 ft 2.4 in | RECONSTRUCTED | §4 Steel 1794 v1 p.37, two-inch deals for a sixth rate, a little thicker for a 74 |

### Standing rigging

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `bobstay_hole_count` | 2 | — | SECONDARY | §6 Steel, two bobstay holes through the knee |
| `bobstay_hole_diameter` | 0.127 | 0 ft 5 in | SECONDARY | §6 Steel, bobstay holes |
| `fore_lower_shroud_pairs` | 8 | — | RECONSTRUCTED | §04 11.1 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant is not extracted yet: eight a side |
| `main_lower_shroud_pairs` | 9 | — | RECONSTRUCTED | §04 11.1 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant is not extracted yet: nine a side |
| `mizzen_lower_shroud_pairs` | 6 | — | RECONSTRUCTED | §04 11.1 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant is not extracted yet: six a side |
| `fore_channel_backstay_deadeyes` | 4 | — | RECONSTRUCTED | §04 11.1 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant is not extracted yet: two topmast and two topgallant standing backstays a side |
| `main_channel_backstay_deadeyes` | 4 | — | RECONSTRUCTED | §04 11.1 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant is not extracted yet: two topmast and two topgallant standing backstays a side |
| `mizzen_channel_backstay_deadeyes` | 2 | — | RECONSTRUCTED | §04 11.1 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant is not extracted yet: one mizzen topmast and one mizzen topgallant standing backstay a side |
| `shroud_deadeye_diameter` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: 14 in for the main and fore shrouds |
| `mizzen_shroud_deadeye_diameter` | 0.254 | 0 ft 10 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: 10 in for the mizzen |
| `topmast_backstay_deadeye_diameter` | 0.2794 | 0 ft 11 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: 11 in, the after end of the main and fore channels |
| `topgallant_backstay_deadeye_diameter` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: 9 in |
| `mizzen_topgallant_backstay_deadeye_diameter` | 0.1905 | 0 ft 7.5 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: 7 1/2 in |
| `shroud_deadeye_thickness` | 0.1905 | 0 ft 7.5 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: a deadeye is a little over half its diameter through |
| `fore_topgallant_shroud_pairs` | 3 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `main_topgallant_shroud_pairs` | 3 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `mizzen_topgallant_shroud_pairs` | 2 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `fore_futtock_shroud_pairs` | 5 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `main_futtock_shroud_pairs` | 5 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `mizzen_futtock_shroud_pairs` | 4 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `topmast_standing_backstay_pairs` | 2 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `topgallant_backstay_pairs` | 2 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet |
| `bobstay_pairs` | 2 | — | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet; cabled, set up with hearts |
| `ratline_spacing` | 0.3302 | 1 ft 1 in | SECONDARY | §4 Steel 1794 v1 pp.198-199, Progressive Method of Rigging Ships |
| `ratline_stiffener_spacing` | 1.524 | 5 ft 0 in | SECONDARY | §4 boat oars seized to the shrouds about five feet asunder for the men to stand on |
| `shroud_diameter` | 0.0687 | 0 ft 2.7 in | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet; 8 1/2 in lower shroud circumference, converted to diameter (the 28-gun warrant has 4 1/2 in) |
| `stay_diameter` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet; lower stay heavier than the shrouds |
| `running_rigging_diameter` | 0.0635 | 0 ft 2.5 in | RECONSTRUCTED | §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet; braces, lifts and sheets at model-visible size |

### Sails

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `sail_cloth_width` | 0.6096 | 2 ft 0 in | SECONDARY | §4 period flax canvas bolt width |
| `sail_roach` | 0.085 | — | RECONSTRUCTED | §4 the cut of the courses in the reference photographs |
| `sail_leech_curve` | 0.045 | — | RECONSTRUCTED | §4 a sail under strain is a curved surface |
| `sail_belly` | 0.115 | — | RECONSTRUCTED | §4 the draught of a full sail on a soldier's wind |
| `square_sails_set` | 8 | — | RECONSTRUCTED | §4 the full suit: two courses, three topsails and three topgallants; no royals |
| `furled_bundle_diameter` | 0.6858 | 2 ft 3 in | RECONSTRUCTED | §4 a course furled on a 74's yard makes a bundle about this thick |

### Channels, deadeyes and chainplates

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `fore_channel_deadeyes_per_side` | 12 | — | RECONSTRUCTED | §04 11.1 eight lower shrouds and four standing backstays |
| `main_channel_deadeyes_per_side` | 13 | — | RECONSTRUCTED | §04 11.1 nine lower shrouds and four standing backstays |
| `mizzen_channel_deadeyes_per_side` | 8 | — | RECONSTRUCTED | §04 11.1 six lower shrouds and two standing backstays |
| `fore_channel_length` | 7.9248 | 26 ft 0 in | RECONSTRUCTED | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74 |
| `main_channel_length` | 8.9916 | 29 ft 6 in | RECONSTRUCTED | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74 |
| `mizzen_channel_length` | 5.4864 | 18 ft 0 in | RECONSTRUCTED | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74; the built channel is cut short of this at the after end to clear the quarter gallery |
| `channel_projection` | 0.6604 | — | RECONSTRUCTED | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74: 2 ft 2 in clear of the ship's side |
| `channel_thickness_inner` | 0.1651 | — | RECONSTRUCTED | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74: thickness at the inner edge, main and fore |
| `channel_thickness_outer` | 0.1245 | — | RECONSTRUCTED | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74: thickness at the outer edge, main and fore |
| `mizzen_channel_thickness_inner` | 0.1499 | — | RECONSTRUCTED | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74: thickness at the inner edge, mizzen |
| `mizzen_channel_thickness_outer` | 0.1168 | — | RECONSTRUCTED | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74: thickness at the outer edge, mizzen |
| `channel_fore_end_before_mast` | 0.2286 | — | RECONSTRUCTED | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74: foremost end of the main and fore channels forward of the mast centre |
| `mizzen_channel_fore_end_before_mast` | 0.2032 | — | RECONSTRUCTED | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74: foremost end of the mizzen channel forward of the mast centre |
| `channel_above_middle_wale` | 0 | — | RECONSTRUCTED | §06 10 the channel is bolted along the top of the middle wale, at the upper deck |
| `mizzen_channel_above_middle_wale` | 0.1016 | — | RECONSTRUCTED | §06 10 Steel carries the mizzen channel a foot above the range of the main; four inches of it taken against the traced wale |
| `channel_top_below_rail` | 2.21 | — | MEASURED | §07 the fore channel lies on the middle wale, 2.21 m under the forecastle rail at the foremast |
| `channel_inboard_inset` | 0.0508 | — | RECONSTRUCTED | §06 10 the inner edge is let into the ship's side, not butted against the planking |
| `mizzen_channel_aft_clearance` | 2.7432 | — | RECONSTRUCTED | §06 10 the after end of the mizzen channel kept clear of the quarter badge |
| `channel_aft_clearance` | 0.6096 | — | RECONSTRUCTED | §06 10 the after end of a channel is kept off the run of the counter so that it lands on the side proper |
| `channel_deadeye_end_margin` | 0.2794 | — | RECONSTRUCTED | §06 10 the outer deadeyes are set in from the ends so the channel is not split at the butt |
| `fore_channel_taper_fraction` | 0.24 | — | RECONSTRUCTED | §06 10 Steel says the fore channel tapers at its after end to stow the anchor but does not give the length of the taper |
| `fore_channel_taper_projection` | 0.3048 | — | RECONSTRUCTED | §06 10 projection left at the after end of the fore channel taper |
| `channel_rail_height` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §06 10 the low rail on the outer edge, scored down for every deadeye strop |
| `channel_rail_width` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §06 10 sided as deep as it is high, ordinary practice for a chain rail |
| `channel_rail_notch_clearance` | 0.0635 | — | RECONSTRUCTED | §06 10 the score is cut a little wider than the strop it takes |
| `mizzen_deadeye_thickness` | 0.1397 | 0 ft 5.5 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74 |
| `deadeye_hole_diameter` | 0.0457 | 0 ft 1.8 in | RECONSTRUCTED | §06 10 the three holes take the lanyard doubled; taken as a seventh of the deadeye |
| `deadeye_hole_circle_fraction` | 0.42 | — | RECONSTRUCTED | §06 10 the three holes stand on a circle of about two fifths of the diameter |
| `deadeye_bottom_above_channel` | 0.0889 | — | RECONSTRUCTED | §06 10 the strop sits down in the score, so the body of the deadeye stands just clear of the channel |
| `deadeye_strop_iron` | 0.0381 | — | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: the deadeye binding, 1 1/2 in for the main and fore |
| `mizzen_deadeye_strop_iron` | 0.033 | — | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: the deadeye binding, 1 1/3 in for the mizzen |
| `chainplate_width` | 0.0813 | 0 ft 3.2 in | RECONSTRUCTED | §06 10 a plate of 1 1/2 in iron is sided about 3 in |
| `chainplate_thickness` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: chain iron 1 1/2 in, main and fore |
| `mizzen_chainplate_thickness` | 0.033 | 0 ft 1.3 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74: chain iron 1 1/3 in, mizzen |
| `chain_bolt_below_channel` | 0.6858 | — | RECONSTRUCTED | §06 10 the chain bolt is driven through the middle wale, 2 ft 3 in under the top of the channel, and so clears the heads of the lower ports |
| `mizzen_chain_bolt_below_channel` | 0.6858 | — | RECONSTRUCTED | §06 10 as the main |
| `chain_bolt_diameter` | 0.0508 | 0 ft 2 in | RECONSTRUCTED | §06 10 chain bolt 2 in |
| `chainplate_standoff` | 0.0127 | — | RECONSTRUCTED | §06 10 the plate lies on the planking; half an inch keeps the iron clear of the hull surface |
| `fore_channel_supporters` | 5 | — | RECONSTRUCTED | §06 10 Steel gives four under the frigate's fore channel; one more for the 74's longer one |
| `main_channel_supporters` | 6 | — | RECONSTRUCTED | §06 10 Steel gives five under the frigate's main channel; one more for the 74's |
| `mizzen_channel_supporters` | 3 | — | RECONSTRUCTED | §06 10 Steel gives two under the frigate's mizzen channel; one more for the 74's |
| `supporter_width` | 0.0889 | 0 ft 3.5 in | RECONSTRUCTED | §06 10 the T-plate broad 3 1/2 in |
| `supporter_thickness` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §06 10 thick 1 1/2 in at the shoulder |
| `supporter_drop` | 0.6858 | — | RECONSTRUCTED | §06 10 the T-plate reaches down the wale, no further than the chain bolt |

### Stern, galleries and rudder

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `stern_deadlight_thickness` | 0.038 | 0 ft 1.5 in | RECONSTRUCTED | §12 an inch and a half of oak. Deadlights are shipped over the stern windows in heavy weather because glass at the stern in a following sea is the next thing to go after the ports |
| `stern_deadlight_proud` | 0.012 | — | RECONSTRUCTED | §12 the shutter beds against the outside of the sash frame, so it stands this much off the face of it |
| `stern_tuck_below_wale` | 0.2831 | — | RECONSTRUCTED | §2 the round tuck, where the counter leaves the sternpost, sits a foot under the main wale at the post (draught, stern elevation) |
| `stern_tuck_overhang` | 1.0038 | — | RECONSTRUCTED | §6 the underside of the counter reaches this far abaft the post at the tuck; least that carries the counter over the rudder head |
| `stern_tuck_flare_height` | 0.8237 | 2 ft 8.4 in | RECONSTRUCTED | §2 height over which the quarter swings from the narrow tuck out to the full side; the round of the tuck |
| `stern_overhang_mid_counter` | 1.4157 | — | RECONSTRUCTED | §6 the hollow counter, 1797 model: half way up it stands 5 ft abaft the post |
| `stern_overhang_counter_top` | 2.4195 | — | RECONSTRUCTED | §6 the foot of the lights stands 8 ft 6 in abaft the post, between the 7.7 ft counter overhang and the 10.5 ft taffrail overhang the research notes give for a 74 |
| `stern_overhang_walk` | 3.1145 | — | RECONSTRUCTED | §6 the edge of the stern walk, over the lights, 11 ft abaft the post: the taffrail overhang of the 1797 model |
| `stern_overhang_taffrail_extra` | 0.2059 | — | RECONSTRUCTED | §6 the taffrail beam stands a little proud of the walk edge |
| `stern_counter_top_below_sill` | 0.2059 | — | RECONSTRUCTED | §6 the lower counter rail, under the sills of the lights |
| `stern_half_breadth_tuck` | 1.6988 | — | RECONSTRUCTED | §2 the counter at the tuck, a narrow round-bottomed bowl |
| `stern_half_breadth_mid_counter` | 2.9858 | — | RECONSTRUCTED | §2 the counter half way up |
| `stern_half_breadth_counter_top` | 3.9639 | — | RECONSTRUCTED | §2 the stern at the lights, 28 Amsterdam ft across, 0.57 of the moulded breadth, read off the stern elevation on the draught |
| `stern_half_breadth_walk` | 3.9639 | — | RECONSTRUCTED | §2 the stern at the walk edge; the stern tumbles home very little above the lights |
| `stern_half_breadth_taffrail` | 3.6807 | — | RECONSTRUCTED | §2 the taffrail, tumbled home a little from the walk edge |
| `stern_transom_breadth_wing` | 8.0307 | — | RECONSTRUCTED | §2 the widest of the counter rails, across the wing transom: twice the half-breadth at the lights and the rail proud of the planking each side |
| `stern_round_aft_lower` | 0.103 | — | RECONSTRUCTED | §2 round-aft of the lower counter, least at the bottom |
| `stern_round_aft_upper` | 0.5663 | — | RECONSTRUCTED | §2 round-aft of the taffrail: the middle of a rail stands further aft than its ends, increasing upward |
| `stern_round_up_taffrail` | 0.2831 | — | RECONSTRUCTED | §2 round-up of the taffrail: the ends of the rail drop below its middle |
| `stern_quarter_run` | 1.4157 | — | RECONSTRUCTED | §6 the closure lands on the hull 5 ft forward of the post, which is just abaft the last upper-deck port on the traced sheer plan |
| `stern_corner_radius` | 0.4376 | — | RECONSTRUCTED | §2 the corner of the stern in plan is rounded, not square: the 1797 model |
| `stern_counter_rail_depth` | 0.1287 | — | RECONSTRUCTED | §2 a counter rail, scantling taken from the wales of the same ship |
| `stern_counter_rail_proud` | 0.0772 | — | RECONSTRUCTED | §2 a counter rail stands proud of the planking by about its own thickness |
| `stern_taffrail_above_rail` | 0.2059 | — | RECONSTRUCTED | §2 the taffrail cap stands over the quarterdeck rail line at the post |
| `stern_taffrail_above_wl` | 8.4683 | 27 ft 9.4 in | RECONSTRUCTED | §2 the taffrail at the quarterdeck rail height aft (29 ft 2 in above the waterline, the traced rail at the post) and its cap of 8 in. The carved crest stands above it |
| `taffrail_cap_width` | 0.2831 | 0 ft 11.1 in | RECONSTRUCTED | §2 the taffrail cap, as broad as the rail of the quarterdeck bulwark |
| `taffrail_cap_thickness` | 0.1287 | 0 ft 5.1 in | RECONSTRUCTED | §2 the cap over the taffrail beam |
| `stern_taffrail_frieze_depth` | 0.2317 | 0 ft 9.1 in | RECONSTRUCTED | §6 the carved board under the cap, closing the top of the open walk |
| `stern_light_count` | 8 | — | PRIMARY | §2 the Washington draught: the lower tier is four lights each side of the centreline, so eight across; the 1797 model agrees |
| `stern_panes_wide` | 3 | — | PRIMARY | §2 the draught: each light three panes wide |
| `stern_panes_high` | 4 | — | PRIMARY | §2 the draught: each light four panes deep |
| `stern_light_height` | 1.287 | 4 ft 2.7 in | RECONSTRUCTED | §2 the most a light can stand: the cabin is only two metres high, so the head is governed by the quarterdeck over it |
| `stern_light_sill_above_deck` | 0.5663 | 1 ft 10.3 in | RECONSTRUCTED | §2 sill of a great-cabin light above the upper deck at side |
| `stern_cabin_ceiling_below_quarterdeck` | 0.2317 | — | RECONSTRUCTED | §3 the quarterdeck planking and its beams over the great cabin |
| `stern_light_munion` | 0.2831 | — | RECONSTRUCTED | §2 the carved pilaster between two lights |
| `stern_quarter_piece_width` | 0.2831 | 0 ft 11.1 in | RECONSTRUCTED | §2 the quarter piece bounding the screen of lights each side |
| `stern_light_frame_depth` | 0.103 | 0 ft 4.1 in | RECONSTRUCTED | §5 the sash frame stands proud of the transom planking |
| `stern_glazing_rebate` | 0.0381 | — | RECONSTRUCTED | §5 the rebate a crown-glass pane is bedded in, from contemporary sash practice |
| `stern_glazing_bar` | 0.0254 | — | SECONDARY | §5 wooden glazing bars about 1 in, following contemporary sash practice |
| `stern_chase_port_width` | 0.9266 | 3 ft 0.5 in | SECONDARY | §6 the two stern-chase ports of the 1797 model: a little narrower than a lower-deck broadside port |
| `stern_chase_port_height` | 0.8237 | 2 ft 8.4 in | MEASURED | §7 the mean lower-deck port, 2 ft 10 in |
| `stern_chase_port_offset` | 1.287 | — | RECONSTRUCTED | §6 each port stands this far off the centreline, clear of the rudder head and the central device |
| `stern_chase_lid_thickness` | 0.0515 | 0 ft 2 in | RECONSTRUCTED | §6 a port lid of two-inch plank, hinged at the head |
| `stern_chase_lid_open_degrees` | 100 | — | RECONSTRUCTED | §6 a lid triced up under the counter rail when the port is open |
| `stern_walk_depth` | 1.2098 | 3 ft 11.6 in | RECONSTRUCTED | §6 the open stern walk, 1797 model: the wall of the cabin front stands this far forward of the balustrade |
| `stern_walk_wall_thickness` | 0.1287 | 0 ft 5.1 in | RECONSTRUCTED | §6 the panelled wall at the back of the walk |
| `stern_walk_floor_thickness` | 0.0772 | 0 ft 3 in | RECONSTRUCTED | §6 planking of the walk, standing proud of the deck edge |
| `stern_balustrade_height` | 0.7722 | 2 ft 6.4 in | RECONSTRUCTED | §6 the carved balustrade round the walk, 1797 model |
| `stern_baluster_pitch` | 0.2317 | — | RECONSTRUCTED | §6 spacing of the turned balusters |
| `stern_baluster_radius` | 0.0412 | — | RECONSTRUCTED | §6 the swell of a turned baluster |
| `stern_balustrade_rail_depth` | 0.1287 | 0 ft 5.1 in | RECONSTRUCTED | §6 the top and bottom rails of the balustrade |
| `stern_walk_opening_count` | 7 | — | SECONDARY | §6 the wall behind the walk, 1797 model: a door in the middle with a window and then an arched light each side, three openings a side |
| `stern_walk_door_width` | 0.9009 | 2 ft 11.5 in | RECONSTRUCTED | §6 the door to the walk |
| `stern_walk_window_width` | 0.6435 | 2 ft 1.3 in | RECONSTRUCTED | §6 a window of the walk wall |
| `stern_walk_window_sill` | 0.4376 | 1 ft 5.2 in | RECONSTRUCTED | §6 the sill of a walk window above the walk floor |
| `stern_walk_head_below_frieze` | 0.1287 | — | RECONSTRUCTED | §6 the heads of the door and the windows stop short of the frieze |
| `stern_crest_width` | 2.2651 | 7 ft 5.2 in | RECONSTRUCTED | §6 the central device of the taffrail, with its seated warrior, trophies of arms, cannon and lion: 1797 model |
| `stern_crest_height` | 1.4157 | 4 ft 7.7 in | RECONSTRUCTED | §6 the crest stands well proud of the cap: a tall carved taffrail |
| `stern_figure_height` | 1.287 | 4 ft 2.7 in | RECONSTRUCTED | §6 the carved giant at each corner of the taffrail, a Hercules with his club, 1797 model |
| `stern_figure_pedestal` | 0.4376 | — | RECONSTRUCTED | §6 the carved pedestal under a corner figure |
| `stern_crest_carving_inboard` | 0.2831 | — | RECONSTRUCTED | §6 the back of the photographed crest stands this far inboard of the stern's face at the taffrail, so that its relief stands about flush with it |
| `stern_trophy_height` | 0.8494 | 2 ft 9.4 in | RECONSTRUCTED | §6 a trophy of arms: pikes, a cannon, a shield and a drum |
| `quarter_gallery_length` | 2.8313 | 9 ft 3.5 in | RECONSTRUCTED | §2 length of the lower rim of the quarter gallery, the 1797 model and the stern elevation |
| `quarter_gallery_projection` | 0.7207 | — | RECONSTRUCTED | §2 how far a gallery stands off the quarter at its after end |
| `quarter_gallery_aft_margin` | 0.2831 | — | RECONSTRUCTED | §2 the gallery starts this far forward of the corner of the stern, clear of the pier |
| `quarter_gallery_light_count` | 3 | — | PRIMARY | §2 each tier of the quarter gallery has three lights; the draught and the 1797 model agree |
| `quarter_gallery_tier_count` | 2 | — | PRIMARY | §2 two tiers: one in line with the stern lights, one at the level of the walk |
| `quarter_gallery_upper_sill_above_walk` | 0.2317 | — | RECONSTRUCTED | §2 the sill of the upper tier over the walk floor |
| `quarter_gallery_upper_height` | 1.0038 | 3 ft 3.5 in | RECONSTRUCTED | §2 the upper tier is as deep as the walk wall allows, up under the rail |
| `quarter_gallery_frieze_depth` | 0.3861 | 1 ft 3.2 in | RECONSTRUCTED | §2 the carved scroll frieze between the two tiers |
| `quarter_gallery_crest_height` | 0.489 | 1 ft 7.3 in | RECONSTRUCTED | §2 the acanthus crest over the upper tier |
| `quarter_gallery_pendant_drop` | 0.7207 | — | RECONSTRUCTED | §2 the carved pendant that hangs from the after end below the lower tier |
| `quarter_gallery_frame_proud` | 0.0386 | — | RECONSTRUCTED | §2 the sash frame of a gallery light stands proud of the gallery planking |
| `quarter_gallery_pilaster` | 0.1544 | — | RECONSTRUCTED | §2 the carved post between two lights of a gallery |
| `stern_carving_bevel` | 0.42 | — | RECONSTRUCTED | §6 the ground cut away round a piece of carved work; about two fifths of its half-width taken by the chamfer, leaving a field in the middle |
| `stern_carving_panel_corner` | 3 | — | RECONSTRUCTED | §6 a carved panel is worked square with the corners rounded off, not drawn as a lens |
| `stern_carving_relief` | 0.0772 | — | RECONSTRUCTED | §6 the depth of a carved boss on the counter and the frieze |
| `stern_counter_device_width` | 1.5701 | — | RECONSTRUCTED | §6 the carved device on the counter between the two chase ports |
| `stern_counter_device_height` | 0.489 | — | RECONSTRUCTED | §6 proportion of the counter device to its width |
| `stern_scroll_relief` | 0.0772 | — | RECONSTRUCTED | §6 scrollwork of the frieze, cut shallower than the device and dying away toward the quarters |
| `stern_term_piece_width` | 0.3346 | 1 ft 1.2 in | RECONSTRUCTED | §6 the carved pier under each corner figure |
| `rudder_breadth_at_heel` | 1.2355 | — | RECONSTRUCTED | §6 blade breadth at the heel, about a fifth of the draught |
| `rudder_breadth_at_head` | 0.5663 | — | RECONSTRUCTED | §6 the main piece at the head, narrower than at the heel |
| `rudder_thickness` | 0.2831 | 0 ft 11.1 in | RECONSTRUCTED | §6 the main piece moulded, a little more than the post is sided |
| `rudder_head_below_tuck` | 0.0257 | — | RECONSTRUCTED | §6 the blade ends under the counter, and the head goes up through the tuck to the tiller on the lower deck |
| `rudder_height` | 7.9535 | 26 ft 1.1 in | RECONSTRUCTED | §6 heel at the underside of the false keel, 5.82 m below the waterline, to the head just under the tuck, 2.1 m above it: about 28 Amsterdam ft for a 74 |
| `rudder_post_rake_deg` | 1.86 | — | MEASURED | §7 sternpost rabbet traced on the sheer plan: 0.26 m of rake over 7.9 m of height |
| `rudder_pintle_count` | 5 | — | RECONSTRUCTED | §6 five pairs of pintles and gudgeons on a rudder of this depth |
| `rudder_iron_width` | 0.1287 | 0 ft 5.1 in | RECONSTRUCTED | §6 the straps of the pintles and gudgeons |
| `rudder_iron_thickness` | 0.0515 | 0 ft 2 in | RECONSTRUCTED | §6 wrought-iron strap thickness |
| `tiller_length` | 3.1145 | 10 ft 2.6 in | RECONSTRUCTED | §6 the tiller on the lower deck, long enough to reach the tiller ropes abaft the mizzen |
| `tiller_diameter` | 0.1802 | 0 ft 7.1 in | RECONSTRUCTED | §6 tiller at the rudder head, tapering forward |
| `stern_chaser_count` | 2 | — | SECONDARY | §3 two stern chase ports in the counter, on the 1797 model of the Washington herself (RMG SLR0591) and on the Vrijheid model |
| `stern_chaser_pounds` | 24 | — | RECONSTRUCTED | §3 the counter ports are at upper-deck height, so the chasers are the upper tier's own 24-pounders |
| `stern_chaser_train_deg` | 5 | — | RECONSTRUCTED | §3 a stern chaser looks nearly dead aft through a port in the counter, a little outboard to clear the rudder head |
| `stern_chaser_muzzle_beyond_side` | 0.3048 | — | RECONSTRUCTED | §9.4 as the bow chasers, through the counter |
| `stern_chaser_fallback_half_breadth` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §3 the stern chase ports on the 1797 model flank the rudder head, about 3 ft 6 in off the centreline |
| `stern_chaser_fallback_abaft_post` | 1.6764 | — | RECONSTRUCTED | §6 the face of the counter at upper-deck height stands about 5 ft 6 in abaft the sternpost rabbet, where the counter overhangs |

### Head, beakhead and figurehead

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `head_trace_keel_noise` | 0.05 | — | RECONSTRUCTED | modelling allowance: the first 42 points of OFFSETS.stem.fore_edge lie on the underside of the keel, not on the stem; points within this much of the keel's bottom are dropped |
| `head_stem_siding` | 0.592 | 1 ft 11.3 in | MEASURED | §2 the Washington draught, NA 4.MST inv. 59, traced into OFFSETS.stem; sided as the keel, which is the siding the loft closes at its foremost station |
| `head_knee_projection` | 4.309 | — | MEASURED | §2 the Washington draught, NA 4.MST inv. 59, traced into OFFSETS.stem: the fore edge's top point stands 4.31 m forward of the loft's foremost station (-22.59 m); it is the fore-and-aft length of the built stem and knee |
| `head_bow_round_length` | 1.6002 | 5 ft 3 in | RECONSTRUCTED | §3 how far the round of the bow carries the hull's plan forward of its foremost station before the knee takes over; a Dutch bow is full, and the hawse holes (OFFSETS.hawse) stand on this round |
| `head_bow_plan_exponent` | 2.3 | — | RECONSTRUCTED | §3 the plan of the round of the bow, x^p + y^p = 1: 2 is an ellipse, higher is fuller; the loft's own end stations are a bluff round (docs/research/07-tracing.md) |
| `head_knee_siding` | 0.5148 | 1 ft 8.3 in | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the knee of the head sided a little less than the stem it springs from |
| `head_knee_overlap` | 0.508 | — | RECONSTRUCTED | modelling allowance: how far the foot of the knee is buried in the round of the bow |
| `head_knee_thickness_base` | 0.6858 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the knee's moulding where it leaves the bow |
| `head_knee_thickness_head` | 0.381 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; and at its head under the hair bracket |
| `head_cheek_thickness` | 0.1524 | 0 ft 6 in | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the cheeks bolted either side of the knee |
| `head_trailboard_inset` | 0.14 | — | SECONDARY | §6 Rijksmuseum NG-MC-500, the 74 Vrijheid, c.1782: the carved board runs down the knee between its edges, a seventh of the knee's thickness in from each |
| `head_trailboard_proud` | 0.0635 | — | SECONDARY | §6 Rijksmuseum NG-MC-500, the 74 Vrijheid, c.1782: the ochre trailboard stands a little proud of the black knee |
| `head_trophy_count` | 4 | — | SECONDARY | §6 Rijksmuseum NG-MC-500, the 74 Vrijheid, c.1782: trophies of arms in gilt on each trailboard, a drum, a shield and crossed pikes; four a side |
| `head_trophy_size` | 0.1778 | — | RECONSTRUCTED | §6 a trophy about a foot across on a board two feet deep |
| `head_hair_bracket_sided` | 0.254 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the gilt scroll that carries the knee into the lion's plinth |
| `head_hair_bracket_moulded` | 0.1778 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; as above |
| `head_platform_above_deck` | 0 | 0 ft 0 in | SECONDARY | §3 Rijksmuseum NG-MC-279, half model of a 74, c.1806 ("a beakhead bulkhead, a platform"): the platform of the head is laid at the level of the upper deck at the foot of the bulkhead, so the ship's people walk straight out onto it |
| `head_platform_thickness` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §3 the head platform's beams and planking |
| `head_platform_short_of_knee` | 0.3556 | — | RECONSTRUCTED | §3 the platform stops short of the head of the knee, where the lion's plinth begins |
| `head_grating_batten_square` | 0.0508 | — | SECONDARY | §6 Steel, grating battens about 2 in square |
| `head_grating_batten_gap` | 0.0508 | — | SECONDARY | §6 Steel, laid to leave about 2 in openings |
| `head_ledge_sided` | 0.0508 | — | SECONDARY | §6 Steel, ledges framing the flat of the head, 2 in broad |
| `head_ledge_moulded` | 0.0572 | — | SECONDARY | §6 Steel, 2 1/4 in deep |
| `head_ledge_spacing` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | §6 the cross-ledges of a head grating |
| `head_seat_count` | 2 | — | RECONSTRUCTED | §6 Steel says only "Seats of Ease, &c., as directed"; two open seats on the platform, one each side |
| `head_seat_forward_of_end` | 1.0668 | — | RECONSTRUCTED | §6 on the platform clear of the bulkhead and the knightheads |
| `head_seat_width` | 0.508 | 1 ft 8 in | RECONSTRUCTED | : a seat wide enough for one man |
| `head_seat_depth` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | : as above |
| `head_seat_height` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | : height above the grating |
| `head_seat_back_height` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | : the coaming behind the seat, to the rail |
| `head_rail_count` | 3 | — | PRIMARY | §2 the Washington draught shows three curved head rails; SECONDARY §6 Rijksmuseum NG-MC-500, the 74 Vrijheid, c.1782 shows three |
| `head_rail_sided` | 0.1778 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the head rails, sided |
| `head_rail_moulded` | 0.2286 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the head rails, moulded |
| `head_rail_off_hull` | 0.1016 | — | RECONSTRUCTED | §3 the rail stands this far off the planking where it follows the bow wing |
| `head_rail_end_half_breadth` | 0.2794 | 0 ft 11 in | RECONSTRUCTED | §3 half the plan breadth of a rail's fore end where it lands on the lion's back |
| `head_rail_plan_exponent` | 1.9 | — | SECONDARY | §6 Rijksmuseum NG-MC-500, the 74 Vrijheid, c.1782: the rails' plan, x^p + y^p = 1 from the end of the hull to the lion: a wide round head, as the model has it |
| `head_rail_profile_exponent` | 1.6 | — | SECONDARY | §6 Rijksmuseum NG-MC-500, the 74 Vrijheid, c.1782: the rails fall quickly off the bow and ease into the figure; the fraction of the fall made at a fraction w of the run is 1-(1-w)^p |
| `head_rail_lower_abaft_end` | 1.6002 | — | RECONSTRUCTED | §3 the lowest rail lands on the flank this far abaft the loft's foremost station, level with the platform |
| `head_rail_lower_aft_above_platform` | 0.254 | — | RECONSTRUCTED | §3 the lowest rail is the edge of the platform |
| `head_rail_lower_on_figure` | 0.4064 | — | RECONSTRUCTED | §3 height above the plinth at which the lowest rail meets the lion's haunch |
| `head_rail_middle_abaft_end` | 1.397 | — | RECONSTRUCTED | §3 |
| `head_rail_middle_aft_above_platform` | 1.2192 | — | RECONSTRUCTED | §3 the middle rail lands about a deck-beam's depth above the platform |
| `head_rail_middle_on_figure` | 0.9906 | — | RECONSTRUCTED | §3 meets the lion's flank |
| `head_rail_main_abaft_end` | 2.286 | — | RECONSTRUCTED | §3 the main rail lands at the cathead, where the forecastle rail is |
| `head_rail_main_aft_below_rail` | 0.127 | — | RECONSTRUCTED | §3 the main rail is the forecastle rail's own line carried forward |
| `head_rail_main_on_figure` | 1.6002 | — | RECONSTRUCTED | §3 meets the lion's back at the shoulder |
| `head_timber_count` | 3 | — | SECONDARY | §6 Rijksmuseum NG-MC-500, the 74 Vrijheid, c.1782: three head timbers a side between the rails |
| `head_timber_sided` | 0.1524 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found |
| `head_timber_moulded` | 0.127 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found |
| `beakhead_bulkhead_abaft_end` | 0.8 | — | SECONDARY | §3 Rijksmuseum NG-MC-279, half model of a 74, c.1806 ("a beakhead bulkhead, a platform"): the bulkhead stands where the forecastle deck ends, 0.8 m abaft the loft's foremost station (src/ship/decks.js starts the forecastle there) |
| `beakhead_bulkhead_above_rail` | 0.2032 | — | RECONSTRUCTED | §3 the rough-tree rail carried across over the bulkhead's head |
| `beakhead_bulkhead_proud` | 0.0508 | — | RECONSTRUCTED | modelling allowance: the bulkhead is a little wider than the hull's skin, which hides the raw edge of the loft |
| `beakhead_plank_thickness` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §3 the bulkhead planked and framed |
| `beakhead_cap_depth` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | §3 the rough-tree rail over the bulkhead |
| `beakhead_cap_overhang` | 0.1016 | — | RECONSTRUCTED | §3 |
| `beakhead_cornice_height` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §3 the moulding at the bulkhead's foot |
| `beakhead_cornice_depth` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §3 |
| `beakhead_stanchion_per_side` | 5 | — | SECONDARY | §6 Steel: five stanchions a side of the centreline in the beakhead bulkhead, making the round-houses, ports and doors between them |
| `beakhead_stanchion_sided` | 0.2032 | — | RECONSTRUCTED | §6 a stanchion sided as a top timber |
| `beakhead_stanchion_proud` | 0.0762 | — | RECONSTRUCTED | §6 the carved pilaster stands proud of the planking |
| `beakhead_door_proud` | 0.0381 | — | RECONSTRUCTED | §6 a door or port lid lies on the planking |
| `head_door_width` | 0.6604 | 2 ft 2 in | SECONDARY | §6 Steel: the stanchion next inboard of the bow port makes the head door |
| `head_door_height` | 1.3716 | 4 ft 6 in | SECONDARY | §6 as above |
| `bow_chase_port_width` | 0.7112 | 2 ft 4 in | SECONDARY | §4 Steel, a forecastle port of the quarterdeck size; these are the light ports for the forecastle jagers, not the lower-deck bridle ports |
| `bow_chase_port_height` | 0.7112 | 2 ft 4 in | SECONDARY | §4 as above |
| `bow_chase_port_sill` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §6 sill above the platform |
| `head_wing_lining_inset` | 0.0508 | — | RECONSTRUCTED | modelling allowance: the inboard lining stands this far inside the skin |
| `head_wing_post_sided` | 0.254 | — | RECONSTRUCTED | §3 the timberhead that finishes the bow wing at its end |
| `head_wing_post_depth` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §3 |
| `head_wing_post_inset` | 0.0508 | — | RECONSTRUCTED | modelling allowance: the post is let into the skin |
| `knighthead_sided` | 0.381 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the knightheads, sided |
| `knighthead_clear` | 0.1016 | — | RECONSTRUCTED | §3 clearance between the spar and the knightheads |
| `knighthead_above_bowsprit` | 0.4572 | — | SECONDARY | §6 Steel: the knightheads run above the bowsprit to admit a chock between them |
| `cathead_abaft_end` | 1.45 | — | RECONSTRUCTED | §6 the cat beam is the foremost beam of the forecastle, a few feet abaft its fore edge; 0.65 m abaft the bulkhead |
| `cathead_inboard_of_side` | 1.2954 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the cathead's inboard length, bolted to the cat beam |
| `cathead_outboard_of_side` | 1.6002 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the overhang beyond the rail, where the anchor hangs |
| `cathead_above_rail` | 0 | — | RECONSTRUCTED | §6 the cathead's underside rests on the rail |
| `cathead_stive_deg` | 5 | — | RECONSTRUCTED | §6 a cathead is near level, rising a little outboard; Steel gives a stive but it is not legible for the 74 column |
| `cathead_spread` | 12.9 | — | RECONSTRUCTED | §6 twice the half-breadth of the hull at the rail at the cathead (4.85 m, from the traced offsets) plus the overhang; the athwartships span over the two outer ends |
| `cathead_sided` | 0.508 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; sided |
| `cathead_moulded` | 0.5588 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; moulded |
| `cathead_sheave_count` | 3 | — | SECONDARY | §6 Steel, three sheaves in the outer end of a cathead |
| `cathead_sheave_diameter` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found; the cat falls' sheaves |
| `cathead_sheave_spacing` | 0.381 | 1 ft 3 in | RECONSTRUCTED | §6 sheave centres in the cathead |
| `cathead_sheave_from_end` | 0.508 | — | RECONSTRUCTED | §6 the first sheave a little inboard of the tip |
| `cathead_supporter_drop` | 1.2192 | — | RECONSTRUCTED | §6 the cathead supporter lands on the ship's side this far below the rail |
| `cathead_supporter_reach` | 0.4572 | — | RECONSTRUCTED | §6 and meets the cathead this far in from its end |
| `cathead_supporter_sided` | 0.3048 | — | RECONSTRUCTED | §6 Steel (1805) scantlings for a 74, no Dutch figure found |
| `cathead_end_boss` | 0.508 | — | SECONDARY | §6 Rijksmuseum NG-MC-500, the 74 Vrijheid, c.1782: the catheads end in a carved boss, gilt |
| `figurehead_height` | 3.302 | 10 ft 10 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive; plinth to the top of the crown |
| `figurehead_lean_deg` | 36 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive; the lion leans forward from its plinth so that the body reads as leaping ahead |
| `figurehead_forward_of_knee_head` | 0.3556 | — | RECONSTRUCTED | §6 the plinth stands this far forward of the knee's top |
| `figurehead_above_knee_head` | 0.4572 | — | RECONSTRUCTED | §6 and this far above it, on the hair bracket |
| `figurehead_back_depth` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive; how far aft of the lion's centre line its back stands, where the rails meet it |
| `figurehead_plinth_width` | 1.0922 | 3 ft 7 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_plinth_depth` | 1.2954 | 4 ft 3 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_plinth_height` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_foot_height` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_foot_forward` | 0.1524 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_foot_length` | 0.5588 | 1 ft 10 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_hind_leg_radius` | 0.1778 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_hind_leg_spread` | 0.3048 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_haunch_height` | 1.143 | 3 ft 9 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_haunch_radius` | 0.3048 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_haunch_aft` | 0.2286 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_waist_height` | 1.4986 | 4 ft 11 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_waist_radius` | 0.254 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_torso_depth_ratio` | 0.9 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive; the trunk is a little shallower fore and aft than it is broad |
| `figurehead_mane_thickness` | 0.1651 | 0 ft 6.5 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_scale` | 1.15 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive; the whole carving is built at the sizes in these rows and scaled up, the figure of a 74 being about 12 ft |
| `figurehead_chest_height` | 2.0066 | 6 ft 7 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_chest_radius` | 0.4318 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_chest_forward` | 0.1016 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_neck_radius` | 0.3048 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_head_radius` | 0.3302 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_head_forward` | 0.3048 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_muzzle_length` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_mane_radius` | 0.6096 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_mane_tufts` | 12 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive; the fringe of the mane, in gilt |
| `figurehead_foreleg_radius` | 0.1524 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_foreleg_reach` | 0.8382 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_foreleg_spread` | 0.4064 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_paw_radius` | 0.1778 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_paw_spread` | 0.6858 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_paw_rise` | 0.1524 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_sword_length` | 1.524 | 5 ft 0 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive; the sword in the right paw |
| `figurehead_sword_width` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_arrow_count` | 7 | — | SECONDARY | §6 the Dutch lion holds a sheaf of seven arrows, one for each of the seven United Provinces |
| `figurehead_arrow_length` | 0.9906 | 3 ft 3 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_arrow_radius` | 0.0254 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_arrow_head` | 0.127 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_arrow_bundle_radius` | 0.0762 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_tail_radius` | 0.0762 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_tail_out` | 0.8382 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_tail_rise` | 0.381 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_crown_height` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_crown_radius` | 0.254 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_crown_points` | 5 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive |
| `figurehead_crown_sits_in_head` | 0.8 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive; the crown's band sits this fraction of the head's radius above its centre |
| `figurehead_carving_height` | 2.8956 | 9 ft 6 in | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive; the photographed carving, hind paws to the top of the crown as carved |
| `figurehead_carving_pitch_deg` | 4 | — | RECONSTRUCTED | §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74's head; no dimensions survive; the photographed lion is raised this far on its hind paws, so that it rises off the knee of the head |
| `bow_chaser_count` | 2 | — | FICTIONAL | §1 the book: chasers "trained sharp forward from the bridle-ports in her bluff bows", one a side (ch. 7) |
| `bow_chaser_pounds` | 32 | — | FICTIONAL | §1 the bridle ports are on the lower deck, so the chasers are the lower tier's own 32-pounders |
| `bow_chaser_train_deg` | 8 | — | FICTIONAL | §1 the book: "trained sharp forward"; limited by the after cheek of the bridle port in a side that is 50 degrees off the keel line there. Van Zwijndregt's 1784 bow port would have been dead ahead |
| `bow_chaser_muzzle_beyond_side` | 0.3048 | — | RECONSTRUCTED | §9.4 a chaser run out has her muzzle a foot outside the planking at the port, which keeps the blast clear of the lining |

### Deck furniture

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `furniture_foremast_z` | -17.7645 | — | MEASURED | §7 the foremast centre on the sheer plan of NA 4.MST inv. 59 |
| `furniture_mainmast_z` | 4.8351 | — | MEASURED | §7 the mainmast centre on the sheer plan of NA 4.MST inv. 59 |
| `furniture_mizzenmast_z` | 19.194 | — | MEASURED | §7 the mizzenmast centre on the sheer plan of NA 4.MST inv. 59 |
| `furniture_capstan_z` | -4.4507 | — | MEASURED | §7 the double capstan in the waist, read off the sheer plan of NA 4.MST inv. 59 |
| `wheel_after_forward_of_mizzen` | 2.5908 | — | RECONSTRUCTED | §6 research 06 §2.2 the after wheel stands this far forward of the mizzen, leaving the helmsmen room abaft it and clear of the mast partners; the position forward of the mizzen is the brief's |
| `wheel_count` | 2 | — | RECONSTRUCTED | §6 research 06 §2.1 a ship of this rate steers with a double wheel, one at each end of the barrel |
| `wheel_diameter` | 1.6764 | 5 ft 6 in | RECONSTRUCTED | §6 research 06 §2.1 a little over the 5 ft 2 in of a frigate's wheel, Lavery, Arming and Fitting of English Ships of War |
| `wheel_swept_diameter` | 2.032 | 6 ft 8 in | RECONSTRUCTED | §6 research 06 §2.1 the rim plus a turned handle projecting 7 in at each end of a spoke |
| `wheel_axle_above_deck` | 1.1176 | 3 ft 8 in | RECONSTRUCTED | §6 research 06 §2.1 stanchion heads a little higher than a frigate's 3 ft 5 in, for the larger wheel |
| `wheel_barrel_length` | 1.3716 | 4 ft 6 in | RECONSTRUCTED | §6 research 06 §2.1 long enough for two wheels a man's width apart; a frigate's single wheel has a 2 ft 3 in barrel |
| `wheel_barrel_diameter_mid` | 0.4064 | — | SECONDARY | §6 Steel 1805 :39508, row S |
| `wheel_barrel_diameter_end` | 0.4572 | — | SECONDARY | §6 Steel 1805 :39507, row R, OCR-doubtful |
| `wheel_stanchion_broad` | 0.3048 | — | SECONDARY | §6 Steel 1805 :39504, row N |
| `wheel_stanchion_thick` | 0.127 | — | SECONDARY | §6 Steel 1805 :39505, row O |
| `wheel_spoke_count` | 10 | — | RECONSTRUCTED | §6 research 06 §2.1 Steel gives no spoke count; 8 or 10 is the period norm |
| `wheel_spoke_handle` | 0.1778 | — | RECONSTRUCTED | §6 research 06 §2.1 turned handle projecting beyond the rim |
| `wheel_rim_thickness` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §6 research 06 §2.1 the felloe of a wheel this size |
| `binnacle_count` | 2 | — | RECONSTRUCTED | §6 research 06 §2.3 a 74 carries a pair, one each side of the fore-and-aft line, ahead of the wheel |
| `binnacle_forward_of_wheel` | 1.2192 | — | RECONSTRUCTED | §6 research 06 §2.3 clear ahead of the forward wheel so a man can pass between |
| `binnacle_offset` | 0.762 | — | RECONSTRUCTED | §6 research 06 §2.3 each binnacle's centre off the centreline, clear of the wheel's own breadth |
| `binnacle_length` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §6 research 06 §2.3 three-compartment RN binnacle |
| `binnacle_depth` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | §6 research 06 §2.3 |
| `binnacle_height` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 research 06 §2.3 |
| `capstan_barrel_diameter` | 0.6858 | 2 ft 3 in | RECONSTRUCTED | §3 research 03 §3 scaled from the 32-gun frigate figure of Steel 1805 by about a quarter for a ship of 13.8 m beam |
| `capstan_barrel_above_deck` | 1.1684 | 3 ft 10 in | RECONSTRUCTED | §6 research 06 §3.2 the drumhead stands about 3 ft 10 in above the deck it works on, which is where a man's chest is |
| `capstan_drumhead_diameter` | 1.524 | 5 ft 0 in | RECONSTRUCTED | §3 research 03 §3 the 4 ft of Steel 1805 :38437 (row X) scaled by the ratio of the two ships' breadths |
| `capstan_drumhead_thickness` | 0.2858 | 0 ft 11.3 in | SECONDARY | §6 Steel 1805 :38438-38439, upper piece 5 3/4 in and lower piece 5 1/2 in |
| `capstan_bar_hole_count` | 12 | — | SECONDARY | §6 Steel 1805 :38565, bar-holes in the drumhead |
| `capstan_bar_hole_square` | 0.0984 | — | SECONDARY | §6 Steel 1805 :38566 |
| `capstan_bar_hole_depth` | 0.2984 | 0 ft 11.8 in | SECONDARY | §6 Steel 1805 :38567 |
| `capstan_whelp_count` | 8 | — | RECONSTRUCTED | §6 research 06 §3.2 eight whelps for the larger barrel; Steel's frigate has six |
| `capstan_whelp_length` | 0.9144 | 3 ft 0 in | SECONDARY | §6 Steel 1805 :38413 |
| `capstan_whelp_broad_heel` | 0.2731 | — | SECONDARY | §6 Steel 1805 :38417 |
| `capstan_whelp_broad_head` | 0.1905 | — | SECONDARY | §6 Steel 1805 :38418 |
| `capstan_partner_thickness` | 0.1524 | 0 ft 6 in | SECONDARY | §6 Steel 1805 :39379, capstan partners thick |
| `capstan_lower_drum_above_lower_deck` | 1.0668 | — | RECONSTRUCTED | §6 research 06 §3.2 the lower drumhead stands a little lower than the upper so that it clears the beams of the upper deck |
| `fore_hatch_abaft_forecastle_break` | 2.1336 | — | RECONSTRUCTED | §6 research 06 §4.1 Steel: the fore hatch's fore side ranges with the after end of the forecastle; its centre is a little abaft that |
| `fore_hatch_length` | 1.6764 | 5 ft 6 in | RECONSTRUCTED | §3 research 03 §3 scaled from the 32-gun frigate figure of Steel 1805 by about a quarter for a ship of 13.8 m beam |
| `fore_hatch_width` | 1.6764 | 5 ft 6 in | RECONSTRUCTED | §3 research 03 §3 scaled from the 32-gun frigate figure of Steel 1805 by about a quarter for a ship of 13.8 m beam |
| `ladderway_abaft_capstan` | 1.8288 | — | RECONSTRUCTED | §6 research 06 §4.1 Steel :17482, double ladderway immediately forward of the main hatch |
| `ladderway_length` | 0.8128 | 2 ft 8 in | SECONDARY | §6 Steel 1805 :39375, ladderway fore-and-aft |
| `ladderway_width` | 1.8288 | 6 ft 0 in | RECONSTRUCTED | §6 research 06 §4.1 a double ladderway takes two ladders abreast |
| `main_hatch_abaft_capstan` | 3.5052 | — | RECONSTRUCTED | §6 research 06 §4.1 the main hatch lies abaft the ladderway, clear of the capstan's bars |
| `main_hatch_length` | 2.5908 | 8 ft 6 in | RECONSTRUCTED | §3 research 03 §3 the 7 ft of Steel 1805 :33355 scaled for a 74; the audit holds the built grating to this |
| `main_hatch_width` | 1.6764 | 5 ft 6 in | RECONSTRUCTED | §3 research 03 §3 the 4 ft 6 in of Steel 1805 :33355 scaled for a 74; the audit holds the built grating to this |
| `coaming_height_above_deck` | 0.3302 | 1 ft 1 in | SECONDARY | §6 Steel, Form of a Contract :44581, coamings at least 13 inches |
| `coaming_broad` | 0.2286 | — | SECONDARY | §6 Steel 1805 :39445 |
| `grating_batten_square` | 0.0508 | — | SECONDARY | §6 Steel 1805 :1293, grating battens about 2 in square |
| `grating_batten_gap` | 0.0508 | — | SECONDARY | §6 Steel 1805 :2968, laid to leave about 2 in openings |
| `riding_bitt_forward_of_foremast` | 2.4384 | — | RECONSTRUCTED | §6 research 06 §5.1 the cable bitts stand ahead of the foremast, their heads through the forecastle deck |
| `riding_bitt_pin_square` | 0.3302 | — | RECONSTRUCTED | §6 research 06 §5.1 Steel's armed-brigantine contract 10 1/2 in scaled up for a 74 |
| `riding_bitt_pin_offset` | 1.0668 | — | RECONSTRUCTED | §6 research 06 §5.1 the pins must straddle the two cables |
| `riding_bitt_pin_height` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §6 research 06 §5.1 head standing clear above the cross-piece |
| `riding_bitt_crosspiece_broad` | 0.2032 | — | SECONDARY | §6 Steel 1805 :39442 |
| `riding_bitt_crosspiece_deep` | 0.1461 | — | SECONDARY | §6 Steel 1805 :39443 |
| `riding_bitt_crosspiece_above_deck` | 0.6604 | 2 ft 2 in | SECONDARY | §6 Steel 1805 :39444, upper side above the deck |
| `riding_bitt_crosspiece_projection` | 0.4572 | — | SECONDARY | §6 Steel 1805 :39445, ends project beyond the bitts |
| `jeer_bitt_pin_square` | 0.2286 | — | RECONSTRUCTED | §6 research 06 §5.2 lighter than a riding bitt |
| `jeer_bitt_pin_height` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §6 research 06 §5.2 standing clear above the cross-piece |
| `jeer_bitt_pin_offset` | 0.762 | — | RECONSTRUCTED | §6 research 06 §5.2 let into the sides of the beams |
| `jeer_bitt_crosspiece_above_deck` | 0.6604 | 2 ft 2 in | SECONDARY | §6 Steel 1805 :17543, one third of the height between upper deck and quarterdeck |
| `chain_pump_forward_of_mainmast` | 2.5908 | — | RECONSTRUCTED | §6 research 06 §6 immediately forward of the mainmast's partners, in the after end of the waist |
| `chain_pump_offset` | 0.762 | — | RECONSTRUCTED | §6 research 06 §6 clear of the mainmast partners |
| `chain_pump_trunk_square` | 0.3048 | — | RECONSTRUCTED | §6 research 06 §6 a 7 in chain in a 7 in trunk, cased |
| `chain_pump_head_above_deck` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 research 06 §6 head standing above the cistern to take the sprocket and the cranks |
| `pump_cistern_broad` | 0.6096 | — | SECONDARY | §6 Steel 1805 :35293, cistern broad out to out, OCR-doubtful |
| `pump_cistern_deep` | 0.6096 | — | SECONDARY | §6 Steel 1805 :35292, OCR-doubtful |
| `pump_cistern_projection` | 0.2032 | — | SECONDARY | §6 Steel 1805 :35294, ends project beyond the pump heads |
| `pump_winch_above_deck` | 0.8382 | 2 ft 9 in | RECONSTRUCTED | §6 research 06 §6 the iron crank spindle of the Cole-Bentinck pump |
| `pump_winch_diameter` | 0.0635 | 0 ft 2.5 in | RECONSTRUCTED | §6 research 06 §6 wrought-iron spindle and cranks |
| `pump_dale_width` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §6 research 06 §6 square wooden trough, 9 in by 7 in internal |
| `pump_dale_depth` | 0.1778 | 0 ft 7 in | RECONSTRUCTED | §6 research 06 §6 |
| `pump_dale_fall` | 0.0833 | — | RECONSTRUCTED | §6 research 06 §6 sloping about 1 in 12 outboard |
| `belfry_forward_of_forecastle_break` | 1.0668 | — | SECONDARY | §6 Steel 1805 :1372 and :17921, at the after beams of the forecastle, which is on the forecastle deck just forward of its break |
| `belfry_width` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §6 research 06 §7.1 scaled from Steel's 110-gun proportions, a little over the frigate's 3 ft |
| `belfry_depth` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §6 research 06 §7.1 |
| `belfry_height` | 1.524 | 5 ft 0 in | RECONSTRUCTED | §6 research 06 §7.1 |
| `belfry_stanchion_square` | 0.1016 | — | RECONSTRUCTED | §6 research 06 §7.1 |
| `bell_mouth_diameter` | 0.381 | 1 ft 3 in | RECONSTRUCTED | §6 research 06 §7.1 a ship of this rate's bell; no dimensioned source found |
| `bell_height` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | §6 research 06 §7.1 |
| `galley_chimney_forward_of_forecastle_break` | 3.9624 | — | RECONSTRUCTED | §6 research 06 §7.3 the funnel stands on the forecastle forward of the belfry, with the stove beneath it as Steel :17532 requires |
| `galley_chimney_coaming_square` | 0.6096 | — | RECONSTRUCTED | §6 research 06 §7.3 coaming square in the clear, a little larger for a ship with a company of 600 |
| `galley_chimney_coaming_height` | 0.2286 | 0 ft 9 in | SECONDARY | §6 Steel 1805 :39451, upper side standing above the deck |
| `galley_funnel_diameter` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | §6 research 06 §7.3 sheet-copper stack inside the coaming |
| `galley_funnel_height` | 1.3716 | 4 ft 6 in | RECONSTRUCTED | §6 research 06 §7.3 rising about 4 ft 6 in above the forecastle with a cowl |
| `steam_grating_offset` | 0.9144 | — | RECONSTRUCTED | §6 research 06 §7.3 one steam grating each side of the funnel |
| `steam_grating_length` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 research 06 §7.3 |
| `steam_grating_width` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §6 research 06 §7.3 |
| `skylight_abaft_mizzen` | 2.4384 | — | RECONSTRUCTED | §6 research 06 §4.4 the run of gratings over the great cabin, abaft the mizzen |
| `skylight_length` | 1.524 | 5 ft 0 in | RECONSTRUCTED | §6 research 06 §4.4 scaled for the larger cabin |
| `skylight_width` | 1.3716 | 4 ft 6 in | RECONSTRUCTED | §6 research 06 §4.4 |
| `skylight_height` | 0.508 | 1 ft 8 in | RECONSTRUCTED | §6 research 06 §4.4 a low glazed skylight with a pitched top |
| `companion_abaft_mizzen` | 5.4864 | — | RECONSTRUCTED | §6 research 06 §4.4 over the after ladderway to the cabin, abaft the skylight |
| `companion_length` | 1.2192 | 4 ft 0 in | RECONSTRUCTED | §6 research 06 §4.4 |
| `companion_width` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §6 research 06 §4.4 |
| `companion_above_deck` | 0.2286 | 0 ft 9 in | SECONDARY | §6 Steel 1805 :39451, the companion stands 9 in above the deck |
| `companion_hood_height` | 0.8128 | 2 ft 8 in | RECONSTRUCTED | §6 research 06 §4.4 sloping hood over the ladder head |
| `companion_framing_thick` | 0.1016 | — | SECONDARY | §6 Steel 1805 :39450, companion framing thick |
| `skid_beam_count` | 4 | — | RECONSTRUCTED | §6 research 06 §8.2 four beams carry the launch with the cutter nested in her |
| `skid_beam_first_abaft_forecastle_break` | 1.0668 | — | RECONSTRUCTED | §6 research 06 §8.2 the foremost beam stands just abaft the forecastle break, clear of the fore hatch's coaming |
| `skid_beam_spacing` | 3.81 | 12 ft 6 in | RECONSTRUCTED | §6 research 06 §8.2 four beams spanning 37 ft, a little more than the launch's length, and clear of the quarterdeck break |
| `skid_beam_sided` | 0.254 | — | RECONSTRUCTED | §6 research 06 §8.2 stouter than a frigate's, for boats of a 74's weight |
| `skid_beam_moulded` | 0.2032 | — | RECONSTRUCTED | §6 research 06 §8.2 |
| `skid_beam_top_below_gangway` | 0.1524 | — | RECONSTRUCTED | §6 research 06 §8.2 reconstructed from the frigate's reference photograph, in which the boats' keels stand level with the gangways |
| `skid_stanchion_square` | 0.1524 | — | RECONSTRUCTED | §6 research 06 §8.2 a stanchion under each end of each skid |
| `hammock_crane_spacing` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §6 counted off the frigate reference photograph, in which the cranes stand close — nearer 2 ft apart than the 2 ft 6 in to 3 ft usually quoted |
| `hammock_crane_height` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §6 standing about 2 ft above the cap rail |
| `hammock_crane_diameter` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §6 the crane is drawn bright rather than blacked, as in the reference photograph |
| `hammock_rail_diameter` | 0.0508 | 0 ft 2 in | RECONSTRUCTED | §6 the rail run through the heads of the cranes |
| `hammock_crane_spread` | 0.3556 | — | RECONSTRUCTED | §6 the fork at the head of the crane, which carries the netting outboard of the rail |
| `hammock_crane_forecastle_from_stem` | 4.2672 | 13 ft 12 in | RECONSTRUCTED | §6 the forecastle cranes begin where the rail leaves the head |
| `hammock_crane_run_short_of_stern` | 0.9144 | — | RECONSTRUCTED | §6 the after run stops short of the taffrail |
| `hammock_netting_rows` | 3 | — | RECONSTRUCTED | §6 from the reference photograph, three rows of netting between the cranes |
| `belaying_pin_spacing` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §6 from the reference photograph, pins about a foot apart along the rail |
| `belaying_pin_length` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §6 a turned pin of this length is the period norm |
| `belaying_pin_diameter` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §6 |
| `fife_rail_radius` | 1.2192 | — | RECONSTRUCTED | §6 a fife rail standing clear of the mast and its partners; a little wider than the frigate's for the thicker masts of a 74 |
| `fife_rail_height` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 a man belays at waist height |
| `fife_rail_timber` | 0.127 | — | RECONSTRUCTED | §6 rail and stanchion scantling |
| `ladder_width` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §6 one man wide |
| `ladder_run_fraction` | 0.62 | — | RECONSTRUCTED | §6 a ladder to the quarterdeck or forecastle is steep: its foot stands this fraction of the rise out from the break |
| `ladder_tread_spacing` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §6 period companion-ladder rise |
| `ladder_stringer_square` | 0.1016 | — | RECONSTRUCTED | §6 |
| `ladder_tread_thickness` | 0.0508 | 0 ft 2 in | RECONSTRUCTED | §6 |

### Armament

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `gun_tompion_depth` | 0.06 | 0 ft 2.4 in | RECONSTRUCTED | §9.4 the plug in the muzzle of a gun on an open deck, to keep the sea out of the bore. The gundeck battery needs none: her ports are shut over them |
| `gun_32pdr_count` | 28 | — | FICTIONAL | §1 the book: 32-pounders on the lower deck, 14 a side; agrees with SECONDARY §3 the Washington's British fit of 28 x 32-pdr |
| `gun_24pdr_count` | 28 | — | FICTIONAL | §1 the book: 24-pounders on the upper deck, 14 a side; the Washington in British hands carried 28 x 18-pdr there |
| `gun_12pdr_count` | 16 | — | SECONDARY | §3 Willem de Eerste (1785), 16 x 12-pdr on the quarterdeck and forecastle; 10 on the quarterdeck (5 ports a side, PRIMARY §2) and 6 on the forecastle (the split is not recorded) |
| `gun_forecastle_per_side` | 3 | — | RECONSTRUCTED | §3 the six forecastle pieces take the 16 less the 10 the quarterdeck ports hold, three a side between the timberheads |
| `gun_truck_carriage_count` | 76 | — | FICTIONAL | §1 one four-truck carriage under each of the 28 + 28 + 16 broadside long guns and under each of the 4 chasers |
| `gun_32pdr_barrel_length` | 2.8956 | 9 ft 6 in | SECONDARY | §3 Blomefield-pattern iron sea-service 32-pdr, 9 ft 6 in (Lavery, Arming and Fitting, tables of ordnance) |
| `gun_32pdr_bore` | 0.1626 | — | SECONDARY | §3 nominal bore of a 32-pounder: 6.1 in shot with the establishment windage of about 0.3 in |
| `gun_24pdr_barrel_length` | 2.7432 | 9 ft 0 in | SECONDARY | §3 Blomefield-pattern iron sea-service 24-pdr, 9 ft 0 in (Lavery, Arming and Fitting, tables of ordnance) |
| `gun_24pdr_bore` | 0.1473 | — | SECONDARY | §3 nominal bore of a 24-pounder: 5.55 in shot with windage |
| `gun_12pdr_barrel_length` | 2.5908 | 8 ft 6 in | SECONDARY | §3 iron sea-service long 12-pdr as carried on the open decks, 8 ft 6 in (Lavery, Arming and Fitting, tables of ordnance) |
| `gun_12pdr_bore` | 0.1168 | — | SECONDARY | §3 nominal bore of a 12-pounder: 4.4 in shot with windage |
| `gun_base_ring_radius_cal` | 1.52 | — | RECONSTRUCTED | §9.3 metal at the vent is one calibre thick all round on the 1753 pattern, plus the base ring |
| `gun_first_reinforce_radius_cal` | 1.38 | — | RECONSTRUCTED | §9.3 the first reinforce tapers about one twelfth of its diameter over its length |
| `gun_second_reinforce_radius_cal` | 1.22 | — | RECONSTRUCTED | §9.3 second reinforce, one step down from the first |
| `gun_chase_radius_cal` | 0.86 | — | RECONSTRUCTED | §9.3 the chase at the muzzle astragal, metal about a third of a calibre thick |
| `gun_muzzle_swell_radius_cal` | 1.02 | — | RECONSTRUCTED | §9.3 the swell of the muzzle stands proud of the chase by about a sixth of a calibre |
| `gun_ring_proud_cal` | 0.08 | — | RECONSTRUCTED | §9.3 how far a base ring, reinforce ring or astragal stands above the metal beside it |
| `gun_first_reinforce_end_u` | 0.29 | — | RECONSTRUCTED | §9.3 the first reinforce is two sevenths of the length from the base ring on the 1753 pattern |
| `gun_second_reinforce_end_u` | 0.5 | — | RECONSTRUCTED | §9.3 the second reinforce ends at half the length |
| `gun_muzzle_astragal_u` | 0.9 | — | RECONSTRUCTED | §9.3 the astragal and fillets that begin the swell of the muzzle |
| `gun_cascabel_length_cal` | 1.6 | — | RECONSTRUCTED | §9.3 button, neck and fillet abaft the base ring, about one and a half calibres |
| `gun_cascabel_button_radius_cal` | 0.46 | — | RECONSTRUCTED | §9.3 the pomiglion, which the breeching is seized round |
| `gun_cascabel_neck_radius_cal` | 0.28 | — | RECONSTRUCTED | §9.3 the neck between the button and the breech |
| `gun_trunnion_from_breech_u` | 0.41 | — | RECONSTRUCTED | §9.4 the trunnions are set at the point of balance, a little abaft three sevenths of the length from the base ring |
| `gun_trunnion_diameter_cal` | 1 | — | SECONDARY | §9.3 a trunnion is one calibre in diameter and one calibre long, which is the founders' rule |
| `gun_trunnion_length_cal` | 1 | — | SECONDARY | §9.3 as above |
| `gun_rimbase_radius_cal` | 0.66 | — | RECONSTRUCTED | §9.3 the rimbase where the trunnion leaves the gun, which keeps the piece from working fore and aft in the carriage |
| `gun_32pdr_axis_above_deck` | 0.9906 | 3 ft 3 in | MEASURED | §7 the middle of the lower ports, which stand 2 ft above the lower deck on the draught and are 2 ft 8 in deep (Falconer's rule, §9.4) |
| `gun_24pdr_axis_above_deck` | 0.9906 | 3 ft 3 in | MEASURED | §7 the middle of the upper ports, which stand 2 ft above the upper deck on the draught and are 2 ft 7 in deep (Falconer's rule, §9.4) |
| `gun_12pdr_axis_above_deck` | 0.8128 | 2 ft 8 in | MEASURED | §7 the middle of the quarterdeck ports, 1 ft 9 in sill and 2 ft 2 in depth over the deck (Falconer's rule, §9.4) |
| `gun_32pdr_carriage_length` | 1.4986 | 4 ft 11 in | RECONSTRUCTED | §9.4 Falconer's proportion of about 0.52 of the barrel length, on a 9 ft 6 in gun |
| `gun_32pdr_carriage_width` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §9.4 over the trucks; scaled with the bore from the 3 ft of a 9-pdr, and it must clear the 3 ft 9 in lower port with the side tackles |
| `gun_24pdr_carriage_length` | 1.4224 | 4 ft 8 in | RECONSTRUCTED | §9.4 the same proportion of 0.52, on a 9 ft 0 in gun |
| `gun_24pdr_carriage_width` | 0.9906 | 3 ft 3 in | RECONSTRUCTED | §9.4 over the trucks, scaled with the bore |
| `gun_12pdr_carriage_length` | 1.3462 | 4 ft 5 in | RECONSTRUCTED | §9.4 the same proportion of 0.52, on an 8 ft 6 in gun |
| `gun_12pdr_carriage_width` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §9.4 over the trucks, scaled with the bore |
| `gun_carriage_trunnion_from_fore` | 0.254 | — | RECONSTRUCTED | §9.4 the trunnion notch is cut ten inches abaft the fore end of the cheeks, over the fore axletree |
| `gun_carriage_cheek_thickness` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §9.4 bracket thickness; Falconer: "the breadth of the wheels is always equal to that of the cheeks" |
| `gun_carriage_cheek_mid_u` | 0.72 | — | RECONSTRUCTED | §9.4 the first step down in the top of the cheek, as a fraction of the height at the fore end |
| `gun_carriage_cheek_aft_u` | 0.46 | — | RECONSTRUCTED | §9.4 the second step down, at the after end where the bed and quoin go |
| `gun_carriage_step_mid_u` | 0.4 | — | RECONSTRUCTED | §9.4 where the first step falls, as a fraction of the carriage length from the fore end |
| `gun_carriage_step_aft_u` | 0.68 | — | RECONSTRUCTED | §9.4 where the second step falls |
| `gun_axletree_siding` | 0.1143 | 0 ft 4.5 in | RECONSTRUCTED | §9.4 the axletrees are square timbers a little stouter than the cheeks |
| `gun_32pdr_truck_fore_diameter` | 0.508 | 1 ft 8 in | SECONDARY | §9.4 scaled from the measured 24-pdr fore truck of 18 in (Ships of Scale, truck carriages of 1777) |
| `gun_32pdr_truck_rear_diameter` | 0.4064 | 1 ft 4 in | SECONDARY | §9.4 the rear truck is smaller than the fore, which helps check the recoil against the deck camber |
| `gun_24pdr_truck_fore_diameter` | 0.4572 | 1 ft 6 in | SECONDARY | §9.4 the measured 24-pdr fore truck of 18 in (Ships of Scale, truck carriages of 1777) |
| `gun_24pdr_truck_rear_diameter` | 0.381 | 1 ft 3 in | SECONDARY | §9.4 scaled with the fore truck |
| `gun_12pdr_truck_fore_diameter` | 0.381 | 1 ft 3 in | RECONSTRUCTED | §9.4 the same proportion on the lighter carriage |
| `gun_12pdr_truck_rear_diameter` | 0.3302 | 1 ft 1 in | RECONSTRUCTED | §9.4 as above |
| `gun_truck_thickness` | 0.1016 | 0 ft 4 in | SECONDARY | §9.4 Falconer: the breadth of the wheels equals that of the cheeks |
| `gun_stool_bed_length` | 0.4064 | 1 ft 4 in | SECONDARY | §9.4 Falconer names the bed, which carries the quoin under the breech |
| `gun_stool_bed_depth` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §9.4 thickness of the bed between the cheeks |
| `gun_quoin_length` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §9.4 the wedge that lies on the bed and holds the breech up |
| `gun_cap_square_thickness` | 0.0254 | 0 ft 1 in | RECONSTRUCTED | §9.4 the iron clamp over each trunnion, which Falconer calls the cap-square |
| `gun_transom_siding` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §9.4 the transom across the cheeks abaft the bed |
| `gun_32pdr_recoil` | 1.0668 | — | RECONSTRUCTED | §9.6 a carriage runs back until the breeching takes it, about three quarters of its own length for a heavy piece |
| `gun_24pdr_recoil` | 0.9906 | — | RECONSTRUCTED | §9.6 as above, for the 24-pdr |
| `gun_12pdr_recoil` | 0.8128 | — | RECONSTRUCTED | §9.6 as above, for the 12-pdr |
| `gun_32pdr_power` | 1.3 | — | RECONSTRUCTED | §9.6 relative loudness and flash for the game; the 9-pdr of the sister ship was 1.0 |
| `gun_24pdr_power` | 1.1 | — | RECONSTRUCTED | §9.6 as above |
| `gun_12pdr_power` | 0.8 | — | RECONSTRUCTED | §9.6 as above |
| `gun_breeching_diameter` | 0.0381 | 0 ft 1.5 in | SECONDARY | §9.6 breeching circumference is about 0.95 of the bore diameter; a heavy lower-deck gun takes a 4.5 in rope, which is 1.5 in in the round |
| `gun_breeching_sag` | 0.09 | — | RECONSTRUCTED | §9.6 the bight of the breeching hangs slack between the cascabel and the ship's side when the gun is run out |
| `gun_breeching_bolt_from_port` | 0.6858 | — | SECONDARY | §9.6 the two ring bolts in the ship's side, one each side of the port; Steel's contract gives 1.25 in bolts with 3.5 in rings |
| `gun_breeching_bolt_above_sill` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §9.6 the ring bolts stand a little above the level of the port sill |
| `gun_tackle_diameter` | 0.0229 | 0 ft 0.9 in | RECONSTRUCTED | §9.6 the gun and train tackle falls are lighter than the breeching |
| `gun_tackle_sag` | 0.05 | — | RECONSTRUCTED | §9.6 the falls are bowsed taut when the gun is run out, so there is very little bight in them |
| `gun_train_tackle_length` | 1.2192 | 4 ft 0 in | SECONDARY | §9.6 the train tackle runs from the rear of the carriage to an eye bolt in the deck on the centreline side |
| `gun_housed_muzzle_inboard` | 0.1016 | — | RECONSTRUCTED | §9.4 the muzzle comes inside the planking far enough for the lid to shut over it and be bowsed to; four inches is what the lashing and the lid between them need |
| `gun_housed_elevation_deg` | 18 | — | RECONSTRUCTED | §9.4 the muzzle is lashed up to the ring bolt above the port, which stands about a foot over the port head; the elevation follows from the geometry of the two |
| `gun_run_out_side_clearance` | 0.0508 | — | RECONSTRUCTED | §9.4 a gun run out has its fore trucks all but against the ship's side; this is what is left between the fore end of the cheeks and the inboard face of the side |
| `gun_forecastle_first_from_stem` | 4.8768 | 16 ft 0 in | RECONSTRUCTED | §3 the foremost forecastle piece, abaft the knightheads and the beakhead bulkhead; the forecastle is about 45 ft long (§3) |
| `gun_forecastle_spacing` | 3.2004 | 10 ft 6 in | RECONSTRUCTED | §3 three pieces a side spread along the forecastle so the aftermost stands short of the break |

### Boats

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `boat_gripe_width` | 0.1 | 0 ft 3.9 in | RECONSTRUCTED | §8.3 the canvas gripes that pass over a stowed boat and set up to ring bolts in the deck. In this weather they are doubled: a boat adrift on the skids is two tons of it |
| `boat_gripe_thickness` | 0.018 | 0 ft 0.7 in | RECONSTRUCTED | §8.3 canvas and rope, not timber |
| `boat_count` | 5 | — | RECONSTRUCTED | §8.3 Steel 1805 / Lavery boat establishment for a 74: launch, pinnace, two cutters and a jolly boat |
| `launch_length` | 9.7536 | 32 ft 0 in | RECONSTRUCTED | §8.3 Steel 1805 / Lavery boat establishment for a 74, launch 30-34 ft |
| `launch_beam` | 2.8194 | 9 ft 3 in | RECONSTRUCTED | §8.3 Steel 1805 / Lavery boat establishment for a 74, launch beam about 0.29 of her length |
| `launch_depth` | 1.143 | 3 ft 9 in | RECONSTRUCTED | §8.5 depth amidships at length/8.5, Steel's boat proportion; the scantling folio is illegible |
| `pinnace_length` | 8.5344 | 27 ft 12 in | RECONSTRUCTED | §8.3 Steel 1805 / Lavery boat establishment for a 74, pinnace 26-28 ft |
| `pinnace_beam` | 1.905 | 6 ft 3 in | RECONSTRUCTED | §8.3 Steel 1805 / Lavery boat establishment for a 74, a pinnace is long and narrow |
| `pinnace_depth` | 0.8128 | 2 ft 8 in | RECONSTRUCTED | §8.5 length/10.5; a pinnace is shallower and finer than a launch |
| `cutter_length` | 7.3152 | 24 ft 0 in | RECONSTRUCTED | §8.3 Steel 1805 / Lavery boat establishment for a 74, cutter 22-25 ft; the 24 ft taken so that she nests in the 32 ft launch |
| `cutter_beam` | 2.0828 | 6 ft 10 in | RECONSTRUCTED | §8.3 Steel 1805 / Lavery boat establishment for a 74, "shorter, broader and deeper in proportion", Steel |
| `cutter_depth` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §8.5 length/8; a cutter is deep for her length |
| `jolly_length` | 5.4864 | 18 ft 0 in | RECONSTRUCTED | §8.3 Steel 1805 / Lavery boat establishment for a 74, jolly boat 16-18 ft, the larger taken for a 74 |
| `jolly_beam` | 1.7526 | 5 ft 9 in | RECONSTRUCTED | §8.3 Steel 1805 / Lavery boat establishment for a 74, jolly boat beam |
| `jolly_depth` | 0.6858 | 2 ft 3 in | RECONSTRUCTED | §8.5 length/8 |
| `boat_max_beam_station` | 0.55 | — | RECONSTRUCTED | §8.5 maximum breadth a little abaft midships, the usual place in a ship's boat |
| `boat_entry_power` | 0.55 | — | RECONSTRUCTED | §8.5 fineness of the entry, as an exponent on the forward waterline |
| `boat_run_power` | 1.6 | — | RECONSTRUCTED | §8.5 fineness of the run aft to the transom |
| `boat_transom_width_frac` | 0.62 | — | RECONSTRUCTED | §8.5 transom breadth as a fraction of the extreme breadth |
| `boat_sheer_rise_fwd` | 0.28 | — | RECONSTRUCTED | §8.5 rise of the gunwale at the stem, as a fraction of the depth amidships |
| `boat_sheer_rise_aft` | 0.14 | — | RECONSTRUCTED | §8.5 rise of the gunwale at the transom |
| `boat_rocker_fwd` | 0.62 | — | RECONSTRUCTED | §8.5 rise of the keel into the forefoot, as a fraction of the depth |
| `boat_sheer_power` | 1.8 | — | RECONSTRUCTED | §8.5 the sheer of a boat runs flat amidships and lifts quickly at the ends; exponent on the rise |
| `boat_rocker_power` | 1.8 | — | RECONSTRUCTED | §8.5 the same rule applied to the rocker of the keel |
| `boat_rocker_aft` | 0.3 | — | RECONSTRUCTED | §8.5 rise of the keel into the tuck |
| `boat_section_fullness_launch` | 3.2 | — | RECONSTRUCTED | §8.3 Steel: the launch is "more flat in its bottom"; superellipse exponent giving a flat floor and a hard bilge |
| `boat_section_fullness_pulling` | 2.4 | — | RECONSTRUCTED | §8.5 rounder section of a pinnace, cutter or jolly boat |
| `boat_plank_thickness` | 0.0318 | 0 ft 1.3 in | RECONSTRUCTED | §8.5 boat planking about 1¼ in; Steel's boat scantling folio is illegible in the scan |
| `boat_keel_siding` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §8.5 boat keel sided 3 in |
| `boat_keel_moulding` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §8.5 boat keel moulded 4 in below the rabbet |
| `boat_stem_siding` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §8.5 stem and sternpost sided a little more than the keel |
| `boat_gunwale_width` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §8.5 gunwale capping over the heads of the timbers |
| `boat_gunwale_thickness` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §8.5 thickness of the capping |
| `boat_washstrake_height` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §8.5 washstrake above the sheer strake, white outside as the photograph shows |
| `boat_thwart_spacing` | 0.8382 | 2 ft 9 in | RECONSTRUCTED | §8.3 thwarts spaced for a rower's stroke; Steel gives a pinnace eight oars in 24 ft |
| `boat_thwart_width` | 0.254 | 0 ft 10 in | RECONSTRUCTED | §8.5 thwart 10 in fore and aft |
| `boat_thwart_thickness` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §8.5 thwart 1½ in thick |
| `boat_thwart_below_gunwale` | 0.2286 | — | RECONSTRUCTED | §8.5 thwarts set 9 in below the gunwale |
| `boat_rudder_depth` | 0.762 | 2 ft 6 in | RECONSTRUCTED | §8.5 rudder hanging a little deeper than the boat |
| `boat_rudder_width` | 0.2794 | 0 ft 11 in | RECONSTRUCTED | §8.5 rudder blade width |
| `boat_rudder_thickness` | 0.0508 | 0 ft 2 in | RECONSTRUCTED | §8.5 rudder thickness |
| `boat_tiller_length` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §8.5 tiller reaching the after thwart |
| `boat_chock_height` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §8.2 "boat chocks, two per boat, shaped to the boat's bilges" |
| `boat_chock_width` | 0.1524 | 0 ft 6 in | RECONSTRUCTED | §8.2 chock sided 6 in |
| `boat_chock_spread` | 0.62 | — | RECONSTRUCTED | §8.2 the chocks take the boat under her bilges, at 0.62 of the half breadth |
| `boat_stow_beam_first` | 1 | — | RECONSTRUCTED | §8.2 the chocks stand on the second and third of the four skid beams, the middle two |
| `launch_stow_offset` | 1.6764 | — | RECONSTRUCTED | §8.2 launch stowed to starboard of the centreline so that the pinnace stows beside her, both inside the gangways |
| `pinnace_stow_offset` | 1.6764 | — | RECONSTRUCTED | §8.2 pinnace to port, the mirror of the launch |
| `cutter_nest_rise` | 0.9144 | — | RECONSTRUCTED | §8.2 "nested one atop the other"; the rise that lands the cutter's keel on top of the launch's thwarts rather than through them |
| `cutter_nest_shift` | 0.4572 | — | RECONSTRUCTED | §8.2 the nested cutter set a foot and a half aft in the launch to clear her stem |
| `boat_gripe_pairs` | 2 | — | RECONSTRUCTED | §8.3 in heavy weather every stowed boat is double-gripped: two pairs of gripes, one pair either side of her middle |
| `davit_station_forward_of_sternpost` | 5.4864 | — | RECONSTRUCTED | §8.4 davits stepped on the quarterdeck rail abaft the mizzen channels, clear of the quarter gallery |
| `davit_spacing_of_boat` | 0.56 | — | RECONSTRUCTED | §8.4 the two davits stand this fraction of the boat's length apart, so the falls hook in a little inside her stem and stern |
| `davit_height_above_rail` | 1.3716 | — | RECONSTRUCTED | §8.4 davit head high enough to swing the boat clear of the rail |
| `davit_outreach` | 1.6764 | — | RECONSTRUCTED | §8.4 the davits reach far enough outboard to swing the boat clear of the quarterdeck rail |
| `davit_diameter` | 0.1524 | 0 ft 6 in | RECONSTRUCTED | §8.4 davit 6 in in diameter at the step, for a heavier boat than a frigate's |
| `davit_fall_diameter` | 0.0445 | 0 ft 1.8 in | RECONSTRUCTED | §8.4 boat fall of 1¾ in rope |
| `boat_hang_below_davit` | 0.8382 | — | RECONSTRUCTED | §8.4 boat griped up close under the davit heads for sea |
| `boat_oar_count` | 8 | — | RECONSTRUCTED | §8.3 Steel: "Pinnaces never row more than eight oars; the pinnace is the boat whose oars are stowed in her" |
| `boat_oar_length` | 4.8768 | 16 ft 0 in | RECONSTRUCTED | §8.3 oar length by Steel's rule for a boat of this beam, stowed fore and aft |
| `boat_oar_diameter` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §8.5 loom of the oar 3 in |
| `boat_oar_blade_width` | 0.1397 | 0 ft 5.5 in | RECONSTRUCTED | §8.5 blade of the oar |
| `boat_hook_count` | 2 | — | RECONSTRUCTED | §8.3 a pair of boat hooks stowed along the thwarts |
| `boat_hook_length` | 3.048 | 10 ft 0 in | RECONSTRUCTED | §8.3 boat hook stowed along the thwarts |
| `boat_mast_length` | 4.572 | 15 ft 0 in | RECONSTRUCTED | §8.3 the boat's own mast, unstepped and stowed in her with the sail furled to it |
| `boat_furled_sail_diameter` | 0.254 | 0 ft 10 in | RECONSTRUCTED | §8.3 the boat's lug sail furled round its own yard |
| `boat_furled_sail_length` | 2.7432 | 9 ft 0 in | RECONSTRUCTED | §8.3 the furl runs over the middle of the mast |

### Deck clutter

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `clutter_scuttlebutt_height` | 1.016 | 3 ft 4 in | RECONSTRUCTED | §6 research 06 deck stores: a scuttlebutt was a cask on a low stand, with its bung about waist height |
| `clutter_lashed_casks_length` | 1.2446 | 4 ft 1 in | RECONSTRUCTED | §6 research 06 deck stores: two water or beer casks lashed side by side along a chock |
| `clutter_hen_coop_length` | 1.4986 | 4 ft 11 in | RECONSTRUCTED | §6 research 06 deck stores: a long low crate with a sloping roof, three or four hens |
| `clutter_fire_buckets_length` | 0.9525 | 3 ft 1.5 in | RECONSTRUCTED | §6 research 06 deck stores: three leather fire buckets side by side in their rack |
| `clutter_shot_garland_length` | 1.6002 | 5 ft 3 in | RECONSTRUCTED | §6 research 06 deck stores: a plank rack of round shot, a garland, along a hatchway coaming |
| `clutter_rope_coil_diameter` | 0.6985 | 2 ft 3.5 in | RECONSTRUCTED | §6 research 06 deck stores: the fall of a brace or a sheet, flemished down on deck |
| `clutter_scuttlebutt_starboard_abaft_forecastle_break` | 0.762 | 2 ft 6 in | RECONSTRUCTED | §6 research 06 deck stores: forward of the foremost skid beam, clear of the fore hatch's coaming |
| `clutter_scuttlebutt_starboard_off_centre` | 2.4384 | 8 ft 0 in | RECONSTRUCTED | §6 research 06 deck stores: outboard of the fore hatch and inboard of the ladder at the break |
| `clutter_scuttlebutt_starboard_yaw_deg` | 0 | — | RECONSTRUCTED | §6 research 06 deck stores |
| `clutter_lashed_casks_port_abaft_forecastle_break` | 0.762 | 2 ft 6 in | RECONSTRUCTED | §6 research 06 deck stores: forward of the foremost skid beam, clear of the housed guns' carriages |
| `clutter_lashed_casks_port_off_centre` | 2.286 | 7 ft 6 in | RECONSTRUCTED | §6 research 06 deck stores: outboard of the fore hatch and inboard of the ladder at the break |
| `clutter_lashed_casks_port_yaw_deg` | 0 | — | RECONSTRUCTED | §6 research 06 deck stores: along the deck's width, lashed to a chock |
| `clutter_shot_garland_starboard_between_upper_ports` | 4 | — | RECONSTRUCTED | §6 research 06 deck stores: between the fifth and sixth ports of the upper battery from forward, in the waist |
| `clutter_shot_garland_starboard_off_centre` | 3.556 | 11 ft 8 in | RECONSTRUCTED | §6 research 06 deck stores: between the boats' side and the guns' carriages |
| `clutter_shot_garland_starboard_yaw_deg` | 90 | — | RECONSTRUCTED | §6 research 06 deck stores: along the ship |
| `clutter_shot_garland_port_between_upper_ports` | 5 | — | RECONSTRUCTED | §6 research 06 deck stores: between the sixth and seventh ports, so the two are not a matched pair |
| `clutter_shot_garland_port_off_centre` | 3.556 | 11 ft 8 in | RECONSTRUCTED | §6 research 06 deck stores: between the boats' side and the guns' carriages |
| `clutter_shot_garland_port_yaw_deg` | 90 | — | RECONSTRUCTED | §6 research 06 deck stores: along the ship |
| `clutter_fire_buckets_port_abaft_quarterdeck_break` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | §6 research 06 deck stores: at the break of the quarterdeck |
| `clutter_fire_buckets_port_off_centre` | 1.524 | 5 ft 0 in | RECONSTRUCTED | §6 research 06 deck stores: clear of the mainmast's bitts and of the ladder |
| `clutter_fire_buckets_port_yaw_deg` | 0 | — | RECONSTRUCTED | §6 research 06 deck stores: facing aft |
| `clutter_rope_coil_main_starboard_abaft_mainmast` | 2.4384 | 8 ft 0 in | RECONSTRUCTED | §6 research 06 deck stores: the main tack and sheet, abaft the mast's bitts |
| `clutter_rope_coil_main_starboard_off_centre` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 research 06 deck stores |
| `clutter_rope_coil_main_starboard_yaw_deg` | 17 | — | RECONSTRUCTED | §6 research 06 deck stores: a coil has no front |
| `clutter_rope_coil_brace_starboard_abaft_mainmast` | 6.096 | 20 ft 0 in | RECONSTRUCTED | §6 research 06 deck stores: the main braces' falls, between the mainmast and the wheel |
| `clutter_rope_coil_brace_starboard_off_centre` | 2.286 | 7 ft 6 in | RECONSTRUCTED | §6 research 06 deck stores: inboard of the carriages |
| `clutter_rope_coil_brace_starboard_yaw_deg` | 150 | — | RECONSTRUCTED | §6 research 06 deck stores: a coil has no front |
| `clutter_rope_coil_mizzen_port_abaft_mizzenmast` | 0.762 | 2 ft 6 in | RECONSTRUCTED | §6 research 06 deck stores: the mizzen's falls, by its bitts |
| `clutter_rope_coil_mizzen_port_off_centre` | 1.8288 | 6 ft 0 in | RECONSTRUCTED | §6 research 06 deck stores: clear of the skylight and of the carriages |
| `clutter_rope_coil_mizzen_port_yaw_deg` | 40 | — | RECONSTRUCTED | §6 research 06 deck stores: a coil has no front |
| `clutter_hen_coop_starboard_forward_of_forecastle_break` | 0.762 | 2 ft 6 in | RECONSTRUCTED | §6 research 06 deck stores: against the after edge of the forecastle |
| `clutter_hen_coop_starboard_off_centre` | 2.1336 | 6 ft 12 in | RECONSTRUCTED | §6 research 06 deck stores: clear of the forecastle guns' carriages |
| `clutter_hen_coop_starboard_yaw_deg` | 0 | — | RECONSTRUCTED | §6 research 06 deck stores: slats facing aft |
| `clutter_hen_coop_port_forward_of_forecastle_break` | 0.762 | 2 ft 6 in | RECONSTRUCTED | §6 research 06 deck stores: against the after edge of the forecastle |
| `clutter_hen_coop_port_off_centre` | 2.1336 | 6 ft 12 in | RECONSTRUCTED | §6 research 06 deck stores: clear of the forecastle guns' carriages |
| `clutter_hen_coop_port_yaw_deg` | 0 | — | RECONSTRUCTED | §6 research 06 deck stores: slats facing aft |
| `clutter_rope_coil_fore_starboard_forward_of_forecastle_break` | 2.4384 | 8 ft 0 in | RECONSTRUCTED | §6 research 06 deck stores: the fore tack, abaft the galley chimney |
| `clutter_rope_coil_fore_starboard_off_centre` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 research 06 deck stores |
| `clutter_rope_coil_fore_starboard_yaw_deg` | 115 | — | RECONSTRUCTED | §6 research 06 deck stores: a coil has no front |

### Ground tackle

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `anchor_count_total` | 4 | — | SECONDARY | §6 a 74 carried four large anchors: best bower and small bower catted at the catheads, and the sheet and spare stowed on the fore channels (Lavery, The Ship of the Line, vol. 2) |
| `anchor_count_bower` | 2 | — | SECONDARY | §6 best bower and small bower, one to each cathead |
| `anchor_bower_weight_cwt` | 74 | — | RECONSTRUCTED | §6 the best bower of a 74 in the 1790s weighed 70-80 cwt (Steel 1805); 74 cwt taken, 3.76 tonnes |
| `anchor_best_bower_scale` | 1 | — | RECONSTRUCTED | §6 the best bower is the size the other rows give |
| `anchor_small_bower_scale` | 0.98 | — | RECONSTRUCTED | §6 the small bower a little lighter than the best, cube root of 71/74 |
| `anchor_sheet_scale` | 1.02 | — | RECONSTRUCTED | §6 the sheet anchor, the heaviest, cube root of 77/74 |
| `anchor_spare_scale` | 0.98 | — | RECONSTRUCTED | §6 the spare anchor stowed with the sheet |
| `anchor_shank_length` | 6.0452 | 19 ft 10 in | RECONSTRUCTED | §6 Steel (1805), a 74-gun ship's bower of 74 cwt; shank and stock equal, the shank scaled by the cube root of the weight from Steel's 22 ft for a first-rate bower of about 100 cwt: 22 ft x (74/100)^(1/3) = 19 ft 10 in |
| `anchor_shank_square_trend` | 0.2794 | — | RECONSTRUCTED | §6 shank square at the trend, about 1/22 of the shank, the smith's proportion |
| `anchor_shank_square_head` | 0.1778 | — | RECONSTRUCTED | §6 shank square at the head, two thirds of the square at the trend |
| `anchor_arm_span` | 3.3274 | — | RECONSTRUCTED | §6 fluke tip to fluke tip at 0.55 of the shank, the standard long-shank proportion |
| `anchor_arm_angle_deg` | 60 | — | RECONSTRUCTED | §6 the arm stands 60 degrees off the shank on the Admiralty long-shank pattern |
| `anchor_arm_square_crown` | 0.254 | — | RECONSTRUCTED | §6 the arm at the crown, a little under the shank at the trend |
| `anchor_arm_square_tip` | 0.0889 | — | RECONSTRUCTED | §6 the arm tapering to the bill |
| `anchor_palm_length` | 1.2192 | 4 ft 0 in | RECONSTRUCTED | §6 palm at 0.20 of the shank |
| `anchor_palm_width` | 0.7366 | 2 ft 5 in | RECONSTRUCTED | §6 palm breadth at 0.6 of its length, the usual proportion |
| `anchor_palm_thickness` | 0.0889 | 0 ft 3.5 in | RECONSTRUCTED | §6 palm thickness, forged out of the arm |
| `anchor_palm_along_arm` | 0.6 | — | RECONSTRUCTED | §6 the palm centred at 0.60 of the arm out from the crown |
| `anchor_ring_diameter` | 0.7874 | 2 ft 7 in | RECONSTRUCTED | §6 ring diameter for a 74 cwt anchor, wide enough for the cable's clinch |
| `anchor_ring_bar_diameter` | 0.0889 | 0 ft 3.5 in | RECONSTRUCTED | §6 the ring bar at about one eighth of the ring |
| `anchor_nut_length` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §6 the nuts under the stock that stop it turning on the shank |
| `anchor_stock_length` | 6.0452 | 19 ft 10 in | RECONSTRUCTED | §6 Steel (1805), a 74-gun ship's bower of 74 cwt; shank and stock equal, the shank scaled by the cube root of the weight from Steel's 22 ft for a first-rate bower of about 100 cwt; the stock as long as the shank |
| `anchor_stock_square_middle` | 0.4572 | — | RECONSTRUCTED | §6 Steel (1805), a 74-gun ship's bower of 74 cwt; shank and stock equal, the shank scaled by the cube root of the weight from Steel's 22 ft for a first-rate bower of about 100 cwt; scaled from Steel's stock at the middle |
| `anchor_stock_square_ends` | 0.254 | — | RECONSTRUCTED | §6 Steel (1805), a 74-gun ship's bower of 74 cwt; shank and stock equal, the shank scaled by the cube root of the weight from Steel's 22 ft for a first-rate bower of about 100 cwt; at the ends |
| `anchor_stock_gap_middle` | 0.1778 | — | SECONDARY | §6 Steel, the opening left between the two pieces at the middle for the shank |
| `anchor_stock_below_head` | 0.2794 | — | RECONSTRUCTED | §6 the stock seated one shank-square below the head, under the nuts |
| `anchor_stock_hoop_count` | 4 | — | SECONDARY | §6 Steel, four iron hoops to each stock |
| `anchor_stock_hoop_breadth` | 0.076 | 0 ft 3 in | SECONDARY | §6 Steel, hoops 3 in broad |
| `anchor_stock_hoop_thickness` | 0.016 | 0 ft 0.6 in | SECONDARY | §6 Steel, hoops 5/8 in thick |
| `anchor_ring_below_cathead` | 0.9144 | — | RECONSTRUCTED | §6 a three-sheave cat block, its strop and the hook into the ring, hanging from the sheaves in the cathead |
| `anchor_bed_below_rail` | 0.3048 | — | RECONSTRUCTED | §6 the fore channel's top a foot below the rail; the bill-board is built to this height whatever the channel does |
| `anchor_crown_above_bed` | 0.1016 | — | RECONSTRUCTED | §6 the arm bearing on the bill-board, not sunk into it |
| `anchor_crown_outboard_of_side` | 0.762 | — | RECONSTRUCTED | §6 the crown stands out from the side on the bill-board |
| `anchor_stock_cant_deg` | 52 | — | RECONSTRUCTED | §6 the stock of a fished anchor stands nearly upright, canted outboard, with its arms lying flat |
| `anchor_billboard_length` | 2.4384 | 8 ft 0 in | RECONSTRUCTED | §6 the bill-board under the crown, long enough for the palm |
| `anchor_billboard_projection` | 0.8128 | — | RECONSTRUCTED | §6 projecting beyond the planking |
| `anchor_billboard_thickness` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §6 |
| `anchor_lining_height` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §6 the anchor lining on the topside, deep enough to take the fluke |
| `anchor_lining_thickness` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §6 a thick strake laid on the topside |
| `anchor_stowed_ring_forward_of_foremast` | 0.3048 | — | RECONSTRUCTED | §6 the fore channel begins a little forward of the mast; the ring is made fast there |
| `anchor_stowed_outboard_of_side` | 0.4064 | — | RECONSTRUCTED | §6 the shank lies on the channel, a foot and a third off the planking |
| `anchor_stowed_ring_above_bed` | 0.3048 | — | RECONSTRUCTED | §6 the ring raised to the lashing |
| `anchor_stowed_cant_deg` | 80 | — | RECONSTRUCTED | §6 the arms of a stowed anchor lie nearly flat: the inboard fluke over the rail, the outboard one over the water |
| `anchor_stowed_stock_beside_shank` | 0.4572 | — | RECONSTRUCTED | §6 the unshipped stock lashed alongside its own shank |
| `anchor_stowed_stock_above_shank` | 0.2032 | — | RECONSTRUCTED | §6 and a little above it |
| `hawse_hole_count_total` | 4 | — | MEASURED | §2 the Washington draught shows two hawse holes a side (OFFSETS.hawse lists them) |
| `hawse_liner_depth` | 0.508 | 1 ft 8 in | RECONSTRUCTED | §6 the lining of the hole, sunk into the bow |
| `hawse_bolster_projection` | 0.0762 | — | SECONDARY | §6 Steel, the hawse bolsters project from the planking |
| `anchor_cable_diameter` | 0.178 | 0 ft 7 in | RECONSTRUCTED | §6 a 74's bower cable of 22 in circumference (Steel 1805), 7 in through |
| `anchor_cable_sag` | 0.06 | — | RECONSTRUCTED | §6 the slack in a heavy cable bent to a catted anchor |
| `cat_block_length` | 0.6858 | 2 ft 3 in | RECONSTRUCTED | §6 a three-sheave cat block to match the three sheaves in the cathead |
| `cat_block_width` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | §6 three sheaves of 12 in and their partitions |
| `cat_block_thickness` | 0.2794 | 0 ft 11 in | RECONSTRUCTED | §6 sheaves 2 in thick in a three-sheave shell |
| `shank_painter_diameter` | 0.035 | 0 ft 1.4 in | SECONDARY | §6 Steel, the shank painter's chain 1 3/8 in bar |
| `shank_painter_bolt_abaft_end` | 4.2672 | — | RECONSTRUCTED | §6 "a chain bolted through the topside, abaft the cathead" (Steel); 14 ft abaft the loft's foremost station |
| `shank_painter_on_shank` | 0.78 | — | RECONSTRUCTED | §6 the painter takes the shank near the crown |

### Colours

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `canton_post_1801` | 1 | — | PRIMARY | §5 the Union of 1801 stood from 1 Jan 1801; she is modelled in 1811, and the ruse flies the British ensign of that date |
| `ensign_at_staff` | 0 | — | SECONDARY | §5 ensign at the gaff peak under sail |
| `jack_worn_under_way` | 1 | — | RECONSTRUCTED | §5 research 05: the jack is built and shown on its staff by default; a host can hide it |
| `ensign_hoist` | 2.7432 | — | RECONSTRUCTED | §5 twelve breadths of 9 in bunting, a 74's ensign; surprise-model's frigate flew eight |
| `ensign_fly` | 5.4864 | — | SECONDARY | §5 the British ensign's 1:2 proportion, in force from 1799, on a 9 ft hoist; the ruse flag |
| `ensign_fly_dutch` | 4.1148 | — | SECONDARY | §5 the Dutch national flag is 2:3; on the 9 ft hoist that is 13 ft 6 in |
| `ensign_fly_french` | 4.1148 | — | SECONDARY | §5 the French tricolour at sea is taken as 2:3 on the same hoist; the 1794 law fixes the arrangement, not a ratio, so the proportion is RECONSTRUCTED |
| `ensign_canton_hoist_frac` | 0.5 | — | RECONSTRUCTED | §5 standard British ensign construction, canton = 1/2 hoist |
| `ensign_canton_fly_frac` | 0.25 | — | RECONSTRUCTED | §5 standard British ensign construction on a 1:2 ensign, the canton one quarter of the fly |
| `ensign_peak_fallback_height` | 21 | 68 ft 10.8 in | RECONSTRUCTED | §4 where a 74's spanker gaff peak stands, used only if the rig publishes no ctx.spanker |
| `ensign_peak_fallback_from_stem` | 47 | 154 ft 2.4 in | RECONSTRUCTED | §4 where a 74's spanker gaff peak stands, used only if the rig publishes no ctx.spanker |
| `ensign_staff_forward_of_sternpost` | 1.6 | — | RECONSTRUCTED | §4 taffrail station, just forward of the sternpost |
| `flag_ensign_staff_height` | 4.8768 | 16 ft 0 in | RECONSTRUCTED | §4 ensign staff above the taffrail, a 74's a little over a frigate's |
| `ensign_halliard_belay_abaft_mizzen` | 0.9144 | — | RECONSTRUCTED | §5 peak halliard belayed at the mizzen fife rail, a yard abaft the mast |
| `pennant_hoist` | 0.8636 | — | RECONSTRUCTED | §5 scaled from the frigate masthead pendant of 2 ft 2 in x 46 ft 9 in (gwpda naval establishment) for a 74 |
| `pennant_length` | 18.8976 | 62 ft 0 in | RECONSTRUCTED | §5 scaled from the frigate masthead pendant of 2 ft 2 in x 46 ft 9 in (gwpda naval establishment) for a 74 |
| `pennant_fly_width` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §5 the tapered fly, a little wider than the frigate's 4 in |
| `pennant_george_frac` | 2 | — | RECONSTRUCTED | §5 St George at the hoist, squadron colour in the fly; hoist portion drawn twice the hoist depth |
| `pennant_fallback_height` | 52 | 170 ft 7.2 in | RECONSTRUCTED | §4 where a 74's main truck stands, used only if the rig publishes no main mast geometry |
| `pennant_fallback_from_stem` | 27.7 | 90 ft 10.6 in | RECONSTRUCTED | §4 the main mast centre abaft the stem, used only if the rig publishes no main mast geometry |
| `pennant_halliard_drop` | 2.4384 | — | RECONSTRUCTED | §5 pendant halliard from the truck down to the topgallant crosstrees |
| `pennant_segment_multiple` | 2 | — | RECONSTRUCTED | §5 mesh resolution only, not a dimension of the ship |
| `jack_hoist` | 1.0668 | — | RECONSTRUCTED | §5 a jack of four or five breadths for a ship of this rate |
| `jack_fly` | 2.1336 | — | RECONSTRUCTED | §5 the British Union flag proportion 1:2 on a 3 ft 6 in hoist |
| `jack_fly_tricolour` | 1.6002 | — | RECONSTRUCTED | §5 the tricolour jack in 2:3 on the same hoist |
| `jack_from_stem` | 0.3 | 0 ft 11.8 in | RECONSTRUCTED | §5 jackstaff on the stemhead at the heel of the bowsprit |
| `flag_jack_staff_height` | 4.8768 | 16 ft 0 in | RECONSTRUCTED | §4 jack staff, a little over the 14 ft of a frigate |
| `flag_jack_staff_diameter` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §4 a 3 in staff |
| `union_cross_width_frac` | 0.2 | — | RECONSTRUCTED | §5 standard Union construction, St George cross 1/5 of the hoist |
| `union_fimbriation_frac` | 0.0667 | — | RECONSTRUCTED | §5 standard Union construction, white fimbriation 1/15 of the hoist each side |
| `union_saltire_width_frac` | 0.2 | — | RECONSTRUCTED | §5 standard Union construction, the diagonal band 1/5 of the hoist |
| `union_patrick_frac` | 0.0667 | — | RECONSTRUCTED | §5 post-1801 only, St Patrick red 2/30 of the hoist |
| `union_patrick_offset_frac` | 0.0333 | — | RECONSTRUCTED | §5 post-1801 counterchange, red offset 1/30 from the band centre so the broad white is uppermost at the top hoist |
| `flag_wind_bearing_deg` | 60 | — | RECONSTRUCTED | §5 wind from the starboard bow; the flags stream aft and to port, agreeing with the sails full on the starboard tack |
| `flag_droop_frac` | 0.17 | — | RECONSTRUCTED | §5 "pronounced sag at the fly" — wool bunting, sag as a fraction of the fly |
| `flag_wave_amplitude_frac` | 0.24 | — | RECONSTRUCTED | §5 "long, slow wave" — amplitude as a fraction of the hoist |
| `flag_wave_length_frac` | 0.45 | — | RECONSTRUCTED | §5 "long, slow wave" — wavelength as a fraction of the fly |
| `flag_wave_skew` | 0.3 | — | RECONSTRUCTED | §5 the wave runs diagonally across the cloth, not straight down the hoist |
| `flag_stream_slack` | 0.07 | — | RECONSTRUCTED | §5 cloth taken up by the wave, so the fly does not reach its full length downwind |
| `flag_wave_growth_exponent` | 1.3 | — | RECONSTRUCTED | §5 "higher damping and lower stiffness than a modern flag preset" |
| `flag_wave_harmonic` | 0.35 | — | RECONSTRUCTED | §5 a second harmonic at a third of the amplitude, so the wave is not a pure sine |
| `flag_wave_phase` | 0.35 | — | RECONSTRUCTED | §5 baked attitude of the ensign; a phase, not a dimension |
| `flag_wave_phase_pennant` | 2.1 | — | RECONSTRUCTED | §5 baked attitude of the pendant; a phase, not a dimension |
| `flag_wave_phase_jack` | 4.05 | — | RECONSTRUCTED | §5 baked attitude of the jack; a phase, not a dimension |
| `flag_halliard_diameter` | 0.016 | 0 ft 0.6 in | RECONSTRUCTED | §5 signal halliard, small stuff rove through a block at the peak |
| `flag_halliard_sag` | 0.015 | — | RECONSTRUCTED | §5 a halliard swigged up taut carries very little sag |

### The watch on deck

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `crew_figure_height` | 1.6764 | 5 ft 6 in | RECONSTRUCTED | §9 the average height of a seaman of about 1800, from the surviving British Marine and Navy muster descriptions (no Dutch figures found). This is the number that gives the ship her scale |
| `crew_officer_height` | 1.7526 | 5 ft 9 in | RECONSTRUCTED | §9 officers ran two to three inches taller than the people, being better fed as children |
| `crew_shoulder_breadth` | 0.4318 | 1 ft 5 in | RECONSTRUCTED | §9 across the shoulders of a working man in a jacket |
| `crew_hip_breadth` | 0.3302 | 1 ft 1 in | RECONSTRUCTED | §9 across the hips |
| `crew_depth` | 0.254 | 0 ft 10 in | RECONSTRUCTED | §9 front to back through the chest, in slops |
| `crew_head_height` | 0.2413 | 0 ft 9.5 in | RECONSTRUCTED | §9 crown to chin, about an eighth of the whole figure |
| `crew_head_breadth` | 0.1651 | 0 ft 6.5 in | RECONSTRUCTED | §9 across the skull, and a little more with a tarpaulin hat on it |
| `crew_leg_fraction` | 0.47 | — | RECONSTRUCTED | §9 the ground to the fork is a little under half the whole height, which is what makes a figure read as a man and not as a doll |
| `crew_arm_fraction` | 0.44 | — | RECONSTRUCTED | §9 shoulder to fingertip as a fraction of height |
| `crew_arm_thickness` | 0.1143 | 0 ft 4.5 in | RECONSTRUCTED | §9 through a sleeve |
| `crew_leg_thickness` | 0.1397 | 0 ft 5.5 in | RECONSTRUCTED | §9 through a trouser leg |
| `crew_stance` | 0.3556 | — | RECONSTRUCTED | §9 how wide a man stands with the deck moving under him. It is wider than a man stands ashore, and it is one of the few things about a figure that reads at any distance |
| `crew_helm_abaft_wheel` | 0.4064 | — | RECONSTRUCTED | §9 a helmsman stands close abaft his wheel with the spokes at arm's length; the double wheel has two men to each |
| `crew_helm_photographed_closer_abaft` | 0.1397 | — | RECONSTRUCTED | §9 the photographed helmsmen have a real arm's length, shorter than the built figures' reach, so they stand this much nearer the wheel |
| `crew_helm_photographed_closer_across` | 0.0762 | — | RECONSTRUCTED | §9 and this much nearer the hub, across |
| `crew_helm_off_centre` | 0.7112 | — | RECONSTRUCTED | §9 each helmsman stands beside the rim of the wheel, a little inside its edge |
| `crew_con_abaft_binnacle` | 0.762 | — | RECONSTRUCTED | §9 the officer of the watch cons her from beside the binnacles, where he can see the compass and the weather leech together |
| `crew_con_off_centre` | 1.8288 | — | RECONSTRUCTED | §9 the officer of the watch stands to larboard of the binnacles |
| `crew_master_off_centre` | 2.5908 | — | RECONSTRUCTED | §9 the master (the second officer of the watch) stands on the weather side of the quarterdeck |
| `crew_master_forward_of_binnacle` | 0.9144 | — | RECONSTRUCTED | §9 a little forward of the binnacles |
| `crew_captain_forward_of_mizzen` | 1.524 | — | RECONSTRUCTED | §9 the captain paces the weather side of the quarterdeck between the wheel and the mizzen, clear of the helmsmen and of the braces |
| `crew_captain_off_centre` | 3.6576 | — | RECONSTRUCTED | §9 the captain on the weather side, by the rail |
| `crew_midshipman_forward_of_binnacle` | 4.2672 | — | RECONSTRUCTED | §9 the signal midshipman at the forward end of the quarterdeck, where he can see the flag halliards and the other ships |
| `crew_midshipman_off_centre` | 3.048 | — | RECONSTRUCTED | §9 to larboard |
| `crew_mizzen_brace_abaft_mizzen` | 0.4572 | — | RECONSTRUCTED | §9 the mizzen braces are belayed at the rail abreast the mast, and in a gale there are hands standing by them |
| `crew_gun_quarters_port_index` | 1 | — | RECONSTRUCTED | §9 which of the quarterdeck ports on the larboard side has a crew standing to it (counted from forward) |
| `crew_gun_quarters_starboard_index` | 3 | — | RECONSTRUCTED | §9 which of the quarterdeck ports on the starboard side has a crew standing to it (counted from forward) |
| `crew_gun_quarters_inboard` | 2.7432 | — | RECONSTRUCTED | §9 the gun captain stands behind the breech of his gun, this far inboard of the ship's side, clear of the recoil |
| `crew_gun_quarters_loader_abaft` | 0.8128 | — | RECONSTRUCTED | §9 the second man of a gun's crew stands beside him |
| `crew_main_brace_forward_of_mainmast` | 1.524 | — | RECONSTRUCTED | §9 the main braces lead to the pin rail at the break of the quarterdeck; the hands stand on the gangways to haul them |
| `crew_pump_hand_off_centre` | 1.524 | — | RECONSTRUCTED | §9 the hands at the chain pumps, one each side |
| `crew_bosun_off_centre` | 2.7432 | — | RECONSTRUCTED | §9 the boatswain stands in the waist by the capstan, where he can see everything that is being done on deck |
| `crew_lookout_forward_of_foremast` | 2.7432 | — | RECONSTRUCTED | §9 the forecastle lookouts, well forward of the foremast |
| `crew_lookout_off_centre` | 1.6764 | — | RECONSTRUCTED | §9 one each side of the stem |
| `crew_rail_inset` | 0.62 | — | RECONSTRUCTED | §9 how far out toward the ship's side a man stands, as a fraction of the half-breadth at his station. He stands by the rail, not on the centreline |
| `crew_top_inset` | 0.55 | — | RECONSTRUCTED | §9 how far out on the top platform a man stands, as a fraction of its half-breadth |
| `crew_coat_tail_drop` | 0.34 | — | RECONSTRUCTED | §9 how far an officer's coat tails hang below his waist, as a fraction of his leg. The tailed coat is the officer silhouette — take it away and he is a seaman in better cloth |
| `crew_jacket_drop` | 0.1 | — | RECONSTRUCTED | §9 a seaman's jacket ends just below the hip and no lower. It is cut short so that it does not foul him when he goes aloft |
| `crew_hat_brim` | 0.1143 | — | RECONSTRUCTED | §9 the brim of a round hat, beyond the crown all round. It is the widest thing about a man's head and the part that survives being three hundred pixels away |
| `crew_hat_crown` | 0.0889 | — | RECONSTRUCTED | §9 the crown of a low round hat, tarred against the weather |
| `crew_button_size` | 0.0279 | — | RECONSTRUCTED | §9 a brass coat button, a little over an inch across. The captain's are what the book remarks on, and a row of them down a light-blue coat is what picks him out |
| `crew_pipe_stem_length` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §9 the stem of a short clay pipe, which the captain smokes |
| `crew_pipe_bowl_height` | 0.0406 | 0 ft 1.6 in | RECONSTRUCTED | §9 the bowl of the pipe |
| `crew_cuff_depth` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §9 the facing colour at the wrist of an officer's coat, which is how a Dutch officer's facings show at a distance |
| `crew_cocked_hat_span` | 0.381 | — | RECONSTRUCTED | §9 across a cocked hat from point to point. Worn athwartships by an officer of this date, it is a wider mark than his shoulders and it is how he is known at a distance |
| `crew_neck_height` | 0.0635 | 0 ft 2.5 in | RECONSTRUCTED | §9 the neck, which is small and matters: without one the head sits on the shoulders like a ball on a wall |
| `crew_hand_length` | 0.1778 | 0 ft 7 in | RECONSTRUCTED | §9 the hand at the end of the sleeve. Bare skin at the end of a dark arm is what says the arm is an arm |
| `crew_queue_length` | 0.1778 | 0 ft 7 in | RECONSTRUCTED | §9 the tarred pigtail every seaman of this date wore down his back, and one of the few silhouette details that is unmistakably of the period rather than of any century |
| `crew_build_variation` | 0.05 | — | RECONSTRUCTED | §9 how much the height and breadth of a figure vary from man to man, as a fraction. Small — but thirteen men of exactly one height read as thirteen prints of one man, which is worse than any of them looking wrong |
| `crew_upper_arm_fraction` | 0.46 | — | RECONSTRUCTED | §9 shoulder to elbow as a fraction of the whole arm; the forearm and hand make up the rest |
| `crew_elbow_deg` | 24 | — | RECONSTRUCTED | §9 how far the forearm is carried in from the line of the upper arm when a man is simply standing. Nobody stands with a straight arm |
| `crew_elbow_helm_deg` | 52 | — | RECONSTRUCTED | §9 at the wheel his elbows are well bent, because the spokes are close in front of him |
| `crew_elbow_haul_deg` | 64 | — | RECONSTRUCTED | §9 hauling, his hands come in toward his chest |
| `crew_thigh_fraction` | 0.52 | — | RECONSTRUCTED | §9 hip to knee as a fraction of the leg |
| `crew_knee_deg` | 11 | — | RECONSTRUCTED | §9 knees soft against the roll. A man on a moving deck never locks them, and it is the difference between a figure standing on the deck and one balanced on it |
| `crew_head_taper` | 0.72 | — | RECONSTRUCTED | §9 how much narrower the head is at the crown than at the jaw, which is what stops it reading as a cube |
| `crew_arm_rest_deg` | 8 | — | RECONSTRUCTED | §9 arms hanging, a little forward of the body, which is where a man's arms are when he is not using them |
| `crew_arm_rest_splay_deg` | 7 | — | RECONSTRUCTED | §9 and a little out from his sides, over his hips |
| `crew_arm_helm_deg` | -62 | — | RECONSTRUCTED | §9 forward and down onto the spokes of the wheel, which stands about chest high |
| `crew_arm_helm_splay_deg` | 10 | — | RECONSTRUCTED | §9 his hands are the width of the wheel apart |
| `crew_arm_reach_deg` | -58 | — | RECONSTRUCTED | §9 one hand out to a shroud or a rail, which is what every man on a wet deck has hold of |
| `crew_arm_reach_splay_deg` | 34 | — | RECONSTRUCTED | §9 and out to the side, because what he is holding is beside him |
| `crew_arm_haul_deg` | -74 | — | RECONSTRUCTED | §9 hauling on a fall: both arms forward, hands together |
| `crew_arm_haul_splay_deg` | 15 | — | RECONSTRUCTED | §9 hands a little apart on the rope, one above the other |
| `crew_haul_lean_deg` | 9 | — | RECONSTRUCTED | §9 a man hauling puts his weight back against the rope. It is the lean and not the arms that says what he is doing |
| `crew_count` | 24 | — | RECONSTRUCTED | §9 the watch on deck of a 74 with a company of about six hundred, in weather that has driven most of them below: four at the double wheel, four officers and the signal midshipman among them, two mizzen brace hands, two guns' crews of two, two main brace hands, two at the pumps, the boatswain, two lookouts and three topmen in the main top |
| `crew_lean_deg` | 6 | — | RECONSTRUCTED | §9 a man standing on a deck heeled and moving stands out of the vertical, braced against it. Figures standing bolt upright on a ship that is not upright are one of the plainest tells in a rendered scene |

### Motion

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `motion_whip_amplitude` | 0.55 | — | RECONSTRUCTED | §10 how far the main truck swings out of line at the height of a roll. Measured against her own mast: half a metre in forty-five is about a degree and a half of bend, which is what a rig this size takes |
| `motion_whip_exponent` | 2 | — | RECONSTRUCTED | §10 the bend goes as the square of the height above the deck, which is what a tapered spar loaded at its head does. Linear is wrong and reads as the whole ship leaning |
| `motion_whip_lag` | 0.55 | — | RECONSTRUCTED | §10 how far behind the hull's own roll the rig runs, in seconds. Without the lag the masts and the hull move as one piece, which is exactly the look this is meant to break |
| `motion_whip_period` | 7.4 | — | RECONSTRUCTED | §10 the rig's own period when nothing is driving it, in seconds — a slow working, so that a ship lying quietly is not perfectly still |
| `motion_sail_flutter` | 0.22 | — | RECONSTRUCTED | §10 how far the belly of a set sail moves, at the middle of it, in a hard breeze. A quarter of a metre on a sail ten metres across is a shiver, not a flap: a drawing sail is a taut curved surface and it must not billow like a bedsheet |
| `motion_sail_wave_length` | 3.4 | 11 ft 1.9 in | RECONSTRUCTED | §10 the length of the ripple that travels across a sail from luff to leech |
| `motion_sail_wave_speed` | 1.35 | — | RECONSTRUCTED | §10 ripples per second across a sail; the wave runs to leeward, as the wind does |
| `motion_sail_breathe` | 0.22 | — | RECONSTRUCTED | §10 how much the whole belly of a sail comes and goes with the gusts, as a fraction of the flutter. This is the slow one, and it is what separates canvas from a curved plate |
| `motion_sail_luff_shiver` | 2.2 | — | RECONSTRUCTED | §10 how much harder the leech of a sail shivers than its middle. The leech is the free edge and it is where the eye looks |
| `motion_rope_sway` | 0.1 | — | RECONSTRUCTED | §10 how far the middle of a shroud swings. A shroud is set up taut and moves very little; a slack brace or a buntline moves several times this, and the running rigging is given that multiple below |
| `motion_rope_period` | 2.6 | — | RECONSTRUCTED | §10 the period of a set-up shroud, in seconds |
| `motion_running_rope_factor` | 3 | — | RECONSTRUCTED | §10 running rigging is not set up taut and swings this many times as far as a shroud |
| `motion_brace_max_deg` | 55 | — | RECONSTRUCTED | §10 upper visual brace limit for this reconstructed rig, checked against the forward stays and set canvas. Each yard also has a lower geometric stop where its standing shrouds intervene. This is not a surveyed Surprise angle |
| `motion_brace_rate_deg` | 9 | — | RECONSTRUCTED | §10 degrees a second. Braces are hauled by hand by a watch on deck, so the yards come round slowly; a rig that snaps to a new angle the instant the wind shifts is the plainest possible statement that nobody is working the ship |
| `motion_flag_wave_speed` | 2.4 | — | RECONSTRUCTED | §10 how fast the wave runs down a flag, in wave lengths per second at the wind speed the model is drawn for. A flag is the fastest thing on the ship and the only part of her that moves at a speed the eye can follow |
| `motion_crew_sway_deg` | 3.5 | — | RECONSTRUCTED | §10 how far a man standing on a moving deck sways out of his own upright, over and above the heel of the ship he is standing on |
| `motion_crew_sway_period` | 4.2 | — | RECONSTRUCTED | §10 his period, in seconds — near the ship's roll but not locked to it, so that thirteen men do not sway as one |
| `motion_haul_period` | 1.9 | — | RECONSTRUCTED | §10 seconds for one pull. Men hauling together work to a call and a rhythm, and the rhythm is slow — a heave, a pause to get a fresh hold, and another |
| `motion_haul_swing_deg` | 22 | — | RECONSTRUCTED | §10 how far his shoulders travel through one pull. It is what turns a man posed as though he were hauling into a man who is hauling, and it is the only figure on deck that does anything but stand and sway |
| `motion_helm_throw_deg` | 140 | — | RECONSTRUCTED | §10 how far the wheel turns from midships to hard over. A little under half a turn each way, which is the usual four spokes |
| `motion_rudder_throw_deg` | 30 | — | RECONSTRUCTED | §10 visual hard-over blade angle about the raked sternpost; a reconstruction, not a measured Surprise steering stop |
| `motion_helmsman_reach_deg` | 26 | — | RECONSTRUCTED | §10 how far a helmsman's shoulders follow the wheel. His hands go round with the spokes and his body does not |
| `motion_wet_dry_seconds` | 9 | — | RECONSTRUCTED | §10 how long the topsides take to dry after a sea has been over them. It is slow, and it is what makes the wetness read as something that happened rather than as a setting |

### Other

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `hatch_tarpaulin_thickness` | 0.02 | 0 ft 0.8 in | RECONSTRUCTED | §6 tarred canvas over the gratings, held down by battens in cleats round the coaming. A grating is an open hole and a sea on deck goes straight through it |
| `hatch_tarpaulin_overhang` | 0.09 | — | RECONSTRUCTED | §6 the cloth is cut larger than the coaming and turned down over its sides, where the battens hold it |
| `hatch_batten_siding` | 0.05 | 0 ft 2 in | RECONSTRUCTED | §6 two inches square, wedged into cleats on the coaming |
| `lifeline_diameter` | 0.038 | 0 ft 1.5 in | RECONSTRUCTED | §6 an inch and a half rope, which is what a man's hand closes round comfortably |
| `lifeline_above_deck` | 0.95 | 3 ft 1.4 in | RECONSTRUCTED | §6 hand height on a moving deck: high enough to hold without stooping, low enough to fall against |
| `lifeline_sag` | 0.012 | — | RECONSTRUCTED | §6 set up taut, but no rope of this length is straight |
| `lifeline_from_centre` | 1.15 | — | RECONSTRUCTED | §6 how far off the centreline each of the two lines is run, so that a man crossing the waist has one within reach either way |
| `topsail_sheet_bitt_from_mast` | 1.0668 | — | SECONDARY | §6 Steel 1805 :17592, a pair forward of and a pair abaft the mast |
| `lifeline_stations` | 6 | — | RECONSTRUCTED | §6 the lifeline is rigged through this many stanchion points between the forecastle and the quarterdeck, so that it follows the gangway down and up again |
| `quarter_cutter_length` | 7.3152 | 24 ft 0 in | RECONSTRUCTED | §8.3 Steel 1805 / Lavery boat establishment for a 74, the second cutter, the same 24 ft as the first |
| `main_topgallant_head` | 0.9339 | — | RECONSTRUCTED | §4 Steel 1794 v1 p.42, masthead rule (5 in to the yard of the mast for the main and fore, 4 in for the mizzen and for the main and fore topmasts, 3 1/2 in for the mizzen topmast and the topgallants), applied to the §4 lengths |
| `fore_topgallant_head` | 0.8301 | — | RECONSTRUCTED | §4 Steel 1794 v1 p.42, masthead rule (5 in to the yard of the mast for the main and fore, 4 in for the mizzen and for the main and fore topmasts, 3 1/2 in for the mizzen topmast and the topgallants), applied to the §4 lengths |
| `mizzen_topgallant_head` | 0.6933 | — | RECONSTRUCTED | §4 Steel 1794 v1 p.42, masthead rule (5 in to the yard of the mast for the main and fore, 4 in for the mizzen and for the main and fore topmasts, 3 1/2 in for the mizzen topmast and the topgallants), applied to the §4 lengths |
| `topgallant_pole_tip_ratio` | 0.4 | — | SECONDARY | §4 Rijksmuseum Vrijheid model (NG-MC-500), seen in the museum's public-domain photographs: the pole tapers to a point above the shoulder; its diameter at the truck is two fifths of that at the hounds |
| `topgallant_shoulder_ratio` | 1.16 | — | SECONDARY | §4 Rijksmuseum Vrijheid model (NG-MC-500), seen in the museum's public-domain photographs: a small shoulder near the head of the pole, a sixth thicker than the spar below it |
| `topgallant_shoulder_fraction` | 0.03 | — | SECONDARY | §4 Rijksmuseum Vrijheid model (NG-MC-500), seen in the museum's public-domain photographs: and about a thirtieth of the pole's length deep |
| `topgallant_stay_above_hounds` | 0.6 | — | RECONSTRUCTED | §4 the topgallant stay is set up on the pole above the shoulder, at three fifths of the pole head, so that it leads clear above the yard and not through its sail |
| `crosstrees_width_fraction` | 0.125 | — | SECONDARY | §4 Rijksmuseum Vrijheid model (NG-MC-500), seen in the museum's public-domain photographs: light crosstrees, athwartships an eighth of the topmast's length |
| `crosstrees_length_ratio` | 0.8 | — | SECONDARY | §4 Rijksmuseum Vrijheid model (NG-MC-500), seen in the museum's public-domain photographs: and four fifths of that fore and aft |
| `top_length_ratio` | 0.9 | — | SECONDARY | §4 Rijksmuseum Vrijheid model (NG-MC-500), seen in the museum's public-domain photographs: the top is nearly square, so its length fore and aft is nine tenths of its breadth; Steel gives three quarters for a British top |
| `top_corner_radius_ratio` | 0.2 | — | SECONDARY | §4 Rijksmuseum Vrijheid model (NG-MC-500), seen in the museum's public-domain photographs: the corners are well rounded; a fifth of the breadth |
| `cap_breadth_ratio` | 2.1 | — | SECONDARY | §4 Rijksmuseum Vrijheid model (NG-MC-500), seen in the museum's public-domain photographs: the cap is a plain block, athwartships about twice the mast's diameter |
| `jib_clew_along_bowsprit` | 0.72 | — | RECONSTRUCTED | §4 the jib is sheeted in to the bowsprit, at about three quarters of its length, to bring its area to the 74 figure of Steel Table IV |
| `flying_jib_clew_along_bowsprit` | 0.97 | — | RECONSTRUCTED | §4 the flying jib is sheeted in to the bowsprit cap |

---

## 4. Hull form

Every station of the body plan was followed by machine off the archive's scan, calibrated
on the drawing's own scale of feet, and the ends of the ship closed on the traced stem and
sternpost rabbets (`docs/research/07-tracing.md`). The dead flat is drawn in both halves
of the body plan and the two agree to within a few centimetres.

| Quantity | Model | Record |
|---|---|---|
| Length on the lower deck | 50.68 m | 179 Amsterdam ft |
| Moulded breadth | 13.84 m | 48 9/11 ft = 13.82 m |
| Length on the waterline | 50.43 m | — |
| Draught, to the false keel | 5.82 m | not recorded; set by the Dutch rule for the lower ports |
| Displacement | 2282 t | not recorded |
| Block / midship / prismatic | 0.623 / 0.865 / 0.72 | full, as a Dutch hull is |

Half-breadths in metres, at 28 stations and 26 waterlines.
Station `z` is metres from the station of maximum breadth, negative forward. Waterline `y`
is metres above the design load waterline, so most are negative. `—` means the station does
not reach that waterline.

| station | z | rabbet y | y -5.02 | y -4.93 | y -4.85 | y -4.71 | y -4.57 | y -4.28 | y -4.00 | y -3.72 | y -3.43 | y -2.87 | y -2.30 | y -1.73 | y -1.17 | y -0.60 | y 0.00 | y 0.53 | y 1.10 | y 1.66 | y 2.23 | y 2.80 | y 3.36 | y 3.93 | y 4.49 | y 5.06 | y 5.63 | y 6.19 | lower deck y | half-b | top of side y | half-b |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| stem_c | -22.59 | -0.57 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 0.981 | 1.354 | 1.645 | 1.795 | 1.877 | 1.936 | 1.979 | 2.009 | 2.031 | 2.046 | 2.058 | 2.059 | 1.75 | 1.795 | 6.45 | 1.967 |
| stem_b | -22.05 | -2.27 | — | — | — | — | — | — | — | — | — | — | — | 0.776 | 1.274 | 1.746 | 2.209 | 2.549 | 2.845 | 3.053 | 3.193 | 3.294 | 3.366 | 3.417 | 3.454 | 3.481 | 3.500 | 3.503 | 1.73 | 3.053 | 6.45 | 3.410 |
| stem_a | -21.40 | -3.40 | — | — | — | — | — | — | — | — | — | 0.557 | 0.987 | 1.468 | 1.980 | 2.504 | 3.026 | 3.413 | 3.753 | 4.015 | 4.200 | 4.332 | 4.427 | 4.495 | 4.543 | 4.578 | 4.603 | 4.607 | 1.70 | 4.015 | 6.45 | 4.515 |
| 0 | -20.75 | -3.94 | — | — | — | — | — | — | — | 0.335 | 0.497 | 0.884 | 1.355 | 1.892 | 2.463 | 3.050 | 3.634 | 4.068 | 4.449 | 4.755 | 4.973 | 5.130 | 5.242 | 5.322 | 5.380 | 5.421 | 5.450 | 5.455 | 1.67 | 4.756 | 6.45 | 5.363 |
| 1 | -20.01 | -4.45 | — | — | — | — | — | 0.313 | 0.492 | 0.694 | 0.928 | 1.433 | 2.002 | 2.627 | 3.281 | 3.912 | 4.506 | 4.929 | 5.283 | 5.558 | 5.756 | 5.898 | 5.999 | 6.072 | 5.964 | 5.864 | 5.659 | 5.455 | 1.63 | 5.547 | 6.41 | 5.377 |
| 2 | -17.80 | -5.10 | 0.281 | 0.361 | 0.433 | 0.572 | 0.707 | 1.030 | 1.375 | 1.741 | 2.127 | 2.922 | 3.689 | 4.392 | 4.988 | 5.462 | 5.878 | 6.149 | 6.375 | 6.545 | 6.667 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.55 | 6.515 | 6.23 | 5.441 |
| 3 | -15.56 | -5.10 | 0.348 | 0.468 | 0.609 | 0.847 | 1.096 | 1.640 | 2.235 | 2.817 | 3.338 | 4.158 | 4.851 | 5.409 | 5.848 | 6.182 | 6.443 | 6.595 | 6.734 | 6.834 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.47 | 6.803 | 6.09 | 5.494 |
| 4 | -13.30 | -5.05 | 0.417 | 0.602 | 0.806 | 1.180 | 1.608 | 2.547 | 3.328 | 3.892 | 4.344 | 5.030 | 5.524 | 5.949 | 6.285 | 6.526 | 6.682 | 6.763 | 6.835 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.40 | 6.861 | 5.95 | 5.543 |
| 5 | -11.07 | -5.13 | 0.469 | 0.729 | 1.037 | 1.724 | 2.527 | 3.605 | 4.243 | 4.687 | 5.015 | 5.496 | 5.878 | 6.237 | 6.506 | 6.688 | 6.794 | 6.851 | 6.897 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.35 | 6.885 | 5.83 | 5.585 |
| 6 | -8.82 | -5.05 | 0.525 | 0.885 | 1.390 | 2.823 | 3.532 | 4.277 | 4.766 | 5.127 | 5.390 | 5.806 | 6.122 | 6.403 | 6.626 | 6.762 | 6.853 | 6.899 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.30 | 6.887 | 5.74 | 5.620 |
| 7 | -6.58 | -5.13 | 0.649 | 1.144 | 2.214 | 3.588 | 4.128 | 4.715 | 5.117 | 5.414 | 5.655 | 6.024 | 6.298 | 6.524 | 6.694 | 6.808 | 6.877 | 6.906 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.27 | 6.889 | 5.66 | 5.648 |
| 8 | -4.33 | -5.10 | 0.703 | 1.441 | 3.009 | 4.061 | 4.432 | 4.932 | 5.307 | 5.581 | 5.809 | 6.166 | 6.405 | 6.603 | 6.739 | 6.835 | 6.900 | 6.897 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.25 | 6.890 | 5.63 | 5.658 |
| 9 | -2.09 | -5.13 | 0.847 | 1.841 | 3.639 | 4.260 | 4.609 | 5.077 | 5.418 | 5.695 | 5.918 | 6.252 | 6.469 | 6.651 | 6.767 | 6.853 | 6.914 | 6.906 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.24 | 6.890 | 5.63 | 5.657 |
| 10 | 0.00 | -5.10 | 0.969 | 2.636 | 3.869 | 4.385 | 4.703 | 5.147 | 5.473 | 5.743 | 5.968 | 6.291 | 6.502 | 6.677 | 6.785 | 6.869 | 6.922 | 6.955 | 6.978 | 6.979 | 6.973 | 6.899 | 6.767 | 6.583 | 6.433 | 6.370 | 6.239 | — | 1.25 | 6.979 | 5.65 | 6.234 |
| 11 | 2.07 | -5.13 | 0.604 | 2.330 | 3.839 | 4.364 | 4.686 | 5.147 | 5.473 | 5.731 | 5.949 | 6.294 | 6.536 | 6.674 | 6.776 | 6.864 | 6.919 | 6.906 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.26 | 6.889 | 5.66 | 5.647 |
| 12 | 4.32 | -5.08 | 0.604 | 1.720 | 3.582 | 4.248 | 4.595 | 5.079 | 5.412 | 5.673 | 5.882 | 6.234 | 6.487 | 6.659 | 6.779 | 6.864 | 6.916 | 6.906 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.28 | 6.888 | 6.65 | 5.290 |
| 13 | 6.56 | -4.99 | — | 1.414 | 2.498 | 3.886 | 4.321 | 4.888 | 5.182 | 5.472 | 5.707 | 6.077 | 6.357 | 6.556 | 6.702 | 6.810 | 6.895 | 6.906 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.32 | 6.886 | 6.70 | 5.271 |
| 14 | 8.82 | -5.13 | 0.604 | 1.098 | 1.677 | 2.953 | 3.751 | 4.499 | 4.953 | 5.270 | 5.533 | 5.920 | 6.228 | 6.454 | 6.625 | 6.755 | 6.863 | 6.906 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.37 | 6.883 | 6.80 | 5.238 |
| 15 | 11.04 | -5.05 | 0.505 | 0.836 | 1.215 | 1.932 | 2.705 | 3.808 | 4.410 | 4.839 | 5.163 | 5.620 | 5.967 | 6.229 | 6.441 | 6.631 | 6.769 | 6.872 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.43 | 6.880 | 6.89 | 5.206 |
| 16 | 13.27 | -5.10 | 0.446 | 0.658 | 0.919 | 1.379 | 1.841 | 2.809 | 3.666 | 4.198 | 4.577 | 5.174 | 5.610 | 5.939 | 6.210 | 6.404 | 6.525 | 6.892 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.50 | 6.877 | 7.02 | 5.158 |
| 17 | 15.50 | -5.13 | 0.375 | 0.534 | 0.701 | 0.993 | 1.302 | 1.966 | 2.627 | 3.275 | 3.788 | 4.522 | 5.122 | 5.532 | 5.894 | 6.206 | 6.463 | 6.618 | 6.761 | 6.864 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.58 | 6.851 | 7.16 | 5.107 |
| 18 | 17.76 | -5.13 | 0.330 | 0.453 | 0.566 | 0.772 | 0.985 | 1.422 | 1.873 | 2.329 | 2.787 | 3.653 | 4.359 | 4.957 | 5.478 | 5.891 | 6.210 | 6.387 | 6.551 | 6.668 | 6.752 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.68 | 6.670 | 7.33 | 5.044 |
| 19 | 20.01 | -5.13 | 0.330 | 0.453 | 0.566 | 0.772 | 0.871 | 1.066 | 1.314 | 1.629 | 1.956 | 2.643 | 3.430 | 4.187 | 4.862 | 5.443 | 5.857 | 6.073 | 6.239 | 6.372 | 6.467 | 6.535 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.78 | 6.395 | 7.50 | 4.986 |
| 20 | 22.24 | -5.05 | 0.250 | 0.295 | 0.352 | 0.444 | 0.532 | 0.715 | 0.907 | 1.108 | 1.315 | 1.766 | 2.356 | 3.140 | 3.971 | 4.742 | 5.311 | 5.605 | 5.800 | 5.961 | 6.076 | 6.158 | 6.217 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.90 | 6.013 | 7.69 | 4.915 |
| 21 | 24.51 | -5.08 | 0.209 | 0.232 | 0.261 | 0.311 | 0.360 | 0.464 | 0.563 | 0.680 | 0.798 | 1.051 | 1.389 | 1.873 | 2.573 | 3.472 | 4.357 | 5.245 | 5.768 | 6.143 | 6.411 | 6.603 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 2.03 | 6.326 | 7.92 | 4.833 |
| 22 | 26.69 | -3.93 | — | — | — | — | — | — | — | 0.350 | 0.412 | 0.547 | 0.728 | 0.989 | 1.368 | 1.859 | 2.349 | 2.845 | 3.148 | 3.373 | 3.542 | 3.670 | 3.609 | 3.448 | 3.316 | 3.260 | 3.147 | 3.033 | 2.17 | 3.542 | 8.15 | 2.329 |
| post_a | 27.24 | -3.63 | — | — | — | — | — | — | — | — | 0.301 | 0.339 | 0.458 | 0.630 | 0.883 | 1.214 | 1.552 | 1.899 | 2.123 | 2.296 | 2.433 | 2.543 | 2.502 | 2.390 | 2.299 | 2.260 | 2.181 | 2.102 | 2.20 | 2.433 | 8.22 | 1.371 |
| post_b | 27.58 | -3.45 | — | — | — | — | — | — | — | — | 0.301 | 0.301 | 0.301 | 0.301 | 0.415 | 0.606 | 0.817 | 1.039 | 1.205 | 1.347 | 1.468 | 1.574 | 1.551 | 1.482 | 1.425 | 1.401 | 1.352 | 1.303 | 2.23 | 1.468 | 8.26 | 0.559 |


---

## 5. Materials and paint

Colours are sRGB hex as they should appear under neutral light. She is black all over, with
tarred wales, a white-stuff bottom, red ochre linings and ochre-and-gilt carving.

| key | colour | roughness | metalness | source |
|---|---|---|---|---|
| `topside_black` | #191512 | 0.52 | 0 | FICTIONAL §1 "black-hulled"; SECONDARY §6 Toussaint's drawing of the Batavian 74 Jupiter, 1800: the whole hull dark grey-black, no bands |
| `wale` | #120F0D | 0.4 | 0 | SECONDARY §6 the wales black on the Vrijheid and NG-MC-661 models; tarred, glossier than the paint |
| `ochre_trim` | #CB9C55 | 0.55 | 0 | SECONDARY §8 yellow ochre in oil, the Victory ochre (NCS S 3020-Y40R), taken at pigment strength; renders inside the photograph's sampled #dba55d-#f8cf7d under both the sea and the studio rig |
| `inboard_red` | #913832 | 0.65 | 0 | SECONDARY §8 red ochre for inboard works and port linings, not Venetian red |
| `boot_top` | #2A2018 | 0.7 | 0 | SECONDARY §8 exposed plank above the sheathing, algae-stained |
| `copper` | #BDB49C | 0.82 | 0 | RECONSTRUCTED §6 white stuff — tallow, sulphur and lime — over an unsheathed bottom, dirtied by a passage; the Rijksmuseum's c.1806 half model of a 74 is white below the water, and the Staten-Generaal was still uncoppered in 1790. The key keeps its old name so the hull code is unchanged |
| `copper_bright` | #F7BC9E | 0.35 | 0 | SECONDARY §8 new copper, used for the nail heads |
| `copper_dark` | #6F6A55 | 0.85 | 0 | RECONSTRUCTED §6 white stuff washed thin and greened by weed |
| `bottom_sheathed` | false | — | — | RECONSTRUCTED §6 the plan's default: a white bottom, not copper |
| `bottom_metalness` | 0 | — | — | RECONSTRUCTED §6 white stuff is not a metal |
| `white_stuff_blotch` | 0.35 | — | — | RECONSTRUCTED §6 how strongly the hand-paid stuff is blotched |
| `copper_line_above_wl_v` | 0.015 | — | — | MEASURED §8 the main wale's lower edge is 15.2 ft above the moulded base line, 2.4 ft above the load waterline; the sheathing was carried to 2 ft 6 in - 3 ft, so the two coincide |
| `copper_sheets_along` | 10 | — | — | SECONDARY §8 ten sheets 4 ft long fit one 40 ft hull texture repeat; UV scale and sheet count must be changed together |
| `copper_sheets_up` | 26 | — | — | SECONDARY §8 sheets 14 in on the short edge; the courses that fit between the keel and the sheathing line, counted over the whole V range of the base map |
| `copper_lap_relief` | 0.34 | — | — | RECONSTRUCTED §8 the doubling at a sheet lap is one thickness of sheet copper; tuned so the laps are legible at beam distance and do not read as corrugation |
| `copper_nail_relief` | 0.55 | — | — | RECONSTRUCTED §8 a raised nail head; tuned so the nails catch the sun at beam distance |
| `hull_map_metres` | 12.192 | — | — | RECONSTRUCTED §8 one 40 ft repeat holds ten 4 ft copper sheets or two 20 ft planks; weathering density is counted per metre within this repeat |
| `hull_plank_relief` | 0.55 | — | — | RECONSTRUCTED §8 how much of the planking's own light and shade is read as height for the normal map. At 1.0 every board stands a hand's breadth proud of the one beside it; this is the strength at which a seam catches the sun and a plank does not |
| `hull_normal_scale` | 1.15 | — | — | RECONSTRUCTED §8 the normal map is built from a height map whose relief is already scaled by the two rows above, so this stays near unity. At the old 0.4 the copper nails were invisible at every distance |
| `copper_pattern_depth` | 0.62 | — | — | RECONSTRUCTED §8 how strongly the sheathing pattern modulates the base colour. Copper carries its own colour through the metalness map rather than through the base map, so its pattern is allowed to bite far harder than paint on planking does; at the old 0.42 the sheets were invisible at beam distance |
| `copper_sheet_variation` | 0.16 | — | — | RECONSTRUCTED §8 no two sheets weather alike, and it is the spread between them that stops the bottom reading as one printed panel |
| `hull_rough_pattern_var` | 0.09 | — | — | RECONSTRUCTED §8 how much the hull's planking and sheathing patterns are allowed to modulate its own roughness map, the same technique combinePlankAndPaint uses for colour: a plank seam that catches a shadow is a real crack and holds less of a sheen than the smooth face beside it |
| `paint_wear_roughness` | 0.5 | — | — | RECONSTRUCTED §8 tuned in a close crop of a belaying pin and a port-lid hinge strap so the polished patches catch a visible highlight without the whole surface looking varnished |
| `surface_roughness_grain` | 0.05 | — | — | RECONSTRUCTED §8 the amplitude of a fine, all-over roughness noise applied on top of the paint, the deck and the bright spars, standing in for the thousand small differences a real painted or oiled surface has that no drawn feature accounts for — the same reasoning paintedSurface gives for its own wear layer, aimed at finish instead of colour |
| `detail_normal_cell` | 9 | — | — | RECONSTRUCTED §8 the noise lattice's cell size in texture pixels; coarse enough to compress reasonably, still fine enough to read as grain rather than as the macro relief's own pattern repeated |
| `detail_normal_strength` | 2.4 | — | — | RECONSTRUCTED §8 the contrast fed to normalFrom for the detail height field; tuned so the grain is visible in a close crop of the beam view without becoming visible in the same crop of the whole-ship view, where it should disappear into the ordinary texel noise a screen has anyway |
| `detail_normal_blend` | 0.6 | — | — | RECONSTRUCTED §8 how strongly the detail's tilt is added to the macro map's own in the whiteout blend; at 1.0 the fine grain competed with the plank seams and copper laps for attention instead of sitting quietly under them |
| `ochre_strake_below_sill_v` | 0.008 | — | — | MEASURED §8 the ochre strake carries the port band, sills at 20.4 ft and heads at 22.8 ft above base; black above the wale and again above the port heads |
| `ochre_strake_above_head_v` | 0.004 | — | — | MEASURED §8 the channel-wale band above the port heads is black, 22.9 to 24.1 ft above base. The strake is carried just clear of the port heads and no further: the band between the heads and the rail is narrow, and any more ochre than this closes it up and the ship stops reading as black |
| `ochre_moulding_v` | 0.006 | — | — | MEASURED §8 a moulding about 4 in deep on a topside whose V range spans some 22 ft; the reference photograph shows one such line on the sheer and none above the port heads |
| `deck` | #C9BCA4 | 0.72 | 0 | SECONDARY §8 holystoned deck planking |
| `deck_seam` | #3A332A | 0.8 | 0 | SECONDARY §8 pitched caulking |
| `timber` | #8A6A44 | 0.7 | 0 | SECONDARY §8 oak, bright |
| `mast_bright` | #9C7A4E | 0.38 | 0 | SECONDARY §8 lower masts varnished bright |
| `mast_black` | #1C1613 | 0.55 | 0 | SECONDARY §8 mastheads, caps, tops and yards blacked |
| `boat_white` | #E4E8DC | 0.55 | 0 | SECONDARY §8 white lead; the photo shows the boats white |
| `gilt` | #D4AF37 | 0.32 | 0 | SECONDARY §8 gilt on head, taffrail and quarter badges, matching the reference model |
| `iron` | #1A1A1A | 0.65 | 0.7 | SECONDARY §8 blacked wrought iron |
| `brass` | #F9E596 | 0.3 | 0 | SECONDARY §8 bell and sheaves |
| `glazing` | #DDE6E0 | 0.08 | 0 | SECONDARY §8 crown glass, faint green cast |
| `sail` | #D6CDB6 | 0.85 | 0 | SECONDARY §8 weathered flax; the photo samples #ddd6c4 lit and #a89880 shaded |
| `sail_seam` | #C6BDA7 | 0.88 | 0 | SECONDARY §8 seams between cloths |
| `sail_glow` | 0.055 | — | — | RECONSTRUCTED §8 flax canvas is translucent backlit; the emission that replaces it is tuned against the reference photograph, in which the sails glow faintly and are opaque |
| `sail_glow_tint` | #FFEFD2 | — | 0 | RECONSTRUCTED §8 light through flax picks up the warmth of the cloth, so the glow is warmer than the cloth itself |
| `sail_sheen` | 0.55 | — | — | RECONSTRUCTED §8 tuned against the beam view so the topsails pick up a visible grazing highlight without the whole suit turning satin |
| `sail_sheen_roughness` | 0.6 | — | — | RECONSTRUCTED §8 the roughness of the sheen lobe itself, distinct from the cloth's own diffuse roughness; a sheen roughness this far below 1 is what keeps the highlight a narrow band along the weave rather than a general brightening of every sail alike |
| `rigging_tarred` | #2A211A | 0.85 | 0 | SECONDARY §8 standing rigging, tarred hemp |
| `rigging_hemp` | #A89574 | 0.9 | 0 | SECONDARY §8 running rigging, untarred hemp |
| `ensign_blue` | #22375E | 0.9 | 0 | SECONDARY §8 blue ensign bunting, desaturated from the Flag Institute blue |
| `ensign_red` | #A32D34 | 0.9 | 0 | SECONDARY §8 bunting red |
| `ensign_white` | #E8E2D4 | 0.9 | 0 | SECONDARY §8 bunting white |
| `ensign_tricolour_blue` | #2F4F94 | 0.9 | 0 | RECONSTRUCTED §5 the blue of the Dutch and French tricolours, a brighter cobalt than the British ensign navy, faded a little as working wool bunting is |
| `slop_tarpaulin` | #3A342B | 0.88 | 0 | RECONSTRUCTED §9 a seaman's foul-weather rig is canvas soaked in tar and oil: near-black, and darker still when it is wet, which on this ship it always is |
| `slop_jacket` | #2E3A46 | 0.86 | 0 | RECONSTRUCTED §9 the short blue jacket of the purser's slop issue — "jackets, blue cloth" — which ends at the hip and is the seaman's own silhouette, quite unlike an officer's tailed coat |
| `slop_duck` | #C6C0AC | 0.9 | 0 | RECONSTRUCTED §9 trousers and shirt of white duck, greyed by salt and wear. It is the pale half of every figure on deck and it is what makes them read as people rather than as posts |
| `slop_wet_duck` | #8C8879 | 0.92 | 0 | RECONSTRUCTED §9 duck trousers soaked through under a tarpaulin jacket: much darker than dry, but nothing like as dark as the tar. A man dressed in one tone from hat to heel is a silhouette and not a person, and in this weather the trousers are the only light left on him |
| `slop_red` | #7C3B32 | 0.88 | 0 | RECONSTRUCTED §9 the red waistcoat of the slop list, worn by perhaps one man in four and worth having for that reason: thirteen men dressed alike are thirteen copies of one man |
| `crew_skin` | #A97D5E | 0.72 | 0 | RECONSTRUCTED §9 a seaman's face and hands after a year in the open: weathered a long way past whatever he started as |
| `officer_coat` | #1E2A44 | 0.82 | 0 | RECONSTRUCTED §9 undress blue coat, faded by sun and salt from the deep indigo of a new one |
| `officer_facing` | #D8D2C2 | 0.84 | 0 | RECONSTRUCTED §9 white lapels, waistcoat and breeches. On a dark coat they are what says "officer" from clear across the deck, before any detail of the man is visible at all |
| `dutch_captain_coat` | #86A9D2 | 0.82 | 0 | FICTIONAL §1 the book's Dutch captain wears a light-blue coat with brass buttons; faded a little by salt and sun |
| `dutch_facing_light_blue` | #6F93C2 | 0.84 | 0 | RECONSTRUCTED §9 light-blue collar, cuffs and lapels on a Dutch officer's dark blue coat; the facings of 1811 are not documented, so this is the better-known of the two colours the brief names |
| `dutch_facing_red` | #9C2F33 | 0.84 | 0 | RECONSTRUCTED §9 red collar and cuffs on a Dutch officer's dark blue coat, the alternative to light blue |
| `dutch_button_brass` | #C9A24B | 0.45 | 0 | RECONSTRUCTED §9 the brass buttons of an officer's coat; the captain's are what the book remarks on |
| `weather_rust` | #7A3A18 | — | 0 | RECONSTRUCTED §8 wet iron oxide on paint: redder and darker than dry rust, which is what runs from a chain bolt in a seaway |
| `weather_rust_alpha` | 0.42 | — | — | RECONSTRUCTED §8 strong enough to read on a black topside at gameplay range; above about 0.55 the ship looks derelict rather than used |
| `weather_rust_roughness` | 0.82 | — | — | RECONSTRUCTED §8 tuned so a rust run still reads as a change of finish, not only of hue, under the beam view's raking light |
| `weather_salt` | #C6C2B4 | — | 0 | RECONSTRUCTED §8 dried salt: not white, but a grey-buff bloom that takes the depth out of black paint |
| `weather_salt_alpha` | 0.2 | — | — | RECONSTRUCTED §8 enough to lift the topsides where the sea has been over them and leave the rail dark |
| `weather_salt_roughness` | 0.68 | — | — | RECONSTRUCTED §8 above topside_black's 0.50 by enough to catch a highlight the black paint round it does not |
| `weather_slime` | #2C3524 | — | 0 | RECONSTRUCTED §8 weed and slime in the wind-and-water band, green-black rather than green |
| `weather_slime_alpha` | 0.55 | — | — | RECONSTRUCTED §8 the dirtiest line on the ship, and the single strongest cue that a hull has been floating rather than standing on a bench |
| `weather_slime_band_v` | 0.075 | — | — | RECONSTRUCTED §8 how far above the copper line and below the load line the wind-and-water band reaches, as a fraction of the hull's paint coordinate. A ship in a seaway wets a band far wider than her still waterline |
| `weather_slime_roughness` | 0.25 | — | — | RECONSTRUCTED §8 close to wet_roughness (0.13), the value the runtime spray layer uses for a sea that has just come aboard; held a little higher because this band is only wet on average, not at the instant of a render |
| `weather_verdigris` | #4C6B4E | — | 0 | RECONSTRUCTED §8 copper goes brown within weeks and mottled green within a commission; without this the sheathing reads as brick-red paint |
| `weather_verdigris_alpha` | 0.26 | — | — | RECONSTRUCTED §8 mottled, not covered — the bottom must still read as metal, and metal is what the metalness map says it is |
| `weather_verdigris_roughness` | 0.6 | — | — | RECONSTRUCTED §8 oxide films read matte; well above copper's own 0.44 |
| `weather_grime` | #231D16 | — | 0 | RECONSTRUCTED §8 the black wash off a wet ship: tar, soot from the galley funnel, and dirt |
| `weather_grime_alpha` | 0.3 | — | — | RECONSTRUCTED §8 weaker than the rust and there is much more of it |
| `weather_grime_roughness` | 0.32 | — | — | RECONSTRUCTED §8 below topside_black's 0.50, but not as smooth as the wind-and-water band itself: this runs and dries between wettings, the band alongside it never fully does |
| `weather_streak_density` | 1.1 | — | — | RECONSTRUCTED §8 streaks per texel of texture width, scaled per line of ironwork. Tuned so that the streaks read as many at a distance and as individual runs from alongside |
| `weather_deck_wet` | #4A4335 | — | 0 | RECONSTRUCTED §8 wet deck planking is several times darker than dry, and a deck in a gale is wet |
| `weather_deck_wet_alpha` | 0.34 | — | — | RECONSTRUCTED §8 patchy rather than uniform; a uniformly wet deck is as flat-looking as a uniformly dry one |
| `weather_deck_wet_roughness` | 0.22 | — | — | RECONSTRUCTED §8 close to wet_roughness (0.13); held a little higher because a deck patch is wet on average across a render rather than at the instant a sea crosses it |
| `weather_deck_bleach_alpha` | 0.16 | — | — | RECONSTRUCTED §8 the pale patches the holystone leaves, which are what make the dark ones read as wet |
| `weather_deck_bleach_roughness` | 0.62 | — | — | RECONSTRUCTED §8 below the deck's own 0.72 by a small margin, tuned so the bleached patches read as worn wood rather than as a second coat of paint |
| `weather_deck_tar_roughness` | 0.18 | — | — | RECONSTRUCTED §8 pitch in the sun has a real gloss to it; set below weather_deck_wet_roughness so a tar spot still reads as a distinct, harder mark against a merely wet plank |
| `weather_sail_stain` | #8C7F63 | — | 0 | RECONSTRUCTED §8 water staining and general dirt in old flax canvas |
| `weather_sail_stain_alpha` | 0.13 | — | — | RECONSTRUCTED §8 enough that no two square feet of a sail are the same colour |
| `weather_sail_stain_roughness` | 0.94 | — | — | RECONSTRUCTED §8 above the cloth's own 0.85-0.88; tuned against the beam view so a stained cloth catches less of the sun than the bolt beside it |
| `weather_mildew` | #5B5540 | — | 0 | RECONSTRUCTED §8 mildew in canvas handed wet, worst at the foot |
| `weather_mildew_roughness` | 0.96 | — | — | RECONSTRUCTED §8 the roughest mark on the whole suit of canvas, which is right for a growth sitting on top of the weave rather than a discolouration inside it |
| `weather_sail_patch` | #CFC7B0 | — | 0 | RECONSTRUCTED §8 a patch is newer cloth than the sail round it, so it is lighter, not darker |
| `weather_sail_patch_alpha` | 0.16 | — | — | RECONSTRUCTED §8 visible as a change of cloth at a cable's distance, not as a white rectangle |
| `weather_sail_patch_roughness` | 0.76 | — | — | RECONSTRUCTED §8 below the cloth's own 0.85-0.88, the same direction newer canvas moves in relative to old |
| `weather_sail_variants` | 2 | — | — | RECONSTRUCTED §8 the cloth map is drawn as a grid of this many independent variants and each sail is given one, because fifteen sails carrying the same patch in the same place is the most obvious tell that a suit of canvas came out of a generator |
| `weather_bow_extra` | 0.55 | — | — | RECONSTRUCTED §8 how much harder the bow is used than amidships. Everything forward of the fore channels is in the sea every time she pitches, and it is the one part of a ship whose paint never lasts a commission |
| `weather_stern_extra` | 0.25 | — | — | RECONSTRUCTED §8 the quarters take the wash off the deck and the scour of the rudder, but not the beating the bow takes |
| `weather_length_tint` | #6E6255 | — | 0 | RECONSTRUCTED §8 what the extra wear at the ends darkens toward: dirty bare timber showing through beaten paint, not a colour of its own |
| `weather_boot_darkening` | 0.35 | — | — | RECONSTRUCTED §8 the whole ship is darker low down and lighter toward the rail, because water runs down and the sun dries the top. It is a small gradient and it does more than it sounds: it is what stops the topsides reading as one flat band of paint |
| `wet_darken` | 0.55 | — | — | RECONSTRUCTED §8 wet paint and wet timber are about half the brightness of dry; measured off any photograph of a ship in a seaway |
| `wet_roughness` | 0.13 | — | — | RECONSTRUCTED §8 a film of water is nearly smooth, and the specular sheet it puts on the topsides is what actually says "wet" — the darkening alone reads as a repaint |
| `wet_line_v` | 0.8 | — | — | RECONSTRUCTED §8 how far up the hull's paint coordinate the sea reaches when she is running hard: to about the sheer strake, which is where the rail begins |
| `sun_colour` | #FFF1DA | — | 0 | RECONSTRUCTED §8 direct sunlight a few hours off noon, about 5000 K |
| `sun_intensity` | 2.6 | — | — | RECONSTRUCTED §8 bright enough for a sunny day, not so bright that the deck, the boats and the canvas clip to white and lose their colour |
| `sun_distance` | 70 | — | — | RECONSTRUCTED §8 far enough outside a ship 59 m over all that the shadow camera can see all of her |
| `sea_sun_azimuth_deg` | 296 | — | — | RECONSTRUCTED §8 a little forward of the port beam, so that the side the verification views look at is the lit side and the rig throws its shadow away from the camera |
| `sea_sun_elevation_deg` | 34 | — | — | RECONSTRUCTED §8 low enough to light the topsides rather than only the deck, high enough that the sail plan does not shade the whole ship |
| `studio_sun_azimuth_deg` | 308 | — | — | RECONSTRUCTED §8 matched to the key light in the reference photograph, which comes over the photographer's left shoulder |
| `studio_sun_elevation_deg` | 44 | — | — | RECONSTRUCTED §8 matched to the reference photograph, where the shadows under the channels are short |
| `sea_sky_colour` | #E6DCC6 | — | 0 | RECONSTRUCTED §8 the warm haze low in a sunny sky, which is the part of it a ship's side actually sees; tuned so sunlit canvas lands on the photograph's #ddd6c4 |
| `sea_water_colour` | #4A5A56 | — | 0 | RECONSTRUCTED §8 bounce off the sea: dark, and green-grey rather than blue, so that it does not tint the black topsides |
| `sea_fill_intensity` | 0.62 | — | — | RECONSTRUCTED §8 enough that the black topsides are not a silhouette, little enough that the sun still decides the colour of everything it touches |
| `studio_sky_colour` | #F0DCB4 | — | 0 | RECONSTRUCTED §8 the warm backdrop of the reference photograph |
| `studio_floor_colour` | #8A7250 | — | 0 | RECONSTRUCTED §8 bounce off the photographer's warm sweep |
| `studio_fill_intensity` | 0.85 | — | — | RECONSTRUCTED §8 the reference photograph is lit softly; its shadows are open |
| `rim_colour` | #BFD2E2 | — | 0 | RECONSTRUCTED §8 open sky on the shaded side |
| `rim_intensity` | 0.22 | — | — | RECONSTRUCTED §8 an edge, not a second key; at 0.35 with a colder colour it was half of why the shaded canvas sampled #7e9bb0 |
| `rim_azimuth_deg` | 110 | — | — | RECONSTRUCTED §8 on the starboard quarter, opposite the sun |
| `rim_elevation_deg` | 32 | — | — | RECONSTRUCTED §8 a horizontal sea mirrors a light straight back at the camera when the light stands at the angle the camera looks down at the water. At 14 degrees that put a wall of glare across the quarter of every sea render, so the rim is carried above the band the water can return |
| `sea_env_colour` | #B9B4A2 | — | 0 | RECONSTRUCTED §8 the whole sky and sea averaged as seen from a hull: warm haze, not the blue of the zenith. It is what the copper reflects |
| `studio_env_colour` | #DCC199 | — | 0 | RECONSTRUCTED §8 the reference photograph's backdrop, averaged |
| `env_sun_colour` | #FFF6E4 | — | 0 | RECONSTRUCTED §8 the sun's own disc in the environment, which is what gives copper and gilt a highlight to catch |
| `env_sun_extent` | 34 | — | — | RECONSTRUCTED §8 the card is 34 m across at 55 m, about 35 degrees. Wider than the real sun by a long way, because a half-degree disc survives neither the PMREM blur nor a roughness of 0.44 — but small enough that the sea does not mirror it as a wall of white |
| `env_sun_elevation_deg` | 58 | — | — | RECONSTRUCTED §8 the card is carried well above the sun's own elevation on purpose. It is there to give the copper and the gilt a highlight, and at the sun's real height the sea mirrors it straight back into the camera as a glare path |
| `hull_env_intensity` | 1.8 | — | — | RECONSTRUCTED §8 the copper band is metal, so the environment is the only thing that lights it at all; tuned so the sheathing lands near the photograph's #982f0f-#93401e rather than a third of that |
| `sea_surface_colour` | #153549 | — | 0 | RECONSTRUCTED §8 deep water on a sunny day, dark enough that a black hull still reads against it |
| `sea_surface_roughness` | 0.4 | — | — | RECONSTRUCTED §8 a light chop rather than a mirror; at 0.16 the sun's path across the water came back as a hard white wall |
| `sea_surface_env_intensity` | 0.42 | — | — | RECONSTRUCTED §8 the water is held back from the environment so that warming the sky for the ship's sake does not bleach the sea |
| `storm_sun_colour` | #C8CCC9 | — | 0 | RECONSTRUCTED §8 the sun behind heavy overcast: not warm, not blue, and barely a direction at all |
| `storm_sun_intensity` | 1.7 | — | — | RECONSTRUCTED §8 a third of the fine-weather key. It is kept at all so that the ship still has a lit side and a shaded side; at zero she goes completely flat |
| `storm_sun_azimuth_deg` | 300 | — | — | RECONSTRUCTED §8 the same quarter as the fine-weather sun, so the two rigs can be compared |
| `storm_sun_elevation_deg` | 26 | — | — | RECONSTRUCTED §8 low: in this weather the brightest part of the sky is the horizon under the cloud base |
| `storm_sky_colour` | #BAC1C0 | — | 0 | RECONSTRUCTED §8 the overcast overhead, which in a gale is the whole of the light there is |
| `storm_water_colour` | #3A4A4C | — | 0 | RECONSTRUCTED §8 bounce off a black sea: almost nothing, and cold |
| `storm_fill_intensity` | 2.5 | — | — | RECONSTRUCTED §8 four times the fine-weather fill, because here it is not fill — it is the key. A daylight gale is a bright grey day, not a dark one: the mistake to avoid is lighting it for the mood rather than for the hour, which gives a ship at two in the afternoon the exposure of one at dusk |
| `storm_env_colour` | #98A4A5 | — | 0 | RECONSTRUCTED §8 what the copper and the wet paint reflect: grey sky, and a great deal of it |
| `storm_sky_top` | #6C787E | — | 0 | RECONSTRUCTED §8 the cloud base overhead, dark and even |
| `storm_sky_bottom` | #B2BAB9 | — | 0 | RECONSTRUCTED §8 the lighter band under the cloud at the horizon, which is where a gale keeps its light |
| `storm_sea_colour` | #273236 | — | 0 | RECONSTRUCTED §8 a Southern Ocean sea under cloud is nearly black, and its colour is almost entirely what it reflects |
| `storm_sea_roughness` | 0.62 | — | — | RECONSTRUCTED §8 rougher than a fine-weather sea: the surface is broken everywhere and mirrors nothing cleanly |
| `storm_sea_env_intensity` | 0.75 | — | — | RECONSTRUCTED §8 a broken sea under an even sky returns much of it, which is what makes a storm sea read as bright grey where it faces up and black where it faces away |
| `storm_wave_height` | 3.4 | — | — | RECONSTRUCTED §8 crest to trough in a Southern Ocean gale, in metres. It is the viewer's scenery and not part of the ship, but it decides how she sits: a frigate whose waterline is a flat plane is a frigate in a bath |
| `storm_wave_length` | 74 | — | — | RECONSTRUCTED §8 metres between crests. Twice her own length, which is why she pitches so slowly and so far |
| `storm_wave_period` | 8.6 | — | — | RECONSTRUCTED §8 seconds between crests, which follows from the length in deep water |
| `storm_cloud_break` | 0.85 | — | — | RECONSTRUCTED §8 how torn the overcast is. A gale sky is not an even grey card: it is cloud in ragged bands lying with the wind, and a still render finds fault with a flat backdrop before it finds fault with anything on the ship |
| `storm_wake_alpha` | 0.3 | — | — | RECONSTRUCTED §8 how white the water is where the ship breaks it. It is the last thing that separates a ship at sea from a model standing on one: with a clean waterline and nothing happening along it, the eye reads the whole picture as an object placed on a surface |
| `storm_spume_alpha` | 0.38 | — | — | RECONSTRUCTED §8 how much of the sea surface is streaked white. In a full gale the whole surface is marked with it, in long streaks lying with the wind |
| `ao_voxel_size` | 0.3 | — | — | RECONSTRUCTED §8 within the 0.25-0.4 m band a cell this size resolves; below the gap under a boat on the skids and inside a gunport, coarse enough that the occupancy grid over the whole ship builds in a few tens of milliseconds rather than several hundred |
| `ao_ray_count` | 10 | — | — | RECONSTRUCTED §8 ten rays over the hemisphere read as a smooth gradient rather than a spatter of dark specks at the strength this is used at; fewer than eight left a visible dither on the flattest surfaces, such as the inner bulwark |
| `ao_ray_distance` | 2.4 | — | — | RECONSTRUCTED §8 how far a ray marches before it is called unoccluded, in metres. Contact occlusion is a local effect — the point of this pass is the gap under a boat or beside a gunport, not a global shadow — and at the ship's own scale this is short enough that two parts of the hull on opposite sides of the beam never darken each other |
| `ao_ray_step` | 0.3 | — | — | RECONSTRUCTED §8 kept equal to ao_voxel_size so that no step can skip past a one-cell-thick occluder such as a gunport lid without ever landing inside it |
| `ao_min_cos` | 0.5 | — | — | RECONSTRUCTED §8 the cosine of the largest angle off the normal a sampled ray may take — 60 degrees. See the note above this row for the self-occlusion measurement that set it |
| `ao_bias` | 0.45 | — | — | RECONSTRUCTED §8 a voxel and a half of headroom before the first sample. See the note above ao_min_cos for the measurement the two were tuned against together |
| `ao_strength` | 0.55 | — | — | RECONSTRUCTED §8 how far a fully enclosed vertex is darkened. Tuned down from an initial 0.8, which read as dirt smeared into the corners rather than shadow sitting in them; at 0.55 the deepest creases — under the boats, inside the ports — go convincingly dark without the open decks and topsides, which pick up a little occlusion from everything standing on them, looking grubby |
| `shadow_taps` | 3 | — | — | RECONSTRUCTED §8 three is the fewest that reads as a penumbra rather than as a double image, and each one costs a full shadow pass |
| `shadow_spread_deg` | 2.6 | — | — | RECONSTRUCTED §8 five times the sun's true half-degree, which is what it takes for the penumbra to be visible at this scale; tuned on the ship's shadow on the sea in the beam view |
| `shadow_map_size` | 2048 | — | — | RECONSTRUCTED §8 over a shadow camera 96 m across this is 47 mm to the texel. Three of these are rendered every frame, one per tap, so the size is a third of what a single map could afford — and it can be, because the taps blend away the staircase a single map has to resolve out with resolution |
| `shadow_extent` | 48 | — | — | RECONSTRUCTED §8 half-width of the shadow camera: a ship 59 m over all and 45 m to the trucks, plus the reach of her shadow on the water |
| `shadow_bias` | -0.0004 | — | — | RECONSTRUCTED §8 with a normal bias as well, the depth bias only has to close the last of the acne, and a large one detaches a shadow from its caster |
| `shadow_normal_bias` | 0.035 | — | — | RECONSTRUCTED §8 rather more than a texel of the shadow camera, which is what stops the jagged self-shadowing along the sails and the topsides |


---

## 6. Levels of detail

See `src/ship/lod.js` (`TRI_BUDGET`) and `docs/GAME-INTEGRATION.md` for the measured
cost of each level.

Sail states: `full`, `topsails`, `storm` (reefed foresail and close-reefed main topsail)
and `furled` — the same as HMS Surprise's, by the same names.

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
