# Waakzaamheid — specification

The contract this model is built against. Every dimension in the generator traces to a
row below, and `npm run audit` measures the geometry that was actually produced and
diffs it against these numbers.

**How this file is maintained.** The prose is written by hand in `tools/make-specs.js`.
The dimension tables are generated from `src/spec/spec.js` and `docs/offsets.json`, so
they cannot drift from the code. `npm run trace` fails the build if a generator dimension
has no row here, or if a row has no source.

---

## 1. What ship this is

The **Waakzaamheid** is fictional: the Dutch seventy-four that chases the Leopard through
the Southern Ocean in Patrick O'Brian's *Desolation Island* (1978), set in early 1811, and
is lost when a shot brings down her foremast and she broaches in a breaking sea. The book
gives her 32-pounders on the lower deck and 24-pounders above, a black hull, a broad stern,
bluff bows, bridle-port chasers and pole topgallant masts (`docs/research/01-the-book.md`).

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
| `hull_length_lwl` | 50.4305 | — | MEASURED | §7 stem rabbet to sternpost rabbet at the load waterline |
| `hull_length_keel` | 42.0815 | — | PRIMARY | §2 British survey, keel for tonnage |
| `hull_beam_extreme` | 14.0716 | — | PRIMARY | §2 British survey, extreme breadth over the plank; 48 9/11 Amsterdam ft inside the plank on the draught, plus two thicknesses of plank, agrees within 5 cm |
| `hull_beam_moulded` | 13.8447 | — | MEASURED | §7 the dead flat on the body plan; the title block gives 48 9/11 Amsterdam ft = 13.82 m "wyt binnen de huid" |
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
| `bulwark_height_waist` | 2.2673 | — | MEASURED | §7 the waist rail over the upper deck amidships: the side is planked up to the gangways |
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
| `fore_mast_from_stem` | 4.3053 | 14 ft 1.5 in | RECONSTRUCTED | §04 8 Steel CENTRES OF MASTS, 28-gun column, scaled from a 120 ft 6 in to a 126 ft gundeck: 13 ft 6 in, 0.1120 of the gundeck |
| `main_mast_from_stem` | 21.7551 | 71 ft 4.5 in | RECONSTRUCTED | §04 8 Steel CENTRES OF MASTS, 28-gun column, scaled from a 120 ft 6 in to a 126 ft gundeck: 68 ft 3 in, 0.5664 of the gundeck |
| `mizzen_mast_from_stem` | 32.9057 | 107 ft 11.5 in | RECONSTRUCTED | §04 8 Steel CENTRES OF MASTS, 28-gun column, scaled from a 120 ft 6 in to a 126 ft gundeck: 17 ft 3 in afore the after perpendicular, 0.8568 of the gundeck |
| `main_mast_length` | 24.7904 | 81 ft 4 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_mast_diameter` | 0.6001 | 1 ft 11.6 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_mast_head` | 3.4449 | — | SECONDARY | §5 Steel 1794 v1 p.42, head and hounds rules, arithmetic applied to the §3 lengths |
| `fore_mast_length` | 21.9456 | 72 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_mast_diameter` | 0.5302 | 1 ft 8.9 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_mast_head` | 3.048 | — | SECONDARY | §5 Steel 1794 v1 p.42, head and hounds rules, arithmetic applied to the §3 lengths |
| `mizzen_mast_length` | 21.0312 | 69 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_mast_diameter` | 0.4254 | 1 ft 4.7 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_mast_head` | 2.3368 | — | SECONDARY | §5 Steel 1794 v1 p.42, head and hounds rules, arithmetic applied to the §3 lengths |
| `fore_mast_rake_deg` | 0.1 | — | SECONDARY | §8 Steel, Naval Architecture, CENTRES OF MASTS, 28-gun column; 1/16 in of rake per yard of mast |
| `main_mast_rake_deg` | 0.99 | — | SECONDARY | §8 Steel, Naval Architecture, CENTRES OF MASTS, 28-gun column; 5/8 in per yard |
| `mizzen_mast_rake_deg` | 1.59 | — | SECONDARY | §8 Steel, Naval Architecture, CENTRES OF MASTS, 28-gun column; 1 in per yard |
| `mast_step_y` | -3.5052 | -11 ft 6 in | RECONSTRUCTED | §9 keelson top, from the moulded base line plus the floors |

### Topmasts, topgallants and poles

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `mizzen_topmast_backstay_deadeye_diameter` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV: 8 in |
| `main_topmast_length` | 14.859 | 48 ft 9 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_topmast_diameter` | 0.3651 | 1 ft 2.4 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_topmast_head` | 1.651 | — | SECONDARY | §5 Steel 1794 v1 p.42, head and hounds rules, arithmetic applied to the §3 lengths |
| `fore_topmast_length` | 13.1064 | 43 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_topmast_diameter` | 0.3651 | 1 ft 2.4 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_topmast_head` | 1.4542 | — | SECONDARY | §5 Steel 1794 v1 p.42, head and hounds rules, arithmetic applied to the §3 lengths |
| `mizzen_topmast_length` | 11.1506 | 36 ft 7 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_topmast_diameter` | 0.254 | 0 ft 10 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_topmast_head` | 1.0858 | — | SECONDARY | §5 Steel 1794 v1 p.42, head and hounds rules, arithmetic applied to the §3 lengths |
| `main_topgallant_length` | 7.4168 | 24 ft 4 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_topgallant_diameter` | 0.2032 | 0 ft 8 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_royal_pole` | 2.6892 | — | SECONDARY | §5 Steel 1794 v1 p.42, head and hounds rules, arithmetic applied to the §3 lengths; long pole-head = 2/5 of the stop |
| `fore_topgallant_length` | 6.5532 | 21 ft 6 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_topgallant_diameter` | 0.1778 | 0 ft 7 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_royal_pole` | 2.3654 | — | SECONDARY | §5 Steel 1794 v1 p.42, head and hounds rules, arithmetic applied to the §3 lengths; long pole-head = 2/5 of the stop |
| `mizzen_topgallant_length` | 5.5626 | 18 ft 3 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_topgallant_diameter` | 0.1524 | 0 ft 6 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_royal_pole` | 2.0098 | — | SECONDARY | §5 Steel 1794 v1 p.42, head and hounds rules, arithmetic applied to the §3 lengths; long pole-head = 2/5 of the stop |
| `fore_topmast_shroud_pairs` | 4 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `main_topmast_shroud_pairs` | 4 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `mizzen_topmast_shroud_pairs` | 3 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |

### Bowsprit, jibboom and dolphin striker

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `bowsprit_heel_from_stem` | 4.2672 | 13 ft 12 in | RECONSTRUCTED | §4 research 04 §3.3: the heel steps on the gun deck on the beam next before the foremast, whose centre is 14 ft 1.5 in abaft the fore perpendicular. Checked against ZAZ3067: at rig.bowsprit_steeve_deg this puts the spar where the draught draws it crossing the stem |
| `bowsprit_heel_above_gundeck` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §4 half the bowsprit's diameter, the spar lying in its step on the deck |
| `bowsprit_partner_thickness` | 0.1524 | 0 ft 6 in | RECONSTRUCTED | §6 Steel :39538 tabulates the bowsprit partners but the frigate column is not legible; the thickness of the capstan partners is used |
| `bowsprit_chock_length` | 0.762 | 2 ft 6 in | SECONDARY | §6 Steel :15357, a chock between the knightheads for the better security of the bowsprit |
| `gammoning_hole_count` | 2 | — | SECONDARY | §6 Steel :41225, two gammoning holes |
| `gammoning_cleat_forward_of_stem` | 0.9144 | — | SECONDARY | §6 Steel :2914, the gammoning is cut through the knee of the head between the cheeks, abaft the figure |
| `gammoning_cleat_spacing` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | §6 from Steel :41226, a gammoning hole 1 ft 1 in long, with a little wood between the two |
| `gammoning_cleat_projection` | 0.0762 | — | RECONSTRUCTED | §6 the cleat that keeps the gammoning lashing from surging forward |
| `bowsprit_length` | 14.859 | 48 ft 9 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `bowsprit_diameter` | 0.6001 | 1 ft 11.6 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `bowsprit_steeve_deg` | 21.9 | — | SECONDARY | §8 Steel, Naval Architecture, CENTRES OF MASTS, 28-gun column; 1 ft 2 1/2 in of stive per yard of length |
| `bowsprit_housing` | 4.7244 | 15 ft 6 in | RECONSTRUCTED | §3.3 heel stepped on the beam next before the foremast, geometry at a 21.9 deg steeve |
| `jibboom_length` | 10.668 | 35 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `jibboom_diameter` | 0.2604 | 0 ft 10.3 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `jibboom_housing_fraction` | 0.333 | — | RECONSTRUCTED | §3.3 jib boom housed on the bowsprit for about a third of its length |
| `bowsprit_shroud_pairs` | 1 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `dolphin_striker_length` | 2.7432 | 9 ft 0 in | RECONSTRUCTED | §12 about a quarter of the jib boom; not in Steel 1794, but visible in the reference photograph |
| `dolphin_striker_diameter` | 0.1778 | 0 ft 7 in | RECONSTRUCTED | §12 in proportion to its length |
| `dolphin_striker_rake_deg` | 12 | — | RECONSTRUCTED | §12 raked slightly forward so the martingale leads fair to the jib boom end |
| `gammoning_turns` | 8 | — | SECONDARY | §11.2 Steel lists the gammoning first on the standing-rigging plate; seven or eight turns is the period figure |

### Yards and booms

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `main_yard_length` | 21.717 | 71 ft 3 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_yard_diameter` | 0.4191 | 1 ft 4.5 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_topsail_yard_length` | 15.8496 | 52 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_topsail_yard_diameter` | 0.2794 | 0 ft 11 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_topgallant_yard_length` | 9.906 | 32 ft 6 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_topgallant_yard_diameter` | 0.1651 | 0 ft 6.5 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_royal_yard_length` | 7.9248 | 26 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `main_royal_yard_diameter` | 0.1397 | 0 ft 5.5 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_yard_length` | 18.9484 | 62 ft 2 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_yard_diameter` | 0.3683 | 1 ft 2.5 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_topsail_yard_length` | 14.0208 | 46 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_topsail_yard_diameter` | 0.2477 | 0 ft 9.8 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_topgallant_yard_length` | 8.6868 | 28 ft 6 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_topgallant_yard_diameter` | 0.1429 | 0 ft 5.6 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_royal_yard_length` | 7.0104 | 23 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `fore_royal_yard_diameter` | 0.1238 | 0 ft 4.9 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `crossjack_yard_length` | 14.0208 | 46 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `crossjack_yard_diameter` | 0.2477 | 0 ft 9.8 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_topsail_yard_length` | 10.668 | 35 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_topsail_yard_diameter` | 0.1842 | 0 ft 7.3 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_topgallant_yard_length` | 6.7056 | 22 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_topgallant_yard_diameter` | 0.1111 | 0 ft 4.4 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_royal_yard_length` | 5.334 | 17 ft 6 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `mizzen_royal_yard_diameter` | 0.0921 | 0 ft 3.6 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `spritsail_yard_length` | 14.0208 | 46 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `spritsail_yard_diameter` | 0.2477 | 0 ft 9.8 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `driver_boom_length` | 15.8496 | 52 ft 0 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column; the driver rig, not built — see spanker_boom_length |
| `spanker_boom_length` | 10.3632 | 34 ft 0 in | RECONSTRUCTED | from the reference photograph: a gaff spanker whose boom overhangs the taffrail by about 10 ft |
| `spanker_boom_diameter` | 0.2477 | 0 ft 9.8 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `spanker_gaff_length` | 9.906 | 32 ft 6 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column; printed under "Gaff" on the mizen line |
| `spanker_gaff_diameter` | 0.2477 | 0 ft 9.8 in | SECONDARY | §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column |
| `spanker_gaff_peak_deg` | 38 | — | RECONSTRUCTED | §12 gaff peaked at about 38 degrees, as the reference photograph shows |

### Tops

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `main_top_breadth` | 4.953 | 16 ft 3 in | SECONDARY | §7.1 Steel 1794 v1 p.37, one third of the topmast length |
| `main_top_length` | 3.7147 | 12 ft 2.3 in | SECONDARY | §7.1 three quarters of the breadth |
| `fore_top_breadth` | 4.3688 | 14 ft 4 in | SECONDARY | §7.1 Steel 1794 v1 p.37 |
| `fore_top_length` | 3.2766 | 10 ft 9 in | SECONDARY | §7.1 three quarters of the breadth |
| `mizzen_top_breadth` | 3.7147 | 12 ft 2.3 in | SECONDARY | §7.1 Steel 1794 v1 p.37 |
| `mizzen_top_length` | 2.7877 | 9 ft 1.8 in | SECONDARY | §7.1 three quarters of the breadth |
| `top_platform_thickness` | 0.0508 | 0 ft 2 in | SECONDARY | §7.1 two-inch deals for a sixth rate |

