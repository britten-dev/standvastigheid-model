// Does she still move?
//
// Every other check in this repository proves something about geometry: the trace proves
// each dimension has a source, the audit proves the built ship matches it, the build
// proves the triangles fit and the verify proves the files load. None of them can tell
// whether the ship is alive, and that is exactly the failure the motion layer is prone
// to — because `src/ship/motion.js` finds what it moves **by name**.
//
// Rename `square_sails`, merge two groups in the rig, wrap the flags in a parent, and
// nothing throws. The ship simply stops moving. Every other check still passes, the GLB
// files are still perfect, and the loss is invisible until somebody happens to look at
// her in the viewer and thinks she seems a bit stiff.
//
// So this runs her for two instants and measures what changed. It is deliberately not a
// snapshot test: it asserts that things moved and that they moved by a sane amount, not
// that they moved to particular coordinates, because the amplitudes are meant to be
// tuned and a test that fights tuning gets deleted.
import { openHarness } from './harness.js';

// Two states, because no single one of them carries every kind of moving part. Under
// storm canvas she sets two square sails and nothing fore-and-aft at all, so a probe of
// that state alone can say nothing about the staysails and the spanker; under her full
// suit she carries all three kinds.
const h = await openHarness();
const probes = {};
for (const sails of ['storm', 'full']) {
  probes[sails] = await h.page.evaluate((s) => window.motionProbe({ lod: 'game', sails: s }), sails);
}
const probe = probes.storm;

const problems = [];
const notes = [];
const check = (ok, message) => { (ok ? notes : problems).push(message); return ok; };

// ---------------------------------------------------------------- what it found
check(probe.found.flags >= 2, `flags found: ${probe.found.flags} (expected at least 2)`);
check(probe.found.crew >= 8, `crew found: ${probe.found.crew} (expected at least 8)`);
check(probe.found.wheel === 1, `wheel found: ${probe.found.wheel}`);

// ------------------------------------------------------------- what it patched
//
// A part is judged over both states together: absent from one of them is normal — she
// sets no staysails in a gale — but absent from both means motion.js is looking for a
// name that no longer exists, which is the silent failure this whole file is about.
for (const name of Object.keys(probe.shaderParts)) {
  const seen = Object.entries(probes)
    .map(([sails, p]) => [sails, p.shaderParts[name]])
    .filter(([, v]) => v !== null);
  if (!seen.length) {
    problems.push(`${name}: no such mesh in any sail state — motion.js is looking for a name that no longer exists`);
    continue;
  }
  const unpatched = seen.filter(([, v]) => !v).map(([s]) => s);
  check(unpatched.length === 0,
    unpatched.length
      ? `${name}: HAS NO motion shader in ${unpatched.join(', ')}`
      : `${name}: has motion shader (${seen.map(([s]) => s).join(', ')})`);
}

// -------------------------------------------------------------- what it moved
check(probe.timeAdvanced > 1, `clock advanced ${probe.timeAdvanced.toFixed(2)} s`);
check(probe.whipChanged > 0.001, `whip moved ${(probe.whipChanged * 1000).toFixed(1)} mm between the two instants`);
check(probe.wind > 0.1, `wind reaching the shaders: ${probe.wind.toFixed(2)}`);
check(probe.wetness > 0.1, `wetness: ${probe.wetness.toFixed(2)}`);

for (const [name, delta] of Object.entries(probe.flags)) {
  check(delta > 1e-4, `${name}: cloth ${delta > 1e-4 ? 'reshaped' : 'DID NOT MOVE'} (${delta.toExponential(2)})`);
}

const crewMoved = probe.crew.filter((d) => d > 1e-4).length;
check(crewMoved >= probe.crew.length - 1,
  `crew that moved: ${crewMoved} of ${probe.crew.length}`);
check(probe.wheel !== null && probe.wheel > 1e-6, `wheel turned by ${probe.wheel?.toFixed(4)} rad`);

check(probe.rudder > 0.1, `rudder turned by ${probe.rudder?.toFixed(4)} rad`);

// The yards, and the canvas on them. A sail that is not parented to a yard cannot be
// braced, and a rig that cannot be braced cannot answer a change of wind — which is the
// failure this pair of checks exists to catch, because nothing else would notice it.
check(probe.yards.found >= 6, `yards found: ${probe.yards.found}`);
check(probe.yards.braced > 1e-4, `yards hauled round by ${probe.yards.braced.toFixed(4)} rad`);
check(Boolean(probe.yards.sailFollowed),
  probe.yards.sailFollowed
    ? `canvas is on the spars (a sail hangs on ${probe.yards.sailFollowed})`
    : 'CANVAS IS NOT ON THE SPARS — a square sail is not parented to a yard, so bracing will leave it behind');

for (const n of notes) console.log(`ok    ${n}`);
if (problems.length) {
  console.error('\nthe ship has stopped moving:');
  for (const p of problems) console.error(`  FAIL  ${p}`);
}

if (h.problems.length) {
  console.log('\npage problems:');
  h.problems.slice(0, 10).forEach((p) => console.log('  ' + p));
}
await h.close();

if (problems.length) process.exit(1);
console.log(`\nshe moves: ${notes.length} checks passed.`);
