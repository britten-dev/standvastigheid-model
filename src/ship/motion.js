// Motion. The part of a ship that a still model cannot have.
//
// `buildShip` returns a ship that does not move, and that is deliberate: a GLB is a
// static thing and the host owns the hull's own heave, pitch and roll. But a ship whose
// every rope, sail and flag is welded to her hull is unmistakable however good the
// geometry is, because on a real ship *nothing above the deck is still*. The masts work,
// the shrouds swing, the canvas shivers, the ensign flies, the wheel turns and the men
// lean against the heel. Take all of that away and what is left reads as a model being
// carried through a scene, which is exactly what it is.
//
// So this is a layer laid over a built ship rather than a change to how she is built:
//
//     const ship = buildShip({ lod: 'game', sails: 'storm' });
//     const motion = createMotion(ship);
//     // each frame, after the host has moved the hull:
//     motion.update(t, { windSpeed: 24, heel: -0.18, pitch: 0.04, helm: -0.4, spray: 1 });
//
// `buildShip` is untouched, the GLB export is untouched, and a host that never calls
// this gets exactly the ship it had before.
//
// ## How the movement is done
//
// Three mechanisms, chosen per part by what that part is:
//
//  * **A vertex shader**, for everything aloft. The rig and the canvas are a handful of
//    merged meshes of tens of thousands of vertices with no nodes inside them to
//    animate, so the movement has to happen per vertex — and the processor has better
//    things to do with forty thousand triangles a frame.
//  * **Node transforms**, for the yards, the wheel and the men. All three are rigid, all
//    three have their own nodes, and moving a node is free. The yards are the important
//    one: sails.js hangs each square sail on its own yard rather than merging the suit
//    into one mesh, so bracing a yard brings its canvas round with it — which is what a
//    square rig is for, and what a merged suit makes impossible.
//  * **Rewriting the vertices**, for the three flags. A flag is a hundred and fifty
//    vertices and its exact surface is worth more than the microsecond that costs.
//
// ## The one rule that matters
//
// Everything aloft has to agree about **the whip**: how far the rig has swung out of
// line at a given height. If the shader's answer and the processor's answer differ by a
// centimetre, the topmen stand in mid-air and the ensign leaves the gaff. So it is
// written once, in `whipAt`, and the shader is handed the same expression in GLSL
// immediately below it. That is the only duplicated logic in this file, and the two are
// kept touching for exactly that reason.
//
// ## Why the shader works in the ship's frame and not the mesh's
//
// Every mesh in the rig carries a transform of its own: a mast is placed at its step and
// raked, a yard is placed at its slings and braced round. So a vertex's own `position.y`
// is not its height above the deck, and using it would bend each spar about its own
// origin rather than about the ship. The shader therefore recovers the height in the
// ship's frame from the model matrix, and applies the displacement in world space after
// the projection — which costs one dot product and one matrix multiply per vertex, works
// whatever transform a mesh happens to carry, and keeps working when the host rolls the
// whole ship over forty degrees.
import * as THREE from 'three';
import { holdWheel } from './crew-ik.js';
import { SPEC, PAINT } from '../spec/spec.js';
import { poseFlag } from './flags.js';
import { createRiggingBindings } from './rigging-bindings.js';
import { createSailSheeting, SHEETING_GLSL } from './sail-sheeting.js';
import { clamp, deg } from '../util/math.js';

const S = (k) => SPEC[k].value;

/**
 * How far the rig has swung out of line at a height in the ship's frame, as a fraction
 * of the whip amplitude: nil at the deck, one at the trucks, going as the square of the
 * height between — which is the shape a tapered spar loaded at its head bends in.
 */
function whipAt(y, deckY, truckY, exponent) {
  return Math.pow(clamp((y - deckY) / Math.max(0.001, truckY - deckY), 0, 1), exponent);
}

/** The same function, for the shader. It must stay the same function. */
const ALOFT_GLSL = `
  uniform float uTime;
  uniform vec3 uWhipWorld;
  uniform float uWhipExp;
  uniform float uDeckY;
  uniform float uTruckY;
  uniform vec3 uWindWorld;
  uniform float uWind;
  uniform float uSway;
  uniform float uSwayPeriod;
  uniform float uSwayFactor;
  uniform vec4 uShipRowX;
  uniform vec4 uShipRowZ;

  float whipAt(float y) {
    return pow(clamp((y - uDeckY) / max(0.001, uTruckY - uDeckY), 0.0, 1.0), uWhipExp);
  }
  vec3 rigDisplacement(vec4 wPos) {
    float shipY = dot(uShipRowY, wPos);
    vec3 disp = uWhipWorld * whipAt(shipY);
    if (uSwayFactor > 0.0) {
      float hf = clamp((shipY - uDeckY) / max(0.001, uTruckY - uDeckY), 0.0, 1.0);
      float span = sin(3.14159 * hf);
      #ifdef PINNED_ROPE
        span *= aRopeFreedom;
      #endif
      // The phase lives on the rig, not the ocean's world coordinates.
      float ph = uTime * 6.28318 / uSwayPeriod
        + dot(uShipRowZ, wPos) * 0.7 + dot(uShipRowX, wPos) * 1.3;
      disp += uWindWorld * (uSway * uSwayFactor * uWind * span * sin(ph));
      disp.y += uSway * uSwayFactor * 0.25 * uWind * span * sin(ph * 1.7);
    }
    return disp;
  }
`;

