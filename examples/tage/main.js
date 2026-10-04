// 踏歌 — after Ma Yuan. Marks painted once into four canvases; the kit runtime runs the scene field (silk +
// mist), the diffusion pass, the paint pass and a per-frame pass where only the mist drifts.
// ?mode=notan renders only the masses as flat tones (the composition gate); ?s=2 renders sharper for zoom checks.
import { createRuntime } from '../../kit/runtime.js';
import { recordInkTimes } from '../../kit/brush/inktime.js';
import { makeLayers, DW, DH } from './scene/layers.js';
import { paintScene, paintStudy } from './scene/painting.js';

async function start() {
  const q = new URLSearchParams(location.search);
  const notan = q.get('mode') === 'notan';
  const fitted = Math.min(innerWidth / DW, innerHeight / DH) * (window.devicePixelRatio || 1);
  const S = Math.min(3, Math.max(1, Number(q.get('s')) || fitted));
  const canvas = document.getElementById('gl');
  canvas.width = Math.round(DW * S); canvas.height = Math.round(DH * S);
  await document.fonts.load('25px "Ma Shan Zheng"', '宿雨清畿甸朝阳丽帝城丰年人乐业垅上踏歌行马远').catch(() => []);
  const c = makeLayers(S);
  // the reveal (painting appearing on blank paper, then the mist starts to drift): ?still skips it, ?t=3 freezes it
  const still = q.has('still') || notan || q.get('study');
  const timeCv = still ? null : recordInkTimes(c.l, c.canvases.ink.width, c.canvases.ink.height, { seed: 31337, dur: .22 });
  if (q.get('study') === 'rock') paintStudy(c); else paintScene(c, notan);

  const rt = await createRuntime(canvas, { preserveDrawingBuffer: true });
  if (!rt.float) throw new Error('EXT_color_buffer_float is not available');
  const size = [canvas.width, canvas.height];
  const [scene, diffuse, paint, fin] = await Promise.all(
    ['shaders/scene.frag', '../../kit/passes/diffuse.frag', 'shaders/paint.frag', 'shaders/final.frag'].map(rt.program));
  const T = c.canvases, depth = rt.fromCanvas(T.depth);
  // one pass of the whole material pipeline for one state of the painting (wash, wetness, ink canvases)
  const render = (washCv, wetCv, inkCv) => {
    const tw = rt.fromCanvas(washCv), twet = rt.fromCanvas(wetCv), ti = rt.fromCanvas(inkCv);
    const col = rt.texture(...size, { type: 'rgba16f' }), wet = rt.texture(...size, { type: 'rgba16f' });
    rt.draw(scene, { to: rt.target([col, wet]), size, tex: { uWash: tw, uWetC: twet, uDepth: depth } });
    // silk is sized: ink spreads less and more evenly than on raw xuan
    const diffused = rt.pingpong(diffuse, col, 22, {
      size, type: 'rgba16f', tex: { uWet: wet },
      u: { uStep: S * .8, uDesignW: DW, uRate: .09, uFibreScale: .02, uCross: .4 },
    });
    const painted = rt.texture(...size);
    rt.draw(paint, { to: rt.target([painted]), size, tex: { uDiffused: diffused, uWet: wet, uLines: notan ? rt.fromCanvas(document.createElement('canvas')) : ti, uDepth: depth } });
    return rt.mipmap(painted);
  };
  const blankCv = (fill) => { const cv = document.createElement('canvas'); cv.width = T.wash.width; cv.height = T.wash.height; if (fill) { const g = cv.getContext('2d'); g.fillStyle = fill; g.fillRect(0, 0, cv.width, cv.height); } return cv; };
  const full = render(T.wash, T.wet, T.ink);
  let blank = full, washes = full, timeI = full;
  if (!still) {
    const empty = blankCv(null);
    blank = render(blankCv('#fff'), blankCv('#000'), empty);
    washes = render(c.washesStage || T.wash, T.wet, empty);
    timeI = rt.mipmap(rt.fromCanvas(timeCv));
  }
  // timeline (s): a breath of bare paper, washes bloom, ink follows locally, inscription last, then the mist drifts
  const freeze = parseFloat(q.get('t')), WASH = [.25, 4.5], FX = 7.2;
  const t0 = performance.now();
  const frame = now => {
    const t = Number.isFinite(freeze) ? freeze : (now - t0) / 1000;
    const progress = still ? 9 : Math.max(0, (t - WASH[0]) / WASH[1]), fx = still ? 1 : Math.max(0, Math.min(1, (t - FX) / 2.5));
    rt.draw(fin, { size, tex: { uFull: full, uWashes: washes, uBlank: blank, uTimeI: timeI, uDepth: depth }, u: { uTime: t, uProgress: progress, uFx: fx } });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

start().catch(err => { console.error(err); document.body.textContent = 'Painting failed: ' + err.message; });