### Standing rigging

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `bobstay_hole_count` | 2 | — | SECONDARY | §6 Steel :41228, two bobstay holes |
| `bobstay_hole_diameter` | 0.1016 | 0 ft 4 in | SECONDARY | §6 Steel :41229, 4 in diameter, OCR-doubtful |
| `bobstay_hole_forward_of_stem` | 1.9812 | — | SECONDARY | §6 Steel :1537, cut through the fore part of the knee of the head below the lower cheek. The model puts the eyes on the cutwater below the wale instead, which is the same place expressed as a line of the ship rather than as a distance |
| `fore_channel_shroud_aim_y` | 15.545 | — | RECONSTRUCTED | §04 9 fore top platform 51 ft 0 in above the load waterline |
| `main_channel_shroud_aim_y` | 17.993 | — | RECONSTRUCTED | §04 9 main top platform 59 ft 0 1/2 in above the load waterline |
| `mizzen_channel_shroud_aim_y` | 15.342 | — | RECONSTRUCTED | §04 9 mizen top platform 50 ft 4 in above the load waterline |
| `fore_lower_shroud_pairs` | 7 | — | PRIMARY | §04 11.1 Steel 1794 v2 rigging warrant, a ship of 28 guns of 594 tons: corroborated by 14 lanyards |
| `main_lower_shroud_pairs` | 7 | — | PRIMARY | §04 11.1 Steel 1794 v2 rigging warrant, a ship of 28 guns of 594 tons: corroborated by 14 throat seizings |
| `mizzen_lower_shroud_pairs` | 5 | — | PRIMARY | §04 11.1 Steel 1794 v2 rigging warrant, a ship of 28 guns of 594 tons: corroborated by 10 lanyards |
| `fore_channel_backstay_deadeyes` | 4 | — | PRIMARY | §04 11.1 Steel 1794 v2 rigging warrant, a ship of 28 guns of 594 tons: two topmast and two topgallant standing backstays a side |
| `main_channel_backstay_deadeyes` | 4 | — | PRIMARY | §04 11.1 Steel 1794 v2 rigging warrant, a ship of 28 guns of 594 tons: two topmast and two topgallant standing backstays a side |
| `mizzen_channel_backstay_deadeyes` | 2 | — | PRIMARY | §04 11.1 Steel 1794 v2 rigging warrant, a ship of 28 guns of 594 tons: one mizen topmast and one mizen topgallant standing backstay a side |
| `shroud_deadeye_diameter` | 0.2794 | 0 ft 11 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV: 11 in for the main and fore shrouds |
| `mizzen_shroud_deadeye_diameter` | 0.2032 | 0 ft 8 in | PRIMARY | §04 11.1 Steel 1794 v2 rigging warrant, a ship of 28 guns of 594 tons: the mizen entry reads "Dead Eyes 8" inches |
| `topmast_backstay_deadeye_diameter` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV: 9 in, the after end of the main and fore channels |
| `topgallant_backstay_deadeye_diameter` | 0.1778 | 0 ft 7 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV: 7 in |
| `mizzen_topgallant_backstay_deadeye_diameter` | 0.1524 | 0 ft 6 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV: 6 in |
| `shroud_deadeye_thickness` | 0.1524 | 0 ft 6 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV: a deadeye is a little over half its diameter through |
| `fore_topgallant_shroud_pairs` | 3 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `main_topgallant_shroud_pairs` | 3 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `mizzen_topgallant_shroud_pairs` | 2 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `fore_futtock_shroud_pairs` | 4 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `main_futtock_shroud_pairs` | 4 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `mizzen_futtock_shroud_pairs` | 3 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `topmast_standing_backstay_pairs` | 2 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `topgallant_backstay_pairs` | 2 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons |
| `bobstay_pairs` | 2 | — | SECONDARY | §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons; cabled, set up with hearts |
| `ratline_spacing` | 0.3302 | 1 ft 1 in | SECONDARY | §11.4 Steel 1794 v1 pp.198-199, Progressive Method of Rigging Ships |
| `ratline_stiffener_spacing` | 1.524 | 5 ft 0 in | SECONDARY | §11.4 boat oars seized to the shrouds about five feet asunder for the men to stand on |
| `shroud_diameter` | 0.0364 | 0 ft 1.4 in | RECONSTRUCTED | §11 4.5-inch lower shroud circumference, converted to diameter; Steel describes rope sizes by circumference, not a recovered Surprise rope schedule |
| `stay_diameter` | 0.1524 | 0 ft 6 in | RECONSTRUCTED | §11 lower stay heavier than the shrouds |
| `running_rigging_diameter` | 0.0508 | 0 ft 2 in | RECONSTRUCTED | §12 braces, lifts and sheets at model-visible size |

### Sails

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `sail_cloth_width` | 0.6096 | 2 ft 0 in | SECONDARY | §7.3 of the paint research; period flax canvas bolt width |
| `sail_roach` | 0.085 | — | RECONSTRUCTED | measured off the reference photograph, where the cut of the courses is clearest |
| `sail_leech_curve` | 0.045 | — | RECONSTRUCTED | from the reference photograph; a sail under strain is a curved surface |
| `sail_belly` | 0.115 | — | RECONSTRUCTED | from the reference photograph; the draught of a full sail on a soldier's wind |
| `square_sails_set` | 8 | — | RECONSTRUCTED | the full suit in the reference photograph: two courses, three topsails and three topgallants |
| `furled_bundle_diameter` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | a course furled and harbour-stowed makes a bundle about this thick |

### Channels, deadeyes and chainplates

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `fore_channel_deadeyes_per_side` | 11 | — | RECONSTRUCTED | §04 11.1 seven lower shrouds and four standing backstays |
| `main_channel_deadeyes_per_side` | 11 | — | RECONSTRUCTED | §04 11.1 seven lower shrouds and four standing backstays |
| `mizzen_channel_deadeyes_per_side` | 7 | — | RECONSTRUCTED | §04 11.1 five lower shrouds and two standing backstays |
| `channel_length` | 6.096 | 20 ft 0 in | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column: the fore channel, used as the single value the rig module still reads |
| `channel_width` | 0.508 | 1 ft 8 in | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column: breadth "sufficient to clear the shrouds of the roughtree rail" |
| `fore_channel_length` | 6.096 | 20 ft 0 in | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column |
| `main_channel_length` | 6.9342 | 22 ft 9 in | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column |
| `mizzen_channel_length` | 4.2672 | 13 ft 12 in | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column; the built channel is cut short of this at the after end to clear the counter |
| `channel_projection` | 0.508 | — | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column: 1 ft 8 in clear of the ship's side |
| `channel_thickness_inner` | 0.127 | — | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column: thickness at the inner edge, main and fore |
| `channel_thickness_outer` | 0.0953 | — | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column: thickness at the outer edge, main and fore |
| `mizzen_channel_thickness_inner` | 0.1143 | — | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column: thickness at the inner edge, mizzen |
| `mizzen_channel_thickness_outer` | 0.0889 | — | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column: thickness at the outer edge, mizzen |
| `channel_fore_end_before_mast` | 0.1778 | — | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column: foremost end of the main and fore channels forward of the mast centre |
| `mizzen_channel_fore_end_before_mast` | 0.1524 | — | SECONDARY | §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column: foremost end of the mizzen channel forward of the mast centre |
| `channel_top_below_rail` | 0.254 | — | RECONSTRUCTED | §06 10 Steel puts the channel in line with the upper edge of the sheer rail, one strake below the cap |
| `mizzen_channel_top_below_rail` | 0.1524 | — | RECONSTRUCTED | §06 10 Steel carries the mizzen channel 1 ft above the range of the main; four inches of that taken against a level rail line |
| `channel_inboard_inset` | 0.0508 | — | RECONSTRUCTED | §06 10 the inner edge is let into the ship's side, not butted against the planking |
| `mizzen_channel_aft_clearance` | 2.7432 | — | RECONSTRUCTED | §06 10 the after end of the mizzen channel kept clear of the quarter badge |
| `channel_aft_clearance` | 0.6096 | — | RECONSTRUCTED | §06 10 the after end of a channel is kept off the run of the counter so that it lands on the side proper |
| `channel_deadeye_end_margin` | 0.2286 | — | RECONSTRUCTED | §06 10 the outer deadeyes are set in from the ends so the channel is not split at the butt |
| `fore_channel_taper_fraction` | 0.24 | — | RECONSTRUCTED | §06 10 Steel says the fore channel tapers at its after end to stow the anchor but does not give the length of the taper |
| `fore_channel_taper_projection` | 0.2286 | — | RECONSTRUCTED | §06 10 projection left at the after end of the fore channel taper |
| `channel_rail_height` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §06 10 the low rail on the outer edge, scored down for every deadeye strop |
| `channel_rail_width` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §06 10 sided as deep as it is high, ordinary practice for a chain rail |
| `channel_rail_notch_clearance` | 0.0508 | — | RECONSTRUCTED | §06 10 the score is cut a little wider than the strop it takes |
| `mizzen_deadeye_thickness` | 0.1143 | 0 ft 4.5 in | RECONSTRUCTED | §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV |
| `deadeye_hole_diameter` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §06 10 the three holes take the lanyard doubled; taken as a seventh of the deadeye |
| `deadeye_hole_circle_fraction` | 0.42 | — | RECONSTRUCTED | §06 10 the three holes stand on a circle of about two fifths of the diameter |
| `deadeye_bottom_above_channel` | 0.0762 | — | RECONSTRUCTED | §06 10 the strop sits down in the score, so the body of the deadeye stands just clear of the channel |
| `deadeye_strop_iron` | 0.0286 | — | SECONDARY | §06 10 Steel: the deadeye binding is 1 1/8 in for the main and fore |
| `mizzen_deadeye_strop_iron` | 0.0254 | — | SECONDARY | §06 10 Steel: the deadeye binding is 1 in for the mizzen |
| `chainplate_width` | 0.0635 | 0 ft 2.5 in | RECONSTRUCTED | §06 10 a plate of 1 1/8 in iron is sided about 2 1/2 in |
| `chainplate_thickness` | 0.0286 | 0 ft 1.1 in | SECONDARY | §06 10 Steel: chain iron 1 1/8 in, main and fore |
| `mizzen_chainplate_thickness` | 0.0254 | 0 ft 1 in | SECONDARY | §06 10 Steel: chain iron 1 in, mizzen |
| `chain_bolt_below_channel` | 1.0668 | — | SECONDARY | §06 10 Steel: the chain bolt driven 3 ft 6 in below the channel |
| `mizzen_chain_bolt_below_channel` | 0.9144 | — | SECONDARY | §06 10 Steel, scaled for the mizzen |
| `chain_bolt_diameter` | 0.0381 | 0 ft 1.5 in | SECONDARY | §06 10 Steel: chain bolt 1 1/2 in |
| `chainplate_standoff` | 0.0127 | — | RECONSTRUCTED | §06 10 the plate lies on the planking; half an inch keeps the iron clear of the hull surface |
| `fore_channel_supporters` | 4 | — | SECONDARY | §06 10 Steel: four iron T-plates in lieu of wood knees under the fore channel |
| `main_channel_supporters` | 5 | — | SECONDARY | §06 10 Steel: five iron T-plates under the main channel |
| `mizzen_channel_supporters` | 2 | — | SECONDARY | §06 10 Steel: two iron T-plates under the mizzen channel |
| `supporter_width` | 0.0762 | 0 ft 3 in | SECONDARY | §06 10 Steel: the T-plate broad 3 in |
| `supporter_thickness` | 0.0286 | 0 ft 1.1 in | SECONDARY | §06 10 Steel: thick 1 1/8 in at the shoulder |
| `supporter_drop` | 1.0668 | — | SECONDARY | §06 10 Steel: the T-plate reaches 3 ft 6 in below the upper side of the channel |

