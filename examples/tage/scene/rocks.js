// Near boulders, Ma Yuan's way: flat top planes left almost as silk, steep front faces chopped with big axe
// strokes (大斧劈) slanting down, the darkest ink in the picture on the contours and in the clefts.
import { rng, smooth } from '../../../kit/brush/brush.js';
import { stroke, blob, div, noise, quad } from '../../../kit/brush/ink.js';
import { hairyStroke } from '../../../kit/brush/hairy.js';
import { poly, glaze, occlude } from './layers.js';

function bigAxe(g, x, y, ang, len, wid, alpha, seed) {
  // an axe chop: the brush laid on its side and dragged in a slight curve, wide at the root, sharp at the tip
  const bend = ((seed * 7.31) % 1 - .5) * .9, mx = x + Math.cos(ang) * len * .5 - Math.sin(ang) * len * bend * .25, my = y + Math.sin(ang) * len * .5 + Math.cos(ang) * len * bend * .25;
  hairyStroke(g, quad([x, y], [mx, my], [x + Math.cos(ang + bend * .3) * len, y + Math.sin(ang + bend * .3) * len], 18), wid, seed, {
    rgb: '26,22,18', alpha, bristles: Math.round(wid * 1.3), dryFrom: .15, dryness: .75, streak: len * 1.5,
    edge: .6, fade: .35, close: 0, profile: t => Math.max(.05, (t < .15 ? .8 + t * 1.3 : 1 - Math.pow((t - .15) / .85, 1.3))),
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
    bigAxe(c.l, x, y, (r() < .6 ? sp.slope : Math.PI / 2 + .2) + (r() - .5) * .5, (35 + r() * 90) * sp.size, (16 + r() * 26) * sp.size, .3 + r() * .35, sp.seed + i * 11);
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

// A massive rounded boulder, studied from Ma Yuan's own near rocks: a smooth convex silhouette; the form
// modelled by LONG curved dry-brush sweeps that start at the upper contour and run down over the surface,
// following it (dark at the root, drying out — the gaps are the light); a soft dark rim inside the contour;
// a deep dark cleft; the base sunk into a shadow on the ground. No hard outline all round, no short stamps.
export function massRock(c, sp, notan) {
  const r = rng(sp.seed);
  const ring = [];
  sp.outline.forEach((p, i) => {          // each corner cut by a short curve: facets stay straight, corners soften
    const a = sp.outline[(i - 1 + sp.outline.length) % sp.outline.length], b = sp.outline[(i + 1) % sp.outline.length];
    const k = .18, p0 = [p[0] + (a[0] - p[0]) * k, p[1] + (a[1] - p[1]) * k], p1 = [p[0] + (b[0] - p[0]) * k, p[1] + (b[1] - p[1]) * k];
    ring.push(...quad(p0, p, p1, 5));
  });
  const rough2 = rough(ring, sp.seed, 1.6);
  ring.length = 0; ring.push(...rough2);
  const path = poly(ring);
  occlude(c, path, sp.depth);
  if (notan) { glaze(c, path, '60,52,44', .85, 0); return; }
  glaze(c, path, '172,156,128', .85, .35, 1);
  // a soft dark rim inside the contour: the form turns away from the light at its edges
  c.w.save(); c.w.clip(path); c.w.globalCompositeOperation = 'multiply';
  c.w.filter = `blur(${12 * c.S}px)`; c.w.strokeStyle = 'rgba(70,58,44,.75)'; c.w.lineWidth = 46; c.w.stroke(path);
  c.w.filter = 'none'; c.w.restore();
  // the sweeps: from points on the upper contour, inward and down along the surface, curving with it
  const top = ring.slice(0, Math.floor(ring.length * sp.topFrac));
  const H = Math.max(...ring.map(p => p[1])) - Math.min(...ring.map(p => p[1]));
  c.l.save(); c.l.clip(path);
  for (let i = 0; i < sp.sweeps; i++) {
    const j = Math.floor(r() * (top.length - 2)) + 1, inner = 0;   // some start lower on the face
    const [x0, y0] = top[j];
    const [ax, ay] = top[j - 1], [bx, by] = top[j + 1], tl = Math.hypot(bx - ax, by - ay) || 1;
    const tx = (bx - ax) / tl, ty = (by - ay) / tl, nx = -ty, ny = tx;          // tangent, inward normal
    const x = x0 + Math.cos(sp.flow) * H * inner, y = y0 + Math.sin(sp.flow) * H * inner;
    const fa = sp.flow + (r() - .5) * .18, dx = Math.cos(fa), dy = Math.sin(fa), dl = 1;   // all sweeps run the same way
    const len = H * (.45 + r() * .6), ex = x + dx * len, ey = y + dy * len;
    const cx = x + dx * len * .5 - dy * len * .06, cy = y + dy * len * .5 + dx * len * .06;
    hairyStroke(c.l, quad([x - nx * 3, y - ny * 3], [cx, cy], [ex, ey], 20), (18 + r() * 22) * sp.size, sp.seed + i * 13, {
      rgb: '28,23,18', alpha: .3 + r() * .25, bristles: Math.round((18 + r() * 12) * sp.size), dryFrom: .2, dryness: .7,
      streak: len * 1.4, edge: .5, fade: .75, close: 0, profile: t => Math.max(.08, Math.min(1, .35 + t * 6) * (1 - Math.pow(t, 1.5) * .85)),
    });
  }
  c.l.restore();
  // the upper contour: dark, pressed, a little broken; the lower contour sinks into the ground shadow instead
  stroke(c.l, top, { wid: 5 * sp.size, fun: t => .45 + .55 * Math.abs(Math.sin(t * 5 + sp.seed)), noi: .5, col: 'rgba(22,18,14,.85)', seed: sp.seed, tip: .7, dry: .45 });
  for (const cl of sp.clefts) {
    c.w.save(); c.w.globalCompositeOperation = 'multiply'; c.w.filter = `blur(${5 * c.S}px)`;
    c.w.strokeStyle = 'rgba(40,32,24,.9)'; c.w.lineWidth = 16; c.w.beginPath(); cl.forEach((p, i) => (i ? c.w.lineTo(...p) : c.w.moveTo(...p))); c.w.stroke(); c.w.restore();
    stroke(c.l, smooth(cl, 6), { wid: 7 * sp.size, fun: t => .5 + .5 * Math.sin(t * Math.PI), noi: .5, col: 'rgba(14,11,8,.9)', seed: sp.seed + 77, tip: .6, dry: .4 });
  }
  // the base is lost in the ground: fade the lowest part of the rock into the ground's tone
  c.w.save(); c.w.clip(path); c.w.globalCompositeOperation = 'multiply';
  const gb = c.w.createLinearGradient(0, sp.base[1] - 40, 0, sp.base[1]); gb.addColorStop(0, 'rgba(120,104,80,0)'); gb.addColorStop(1, 'rgba(110,94,72,.7)');
  c.w.fillStyle = gb; c.w.fillRect(0, sp.base[1] - 40, 640, 60); c.w.restore();
}
