// Slab peaks cut with the axe (斧劈皴), after Ma Yuan: tall vertical rock faces, a pale lit face and a dark shadow
// face, long side-brush strokes chopped downward with dry edges (飞白), a heavy broken contour on the shadow side,
// moss dots on the ledges; the base is lost in mist.
import { rng } from '../../../kit/brush/brush.js';
import { stroke, blob, div, brokenLine, quad } from '../../../kit/brush/ink.js';
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
    rgb: ink.rgb, alpha: ink.alpha, bristles: Math.max(8, Math.round(wid * 1.6)), dryFrom: .05, dryness: .95,
    streak: len * .9, edge: .8, fade: .5, close: 0, profile: t => (t < .12 ? .7 + t * 2.5 : 1 - (t - .12) * .75),
  });
}

// spec: { left, right, depth, seed, light: shadow side 'right'|'left', tone (0 pale .. 1 dark), base: [y0, y1] }
export function slabPeak(c, sp, notan) {
  const path = poly(slabPath(sp.left, sp.right));
  occlude(c, path, sp.depth);
  const k = sp.tone;                                                    // overall darkness by depth
  if (notan) { glaze(c, path, '110,100,86', .25 + .55 * k, 0); dissolve(c, path, sp.base[0], sp.base[1]); return; }
  const r = rng(sp.seed);
  const ink = { rgb: '38,32,26', alpha: .12 + .3 * k };
  // lit face: one pale glaze; shadow face: a darker glaze along the shadow edge
  glaze(c, path, '214,200,176', .9, .45, 1.2);
  const shadowEdge = sp.shadow === 'left' ? sp.left : sp.right, litEdge = sp.shadow === 'left' ? sp.right : sp.left;
  const inner = shadowEdge.map(([x, y], i) => { const [lx] = litEdge[i] || litEdge[litEdge.length - 1]; return [lerp(x, lx, .42 + .1 * Math.sin(i * 1.7)), y]; });
  glaze(c, poly([...shadowEdge, ...inner.reverse()]), '150,134,110', .55 + .3 * k, .35, 1.5);

  // 斧劈: long dry-brush bands running down the faces (dense and dark along the shadow edge, few on the lit
  // face), built up in overlapping passes of different length, width and lean — never a row of equal marks
  c.l.save(); c.l.clip(path);
  const n = Math.round(9 + 14 * sp.size);
  for (let i = 0; i < n; i++) {
    const shadowSide = r() < .72, side = shadowSide ? r() * r() * .45 : .45 + r() * .5;   // across: 0 = shadow edge
    const t = .35 + r() * .62;                                                           // start high on the face
    const [sx, sy] = at(shadowEdge, t), [lx, ly] = at(litEdge, t);
    const x = lerp(sx, lx, side), y = lerp(sy, ly, side);
    const faceH = sp.left[0][1] - sp.left[sp.left.length - 1][1];
    const len = faceH * (.18 + r() * .45), wid = (8 + r() * 18) * sp.size * (shadowSide ? 1 : .7);
    const ang = Math.PI / 2 + (sp.shadow === 'left' ? -1 : 1) * (r() - .3) * .16;
    axe(c.l, x, y, ang, len, wid, { rgb: ink.rgb, alpha: ink.alpha * (shadowSide ? .85 : .45) }, sp.seed + i * 7);
  }
  // a few short heavy chops under the ledges, each different
  for (let i = 0; i < 3 + Math.round(4 * sp.size); i++) {
    const t = .2 + r() * .75, side = r() * .5;
    const [sx, sy] = at(shadowEdge, t), [lx, ly] = at(litEdge, t);
    axe(c.l, lerp(sx, lx, side), lerp(sy, ly, side), Math.PI / 2 + (r() - .5) * .5, (10 + r() * 22) * sp.size, (6 + r() * 10) * sp.size, { rgb: ink.rgb, alpha: Math.min(.8, ink.alpha * 1.6) }, sp.seed + 500 + i);
  }
  c.l.restore();

  // contours: heavy and broken on the shadow side, light on the lit side; a few horizontal cracks
  stroke(c.l, div(sp.shadow === 'left' ? sp.left : sp.right, 6), { wid: (3.5 + 2 * k) * sp.size, fun: t => .6 + .4 * Math.sin(t * 9 + sp.seed) ** 2, noi: .6, col: `rgba(30,25,20,${.5 + .4 * k})`, seed: sp.seed, tip: .7, dry: .5 });
  brokenLine(c.l, r, litEdge, 1.6 * sp.size, .35 + .35 * k, '40,34,28', .5);
  for (let i = 0; i < 3 + Math.round(3 * sp.size); i++) {
    const t = .15 + r() * .75, [sx, sy] = at(shadowEdge, t), [lx, ly] = at(litEdge, t);
    const u = .1 + r() * .3, x0 = lerp(sx, lx, u), y0 = lerp(sy, ly, u);
    stroke(c.l, quad([x0, y0], [lerp(x0, lx, .3), y0 + 3], [lerp(x0, lx, .5 + r() * .3), y0 + 5 + r() * 6], 8), { wid: 1.8 * sp.size, noi: .5, col: `rgba(36,30,24,${.3 + .35 * k})`, seed: sp.seed + 90 + i, dry: .6 });
  }
  // moss dots on the top and the ledges
  for (let i = 0; i < 8 * sp.size; i++) {
    const t = r() < .5 ? .9 + r() * .1 : .3 + r() * .6, [lx, ly] = at(litEdge, t), [sx, sy] = at(shadowEdge, t);
    blob(c.l, lerp(lx, sx, r()), lerp(ly, sy, .5) - 2, { len: 3 + r() * 3, wid: 2.4, ang: r() * 3, col: `rgba(28,24,20,${.5 + .3 * k})`, noi: .4, seed: sp.seed + 200 + i });
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
