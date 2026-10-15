// The lighting and environment shared by the interactive viewer and the render tool,
// so that what you inspect by hand is what the verification renders show.
//
// Two rigs, one target appearance. `studio` reproduces the warm backdrop and warm key of
// the reference photograph so that the reference render and the photograph can be laid
// side by side. The sea rig is where the ship will actually live, and it is tuned to land
// on the same appearance rather than on a physically blue one — the photograph's sunlit
// canvas samples #ddd6c4 and its shaded canvas #a89880, and the sea rig is set so that it
// does too. That is the whole point of this file. A blue sky fill and a blue environment
// turn flax canvas sage, oak grey, ochre paint cream and copper cold, and the ship stops
// reading as wood and cloth and starts reading as plastic.
//
// Every number here is a row in PAINT in the spec, where it carries its source.
import * as THREE from 'three';
import { PAINT } from '../src/spec/spec.js';

const col = (key) => new THREE.Color(PAINT[key].hex);
const num = (key) => PAINT[key].value;

/**
 * Put a light at an azimuth and elevation round the ship. Azimuth is measured the way
 * `viewer/views.js` measures a camera station — 0 dead ahead, 90 on the starboard beam,
 * 270 on the port beam — so a light and a camera can be talked about in the same terms.
 */
function place(object, azimuthDeg, elevationDeg, distance) {
  const a = (azimuthDeg * Math.PI) / 180;
  const e = (elevationDeg * Math.PI) / 180;
  object.position.set(
    Math.sin(a) * Math.cos(e) * distance,
    Math.sin(e) * distance,
    -Math.cos(a) * Math.cos(e) * distance
  );
}

/**
 * The sun, and its shadow.
 *
 * three's PCFSoftShadowMap ignores `shadow.radius`: the soft branch of its shader takes a
 * fixed bilinear tap pattern one texel wide, so however large a radius is asked for the
 * edge stays one texel wide and a shroud's shadow on the water comes out as a hard jagged
 * line. Softness therefore cannot be asked for — it has to be built, by giving the sun a
 * finite size the way the real one has. `shadow_taps` lights share the key's intensity
 * round a small ring, each casting its own shadow. Close to an occluder every tap agrees
 * and the shadow stays sharp; far from it they disagree and the edge opens into a
 * penumbra. So a gun's shadow on the deck stays crisp while the shadow of the sail plan
 * on the sea, thrown from forty metres up, goes soft.
 *
 * Returns the centre light, which is the one to move if you want to move the sun.
 */
function sunRig(scene, { azimuth, elevation, colour: colourIn, intensity }) {
  const taps = Math.max(1, Math.round(num('shadow_taps')));
  const spread = num('shadow_spread_deg');
  const size = num('shadow_map_size');
  const extent = num('shadow_extent');
  const distance = num('sun_distance');
  const colour = colourIn ?? col('sun_colour');
  const each = (intensity ?? num('sun_intensity')) / taps;

  let centre = null;
  for (let i = 0; i < taps; i++) {
    const light = new THREE.DirectionalLight(colour, each);
    // The ring is drawn on the sky, where a step in azimuth subtends less angle the
    // higher the sun stands; dividing by the cosine keeps the ring circular.
    const phi = (i / taps) * Math.PI * 2;
    const dAz = taps > 1 ? (Math.cos(phi) * spread) / Math.cos((elevation * Math.PI) / 180) : 0;
    const dEl = taps > 1 ? Math.sin(phi) * spread : 0;
    place(light, azimuth + dAz, elevation + dEl, distance);

    light.castShadow = true;
    light.shadow.mapSize.set(size, size);
    Object.assign(light.shadow.camera, {
      left: -extent, right: extent, top: extent, bottom: -extent,
      near: 1, far: distance * 2.4,
    });
    light.shadow.bias = num('shadow_bias');
    // Offsetting the sample along the surface normal is what kills the self-shadowing
    // acne on the sails and the topsides, and it does it without detaching a shadow from
    // the thing casting it the way a large depth bias does.
    light.shadow.normalBias = num('shadow_normal_bias');
    scene.add(light);
    if (i === 0) centre = light;
  }
  return centre;
}

/**
 * Three rigs now, and the third is a different problem from the other two.
 *
 * `studio` reproduces the reference photograph. `sea` is a fine day. `storm` is the
 * weather this ship is built for, and in it there is no sun: there is a sky, uniformly
 * bright and completely diffuse, and a sea under it that is nearly black. Everything the
 * other two rigs do with a key light has to be done here with fill — and the danger is
 * the opposite one. With no shadows and no direction a ship goes flat and reads as
 * cardboard. What saves her is that the sky is far brighter than the sea, so the light
 * is strongly top-down and every horizontal surface stands out against every vertical
 * one, which on a ship is most of the shapes there are.
 */
