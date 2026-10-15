// The offset table, from the lines measured off the ship's own draught.
//
// Source: RMG ZAZ3067, "Lines & Profile", Plymouth Yard February 1798, signed John
// Marshall, titled "SURPRISE late L'UNITE" — the only surviving lines plan of this
// ship. The scan at https://collections.rmg.co.uk/media/2/440/707/j5948.jpg was
// measured at 6.0 pixels per foot (the sheet is 1:48), and the result is recorded in
// docs/research/05-hull-form.md.
//
// The midship section is MEASURED off the body plan. The other stations are that
// section scaled by a measured breadth line, lifted by a rising line of floor and
// sharpened toward the ends — so they are RECONSTRUCTED, but anchored at both ends of
// the problem: the midship shape is the real one, and the resulting displacement was
// checked against the recorded 657 tons. It came out at 656 tons, a 0.1 per cent
// error, with Cm 0.777, Cp 0.614 and Cb 0.477, all inside the band for a frigate.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT } from './serve.js';

const FOOT = 0.3048;

// Heights are measured up from the moulded base line = the top of the keel amidships.
const LWL_ABOVE_BASE = 12.83 * FOOT;      // 3.911 m, MEASURED
const DRAUGHT = (14 + 0.5 / 12) * FOOT;   // 4.280 m, RECORDED
// The recorded draught and the measured base-line height together fix the keel: the
// scan measured 1 ft 4 in of keel and false keel below the base line, which would put
// the draught at 14 ft 2 in. The recorded figure is the better evidence, so the keel
// takes up the difference.
const KEEL_BELOW_BASE = DRAUGHT - LWL_ABOVE_BASE;   // 0.369 m
const KEEL_HALF_SIDING = 0.55 * FOOT;               // 0.168 m, MEASURED

// Waterlines, feet above the moulded base line. 12.83 is the load waterline and 16.30
// is the height of maximum breadth; the rest are the draught's own 3 ft 6 in spacing.
const WATERLINES_FT = [1.00, 2.50, 4.00, 6.00, 8.50, 11.00, 12.83, 16.30, 19.00, 22.00];

// Station, x aft of the forward perpendicular, the rabbet height, the ten half-breadths,
// the gun deck at side and its half-breadth. All in feet. `null` where the station does
// not reach that waterline.
const _ = null;
const TABLE = [
  // x aft FP, rabbet, [waterlines 1.00 … 22.00], deck Z, Y at deck
  [  0.00, 12.20, [   _,    _,    _,    _,    _,     _,  0.03,  0.46,  0.37,  0.27], 20.15,  0.33],
  [  6.05,  8.10, [   _,    _,    _,    _, 0.07,  2.96,  5.67,  6.97,  6.79,  6.58], 19.85,  6.73],
  [ 12.10,  5.05, [   _,    _,    _, 0.58, 4.06,  7.58,  8.98,  9.64,  9.33,  8.99], 19.58,  9.27],
  [ 18.15,  3.00, [   _,    _, 0.94, 4.10, 7.49, 10.19, 11.04, 11.45, 11.03, 10.55], 19.35, 10.97],
  [ 24.20,  1.72, [   _, 1.05, 3.77, 6.88, 9.92, 11.86, 12.47, 12.78, 12.23, 11.62], 19.15, 12.20],
  [ 30.25,  0.95, [0.06, 3.36, 6.26, 8.86,11.60, 13.04, 13.51, 13.75, 13.11, 12.39], 18.98, 13.11],
  [ 36.30,  0.50, [1.74, 5.44, 8.07,10.38,12.72, 13.89, 14.27, 14.47, 13.75, 12.96], 18.85, 13.79],
  [ 42.35,  0.22, [3.46, 7.09, 9.46,11.52,13.52, 14.49, 14.80, 14.96, 14.22, 13.39], 18.75, 14.29],
  [ 48.40,  0.07, [4.79, 8.30,10.45,12.30,14.05, 14.88, 15.14, 15.28, 14.53, 13.69], 18.68, 14.61],
  [ 54.45,  0.01, [5.61, 9.02,11.02,12.74,14.33, 15.08, 15.33, 15.45, 14.69, 13.86], 18.65, 14.79],
  [ 60.50,  0.00, [5.88, 9.25,11.21,12.88,14.43, 15.15, 15.38, 15.50, 14.75, 13.91], 18.66, 14.84],
  [ 66.55,  0.00, [5.86, 9.22,11.18,12.84,14.38, 15.10, 15.34, 15.45, 14.70, 13.86], 18.70, 14.78],
  [ 72.60,  0.02, [5.41, 8.80,10.81,12.52,14.13, 14.88, 15.13, 15.25, 14.49, 13.66], 18.79, 14.55],
  [ 78.65,  0.10, [4.40, 7.87,10.01,11.87,13.62, 14.46, 14.73, 14.87, 14.12, 13.29], 18.91, 14.15],
  [ 84.70,  0.30, [2.85, 6.37, 8.74,10.80,12.83, 13.82, 14.14, 14.30, 13.57, 12.75], 19.07, 13.55],
  [ 90.75,  0.70, [0.83, 4.27, 6.94, 9.26,11.67, 12.91, 13.31, 13.52, 12.82, 12.04], 19.28, 12.75],
  [ 96.80,  1.45, [   _, 1.62, 4.31, 7.13, 9.97, 11.66, 12.20, 12.50, 12.35, 11.90], 19.52, 12.27],
  [102.85,  2.70, [   _,    _, 1.25, 4.22, 7.46,  9.96, 10.72, 11.20, 11.35, 11.05], 19.81, 11.27],
  [108.90,  4.60, [   _,    _,    _, 0.84, 4.02,  7.38,  8.66,  9.60, 10.15, 10.05], 20.13, 10.11],
  [114.95,  7.20, [   _,    _,    _,    _, 0.48,  3.37,  5.64,  7.30,  9.55,  9.35], 20.50,  9.45],
  [121.00, 10.40, [   _,    _,    _,    _,    _,  0.04,  0.98,  3.80,  9.30,  8.90], 20.90,  9.05],
];