### Stern, galleries and rudder

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `stern_deadlight_thickness` | 0.038 | 0 ft 1.5 in | RECONSTRUCTED | §12 an inch and a half of oak. Deadlights are shipped over the stern windows in heavy weather because glass at the stern in a following sea is the next thing to go after the ports |
| `stern_deadlight_proud` | 0.012 | — | RECONSTRUCTED | §12 the shutter beds against the outside of the sash frame, so it stands this much off the face of it |
| `stern_tuck_above_wl` | 0.6604 | 2 ft 2 in | MEASURED | §6 the tuck at 15.0 ft above the moulded base line, LWL at 12.83 ft |
| `stern_wing_transom_above_wl` | 2.0574 | 6 ft 9 in | MEASURED | §6 wing transom at about 19.6 ft above the moulded base line |
| `stern_upper_counter_above_wl` | 3.7084 | — | MEASURED | §6 stern profile point at 25.0 ft above the moulded base line |
| `stern_taffrail_above_rail` | 1.5494 | — | MEASURED | §6 taffrail 29.5 ft above the moulded base line, rail line 24.4 ft |
| `stern_taffrail_above_quarterdeck` | 0.5842 | — | MEASURED | §5/§6 taffrail 29.5 ft above the moulded base line; gun deck at side at the after perpendicular 20.90 ft, quarterdeck 6 ft 8 in above that at 27.57 ft |
| `stern_taffrail_above_wl` | 5.08 | 16 ft 8 in | MEASURED | §6 taffrail 29.5 ft above the moulded base line, LWL at 12.83 ft. This is the figure the taffrail is built to; the height above the quarterdeck follows from it |
| `stern_wing_transom_abaft_tuck` | 1.3716 | — | RECONSTRUCTED | §6 between the 2.2 ft of the measured profile points and the 7.7 ft of the counter-overhang bullet; least that carries the counter clear of the rudder head |
| `stern_upper_counter_abaft_tuck` | 1.9812 | — | RECONSTRUCTED | §6 between the measured 4.5 ft and the summary bullets, on a fair curve between the wing transom and the taffrail |
| `stern_taffrail_abaft_tuck` | 2.286 | — | RECONSTRUCTED | §6 between the measured 5.0 ft and the 10.5 ft of the taffrail-overhang bullet |
| `stern_half_breadth_at_tuck` | 0.9144 | — | MEASURED | §6 tuck / lower counter at the post, 3.0 ft half-breadth |
| `stern_half_breadth_wing_transom` | 2.8956 | — | MEASURED | §6 wing transom half-breadth 9.5 ft, 0.61 of the moulded breadth |
| `stern_half_breadth_at_lights` | 3.048 | — | MEASURED | §6 stern at the window band, 10.0 ft half-breadth, 0.65 of the moulded breadth |
| `stern_half_breadth_at_taffrail` | 2.1336 | — | RECONSTRUCTED | §6 taffrail half-breadth 7.0 ft, 0.45 of the moulded breadth, read off the same elevation |
| `stern_transom_breadth_wing` | 5.7912 | — | MEASURED | §6 wing transom 19.0 ft across the stern elevation on the ZAZ3067 body plan |
| `stern_round_aft_lower` | 0.1016 | — | RECONSTRUCTED | §12.2 Steel, round-aft of the lower counter rail; least at the bottom |
| `stern_round_aft_upper` | 0.254 | — | RECONSTRUCTED | §12.2 Steel, round-aft increasing in proceeding upwards |
| `stern_round_up_taffrail` | 0.2032 | — | RECONSTRUCTED | §12.2 Steel, the taffrail carries the most round-up of any stern rail |
| `stern_quarter_run` | 2.4384 | — | RECONSTRUCTED | §12.4 the quarter pieces run forward far enough to carry the sheer up to the taffrail without a step |
| `stern_counter_rail_depth` | 0.127 | — | RECONSTRUCTED | §12.2 Steel names five stern rails; scantling taken from the sheer mouldings of the same ship |
| `stern_counter_rail_proud` | 0.0762 | — | RECONSTRUCTED | §12.2 a counter rail stands proud of the planking by about its own thickness |
| `taffrail_cap_width` | 0.2794 | 0 ft 11 in | RECONSTRUCTED | §12.4 Steel, taffrail transom 4½ in thick with the taffarel rail over it |
| `taffrail_cap_thickness` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §12.4 Steel, taffarel rail over the taffrail transom |
| `stern_light_count` | 7 | — | MEASURED | §6 the stern elevation on the ZAZ3067 body plan shows a single row of seven lights; 06 §12.2 and 08 §5.2 reconstruct five from a breadth rule whose stated range is 5 to 7 |
| `stern_light_height` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §12.2 lights 3 ft 0 in deep for a Sixth Rate great cabin |
| `stern_light_sill_above_deck` | 0.762 | 2 ft 6 in | RECONSTRUCTED | §12.2 sill height of a great-cabin light above the gun deck at side |
| `stern_light_munion` | 0.1524 | — | RECONSTRUCTED | §12.2 munions 6 in wide between the lights |
| `stern_quarter_piece_width` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §12.2 the quarter piece bounding the row of lights each side |
| `stern_light_frame_depth` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §5.2 the sash frame stands proud of the transom planking |
| `stern_glazing_rebate` | 0.0381 | — | RECONSTRUCTED | §5.2 the rebate a crown-glass pane is bedded in, from contemporary sash practice |
| `stern_glazing_bar` | 0.0254 | — | SECONDARY | §5.2 wooden glazing bars about 1 in, following contemporary domestic sash practice |
| `stern_panes_wide` | 2 | — | SECONDARY | §5.2 rectangular panes 2 wide per light, not leaded diamonds |
| `stern_panes_high` | 3 | — | RECONSTRUCTED | §12.2 sash bars dividing each light into 6 panes, 2 wide by 3 high |
| `quarter_gallery_light_count` | 2 | — | RECONSTRUCTED | §12.3 two lights in each gallery facing aft and outboard |
| `quarter_gallery_length` | 2.1336 | 6 ft 12 in | RECONSTRUCTED | §12.3 lower rim about 7 ft, Steel: "the lower-rim should be as long as possible" |
| `quarter_gallery_projection` | 0.381 | — | RECONSTRUCTED | §12.3 a closed badge stands about 15 in off the ship's side |
| `quarter_gallery_rim_depth` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §12.3 the lower stool and rim below the lights |
| `quarter_gallery_hood_depth` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §12.3 the bell-top hood over the lights; Steel, the upper stool hollowed |
| `quarter_gallery_bracket_drop` | 0.3048 | — | RECONSTRUCTED | §5.2 the carved bracket under the badge, gadrooned on its underside; about a foot deep on a Sixth Rate badge |
| `quarter_gallery_bracket_length` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §5.2 the bracket seen fore and aft, rather less than it is deep |
| `quarter_gallery_frame_proud` | 0.0381 | — | RECONSTRUCTED | §12.3 the sash frame of a badge light stands proud of the badge planking |
| `quarter_gallery_carving_relief` | 0.0508 | — | RECONSTRUCTED | §5.2 the gilt carving on a quarter badge, cut a little shallower than the work on the counter because it is seen edge-on from abaft the beam |
| `stern_carving_bevel` | 0.42 | — | RECONSTRUCTED | §12.1 the ground cut away round a piece of carved work; about two fifths of its half-width taken by the chamfer, leaving a field in the middle |
| `stern_carving_panel_corner` | 3 | — | RECONSTRUCTED | §12.1 a carved panel is worked square with the corners rounded off, not drawn as a lens |
| `stern_cartouche_width` | 1.8288 | 6 ft 0 in | RECONSTRUCTED | §12.1 the name cartouche on the counter, drawn on ZAZ3067 and on the parallel Unite plan ZAZ3181; wide enough to carry the eight letters of the name at the letter width below, with a margin each end |
| `stern_cartouche_height` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | §12.1 proportion of a period name cartouche to its width |
| `stern_cartouche_relief` | 0.0762 | — | RECONSTRUCTED | §12.1 depth of the carved relief |
| `stern_cartouche_bevel` | 0.18 | — | RECONSTRUCTED | §12.1 a name board is chamfered round its edge and left flat inside, so the chamfer takes much less of it than a boss does |
| `taffrail_ornament_width` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §5.2 the central carved and gilded cartouche of the taffrail, "a centre of attention within all the decoration" |
| `taffrail_ornament_height` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §5.2 flanked by scrollwork and trophies of arms |
| `taffrail_ornament_relief` | 0.1016 | — | RECONSTRUCTED | §5.2 the centre of attention of the stern, and the boldest cut of any of it |
| `stern_scroll_relief` | 0.0635 | — | RECONSTRUCTED | §5.2 the scrollwork either side of the taffrail cartouche, cut shallower than the cartouche and dying away toward the quarters |
| `stern_term_piece_width` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §12.4 Steel, term pieces: carved work under each end of the taffrail |
| `stern_term_piece_relief` | 0.0762 | — | RECONSTRUCTED | §12.4 the term piece stands out from the quarter piece it is cut on |
| `stern_name_letter_height` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §12.1 name letters 8 in high, half the depth of the cartouche they are cut on |
| `stern_name_letter_width` | 0.1143 | 0 ft 4.5 in | RECONSTRUCTED | §12.1 a condensed letter about four ninths of its height, as period name boards are lettered |
| `stern_name_letter_gap` | 0.0635 | — | RECONSTRUCTED | §12.1 the space between one letter and the next, rather more than half a letter width |
| `stern_name_stroke` | 0.0254 | — | RECONSTRUCTED | §12.1 the width of the cut stroke of a letter |
| `stern_name_relief` | 0.0381 | — | RECONSTRUCTED | §12.1 the letters stand proud of the field of the cartouche |
| `stern_name_length` | 1.3843 | 4 ft 6.5 in | RECONSTRUCTED | §12.1 SURPRISE: eight letters of 4½ in with 2½ in between them, and the cut stroke over the ends |
| `rudder_breadth_at_heel` | 1.0668 | — | RECONSTRUCTED | §6 blade breadth at the heel, about a quarter of the draught |
| `rudder_breadth_at_head` | 0.4572 | — | RECONSTRUCTED | §6 the main piece at the head, sided a little more than the post |
| `rudder_thickness` | 0.254 | 0 ft 10 in | RECONSTRUCTED | §6 the main piece moulded, from the measured sternpost siding of 1 ft 1 in |
| `rudder_head_above_wl` | 4.1148 | 13 ft 6 in | RECONSTRUCTED | §2.2 the head carried up through the counter to the tiller under the quarterdeck |
| `rudder_height` | 8.3947 | 27 ft 6.5 in | RECONSTRUCTED | §6 heel at the 14 ft 0.5 in aft draught plus head 13 ft 6 in above the LWL; corrected former 17 ft 6 in total which stopped above the keel |
| `rudder_post_rake_deg` | 2.7 | — | MEASURED | §6 sternpost rake 0.67 ft over 14 ft of height, taken on the rudder's after edge |
| `rudder_pintle_count` | 5 | — | RECONSTRUCTED | §6 five pairs of pintles and gudgeons on a rudder of this depth |
| `rudder_iron_width` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §6 the straps of the pintles and gudgeons |
| `rudder_iron_thickness` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §6 wrought-iron strap thickness |
| `tiller_length` | 3.3528 | 11 ft 0 in | RECONSTRUCTED | §2.2 long enough to reach the sweep abaft the wheel at 107 ft 6 in from the stem |
| `tiller_diameter` | 0.1778 | 0 ft 7 in | RECONSTRUCTED | §2.2 tiller at the rudder head, tapering forward |
| `ensign_staff_step_abaft_tuck` | 1.2192 | — | RECONSTRUCTED | §12.4 Steel, "the ensign staff is secured in the stern timbers" |
| `stern_lantern_height` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §12.4 one lantern for a Sixth Rate, on an iron crank in the taffrail |
| `stern_lantern_breadth` | 0.381 | 1 ft 3 in | RECONSTRUCTED | §12.4 octagonal, copper and glass |

### Head, beakhead and figurehead

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `head_stem_siding` | 0.3302 | 1 ft 1 in | RECONSTRUCTED | §6 Steel: the stem is sided as the keel, and the keel of this ship is sided 1 ft 1 in (SPEC.keel_siding) |
| `head_stem_aft_overlap` | 0.1524 | — | RECONSTRUCTED | modelling allowance: how far abaft the hull's foremost station the stem timber is carried, so that it closes the fore end of the lofted shell |
| `head_stem_copper_above_waterline` | 0.762 | — | SECONDARY | §8 research 08 §3.5, sheathing carried 2 ft 6 in to 3 ft above the load waterline; the same height is used on the stem as on the hull |
| `head_stem_sheathing_proud` | 0.0254 | — | RECONSTRUCTED | §8 the sheathing board and the copper over it, standing proud of the bare stem |
| `head_stem_head_above_rail` | 0.2286 | — | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px: the stem head between the knightheads reads 4 to 5 px above the rail line |
| `head_knee_siding` | 0.2794 | 0 ft 11 in | RECONSTRUCTED | §6 Steel :41236 the gripe is sided as the knee of the head; a knee slightly thinner than the stem it lies against |
| `head_knee_projection` | 3.6576 | — | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px: the foremost ink of the head stands 75 px forward of the stem |
| `head_knee_top_above_rail` | 0 | — | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px: the top of the knee under the hair bracket runs out level with the rail |
| `head_knee_forward_at_deck` | 2.8956 | — | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px: the cutwater's fore edge crossing the gun-deck line |
| `head_knee_forward_at_waterline` | 1.2192 | — | RECONSTRUCTED | : the cutwater at the load waterline. The draught shows the stem raking aft below the water, which the traced offset table does not carry, so the fore edge is kept plumb over the hull's own forefoot here rather than crossing behind it |
| `head_knee_upper_exponent` | 0.8 | — | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px: read off the upper edge of the knee |
| `head_knee_length` | 3.81 | 12 ft 6 in | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px: the knee and stem together, from the aft face of the stem timber to the hair bracket — the fore-and-aft extent of the built piece |
| `head_cheek_count` | 2 | — | SECONDARY | §6 Steel :1985, an upper and a lower cheek each side |
| `head_cheek_sided` | 0.1524 | — | RECONSTRUCTED | §6 a cheek rather lighter than the knee it is bolted to |
| `head_cheek_moulded` | 0.2286 | — | RECONSTRUCTED | §6 as above |
| `head_cheek_aft_from_stem` | 2.7432 | 9 ft 0 in | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px: the after ends of the cheeks fair into the bow about 54 px abaft the stem |
| `head_rail_count` | 3 | — | SECONDARY | §8 the reference photograph shows three rails curving up to the figurehead; Steel :4172 names four (lower, middle, main, upper) plus a false rail, so this is the photograph's reading of a four-rail arrangement |
| `head_rail_sided` | 0.127 | — | SECONDARY | §6 Steel :41199, the false rail sided 5 in for a small ship |
| `head_rail_moulded` | 0.1778 | — | RECONSTRUCTED | §6 a rail rather deeper than it is broad, as the draught draws them |
| `head_rail_profile_exponent` | 1.44 | — | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px: re-fitted to the same four points on the lowest rail — see the note above |
| `head_rail_lower_aft_from_stem` | 0.3048 | 1 ft 0 in | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px: the lowest rail runs into the ship's side within a foot of the stem, at about the gun-deck line |
| `head_rail_lower_fore_above_rail` | 0.1524 | — | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px |
| `head_rail_lower_half_breadth` | 1.3716 | 4 ft 6 in | RECONSTRUCTED | : no plan view of the head survives, so the three plan widths are set against the reference photograph and bounded by the catheads, which no head rail passes outside of |
| `head_rail_middle_aft_from_stem` | 1.8288 | 6 ft 0 in | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px |
| `head_rail_middle_fore_above_rail` | 0.4572 | — | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px |
| `head_rail_middle_half_breadth` | 1.905 | 6 ft 3 in | RECONSTRUCTED | : as head_rail_lower_half_breadth |
| `head_rail_main_aft_from_stem` | 3.6576 | 12 ft 0 in | SECONDARY | §6 Steel :15364, the after end of the main head rail bolts to the same timberhead the cat block does, so it ends at the cathead |
| `head_rail_main_fore_above_rail` | 0.762 | — | MEASURED | §2 ZAZ3067 sheer profile, traced off the RMG scan at 6.021 px per foot; stem at x=1112 px, rail at y=141 px: the uppermost rail runs into the back of the figure about 15 px above the rail line |
| `head_rail_main_half_breadth` | 2.4384 | 8 ft 0 in | RECONSTRUCTED | : the main rail sweeps out in plan to a little more than half the extreme half-breadth, and well inside the cathead at 14 ft 6 in |
| `head_timber_count` | 4 | — | SECONDARY | §6 research 06-deck-layout §11, head structure: Steel :3133 defines the head timbers but tabulates no count; four a side is the Sixth-Rate norm — RECONSTRUCTED |
| `head_timber_sided` | 0.127 | — | RECONSTRUCTED | §6 a head timber sided as the rails it crosses |
| `head_timber_moulded` | 0.1016 | — | RECONSTRUCTED | §6 as above |
| `head_grating_aft_from_stem` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | : the after end of the flat of the head, where it meets the bow |
| `head_grating_forward_of_stem` | 2.4384 | — | RECONSTRUCTED | : the fore end of the flat, short of the hair bracket |
| `head_grating_above_lower_rail` | 0.1016 | — | RECONSTRUCTED | : the ledges and gratings laid on top of the lowest rail |
| `head_ledge_sided` | 0.0508 | — | SECONDARY | §6 Steel :41205, ledges framing the flat of the head, 2 in broad |
| `head_ledge_moulded` | 0.0572 | — | SECONDARY | §6 Steel :41206, 2 1/4 in deep |
| `head_grating_batten_square` | 0.0508 | — | SECONDARY | §6 Steel :1293, grating battens about 2 in square |
| `head_grating_batten_gap` | 0.0508 | — | SECONDARY | §6 Steel :2968, laid to leave about 2 in openings |
| `head_seat_count` | 2 | — | SECONDARY | §6 research 06-deck-layout §11, head structure §11.2: Steel :41211 says only "Seats of Ease, &c., as directed"; two open seats on the flat, one each side of the knee — RECONSTRUCTED |
| `head_seat_forward_of_stem` | 0.9144 | — | SECONDARY | §6 research 06-deck-layout §11, head structure §11.2, RECONSTRUCTED position |
| `head_seat_half_breadth` | 0.762 | 2 ft 6 in | SECONDARY | §6 research 06-deck-layout §11, head structure §11.2, RECONSTRUCTED position |
| `head_seat_width` | 0.508 | 1 ft 8 in | RECONSTRUCTED | : a seat wide enough for one man |
| `head_seat_depth` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | : as above |
| `head_seat_height` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | : seat height above the grating |
| `head_seat_back_height` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | : the coaming behind the seat |
| `beakhead_bulkhead_from_stem` | 3.6576 | 12 ft 0 in | RECONSTRUCTED | §6 research 06 §5.4: the cat beam is the foremost forecastle beam and the cathead root is at 12 ft, so the bulkhead stands there. Research 06 §11.3 says X = 0 ft, which cannot be right — the hull is 4 in wide at the stem |
| `beakhead_bulkhead_height` | 1.8288 | 6 ft 0 in | RECONSTRUCTED | §6 a bulkhead tall enough to take a round-house and a head door, with its head at the forecastle rail |
| `beakhead_bulkhead_above_rail` | 0.2286 | — | RECONSTRUCTED | §6 Steel :39518, the rough-tree rail carried round the bow above the bulkhead |
| `beakhead_bulkhead_round_forward` | 0.4572 | — | RECONSTRUCTED | §6 Steel's beakhead bulkheads are rounded in plan; this ship has a round bow (ZAZ3067), so the middle of the bulkhead stands forward of its wings |
| `beakhead_stanchion_per_side` | 5 | — | SECONDARY | §6 Steel :17843-17855, five stanchions each side of the centreline |
| `beakhead_stanchion_sided` | 0.1778 | — | RECONSTRUCTED | §6 a stanchion sided as a top timber |
| `beakhead_plank_thickness` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §6 the bulkhead planked as the ship's side above the ports |
| `head_roundhouse_width` | 0.8382 | 2 ft 9 in | SECONDARY | §6 research 06-deck-layout §11, head structure §11.2: Steel :17846 keeps the two outer stanchions to the size of the round-houses; no dimension is given — RECONSTRUCTED as a privy for one man |
| `head_roundhouse_depth` | 0.762 | 2 ft 6 in | RECONSTRUCTED | §6 as above |
| `head_roundhouse_height` | 1.524 | 5 ft 0 in | RECONSTRUCTED | §6 as above |
| `head_door_width` | 0.6604 | 2 ft 2 in | RECONSTRUCTED | §6 Steel :17849, the stanchion next inboard of the bow chase port makes the head door |
| `head_door_height` | 1.3716 | 4 ft 6 in | RECONSTRUCTED | §6 as above |
| `bow_chase_port_width` | 0.7112 | 2 ft 4 in | SECONDARY | §6 Steel, quarterdeck port width used for the bow chase port in the bulkhead (research 06 §9) |
| `bow_chase_port_height` | 0.7112 | 2 ft 4 in | SECONDARY | §6 as above |
| `knighthead_half_breadth` | 0.3556 | 1 ft 2 in | SECONDARY | §6 research 06-deck-layout §5.3, knightheads: immediately each side of the stem head, from Steel :15347's stem half-thickness — RECONSTRUCTED |
| `knighthead_sided` | 0.254 | — | RECONSTRUCTED | §6 a bollard timber heavier than a top timber |
| `knighthead_above_bowsprit` | 0.4572 | — | SECONDARY | §6 Steel :15357-15359, the knightheads run high enough above the bowsprit to admit a chock between them |
| `cathead_root_from_stem` | 3.6576 | 12 ft 0 in | SECONDARY | §6 research 06-deck-layout §5.4, catheads: the inboard arm bolts to the cat beam |
| `cathead_root_half_breadth` | 3.048 | 10 ft 0 in | SECONDARY | §6 research 06-deck-layout §5.4, catheads |
| `cathead_outer_from_stem` | 2.4384 | 8 ft 0 in | SECONDARY | §6 research 06-deck-layout §5.4, catheads: the sheave centre at the outer end |
| `cathead_outer_half_breadth` | 4.4196 | 14 ft 6 in | SECONDARY | §6 research 06-deck-layout §5.4, catheads |
| `cathead_spread` | 8.8392 | — | SECONDARY | §6 research 06-deck-layout §5.4, catheads: twice cathead_outer_half_breadth, the athwartships span over the two outer ends |
| `cathead_stive_deg` | 22.6 | — | SECONDARY | §6 Steel :40062-40064, 5 in of rise per foot of length; the whole row is legible across all ten columns |
| `cathead_sided` | 0.3556 | — | SECONDARY | §6 Steel :40060, OCR-doubtful |
| `cathead_moulded` | 0.3302 | — | SECONDARY | §6 Steel :40061, OCR-doubtful |
| `cathead_inboard_length` | 2.5908 | 8 ft 6 in | SECONDARY | §6 Steel :40066, length inboard from the outside of the timber, OCR-doubtful |
| `cathead_sheave_count` | 3 | — | SECONDARY | §6 Steel :40068-40069, three sheaves in the outer end |
| `cathead_sheave_diameter` | 0.254 | 0 ft 10 in | SECONDARY | §6 Steel :40069, OCR-doubtful |
| `cathead_supporter_arm` | 1.0668 | — | SECONDARY | §6 Steel :40074, the thwartship arm of the knee under the cathead |
| `figurehead_forward_of_stem` | 3.3528 | — | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; sited on the head of the knee where ZAZ3067 draws a small figure, 66 px forward of the stem |
| `figurehead_above_rail` | 0.1524 | — | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the plinth on the hair bracket |
| `figurehead_height` | 1.2192 | 4 ft 0 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; research 08 §4.4 — "the scale was drastically reduced", so a small figure |
| `figurehead_rake_deg` | 30 | — | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the figure leans forward over the water, following the run of the head |
| `figurehead_hem_diameter` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the spread of the drapery at the plinth |
| `figurehead_waist_diameter` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield |
| `figurehead_waist_height` | 0.6858 | 2 ft 3 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield |
| `figurehead_shoulder_height` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; set so that the neck and the head together make up the remaining quarter of her height |
| `figurehead_shoulder_breadth` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield |
| `figurehead_head_diameter` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield |
| `figurehead_arm_diameter` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield |
| `figurehead_arm_length` | 0.5334 | 1 ft 9 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield |
| `figurehead_neck_diameter` | 0.1143 | 0 ft 4.5 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the neck at three fifths of the head, so that the head reads as a head and not as a knob on the shoulders |
| `figurehead_neck_height` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the gap between the shoulder line and the chin |
| `figurehead_chest_breadth` | 0.381 | 1 ft 3 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the body between the waist and the shoulder, wider than the waist and narrower than the shoulder, which is what gives the torso its taper |
| `figurehead_hip_breadth` | 0.4318 | 1 ft 5 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the drapery over the hips, the widest of the body above the hem |
| `figurehead_hip_height` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the hips, under the drapery |
| `figurehead_plinth_diameter` | 0.508 | 1 ft 8 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the foot of the carving where it is let into the hair bracket, narrower than the hem because the drapery rolls under above it |
| `figurehead_hem_height` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; how far above the plinth the drapery stands widest |
| `figurehead_depth_fraction` | 0.62 | — | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the fore-and-aft depth of the carving as a fraction of its athwartships breadth — a figurehead is carved out of a stack sided close to the knee of the head, so it is a flat-backed relief rather than a statue in the round |
| `figurehead_arm_forward_deg` | 24 | — | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; both arms carried forward of the body, which is the pose every surviving small figurehead of the date is carved in and the one thing that reads at a distance |
| `figurehead_arm_spread_deg` | 16 | — | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; and spread a little off the sides, so the arms show against the drapery instead of disappearing into it |
| `figurehead_mantle_top_below_head` | 0.0508 | — | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the collar of the mantle, just below the neck |
| `figurehead_mantle_below_waist` | 0.127 | — | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the mantle falling a little past the waist, which is where the blue stops and the pale robe begins in the reference photograph |
| `figurehead_mantle_proud` | 0.0254 | — | RECONSTRUCTED | §8 research 08-paint-and-ornament §4.4 — CONJECTURAL: the figurehead of this ship is not documented anywhere; this is a classical female figure reconstructed from the ship's name and period practice, NOT the film ship's woman with sword and shield; the cloth standing off the body |
| `hair_bracket_length` | 1.2192 | 4 ft 0 in | SECONDARY | §6 Steel :3043, the moulding terminating the head rails and running into the back of the figure |
| `hair_bracket_sided` | 0.127 | — | RECONSTRUCTED | §6 a moulding sided as the rails it gathers |
| `trailboard_depth` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §8 research 08 §4.4, "very limited trailboard decoration" on a small ship of this date |

