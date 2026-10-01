// Slab peaks cut with the axe (斧劈皴), after Ma Yuan: tall vertical rock faces, a pale lit face and a dark shadow
// face, long side-brush strokes chopped downward with dry edges (飞白), a heavy broken contour on the shadow side,
// moss dots on the ledges; the base is lost in mist.
import { rng } from '../../../kit/brush/brush.js';
import { stroke, blob, div, brokenLine, quad, noise } from '../../../kit/brush/ink.js';
import { hairyStroke } from '../../../kit/brush/hairy.js';
import { poly, glaze, occlude, dissolve } from './layers.js';

// silhouette from a left edge and a right edge (both listed base → top) and the top between them
export function slabPath(left, right) { return [...left, ...right.slice().reverse()]; }

const lerp = (a, b, t) => a + (b - a) * t;
const at = (edge, t) => {                       // point at fraction t (0 base .. 1 top) along an edge polyline
  const f = t * (edge.length - 1), i = Math.min(edge.length - 2, Math.floor(f)), u = f - i;
  return [lerp(edge[i][0], edge[i + 1][0], u), lerp(edge[i][1], edge[i + 1][1], u)];
};

// one axe stroke: a wide side-brush wedge chopped downward; heavy at the entry, drying out as it goes
function axe(g, x, y, ang, len, wid, ink, seed) {
  const pts = div([[x, y], [x + Math.cos(ang) * len, y + Math.sin(ang) * len]], 16);
  hairyStroke(g, pts, wid, seed, {
    rgb: ink.rgb, alpha: ink.alpha, bristles: Math.max(8, Math.round(wid * 1.4)), dryFrom: .1, dryness: .85,
    streak: len * .9, edge: .8, fade: .5, tipSide: 0, close: 0, profile: t => (t < .12 ? .7 + t * 2.5 : 1 - (t - .12) * .75),
  });
}

// a fractured edge: each segment broken into short pieces that wander and notch, endpoints kept
function roughEdge(edge, seed, amp) {
  const out = [edge[0]];
  for (let i = 0; i < edge.length - 1; i++) {
    const [ax, ay] = edge[i], [bx, by] = edge[i + 1], l = Math.hypot(bx - ax, by - ay);
    const n = Math.max(2, Math.round(l / 9)), nx = -(by - ay) / l, ny = (bx - ax) / l;
    for (let k = 1; k <= n; k++) {
      const t = k / n, last = i === edge.length - 2 && k === n;
      const d = last ? 0 : (noise(i * 2.3 + k * .45, seed) - .5) * 2 * amp + (noise(k * 1.7, seed + 5) > .78 ? amp * 1.4 : 0);
      out.push([ax + (bx - ax) * t + nx * d, ay + (by - ay) * t + ny * d]);
    }
  }
  return out;
}

