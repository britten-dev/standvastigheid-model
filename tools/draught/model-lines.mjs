// Sample the built hull model's profile lines (keel, stem, wales, decks, rail, ports) in
// model coordinates, for drawing back over the draught (tools/draught/lines_overlay.py).
import { hullModel } from '../../src/ship/hull.js';
import { portRecords } from '../../src/ship/gun-openings.js';
import { OFFSETS } from '../../src/spec/spec.js';

const model = hullModel();
const N = 240;
const zs = Array.from({ length: N }, (_, i) => model.zFwd + (model.zAft - model.zFwd) * i / (N - 1));
const line = (key) => zs.map((z) => [z, model.featureYAt(z)[key]]);
const out = {
  keel_bottom: line('keel_bottom'),
  rabbet: line('rabbet'),
  wale_bottom: line('wale_bottom'), wale_top: line('wale_top'),
  middle_wale_bottom: line('middle_wale_bottom'), middle_wale_top: line('middle_wale_top'),
  lower_deck: line('lower_deck'), upper_deck: line('upper_deck'),
  rail: zs.map((z) => [z, model.railYAt(z)]),
  standing_deck: zs.map((z) => [z, model.standingDeckAt(z)]),
  waterline: [[model.zFwd, 0], [model.zAft, 0]],
  ports: portRecords(model).map((p) => [[p.z - p.width / 2, p.y0], [p.z + p.width / 2, p.y0], [p.z + p.width / 2, p.y1], [p.z - p.width / 2, p.y1], [p.z - p.width / 2, p.y0]]),
  stem_fore_edge: OFFSETS.stem.fore_edge,
  station10_s_ft: OFFSETS.dimensions.station10_s_ft,
  lwl_above_keel_m: OFFSETS.dimensions.lwl_above_keel_m,
};
process.stdout.write(JSON.stringify(out));