### Deck furniture

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `furniture_foremast_station_from_stem` | 4.3053 | 14 ft 1.5 in | SECONDARY | §6 research 04 §8, Steel Centres of Masts 28-gun column scaled to a 126 ft gun deck |
| `furniture_mainmast_station_from_stem` | 21.7551 | 71 ft 4.5 in | SECONDARY | §6 research 04 §8, Steel Centres of Masts 28-gun column scaled to a 126 ft gun deck |
| `furniture_mizzen_station_from_stem` | 32.9057 | 107 ft 11.5 in | SECONDARY | §6 research 04 §8, Steel Centres of Masts 28-gun column scaled to a 126 ft gun deck |
| `wheel_station_from_stem` | 34.9504 | 114 ft 8 in | RECONSTRUCTED | §6 research 06 deck-layout §2.2, wheel 6 ft 9 in abaft the mizzen |
| `wheel_diameter` | 1.5748 | 5 ft 2 in | SECONDARY | §6 Lavery, Arming and Fitting of English Ships of War: an outside diameter of a little over 5 ft |
| `wheel_swept_diameter` | 1.9304 | 6 ft 4 in | RECONSTRUCTED | §6 research 06 deck-layout §2.1, the rim plus a turned handle projecting 7 in at each end of a spoke |
| `wheel_count` | 1 | — | RECONSTRUCTED | §6 research 06 deck-layout §2.1, a 2 ft 3 in barrel will not take a wheel at each end and the rope turns between |
| `wheel_axle_above_deck` | 1.0414 | 3 ft 5 in | SECONDARY | §6 Steel 1805 :39506, stanchion heads 3 ft 4 in to 3 ft 6 in above the deck |
| `wheel_barrel_length` | 0.6858 | 2 ft 3 in | SECONDARY | §6 Steel 1805 :39506, quarter deck table row Q, 32-gun column |
| `wheel_barrel_diameter_mid` | 0.4064 | — | SECONDARY | §6 Steel 1805 :39508, row S |
| `wheel_barrel_diameter_end` | 0.4572 | — | SECONDARY | §6 Steel 1805 :39507, row R, OCR-doubtful |
| `wheel_stanchion_broad` | 0.3048 | — | SECONDARY | §6 Steel 1805 :39504, row N |
| `wheel_stanchion_thick` | 0.127 | — | SECONDARY | §6 Steel 1805 :39505, row O |
| `wheel_spoke_count` | 10 | — | RECONSTRUCTED | §6 research 06 deck-layout §2.1, Steel gives no spoke count; 8 or 10 is the period norm |
| `wheel_spoke_handle` | 0.1778 | — | RECONSTRUCTED | §6 research 06 deck-layout §2.1, turned handle projecting beyond the rim |
| `wheel_rim_thickness` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §6 research 06 deck-layout §2.1, the felloe of a wheel this size |
| `binnacle_station_from_stem` | 33.9852 | 111 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §2.3, 3 ft 6 in clear ahead of the wheel |
| `binnacle_length` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §2.3, three-compartment RN binnacle |
| `binnacle_depth` | 0.4064 | 1 ft 4 in | RECONSTRUCTED | §6 research 06 deck-layout §2.3 |
| `binnacle_height` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §2.3 |
| `capstan_abaft_mainmast` | 5.7912 | — | SECONDARY | §6 Steel 1805 :38405, centre of main jeer capstan abaft the centre of the mainmast, 32-gun column |
| `capstan_barrel_diameter` | 0.5524 | 1 ft 9.8 in | SECONDARY | §6 Steel 1805 :38408 |
| `capstan_barrel_above_deck` | 1.1684 | 3 ft 10 in | RECONSTRUCTED | §6 research 06 deck-layout §3.2, what is left of the 10 ft 8 in deck-to-deck barrel above the quarterdeck |
| `capstan_drumhead_diameter` | 1.2192 | 4 ft 0 in | SECONDARY | §6 Steel 1805 :38437, row X |
| `capstan_drumhead_thickness` | 0.2858 | 0 ft 11.3 in | SECONDARY | §6 Steel 1805 :38438-38439, upper piece 5 3/4 in and lower piece 5 1/2 in |
| `capstan_bar_hole_count` | 12 | — | SECONDARY | §6 Steel 1805 :38565, bar-holes in the drumhead |
| `capstan_bar_hole_square` | 0.0984 | — | SECONDARY | §6 Steel 1805 :38566 |
| `capstan_bar_hole_depth` | 0.2984 | 0 ft 11.8 in | SECONDARY | §6 Steel 1805 :38567 |
| `capstan_whelp_count` | 6 | — | SECONDARY | §6 Steel 1805 :38412, upper whelps |
| `capstan_whelp_length` | 0.9144 | 3 ft 0 in | SECONDARY | §6 Steel 1805 :38413 |
| `capstan_whelp_broad_heel` | 0.2731 | — | SECONDARY | §6 Steel 1805 :38417 |
| `capstan_whelp_broad_head` | 0.1905 | — | SECONDARY | §6 Steel 1805 :38418 |
| `capstan_partner_thickness` | 0.1524 | 0 ft 6 in | SECONDARY | §6 Steel 1805 :39379, capstan partners thick |
| `main_hatch_station_from_stem` | 19.304 | 63 ft 4 in | RECONSTRUCTED | §6 research 06 deck-layout §4.1, aft side 4 ft 6 in forward of the mainmast centre |
| `main_hatch_length` | 2.1336 | 6 ft 12 in | SECONDARY | §6 Steel 1805 :33355 fore-and-aft, 32-gun column |
| `main_hatch_width` | 1.3716 | 4 ft 6 in | SECONDARY | §6 Steel 1805 :33355 thwartships, 32-gun column |
| `fore_hatch_station_from_stem` | 10.7442 | 35 ft 3 in | RECONSTRUCTED | §6 research 06 deck-layout §4.1, fore side ranging with the after end of the forecastle at 33 ft |
| `fore_hatch_length` | 1.3716 | 4 ft 6 in | SECONDARY | §6 Steel 1805 :33633 |
| `fore_hatch_width` | 1.3716 | 4 ft 6 in | SECONDARY | §6 Steel 1805 :33633 |
| `after_hatch_station_from_stem` | 23.4696 | 77 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §4.2, abaft the mast room and clear of the after chain pump |
| `after_hatch_length` | 1.2192 | 4 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §4.2, the Steel row is not legible in the frigate column |
| `after_hatch_width` | 1.2192 | 4 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §4.2 |
| `ladderway_station_from_stem` | 17.526 | 57 ft 6 in | SECONDARY | §6 Steel 1805 :17482, double ladderway immediately forward of the main hatch |
| `ladderway_length` | 0.8128 | 2 ft 8 in | SECONDARY | §6 Steel 1805 :39375, ladderway fore-and-aft |
| `ladderway_width` | 1.8288 | 6 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §4.1, a double ladderway takes two ladders abreast |
| `coaming_height_above_deck` | 0.3302 | 1 ft 1 in | SECONDARY | §6 Steel, Form of a Contract :44581, coamings at least 13 inches |
| `coaming_broad` | 0.2286 | — | SECONDARY | §6 Steel 1805 :39445 |
| `grating_batten_square` | 0.0508 | — | SECONDARY | §6 Steel 1805 :1293, grating battens about 2 in square |
| `grating_batten_gap` | 0.0508 | — | SECONDARY | §6 Steel 1805 :2968, laid to leave about 2 in openings |
| `riding_bitt_aft_station_from_stem` | 13.716 | 45 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §5.1, Steel 1805 :17470 rule applied to the fourth port |
| `riding_bitt_fwd_station_from_stem` | 11.2776 | 37 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §5.1, one beam-space and one more forward |
| `riding_bitt_pin_square` | 0.2921 | — | RECONSTRUCTED | §6 research 06 deck-layout §5.1, Steel's armed-brigantine contract 10 1/2 in scaled up for a Sixth Rate |
| `riding_bitt_pin_offset` | 0.9144 | — | RECONSTRUCTED | §6 research 06 deck-layout §5.1, the pins must straddle the two cables |
| `riding_bitt_pin_height` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §5.1, head standing clear above the cross-piece |
| `riding_bitt_crosspiece_broad` | 0.2032 | — | SECONDARY | §6 Steel 1805 :39442 |
| `riding_bitt_crosspiece_deep` | 0.1461 | — | SECONDARY | §6 Steel 1805 :39443 |
| `riding_bitt_crosspiece_above_deck` | 0.5588 | 1 ft 10 in | SECONDARY | §6 Steel 1805 :39444, upper side above the deck |
| `riding_bitt_crosspiece_projection` | 0.4572 | — | SECONDARY | §6 Steel 1805 :39445, ends project beyond the bitts |
| `main_topsail_sheet_bitt_station_from_stem` | 20.2692 | 66 ft 6 in | SECONDARY | §6 Steel 1805 :17538, aft side against the beam abaft the main hatchway |
| `main_jeer_bitt_station_from_stem` | 22.2504 | 73 ft 0 in | SECONDARY | §6 Steel 1805 :17540, against the fore side of the beam abaft the mainmast |
| `jeer_bitt_pin_offset` | 1.2192 | — | RECONSTRUCTED | §6 research 06 deck-layout §5.2, insides plumbing the pumps, set out far enough to clear the cisterns |
| `jeer_bitt_pin_square` | 0.2286 | — | RECONSTRUCTED | §6 research 06 deck-layout §5.2, lighter than a riding bitt |
| `jeer_bitt_pin_height` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §5.2, standing clear above the cross-piece |
| `jeer_bitt_crosspiece_above_deck` | 0.6604 | 2 ft 2 in | SECONDARY | §6 Steel 1805 :17543, one third of the height between upper deck and quarterdeck |
| `fore_topsail_sheet_bitt_from_foremast` | 0.8382 | — | SECONDARY | §6 Steel 1805 :17592, one pair forward of and one abaft the foremast |
| `fore_topsail_sheet_bitt_offset` | 0.6096 | — | RECONSTRUCTED | §6 research 06 deck-layout §5.2, let into the sides of the forecastle beams |
| `chain_pump_fwd_station_from_stem` | 20.7264 | 68 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §6, immediately forward of the mainmast |
| `chain_pump_aft_station_from_stem` | 22.7076 | 74 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §6, immediately abaft the mainmast, clear of the jeer bitts |
| `chain_pump_offset` | 0.6858 | — | RECONSTRUCTED | §6 research 06 deck-layout §6, clear of the mainmast partners |
| `chain_pump_trunk_square` | 0.3048 | — | RECONSTRUCTED | §6 research 06 deck-layout §6, a 7 in chain in a 7 in trunk, cased |
| `chain_pump_head_above_deck` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §6, head standing above the cistern to take the sprocket and the cranks |
| `pump_cistern_broad` | 0.6096 | — | SECONDARY | §6 Steel 1805 :35293, cistern broad out to out, OCR-doubtful |
| `pump_cistern_deep` | 0.6096 | — | SECONDARY | §6 Steel 1805 :35292, OCR-doubtful |
| `pump_cistern_projection` | 0.2032 | — | SECONDARY | §6 Steel 1805 :35294, ends project beyond the pump heads |
| `pump_winch_above_deck` | 0.8382 | 2 ft 9 in | RECONSTRUCTED | §6 research 06 deck-layout §6, the iron crank spindle of the Cole-Bentinck pump |
| `pump_winch_diameter` | 0.0635 | 0 ft 2.5 in | RECONSTRUCTED | §6 research 06 deck-layout §6, wrought-iron spindle and cranks |
| `pump_dale_width` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §6 research 06 deck-layout §6, square wooden trough, 9 in by 7 in internal |
| `pump_dale_depth` | 0.1778 | 0 ft 7 in | RECONSTRUCTED | §6 research 06 deck-layout §6 |
| `pump_dale_fall` | 0.0833 | — | RECONSTRUCTED | §6 research 06 deck-layout §6, sloping about 1 in 12 outboard |
| `elm_pump_station_from_stem` | 23.3172 | 76 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §6, the two elm-tree pumps abaft the chain pumps |
| `elm_pump_offset` | 1.0668 | — | RECONSTRUCTED | §6 research 06 deck-layout §6 |
| `elm_pump_diameter` | 0.2794 | 0 ft 11 in | RECONSTRUCTED | §6 research 06 deck-layout §6, a 7 in bore in an elm trunk |
| `elm_pump_height` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §6, head above the deck to take the brake |
| `belfry_station_from_stem` | 9.7536 | 32 ft 0 in | SECONDARY | §6 Steel 1805 :1372 and :17921, at the after beams of the forecastle |
| `belfry_width` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §7.1, scaled from Steel's 110-gun proportions |
| `belfry_depth` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §7.1 |
| `belfry_height` | 1.3716 | 4 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §7.1 |
| `belfry_stanchion_square` | 0.1016 | — | RECONSTRUCTED | §6 research 06 deck-layout §7.1 |
| `bell_mouth_diameter` | 0.2794 | 0 ft 11 in | RECONSTRUCTED | §6 research 06 deck-layout §7.1, period Sixth-Rate norm; no dimensioned source found |
| `bell_height` | 0.3302 | 1 ft 1 in | RECONSTRUCTED | §6 research 06 deck-layout §7.1 |
| `galley_chimney_station_from_stem` | 8.5344 | 27 ft 12 in | RECONSTRUCTED | §6 research 06 deck-layout §7.3, moved forward of the model's forecastle break |
| `galley_chimney_coaming_square` | 0.508 | — | RECONSTRUCTED | §6 research 06 deck-layout §7.3, coaming square in the clear |
| `galley_chimney_coaming_height` | 0.2286 | 0 ft 9 in | SECONDARY | §6 Steel 1805 :39451, upper side standing above the deck |
| `galley_funnel_diameter` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §6 research 06 deck-layout §7.3, sheet-copper stack inside the coaming |
| `galley_funnel_height` | 1.2192 | 4 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §7.3, rising about 4 ft above the forecastle with a cowl |
| `steam_grating_offset` | 0.762 | — | RECONSTRUCTED | §6 research 06 deck-layout §7.3, one steam grating each side of the funnel |
| `steam_grating_length` | 0.762 | 2 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §7.3 |
| `steam_grating_width` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §7.3 |
| `skylight_station_from_stem` | 35.9664 | 118 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §4.4, the run of gratings over the great cabin, moved abaft the wheel |
| `skylight_length` | 1.2192 | 4 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §4.4 |
| `skylight_width` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §4.4, 4 ft 0 in of grating on the centreline |
| `skylight_height` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §4.4, a low glazed skylight with a pitched top |
| `companion_station_from_stem` | 37.0332 | 121 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §4.4, over the after ladderway to the cabin |
| `companion_length` | 1.0668 | 3 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §4.4 |
| `companion_width` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §4.4 |
| `companion_above_deck` | 0.2286 | 0 ft 9 in | SECONDARY | §6 Steel 1805 :39451, the companion stands 9 in above the deck |
| `companion_hood_height` | 0.762 | 2 ft 6 in | RECONSTRUCTED | §6 research 06 deck-layout §4.4, sloping hood over the ladder head |
| `companion_framing_thick` | 0.1016 | — | SECONDARY | §6 Steel 1805 :39450, companion framing thick |
| `skid_beam_count` | 4 | — | RECONSTRUCTED | §6 research 06 deck-layout §8.2 |
| `skid_beam_first_station_from_stem` | 13.4112 | 44 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §8.2, the foremost skid |
| `skid_beam_spacing` | 2.4384 | 8 ft 0 in | RECONSTRUCTED | §6 research 06 deck-layout §8.2, four skids spanning 24 ft — the length of the launch — and clear of the mainmast |
| `skid_beam_sided` | 0.2032 | — | RECONSTRUCTED | §6 research 06 deck-layout §8.2 |
| `skid_beam_moulded` | 0.1524 | — | RECONSTRUCTED | §6 research 06 deck-layout §8.2 |
| `skid_beam_top_above_deck` | 1.9812 | 6 ft 6 in | RECONSTRUCTED | §6 from the reference photograph, in which the boats stand with their keels level with the gangways; research 06 §8.2 offers an unsourced 5 ft 0 in |
| `skid_stanchion_square` | 0.127 | — | RECONSTRUCTED | §6 research 06 deck-layout §8.2, a stanchion under each end of each skid |
| `hammock_crane_spacing` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §6 counted off the reference photograph, in which the cranes stand close — nearer 2 ft apart than the 2 ft 6 in to 3 ft usually quoted |
| `hammock_crane_height` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §6 from the reference photograph, standing about 2 ft above the cap rail |
| `hammock_crane_diameter` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §6 the crane is drawn bright rather than blacked, because that is how the reference photograph shows it |
| `hammock_rail_diameter` | 0.0508 | 0 ft 2 in | RECONSTRUCTED | §6 the rail run through the heads of the cranes, which the photograph shows as a light line along the top of them |
| `hammock_crane_spread` | 0.3556 | — | RECONSTRUCTED | §6 the fork at the head of the crane, which carries the netting outboard of the rail |
| `hammock_crane_run_from_stem` | 3.6576 | 12 ft 0 in | RECONSTRUCTED | §6 the cranes begin where the rail leaves the head |
| `hammock_crane_run_short_of_stern` | 0.762 | — | RECONSTRUCTED | §6 the after run stops short of the taffrail |
| `hammock_netting_rows` | 3 | — | RECONSTRUCTED | §6 from the reference photograph, three rows of netting between the cranes |
| `belaying_pin_spacing` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §6 from the reference photograph, pins about a foot apart along the rail |
| `belaying_pin_length` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §6 a turned pin of this length is the period norm |
| `belaying_pin_diameter` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §6 |
| `fife_rail_radius` | 1.0668 | — | RECONSTRUCTED | §6 a fife rail standing clear of the mast and its partners |
| `fife_rail_height` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §6 a man belays at waist height |
| `fife_rail_timber` | 0.127 | — | RECONSTRUCTED | §6 rail and stanchion scantling |
| `ladder_width` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §6 one man wide |
| `ladder_tread_spacing` | 0.2286 | 0 ft 9 in | RECONSTRUCTED | §6 period companion-ladder rise |
| `ladder_stringer_square` | 0.1016 | — | RECONSTRUCTED | §6 |
| `ladder_tread_thickness` | 0.0508 | 0 ft 2 in | RECONSTRUCTED | §6 |