/**
 * The displacement every aloft part shares, applied in world space after the vertex has
 * been projected. `uShipRowY` is the row of the ship's inverse world matrix that gives
 * the height in her own frame, so one dot product turns a world position into the
 * number `whipAt` wants.
 */
const ALOFT_BODY = `
  {
    vec3 disp = rigDisplacement(modelMatrix * vec4(transformed, 1.0));
    mvPosition.xyz += (viewMatrix * vec4(disp, 0.0)).xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * A sail.
 *
 * The ripple runs across the cloth from luff to leech and the whole belly breathes with
 * the gusts. The head and loaded corners stay fixed. The free leeches ripple
 * more visibly, especially when apparent wind runs nearly along the canvas.
 *
 * The displacement is along the sail's own normal and so is done in the mesh's own
 * frame, where the normal is; the whip above is done in the world's. `uv` arrives tiled
 * into the cloth map's variant grid — see `retileUV` in sails.js — so the sail's own
 * coordinates have to be recovered from it before anything can be said about where its
 * head and foot are.
 */
const SAIL_PARS = `
  uniform float uFlutter;
  uniform float uSailSpread;
  uniform float uWaveLength;
  uniform float uWaveSpeed;
  uniform float uBreathe;
  uniform float uLuff;
  uniform float uSailTiles;
  uniform float uSailPhase;
  uniform vec2 uSailSpan;
  uniform float uClothWind;
  uniform float uClothLuff;
  uniform float uFreeLeeches;
  uniform float uClothPhase;

  float clothOffset(vec2 st) {
    // UVs have an atlas gutter; remove it so every attachment is actually fixed.
    vec2 q = clamp((st - 0.002) / 0.996, 0.0, 1.0);
    float across = max(0.0, sin(3.14159265 * q.x));
    float down = max(0.0, sin(3.14159265 * q.y));
    float freedom = pow(across, 0.85) * pow(down, 0.8);
    float k = 6.2831853 / max(0.5, uWaveLength);
    float phase = k * q.x * uSailSpan.x - uTime * uWaveSpeed * 2.4 + uSailPhase;
    float ripple = sin(phase + q.y * 1.4)
      + 0.32 * sin(phase * 1.73 + q.y * 4.0 + uSailPhase);
    float breath = uBreathe * 3.6 * (0.7 * sin(uTime * 0.43 + uSailPhase - q.y * 1.1)
      + 0.3 * sin(uTime * 0.79 + uSailPhase * 1.7 - q.y * 2.0));
    float leech = mix(1.0, uLuff, pow(1.0 - across, 3.0));
    // Keep extra movement at the free sides, away from masthead/stay clearances.
    // The head, foot and loaded corners remain fixed.
    float edge = uFreeLeeches * pow(1.0 - across, 5.0) * pow(down, 1.2);
    float gust = 0.8 + 0.2 * sin(uTime * 0.67 + uSailPhase);
    float shake = sin(uClothPhase - q.y * 9.0 + uSailPhase)
      + 0.28 * sin(uClothPhase * 1.87 - q.y * 15.0 + uSailPhase * 1.7);
    float edgeMotion = edge * sqrt(uClothWind) * gust * (0.16 + 0.32 * uClothLuff) * shake;
    return uSailSpread * (uFlutter * uClothWind * freedom * (ripple * 0.16 * leech + breath) + edgeMotion);
  }
`;

const SAIL_BODY = `
  {
    vec2 suv = fract(uv * uSailTiles);
    transformed += objectNormal * clothOffset(suv);
    #ifndef HW_SHADOW
      // Shade the same displacement we render, including the edge constraints.
      // Per-metre slopes prevent a small topsail looking as soft as a huge course.
      float e = 0.002;
      float dU = (clothOffset(suv + vec2(e, 0.0)) - clothOffset(suv - vec2(e, 0.0)))
        / (2.0 * e * uSailSpan.x);
      float dV = (clothOffset(suv + vec2(0.0, e)) - clothOffset(suv - vec2(0.0, e)))
        / (2.0 * e * uSailSpan.y);
      vec3 tU = normalize(cross(objectNormal, vec3(0.0, 1.0, 0.0)) + vec3(1e-4, 0.0, 0.0));
      vec3 tV = cross(objectNormal, tU);
      vNormal = normalize(normalMatrix * sheetNormal(transformed, normalize(objectNormal - tU * dU - tV * dV)));
    #endif
    transformed = sheetPosition(transformed);
  }
