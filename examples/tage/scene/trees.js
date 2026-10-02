// Pines and the willow, after Ma Yuan. Pines: a bent dark trunk, near-horizontal branches turning down at the
// ends, needles as fans of short fine strokes (松针) over a soft dark pad. Willow: a gnarled trunk in dry brush,
// a few upward boughs, thin hanging strands.
import { rng, smooth } from '../../../kit/brush/brush.js';
import { stroke, blob, div, quad, walk } from '../../../kit/brush/ink.js';
import { hairyStroke } from '../../../kit/brush/hairy.js';
import { glaze, grey, depthLine, poly, occlude } from './layers.js';

// a soft dark mass laid with one short wet stroke on the wash layer (the diffusion pass merges neighbours)
function wetDab(c, x, y, w, h, ang, rgb, alpha, seed) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const pts = quad([x - ca * w / 2, y - sa * w / 2], [x + sa * h * .25, y - ca * h * .25], [x + ca * w / 2, y + sa * w / 2], 10);
  const p = { bristles: Math.max(6, Math.round(h * .6)), dryFrom: .5, dryness: .5, streak: w, edge: .3, fade: .3, tipSide: .5, close: 0, profile: t => Math.pow(Math.sin(t * Math.PI), .5) };
  hairyStroke(c.w, pts, h, seed, { ...p, rgb, alpha });
  hairyStroke(c.wet, pts, h * 1.2, seed, { ...p, rgb: '255,255,255', alpha: .85 });
}

// a needle cluster (松针): a soft dark wet mass, needles fanning only from its upper rim
function pad(c, r, x, y, rad, tone, seed, fine) {
  for (let i = 0; i < 3; i++) wetDab(c, x + (r() - .5) * rad * .9, y + (r() - .5) * rad * .25, rad * (1.6 + r() * .8), rad * (.55 + r() * .3), (r() - .5) * .25, '60,64,50', (.12 + .2 * tone) * (.7 + r() * .5), seed + i * 5);
  if (!fine) return;
  const n = Math.round(5 + rad * .6);
  for (let i = 0; i < n; i++) {
    const a = Math.PI + .25 + (i / (n - 1)) * (Math.PI - .5) + (r() - .5) * .3;
    const l = rad * (.5 + r() * .5), ox = x + (r() - .5) * rad * 1.2, oy = y - rad * .15;
    stroke(c.l, [[ox, oy], [ox + Math.cos(a) * l, oy + Math.sin(a) * l * .6]], { wid: .8 + .4 * tone, fun: t => 1 - t * .8, noi: .3, col: `rgba(22,24,16,${.3 + .4 * tone})`, seed: seed + 20 + i, dry: .3 });
  }
}

// spec: { x, y (base), h, lean, depth, tone 0..1, seed }
export function pine(c, sp, notan) {
  const r = rng(sp.seed);
  const top = [sp.x + sp.lean * sp.h, sp.y - sp.h];
  const trunk = walk(r, sp.x, sp.y, -Math.PI / 2 + sp.lean * 1.5, sp.h, 18, .12);
  top[0] = trunk[trunk.length - 1][0]; top[1] = trunk[trunk.length - 1][1];
  c.d.save(); c.d.strokeStyle = grey(sp.depth); c.d.lineWidth = sp.h * .5; c.d.beginPath(); c.d.moveTo(...trunk[0]); c.d.lineTo(...top); c.d.stroke(); c.d.restore();
  if (notan) {
    const p = new Path2D(); p.ellipse(top[0], sp.y - sp.h * .55, sp.h * .35, sp.h * .5, 0, 0, 7);
    glaze(c, p, '60,60,50', .3 + .5 * sp.tone, 0); return;
  }
  const fine = sp.depth < .7;
  const crown = new Path2D(); crown.ellipse(top[0], sp.y - sp.h * .62, sp.h * .5, sp.h * .45, 0, 0, 7);
  c.d.save(); c.d.fillStyle = grey(sp.depth); c.d.fill(crown); c.d.restore();
  hairyStroke(c.l, trunk, sp.h * .05, sp.seed, { rgb: '28,24,20', alpha: .35 + .35 * sp.tone, bristles: 8, dryFrom: .2, dryness: .7, streak: sp.h * .4, edge: .8, fade: .3, tipSide: .5, close: 0, profile: t => 1 - t * .7 });
  if (false) stroke(c.l, trunk, { wid: sp.h * .045, fun: t => 1 - t * .7, noi: .5, col: `rgba(28,24,20,${.5 + .4 * sp.tone})`, seed: sp.seed, tip: .6, dry: .35 });
  // branches from the upper trunk, alternating sides, nearly horizontal, pads at the ends and along
  const nb = 7 + Math.floor(r() * 5);
  for (let i = 0; i < nb; i++) {
    const t = sp.bare + (i / nb) * (.98 - sp.bare) + (r() - .5) * .05;
    const [bx, by] = trunk[Math.round(t * (trunk.length - 1))];
    const side = i % 2 ? 1 : -1, len = sp.h * (.18 + .3 * (1 - t) + r() * .1);
    const end = [bx + side * len, by + len * (.1 + r() * .3)];
    stroke(c.l, quad([bx, by], [bx + side * len * .5, by - len * .12], end, 8), { wid: sp.h * .016, fun: t => 1 - t * .6, noi: .5, col: `rgba(30,26,22,${.45 + .4 * sp.tone})`, seed: sp.seed + 10 + i, dry: .4 });
    // the crown along the branch: overlapping masses from its middle to beyond its tip, so masses join
    for (let k = 0; k < 3; k++) pad(c, r, bx + side * len * (.4 + k * .3 + r() * .1), by + len * (.05 + k * .08) - 4, sp.h * (.1 + r() * .06), sp.tone, sp.seed + 40 + i * 9 + k * 3, fine);
  }
  pad(c, r, top[0], top[1] + sp.h * .06, sp.h * .12, sp.tone, sp.seed + 99, fine);
}

