# Tracing the Washington's lines

How `docs/offsets.json` was measured from Nationaal Archief 4.MST inv. 59, and how far
to trust it. The scans are not in the repository: `tools/draught/fetch.sh` pulls the
regions the tracer reads into `.cache/draught/` (git-ignored). What was measured off them
is: the seeds and readings, and every traced line as a pixel polyline, in `docs/trace/`, so
`tools/draught/extract.py` rebuilds the offset table without the scans. See
`tools/draught/README.md`.

## 1. Calibration

| | |
| --- | --- |
| Unit | Amsterdam foot of 11 inches, 0.283133 m. The title block's "48 9/11" settles it |
| Sheer and half-breadth plans | The drawing's own scale of feet, under the keel, 0 at the sternpost rabbet and 179 at the stem rabbet. Every identifiable tick is matched to its foot (`tools/draught/calib.py`) and the scan is read piecewise between them, which takes out the paper's stretch at its folds (up to 5 % locally). Overall 49.65 px/ft |
| Body plan | 49.87 px/ft, from the dead flat's half-breadth: 1,217.5 px for the 24 5/11 ft moulded half-breadth of the title block. The scale ticks nearest the body plan give 49.6–49.8 |
| Heights | Square to the keel's underside, fitted as a straight line (it is drawn straight; the scan is rotated by 0.07°) |
| Cross-checks | The 179 ft tick lands on the stem rabbet at the lower deck; the stem rabbet line meets station 0's lowest point within 0.1 ft; the dead flat drawn in both halves of the body plan agrees to 0.15 ft over most of its height (0.43 ft worst, at the turn of the floor) |

## 2. Stations

The body plan is followed by machine: a seed is placed by eye on each station where it is
clear of its neighbours, and `tools/draught/tracker.py` walks the pen line both ways
(`docs/trace/body-seeds.json`, `tools/draught/trace_body.py`).

* 23 stations, 0–22. Their places along the ship come from the station verticals of the
  half-breadth plan, matched to the numbers written along the keel. Spacing is 7.9 ft,
  closing to 7.3 ft either side of the dead flat (station 10, 98.4 ft from the sternpost).
* The numbers on the aft half are written along each line. Reading them showed the first
  seeds were one line out, and that the line through (1095, 2148) is the stern's
  fashion piece, not a station. Corrected before the table was built.
* Station 13's trace jumps to 12 where the numbers crowd the lines; its floor is
  measured, and above 6 ft it is the mean of 12 and 14.
* Station 22 is hidden behind the stern transoms on the scan and is not traced. It and
  two more stations to the sternpost are closed on the traced sternpost rabbet; three
  stations between station 0 and the stem are closed on the traced stem rabbet. Each
  waterline ends at the rabbet with a fullness exponent (0.45 at the bow, 0.55 aft) that
  keeps the bluff Dutch bow and the full run. RECONSTRUCTED.
* Below 6 ft, where twelve lines of the floor run almost on top of one another, each
  waterline is made to narrow away from the dead flat. This removed one stray step of the
  tracer at station 19.

## 3. Profile

Long lines of the sheer plan followed the same way (`.cache/draught/sheer_lines.json`):
the keel, false keel, main wale, middle wale, upper band, waist rail, quarterdeck rail and
hammock rail. The stem rabbet and the stem's fore edge likewise. Ports (14 + 14 + 5 a
side), masts, hawse holes, capstan and the two deck breaks were read by eye off gridded
renders at ±3 px (`docs/trace/sheer-readings.json`).

The port tiers have **less sheer than the wales** — the wales sweep up about 4 ft at the
stern, the lower sills 2.6 ft. So the decks are taken from the port sills, not the wales.

## 4. What is reconstructed, and from what

| Item | How | Grade |
| --- | --- | --- |
| Load waterline | 6 ft 6 in below the lower port sills amidships: the Dutch Admiralties' rule for their 74s of this generation, laden with 550 men and six months' stores (A. Ruijter, *In dienst van twee republieken*, RCE, p. 7). Puts her 20.1 ft above the keel's underside | SECONDARY rule, PRIMARY sills |
| Lower deck at side | 2.1 ft below the lower sills. The double capstan's drums stand on the decks in the profile (25.3 ft and 32.7 ft above the keel at the centreline), and the title block's 22 ft depth of hold gives 24.4 ft at side; 2.1 ft splits the two | RECONSTRUCTED from PRIMARY |
| Upper deck at side | 2.1 ft below the upper sills; Ruijter's 6 7/11 ft between decks agrees | RECONSTRUCTED |
| Quarterdeck | 1 ft 9 in below its own port sills | RECONSTRUCTED |
| Forecastle | 1 ft below the waist rail; the drawing shows its timberheads, not its deck | RECONSTRUCTED |
| Topsides above the main wale | The stations disappear into the hatched wales on the scan. The dead flat's topside is read off the body plan — the outermost frame line between the wales and above the middle wale — tumbling home 4 ft from the wale to the rail. Other stations carry their own flare on above the wale, dying over 6 ft, tumble home in proportion to how upright they are, and never stand outside the dead flat at the same height | RECONSTRUCTED from PRIMARY |

## 5. Result

`tools/draught/extract.py`, checked by drawing the table back over the body plan
(`tools/draught/check_overlay.py`).

| | Model | Record |
| --- | --- | --- |
| Length on the lower deck | 179 ft = 50.68 m (by construction) | 179 ft (title); 168 ft 5 in English = 51.33 m (British survey) |
| Moulded breadth | 13.84 m | 48 9/11 ft = 13.82 m (title) |
| Length on the waterline | 50.43 m | — |
| Draught, to the false keel | 5.82 m (20 ft 7 in Amsterdam) | not recorded |
| Displacement | 2,282 t in sea water | not recorded |
| Block / midship / prismatic | 0.62 / 0.87 / 0.72 | — |
| Centre of buoyancy | 1.5 m abaft the dead flat | — |

The coefficients are full by British standards — a Royal Navy 74 runs about 0.55 / 0.80 /
0.65 — and that is the Dutch hull speaking: nearly flat floors with a 3½° deadrise, a
hard bilge and bluff ends. O'Brian's "broadsterned", "bluff bows" are in the lines. Her
draught is about a metre less than a British 74's, as Dutch home waters required.

The game's stand-in used 51.2 × 14.3 × 6.2 m and 1,700 t; her own numbers are in
`SPEC` and above.
