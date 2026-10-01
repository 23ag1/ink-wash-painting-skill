// This painting's pipeline, assembled from kit modules (kit/runtime.js does the WebGL mechanics):
// scene field (+ wetness, MRT) -> kit diffusion pass ×N -> paint (kit wash/ink/paper modules), once;
// per frame: steam and rain (kit atmos module).
import { createRuntime } from '../../kit/runtime.js';

const DESIGN_W = 640;

// layers: { wash, wet, ink, depth } canvases at device resolution
export async function paint(canvas, layers, { steam = [], diffusionSteps = 36 } = {}) {
  const rt = await createRuntime(canvas, { preserveDrawingBuffer: true });
  if (!rt.float) throw new Error('EXT_color_buffer_float is not available');
  const W = canvas.width, H = canvas.height, size = [W, H];
  const [pScene, pDiffuse, pPaint, pFinal] = await Promise.all(
    ['shaders/scene.frag', '../../kit/passes/diffuse.frag', 'shaders/paint.frag', 'shaders/final.frag'].map(rt.program));

  const tex = Object.fromEntries(Object.entries(layers).map(([k, c]) => [k, rt.fromCanvas(c)]));
  const col = rt.texture(W, H, { type: 'rgba16f' }), wet = rt.texture(W, H, { type: 'rgba16f' });
  rt.draw(pScene, { to: rt.target([col, wet]), size, tex: { uWash: tex.wash, uWetC: tex.wet, uDepth: tex.depth } });

  const diffused = rt.pingpong(pDiffuse, col, diffusionSteps, {
    size, type: 'rgba16f', tex: { uWet: wet },
    u: { uStep: W / DESIGN_W * .8, uDesignW: DESIGN_W, uRate: .11, uFibreScale: .018, uCross: .2 },
  });

  const painted = rt.texture(W, H), paintFb = rt.target([painted]);
  rt.draw(pPaint, { to: paintFb, size, tex: { uDiffused: diffused, uWet: wet, uLines: tex.ink, uDepth: tex.depth } });
  if (new URLSearchParams(location.search).has('dump')) window.__painted = rt.read(paintFb, W, H);

  const steamFlat = new Float32Array(24);
  steam.slice(0, 8).forEach((s, i) => steamFlat.set(s, i * 3));
  const t0 = performance.now();
  const frame = now => {
    rt.draw(pFinal, { size, tex: { uPainted: painted, uDepth: tex.depth },
      u: { uTime: (now - t0) / 1000, uSteam: steamFlat, uSteamN: Math.min(8, steam.length) } });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
