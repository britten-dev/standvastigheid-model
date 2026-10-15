// The post-processing stack. What turns a render into a frame.
//
// `renderer.render()` on its own gives back exactly the light the scene rig produces,
// with nothing done to it afterward — and nothing is done to a real photograph either:
// a lens bends light before the sensor sees it, the sensor's own response is not linear,
// and whatever processed the file after that added a curve, a grain and a vignette of its
// own before anyone looked at it. A render with none of that is not a neutral picture, it
// is a picture missing the several things every photograph has, and it reads as computer
// output for exactly that reason. This file is the several things.
//
// ## Where it sits in the pipeline, and the trap in getting that wrong
//
// EffectComposer's RenderPass draws the scene into an offscreen render target rather
// than the screen, and three only turns on a material's tone mapping and colour-space
// encoding when the thing being drawn to is the screen itself (see
// WebGLPrograms.js / WebGLRenderer.js, both of which gate `toneMapping` and
// `outputColorSpace` behind `currentRenderTarget === null`). So every pass in this file
// up to and including the grade works on the scene's own linear light, completely
// unencoded and completely untonemapped — bloom sees the same HDR values the renderer
// would have, the grade's lift/gamma/gain move real scene brightness and not a curve
// that has already been bent once, and nothing here has to know or care what
// `renderer.outputColorSpace` is set to.
//
// `OutputPass` is what turns that linear light into the picture: it reads
// `renderer.toneMapping`, `renderer.toneMappingExposure` and `renderer.outputColorSpace`
// off the renderer and applies the ACES curve and the sRGB transfer function once, in
// that order, and it must be the *last* pass in the chain. Doing tone mapping or sRGB
// encoding anywhere else in this file — on the renderer as well as here, or in the grade
// pass instead of here — is exactly how this task is most likely to go wrong: apply the
// ACES curve twice and the picture crushes and desaturates in the highlights; encode to
// sRGB twice and it looks pale and grey in exactly the way an over-brightened photograph
// does. So `render.html` and `index.html` keep `renderer.toneMapping`,
// `toneMappingExposure` and `outputColorSpace` set exactly as before, on the renderer,
// and nothing downstream of `OutputPass` touches colour again.
//
// ## Anti-aliasing: SMAA replaces MSAA rather than joining it
//
// The renderer is still constructed with a WebGL context that could ask for MSAA, but
// once a composer is in the chain that request has nothing left to do. The only draw
// call that ever lands on the screen's own default framebuffer is `OutputPass`'s single
// full-screen triangle, which has no internal edge to smooth; every edge that needs
// antialiasing — the standing rigging, a yard's silhouette against the sky — was
// rasterised into the composer's own offscreen buffer well before that, where MSAA was
// never asked for. Context antialiasing in this pipeline is therefore not redundant with
// SMAA, it is inert: it would only reserve a multisampled default framebuffer that
// nothing ever draws into with more than one sample. `SMAAPass` is what actually does the
// smoothing now, so `antialias: true` is dropped from both `render.html` and
// `index.html`'s renderer constructors.
//
// ## Bloom, the grade and grain: why they are one pass and not three
//
// `UnrealBloomPass` has to be its own pass — it needs several blurred mip levels of the
// bright-pass image, which nothing else here does. But the grade, the vignette, the film
// grain and the chromatic aberration are all a single read of one pixel and a small
// amount of arithmetic on it, and folding all four into one `ShaderPass` costs one texture
// fetch and one fragment invocation instead of four, which matters more here than it
// looks: this runs at the interactive viewer's frame rate, not just for the verification
// renders.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BLOOM, GRAIN, CHROMATIC_ABERRATION, GRADE } from './grade.js';