// spec: { base, path: trunk points base → crotch, boughs: [[points]], strands: n, seed }
export function willow(c, sp, notan) {
  const r = rng(sp.seed);
  const trunk = smooth(sp.trunk, 8);
  c.d.save(); c.d.strokeStyle = grey(.08); c.d.lineWidth = 52; c.d.beginPath(); trunk.forEach((p, i) => (i ? c.d.lineTo(...p) : c.d.moveTo(...p))); c.d.stroke(); c.d.restore();
  if (notan) { c.w.save(); c.w.globalCompositeOperation = 'multiply'; c.w.strokeStyle = 'rgb(60,52,44)'; c.w.lineWidth = 22; c.w.beginPath(); trunk.forEach((p, i) => (i ? c.w.lineTo(...p) : c.w.moveTo(...p))); c.w.stroke(); c.w.restore(); return; }
  // the trunk in dry brush, gnarled: two passes, the second narrower and offset
  hairyStroke(c.l, trunk, 44, sp.seed, { rgb: '20,16,12', alpha: .62, bristles: 40, dryFrom: .35, dryness: .7, streak: 120, edge: .6, fade: .2, tipSide: .7, close: .3, profile: t => (1.12 - t * .4 + .06 * Math.sin(t * 13)) * (t > .72 ? 1 - Math.pow((t - .72) / .28, 1.3) * .78 : 1) });   // the old trunk thins out into its boughs
  // a darker wet under-tone so the trunk reads as one round, gnarled body, not as stripes
  hairyStroke(c.w, trunk, 40, sp.seed + 1, { rgb: '60,50,38', alpha: .5, bristles: 20, dryFrom: .6, dryness: .3, streak: 120, edge: .3, fade: .1, tipSide: .5, close: .5, profile: t => (1.1 - t * .4) * (t > .72 ? 1 - Math.pow((t - .72) / .28, 1.3) * .85 : 1) });
  for (let i = 0; i < 6; i++) {                                           // knots
    const p = trunk[Math.floor(r() * trunk.length)];
    stroke(c.l, [[p[0] + (r() - .5) * 14, p[1]], [p[0] + (r() - .5) * 14 + 4, p[1] + 6 + r() * 6]], { wid: 3 + r() * 3, fun: t => Math.sin(t * Math.PI), noi: .6, col: 'rgba(14,11,8,.7)', seed: sp.seed + 20 + i, dry: .5 });   // knots: short dark cuts in the bark
  }
  // boughs reaching up, thinning; strands hanging from them
  sp.boughs.forEach((b, bi) => {
    const pts = smooth(b, 6);
    depthLine(c, pts, 5, .08);
    hairyStroke(c.l, pts, 19 - bi * 3, sp.seed + 50 + bi, { rgb: '20,16,12', alpha: .75, bristles: 12, dryFrom: .3, dryness: .7, streak: 50, edge: .8, fade: .4, tipSide: 0, close: 0, profile: t => (t < .14 ? .35 + t / .14 * .65 : 1) * (1 - t * .85) });
    if (false) stroke(c.l, pts, { wid: 9, fun: t => 1 - t * .85, noi: .55, col: 'rgba(22,18,14,.85)', seed: sp.seed + 50 + bi, tip: .6, dry: .5 });
    for (let k = 0; k < sp.strands; k++) {
      const [x, y] = pts[Math.floor((.2 + r() * .8) * (pts.length - 1))];
      // twigs hang in different lengths and drift with the air: an S-curve, never a plumb line
      const len = 30 + Math.pow(r(), 1.6) * 190, sway = (r() - .5) * 46, kick = (r() - .5) * 20;
      const tw = [[x, y], [x + kick, y + len * .25], [x + sway * .6 - kick * .5, y + len * .6], [x + sway, y + len]];
      depthLine(c, tw, 3, .08);
      stroke(c.l, smooth(tw, 5), { wid: 1.1 + r() * .7, fun: t => 1 - t * .7, noi: .3, col: `rgba(30,28,22,${.5 + r() * .35})`, seed: sp.seed + 100 + bi * 40 + k, dry: .4 });
    }
  });
  // dense foliage masses: many small leaves crowded into a few clumps, darkest at the core, looser at the rim
  for (const [fx, fy, rad, n] of sp.masses || []) {
    depthLine(c, [[fx - rad * .6, fy], [fx + rad * .6, fy]], rad * 1.2, .08);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.283, d = rad * Math.sqrt(r()), core = 1 - d / rad;
      const x = fx + Math.cos(a) * d * 1.2, y = fy + Math.sin(a) * d * .8, la = Math.PI / 2 + (r() - .5) * 1.6;
      blob(c.l, x, y, { len: 9 + r() * 8, wid: 2.6 + r() * 1.4, ang: la, col: `rgba(24,28,16,${.35 + .55 * core * r() + .1})`, noi: .4, seed: sp.seed + 3000 + i + fx });
    }
  }
  // leafy sprays low on the right: hanging twigs, each with small pointed leaves along it (dark near, paler behind)
  for (const [lx, ly, n] of sp.leaves) {
    for (let i = 0; i < n / 6; i++) {
      const x = lx + (r() - .5) * 110, y = ly + (r() - .5) * 70, len = 30 + r() * 40, sway = (r() - .5) * 20;
      const twig = quad([x, y], [x + sway, y + len * .5], [x + sway * 1.5 + 6, y + len], 10);
      depthLine(c, twig, 14, .08);
      stroke(c.l, twig, { wid: .9, noi: .3, col: 'rgba(30,28,22,.6)', seed: sp.seed + 500 + i });
      const tone = .6 + r() * .35;
      // willow leaves hang close along the twig, at irregular places, sides and lengths (never in pairs)
      for (let j = 1; j < twig.length; j++) {
        if (r() < .4) continue;
        const [px, py] = twig[j], side = r() < .5 ? -1 : 1, a = Math.PI / 2 + side * (.15 + r() * .45);
        const l = 8 + r() * 8;
        blob(c.l, px + Math.cos(a) * l * .45, py + Math.sin(a) * l * .45, { len: l, wid: 2 + r(), ang: a, col: `rgba(28,32,20,${tone * (.7 + r() * .3)})`, noi: .35, seed: sp.seed + 900 + i * 31 + j });
      }
    }
  }
}