// spec: { left, right (base → top), shadow: 'left'|'right', depth, tone 0..1, size, seed, base: [y kept, y gone] }
export function slabPeak(c, sp, notan) {
  const r = rng(sp.seed);
  const left = roughEdge(sp.left, sp.seed, 2.6 * sp.size), right = roughEdge(sp.right, sp.seed + 9, 3.2 * sp.size);
  const path = poly(slabPath(left, right));
  occlude(c, path, sp.depth);
  const k = sp.tone;
  if (notan) { glaze(c, path, '110,100,86', .25 + .55 * k, 0); dissolve(c, path, sp.base[0], sp.base[1]); return; }
  const shadowEdge = sp.shadow === 'left' ? left : right, litEdge = sp.shadow === 'left' ? right : left;
  glaze(c, path, '216,202,178', .9, .45, 1);

  // 渲染 the same way as the near rocks: many faint WET strokes running down the faces on the wash layer, merged by
  // the diffusion pass — densest and darkest along the shadow edge, few and pale on the lit face; no blur, no bands
  const H = sp.left[0][1] - sp.left[sp.left.length - 1][1];
  const wetStroke = (x, y, len, wid, alpha, seed) => {
    const pts = quad([x, y], [x + (r() - .5) * 4, y + len * .5], [x + (r() - .5) * 6, y + len], 10);
    const p = { bristles: Math.max(6, Math.round(wid * .6)), dryFrom: .4, dryness: .6, streak: len, edge: .25, fade: .4, tipSide: sp.shadow === 'left' ? -.6 : .6, close: 0, profile: t => (t < .15 ? .3 + Math.sqrt(t / .15) * .7 : 1 - (t - .15) * .3) };
    hairyStroke(c.w, pts, wid, seed, { ...p, rgb: '62,50,38', alpha });
    hairyStroke(c.wet, pts, wid * 1.2, seed, { ...p, rgb: '255,255,255', alpha: .9 });
  };
  c.w.save(); c.w.clip(path); c.wet.save(); c.wet.clip(path);
  const nw = Math.round(H / 5 * (1 + 1.5 * k));
  for (let i = 0; i < nw; i++) {
    const shadowSide = r() < .7, side = shadowSide ? r() * r() * .5 : .45 + r() * .5;
    const t = .1 + Math.pow(r(), .7) * .9;
    const [sx, sy] = at(shadowEdge, t), [lx, ly] = at(litEdge, t);
    wetStroke(lerp(sx, lx, side), lerp(sy, ly, side), H * (.15 + r() * .4), (12 + r() * 16) * sp.size,
      (shadowSide ? .1 + .26 * k : .025 + .04 * k) * (.7 + r() * .6), sp.seed + 900 + i * 13);
  }
  c.w.restore(); c.wet.restore();

  c.l.save(); c.l.clip(path);
  // grain: a few long faint dry streaks down the shadow face only
  for (let i = 0; i < Math.round(6 + 8 * sp.size); i++) {
    const side = r() * r() * .4, t = .25 + r() * .7;
    const [sx, sy] = at(shadowEdge, t), [lx, ly] = at(litEdge, t);
    axe(c.l, lerp(sx, lx, side), lerp(sy, ly, side), Math.PI / 2 + (r() - .5) * .08, H * (.2 + r() * .4), (5 + r() * 8) * sp.size, { rgb: '30,25,20', alpha: .1 + .16 * k }, sp.seed + i * 7);
  }
  // a few small dark ledges where the face steps back (no shrubs: at this size they read as little boats)
  for (let i = 0; i < 2 + Math.round(2 * sp.size); i++) {
    const t = .25 + r() * .65, u = .15 + r() * .4;
    const [sx, sy] = at(shadowEdge, t), [lx, ly] = at(litEdge, t);
    const x = lerp(sx, lx, u), y = lerp(sy, ly, u);
    stroke(c.l, [[x - 5 * sp.size, y], [x + 2, y + 2], [x + 7 * sp.size, y + 1]], { wid: 2.4 * sp.size, noi: .6, col: `rgba(26,22,18,${.35 + .3 * k})`, seed: sp.seed + 90 + i, tip: .6, dry: .6 });
  }
  c.l.restore();

  // the crease: the ridge where the two faces meet, a dark broken line from the top down
  const crease = Array.from({ length: 12 }, (_, i) => {
    const t = .98 - i * .06, [sx, sy] = at(shadowEdge, t), [lx, ly] = at(litEdge, t), u = .36 + .06 * Math.sin(i * 1.3 + sp.seed);
    return [lerp(sx, lx, u), lerp(sy, ly, u)];
  });
  brokenLine(c.l, r, crease, 2.4 * sp.size, .45 + .4 * k, '28,23,18', .4);
  // contours: heavy and broken on the shadow side, light on the lit side
  stroke(c.l, shadowEdge, { wid: (3.5 + 2.5 * k) * sp.size, fun: t => .55 + .45 * Math.sin(t * 11 + sp.seed) ** 2, noi: .6, col: `rgba(24,20,16,${.55 + .4 * k})`, seed: sp.seed, tip: .7, dry: .5 });
  brokenLine(c.l, r, litEdge, 1.5 * sp.size, .35 + .35 * k, '40,34,28', .5);
  for (let i = 0; i < 10 * sp.size; i++) {                          // moss dots on the top and the ledges
    const t = r() < .5 ? .88 + r() * .12 : .3 + r() * .6, [lx, ly] = at(litEdge, t), [sx, sy] = at(shadowEdge, t);
    blob(c.l, lerp(lx, sx, r()), lerp(ly, sy, .5) - 2, { len: 3 + r() * 3, wid: 2.4, ang: r() * 3, col: `rgba(24,20,16,${.5 + .35 * k})`, noi: .4, seed: sp.seed + 200 + i });
  }
  dissolve(c, path, sp.base[0], sp.base[1]);
}

// far pinnacles: pale washes only, a soft contour on one side, no texture — distance by tone, not by detail
export function farPinnacle(c, sp, notan) {
  const path = poly(slabPath(sp.left, sp.right));
  occlude(c, path, sp.depth);
  if (notan) { glaze(c, path, '110,100,86', .2, 0); dissolve(c, path, sp.base[0], sp.base[1]); return; }
  glaze(c, path, '190,176,156', .55, .9, 1.5);
  glaze(c, poly([...sp.right, ...sp.right.map(([x, y]) => [x - (sp.right[0][0] - sp.left[0][0]) * .35, y]).reverse()]), '170,156,134', .45, .9, 2);
  stroke(c.l, div(sp.right, 6), { wid: 1.6, noi: .5, col: 'rgba(80,70,58,.3)', seed: sp.seed, dry: .5 });
  dissolve(c, path, sp.base[0], sp.base[1]);
}
