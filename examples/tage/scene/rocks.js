// Near boulders, Ma Yuan's way: flat top planes left almost as silk, steep front faces chopped with big axe
// strokes (大斧劈) slanting down, the darkest ink in the picture on the contours and in the clefts.
import { rng } from '../../../kit/brush/brush.js';
import { stroke, blob, div, noise } from '../../../kit/brush/ink.js';
import { hairyStroke } from '../../../kit/brush/hairy.js';
import { poly, glaze, occlude } from './layers.js';

function bigAxe(g, x, y, ang, len, wid, alpha, seed) {
  hairyStroke(g, div([[x, y], [x + Math.cos(ang) * len, y + Math.sin(ang) * len]], 14), wid, seed, {
    rgb: '26,22,18', alpha, bristles: Math.round(wid * 1.3), dryFrom: .15, dryness: .75, streak: len * 1.5,
    edge: .6, fade: .35, close: 0, profile: t => .9 + .1 * Math.sin(t * Math.PI) - t * .3,
  });
}

// spec: { outline (closed, clockwise from the top-left), top: index range of the top plane edge, depth, seed,
//         face: polygon of the steep front face (darker), clefts: [[x0,y0,x1,y1]], size }
// a hand-cut edge: every straight facet broken into small steps and dents, as rock fractures (no vector edges)
function rough(pts, seed, amp) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
    const l = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(l / 14)), nx = -(by - ay) / l, ny = (bx - ax) / l;
    for (let k = 0; k < n; k++) {
      const t = k / n, d = (noise(i * 3.1 + t * l * .08, seed) - .5) * 2 * amp + (k % 3 === 1 ? amp * .6 : 0);
      out.push([ax + (bx - ax) * t + nx * d, ay + (by - ay) * t + ny * d]);
    }
  }
  return out;
}

export function boulder(c, sp, notan) {
  sp = { ...sp, outline: rough(sp.outline, sp.seed, 4.5), topN: sp.topN };
  const path = poly(sp.outline);
  occlude(c, path, sp.depth);
  if (notan) { glaze(c, path, '60,52,44', .85, 0); return; }
  const r = rng(sp.seed);
  glaze(c, path, '206,190,164', .9, .3, 1);
  // the front face: a deep gradient from the ridge (near black) down to a warm dark brown
  const face = poly(sp.face), xs = sp.face.map(p => p[0]), ys = sp.face.map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  c.w.save(); c.w.globalCompositeOperation = 'multiply'; c.w.clip(path);
  const gr = c.w.createLinearGradient(x0, y0, x0 + (x1 - x0) * .3, y1);
  gr.addColorStop(0, 'rgba(40,33,26,.95)'); gr.addColorStop(.5, 'rgba(70,60,46,.85)'); gr.addColorStop(1, 'rgba(110,96,76,.7)');
  c.w.fillStyle = gr; c.w.fill(face); c.w.restore();
  // ...then written over in wide dry strokes along the slope: their bristle gaps are the light streaks
  c.l.save(); c.l.clip(face);
  for (let i = 0; i < sp.strokes; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0) * .85;
    bigAxe(c.l, x, y, sp.slope + (r() - .5) * .3, (60 + r() * 120) * sp.size, (18 + r() * 26) * sp.size, .3 + r() * .35, sp.seed + i * 11);
  }
  c.l.restore();
  // the top plane: a few pale dry strokes along the slope, most of it left light
  c.l.save(); c.l.clip(path);
  for (let i = 0; i < 6; i++) {
    const p = sp.outline[Math.floor(r() * sp.outline.length * .3)];
    bigAxe(c.l, p[0] + 6, p[1] + 8, sp.slope + (r() - .5) * .2, (40 + r() * 80) * sp.size, (6 + r() * 10) * sp.size, .12 + r() * .12, sp.seed + 700 + i);
  }
  c.l.restore();
  // contour: edge by edge, each its own stroke — top-plane edges light and sometimes left out, face edges heavy
  for (let i = 0; i < sp.outline.length; i++) {
    const a = sp.outline[i], b = sp.outline[(i + 1) % sp.outline.length], top = i < sp.outline.length * .35;
    if (r() < (top ? .45 : .12)) continue;
    stroke(c.l, div([a, [(a[0] + b[0]) / 2 + (r() - .5) * 6, (a[1] + b[1]) / 2 + (r() - .5) * 6], b], 6),
      { wid: (top ? 2.5 : 5 + r() * 3) * sp.size, fun: t => .55 + .45 * Math.sin(t * Math.PI), noi: .6, col: `rgba(20,16,12,${top ? .55 : .85})`, seed: sp.seed + i * 5, tip: .8, dry: .5 });
  }
  for (const [a, b, cx, cy] of sp.clefts) {
    stroke(c.l, div([[a, b], [cx, cy]], 8), { wid: 4.5 * sp.size, noi: .6, col: 'rgba(16,13,10,.9)', seed: sp.seed + a, tip: .6, dry: .4 });
  }
  for (let i = 0; i < 10; i++) {                                         // moss dots along the top edge
    const p = sp.outline[Math.floor(r() * sp.outline.length * .35)];
    blob(c.l, p[0] + (r() - .5) * 20, p[1] + 2 + r() * 6, { len: 4 + r() * 4, wid: 3, ang: r() * 3, col: 'rgba(20,16,12,.8)', noi: .5, seed: sp.seed + 300 + i });
  }
}