// Tumblehome above the maximum breadth, degrees from the vertical, at every second
// station. MEASURED at 15.6 degrees amidships; tapered to near nothing at the stem,
// where the sections are almost upright, and eased away aft into the counter.
const TUMBLEHOME_DEG = [2.0, 6.5, 11.5, 14.8, 15.6, 15.6, 15.6, 15.2, 13.4, 9.8, 5.0];

// The station of maximum breadth. Everything in the model is measured from here.
const MID_STATION = 10;
const midX = TABLE[MID_STATION][0] * FOOT;

// The rail — the top of the planking — measured off the draught.
//
// The research traced the "top of the side" at three points: 26.9 ft above the moulded
// base line at the stem head, 25.7 ft at its lowest in the waist, and 29.5 ft at the
// taffrail. That curve is the top of the hammock rail; the planking's own top edge is
// about 1 ft 4 in below it, which is the height of the rail and netting above it.
//
// The rail therefore SWEEPS, and strongly. Building it as one height above the base line
// the whole length — which is what this did — gives a ship with a dead-level top edge
// and no sheer at all above the deck, and it puts the forecastle and quarterdeck above
// the rail so that sixteen guns stand in the open air with nothing round them.
const HAMMOCK_RAIL = 1.33;                       // ft, top of side to top of planking
const RAIL_TOP_OF_SIDE_FT = [
  // fraction of the LWL from forward, height above the moulded base line in feet
  [0.00, 26.9],   // stem head, MEASURED
  [0.22, 25.9],   // RECONSTRUCTED, fairing into the waist
  [0.45, 25.7],   // the low point, MEASURED
  [0.62, 26.1],   // RECONSTRUCTED
  [1.00, 29.5],   // taffrail, MEASURED
];
// Kept as the measured curve for reference and for the silhouette check. The rail the
// model is actually built to is DERIVED in src/ship/hull.js, because it has to stand a
// bulwark's height above whichever deck is beneath it, and this curve — which the
// research explicitly warns is "a composite of the forecastle rail, the waist rail and
// the quarterdeck bulwark", not a fair line — does not do that at the deck breaks.
function railAboveBase(u) {
  const t = RAIL_TOP_OF_SIDE_FT;
  let i = 0;
  while (i < t.length - 2 && u > t[i + 1][0]) i++;
  const f = (u - t[i][0]) / (t[i + 1][0] - t[i][0]);
  // Smoothed, so the rail is a fair curve rather than a chain of straight runs.
  const e = f * f * (3 - 2 * f);
  return (t[i][1] + (t[i + 1][1] - t[i][1]) * e - HAMMOCK_RAIL) * FOOT;
}

const stationZ = [], waterlineY = [], halfBreadth = [];
const deckAtSideY = [], deckAtSideX = [], rabbetY = [], rabbetX = [];
const railY = [], railX = [], tumblehome = [];

for (const ft of WATERLINES_FT) waterlineY.push(round(ft * FOOT - LWL_ABOVE_BASE));

