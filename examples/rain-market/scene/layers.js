// The four canvases every mark writes into, and the few ways a mark can touch them.
//   w   wash colour: opaque paper-white, washes are MULTIPLIED in (glazes darken, never cover)
//   wet wetness: grey value, max-combined ('lighten'); diffusion runs only where wet
//   l   ink: crisp brush layer, source-over on transparent
//   d   depth: grey = depth of the nearest thing painted there
import { DW, DH } from './layout.js';
import { noise } from '../lib/ink.js';

function ctx2d(W, H, S) {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: false });
  g.setTransform(S, 0, 0, S, 0, 0);
  return [cv, g];
}

export function makeLayers(S) {
  const W = Math.round(DW * S), H = Math.round(DH * S);
  const [cw, w] = ctx2d(W, H, S), [cwet, wet] = ctx2d(W, H, S), [cl, l] = ctx2d(W, H, S), [cd, d] = ctx2d(W, H, S);
  const [ct, tmp] = ctx2d(W, H, S);
  w.fillStyle = '#fff'; w.fillRect(0, 0, DW, DH);
  wet.fillStyle = '#000'; wet.fillRect(0, 0, DW, DH);
  const gr = d.createLinearGradient(0, 1290, 0, 180);           // ground depth where nothing stands
  gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff');
  d.fillStyle = gr; d.fillRect(0, 0, DW, DH);
  return { S, W, H, w, wet, l, d, tmp, ct, canvases: { wash: cw, wet: cwet, ink: cl, depth: cd } };
}

const grey = v => { const k = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${k},${k},${k})`; };

// a glaze over `path`: colour multiplied into the wash layer, wetness written alongside
export function glaze(c, path, rgb, a, wet = .7, blur = 0) {
  const g = c.w;
  g.save();
  g.globalCompositeOperation = 'multiply';
  if (blur) g.filter = `blur(${blur * c.S}px)`;
  g.fillStyle = `rgba(${rgb.join(',')},${a})`;
  g.fill(path);
  g.restore();
  wetMark(c, path, wet, blur);
}

export function wetMark(c, path, wet, blur = 0) {
  const g = c.wet;
  g.save();
  g.globalCompositeOperation = 'lighten';
  if (blur) g.filter = `blur(${blur * c.S}px)`;
  g.fillStyle = grey(wet);
  g.fill(path);
  g.restore();
}

// an object in front: paper under its silhouette, ink behind it erased, its depth recorded
export function occlude(c, path, depth, { paper = true } = {}) {
  if (paper) { c.w.save(); c.w.fillStyle = '#fff'; c.w.fill(path); c.w.restore(); }
  c.l.save(); c.l.globalCompositeOperation = 'destination-out'; c.l.fillStyle = '#000'; c.l.fill(path); c.l.restore();
  c.d.save(); c.d.fillStyle = grey(depth); c.d.fill(path); c.d.restore();
}

// paint into a scratch canvas with `fn(g)`, then multiply the result into the wash layer
// (used where a wash must keep holes of bare paper, e.g. the wet sheen on roof tiles)
export function glazeVia(c, fn, wetPath, wet = .7) {
  const g = c.tmp;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.W, c.H); g.restore();
  g.save(); fn(g); g.restore();
  c.w.save(); c.w.setTransform(1, 0, 0, 1, 0, 0);
  c.w.globalCompositeOperation = 'multiply';
  c.w.drawImage(c.ct, 0, 0);
  c.w.restore();
  if (wetPath) wetMark(c, wetPath, wet);
}

// a hand-painted edge: every side subdivided and nudged along its normal by smooth noise (never a ruler edge)
export function roughPoly(pts, amp, seed = 0, step = 5) {
  const out = [];
  let dist = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / step));
    const nx = -(y1 - y0) / (len || 1), ny = (x1 - x0) / (len || 1);
    for (let k = 0; k < n; k++) {
      const t = k / n, w = (noise(dist * .09, seed) - .5) * 2 * amp * Math.sin(Math.PI * Math.min(1, t * 1.2 + .1));
      out.push([x0 + (x1 - x0) * t + nx * w, y0 + (y1 - y0) * t + ny * w]);
      dist += len / n;
    }
  }
  return poly(out);
}

export function poly(pts) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}