### Armament

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `gun_tompion_depth` | 0.06 | 0 ft 2.4 in | RECONSTRUCTED | §9.4 the plug in the muzzle of a gun on an open deck, to keep the sea out of the bore. The gundeck battery needs none: her ports are shut over them |
| `gun_9pdr_count` | 24 | — | PRIMARY | §6.3 threedecks ex Winfield BWAS-1793, Plymouth establishment 6.1796: 24 long 9-pdr on the upper deck. ALTERNATIVE: 24 x 32-pdr carronades in the 21.4.1798 fit |
| `gun_4pdr_count` | 10 | — | PRIMARY | §6.3 8 long 4-pdr on the quarterdeck and 2 on the forecastle, Plymouth establishment 6.1796. ALTERNATIVE: only the 2 forecastle chase guns survive in the 21.4.1798 fit |
| `carronade_12pdr_count` | 6 | — | PRIMARY | §6.3 4 twelve-pounder carronades on the quarterdeck and 2 on the forecastle, Plymouth establishment 6.1796. ALTERNATIVE: 18-pdr carronades, 10 of them, in the 21.4.1798 fit |
| `gun_truck_carriage_count` | 34 | — | PRIMARY | §6.3 one four-truck carriage under each of the 24 long 9-pdr and 10 long 4-pdr; the carronades are on slides and are not counted here |
| `gun_9pdr_barrel_length` | 2.5908 | 8 ft 6 in | SECONDARY | §9.3 Falconer, Universal Dictionary of the Marine 1776, mensuration of 1753: iron sea-service 9-pdr, 8 ft 6 in, 27 cwt 2 qr 2 lb |
| `gun_9pdr_bore` | 0.1067 | — | SECONDARY | §9.3 nominal bore of a 9-pounder: 4.0 in shot with the establishment windage of 0.2 in |
| `gun_4pdr_barrel_length` | 1.8288 | 6 ft 0 in | SECONDARY | §9.3 Falconer, mensuration of 1753: iron sea-service 4-pdr, 6 ft 0 in, 12 cwt 2 qr 13 lb |
| `gun_4pdr_bore` | 0.0813 | — | SECONDARY | §9.3 nominal bore of a 4-pounder: 3.05 in shot with establishment windage |
| `carronade_12pdr_barrel_length` | 0.8128 | 2 ft 8 in | RECONSTRUCTED | §9.3 the 32-pdr Carron pattern of 1796 is 4 ft 0 in on a 6.35 in bore, 7.6 calibres; 7.0 calibres on the 12-pdr bore gives 2 ft 8 in |
| `carronade_12pdr_bore` | 0.1173 | — | RECONSTRUCTED | §9.3 12-pdr shot of 4.4 in with carronade windage, which is tighter than a long gun's |
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
| `carronade_breech_radius_cal` | 1.02 | — | RECONSTRUCTED | §9.3 a carronade is thin metal beside a long gun: about one calibre of radius at the breech ring |
| `carronade_body_radius_cal` | 0.86 | — | RECONSTRUCTED | §9.3 the parallel body forward of the reinforce ring |
| `carronade_chase_radius_cal` | 0.78 | — | RECONSTRUCTED | §9.3 the chase just abaft the muzzle ring |
| `carronade_muzzle_radius_cal` | 0.88 | — | RECONSTRUCTED | §9.3 the muzzle, which on a carronade is a cup rather than a swell |
| `carronade_muzzle_cup_depth_u` | 0.07 | — | RECONSTRUCTED | §9.3 the countersunk cup at the muzzle, the carronade's most recognisable feature |
| `carronade_reinforce_ring_u` | 0.16 | — | RECONSTRUCTED | §9.3 the ring abaft which the metal is thickest |
| `carronade_muzzle_ring_u` | 0.86 | — | RECONSTRUCTED | §9.3 the ring at the root of the muzzle |
| `carronade_loop_from_muzzle_u` | 0.52 | — | RECONSTRUCTED | §9.5 the loop under the piece, which takes the bolt through the upper carriage, is at the point of balance |
| `carronade_loop_depth_cal` | 0.7 | — | RECONSTRUCTED | §9.5 how far the loop hangs below the metal |
| `gun_9pdr_axis_above_deck` | 0.8636 | 2 ft 10 in | RECONSTRUCTED | §9.4 Falconer's rule applied to the hull's own sill of 1 ft 9 in and port depth of 2 ft 4.8 in: the bore axis stands 13 in above the sill |
| `gun_4pdr_axis_above_deck` | 0.6858 | 2 ft 3 in | RECONSTRUCTED | §9.4 the same rule on the smaller piece and its lower carriage |
| `gun_9pdr_carriage_length` | 1.3462 | 4 ft 5 in | RECONSTRUCTED | §9.4 Falconer's proportion of about 0.52 of the barrel length, on an 8 ft 6 in gun |
| `gun_9pdr_carriage_width` | 0.9144 | 3 ft 0 in | RECONSTRUCTED | §9.4 over the trucks; must clear the 2 ft 6 in port with the side tackles |
| `gun_4pdr_carriage_length` | 0.9652 | 3 ft 2 in | RECONSTRUCTED | §9.4 the same proportion of 0.52 on a 6 ft 0 in gun |
| `gun_4pdr_carriage_width` | 0.7112 | 2 ft 4 in | RECONSTRUCTED | §9.4 scaled with the piece |
| `gun_carriage_trunnion_from_fore` | 0.254 | — | RECONSTRUCTED | §9.4 the trunnion notch is cut ten inches abaft the fore end of the cheeks, over the fore axletree |
| `gun_carriage_cheek_thickness` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §9.4 bracket thickness; Falconer: "the breadth of the wheels is always equal to that of the cheeks" |
| `gun_carriage_cheek_mid_u` | 0.72 | — | RECONSTRUCTED | §9.4 the first step down in the top of the cheek, as a fraction of the height at the fore end |
| `gun_carriage_cheek_aft_u` | 0.46 | — | RECONSTRUCTED | §9.4 the second step down, at the after end where the bed and quoin go |
| `gun_carriage_step_mid_u` | 0.4 | — | RECONSTRUCTED | §9.4 where the first step falls, as a fraction of the carriage length from the fore end |
| `gun_carriage_step_aft_u` | 0.68 | — | RECONSTRUCTED | §9.4 where the second step falls |
| `gun_axletree_siding` | 0.1143 | 0 ft 4.5 in | RECONSTRUCTED | §9.4 the axletrees are square timbers a little stouter than the cheeks |
| `gun_9pdr_truck_fore_diameter` | 0.381 | 1 ft 3 in | SECONDARY | §9.4 scaled from the measured 24-pdr fore truck of 18 in (Ships of Scale, truck carriages of 1777) |
| `gun_9pdr_truck_rear_diameter` | 0.3302 | 1 ft 1 in | SECONDARY | §9.4 the rear truck is smaller than the fore, which helps check the recoil against the deck camber |
| `gun_4pdr_truck_fore_diameter` | 0.3048 | 1 ft 0 in | RECONSTRUCTED | §9.4 the same proportion on the smaller carriage |
| `gun_4pdr_truck_rear_diameter` | 0.2667 | 0 ft 10.5 in | RECONSTRUCTED | §9.4 as above |
| `gun_truck_thickness` | 0.1016 | 0 ft 4 in | SECONDARY | §9.4 Falconer: the breadth of the wheels equals that of the cheeks |
| `gun_stool_bed_length` | 0.4064 | 1 ft 4 in | SECONDARY | §9.4 Falconer names the bed, which carries the quoin under the breech |
| `gun_stool_bed_depth` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §9.4 thickness of the bed between the cheeks |
| `gun_quoin_length` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §9.4 the wedge that lies on the bed and holds the breech up |
| `gun_cap_square_thickness` | 0.0254 | 0 ft 1 in | RECONSTRUCTED | §9.4 the iron clamp over each trunnion, which Falconer calls the cap-square |
| `gun_transom_siding` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §9.4 the transom across the cheeks abaft the bed |
| `carronade_slide_length` | 1.2192 | 4 ft 0 in | RECONSTRUCTED | §9.5 5 ft 0 in on the 32-pdr Carron pattern, scaled to the 12-pdr piece |
| `carronade_slide_width` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §9.5 1 ft 4 in on the 32-pdr slide, scaled |
| `carronade_slide_depth` | 0.1524 | 0 ft 6 in | RECONSTRUCTED | §9.5 depth of the lower bed timber |
| `carronade_bed_length` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §9.5 the upper carriage, or slider, that the piece is bolted to: 2 ft 6 in on the 32-pdr |
| `carronade_bed_depth` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §9.5 depth of the upper carriage |
| `carronade_axis_above_deck` | 0.6604 | 2 ft 2 in | RECONSTRUCTED | §9.5 2 ft 8 in on the 32-pdr slide, scaled to the 12-pdr; a carronade sits markedly lower than a long gun on its truck carriage |
| `carronade_muzzle_beyond_pivot` | 0.508 | — | RECONSTRUCTED | §9.5 how far the muzzle stands forward of the pivot bolt when the piece is run out on the slide |
| `carronade_pivot_bolt_diameter` | 0.0381 | 0 ft 1.5 in | SECONDARY | §9.5 pivot bolt at the fore end of the slide, 1.5 in |
| `carronade_rear_truck_diameter` | 0.1524 | 0 ft 6 in | SECONDARY | §9.5 two traverse trucks of 6 in under the after end of the slide |
| `carronade_elevating_screw_diameter` | 0.0381 | 0 ft 1.5 in | SECONDARY | §9.5 the elevating screw through the breech, 1.5 in; it replaces the quoin of a long gun |
| `gun_breeching_diameter` | 0.033 | 0 ft 1.3 in | SECONDARY | §9.6 breeching circumference is about 0.95 of the bore diameter, so 4 in of circumference on a 9-pdr, which is 1.3 in in the round |
| `gun_breeching_sag` | 0.09 | — | RECONSTRUCTED | §9.6 the bight of the breeching hangs slack between the cascabel and the ship's side when the gun is run out |
| `gun_breeching_bolt_from_port` | 0.6858 | — | SECONDARY | §9.6 the two ring bolts in the ship's side, one each side of the port; Steel's contract gives 1.25 in bolts with 3.5 in rings |
| `gun_breeching_bolt_above_sill` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §9.6 the ring bolts stand a little above the level of the port sill |
| `gun_tackle_diameter` | 0.0229 | 0 ft 0.9 in | RECONSTRUCTED | §9.6 the gun and train tackle falls are lighter than the breeching |
| `gun_tackle_sag` | 0.05 | — | RECONSTRUCTED | §9.6 the falls are bowsed taut when the gun is run out, so there is very little bight in them |
| `gun_train_tackle_length` | 1.2192 | 4 ft 0 in | SECONDARY | §9.6 the train tackle runs from the rear of the carriage to an eye bolt in the deck on the centreline side |
| `gun_housed_muzzle_inboard` | 0.1016 | — | RECONSTRUCTED | §9.4 the muzzle comes inside the planking far enough for the lid to shut over it and be bowsed to; four inches is what the lashing and the lid between them need |
| `gun_housed_elevation_deg` | 18 | — | RECONSTRUCTED | §9.4 the muzzle is lashed up to the ring bolt above the port, which stands about a foot over the port head; the elevation follows from the geometry of the two |
| `gun_run_out_side_clearance` | 0.0508 | — | RECONSTRUCTED | §9.4 a gun run out has its fore trucks all but against the ship's side; this is what is left between the fore end of the cheeks and the inboard face of the side |
| `gun_quarterdeck_first_from_stem` | 24.0792 | 79 ft 0 in | RECONSTRUCTED | §9.2 the foremost quarterdeck piece stands just abaft the break, which is 78 ft abaft the stem |
| `gun_quarterdeck_spacing` | 1.9304 | 6 ft 4 in | RECONSTRUCTED | §9.2 six pieces a side on Steel's equal-spacing rule, closed up so that the aftermost stands forward of the quarter badge |
| `gun_quarterdeck_carronades_forward` | 2 | — | RECONSTRUCTED | §9.1 the two carronades a side take the foremost quarterdeck stations, where the piece can be trained widest across the waist; the four long 4-pdrs stand abaft them |
| `gun_forecastle_carronade_from_stem` | 7.62 | 25 ft 0 in | RECONSTRUCTED | §9.2 forecastle carronade station, one a side |
| `gun_forecastle_gun_from_stem` | 5.4864 | 18 ft 0 in | RECONSTRUCTED | §9.2 the two long 4-pdr chase guns, one a side, mounted abreast on the forecastle; in action they were shifted to the bow ports in the beakhead bulkhead |
| `gun_deck_inset` | 0.1524 | — | RECONSTRUCTED | §9.2 how far inboard of the deck edge a quarterdeck or forecastle piece stands, there being no bulwark carried up round those decks in the hull as traced |

