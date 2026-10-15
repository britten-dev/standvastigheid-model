// Geometry tiers used by the browser and asset tools. Cinematic includes the
// Blender-authored fittings and eleven close-range crew; phones keep game.
// The library allowance is 1.88 million including the optional watch (the host
// allows 1.6 million without people), measured separately from
// ocean, reflection and shadow passes. tools/check-authored-detail.mjs exercises
// every sail/weather combination; actual frame timing is checked in Chromium.
export const LODS = ['cinematic', 'hero', 'game', 'distant'];

const CONFIG = {
  cinematic: {
    // Hull surface resolution. Half again more stations down her length, and a third
    // more girth points at each one, so the turn of the bilge and the tumblehome read
    // as a fair curve instead of a lofted polygon even with the camera sitting on the
    // planking.
    hullSideJoinery: 'full',
    hullStations: 181,
    hullPoints: 96,
    // Round things: spars, ropes, deadeyes, gun barrels. Ten-sided is a decagon at
    // arm's length; twenty-four keeps a close spar silhouette round. Five-sided rope is the one hero fault every
    // enthusiast's eye catches first — a flat running down a stay — so it goes to eight,
    // which is the point a tube stops looking like a prism. The lathe count follows the
    // same reasoning for a truck, a cap, a deadeye or a gun's reinforce rings: hero's 20
    // is coarse enough to see the facets on a bright highlight, 32 is not.
    sparSegments: 20,
    sparRadial: 24,
    ropeRadial: 8,
    ropeSegments: 16,
    latheSegments: 32,

    // What exists at all. Everything here is already on at hero, so nothing changes:
    // there is no further "on" to reach for. It is listed for the same reason hero's
    // list is — so the next reader can see at a glance that this level was not merely
    // copied from hero and never checked.
    ropesAsTubes: true,
    ratlines: true,
    ratlineEvery: 1,
    gammoning: true,
    footropes: true,
    runningRigging: 'full',
    deadeyes: true,
    chainplates: true,
    channelRails: true,
    channelKnees: true,
    blocks: true,
    gunBarrels: true,
    gunCarriages: true,
    gunBarrelStages: 'full',
    gunBreechings: true,
    gunTackles: true,
    portLids: true,
    portFittings: true,
    innerBulwarks: true,
    deckFurniture: 'full',
    gratingBattens: true,
    hammockCranes: 'full',
    belayingPins: true,
    galleryGlazing: true,
    windowJoinery: true,
    // The stern: half again more stations through the counter and the transom, so the
    // carved quarter-pieces and the transom's curvature stand comparison with the
    // reference photograph at the range a still is actually cropped to.
    sternStations: 24,
    sternWindows: true,
    sternGalleries: true,
    sternOrnament: 'carved',
    rudderIrons: true,
    figurehead: 'carved',
    headRails: true,
    headDetail: 'full',
    // The head: the same reasoning as the stern, for the same reason — it is the other
    // end of the ship an enthusiast's camera goes looking for carved work.
    headStations: 36,
    boats: 'full',
    // The boats are small enough, and few enough, that spending on them barely shows in
    // the total: a third more stations and points each so a stove-in dinghy on the
    // skids does not give away its budget when everything around it has stopped doing so.
    boatStations: 31,
    boatPoints: 18,
    boatGear: true,
    anchorDetail: 'full',
    anchorSpares: 2,
    anchorCables: true,
    flags: 'full',
    // Bunting is cheap and reads as fabric rather than a flat pennant once the leech has
    // enough segments to hold a curl; half again more than hero in both directions.
    flagSegments: [28, 14],
    flagHalliards: true,
    crew: 'full',
    copperNails: true,
    hullRelief: true,
    surfaceDetail: true,
    // Sails: the belly and the ripple both live in these segment counts, and a coarse
    // grid is exactly where the canvas shader's shivering looks like a flag rather than
    // a sail. Half again more across and forty percent more up the leech.
    sailSegments: [32, 22],
    // Mouldings — the sheer strake, the wales, the headrails, the channel edges — are
    // swept along a curve in this many steps; hero's 96 already reads fair from a few
    // metres off, but the fiddle-head curls at the head and the scroll-work at the
    // stern are drawn from the same helper and are exactly the tight radii where a
    // sweep with too few steps chords visibly. Half again more.
    mouldingSweeps: 144,
    // Contact shadows cost the same at any resolution above this one — occlusion.js
    // voxelises the finished ship rather than sampling per-triangle — so there is no
    // reason to want them off at the one level built to be looked at hardest.
    ambientOcclusion: true,

    // Twice hero's edge. A texture at 1024 already shows soft pixels on a normal map's
    // plank seam when the camera sits on the planking, which is exactly the distance
    // this level exists to survive; 2048 is where that stops happening. It is also the
    // one number here that materials.js's cache key already keys on, so this level gets
    // its own material set for free rather than colliding with hero's.
    textureSize: 2048,
    // Spend texture memory on the hull without enlarging every rope and fitting.
    hullTextureSize: 4096,
  },

  hero: {
    // Hull surface resolution.
    hullSideJoinery: 'full',
    hullStations: 121,
    hullPoints: 72,
    // Round things: spars, ropes, deadeyes, gun barrels.
    sparSegments: 14,
    sparRadial: 10,
    ropeRadial: 5,
    ropeSegments: 12,
    latheSegments: 20,

    // What exists at all.
    ropesAsTubes: true,
    ratlines: true,
    ratlineEvery: 1,
    // The gammoning lashing over the bowsprit: sixteen short ropes at the stem head,
    // read only from a few metres away.
    gammoning: true,
    footropes: true,
    runningRigging: 'full',
    deadeyes: true,
    // The channels' ironwork. The chains carry the whole pull of the rig into the hull
    // and are the most visible iron on the ship, so they survive to the game LOD; the
    // notched rail along the channel's outer edge does too, because without it the
    // channel reads as a bare shelf.
    chainplates: true,
    channelRails: true,
    channelKnees: true,
    blocks: true,
    gunBarrels: true,
    gunCarriages: true,
    // The turned stages of a gun barrel: 'full' gives the base ring, both reinforce
    // rings, the muzzle astragal and the swell; 'coarse' keeps only the stations they
    // stand between.
    gunBarrelStages: 'full',
    gunBreechings: true,
    gunTackles: true,
    portLids: true,
    portFittings: true,
    innerBulwarks: true,
    deckFurniture: 'full',
    // Deck furniture sub-switches, owned by src/ship/furniture.js.
    gratingBattens: true,
    hammockCranes: 'full',
    belayingPins: true,
    galleryGlazing: true,
    windowJoinery: true,
    // The stern, owned by src/ship/stern.js: how many stations the counter and the
    // transom are lofted through, whether the carved and gilded work exists, and
    // whether the rudder gets its pintles and gudgeons.
    sternStations: 16,
    sternWindows: true,
    sternGalleries: true,
    sternOrnament: 'carved',
    rudderIrons: true,
    figurehead: 'carved',
    headRails: true,
    // The head, owned by src/ship/head.js. The stem, the knee and the beakhead
    // bulkhead are always built, because without them the bow is an open hole; this
    // says how much else there is. 'full' adds the gratings, the seats of ease, the
    // head timbers, the beakhead stanchions and round-houses, the gammoning cleats and
    // the cathead sheaves; 'principal' keeps the flat of the head as a plain platform
    // and drops everything smaller than a plank; 'none' leaves only the structure.
    headDetail: 'full',
    // How many stations the stem and the knee of the head are lofted through.
    headStations: 26,
    boats: 'full',
    // Boats: how finely each little hull is lofted, and whether her gear is in her.
    boatStations: 23,
    boatPoints: 14,
    boatGear: true,
    anchorDetail: 'full',
    // Ground tackle. The two catted bowers are always built; these say how much of the
    // rest of the outfit is. `anchorSpares` is the sheet and the kedge stowed in the fore
    // chains, `anchorCables` the hawse holes, their bolsters and the bower cables.
    anchorSpares: 2,
    anchorCables: true,
    // The colours. 'full' is ensign, masthead pendant and jack; 'principal' drops the
    // jack, which is only ever worn at anchor anyway; 'ensign' is the one flag that
    // still reads on a silhouette at the horizon.
    flags: 'full',
    flagSegments: [20, 10],
    flagHalliards: true,
    // The watch on deck. 'full' is the whole watch including the two hands in the main
    // top; 'principal' keeps the men on deck, where the eye is, and leaves the top
    // empty; false is an empty ship. What they are for is scale — see src/ship/crew.js —
    // so the level at which they are dropped is the level at which nothing is close
    // enough to need scaling.
    crew: 'full',
    copperNails: true,
    // Whether the hull has a normal map at all. The sheathing's laps and the plank seams
    // are the only relief on a surface that is otherwise perfectly smooth, and a hull
    // with none of it is the flattest thing in the scene.
    hullRelief: true,
    // The fine surface maps: roughness variation and detail normals. See materials.js.
    surfaceDetail: true,
    sailSegments: [14, 10],
    mouldingSweeps: 96,
    // Baked contact shadows — see src/ship/occlusion.js. Close inspection is exactly
    // where a boat with no shadow under it or a gun that looks glued to the deck gives
    // the game away fastest, so this stays on even though it is the one switch here
    // whose cost was tuned against the *game* budget rather than this one.
    ambientOcclusion: true,

    textureSize: 1024,
  },

  game: {
    hullSideJoinery: 'wale',
    hullStations: 61,
    hullPoints: 34,
    sparSegments: 5,
    sparRadial: 6,
    ropeRadial: 3,
    ropeSegments: 5,
    latheSegments: 10,

    // Shrouds and stays stay as tubes because they read at gameplay range; ratlines
    // drop to lines, which cost nothing and still give the rigging its texture.
    ropesAsTubes: true,
    ratlines: 'lines',
    ratlineEvery: 2,
    gammoning: false,
    footropes: false,
    runningRigging: 'principal',
    deadeyes: 'simple',
    chainplates: true,
    channelRails: true,
    channelKnees: false,
    blocks: false,
    gunBarrels: true,
    gunCarriages: 'simple',
    gunBarrelStages: 'coarse',
    gunBreechings: true,
    gunTackles: false,
    portLids: true,
    innerBulwarks: true,
    deckFurniture: 'principal',
    gratingBattens: false,
    hammockCranes: 'simple',
    belayingPins: false,
    galleryGlazing: true,
    sternStations: 9,
    sternWindows: true,
    sternGalleries: true,
    sternOrnament: 'simple',
    rudderIrons: true,
    figurehead: 'simple',
    headRails: true,
    headDetail: 'principal',
    headStations: 14,
    boats: 'simple',
    boatStations: 13,
    boatPoints: 9,
    boatGear: false,
    anchorDetail: 'simple',
    // The spares are only read from close alongside, so at gameplay range the two bowers
    // and their cables carry the whole story of the bow.
    anchorSpares: 0,
    anchorCables: true,
    flags: 'principal',
    flagSegments: [12, 6],
    flagHalliards: true,
    crew: 'principal',
    copperNails: false,
    // The plank seams still catch the light at gameplay range; the copper's nails do not,
    // and they cost a second full pass of the sheathing generator.
    hullRelief: true,
    surfaceDetail: true,
    sailSegments: [8, 6],
    mouldingSweeps: 48,
    // On, at the level the host game actually calls `buildShip` at a loading screen —
    // src/ship/occlusion.js is budgeted against this LOD specifically, under 400 ms for
    // the whole ship, so turning it off here would be turning it off where it matters.
    ambientOcclusion: true,

    textureSize: 512,
  },

  distant: {
    // At silhouette range the ship is a few hundred pixels tall, so the whole level has
    // to fit inside five thousand triangles. That is not much for a three-masted ship,
    // and the way it is spent matters: the hull and the spars carry the silhouette, and
    // everything else — ornament, ironwork, the fine work at the head and stern — is
    // invisible and must go.
    hullStations: 19,
    hullPoints: 16,
    sparSegments: 2,
    sparRadial: 3,
    ropeRadial: 3,
    ropeSegments: 2,
    latheSegments: 5,

    // At this range the rig is a smudge. Only the stays and the lower shrouds are
    // drawn, as lines, because without them the masts look like bare poles.
    ropesAsTubes: false,
    ratlines: false,
    ratlineEvery: 4,
    gammoning: false,
    footropes: false,
    runningRigging: 'none',
    deadeyes: false,
    chainplates: false,
    channelRails: false,
    channelKnees: false,
    blocks: false,
    gunBarrels: false,
    gunCarriages: false,
    gunBarrelStages: 'coarse',
    gunBreechings: false,
    gunTackles: false,
    portLids: false,
    innerBulwarks: false,
    deckFurniture: 'none',
    gratingBattens: false,
    hammockCranes: false,
    belayingPins: false,
    galleryGlazing: false,
    // At this range the stern is a shape, not a piece of joinery: the counter and the
    // transom still have to close the hull, but nothing is carved and the rudder is a
    // plain blade.
    sternStations: 3,
    sternWindows: false,
    sternGalleries: false,
    sternOrnament: 'none',
    rudderIrons: false,
    figurehead: 'none',
    headRails: false,
    headDetail: 'none',
    headStations: 5,
    boats: 'block',
    boatStations: 7,
    boatPoints: 5,
    boatGear: false,
    anchorDetail: 'none',
    anchorSpares: 0,
    anchorCables: false,
    flags: 'ensign',
    flagSegments: [4, 2],
    flagHalliards: false,
    crew: false,
    copperNails: false,
    hullRelief: false,
    // Off. She is a silhouette on the horizon; roughness variation on her is invisible
    // by definition, and it cost twelve textures in a file whose point is to be small.
    surfaceDetail: false,
    sailSegments: [3, 2],
    mouldingSweeps: 12,
    // A contact shadow under a boat is a few pixels wide at this range and a silhouette
    // does not have vertex colours worth spending on; see src/ship/occlusion.js.
    ambientOcclusion: false,

    textureSize: 256,
  },
};

export function lodConfig(lod) {
  const c = CONFIG[lod];
  if (!c) throw new Error(`unknown LOD "${lod}" — expected one of ${LODS.join(', ')}`);
  return c;
}

// The budget, and the one place it is written. tools/build.js imports it rather than
// keeping a copy, because two copies of a budget is one budget and one lie.
//
// Mast tops retain open access and load-bearing structure at every tier. The
// export budgets include the optional crew; the browser host measures its
// crew-free animated ship separately (1.6m / 960k / 84k).
export const TRI_BUDGET = {
  // Includes the optional 299k authored watch. The crew-free browser host still
  // checks its 1.6m cinematic / 960k hero ship limits separately.
  cinematic: [380000, 1880000],
  hero: [200000, 1260000],
  game: [30000, 88000],
  distant: [1500, 6500],
};
