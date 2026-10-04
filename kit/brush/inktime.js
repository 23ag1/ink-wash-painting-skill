// Ink-time map for a reveal animation (the painting appearing on blank paper; rain-market example, kit/glsl/reveal.glsl).
// Call BEFORE painting: it wraps the ink context's fill so every ink mark also writes WHEN it is drawn into a
// second canvas — R = time 0..1 (straight alpha, A = coverage). Each stroke gets its own random start, so dozens
// are drawn at once, and its time runs along the stroke from entry to exit (the brushes set g.__seg), so a line
// travels instead of popping in. Dots get one moment. Erasures (destination-out) are not recorded.
//
//   const timeI = recordInkTimes(c.l, inkCanvas.width, inkCanvas.height, { seed: 31337, dur: .22 });
//   ... paint the scene ...  → upload timeI as a texture (with mipmaps: the reveal reads it blurred while wet)
import { rng } from './brush.js';

const grey = v => { const k = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${k},${k},${k})`; };

export function recordInkTimes(g, width, height, { seed, dur }) {
  if (seed === undefined || dur === undefined) throw new Error('recordInkTimes: seed and dur are required');
  const cv = document.createElement('canvas');
  cv.width = width; cv.height = height;
  const tg = cv.getContext('2d');
  const r = rng(seed), fill = g.fill.bind(g);
  let lastSeg = null, t0 = 0;
  g.fill = (...args) => {
    fill(...args);
    if (!(args[0] instanceof Path2D) || g.globalCompositeOperation !== 'source-over') return;
    if (!g.__seg || g.__seg !== lastSeg) { lastSeg = g.__seg; t0 = r() * (1 - dur); }
    tg.save();
    tg.setTransform(g.getTransform());
    if (g.__seg) {
      const gr = tg.createLinearGradient(...g.__seg);
      gr.addColorStop(0, grey(t0)); gr.addColorStop(1, grey(t0 + dur));
      tg.fillStyle = gr;
    } else tg.fillStyle = grey(t0 + dur * .5);
    tg.fill(args[0]);
    tg.restore();
  };
  return cv;
}
