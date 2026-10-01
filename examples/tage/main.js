// 踏歌 — after Ma Yuan. Marks painted once into four canvases; the kit runtime runs the scene field (silk +
// mist), the diffusion pass, the paint pass and a per-frame pass where only the mist drifts.
// ?mode=notan renders only the masses as flat tones (the composition gate); ?s=2 renders sharper for zoom checks.
import { createRuntime } from '../../kit/runtime.js';
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
  if (q.get('study') === 'rock') paintStudy(c); else paintScene(c, notan);

  const rt = await createRuntime(canvas, { preserveDrawingBuffer: true });
  if (!rt.float) throw new Error('EXT_color_buffer_float is not available');
  const size = [canvas.width, canvas.height];
  const [scene, diffuse, paint, fin] = await Promise.all(
    ['shaders/scene.frag', '../../kit/passes/diffuse.frag', 'shaders/paint.frag', 'shaders/final.frag'].map(rt.program));
  const T = c.canvases, tex = { wash: rt.fromCanvas(T.wash), wet: rt.fromCanvas(T.wet), ink: rt.fromCanvas(T.ink), depth: rt.fromCanvas(T.depth) };

  const col = rt.texture(...size, { type: 'rgba16f' }), wet = rt.texture(...size, { type: 'rgba16f' });
  rt.draw(scene, { to: rt.target([col, wet]), size, tex: { uWash: tex.wash, uWetC: tex.wet, uDepth: tex.depth } });
  // silk is sized: ink spreads less and more evenly than on raw xuan
  const diffused = rt.pingpong(diffuse, col, 22, {
    size, type: 'rgba16f', tex: { uWet: wet },
    u: { uStep: S * .8, uDesignW: DW, uRate: .09, uFibreScale: .02, uCross: .4 },
  });
  const painted = rt.texture(...size), fb = rt.target([painted]);
  rt.draw(paint, { to: fb, size, tex: { uDiffused: diffused, uWet: wet, uLines: notan ? rt.fromCanvas(document.createElement('canvas')) : tex.ink, uDepth: tex.depth } });

  const t0 = performance.now();
  const frame = now => {
    rt.draw(fin, { size, tex: { uPainted: painted, uDepth: tex.depth }, u: { uTime: (now - t0) / 1000 } });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

start().catch(err => { console.error(err); document.body.textContent = 'Painting failed: ' + err.message; });
