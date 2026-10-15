// Region specs. Each module that builds a region of the ship keeps its dimensions in
// its own file here, so that work on the head and work on the stern never touch the
// same source file. Every entry obeys the same shape as the core spec:
//
//   key: { value: <metres or degrees or a count>, source: '<GRADE> §n <where it came from>' }
//
// and every key must also appear as a row in SPECS.md, which `npm run trace` enforces.
import { PORT_SPEC } from './ports.js';
import { STERN_SPEC } from './stern.js';
import { HEAD_SPEC } from './head.js';
import { CHANNELS_SPEC } from './channels.js';
import { FURNITURE_SPEC } from './furniture.js';
import { GUNS_SPEC } from './guns.js';
import { BOATS_SPEC } from './boats.js';
import { GROUND_TACKLE_SPEC } from './ground-tackle.js';
import { FLAGS_SPEC } from './flags.js';
import { RIG_SPEC } from './rig.js';
import { CREW_SPEC } from './crew.js';
import { MOTION_SPEC } from './motion.js';

const FRAGMENTS = {
  ports: PORT_SPEC,
  stern: STERN_SPEC,
  head: HEAD_SPEC,
  channels: CHANNELS_SPEC,
  furniture: FURNITURE_SPEC,
  guns: GUNS_SPEC,
  boats: BOATS_SPEC,
  groundTackle: GROUND_TACKLE_SPEC,
  flags: FLAGS_SPEC,
  rig: RIG_SPEC,
  crew: CREW_SPEC,
  motion: MOTION_SPEC,
};

export const PART_SPECS = {};
const owner = {};
for (const [name, frag] of Object.entries(FRAGMENTS)) {
  for (const [key, row] of Object.entries(frag)) {
    if (key in owner) {
      throw new Error(`spec key "${key}" is defined by both ${owner[key]} and ${name}`);
    }
    owner[key] = name;
    PART_SPECS[key] = row;
  }
}