// ---------------------------------------------------------------------------------------
// Keeping the sky's hand-written colour looking the way it was tuned to look, now that a
// composer sits between it and the screen.
//
// scene.js's sky backdrop is not built from three's standard material library, it is a
// bare `THREE.ShaderMaterial` with a fragment shader written from nothing — which means it
// never had `#include <tonemapping_fragment>` or `#include <colorspace_fragment>` in it,
// because those only exist in the shader chunks three's own materials are assembled from.
// That was invisible before this file existed, because rendering went straight from
// `renderer.render()` to the canvas: the sky wrote a colour it had already been tuned by
// eye to look right, and nothing touched that colour again before it reached the screen.
// `top`/`bottom` in scene.js are `THREE.Color`s built from an sRGB hex, and three converts
// those to the linear working colour space on construction — so the number the old direct
// render put on screen was, numerically, that already-converted linear value, displayed
// with no further transform. It looked right because it was calibrated against exactly
// that omission, most importantly for the studio rig, whose backdrop was tuned by eye
// against the reference photograph.
//
// A composer changes what happens after that colour leaves the sky's shader. RenderPass
// draws it into an offscreen buffer, where three does not apply tone mapping or colour
// space encoding to *any* material (see the header of this file) — so the sky's raw
// output lands there completely unchanged from before. But OutputPass then reads that
// whole buffer and applies the ACES curve and the sRGB transfer function to it once, with
// no way to know that this one mesh's colour was already finished and had never expected
// to be run through either. Left alone, the backdrop comes out visibly paler than the one
// the ship's paint was matched against — which is exactly the studio comparison the brief
// says must not be disturbed.
//
// The fix is not a second grade laid over the symptom, it is the exact inverse of the
// transform that is now being applied once, so that after OutputPass has run, the pixel
// that reaches the screen is numerically the same one the old direct render produced. That
// requires inverting three's actual ACESFilmicToneMapping — a matrix, a per-channel
// rational curve fit, and a second matrix — which is why this is more code than "divide by
// the exposure": the rational fit does not invert with the exposure or the matrices
// factored out, so all three steps have to be undone in the right order. The two matrices
// invert exactly; the rational fit inverts by solving the quadratic it comes from and
// keeping the root that agrees with the forward curve (checked numerically while this was
// written — the other root is negative across the whole range that matters here).
//
// This is applied to every rig's sky, not only the studio one, so that the sea and storm
// backdrops keep matching whatever they were tuned to look like as well, and so that there
// is exactly one place in this codebase that knows the sky material needs this rather than
// three separate call sites quietly relying on the same assumption.
const ACES_INPUT_MAT = [
  [0.59719, 0.35458, 0.04823],
  [0.07600, 0.90834, 0.01566],
  [0.02840, 0.13383, 0.83777],
];
// Three.js writes this matrix as `mat3(colA, colB, colC)` — three column vectors, not
// three rows — and `ACES_INPUT_MAT` above is already transposed accordingly. This one is
// the transpose of the three vec3 literals as they appear in the GLSL source, not a copy
// of them: read down each of the three vec3 arguments to get a row here, not across one.
// Getting this backwards was caught by testing a known grey input against three's real,
// compiled GLSL — a grey ACES-space value has to come out grey (a colour pipeline that
// tints neutral grey is broken by definition), and a transposed matrix here was the one
// that didn't.
const ACES_OUTPUT_MAT = [
  [1.60475, -0.53108, -0.07367],
  [-0.10208, 1.10813, -0.00605],
  [-0.00327, -0.07276, 1.07602],
];

function invert3x3(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const D = -(b * i - c * h), E = a * i - c * g, F = -(a * h - b * g);
  const G = b * f - c * e, H = -(a * f - c * d), I = a * e - b * d;
  const det = a * A + b * B + c * C;
  return [
    [A / det, D / det, G / det],
    [B / det, E / det, H / det],
    [C / det, F / det, I / det],
  ];
}