`;

// What a wet ship looks like. Wet paint is about half the brightness of dry and very
// much smoother, and it is the smoothness that does the work: the darkening alone reads
// as a repaint, while the sheet of specular the water puts on the topsides reads as a
// sea that has just gone over her.
const WET_PARS = `
  uniform float uWetness;
  uniform float uWetY;
  uniform float uWetDarken;
  uniform float uWetRough;
  uniform float uAlwaysWet;
  varying float vShipYWet;
  #ifdef HULL_WET_PROFILE
    uniform sampler2D uHullWetProfile;
    uniform vec4 uHullWetExtent;
    varying vec3 vHullWetPoint;
    float wetGrain(float x) {
      float i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
      return mix(fract(sin(i*127.1)*43758.5453),fract(sin((i+1.0)*127.1)*43758.5453),f);
    }
  #endif

  // How wet this fragment is: everything the sea reached, and the decks always, because
  // in this weather a deck is never dry.
  vec2 wetSurface() {
    #ifdef HULL_WET_PROFILE
      if (uHullWetExtent.w > 0.5) {
        float column = clamp((vHullWetPoint.z-uHullWetExtent.x)/(uHullWetExtent.y-uHullWetExtent.x),0.0,1.0)*(uHullWetExtent.z-1.0);
        float row = vHullWetPoint.x < 0.0 ? 0.25 : 0.75;
        vec3 a = texture2D(uHullWetProfile,vec2((floor(column)+.5)/uHullWetExtent.z,row)).rgb;
        vec3 b = texture2D(uHullWetProfile,vec2((min(floor(column)+1.0,uHullWetExtent.z-1.0)+.5)/uHullWetExtent.z,row)).rgb;
        vec3 contact = mix(a,b,fract(column));
        // Object-space drainage paths: no travelling noise or timed sparkle.
        // The channels appear only where an actual crest wetted the hull.
        float run=vHullWetPoint.z+vHullWetPoint.x*.63;
        float reached=contact.r-.07+.14*wetGrain(run*1.9);
        float y=vHullWetPoint.y,water=contact.g,reserve=clamp(contact.b,0.0,1.0);
        float absorbed=1.0-smoothstep(reached-.24,reached+.16,y);
        float wetNow=1.0-smoothstep(water-.12,water+.14,y);
        float channels=wetGrain(run*7.3+.18*sin(y*1.2+wetGrain(run)*6.0));
        float aa=max(.04,fwidth(channels)*1.4);
        float rivulet=smoothstep(.58-aa,.58+aa,channels);
        float drainingTop=max(water,reached-(1.0-reserve)*1.7);
        float draining=1.0-smoothstep(drainingTop-.35,drainingTop+.15,y);
        float film=max(wetNow,absorbed*reserve*draining*(.2+.8*rivulet));
        float damp=absorbed*(.84+.16*wetGrain(run*3.1));
        return vec2(max(uWetness*.25,damp),max(uWetness*.1,film));
      }
    #endif
    float amount=uWetness * max(uAlwaysWet, 1.0 - smoothstep(uWetY - 1.2, uWetY + 0.8, vShipYWet));
    return vec2(amount);
  }