TABLE.forEach((row, i) => {
  const [xFt, rabbetFt, wlFt, deckFt, deckYFt] = row;
  stationZ.push(round(xFt * FOOT - midX));
  rabbetY.push(round(rabbetFt * FOOT - LWL_ABOVE_BASE));
  // At the ends the rabbet is on the stem or the sternpost, not the keel, but the
  // half-siding is the same timber width either way.
  rabbetX.push(round(KEEL_HALF_SIDING));
  halfBreadth.push(wlFt.map((v) => (v === null ? null : round(Math.max(v * FOOT, KEEL_HALF_SIDING)))));
  deckAtSideY.push(round(deckFt * FOOT - LWL_ABOVE_BASE));
  deckAtSideX.push(round(Math.max(deckYFt * FOOT, KEEL_HALF_SIDING)));

  // The rail. The two highest waterlines already describe the bulwark, so the rail is
  // only a short extrapolation above the last of them, on the station's own tumblehome.
  const th = interpTumblehome(i / (TABLE.length - 1));
  tumblehome.push(round(Math.tan((th * Math.PI) / 180)));
  const topWlY = WATERLINES_FT.at(-1) * FOOT;
  const topWlX = wlFt.at(-1) === null ? deckYFt * FOOT : wlFt.at(-1) * FOOT;
  const railBase = railAboveBase(i / (TABLE.length - 1));
  const rise = railBase - topWlY;
  railY.push(round(railBase - LWL_ABOVE_BASE));
  railX.push(round(Math.max(KEEL_HALF_SIDING, topWlX - rise * Math.tan((th * Math.PI) / 180))));
});

function interpTumblehome(u) {
  const t = u * (TUMBLEHOME_DEG.length - 1);
  const i = Math.min(TUMBLEHOME_DEG.length - 2, Math.floor(t));
  return TUMBLEHOME_DEG[i] + (TUMBLEHOME_DEG[i + 1] - TUMBLEHOME_DEG[i]) * (t - i);
}
function round(v) { return Math.round(v * 10000) / 10000; }

const out = {
  provenance: {
    grade: 'TRACED — midship section measured, other stations reconstructed from it, displacement verified',
    plan: 'RMG ZAZ3067, Lines & Profile, Plymouth Yard February 1798, John Marshall, "SURPRISE late L\'UNITE"',
    url: 'https://collections.rmg.co.uk/media/2/440/707/j5948.jpg',
    scale: '1:48; scan measured at 6.0 px per foot of ship',
    uncertainty: '±1–2 per cent on any single measurement; the sheet aspect ratio disagrees with the catalogued sheet size by 1.2 per cent',
    verification: 'displacement 656.1 tons against 657 recorded (0.1%); Cm 0.777, Cp 0.614, Cb 0.477, LCB 0.502 L',
    datum: 'y = 0 at the design load waterline; z = 0 at the station of maximum breadth; -Z forward',
    research: 'docs/research/05-hull-form.md',
  },
  dimensions: {
    length_gundeck_m: 126 * FOOT,
    length_lwl_m: 121 * FOOT,
    beam_extreme_m: (31 + 8 / 12) * FOOT,
    beam_moulded_m: 31 * FOOT,
    draught_m: DRAUGHT,
    keel_below_base_m: round(KEEL_BELOW_BASE),
    lwl_above_base_m: round(LWL_ABOVE_BASE),
    max_beam_station: MID_STATION,
    max_beam_fraction_of_lwl: 0.51,
  },
  stationZ, waterlineY, halfBreadth,
  deckAtSideY, deckAtSideX, rabbetY, rabbetX, topOfSideY: railY, railX, tumblehome,
};

await fs.writeFile(path.join(ROOT, 'docs/offsets.json'), JSON.stringify(out, null, 1));

const maxHb = Math.max(...halfBreadth.flat().filter((v) => v !== null));
console.log(`offsets: ${stationZ.length} stations x ${waterlineY.length} waterlines`);
console.log(`  z        ${stationZ[0].toFixed(2)} to ${stationZ.at(-1).toFixed(2)} m  (LWL length ${(stationZ.at(-1) - stationZ[0]).toFixed(3)}, recorded ${(121 * FOOT).toFixed(3)})`);
console.log(`  y        ${Math.min(...rabbetY).toFixed(2)} to ${Math.max(...railY).toFixed(2)} m`);
console.log(`  max half-breadth ${maxHb.toFixed(3)} m -> beam ${(maxHb * 2).toFixed(3)} m  (moulded ${(31 * FOOT).toFixed(3)}, extreme ${((31 + 8 / 12) * FOOT).toFixed(3)})`);
console.log(`  keel bottom  ${(-DRAUGHT).toFixed(3)} m  (recorded draught ${DRAUGHT.toFixed(3)})`);
console.log(`  deck at side amidships ${deckAtSideY[MID_STATION].toFixed(3)} m above LWL`);
console.log(`  rail amidships ${railY[MID_STATION].toFixed(3)} m; bulwark ${(railY[MID_STATION] - deckAtSideY[MID_STATION]).toFixed(3)} m above the deck`);