export function makeEnvironment(renderer, { studio = false, storm = false } = {}) {
  const scene = new THREE.Scene();
  const pick = (studioKey, seaKey, stormKey) => (storm ? stormKey : studio ? studioKey : seaKey);

  // A gradient sky. The reference photo is shot against a warm studio backdrop, so the
  // `studio` variant reproduces that for side-by-side comparison; the sea variant is
  // what the model will actually live in. This is only the backdrop — what lights the
  // ship is the rig below, not the sky mesh.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        top: { value: storm ? col('storm_sky_top') : new THREE.Color(studio ? 0xd8b98a : 0x7ba4cc) },
        bottom: { value: storm ? col('storm_sky_bottom') : new THREE.Color(studio ? 0xe8d3ad : 0xcdd9e2) },
        cloud: { value: storm ? num('storm_cloud_break') : 0 },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 top; uniform vec3 bottom; uniform float cloud; varying vec3 vP;
        // Value noise, three octaves. Enough for cloud and no more: this is a backdrop.
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                     mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
        }
        void main(){
          float h = clamp(vP.y / 400.0 * 0.5 + 0.5, 0.0, 1.0);
          vec3 c = mix(bottom, top, pow(h, 0.8));
          // A gale sky is not a gradient. It is torn cloud in bands lying with the wind,
          // and without some structure in it the horizon reads as a paper backdrop —
          // which on a still render is the first thing the eye finds fault with.
          if (cloud > 0.0) {
            vec2 q = vec2(atan(vP.z, vP.x) * 2.6, h * 7.0);
            float n = noise(q) * 0.55 + noise(q * 2.7) * 0.3 + noise(q * 6.1) * 0.15;
            // Torn, not fluffy: the contrast is pushed so the edges are ragged.
            n = smoothstep(0.32, 0.78, n);
            c = mix(c, c * 0.72, n * cloud * (0.35 + 0.65 * h));
          }
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  );
  scene.add(sky);

  const sun = sunRig(scene, {
    azimuth: num(pick('studio_sun_azimuth_deg', 'sea_sun_azimuth_deg', 'storm_sun_azimuth_deg')),
    elevation: num(pick('studio_sun_elevation_deg', 'sea_sun_elevation_deg', 'storm_sun_elevation_deg')),
    colour: storm ? col('storm_sun_colour') : col('sun_colour'),
    intensity: storm ? num('storm_sun_intensity') : num('sun_intensity'),
  });

  // Fill from the sky and bounce from below, which is what stops the black topsides
  // reading as a silhouette. Weak, and warm at the top: the part of a sunny sky a ship's
  // side actually sees is the haze near the horizon, not the blue of the zenith.
  scene.add(new THREE.HemisphereLight(
    col(pick('studio_sky_colour', 'sea_sky_colour', 'storm_sky_colour')),
    col(pick('studio_floor_colour', 'sea_water_colour', 'storm_water_colour')),
    num(pick('studio_fill_intensity', 'sea_fill_intensity', 'storm_fill_intensity'))
  ));

  // One cool edge from the opposite quarter, to lift the black topsides off a dark sea.
  // This is the only blue left in the sea rig, and it lands on the side away from the sun
  // where blue is what the eye expects to see.
  // In the storm rig there is no clear sky anywhere to be a cool edge, so the rim is
  // taken out rather than left to invent a blue that is not there.
  const rim = new THREE.DirectionalLight(col('rim_colour'), storm ? 0 : num('rim_intensity'));
  place(rim, num('rim_azimuth_deg'), num('rim_elevation_deg'), num('sun_distance'));
  scene.add(rim);

  // What the metals reflect. The copper sheathing has no diffuse colour at all — it is
  // metal, so everything seen of it is this environment tinted copper — which is why a
  // blue environment makes the bottom of the ship read cold, and why the bright card in
  // it matters: it is the highlight the sheets catch.
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(
    (() => {
      const e = new THREE.Scene();
      e.add(new THREE.Mesh(
        new THREE.SphereGeometry(100, 16, 8),
        new THREE.MeshBasicMaterial({
          color: col(pick('studio_env_colour', 'sea_env_colour', 'storm_env_colour')),
          side: THREE.BackSide,
        })
      ));
      // The bright card the metals catch. In the storm rig it is the whole sky that is
      // bright and there is no disc in it, so the card is spread and dimmed rather than
      // removed: copper with nothing at all to reflect goes black.
      const extent = num('env_sun_extent') * (storm ? 2.2 : 1);
      const disc = new THREE.Mesh(
        new THREE.PlaneGeometry(extent, extent),
        new THREE.MeshBasicMaterial({ color: storm ? col('storm_sky_bottom') : col('env_sun_colour') })
      );
      place(disc, num(pick('studio_sun_azimuth_deg', 'sea_sun_azimuth_deg', 'storm_sun_azimuth_deg')),
        num('env_sun_elevation_deg'), 55);
      disc.lookAt(0, 0, 0);
      e.add(disc);
      return e;
    })(),
    0.04
  ).texture;

  return { scene, sun };
}