// a bare tree on the rocks: a few angular boughs and twigs (蟹爪 crab-claw tips)
export function bareTree(c, sp, notan) {
  if (notan) return;
  const r = rng(sp.seed);
  const grow = (x, y, ang, len, w, depth) => {
    const pts = walk(r, x, y, ang, len, 4, .55);                   // angular: few long segments, sharp turns
    depthLine(c, pts, w, .1);
    if (depth === 0) hairyStroke(c.l, div(pts, 4), w, sp.seed + 3, { rgb: '24,20,16', alpha: .7, bristles: 8, dryFrom: .2, dryness: .8, streak: len * .5, edge: .8, fade: .3, tipSide: .6, close: 0, profile: t => 1 - t * .6 });
    else stroke(c.l, pts, { wid: w, fun: t => 1 - t * .7, noi: .5, col: 'rgba(24,20,16,.82)', seed: sp.seed + depth * 7 + x, tip: .5, dry: .5 });
    if (depth >= 3) {                                              // 蟹爪 crab-claw tip: a short hooked twig
      const [ex, ey] = pts[pts.length - 1], a = ang + (r() < .5 ? .9 : -.9);
      stroke(c.l, quad([ex, ey], [ex + Math.cos(ang) * 4, ey + Math.sin(ang) * 4], [ex + Math.cos(a) * 6, ey + Math.sin(a) * 6], 5), { wid: w * .8, fun: t => 1 - t, noi: .3, col: 'rgba(24,20,16,.75)', seed: sp.seed + x });
      return;
    }
    for (let i = 0; i < 2 + (depth < 1 ? 1 : 0); i++) {
      const p = pts[1 + Math.floor(r() * 3)];
      grow(p[0], p[1], ang + (r() < .5 ? 1 : -1) * (.4 + r() * .6), len * (.45 + r() * .25), w * .55, depth + 1);
    }
  };
  grow(sp.x, sp.y, sp.ang, sp.len, 5.5, 0);
}