### Boats

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `boat_gripe_width` | 0.1 | 0 ft 3.9 in | RECONSTRUCTED | §8.3 the canvas gripes that pass over a stowed boat and set up to ring bolts in the deck. In this weather they are doubled: a boat adrift on the skids is two tons of it |
| `boat_gripe_thickness` | 0.018 | 0 ft 0.7 in | RECONSTRUCTED | §8.3 canvas and rope, not timber |
| `boat_count` | 4 | — | RECONSTRUCTED | §8.3 launch, pinnace, cutter and jolly boat — the outfit of a sixth rate of 578 tons; no boat list for Surprise was found |
| `launch_length` | 7.3152 | 24 ft 0 in | RECONSTRUCTED | §8.3 24 ft launch for a ship of this rate |
| `launch_beam` | 2.1336 | 6 ft 12 in | RECONSTRUCTED | §8.3 launch beam 7 ft 0 in |
| `launch_depth` | 0.8636 | 2 ft 10 in | RECONSTRUCTED | §8.5 depth amidships at length/8.5, Steel's boat proportion; the scantling folio is illegible |
| `pinnace_length` | 7.3152 | 24 ft 0 in | RECONSTRUCTED | §8.3 pinnace 24-26 ft; the shorter figure taken so that she stows on the same skid beams as the launch |
| `pinnace_beam` | 1.7526 | 5 ft 9 in | RECONSTRUCTED | §8.3 pinnace beam 5 ft 9 in |
| `pinnace_depth` | 0.6858 | 2 ft 3 in | RECONSTRUCTED | §8.5 length/10.7; a pinnace is shallower and finer than a launch |
| `cutter_length` | 5.4864 | 18 ft 0 in | RECONSTRUCTED | §8.3 cutter 18-22 ft; the shortest taken so that she nests inside the 24 ft launch |
| `cutter_beam` | 1.8288 | 6 ft 0 in | RECONSTRUCTED | §8.3 cutter beam 6 ft 0 in — "shorter, broader and deeper in proportion", Steel |
| `cutter_depth` | 0.7112 | 2 ft 4 in | RECONSTRUCTED | §8.5 length/7.7; a cutter is deep for her length |
| `jolly_length` | 4.8768 | 16 ft 0 in | RECONSTRUCTED | §8.3 jolly boat 16-18 ft, the smaller taken |
| `jolly_beam` | 1.6764 | 5 ft 6 in | RECONSTRUCTED | §8.3 jolly boat beam 5 ft 6 in |
| `jolly_depth` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §8.5 length/8 |
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
| `boat_stow_height` | 1.524 | 5 ft 0 in | RECONSTRUCTED | §8.2 top of the skid beams 5 ft 0 in above the upper deck; used only where the furniture module has not defined skid_beam_top_above_deck |
| `boat_chock_height` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §8.2 "boat chocks, two per boat, shaped to the boat's bilges" |
| `boat_chock_width` | 0.1524 | 0 ft 6 in | RECONSTRUCTED | §8.2 chock sided 6 in |
| `boat_chock_spread` | 0.62 | — | RECONSTRUCTED | §8.2 the chocks take the boat under her bilges, at 0.62 of the half breadth |
| `boat_chock_station` | 0.28 | — | RECONSTRUCTED | §8.2 the two chocks stand this fraction of the length either side of the boat's midlength |
| `boat_stow_station` | 17.0688 | — | RECONSTRUCTED | §8.2 midway along the four skid beams; the furniture module lays them from X = 44 ft at 8 ft centres, so their middle is X = 56 ft |
| `launch_stow_offset` | 1.0668 | — | RECONSTRUCTED | §8.2 launch stowed to starboard of the centreline so that the pinnace stows beside her inside the 24 ft clear of the waist |
| `pinnace_stow_offset` | 1.0668 | — | RECONSTRUCTED | §8.2 pinnace to port, the mirror of the launch |
| `cutter_nest_rise` | 0.762 | — | RECONSTRUCTED | §8.2 "nested one atop the other"; the rise that lands the cutter's keel on top of the launch's thwarts rather than through them |
| `cutter_nest_shift` | 0.3048 | — | RECONSTRUCTED | §8.2 the nested cutter set a foot aft in the launch to clear her stem |
| `davit_station` | 35.3568 | — | RECONSTRUCTED | §8.4 quarter davits stepped on the starboard quarterdeck rail 10 ft forward of the sternpost, where the photograph carries a boat aft |
| `davit_spacing` | 2.7432 | 9 ft 0 in | RECONSTRUCTED | §8.4 the two davits set to take the jolly boat a little inside her stem and stern |
| `davit_height_above_rail` | 1.3716 | — | RECONSTRUCTED | §8.4 davit head high enough to swing the boat clear of the rail |
| `davit_outreach` | 1.524 | — | RECONSTRUCTED | §8.4 the davits reach far enough outboard to swing the boat clear of the quarterdeck rail; §8.4 gives 6 ft of projection for the longer transom davit |
| `davit_diameter` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §8.4 davit 5 in in diameter at the step |
| `davit_fall_diameter` | 0.0381 | 0 ft 1.5 in | RECONSTRUCTED | §8.4 boat fall of 1½ in rope |
| `jolly_hang_below_davit` | 0.8382 | — | RECONSTRUCTED | §8.4 boat griped up close under the davit heads for sea |
| `boat_oar_count` | 10 | — | RECONSTRUCTED | §8.3 Steel: "Pinnaces never row more than eight oars, whereas Barges are constructed to row with ten" |
| `boat_oar_length` | 4.572 | 15 ft 0 in | RECONSTRUCTED | §8.3 oar length by Steel's rule for a boat of this beam, stowed fore and aft |
| `boat_oar_diameter` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §8.5 loom of the oar 3 in |
| `boat_oar_blade_width` | 0.1397 | 0 ft 5.5 in | RECONSTRUCTED | §8.5 blade of the oar |
| `boat_hook_count` | 2 | — | RECONSTRUCTED | §8.3 a pair of boat hooks stowed along the thwarts |
| `boat_hook_length` | 3.048 | 10 ft 0 in | RECONSTRUCTED | §8.3 boat hook stowed along the thwarts |
| `boat_mast_length` | 4.572 | 15 ft 0 in | RECONSTRUCTED | §8.3 the boat's own mast, unstepped and stowed in her with the sail furled to it |
| `boat_furled_sail_diameter` | 0.254 | 0 ft 10 in | RECONSTRUCTED | §8.3 the boat's lug sail furled round its own yard |
| `boat_furled_sail_length` | 2.7432 | 9 ft 0 in | RECONSTRUCTED | §8.3 the furl runs over the middle of the mast |