function mulMatVec(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

const ACES_INPUT_INVERSE = invert3x3(ACES_INPUT_MAT);
const ACES_OUTPUT_INVERSE = invert3x3(ACES_OUTPUT_MAT);

/** three's own sRGB electro-optical transfer function, inverted, in plain JS. */
function srgbDecode(x) {
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

/**
 * The inverse of `RRTAndODTFit`, the middle step of three's ACESFilmicToneMapping — a
 * rational curve, not a matrix, so it has to be undone by solving the quadratic it
 * reduces to rather than by an algebraic rearrangement. Both roots are computed; the
 * second is the one that agrees with the forward curve everywhere the sky's colours
 * actually live, which was checked by comparing this function against the forward one
 * over the working range while this file was written, not assumed.
 */
function invertRrtOdtFit(y) {
  const a = 0.983729 * y - 1;
  const b = 0.432951 * y - 0.0245786;
  const c = 0.238081 * y + 0.000090537;
  const root = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  return root;
}

/**
 * Given a colour the old direct render used to put on screen unchanged, find the colour
 * that — once it has gone through exposure, the ACES curve and the sRGB transfer function
 * exactly once, as OutputPass now does to everything — reproduces that same screen pixel.
 */
function invertDisplayPipeline([r, g, bl], exposure) {
  const target = [srgbDecode(r), srgbDecode(g), srgbDecode(bl)];
  const y = mulMatVec(ACES_OUTPUT_INVERSE, target);
  const x = y.map(invertRrtOdtFit);
  const preExposure = mulMatVec(ACES_INPUT_INVERSE, x);
  return preExposure.map((v) => v / (exposure / 0.6));
}

/**
 * Walk a rig's scene once and correct every bare `THREE.ShaderMaterial`'s colour uniforms
 * in place, so the composer's single, correct pass of tone mapping and colour space
 * encoding reproduces what a direct `renderer.render()` used to put on screen for them.
 * Standard materials (`MeshStandardMaterial`, including the sea's, which only patches one
 * via `onBeforeCompile` and keeps its type) are untouched — they already carry three's own
 * `#include`s and were already correct before this file existed.
 *
 * Idempotent, because both `render.html` and `index.html` keep a handful of `THREE.Scene`s
 * alive for the whole page and hand the same one back to `setScene` more than once — the
 * inverse above is only correct to apply to the *original* colour once, and applying it a
 * second time to its own output would not undo anything, it would compound the error.
 */
function preserveRawShaderColours(scene, exposure) {
  scene.traverse((o) => {
    const mat = o.material;
    if (!mat || mat.type !== 'ShaderMaterial' || mat.userData.rawColourPreserved) return;
    mat.userData.rawColourPreserved = true;
    for (const uniform of Object.values(mat.uniforms ?? {})) {
      if (!uniform.value?.isColor) continue;
      const [nr, ng, nb] = invertDisplayPipeline([uniform.value.r, uniform.value.g, uniform.value.b], exposure);
      uniform.value.setRGB(nr, ng, nb, THREE.LinearSRGBColorSpace);
    }
  });
}

/**
 * The combined grade/vignette/grain/chromatic-aberration shader.
 *
 * Everything here reads `tDiffuse` once, at a UV that chromatic aberration has already
 * bent, and does the rest as plain arithmetic on the one sample — see the file header for
 * why this is one pass rather than several.
 */
const GradeShader = {
  name: 'GradeShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uLift: { value: new THREE.Vector3(0, 0, 0) },
    uGamma: { value: 1.0 },
    uGain: { value: new THREE.Vector3(1, 1, 1) },
    uSaturation: { value: 1.0 },
    uVignetteStrength: { value: 0.0 },
    uVignetteRadius: { value: 0.6 },
    uVignetteSoftness: { value: 0.6 },
    uGrainAmount: { value: GRAIN.amount.value },
    uGrainSize: { value: GRAIN.size.value },
    uCAAmount: { value: CHROMATIC_ABERRATION.amount.value },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec3 uLift;
    uniform float uGamma;
    uniform vec3 uGain;
    uniform float uSaturation;
    uniform float uVignetteStrength;
    uniform float uVignetteRadius;
    uniform float uVignetteSoftness;
    uniform float uGrainAmount;
    uniform float uGrainSize;
    uniform float uCAAmount;
    varying vec2 vUv;

    // A cheap decorrelated hash rather than a texture lookup, because grain has to be a
    // different pattern every frame or it stops reading as noise and starts reading as a
    // dirty sensor — a fixed grain texture sampled the same way each frame is exactly
    // that fault.
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      // Distance from the frame's centre, corrected for aspect so the vignette and the
      // aberration are round on screen rather than stretched to the shape of the canvas —
      // this render harness shoots 4:3, and an uncorrected vignette on a 4:3 frame is
      // visibly an oval, not a circle.
      vec2 uv = vUv - 0.5;
      uv.x *= uResolution.x / max(uResolution.y, 1.0);
      float dist = length(uv);

      // Chromatic aberration: each channel is sampled at a UV nudged outward along the
      // same radius, growing with the square of the distance from the centre, so the
      // middle of the frame samples all three channels from the same point and only the
      // corners see any colour fringing at all.
      vec2 caOffset = uv * (uCAAmount * dist);
      float r = texture2D(tDiffuse, vUv - caOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + caOffset).b;
      vec3 color = vec3(r, g, b);

      // Lift, gamma, gain — see grade.js for what each rig's numbers are and why. The
      // lift term is clamped to zero before the gamma power is taken: a negative lift on
      // a very dark pixel can push the sum below zero, and raising a negative number to
      // a fractional power is undefined, which without the clamp shows up as random black
      // or white flecks in the darkest shadows rather than as a crushed black.
      color = max(color + uLift * (1.0 - color), 0.0);
      color = pow(color, vec3(1.0 / uGamma));
      color *= uGain;

      // Saturation, as a mix toward the pixel's own luminance — the ordinary way to do
      // it, and ordinary is right here: anything more elaborate would be a colour
      // decision this file is not the place to make.
      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(luma), color, uSaturation);

      // Vignette: a smooth falloff from uVignetteRadius out to
      // uVignetteRadius + uVignetteSoftness, multiplicative so it darkens rather than
      // fogging the corners the way a flat colour mix would.
      float vig = smoothstep(uVignetteRadius, uVignetteRadius + uVignetteSoftness, dist);
      color *= 1.0 - vig * uVignetteStrength;

      // Grain: one hash per output pixel, reseeded every frame by uTime, added as a
      // small zero-mean offset in linear light. Doing it here rather than after the ACES
      // curve is what makes it fall away in the highlights and stay visible in the
      // shadows the way grain on real film does, instead of sitting on the image at one
      // even strength regardless of what is under it.
      vec2 grainCell = floor(gl_FragCoord.xy / max(uGrainSize, 1.0));
      float n = hash(grainCell + vec2(uTime * 37.0, uTime * 57.0)) - 0.5;
      color += n * uGrainAmount;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

/**
 * Build the composer for one renderer, one starting scene and camera, and one rig's
 * grade. Both `render.html` and `index.html` call this once and keep the returned handle
 * for the life of the page — the composer owns render targets sized to the canvas, and
 * building a second one per frame would leak them.
 */
export function createPostStack(renderer, scene, camera, { rig = 'sea' } = {}) {
  const size = renderer.getSize(new THREE.Vector2());
  let curWidth = size.x;
  let curHeight = size.y;

  const composer = new EffectComposer(renderer);

  preserveRawShaderColours(scene, renderer.toneMappingExposure);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    BLOOM.strength.value,
    BLOOM.radius.value,
    BLOOM.threshold.value
  );
  composer.addPass(bloomPass);

  // SMAA operates on the composer's own linear buffer and has to run before OutputPass
  // encodes it — see the file header. It takes over the antialiasing job MSAA can no
  // longer do once rendering goes through a composer.
  const smaaPass = new SMAAPass();
  composer.addPass(smaaPass);

  const gradePass = new ShaderPass(GradeShader);
  composer.addPass(gradePass);

  // Tone mapping and colour space, once, last. See the file header for why this has to
  // be the final pass and nothing downstream of it may touch colour again.
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  let grainClock = 0;
  let currentRig = null;

  /**
   * Push one rig's numbers from grade.js onto the grade pass. Called once at setup and
   * again whenever the caller switches between the studio, sea and storm rigs — the
   * uniforms are cheap to write, so there is no reason to rebuild the pass instead.
   */
  function setRig(name) {
    if (name === currentRig) return;
    currentRig = name;
    const cfg = GRADE[name] ?? GRADE.sea;
    const u = gradePass.uniforms;
    u.uLift.value.set(...cfg.lift.value);
    u.uGamma.value = cfg.gamma.value;
    u.uGain.value.set(...cfg.gain.value);
    u.uSaturation.value = cfg.saturation.value;
    u.uVignetteStrength.value = cfg.vignetteStrength.value;
    u.uVignetteRadius.value = cfg.vignetteRadius.value;
    u.uVignetteSoftness.value = cfg.vignetteSoftness.value;
  }
  setRig(rig);

  /**
   * Swap which scene and camera the composer renders, in place, rather than building a
   * new composer. `render.html` keeps one environment per rig alive at once (see
   * `ensureEnv` there) and `index.html` keeps a fine-weather and a storm scene alive
   * together, and in both cases the composer itself — its render targets, its bloom mip
   * chain, its SMAA edge buffers — has no reason to change size or exist twice just
   * because the scene being drawn into it did.
   */
  function setScene(newScene, newCamera = renderPass.camera) {
    preserveRawShaderColours(newScene, renderer.toneMappingExposure);
    renderPass.scene = newScene;
    renderPass.camera = newCamera;
  }

  /**
   * Resize every render target in the chain to match the renderer.
   *
   * This is the half of the composer that a resize handler forgets most often:
   * `EffectComposer.setSize` takes the same CSS-pixel width and height as
   * `renderer.setSize(w, h, false)`, not the device-pixel drawing-buffer size, and it
   * multiplies by whatever pixel ratio the composer itself was told about — which is why
   * `setPixelRatio` below has to be kept in step with the renderer's own, or the
   * composer keeps rendering at whatever ratio it was constructed with while the
   * renderer moves on to a new one, and every pass ends up reading and writing buffers
   * one size out of step with the canvas. The grade pass is told the real device-pixel
   * resolution as well, in `uResolution`, because its vignette has to stay a circle
   * whatever the aspect ratio of that resolution turns out to be.
   */
  function setSize(width, height) {
    curWidth = width;
    curHeight = height;
    composer.setSize(width, height);
    const px = renderer.getPixelRatio();
    gradePass.uniforms.uResolution.value.set(width * px, height * px);
  }

  function setPixelRatio(ratio) {
    composer.setPixelRatio(ratio);
    gradePass.uniforms.uResolution.value.set(curWidth * ratio, curHeight * ratio);
  }

  // The construction-time size, since `setSize` is only called again on a later resize.
  setSize(curWidth, curHeight);

  /**
   * Render one frame. `deltaTime` only has to be roughly right — it feeds the grain
   * pass's reseed and nothing that would show if a frame's delta were a little off — so
   * callers that only ever render one still frame at a time (`render.html`) can pass a
   * fixed step instead of tracking a clock.
   */
  function render(deltaTime = 1 / 60) {
    grainClock += deltaTime;
    gradePass.uniforms.uTime.value = grainClock;
    composer.render(deltaTime);
  }

  function dispose() {
    bloomPass.dispose();
    smaaPass.dispose();
    gradePass.dispose();
    outputPass.dispose();
    composer.renderTarget1.dispose();
    composer.renderTarget2.dispose();
  }

  return { composer, renderPass, bloomPass, smaaPass, gradePass, outputPass, setRig, setScene, setSize, setPixelRatio, render, dispose };
}
