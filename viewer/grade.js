// The numbers viewer/post.js is tuned to.
//
// These live here and not in src/spec/spec.js for two reasons, one immediate and one
// permanent. The immediate one is that another agent is editing spec.js while this file
// is being written, and two people editing one file at once is how a spec gets a row
// nobody can explain. The permanent one is the one that matters: nothing in this file is
// evidence of what HMS Surprise looked like. A gunport spacing has a source — a draught,
// a dockyard survey, a rule out of Steel. A bloom threshold does not; it is evidence of
// what makes a render of her look like a photograph rather than a screenshot, and that is
// a claim about the renderer, not about the ship. Keeping the two apart is the same
// discipline src/ship/weathering.js keeps between the paint and the dirt on it: a number
// invented for the render must never be able to look like a number measured from her.
//
// The shape is kept the same as the spec's on purpose, though: every row is a value and
// a comment beside it saying what the value is and why it is that one and not some other.
// `npm run trace` and `npm run audit` do not reach this file — there is nothing to check
// a look against — so the discipline here is kept by habit rather than by a build gate.
export const g = (value, note) => ({ value, note });

// ------------------------------------------------------------------------------- bloom
// One bloom pass, shared by all three rigs rather than tuned per rig. The threshold does
// the work of keeping it shared: it is set high enough that only the few things in the
// scene that are actually bright — the sun's glint off the sunlit canvas, the gilt at the
// stern, a wave crest catching the light — cross it, and everything else in a scene stays
// under it regardless of which rig lit that scene. Turning the threshold down to make the
// storm rig "bloom more" would not read as a stormy render, it would read as a foggy lens,
// which is the failure mode this whole file is written to avoid.
export const BLOOM = {
  // Linear luminance, before the ACES curve. `sun_intensity` in the spec is 2.6 and a
  // sunlit white sail sits somewhere near it once shading and albedo are folded in, so a
  // threshold below about 1.3 starts catching broad lit canvas rather than the small hot
  // spots this is meant for. Above about 1.6 nothing on this ship reaches it at all and
  // the pass becomes a no-op. 1.35 sits just above a lit sail and below the gilt and the
  // sun's own glint, which is the whole point of it.
  threshold: g(1.35, 'just above a sunlit sail, so the sail itself never blooms — only what is brighter than it'),
  // Kept low. UnrealBloomPass's strength is a straight multiply on the extracted bright
  // pass before it is added back, and this was the number most likely to turn "the gilt
  // glows" into "the picture glows": at 0.5 the stern rail was a soft halo you could point
  // at from across the room, which is the greetings-card failure the brief names by name.
  strength: g(0.22, 'tuned down from a first pass at 0.5 that read as a soft-focus filter rather than as bright metal and sunlit cloth'),
  // How far the bloom spreads from a bright pixel, in the pass's own mip-blur units. Wide
  // enough that a highlight has a soft edge rather than a hard-edged cutout matte; narrow
  // enough that a gun's brass ring does not throw light across the whole gundeck.
  radius: g(0.32, 'a soft edge on the highlight itself, not a glow that reaches neighbouring geometry'),
};

// --------------------------------------------------------------------- film grain
// One grain setting for every rig, because grain is a property of the shot, not of the
// weather in it — a camera's sensor is exactly as noisy on a calm day as in a gale.
export const GRAIN = {
  // A zero-mean perturbation added to the linear colour, so it is small next to a
  // shadow and smaller still next to a highlight once the ACES curve compresses it — which
  // is also roughly how real grain behaves on film, brighter stock having less visible
  // grain than the shadows do. 0.035 is the amount below which two otherwise-identical
  // frames stop reading as "the same still with noise on it" and start reading as "the same
  // still"; above about 0.06 the sky over the storm rig, which is the flattest surface in
  // either scene, started to visibly crawl.
  amount: g(0.035, 'the largest amount that does not visibly crawl on the storm rig\'s flat sky, the least forgiving surface in either scene'),
  // How many screen pixels one grain cell covers. 1 is one cell per output pixel, which is
  // as fine as grain can be drawn without supersampling for it specifically; anything
  // coarser reads as sensor noise from a much smaller, much older sensor, which is a
  // different and wrong period of camera entirely for a piece meant to look like a modern
  // frame.
  size: g(1.0, 'one noise cell per output pixel — the finest grain the resolution allows'),
};

// ---------------------------------------------------------- chromatic aberration
// Only at the frame's edges, and only barely: real aberration grows with the square of
// the distance from the lens's own axis, so a strength tuned to be invisible in the centre
// of the frame is already the right shape, not just the right amount.
export const CHROMATIC_ABERRATION = {
  amount: g(0.0018, 'invisible inside the middle third of the frame; a faint red/blue fringe on the masts at the extreme corners, which is where a real lens would put it'),
};