### Ground tackle

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `anchor_count_total` | 4 | — | SECONDARY | §13.1 Steel 1805 :43220 — four large stocks and two small to every class; the two bowers, the sheet and the kedge are the four modelled |
| `anchor_count_bower` | 2 | — | PRIMARY | §13.1 best bower and small bower, one to each cathead |
| `anchor_bower_weight_cwt` | 34 | — | SECONDARY | §13.1 Steel 1805 Folio LVI, 32-gun column — 34 cwt, 1727 kg |
| `anchor_shank_length` | 5.0292 | 16 ft 6 in | RECONSTRUCTED | §13.2 the period rule that the shank equals the stock; stock from Steel's series scaled by the cube root of the weight |
| `anchor_shank_square_trend` | 0.2286 | — | RECONSTRUCTED | §13.2 shank square at the trend, about 1/22 of the shank — the smith's proportion |
| `anchor_shank_square_head` | 0.1524 | — | RECONSTRUCTED | §13.2 shank square at the head, two thirds of the square at the trend |
| `anchor_arm_span` | 2.7432 | — | RECONSTRUCTED | §13.2 fluke tip to fluke tip at 0.55 of the shank, the standard long-shank proportion |
| `anchor_arm_angle_deg` | 60 | — | RECONSTRUCTED | §13.2 the arm stands 60 degrees off the shank on the Admiralty long-shank pattern |
| `anchor_arm_square_crown` | 0.2032 | — | RECONSTRUCTED | §13.2 the arm at the crown, a little under the shank at the trend |
| `anchor_arm_square_tip` | 0.0762 | — | RECONSTRUCTED | §13.2 the arm tapering to the bill |
| `anchor_palm_length` | 1.016 | 3 ft 4 in | RECONSTRUCTED | §13.2 palm at 0.20 of the shank |
| `anchor_palm_width` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §13.2 palm breadth at 0.6 of its length, the usual proportion |
| `anchor_palm_thickness` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §13.2 palm thickness, forged out of the arm |
| `anchor_palm_along_arm` | 0.6 | — | RECONSTRUCTED | §13.2 the palm centred at 0.60 of the arm out from the crown |
| `anchor_ring_diameter` | 0.6604 | 2 ft 2 in | RECONSTRUCTED | §13.2 ring diameter for a 34 cwt anchor |
| `anchor_ring_bar_diameter` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §13.2 the ring bar at about one eighth of the ring |
| `anchor_nut_length` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §13.2 the nuts under the stock that stop it turning on the shank |
| `anchor_stock_length` | 5.0292 | 16 ft 6 in | RECONSTRUCTED | §13.2 Steel 1805 :43221 series (22-0 / 21-9 / 20-6 / …) carried to the 32-gun column by cube-root-of-weight scaling |
| `anchor_stock_square_middle` | 0.381 | — | RECONSTRUCTED | §13.2 scaled from Steel :43222 (1-10 / 1-9¼ / 1-8¼ / 1-8 / 1-7¾) |
| `anchor_stock_square_ends` | 0.2032 | — | RECONSTRUCTED | §13.2 scaled from Steel :43223 |
| `anchor_stock_gap_middle` | 0.1778 | — | SECONDARY | §13.2 Steel :43224, the opening left between the two pieces at the middle for the shank |
| `anchor_stock_below_head` | 0.254 | — | RECONSTRUCTED | §13.2 the stock seated one shank-square below the head, under the nuts |
| `anchor_stock_hoop_count` | 4 | — | SECONDARY | §13.2 Steel :43226 — four iron hoops to each stock |
| `anchor_stock_hoop_breadth` | 0.076 | 0 ft 3 in | SECONDARY | §13.2 Steel :43227, hoops 3 in broad |
| `anchor_stock_hoop_thickness` | 0.016 | 0 ft 0.6 in | SECONDARY | §13.2 Steel :43228, hoops 5/8 in thick |
| `anchor_ring_below_cathead` | 0.762 | — | RECONSTRUCTED | §13.3 a three-sheave cat block, its strop and the hook into the ring, hanging from the sheaves in the cathead |
| `anchor_crown_from_stem` | 7.3152 | 24 ft 0 in | RECONSTRUCTED | §13.3 research 06, crown and flukes bedded on the fore channel 24 ft abaft the stem |
| `anchor_crown_above_channel` | 0.1016 | — | RECONSTRUCTED | §13.3 the arm bearing on the channel, not sunk into it |
| `anchor_crown_outboard_of_side` | 0.4572 | — | RECONSTRUCTED | §13.3 the crown bedded a foot and a half outboard of the ship's side, inside the channel's outer edge |
| `anchor_stock_cant_deg` | 84 | — | RECONSTRUCTED | §PHOTO the stock standing up beside the cathead and canted out over the forecastle rail, read off the reference photograph and set so that the whole stock clears the head rails |
| `sheet_anchor_scale` | 1 | — | SECONDARY | §13.1 Steel :43220 — the sheet is one of the four large anchors, so it is a bower's size |
| `kedge_anchor_scale` | 0.585 | — | RECONSTRUCTED | §13.1 the kedge at one fifth of a bower's weight, scaled by the cube root |
| `stowed_anchor_ring_from_stem` | 4.1148 | 13 ft 6 in | RECONSTRUCTED | §13.1 stowed on the forecastle, ring forward, set so that the crown of the larger spare lies clear forward of the forecastle break |
| `stowed_anchor_forward_of_break` | 0.4572 | — | RECONSTRUCTED | §13.1 how far forward of the break of the forecastle the crown of a stowed anchor is chocked, so that the palms bear on the deck and not on the coaming |
| `stowed_anchor_inboard_of_side` | 1.2192 | — | RECONSTRUCTED | §13.1 the shank laid four feet in from the ship's side, leaving the gangway clear |
| `stowed_anchor_above_deck` | 0.127 | 0 ft 5 in | RECONSTRUCTED | §13.1 the shank bearing on the palms and on its chocks |
| `stowed_stock_beside_shank` | 0.5334 | — | RECONSTRUCTED | §13.1 the unshipped stock lashed on deck alongside its own anchor |
| `hawse_hole_count_per_side` | 2 | — | RECONSTRUCTED | §12 two hawse holes a side, the working hawse and the spare, as on every frigate of the rate |
| `hawse_hole_first_from_stem` | 1.2192 | 4 ft 0 in | RECONSTRUCTED | §12 as far forward as the hawse pieces allow |
| `hawse_hole_spacing` | 0.5334 | 1 ft 9 in | RECONSTRUCTED | §12 the two holes of a side set a bore and a half apart |
| `hawse_hole_diameter` | 0.2032 | 0 ft 8 in | RECONSTRUCTED | §12 bored at about 1.6 times the cable, so that the cable renders freely |
| `hawse_hole_above_deck` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §12 bored with the lower edge on the gundeck at side, which puts the centre half a bore above it |
| `hawse_bolster_projection` | 0.038 | — | SECONDARY | §12 Steel :41221, the bolsters (naval hoods) project 1½ in from the cheeks |
| `anchor_cable_diameter` | 0.128 | 0 ft 5 in | RECONSTRUCTED | §13 the standing rule that the bower cable's circumference in inches is half the extreme breadth in feet: 31 ft 8 in gives 15.8 in round, 5.03 in through |
| `anchor_cable_sag` | 0.11 | — | RECONSTRUCTED | §13 the slack in a heavy cable bent to a catted anchor |
| `cat_block_length` | 0.6096 | 2 ft 0 in | RECONSTRUCTED | §13.3 a three-sheave cat block to match the three sheaves in the cathead (Steel :40068) |
| `cat_block_width` | 0.3556 | 1 ft 2 in | RECONSTRUCTED | §13.3 three sheaves of 10 in and their partitions |
| `cat_block_thickness` | 0.254 | 0 ft 10 in | RECONSTRUCTED | §13.3 sheaves 2 in thick in a three-sheave shell (Steel :40070) |
| `shank_painter_diameter` | 0.032 | 0 ft 1.3 in | SECONDARY | §13.3 Steel :40292 and :44589, stopper bolts 1¼ in — the shank painter chain is of that bar |
| `shank_painter_bolt_from_stem` | 6.096 | 20 ft 0 in | RECONSTRUCTED | §13.3 "a chain bolted through the topside, abaft the cathead" (Steel :4552) |
| `shank_painter_on_shank` | 0.78 | — | RECONSTRUCTED | §13.3 the painter takes the shank near the crown |
| `anchor_lining_from_stem` | 6.096 | 20 ft 0 in | RECONSTRUCTED | §13.3 the lining laid where the fluke bears, forward of the crown |
| `anchor_lining_length` | 2.1336 | 6 ft 12 in | RECONSTRUCTED | §13.3 Steel :42535 gives 10 ft 6 in for a 110-gun ship, scaled to the rate |
| `anchor_lining_height` | 0.4572 | 1 ft 6 in | RECONSTRUCTED | §13.3 a sacrificial plank deep enough to take the fluke |
| `anchor_lining_thickness` | 0.0762 | 0 ft 3 in | RECONSTRUCTED | §13.3 a thick strake laid on the topside |

### Colours

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `ensign_staff_length` | 4.8768 | 16 ft 0 in | RECONSTRUCTED | §12.4 staff long enough to fly an 8-breadth ensign clear of the taffrail |
| `canton_post_1801` | 0 | — | PRIMARY | §6.1 the Union of 1707 stood until 31 Dec 1800; SURPRISE is modelled 1798, so no St Patrick |
| `ensign_at_staff` | 0 | — | SECONDARY | §6.4 ensign at the gaff peak under sail; confirmed by the reference photograph |
| `jack_worn_under_way` | 0 | — | SECONDARY | §6.4 "a ship under full sail does NOT wear a jack" — anchors catted means under way |
| `ensign_hoist` | 1.8288 | — | RECONSTRUCTED | §6.3 8 breadths x 9 in bunting (crwflags ensign establishment) |
| `ensign_fly` | 3.2918 | — | SECONDARY | §6.3 mid-18th-c ensign proportion 5:9, correct for 1798 (1:2 only from 1799) |
| `ensign_canton_hoist_frac` | 0.5 | — | RECONSTRUCTED | §6.3 standard British ensign construction, canton = 1/2 hoist |
| `ensign_canton_fly_frac` | 0.4444 | — | RECONSTRUCTED | §6.3 standard British ensign construction, canton = 4/9 fly on a 5:9 ensign |
| `ensign_peak_from_stem` | 41.13 | 134 ft 11.3 in | RECONSTRUCTED | §04-8/§04-3.2 mizen centre 32.903 + rake 0.43 + gaff 9.906 x cos 38 deg; agrees with the spanker gaff the rig now builds — RECONCILE WITH RIG |
| `ensign_peak_height` | 15.2 | 49 ft 10.4 in | SECONDARY | §04-3.2 the peak of the mizzen gaff: throat at 8.93 m, where 0.52 of the run from the mizzen deck to its hounds falls, plus a 32 ft 6 in gaff peaked at 38 degrees, plus the flag head a hand above the peak |
| `ensign_staff_from_stem` | 38.3 | 125 ft 7.9 in | RECONSTRUCTED | §04-10 taffrail station, just forward of the sternpost — RECONCILE WITH STERN |
| `flag_ensign_staff_height` | 9.144 | 30 ft 0 in | SECONDARY | §04-10 Steel, ensign staff 30 ft above the taffrail for a 28-gun ship |
| `ensign_halliard_belay_from_stem` | 34.6 | 113 ft 6.2 in | RECONSTRUCTED | §6.4 peak halliard belayed at the mizen fife rail, a fathom abaft the mast |
| `pennant_hoist` | 0.6604 | — | SECONDARY | §6.3 frigate masthead pendant 2 ft 2 in x 46 ft 9 in (gwpda naval establishment) |
| `pennant_length` | 14.2494 | 46 ft 9 in | SECONDARY | §6.3 frigate masthead pendant 2 ft 2 in x 46 ft 9 in (gwpda naval establishment) |
| `pennant_fly_width` | 0.1016 | 0 ft 4 in | RECONSTRUCTED | §6.3 4 in given for pendants over 6 yd; read here as the width of the tapered fly |
| `pennant_george_frac` | 2 | — | RECONSTRUCTED | §6.4 pre-1801 pendant: St George at the hoist, squadron colour in the fly; hoist portion drawn twice the hoist depth |
| `pennant_from_stem` | 22.62 | 74 ft 2.6 in | RECONSTRUCTED | §04-8 main centre 21.752 abaft the fore perpendicular + 0.99 deg of rake; matched to the main royal pole the rig builds — RECONCILE WITH RIG |
| `pennant_height` | 38.62 | 126 ft 8.5 in | SECONDARY | §04-9 main truck by Steel 1794 masting: keelson step, 81 ft 4 in lower mast, 48 ft 9 in topmast and 24 ft 4 in topgallant with their doublings |
| `pennant_halliard_drop` | 2.4384 | — | RECONSTRUCTED | §6.4 pendant halliard from the truck down to the topgallant crosstrees — RECONCILE WITH RIG |
| `pennant_segment_multiple` | 2 | — | RECONSTRUCTED | §6.4 mesh resolution only, not a dimension of the ship |
| `jack_hoist` | 0.9144 | — | RECONSTRUCTED | §6.3 4 breadths x 9 in, half the ensign, on the standard 1:2 Union proportion |
| `jack_fly` | 1.8288 | — | RECONSTRUCTED | §6.3 Union flag proportion 1:2 |
| `jack_from_stem` | 0.3 | 0 ft 11.8 in | RECONSTRUCTED | §6.4 jackstaff on the stemhead at the heel of the bowsprit — RECONCILE WITH HEAD/RIG |
| `flag_jack_staff_height` | 4.2672 | 13 ft 12 in | SECONDARY | §04-10 Steel, jack staff 14 ft, i.e. 14/30 of the ensign staff |
| `union_cross_width_frac` | 0.2 | — | RECONSTRUCTED | §6.1 standard Union construction, St George cross 1/5 of the hoist |
| `union_fimbriation_frac` | 0.0667 | — | RECONSTRUCTED | §6.1 standard Union construction, white fimbriation 1/15 of the hoist each side |
| `union_saltire_width_frac` | 0.2 | — | RECONSTRUCTED | §6.1 standard Union construction, the diagonal band 1/5 of the hoist |
| `union_patrick_frac` | 0.0667 | — | RECONSTRUCTED | §6.1 post-1801 only, St Patrick red 2/30 of the hoist |
| `union_patrick_offset_frac` | 0.0333 | — | RECONSTRUCTED | §6.1 post-1801 counterchange, red offset 1/30 from the band centre so the broad white is uppermost at the top hoist |
| `flag_wind_bearing_deg` | 60 | — | RECONSTRUCTED | §6.4 wind from the starboard bow; the flags stream aft and to port, agreeing with the sails full on the starboard tack |
| `flag_droop_frac` | 0.17 | — | RECONSTRUCTED | §6.4 "pronounced sag at the fly" — wool bunting, sag as a fraction of the fly |
| `flag_wave_amplitude_frac` | 0.24 | — | RECONSTRUCTED | §6.4 "long, slow wave" — amplitude as a fraction of the hoist |
| `flag_wave_length_frac` | 0.45 | — | RECONSTRUCTED | §6.4 "long, slow wave" — wavelength as a fraction of the fly |
| `flag_wave_skew` | 0.3 | — | RECONSTRUCTED | §6.4 the wave runs diagonally across the cloth, not straight down the hoist |
| `flag_stream_slack` | 0.07 | — | RECONSTRUCTED | §6.4 cloth taken up by the wave, so the fly does not reach its full length downwind |
| `flag_wave_growth_exponent` | 1.3 | — | RECONSTRUCTED | §6.4 "higher damping and lower stiffness than a modern flag preset" |
| `flag_wave_harmonic` | 0.35 | — | RECONSTRUCTED | §6.4 a second harmonic at a third of the amplitude, so the wave is not a pure sine |
| `flag_wave_phase` | 0.35 | — | RECONSTRUCTED | §6.4 baked attitude of the ensign; a phase, not a dimension |
| `flag_wave_phase_pennant` | 2.1 | — | RECONSTRUCTED | §6.4 baked attitude of the pendant; a phase, not a dimension |
| `flag_wave_phase_jack` | 4.05 | — | RECONSTRUCTED | §6.4 baked attitude of the jack; a phase, not a dimension |
| `flag_halliard_diameter` | 0.016 | 0 ft 0.6 in | RECONSTRUCTED | §6.4 signal halliard, small stuff rove through a block at the peak |
| `flag_halliard_sag` | 0.015 | — | RECONSTRUCTED | §6.4 a halliard swigged up taut carries very little sag |