`;

export function createMotion(ship, opts = {}) {
  const uniforms = {
    uHullWetProfile: { value: null },
    uHullWetExtent: { value: new THREE.Vector4(0,1,1,0) },
    uTime: { value: 0 },
    uWhipWorld: { value: new THREE.Vector3() },
    uWhipExp: { value: S('motion_whip_exponent') },
    uDeckY: { value: 0 },
    uTruckY: { value: 1 },
    uShipRowY: { value: new THREE.Vector4(0, 1, 0, 0) },
    uShipRowX: { value: new THREE.Vector4(1, 0, 0, 0) },
    uShipRowZ: { value: new THREE.Vector4(0, 0, 1, 0) },
    uWindWorld: { value: new THREE.Vector3(0, 0, 1) },
    uWind: { value: 1 },
    uSway: { value: S('motion_rope_sway') },
    uSwayPeriod: { value: S('motion_rope_period') },
    // Sails
    uFlutter: { value: S('motion_sail_flutter') },
    uWaveLength: { value: S('motion_sail_wave_length') },
    uWaveSpeed: { value: S('motion_sail_wave_speed') },
    uBreathe: { value: S('motion_sail_breathe') },
    uLuff: { value: S('motion_sail_luff_shiver') },
    uSailTiles: { value: PAINT.weather_sail_variants.value },
    // Wet
    uWetness: { value: 0 },
    uWetY: { value: 0 },
    uWetDarken: { value: PAINT.wet_darken.value },
    uWetRough: { value: PAINT.wet_roughness.value },
  };

  ship.updateMatrixWorld(true);

  // The two heights everything aloft is scaled between. Taken from the built ship rather
  // than from the spec, because the spec knows how long a topgallant mast is and not
  // where its truck ended up once the mast had been raked.
  const shipBox = new THREE.Box3().setFromObject(ship);
  const truckY = shipBox.max.y;
  const hullGroup = ship.getObjectByName('hull');
  const deckGroup = ship.getObjectByName('decks');
  const deckY = deckGroup ? new THREE.Box3().setFromObject(deckGroup).max.y : 0;
  uniforms.uDeckY.value = deckY;
  uniforms.uTruckY.value = truckY;

  // Where the sea reaches when she is running hard, from the hull's own extent and the
  // spec's wet line.
  if (hullGroup) {
    const hb = new THREE.Box3().setFromObject(hullGroup);
    uniforms.uWetY.value = hb.min.y + PAINT.wet_line_v.value * (hb.max.y - hb.min.y);
  }

  const patched = [];
  const clothDrivers = new Map();

  /**
   * Patch one mesh's material.
   *
   * The material is cloned first. Materials are cached per level of detail and shared by
   * every ship built at that level, so patching one in place would set a whole fleet
   * shivering to the same wave at the same instant — and would put movement into the
   * material the GLB exporter reads, which has to stay still.
   */
  function patch(mesh, { aloft = false, sail = false, wet = false, alwaysWet = 0, sway = 0 }) {
    const mat = mesh.material.clone();
    const clothLight = sail && !!mesh.material.sailLayerMap;
    const pinnedRope=!!mesh.geometry.attributes.aRopeFreedom;
    const hullProfile = mesh.name === 'hull_shell' || mesh.userData.hullWetProfile === true;
    const hullFinish = mesh.material.aoMap?.name === 'hull-fitting-contact';
    const own = { ...uniforms, uSwayFactor: { value: sway }, uAlwaysWet: { value: alwaysWet } };
    if (clothLight) {
      own.uClothLayers = { value: mesh.material.sailLayerMap };
      // A night sail is lit by the moon and sky, not by an internal lamp.
      mat.emissiveIntensity *= .12;
      mat.sheen *= .65;
      mat.sheenRoughness = .78;
    }
    if (sail) {
      Object.assign(own, mesh.userData.sheeting ?? {uSheetEnabled:{value:0},
        uSheetRestFoot:{value:new THREE.Vector3(0,-1,0)},uSheetFoot:{value:new THREE.Vector3(0,-1,0)},uSheetTurn:{value:0}});
      own.uSailSpread = mesh.userData.sailSpread ?? { value: 1 };
      // Bolt ropes share the cloth's motion, including its phase and scale.
      const clothName = mesh.name.replace('_cordage_sail', '_sail');
      const geometry = mesh.parent?.getObjectByName(clothName)?.geometry ?? mesh.geometry;
      let driver = clothDrivers.get(clothName);
      if (!driver) {
        driver = {mesh,wind:new THREE.Vector3(),point:new THREE.Vector3(),
          strength:{value:0},luff:{value:0},phase:{value:0},square:!!geometry.userData.sheetFrame};
        clothDrivers.set(clothName,driver);
      }
      own.uClothWind=driver.strength;own.uClothLuff=driver.luff;
      own.uClothPhase=driver.phase;
      own.uFreeLeeches={value:driver.square?1:0};
      const size = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position).getSize(new THREE.Vector3());
      let hash = 0;
      for (const c of clothName) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
      own.uSailPhase = { value: (hash % 1000) / 1000 * Math.PI * 2 };
      own.uSailSpan = { value: new THREE.Vector2(Math.max(2, size.x, size.z), Math.max(2, size.y)) };
    }

    function moveVertices(shader, shadow = false) {
      Object.assign(shader.uniforms, own);
      const declarations = [
        hullProfile ? '#define HULL_WET_PROFILE' : '',
        pinnedRope ? '#define PINNED_ROPE\nattribute float aRopeFreedom;' : '',
        shadow ? '#define HW_SHADOW' : '',
        (aloft || sail || wet) ? 'uniform vec4 uShipRowY;' : '',
        aloft ? ALOFT_GLSL : '', sail ? SAIL_PARS + SHEETING_GLSL : '',
        wet ? 'varying float vShipYWet;' : '',
        hullProfile ? 'varying vec3 vHullWetPoint;' : '',
      ].filter(Boolean).join('\n');
      let v = shader.vertexShader.replace('#include <common>', `#include <common>\n${declarations}`);
      if (sail) {
        const normal = shadow ? '#ifndef USE_DISPLACEMENTMAP\nvec3 objectNormal = vec3(normal);\n#endif\n' : '';
        v = v.replace('#include <begin_vertex>', `${normal}#include <begin_vertex>`);
        v = v.replace('#include <morphtarget_vertex>', `#include <morphtarget_vertex>\n${SAIL_BODY}`);
      }
      if (wet) v = v.replace('#include <project_vertex>',
        'vShipYWet = dot(uShipRowY, modelMatrix * vec4(transformed, 1.0));\n#include <project_vertex>');
      if (hullProfile) v = v.replace('#include <project_vertex>', 'vHullWetPoint = transformed;\n#include <project_vertex>');
      if (aloft) {
        v = v.replace('#include <project_vertex>', `#include <project_vertex>\n${ALOFT_BODY}`);
        // The world position used to sample a shadow must move with the vertex.
        v = v.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
          #if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined( USE_SHADOWMAP ) || defined( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
            worldPosition.xyz += rigDisplacement(modelMatrix * vec4(transformed, 1.0));
          #endif`);
      }
      shader.vertexShader = v;
    }

    mat.onBeforeCompile = (shader) => {
      moveVertices(shader);

      if (clothLight) {
        // Thin flax scatters light from behind it. Use the actual directional
        // light, in view space like the shading normal, instead of uniform glow.
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform sampler2D uClothLayers;')
          .replace('#include <lights_fragment_end>',
          `#include <lights_fragment_end>
          #if NUM_DIR_LIGHTS > 0
            float clothLayers = texture2D(uClothLayers, vMapUv).b;
            // Single canvas passes a warm diffuse glow; hems, seams, patches
            // and reinforcing pieces attenuate it through additional layers.
            float clothTransmission = 0.43 * exp(-3.1 * clothLayers);
            for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
              float throughCloth = pow(max(0.0, dot(-normal, directionalLights[i].direction)), 1.25);
              reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(1.0, .93, .79)
                * directionalLights[i].color * throughCloth * clothTransmission;
            }
          #endif`);
      }

      if (wet) {
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>\n${hullProfile?'#define HULL_WET_PROFILE':''}\n${WET_PARS}`)
          .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
            // Water smooths the finish but cannot erase plank grain and beaten
            // copper. Preserve that variation instead of making every wet face a mirror.
            roughnessFactor = mix(roughnessFactor, max(uWetRough, roughnessFactor * 0.56), hullSurfaceWet.y);
          `)
          .replace('#include <color_fragment>', `#include <color_fragment>
            vec2 hullSurfaceWet=wetSurface();
            diffuseColor.rgb *= 1.0 - uWetDarken * hullSurfaceWet.x;
          `);
      }
      if(hullFinish)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        vec3 fittingFinish=texture2D(aoMap,vAoMapUv).rgb;
        diffuseColor.rgb *= (1.0-fittingFinish.g*vec3(.15,.20,.25))*(.95+fittingFinish.b*.10);
      `);
    };

    // Each shape of patch needs its own compiled program. Without a key that says which,
    // three hands the sails the rigging's shader and nothing moves but the rigging.
    const key = `motion:${aloft ? 'a' : ''}${sail ? 's' : ''}${clothLight ? 'layers' : ''}${wet ? 'w' : ''}${hullProfile?'h':''}${hullFinish?'finish':''}${alwaysWet}:${sway}:${pinnedRope?'pinned':''}`;
    mat.customProgramCacheKey = () => key;
    mat.needsUpdate = true;
    mesh.material = mat;
    patched.push(mat);
    if (aloft && mesh.isMesh) {
      const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: mat.side });
      depth.onBeforeCompile = shader => moveVertices(shader, true);
      depth.customProgramCacheKey = () => `${key}:shadow`;
      mesh.customDepthMaterial = depth;
      patched.push(depth);
    }
    return mat;
  }

  // ---------------------------------------------------------------- what moves, and how
  const parts = { flags: [], crew: [], yards: [], wheel: null };
  parts.rigging=createRiggingBindings(ship);
  parts.sheeting=createSailSheeting(ship);
  const named = (n) => ship.getObjectByName(n);

  // The canvas. The fore-and-aft sails are still one merged mesh — they are set on stays
  // and do not brace — while every square sail is its own mesh hung on its own yard, so
  // they are matched by the name sails.js gives them rather than by a fixed list. That
  // pattern is a contract between the two files, and tools/check-motion.js is what holds
  // them to it: when the square sails were split out of one merged mesh, nothing threw —
  // they simply stopped shivering, and the check is what noticed.
  const isSail = (n) => n === 'fore_and_aft_sails' || /_sail$/.test(n);
  const runningNames = new Set(['running_rigging_ropes']);

  // Everything aloft shares the mast bend. Standing rigging and ratlines keep
  // their junctions together; running spans sway between pinned attachments.
  const rig = named('rig');
  if (rig) {
    rig.traverse((o) => {
      if (!(o.isMesh || o.isLine || o.isLineSegments)) return;
      if (isSail(o.name)) patch(o, { aloft: true, sail: true });
      else if (runningNames.has(o.name)) {
        patch(o, { aloft: true, sway: S('motion_running_rope_factor') });
      } else patch(o, { aloft: true });
    });
  }

  // The hull and everything standing on her deck: no movement of their own, but they get
  // wet. The deck is always wet in this weather; the topsides only where the sea reached.
  for (const name of ['hull', 'decks', 'furniture', 'guns', 'ports', 'boats']) {
    const g = named(name);
    if (!g) continue;
    const always = name === 'decks' ? 1 : 0;
    g.traverse((o) => { if (o.isMesh) patch(o, { wet: true, alwaysWet: always }); });
  }

  // ------------------------------------------------------------------------- the flags
  const flagGroup = named('flags');
  if (flagGroup) {
    for (const o of flagGroup.children) {
      if (!o.isMesh || !o.geometry.userData?.flag) continue;
      parts.flags.push({
        node: o,
        phase: o.geometry.userData.flag.phase,
        stream: o.geometry.userData.flag.dir.clone(),
        wind: new THREE.Vector3(),
        started: false,
        home: o.position.clone(),
        f: whipAt(new THREE.Box3().setFromObject(o).max.y, deckY, truckY, uniforms.uWhipExp.value),
      });
    }
  }

  // -------------------------------------------------------------------------- the watch
  const crewGroup = named('crew');
  if (crewGroup) {
    for (const [i, f] of crewGroup.children.entries()) {
      const info = f.userData.crew ?? {};
      const arms = [f.getObjectByName('arm_port'), f.getObjectByName('arm_starboard')].filter(Boolean);
      parts.crew.push({
        node: f,
        home: { position: f.position.clone(), x: f.rotation.x, y: f.rotation.y },
        role: info.role ?? 'deck',
        pose: info.pose ?? 'stand',
        arms,
        armHome: arms.map((a) => a.rotation.clone()),
        head: f.getObjectByName('head'),
        eyes: ['eye_port','eye_starboard'].map(n=>f.getObjectByName(n)).filter(Boolean),
        lids: ['lid_port','lid_starboard'].map(n=>f.getObjectByName(n)).filter(Boolean),
        // Each man has a phase of his own, so that thirteen of them do not sway as one.
        phase: i * 1.37,
        f: whipAt(f.position.y, deckY, truckY, uniforms.uWhipExp.value),
      });
    }
  }
  parts.wheel = named('ships_wheel');
  parts.rudder = named('rudder_hinge');
  const rudderAxis = new THREE.Vector3().fromArray(parts.rudder?.userData.axis ?? [0, 1, 0]);

  // ------------------------------------------------------------------- the yards
  //
  // Every yard that carries a square sail, and its sail with it — sails.js hangs each one
  // on its own yard for exactly this reason. The spritsail yard under the bowsprit is
  // left out: it is not braced with the rest and it has no sail on it here.
  if (rig) {
    rig.traverse((o) => {
      if (!o.isMesh || !/_yard$/.test(o.name) || o.name === 'spritsail_yard') return;
      parts.yards.push({ node: o, built: o.rotation.y });
    });
  }

  // ------------------------------------------------------------------------ the update
  const whip = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const inv = new THREE.Matrix4();
  const flagTurn = new THREE.Quaternion();
  const flagStep = new THREE.Quaternion();
  const flagTarget = new THREE.Vector3();
  const flagGravity = new THREE.Vector3();
  let lastHeel = 0;
  let lastTime = 0;
  let wet = 0;
  // The yards start where they were built, and are hauled round from there.
  let brace = parts.yards[0]?.built ?? 0;

  function update(time, state = {}) {
    const {
      windSpeed = 12,       // metres per second
      apparentWind = null, // optional air velocity in the ship's local frame
      apparentWindAt = null, // optional (local hoist position, out) => local air velocity
      windDeg = 150,        // where the wind is going, from dead ahead, turning to starboard
      heel = 0,             // radians, positive to starboard
      pitch = 0,            // radians, positive bow up
      helm = 0,             // -1 hard a-port to +1 hard a-starboard
      spray = 0,            // 0 to 1: a sea has just come aboard
    } = state;
    const dt = Math.min(0.25, Math.max(0, time - lastTime));
    lastTime = time;

    ship.updateMatrixWorld();
    inv.copy(ship.matrixWorld).invert();
    const e = inv.elements;
    uniforms.uShipRowY.value.set(e[1], e[5], e[9], e[13]);
    uniforms.uShipRowX.value.set(e[0], e[4], e[8], e[12]);
    uniforms.uShipRowZ.value.set(e[2], e[6], e[10], e[14]);
    ship.getWorldQuaternion(q);

    // The wind as a strength the shaders multiply by. A gale is about 22 m/s, which is
    // the weather every amplitude in the spec is written for.
    const w = clamp(windSpeed / 22, 0, 1.6);
    uniforms.uTime.value = time;
    uniforms.uWind.value = w;
    const wr = (windDeg * Math.PI) / 180;
    uniforms.uWindWorld.value.set(Math.sin(wr), 0, -Math.cos(wr)).applyQuaternion(q);

    // The whip: the rig leans away from the roll, lags behind it, and works slowly on its
    // own besides, so that a ship lying quietly is still not perfectly still.
    const rollRate = dt > 0 ? (heel - lastHeel) / dt : 0;
    lastHeel = heel;
    const amp = S('motion_whip_amplitude');
    const own = Math.sin((time * Math.PI * 2) / S('motion_whip_period'));
    whip.set(
      -amp * (Math.sin(heel) * 0.6 + rollRate * S('motion_whip_lag')) - amp * 0.25 * own * w,
      0,
      amp * Math.sin(pitch) * 0.5 + amp * 0.18 * Math.sin(time * 0.9) * w
    );
    // The shaders work in world space; the whip is written in the ship's.
    uniforms.uWhipWorld.value.copy(whip).applyQuaternion(q);

    // Wetness. A sea comes aboard and she dries slowly, which is what makes it read as
    // something that happened rather than as a setting.
    wet = Math.max(clamp(spray, 0, 1), wet - dt / S('motion_wet_dry_seconds'));
    uniforms.uWetness.value = wet;

    // ------------------------------------------------------------------ the flags
    flagGravity.set(0, -1, 0).applyQuaternion(q.clone().invert());
    for (const f of parts.flags) {
      f.node.position.set(f.home.x + whip.x * f.f, f.home.y, f.home.z + whip.z * f.f);
      // Cloth follows the air passing the ship. Integrate phase so changing weather
      // changes the flutter rate without jumping to a different pose.
      if (apparentWindAt) apparentWindAt(f.node.position, f.wind);
      else if (apparentWind) f.wind.copy(apparentWind);
      else f.wind.set(Math.sin(wr), 0, -Math.cos(wr)).multiplyScalar(windSpeed);
      const flagWind = clamp(f.wind.length() / 22, 0, 1.6);
      if (f.wind.lengthSq() > 0.01) {
        flagTarget.copy(f.wind).normalize();
        if (!f.started) f.stream.copy(flagTarget);
        else {
          // Normalized linear interpolation gets stuck when the wind reverses
          // exactly. Turn through an arc instead, retaining a short cloth lag.
          flagTurn.setFromUnitVectors(f.stream, flagTarget);
          flagStep.identity().slerp(flagTurn, 1 - Math.exp(-dt / 0.65));
          f.stream.applyQuaternion(flagStep).normalize();
        }
        f.started = true;
      }
      f.phase += dt * S('motion_flag_wave_speed') * 1.4 * Math.sqrt(flagWind);
      poseFlag(f.node.geometry, f.phase, { direction: f.stream, wind: flagWind, gravity: flagGravity });
    }

    // ------------------------------------------------------------------- the yards
    //
    // Braced to the wind. Square when it is aft, sharp up when it is forward, and the
    // rule between the two is the one a seaman uses: the yard bisects the angle between
    // the wind and the keel.
    //
    // `cos(wr)` is how far aft the wind is — one dead astern, minus one dead ahead — and
    // `sin(wr)` which side it is on. The lee yardarm goes forward, so the sign follows
    // the side the wind is blowing toward.
    //
    // They come round at a rate, not instantly. Braces are hauled by hand by a watch on
    // deck; a rig that snaps to a new angle the moment the wind shifts says plainly that
    // nobody is working the ship.
    const braceWant = deg(S('motion_brace_max_deg'))
      * ((1 - Math.cos(wr)) / 2)
      * (Math.sin(wr) >= 0 ? 1 : -1);
    const step = deg(S('motion_brace_rate_deg')) * dt;
    brace += clamp(braceWant - brace, -step, step);
    for (const y of parts.yards) {
      const angle=clamp(brace,-(y.node.userData.braceLimit??Infinity),y.node.userData.braceLimit??Infinity);
      y.node.rotation.y = angle;
      // The truss/parrel carries the spar in front of the mast as it turns;
      // rotating about the spar's old centre swings its middle through the mast.
      const pivot = y.node.userData.yardPivot;
      if (pivot) {
        y.node.position.x = pivot.mast[0] - Math.sin(angle) * pivot.clearance;
        y.node.position.z = pivot.mast[2] - Math.cos(angle) * pivot.clearance;
      }
    }
    parts.sheeting.update();
    parts.rigging.update();
    // One response for cloth and bolt ropes. Apparent wind includes ship speed
    // and gusts; ease pressure changes instead of snapping into a flap.
    for(const d of clothDrivers.values()) {
      if(d.square)d.point.copy(d.mesh.parent.position);
      else d.point.set(0,deckY+8,0);
      if(apparentWindAt)apparentWindAt(d.point,d.wind);
      else if(apparentWind)d.wind.copy(apparentWind);
      else d.wind.set(Math.sin(wr),0,-Math.cos(wr)).multiplyScalar(windSpeed);
      const speed=d.wind.length(),angle=d.square?d.mesh.parent.rotation.y:0;
      const pressure=speed>.01?Math.abs(d.wind.x*Math.sin(angle)+d.wind.z*Math.cos(angle))/speed:1;
      const target=1-THREE.MathUtils.smoothstep(pressure,.15,.65);
      const blend=1-Math.exp(-Math.max(dt,1/120)*2.5);
      d.strength.value+=(clamp(speed/22,0,1.6)-d.strength.value)*blend;
      d.luff.value+=(target-d.luff.value)*blend;
      d.phase.value+=dt*(3.8+2.4*d.luff.value);
    }

    // ------------------------------------------------------------------- the wheel
    if (parts.wheel) parts.wheel.rotation[parts.wheel.userData.axis ?? 'x'] = -helm * deg(S('motion_helm_throw_deg'));
    // The wheel, blade and steering physics share the same helm command. The blade
    // turns about the raked sternpost; its gudgeons stay bolted to the hull.
    if (parts.rudder) parts.rudder.quaternion.setFromAxisAngle(rudderAxis, clamp(helm, -1, 1) * deg(S('motion_rudder_throw_deg')));

    // -------------------------------------------------------------------- the watch
    const swayAmp = deg(S('motion_crew_sway_deg'));
    const swayW = (Math.PI * 2) / S('motion_crew_sway_period');
    for (const c of parts.crew) {
      // A man stands upright in the world, not square to a deck that is heeled: what has
      // to be leaned is the ship's tilt, taken off him. His own heading has already been
      // applied, so the tilt is rotated into his frame before it is set — otherwise the
      // men facing aft lean uphill.
      const tiltX = c.home.x - pitch * 0.7 + Math.sin(time * swayW * 0.7 + c.phase) * swayAmp * 0.5;
      const tiltZ = -heel * 0.85 + Math.sin(time * swayW + c.phase) * swayAmp;
      const cy = Math.cos(c.home.y), sy = Math.sin(c.home.y);
      c.node.rotation.x = tiltX * cy - tiltZ * sy;
      c.node.rotation.z = tiltX * sy + tiltZ * cy;
      if (c.node.userData.crew?.authored) {
        c.node.rotation.x = clamp(c.node.rotation.x, -.16, .16);
        c.node.rotation.z = clamp(c.node.rotation.z, -.20, .20);
        if (c.head) {
          c.head.rotation.y = .055 * Math.sin(time * .29 + c.phase);
          c.head.rotation.x = .018 * Math.sin(time * 1.25 + c.phase);
        }
        const period=4.1+(c.phase*1.7)%3.2;
        const blinkTime=(time+c.phase*1.83)%period;
        const blink=blinkTime<.17 ? Math.sin(blinkTime/.17*Math.PI) : 0;
        for(const lid of c.lids) {
          lid.visible=blink>.005;
          lid.scale.y=Math.max(.001,blink);
          lid.position.y=(lid.userData.restY ?? .108415)+.007*(1-blink);
        }
        for(const eye of c.eyes) {
          eye.rotation.y=.055*Math.sin(time*.43+c.phase);
          eye.rotation.x=.018*Math.sin(time*.31+c.phase*2);
        }
      }

      if (c.role === 'aloft') {
        // A topman goes where the mast goes: he is standing on the thing that is
        // swinging, forty metres up.
        c.node.position.set(
          c.home.position.x + whip.x * c.f,
          c.home.position.y,
          c.home.position.z + whip.z * c.f
        );
      }
      if (c.pose === 'haul') {
        // The one thing anybody on deck is actually *doing*. A man posed as though he
        // were hauling and never moving is a statue of a man hauling; the pull is what
        // makes him a man. They are out of phase with each other by design — hands on a
        // fall work to a call, but not one of them is exactly with the next.
        const pull = Math.sin(time * (Math.PI * 2) / S('motion_haul_period') + c.phase);
        const swing = deg(S('motion_haul_swing_deg')) * pull;
        for (const [i, a] of c.arms.entries()) a.rotation.x = c.armHome[i].x - swing;
        // And his weight goes back with his arms.
        c.node.rotation.x += swing * 0.35;
      }
      if (c.role === 'helm') {
        if (c.node.userData.crew?.authored) {
          // The wheel supports a helmsman's upper body. Most balancing happens
          // through bent knees; a full free-standing lean would pull him off it.
          c.node.rotation.x *= .28;
          c.node.rotation.z *= .28;
          holdWheel(c.node, parts.wheel, time, helm);
          continue;
        }
        // His hands go round with the spokes; his feet do not.
        const reach = -helm * deg(S('motion_helmsman_reach_deg'));
        for (const [i, a] of c.arms.entries()) {
          a.rotation.x = c.armHome[i].x;
          a.rotation.z = c.armHome[i].z + reach;
        }
      }
    }
  }

  function dispose() {
    parts.sheeting.dispose();
    for (const m of patched) m.dispose();
  }

  parts.patchedCount = patched.length;
  parts.cloth = [...clothDrivers.values()];
  return { update, uniforms, parts, dispose };
}
