// This painting's pipeline, assembled from kit modules (kit/runtime.js does the WebGL mechanics):
// ridge readback (mountain ridges to JS for the brush strokes) -> objects drawn -> scene (+ wetness map)
// -> kit diffusion pass ×36 -> paint (kit wash/ink/paper modules) -> per-frame water pass.
import { createRuntime } from '../kit/runtime.js';

const DIFFUSION_STEPS = 36;
const DESIGN_W = 1280;

// Ridge lines of every range, sampled every RIDGE_STEP design units: [{ y: Float32Array, h: Float32Array }]
const RIDGE_STEP = 2, RIDGE_SAMPLES = DESIGN_W / RIDGE_STEP + 1;
function readRidges(rt, prog, layers, masses) {
  const n = layers.length;
  const fb = rt.target([rt.texture(RIDGE_SAMPLES, n, { type: 'rgba32f' })]);
  rt.draw(prog, { to: fb, size: [RIDGE_SAMPLES, n], u: { uLayer: layers.flat(), uMass: masses.flat(), uStep: RIDGE_STEP } });
  const px = rt.read(fb, RIDGE_SAMPLES, n, { float: true });
  return Array.from({ length: n }, (_, li) => ({
    step: RIDGE_STEP,
    y: Float32Array.from({ length: RIDGE_SAMPLES }, (_, i) => px[(li * RIDGE_SAMPLES + i) * 4]),
    h: Float32Array.from({ length: RIDGE_SAMPLES }, (_, i) => px[(li * RIDGE_SAMPLES + i) * 4 + 1]),
  }));
}

// build(ridges) draws the object layers once the ridge lines are known and returns { wash, lines } canvases
export async function createPainting(canvas, { width, height, layers, masses, moon, water = true, build, reveal = false }) {
  const moonU = moon ? [moon.x, moon.y, moon.r] : [0, 0, 0];
  const rt = await createRuntime(canvas);
  // half-float targets keep the many small diffusion increments from being lost to 8-bit rounding
  const work = rt.float ? 'rgba16f' : 'rgba8';
  const [ridge, scene, diffuse, paint, fin] = await Promise.all(
    ['shaders/ridge.frag', 'shaders/scene.frag', '../kit/passes/diffuse.frag', 'shaders/paint.frag', 'shaders/final.frag'].map(rt.program));

  const ridges = rt.float ? readRidges(rt, ridge, layers, masses) : null;
  const built = build(ridges);
  const { wash: objects, lines } = built;

  canvas.width = width; canvas.height = height;
  const size = [width, height];
  // one pass of the whole material pipeline for one state of the painting (objects wash, ink lines)
  const render = (objCv, linesCv, bare = 0) => {
    const objTex = rt.fromCanvas(objCv), lineTex = rt.fromCanvas(linesCv);
    const sceneCol = rt.texture(width, height), sceneWet = rt.texture(width, height);   // [colour, wetness]
    rt.draw(scene, {
      to: rt.target([sceneCol, sceneWet]), size, tex: { uObjects: objTex },
      u: { uLayer: layers.flat(), uMass: masses.flat(), uMoon: moonU, uWaterOn: water ? 1 : 0, uBare: bare },
    });
    // ink creeping through wet paper, preferring the fibre direction
    const diffused = rt.pingpong(diffuse, sceneCol, DIFFUSION_STEPS, {
      size, type: work, tex: { uWet: sceneWet },
      u: { uStep: width / DESIGN_W * .8, uDesignW: DESIGN_W, uRate: .11, uFibreScale: .018, uCross: .2 },
    });
    const painted = rt.texture(width, height), paintFb = rt.target([painted]);
    rt.draw(paint, { to: paintFb, size, tex: { uLines: lineTex, uObjects: objTex, uDiffused: diffused, uWet: sceneWet } });
    return { tex: rt.mipmap(painted), fb: paintFb };
  };
  const full = render(objects, lines);
  if (new URLSearchParams(location.search).has('dump')) window.__painted = rt.read(full.fb, width, height);
  const painted = full.tex;
  // the reveal (kit/glsl/reveal.glsl): bare paper → washes bloom → ink strokes travel → title and seal last
  let blank = painted, washes = painted, timeI = painted;
  if (reveal) {
    const empty = document.createElement('canvas'); empty.width = objects.width; empty.height = objects.height;
    blank = render(empty, empty, 1).tex;
    washes = render(built.washesStage, empty).tex;
    timeI = rt.mipmap(rt.fromCanvas(built.timeI));
  }

  return (t, progress, fx) => rt.draw(fin, { size, tex: { uPaint: painted, uWashes: washes, uBlank: blank, uTimeI: timeI }, u: { uMoon: moonU, uWaterOn: water ? 1 : 0, uTime: t, uProgress: progress, uFx: fx } });
}