// -------------------------------------------------------------------------- the grade
// Lift, gamma and gain, in that order: lift moves the shadows, gamma reshapes the
// midtones, gain scales the highlights. All three are near enough to identity that a
// small round number in any of them is doing real work — this is meant to be a grade
// nobody can point at, not a look.
//
// `studio` is not "subtle", it is *off*. The studio render is the one laid side by side
// against the reference photograph in docs/PHOTO-ANALYSIS.md, and the entire value of
// that comparison is that nothing between the renderer and the pixel has an opinion. A
// grade that improved the studio shot would be a grade that broke the one measurement
// this project has against a real object, so it stays at lift 0, gamma 1, gain 1,
// saturation 1, and no vignette — the identity a ShaderPass produces when every one of
// its uniforms is left at its default.
export const GRADE = {
  studio: {
    lift: g([0, 0, 0], 'identity — this render is compared pixel by pixel against a photograph and must not be graded'),
    gamma: g(1.0, 'identity, for the same reason'),
    gain: g([1, 1, 1], 'identity, for the same reason'),
    saturation: g(1.0, 'identity, for the same reason'),
    vignetteStrength: g(0.0, 'off — the reference photograph has none, and a vignette here would be a difference the comparison did not put there'),
    vignetteRadius: g(0.6, 'unused while vignetteStrength is 0; kept at the sea rig\'s number so turning the strength on for a one-off check needs one edit, not two'),
    vignetteSoftness: g(0.6, 'unused while vignetteStrength is 0, for the same reason'),
  },
  // A fine day. The lighting rig in scene.js already does the work of making this rig
  // look like sun on the water; the grade's job is only to finish it the way a camera
  // would, not to relight it a second time.
  sea: {
    // A whisper of warmth pulled toward the highlights and out of nowhere in particular,
    // which is what a lens with a warm coating does and a flat colour grade does not.
    lift: g([0, 0, 0], 'left at zero — the fill light already opens the shadows correctly, and lifting them again on top of that read as the deck fog was still burning off'),
    gamma: g(1.0, 'identity; the fine-weather rig\'s midtones did not need reshaping once the lift and gain were set'),
    gain: g([1.012, 1.0, 0.985], 'a small warm bias in the highlights, the amount a coated lens adds and no more — checked against the reference photograph\'s canvas colour so the warmth is a camera property and not a second sun'),
    saturation: g(1.04, 'a small lift, the amount that stops the sea and the sky reading as slightly bleached without making the ensign\'s red and blue look like a toy flag'),
    vignetteStrength: g(0.16, 'enough to settle the eye on the ship and not on the corners of the frame; at 0.3 the corners of the beam shot were noticeably darker than the middle of the same plank run'),
    vignetteRadius: g(0.6, 'where the darkening starts, as a fraction of the frame half-diagonal — clear of the ship in every framing this project uses'),
    vignetteSoftness: g(0.6, 'how far the falloff takes to reach full strength; soft enough that the edge of the vignette is never a visible ring'),
  },
  // The daylight gale. scene.js already explains why this rig has no sun and works
  // entirely in fill — the grade's job is to finish that as weather rather than as a
  // desaturation filter laid over the fine-weather picture.
  storm: {
    // Held back from where it first landed, for two reasons that both came from looking
    // at the finished frame rather than at this file.
    //
    // The first is that scene.js's storm rig is *already* tuned. Its whole argument — see
    // the comment on `storm_fill_intensity` — is that a daylight gale is a bright grey day
    // and not a dark one, and that the mistake to avoid is lighting it for the mood rather
    // than for the hour. A grade that crushes and desaturates on top of that rig is that
    // same mistake made a second time, one stage later, and it undoes the work.
    //
    // The second is ambient occlusion. src/ship/occlusion.js now darkens every corner and
    // contact on the ship, which is a real and welcome darkening — but it means the grade
    // is no longer the only thing taking light out of her. Graded to the numbers that
    // looked right before the AO pass existed, she went murky: the ochre strake, the red
    // inboard works and the watch on deck all stopped reading at any distance.
    //
    // So the cold cast and the contrast stay, and the amount comes down by about half.
    lift: g([-0.010, -0.007, -0.002], 'blue crushed least of the three, so the dark end reads cold rather than merely dim — but half the first attempt, which fought both the storm rig\'s deliberate brightness and the new occlusion pass'),
    gamma: g(0.97, 'a little extra contrast through the midtones, because a grey day photographs flatter than it looks; gentler than the 0.93 first tried, which took the deck and the gunport strake below the point where they read'),
    gain: g([0.985, 1.005, 1.055], 'the highlights pushed toward blue, as spray and wet canvas under a grey sky are — but no longer pulled down overall, since the occlusion pass now supplies the darkening this was doing'),
    saturation: g(0.92, 'pulled down, and no further: at 0.85 the ochre strake and the ensign read as desaturated rather than as weather, which is the difference between a graded picture and a grey one'),
    vignetteStrength: g(0.18, 'a gale should feel closer at the edges, but the storm rig\'s own sky is dark to begin with and 0.26 on top of it crushed the corners of the sea to a flat black with no wave structure left in them'),
    vignetteRadius: g(0.55, 'starts a little sooner than the sea rig\'s, to match the stronger strength'),
    vignetteSoftness: g(0.65, 'a touch softer than the sea rig\'s, so a stronger vignette still fades in rather than announcing an edge'),
  },
};