// Ma Yuan's willow (踏歌图), a pollard, PAINTED: everything goes on the canvases and through the same diffusion
// and paint pass as the rocks (a shape composited after the paint pass reads as a vector cut-out).
// Painter's order: wet washes on the trunk and head (they bleed and merge), dry side-brush bark strokes (飞白),
// the dark knotty head of short heavy strokes, then the thin wands and the crooked branch — their strokes start
// INSIDE the dark head, so the joints are hidden in it, as on the scroll. Strands last.
function offsetLine(axis, k, widths) {
  return axis.map(([x, y], i) => {
    const [px, py] = axis[Math.max(0, i - 1)], [nx, ny] = axis[Math.min(axis.length - 1, i + 1)];
    const a = Math.atan2(ny - py, nx - px), w = widths[i] * k;
    return [x - Math.sin(a) * w, y + Math.cos(a) * w];
  });
}

export function pollardWillow(c, sp, notan) {
  const r = rng(sp.seed);
  const ax = smooth(sp.trunk, 4), n = ax.length;
  const W = ax.map((_, i) => sp.trunkW[0] + (sp.trunkW[1] - sp.trunkW[0]) * i / (n - 1));
  const half = W.map(w => w / 2);
  const body = poly([...offsetLine(ax, -1, half), ...offsetLine(ax, 1, half).reverse()]);
  const [hx, hy, hr] = sp.headAt;
  if (notan) { glaze(c, body, '40,34,28', .9, 0); const h = new Path2D(); h.arc(hx, hy, hr, 0, 6.283); glaze(c, h, '40,34,28', .9, 0); return; }
  // the head: knots of different sizes fused into one dark lumpy mass, wider than the trunk, over its top
  const lumps = sp.head;
  const head = new Path2D();
  for (const [x, y, q] of lumps) { head.moveTo(x + q, y); head.arc(x, y, q, 0, 6.283); }
  const inOther = (px, py, j) => lumps.some(([x, y, q], k) => k !== j && Math.hypot(px - x, py - y) < q - .5);
  occlude(c, body, .08);                                    // the trunk and head hide the bank behind them
  occlude(c, head, .08);

  // 1. washes, wet: a mid tone over the trunk, a darker band down the shadow (right) side; the head wet and dark
  const along = (k, w) => offsetLine(ax, k, W.map(x => x * w));
  hairyStroke(c.w, ax, sp.trunkW[0] * .95, sp.seed + 1, { rgb: '120,104,84', alpha: .42, bristles: 30, dryFrom: .8, dryness: .2, streak: 120, edge: .3, fade: .1, tipSide: 0, close: .5, profile: t => 1 - t * .3 });
  hairyStroke(c.w, along(.22, 1), sp.trunkW[0] * .55, sp.seed + 2, { rgb: '60,50,40', alpha: .5, bristles: 22, dryFrom: .6, dryness: .35, streak: 90, edge: .5, fade: .15, tipSide: .6, close: .3, profile: t => 1 - t * .35 });
  hairyStroke(c.wet, ax, sp.trunkW[0] * 1.05, sp.seed + 3, { rgb: '255,255,255', alpha: .6, bristles: 20, dryFrom: .9, dryness: .1, streak: 120, edge: 0, fade: 0, tipSide: 0, close: .5, profile: t => 1 - t * .3 });
  glaze(c, head, '62,52,42', .8, .8);                       // the head's own wash, dark and wet: it bleeds a little at the rim
  for (const [x, y, q] of lumps) wetDab(c, x + q * .2, y + q * .25, q * 1.4, q * .9, r() * 3, '30,25,20', .45 + r() * .3, sp.seed + 10 + Math.round(x));

  // 2. bark, dry: the shadow edge one long side-brush stroke, the lit edge a broken pressed line, long dry
  //    streaks between (flying white along the wood), a few dark knots
  hairyStroke(c.l, along(.36, 1), sp.trunkW[0] * .34, sp.seed + 20, { rgb: '16,12,9', alpha: .75, bristles: 18, dryFrom: .15, dryness: .75, streak: 80, edge: .7, fade: .25, tipSide: .9, close: 0, profile: t => .9 - t * .3 });
  const lit = along(-.47, 1);
  for (const [i0, i1] of [[0, .38], [.45, .8], [.86, 1]].map(([u, v]) => [Math.round(u * (n - 1)), Math.round(v * (n - 1))])) {
    if (i1 - i0 < 2) continue;
    hairyStroke(c.l, lit.slice(i0, i1 + 1), 4.5, sp.seed + 30 + i0, { rgb: '16,12,9', alpha: .8, bristles: 7, dryFrom: .3, dryness: .6, streak: 50, edge: .6, fade: .3, tipSide: -.8, close: 0, profile: t => Math.sin(Math.max(.15, t) * Math.PI) });
  }
  for (let i = 0; i < 7; i++) {
    const k = -.3 + r() * .55, t0 = r() * .5, t1 = t0 + .25 + r() * .45;
    const seg = along(k, 1).slice(Math.round(t0 * (n - 1)), Math.round(Math.min(1, t1) * (n - 1)) + 1);
    if (seg.length < 2) continue;
    hairyStroke(c.l, seg, 3 + r() * 5, sp.seed + 40 + i, { rgb: '22,18,14', alpha: .35 + r() * .3, bristles: 6, dryFrom: .1, dryness: .85, streak: 60, edge: .3, fade: .4, tipSide: .5, close: 0, profile: t => Math.sin(Math.max(.1, t) * Math.PI) });
  }
  for (let i = 0; i < 4; i++) {
    const j = 2 + Math.floor(r() * (n - 4)), [x, y] = along(-.1 + r() * .4, 1)[j];
    blob(c.l, x, y, { len: 5 + r() * 6, wid: 3 + r() * 3, ang: -1.1, noi: .8, col: `rgba(14,10,8,${.6 + r() * .3})`, seed: sp.seed + 60 + i });
  }

  // 3. wands and branches: their strokes begin inside the head (the joint disappears in the dark mass)
  sp.wands.forEach(([x, y, ang, len, w], i) => {
    const rr = rng(sp.seed + 70 + i), pts = [[x, y]];
    for (let k = 1; k <= 6; k++) { const a = ang + .03 * k + (rr() - .5) * .05; pts.push([pts[k - 1][0] + Math.cos(a) * len / 6, pts[k - 1][1] + Math.sin(a) * len / 6]); }
    depthLine(c, pts, w + 2, .08);
    stroke(c.l, smooth(pts, 3), { wid: w, fun: t => (t < .08 ? .7 + t * 3.7 : 1) * (1 - t * .8), noi: .35, col: 'rgba(26,22,17,.82)', seed: sp.seed + 70 + i, tip: .3, dry: .35 });
    if (i === 1) for (const [k, da, l] of [[4, .5, 50], [5, -.4, 30], [3, .6, 26]]) {
      const tw = walk(rng(sp.seed + 90 + k), pts[k][0], pts[k][1], ang + da, l, 3, .15);
      depthLine(c, tw, 2, .08);
      stroke(c.l, tw, { wid: w * .45, fun: t => 1 - t * .85, noi: .3, col: 'rgba(30,26,20,.75)', seed: sp.seed + 95 + k, tip: .3, dry: .4 });
    }
  });
  sp.branches.forEach((br, bi) => {
    const P = smooth(br.pts, 3);
    depthLine(c, P, br.w + 2, .08);
    hairyStroke(c.l, P, br.w, sp.seed + 100 + bi, { rgb: '20,16,12', alpha: .82, bristles: 7, dryFrom: .35, dryness: .55, streak: 40, edge: .6, fade: .3, tipSide: .3, close: 0, profile: t => (t < .06 ? .8 : 1) * (1 - t * .78) });
    for (const [k, ang, len] of br.shoots || []) {
      const tw = walk(rng(sp.seed + 110 + bi * 10 + k), br.pts[k][0], br.pts[k][1], ang, len, 4, .25);
      depthLine(c, tw, 2, .08);
      stroke(c.l, smooth(tw, 2), { wid: br.w * .32, fun: t => 1 - t * .85, noi: .35, col: 'rgba(26,22,17,.8)', seed: sp.seed + 120 + bi * 10 + k, tip: .3, dry: .4 });
    }
    const S = smooth(br.pts, 4);
    for (let k = 0; k < (br.strands || 0); k++) {
      const p = S[Math.floor(S.length * (.3 + .7 * r()))];
      const l = 22 + Math.pow(r(), 1.3) * 80, sx = (r() - .5) * 10 + 3;
      const tw = [[p[0], p[1]], [p[0] + 2, p[1] + l * .25], [p[0] + sx * .5, p[1] + l * .6], [p[0] + sx, p[1] + l]];
      depthLine(c, tw, 1.5, .08);
      stroke(c.l, smooth(tw, 4), { wid: .5 + r() * .45, fun: t => 1 - t * .8, noi: .3, col: `rgba(34,30,24,${.14 + r() * .26})`, seed: sp.seed + 300 + bi * 50 + k, dry: .4 });
    }
  });

  // 4. the head over the joints: a broken lumpy rim pressed with the side of the brush (heavier below and on the
  //    shadow side), dark crevices between the lumps, dry rubs on the lit top
  lumps.forEach(([x, y, q], j) => {                          // each knot's outer arc only — where it is not inside another
    const run = [];
    const flush = () => {
      if (run.length > 3 && r() > .3) {
        const below = run[0][1] > hy || run[0][0] > hx;
        hairyStroke(c.l, run.slice(), 2.5 + (below ? 2.5 : .8) + r() * 1.5, sp.seed + 200 + j * 7 + run.length, { rgb: '12,9,7', alpha: .8, bristles: 7, dryFrom: .3, dryness: .5, streak: 20, edge: .6, fade: .3, tipSide: .7, close: 0, profile: t => Math.sin(Math.max(.15, t) * Math.PI) });
      }
      run.length = 0;
    };
    for (let i = 0; i <= 28; i++) {
      const a = i / 28 * 6.283, px = x + Math.cos(a) * q, py = y + Math.sin(a) * q;
      if (inOther(px, py, j)) flush(); else run.push([px, py]);
    }
    flush();
  });
  for (let i = 0; i < 5; i++) {
    const a = r() * 6.283, x = hx + Math.cos(a) * hr * .45, y = hy + Math.sin(a) * hr * .4, b = a + 1.3 + (r() - .5) * .6, l = hr * (.35 + r() * .3);
    hairyStroke(c.l, [[x, y], [x + Math.cos(b) * l * .5 + (r() - .5) * 3, y + Math.sin(b) * l * .5], [x + Math.cos(b) * l, y + Math.sin(b) * l]], 2.5 + r() * 2.5, sp.seed + 240 + i,
      { rgb: '12,9,7', alpha: .75, bristles: 6, dryFrom: .3, dryness: .5, streak: 15, edge: .5, fade: .3, tipSide: .5, close: 0, profile: t => Math.sin(Math.max(.15, t) * Math.PI) });
  }
  for (let i = 0; i < 4; i++) {
    const x = hx - hr * .3 + r() * hr * .7, y = hy - hr * .55 + r() * hr * .3;
    hairyStroke(c.l, [[x - 6, y], [x + 6, y - 1]], 4 + r() * 3, sp.seed + 260 + i, { rgb: '30,25,20', alpha: .35, bristles: 6, dryFrom: 0, dryness: .9, streak: 10, edge: .2, fade: .4, tipSide: .5, close: 0, profile: t => Math.sin(Math.max(.15, t) * Math.PI) });
  }
  for (let i = 0; i < 5; i++) blob(c.l, hx + (r() - .5) * hr * 1.2, hy + (r() - .5) * hr, { len: 3 + r() * 5, wid: 2.5 + r() * 3, ang: r() * 3, noi: .9, col: `rgba(10,8,6,${.6 + r() * .35})`, seed: sp.seed + 230 + i });
}