### The watch on deck

| key | metric | period figure | grade | source |
|---|---|---|---|---|
| `crew_figure_height` | 1.6764 | 5 ft 6 in | RECONSTRUCTED | §9 the average height of a British seaman in the 1790s, from the surviving Marine and Navy muster descriptions. This is the number that gives the ship her scale |
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
| `crew_helm_abaft_wheel` | 0.4572 | — | RECONSTRUCTED | §9 a helmsman stands close abaft the wheel with the spokes at arm's length |
| `crew_helm_spread` | 1.0668 | — | RECONSTRUCTED | §9 the two men of a double wheel stand one at each wheel, which is what the second wheel is for |
| `crew_con_abaft_binnacle` | 0.6096 | — | RECONSTRUCTED | §9 the officer of the watch cons her from beside the binnacle, where he can see the compass and the weather leech together |
| `crew_lookout_from_stem` | 6.096 | 20 ft 0 in | RECONSTRUCTED | §9 the forecastle lookout, well forward and at the weather rail |
| `crew_waist_from_stem` | 21.336 | 70 ft 0 in | RECONSTRUCTED | §9 the hands at the chain pumps, which are immediately either side of the mainmast |
| `crew_brace_from_stem` | 28.956 | 95 ft 0 in | RECONSTRUCTED | §9 the after braces are belayed abaft the mizzen, and in a gale there are hands standing by them |
| `crew_taffrail_from_stem` | 37.1856 | 122 ft 0 in | RECONSTRUCTED | §9 an officer aft at the taffrail, watching the following sea, which is the whole business of running before a gale |
| `crew_rail_inset` | 0.62 | — | RECONSTRUCTED | §9 how far out toward the ship's side a man stands, as a fraction of the half-breadth at his station. He stands by the rail, not on the centreline |
| `crew_top_inset` | 0.55 | — | RECONSTRUCTED | §9 how far out on the top platform a man stands, as a fraction of its half-breadth |
| `crew_coat_tail_drop` | 0.34 | — | RECONSTRUCTED | §9 how far an officer's coat tails hang below his waist, as a fraction of his leg. The tailed coat is the officer silhouette — take it away and he is a seaman in better cloth |
| `crew_jacket_drop` | 0.1 | — | RECONSTRUCTED | §9 a seaman's jacket ends just below the hip and no lower. It is cut short so that it does not foul him when he goes aloft |
| `crew_hat_brim` | 0.1143 | — | RECONSTRUCTED | §9 the brim of a round hat, beyond the crown all round. It is the widest thing about a man's head and the part that survives being three hundred pixels away |
| `crew_hat_crown` | 0.0889 | — | RECONSTRUCTED | §9 the crown of a low round hat, tarred against the weather |
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
| `crew_count` | 13 | — | RECONSTRUCTED | §9 the watch on deck of a frigate with a company of about two hundred, in weather that has driven everyone else below: two at the wheel, two officers, seven of the watch and two in the main top |
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
| stem_c | -22.59 | -0.57 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 0.981 | 1.354 | 1.645 | 1.795 | 1.878 | 1.937 | 1.979 | 2.010 | 2.031 | 2.047 | 2.058 | 2.060 | 1.75 | 1.795 | 6.45 | 1.968 |
| stem_b | -22.05 | -2.27 | — | — | — | — | — | — | — | — | — | — | — | 0.777 | 1.274 | 1.746 | 2.209 | 2.549 | 2.844 | 3.053 | 3.193 | 3.294 | 3.366 | 3.417 | 3.454 | 3.481 | 3.500 | 3.503 | 1.73 | 3.053 | 6.45 | 3.411 |
| stem_a | -21.40 | -3.40 | — | — | — | — | — | — | — | — | — | 0.557 | 0.987 | 1.468 | 1.980 | 2.503 | 3.026 | 3.413 | 3.753 | 4.015 | 4.200 | 4.332 | 4.427 | 4.495 | 4.543 | 4.578 | 4.603 | 4.607 | 1.70 | 4.015 | 6.45 | 4.515 |
| 0 | -20.75 | -3.94 | — | — | — | — | — | — | — | 0.335 | 0.497 | 0.884 | 1.355 | 1.892 | 2.463 | 3.050 | 3.634 | 4.068 | 4.449 | 4.754 | 4.973 | 5.129 | 5.241 | 5.322 | 5.379 | 5.420 | 5.450 | 5.455 | 1.67 | 4.756 | 6.45 | 5.363 |
| 1 | -20.01 | -4.45 | — | — | — | — | — | 0.313 | 0.492 | 0.695 | 0.927 | 1.433 | 2.002 | 2.627 | 3.281 | 3.912 | 4.506 | 4.928 | 5.283 | 5.559 | 5.756 | 5.898 | 5.999 | 6.072 | 5.964 | 5.864 | 5.659 | 5.455 | 1.63 | 5.547 | 6.41 | 5.377 |
| 2 | -17.80 | -5.10 | 0.281 | 0.361 | 0.433 | 0.572 | 0.710 | 1.030 | 1.375 | 1.741 | 2.132 | 2.922 | 3.689 | 4.392 | 4.988 | 5.462 | 5.878 | 6.148 | 6.376 | 6.546 | 6.668 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.55 | 6.515 | 6.23 | 5.441 |
| 3 | -15.56 | -5.10 | 0.348 | 0.468 | 0.609 | 0.847 | 1.096 | 1.640 | 2.236 | 2.817 | 3.338 | 4.158 | 4.851 | 5.409 | 5.848 | 6.182 | 6.443 | 6.595 | 6.734 | 6.834 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.47 | 6.803 | 6.09 | 5.494 |
| 4 | -13.30 | -5.05 | 0.417 | 0.603 | 0.800 | 1.180 | 1.608 | 2.547 | 3.328 | 3.893 | 4.350 | 5.030 | 5.524 | 5.950 | 6.285 | 6.526 | 6.682 | 6.762 | 6.834 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.40 | 6.860 | 5.95 | 5.543 |
| 5 | -11.07 | -5.13 | 0.469 | 0.729 | 1.037 | 1.724 | 2.532 | 3.606 | 4.243 | 4.687 | 5.016 | 5.496 | 5.879 | 6.237 | 6.506 | 6.688 | 6.794 | 6.850 | 6.896 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.35 | 6.885 | 5.83 | 5.585 |
| 6 | -8.82 | -5.05 | 0.524 | 0.885 | 1.385 | 2.817 | 3.537 | 4.277 | 4.766 | 5.127 | 5.390 | 5.806 | 6.122 | 6.403 | 6.626 | 6.762 | 6.853 | 6.899 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.30 | 6.887 | 5.74 | 5.620 |
| 7 | -6.58 | -5.13 | 0.649 | 1.144 | 2.208 | 3.588 | 4.133 | 4.715 | 5.117 | 5.414 | 5.654 | 6.024 | 6.299 | 6.524 | 6.694 | 6.808 | 6.877 | 6.907 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.27 | 6.889 | 5.66 | 5.648 |
| 8 | -4.33 | -5.10 | 0.703 | 1.441 | 2.999 | 4.061 | 4.432 | 4.932 | 5.307 | 5.581 | 5.809 | 6.166 | 6.404 | 6.604 | 6.739 | 6.835 | 6.900 | 6.898 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.25 | 6.890 | 5.63 | 5.658 |
| 9 | -2.09 | -5.13 | 0.847 | 1.841 | 3.639 | 4.260 | 4.614 | 5.077 | 5.418 | 5.695 | 5.918 | 6.252 | 6.469 | 6.651 | 6.767 | 6.853 | 6.914 | 6.907 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.24 | 6.890 | 5.63 | 5.657 |
| 10 | 0.00 | -5.10 | 0.969 | 2.636 | 3.869 | 4.385 | 4.703 | 5.147 | 5.473 | 5.743 | 5.968 | 6.291 | 6.502 | 6.677 | 6.785 | 6.869 | 6.922 | 6.955 | 6.978 | 6.979 | 6.973 | 6.899 | 6.767 | 6.583 | 6.432 | 6.370 | 6.238 | — | 1.25 | 6.979 | 5.65 | 6.233 |
| 11 | 2.07 | -5.13 | 0.604 | 2.330 | 3.839 | 4.364 | 4.691 | 5.147 | 5.473 | 5.731 | 5.949 | 6.293 | 6.536 | 6.675 | 6.777 | 6.864 | 6.919 | 6.907 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | — | 1.26 | 6.889 | 5.66 | 5.648 |
| 12 | 4.32 | -5.08 | 0.604 | 1.720 | 3.576 | 4.248 | 4.594 | 5.079 | 5.412 | 5.673 | 5.883 | 6.234 | 6.487 | 6.659 | 6.779 | 6.864 | 6.916 | 6.907 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.28 | 6.888 | 6.65 | 5.290 |
| 13 | 6.56 | -4.99 | — | 1.414 | 2.492 | 3.886 | 4.321 | 4.888 | 5.182 | 5.471 | 5.708 | 6.077 | 6.358 | 6.556 | 6.702 | 6.810 | 6.895 | 6.907 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.32 | 6.886 | 6.70 | 5.272 |
| 14 | 8.82 | -5.13 | 0.604 | 1.098 | 1.671 | 2.953 | 3.756 | 4.499 | 4.953 | 5.270 | 5.533 | 5.920 | 6.228 | 6.454 | 6.625 | 6.755 | 6.864 | 6.907 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.37 | 6.884 | 6.80 | 5.238 |
| 15 | 11.04 | -5.05 | 0.505 | 0.835 | 1.215 | 1.932 | 2.705 | 3.808 | 4.410 | 4.839 | 5.163 | 5.619 | 5.967 | 6.229 | 6.441 | 6.631 | 6.769 | 6.871 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.43 | 6.880 | 6.89 | 5.206 |
| 16 | 13.27 | -5.10 | 0.446 | 0.658 | 0.919 | 1.379 | 1.841 | 2.809 | 3.666 | 4.198 | 4.577 | 5.175 | 5.611 | 5.939 | 6.210 | 6.404 | 6.525 | 6.892 | 6.898 | 6.868 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.50 | 6.877 | 7.02 | 5.158 |
| 17 | 15.50 | -5.13 | 0.375 | 0.534 | 0.701 | 0.993 | 1.302 | 1.966 | 2.627 | 3.275 | 3.788 | 4.522 | 5.122 | 5.532 | 5.891 | 6.206 | 6.463 | 6.618 | 6.761 | 6.864 | 6.835 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.58 | 6.851 | 7.16 | 5.107 |
| 18 | 17.76 | -5.13 | 0.330 | 0.452 | 0.566 | 0.772 | 0.985 | 1.421 | 1.873 | 2.329 | 2.787 | 3.653 | 4.359 | 4.957 | 5.478 | 5.891 | 6.210 | 6.387 | 6.551 | 6.668 | 6.752 | 6.706 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.68 | 6.670 | 7.33 | 5.044 |
| 19 | 20.01 | -5.13 | 0.330 | 0.452 | 0.566 | 0.772 | 0.871 | 1.066 | 1.314 | 1.629 | 1.956 | 2.643 | 3.430 | 4.187 | 4.862 | 5.443 | 5.857 | 6.072 | 6.240 | 6.372 | 6.468 | 6.536 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.78 | 6.395 | 7.50 | 4.986 |
| 20 | 22.24 | -5.05 | 0.251 | 0.295 | 0.351 | 0.444 | 0.533 | 0.715 | 0.906 | 1.107 | 1.315 | 1.766 | 2.356 | 3.146 | 3.971 | 4.742 | 5.311 | 5.606 | 5.800 | 5.960 | 6.075 | 6.158 | 6.217 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 1.90 | 6.013 | 7.69 | 4.915 |
| 21 | 24.51 | -5.08 | 0.210 | 0.232 | 0.261 | 0.311 | 0.360 | 0.464 | 0.563 | 0.679 | 0.798 | 1.051 | 1.389 | 1.873 | 2.573 | 3.472 | 4.357 | 5.245 | 5.768 | 6.143 | 6.411 | 6.603 | 6.491 | 6.201 | 5.964 | 5.864 | 5.659 | 5.455 | 2.03 | 6.326 | 7.92 | 4.833 |
| 22 | 26.69 | -3.93 | — | — | — | — | — | — | — | 0.350 | 0.412 | 0.547 | 0.729 | 0.989 | 1.368 | 1.859 | 2.349 | 2.845 | 3.148 | 3.373 | 3.542 | 3.670 | 3.609 | 3.448 | 3.316 | 3.260 | 3.147 | 3.033 | 2.17 | 3.542 | 8.15 | 2.329 |
| post_a | 27.24 | -3.63 | — | — | — | — | — | — | — | — | 0.301 | 0.339 | 0.458 | 0.630 | 0.883 | 1.214 | 1.552 | 1.899 | 2.123 | 2.296 | 2.433 | 2.543 | 2.502 | 2.390 | 2.299 | 2.260 | 2.181 | 2.103 | 2.20 | 2.433 | 8.23 | 1.371 |
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
| `slop_tarpaulin` | #3A342B | 0.88 | 0 | RECONSTRUCTED §9 a seaman's foul-weather rig is canvas soaked in tar and oil: near-black, and darker still when it is wet, which on this ship it always is |
| `slop_jacket` | #2E3A46 | 0.86 | 0 | RECONSTRUCTED §9 the short blue jacket of the purser's slop issue — "jackets, blue cloth" — which ends at the hip and is the seaman's own silhouette, quite unlike an officer's tailed coat |
| `slop_duck` | #C6C0AC | 0.9 | 0 | RECONSTRUCTED §9 trousers and shirt of white duck, greyed by salt and wear. It is the pale half of every figure on deck and it is what makes them read as people rather than as posts |
| `slop_wet_duck` | #8C8879 | 0.92 | 0 | RECONSTRUCTED §9 duck trousers soaked through under a tarpaulin jacket: much darker than dry, but nothing like as dark as the tar. A man dressed in one tone from hat to heel is a silhouette and not a person, and in this weather the trousers are the only light left on him |
| `slop_red` | #7C3B32 | 0.88 | 0 | RECONSTRUCTED §9 the red waistcoat of the slop list, worn by perhaps one man in four and worth having for that reason: thirteen men dressed alike are thirteen copies of one man |
| `crew_skin` | #A97D5E | 0.72 | 0 | RECONSTRUCTED §9 a seaman's face and hands after a year in the open: weathered a long way past whatever he started as |
| `officer_coat` | #1E2A44 | 0.82 | 0 | RECONSTRUCTED §9 undress blue coat, faded by sun and salt from the deep indigo of a new one |
| `officer_facing` | #D8D2C2 | 0.84 | 0 | RECONSTRUCTED §9 white lapels, waistcoat and breeches. On a dark coat they are what says "officer" from clear across the deck, before any detail of the man is visible at all |
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