/**
 * The sea in a gale — viewer scenery, not part of the ship.
 *
 * It is here because of what a flat plane does to her. A frigate sitting in a mirror is
 * a frigate in a bath: her waterline is a perfect straight line, nothing breaks against
 * her, and the eye reads the whole scene as an object on a surface rather than a ship in
 * water. Three crossed swells and a wind streak of spume are enough to break all three of
 * those, and it costs one shader.
 *
 * A host game has its own ocean and should use it; `surpriseSea` exists so that this
 * repository's own renders show her where she belongs.
 */
export function makeStormSea() {
  const size = 1400;
  const geo = new THREE.PlaneGeometry(size, size, 320, 320);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: col('storm_sea_colour'),
    roughness: num('storm_sea_roughness'),
    metalness: 0,
    envMapIntensity: num('storm_sea_env_intensity'),
  });
  const uniforms = {
    uTime: { value: 0 },
    uHeight: { value: num('storm_wave_height') },
    uLength: { value: num('storm_wave_length') },
    uPeriod: { value: num('storm_wave_period') },
    uSpume: { value: num('storm_spume_alpha') },
    // Where the ship is, so the water can be disturbed by her. Set through
    // `sea.userData.followShip(ship)` each frame; until it is, the radius is zero and
    // there is no wake at all.
    uShipPos: { value: new THREE.Vector2() },
    uShipFwd: { value: new THREE.Vector2(0, -1) },
    uShipSize: { value: new THREE.Vector2(0, 0) },
    uWake: { value: num('storm_wake_alpha') },
  };
  mat.customProgramCacheKey = () => 'storm-sea';
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime; uniform float uHeight; uniform float uLength; uniform float uPeriod;
        varying float vCrest;
        varying vec2 vSeaPos;
        // Three swells crossing: a long one running with the wind, and two shorter ones
        // at an angle to it. One alone is corduroy; three is a sea.
        float swell(vec2 p, vec2 dir, float len, float amp, float t) {
          return amp * sin(dot(p, dir) * 6.28318 / len + t * 6.28318 / uPeriod);
        }
      `)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec2 p = transformed.xz;
        float h = swell(p, normalize(vec2(0.2, 1.0)), uLength, uHeight * 0.5, uTime)
                + swell(p, normalize(vec2(0.9, 0.5)), uLength * 0.42, uHeight * 0.26, uTime * 1.31)
                + swell(p, normalize(vec2(-0.6, 0.8)), uLength * 0.19, uHeight * 0.13, uTime * 1.77);
        transformed.y += h;
        vCrest = clamp(h / max(0.001, uHeight * 0.55), -1.0, 1.0);
        vSeaPos = p;
        // The normal follows, taken from the slope of the same three swells, or the sea
        // is a moving surface lit as though it were flat.
        float e = 1.5;
        float hx = swell(p + vec2(e, 0.0), normalize(vec2(0.2, 1.0)), uLength, uHeight * 0.5, uTime)
                 + swell(p + vec2(e, 0.0), normalize(vec2(0.9, 0.5)), uLength * 0.42, uHeight * 0.26, uTime * 1.31)
                 + swell(p + vec2(e, 0.0), normalize(vec2(-0.6, 0.8)), uLength * 0.19, uHeight * 0.13, uTime * 1.77);
        float hz = swell(p + vec2(0.0, e), normalize(vec2(0.2, 1.0)), uLength, uHeight * 0.5, uTime)
                 + swell(p + vec2(0.0, e), normalize(vec2(0.9, 0.5)), uLength * 0.42, uHeight * 0.26, uTime * 1.31)
                 + swell(p + vec2(0.0, e), normalize(vec2(-0.6, 0.8)), uLength * 0.19, uHeight * 0.13, uTime * 1.77);
        vNormal = normalize(normalMatrix * normalize(vec3(-(hx - h) / e, 1.0, -(hz - h) / e)));
      `);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uSpume; varying float vCrest; varying vec2 vSeaPos;
        uniform vec2 uShipPos; uniform vec2 uShipFwd; uniform vec2 uShipSize; uniform float uWake;
      `)
      .replace('#include <color_fragment>', `#include <color_fragment>
        // Spume: the white the wind tears off the crests and lays in long streaks to
        // leeward. Thin and broken, and only on the crests. Spread wide and smooth it
        // stops being spume and becomes pack ice, which is what a low threshold and a
        // slow streak function give.
        float streak = pow(0.5 + 0.5 * sin(vSeaPos.x * 2.7 + vSeaPos.y * 0.35), 3.0)
                     * pow(0.5 + 0.5 * sin(vSeaPos.x * 0.61 - vSeaPos.y * 0.08 + 1.7), 2.0);
        float foam = smoothstep(0.72, 1.0, vCrest) * uSpume * streak;

        // What the ship does to the water she is in.
        //
        // This is the last thing that separates a ship at sea from a model standing on
        // one. Everything else can be right — the hull, the light, the sea itself — and
        // if her waterline is a clean line with nothing happening along it, the eye
        // reads the whole picture as an object placed on a surface. She needs a collar
        // of broken water round her and a wake behind her, and it does not have to be a
        // simulation: it has to be there.
        if (uShipSize.x > 0.0) {
          vec2 d = vSeaPos - uShipPos;
          float along = dot(d, uShipFwd);                       // ahead is positive
          float abeam = dot(d, vec2(-uShipFwd.y, uShipFwd.x));
          // The hull as an ellipse, and the broken water in a band just outside it.
          float e = length(vec2(along / uShipSize.x, abeam / uShipSize.y));
          foam += smoothstep(1.30, 1.02, e) * smoothstep(0.94, 1.02, e) * uWake;
          // The wake astern: widening, fading, and brightest along its two edges, where
          // the quarter waves run out from her.
          float back = -along / uShipSize.x;
          if (back > 0.0) {
            // Two quarter waves running out from her, and a thin disturbed lane between
            // them. The lane is the weaker of the two by a long way: a wake seen from
            // above is mostly two lines and not a white river.
            float spread = uShipSize.y * (1.0 + back * 0.75);
            float edge = (abs(abeam) - spread * 0.8) / (uShipSize.y * 0.28);
            foam += exp(-back * 0.9) * exp(-edge * edge) * uWake;
            foam += exp(-back * 1.5) * smoothstep(spread, spread * 0.25, abs(abeam)) * uWake * 0.22;
          }
        }
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.74, 0.77, 0.77), clamp(foam, 0.0, 0.95));
      `);
  };
  const sea = new THREE.Mesh(geo, mat);
  sea.name = 'sea';
  sea.receiveShadow = true;
  sea.userData.uniforms = uniforms;
  /**
   * Tell the water where the ship is, so that she can break it. Call it each frame after
   * the ship has been moved; it takes her size from her own bounding box, so a different
   * ship needs no numbers changed here.
   */
  sea.userData.followShip = (ship) => {
    const box = new THREE.Box3().setFromObject(ship);
    uniforms.uShipPos.value.set(ship.position.x, ship.position.z);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.getWorldQuaternion(new THREE.Quaternion()));
    uniforms.uShipFwd.value.set(fwd.x, fwd.z).normalize();
    // Her waterline, near enough: the hull's own extent, not the rig's, which is what
    // the bounding box of the whole ship would give.
    const hull = ship.getObjectByName('hull');
    const hb = hull ? new THREE.Box3().setFromObject(hull) : box;
    uniforms.uShipSize.value.set((hb.max.z - hb.min.z) / 2, (hb.max.x - hb.min.x) / 2);
  };

  /** The height of the sea at a point, so the ship can be floated on it. */
  sea.userData.heightAt = (x, z, t) => {
    const swell = (dx, dz, len, amp, tt) =>
      amp * Math.sin((x * dx + z * dz) * (Math.PI * 2) / len + (tt * Math.PI * 2) / uniforms.uPeriod.value);
    const n1 = 1 / Math.hypot(0.2, 1.0), n2 = 1 / Math.hypot(0.9, 0.5), n3 = 1 / Math.hypot(-0.6, 0.8);
    const H = uniforms.uHeight.value, L = uniforms.uLength.value;
    return swell(0.2 * n1, 1.0 * n1, L, H * 0.5, t)
      + swell(0.9 * n2, 0.5 * n2, L * 0.42, H * 0.26, t * 1.31)
      + swell(-0.6 * n3, 0.8 * n3, L * 0.19, H * 0.13, t * 1.77);
  };
  return sea;
}

export function makeSea() {
  // The water is deliberately held back from the environment. The environment had to be
  // warmed for the ship's sake — copper and gilt see nothing else — and a mirror-smooth
  // sea at full environment strength answers that by turning the sun's path across it
  // into a wall of white.
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200, 1, 1),
    new THREE.MeshStandardMaterial({
      color: col('sea_surface_colour'),
      roughness: num('sea_surface_roughness'),
      metalness: 0.0,
      envMapIntensity: num('sea_surface_env_intensity'),
    })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.receiveShadow = true;
  return sea;
}
