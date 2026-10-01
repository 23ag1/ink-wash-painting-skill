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

// Ma Yuan's willow (踏歌图): a long trunk leaning in from the edge with a crook, a fork into two
// stems that leave the frame upward, and one long branch arching out over the path, hung with fine strands.
// Each limb is a tapered band: mid-dark wash, darker shadow side, dry bark grain, broken contours, a few pale
// scrapes (small and unoutlined — an outlined oval reads as an eye).
function band(axis, widths) {
  const L = [], R = [];
  axis.forEach(([x, y], i) => {
    const [px, py] = axis[Math.max(0, i - 1)], [nx, ny] = axis[Math.min(axis.length - 1, i + 1)];
    const a = Math.atan2(ny - py, nx - px), w = widths[i] / 2;
    L.push([x + Math.sin(a) * w, y - Math.cos(a) * w]); R.push([x - Math.sin(a) * w, y + Math.cos(a) * w]);
  });
  return { L, R, path: poly([...L, ...R.slice().reverse()]) };
}

function limb(c, axis, widths, r, seed, shadow, parent = null) {
  const grows = !!parent;
  const sm = smooth(axis, 4), wsm = sm.map((_, i) => widths[0] + (widths[widths.length - 1] - widths[0]) * i / (sm.length - 1));
  const b = band(sm, wsm);
  // a limb growing out of another paints no paper under itself and nothing inside its parent: inside, the
  // parent's own brushwork shows, so the join is the parent's edge, never the child's end cap lying across it
  if (grows) {
    c.d.save(); c.d.fillStyle = grey(.08); c.d.fill(b.path); c.d.restore();
    for (const g of [c.w, c.wet, c.l]) { const P = new Path2D(); P.rect(-1e4, -1e4, 2e4, 2e4); P.addPath(parent); g.save(); g.clip(P, 'evenodd'); }
  } else occlude(c, b.path, .08);
  // the body is brushed, not filled: a pale base, then long wet strokes laid along the limb side by side,
  // darker toward the shadow side, and one long dry side-brush stroke down the shadow edge
  glaze(c, b.path, '170,152,128', .5, .6);
  const off = (k) => sm.map(([x, y], i) => {
    const [px, py] = sm[Math.max(0, i - 1)], [nx, ny] = sm[Math.min(sm.length - 1, i + 1)], a = Math.atan2(ny - py, nx - px);
    return [x - Math.sin(a) * wsm[i] * k * shadow, y + Math.cos(a) * wsm[i] * k * shadow];
  });
  const W0 = wsm[0];
  c.w.save(); c.w.clip(b.path); c.w.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 6; i++) {
    const k = -.35 + i * .16 + (r() - .5) * .06;                // across the limb, lit side (k<0) to shadow (k>0)
    hairyStroke(c.w, off(k), W0 * .42, seed + 20 + i, { rgb: '58,48,38', alpha: .22 + .5 * Math.max(0, k + .2), bristles: 14, dryFrom: .55, dryness: .5, streak: 80, edge: .3, fade: .2, tipSide: .4, close: .3, profile: t => 1 - t * (1 - wsm[wsm.length - 1] / W0) });
  }
  c.w.restore();
  hairyStroke(c.l, off(.28), W0 * .45, seed + 30, { rgb: '16,12,9', alpha: .7, bristles: 22, dryFrom: .15, dryness: .75, streak: 120, edge: .8, fade: .25, tipSide: .9 * shadow, close: 0, profile: t => .9 - t * (.9 - wsm[wsm.length - 1] / W0) });
  c.l.save(); c.l.clip(b.path);
  for (let i = 0; i < sm.length * 1.2; i++) {                      // bark grain along the limb
    const j = Math.min(sm.length - 2, Math.floor(r() * (sm.length - 1))), [ax, ay] = sm[j], [bx, by] = sm[j + 1];
    const a = Math.atan2(by - ay, bx - ax) + (r() - .5) * .3, off = (r() - .5) * wsm[j] * .8, len = 16 + r() * 34;
    const x = ax - Math.sin(a) * off, y = ay + Math.cos(a) * off;
    hairyStroke(c.l, [[x, y], [x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2], [x + Math.cos(a) * len, y + Math.sin(a) * len]], 3 + r() * 5, seed + 100 + i,
      { rgb: '18,14,10', alpha: .35 + r() * .4, bristles: 5, dryFrom: .2, dryness: .8, streak: len, edge: .4, fade: .3, tipSide: .7, close: 0, profile: t => Math.sin(Math.max(.12, t) * Math.PI) });
  }
  c.l.restore();
  for (const [edge, w] of [[shadow > 0 ? b.R : b.L, 3.6], [shadow > 0 ? b.L : b.R, 2.4]]) {   // broken contours
    for (let i = 0; i < edge.length - 3; i += 3 + Math.floor(r() * 4)) {
      if (r() < .2) continue;
      stroke(c.l, edge.slice(i, i + 4 + Math.floor(r() * 5)), { wid: w * (.6 + r() * .7), fun: t => Math.sin(Math.max(.1, t) * Math.PI), noi: .6, col: 'rgba(14,10,8,.85)', seed: seed + 400 + i, tip: .7, dry: .5 });
    }
  }
  if (grows) for (const g of [c.w, c.wet, c.l]) g.restore();
  return { sm, wsm, b };
}

export function pollardWillow(c, sp, notan) {
  const r = rng(sp.seed);
  if (notan) {
    for (const [ax, w] of [[sp.trunk, sp.trunkW], ...sp.stems.map(s => [s.axis, s.w])]) glaze(c, band(smooth(ax, 4), smooth(ax, 4).map((_, i, A) => w[0] + (w[1] - w[0]) * i / (A.length - 1))).path, '40,34,28', .9, 0);
    return;
  }
  const T = limb(c, sp.trunk, sp.trunkW, r, sp.seed, 1);
  for (const st of sp.stems) {
    limb(c, st.axis, st.w, r, sp.seed + 900 + st.axis[0][0], 1, T.b.path);
    // the stem does not stop blunt: it runs on as a thin shoot that thins to nothing
    const n = st.axis.length, [ax, ay] = st.axis[n - 2], [bx, by] = st.axis[n - 1];
    const tip = walk(rng(sp.seed + bx), bx, by, Math.atan2(by - ay, bx - ax), 70, 4, .12);
    depthLine(c, tip, 3, .08);
    stroke(c.l, tip, { wid: st.w[1] * 1.1, fun: t => 1 - t * .95, noi: .4, col: 'rgba(22,18,14,.85)', seed: sp.seed + bx, tip: .3, dry: .4 });
  }
  // the fork itself is the stems overlapping as they leave the trunk; no extra crotch marks (in the gap between
  // the stems they float as specks, and any fill there reads as a smudge or a pipe collar)
  // long branches arch out and droop, hung with many fine strands falling almost straight down
  const grow = (x, y, ang, len, w, depth, seed) => {
    const rr = rng(seed), pts = [[x, y]], dir = Math.sign(Math.cos(ang)) || 1;
    let a = ang;
    for (let k = 1; k <= 9; k++) {
      a += dir * (k < 3 ? -.02 : .07 + k * .012) + (rr() - .5) * (rr() < .3 ? .4 : .12);
      pts.push([pts[k - 1][0] + Math.cos(a) * len / 9, pts[k - 1][1] + Math.sin(a) * len / 9]);
    }
    depthLine(c, pts, Math.max(2, w), .08);
    hairyStroke(c.l, smooth(pts, 5), w, seed, { rgb: '20,16,12', alpha: .8, bristles: 6, dryFrom: .3, dryness: .6, streak: len * .4, edge: .7, fade: .3, tipSide: .3, close: 0, profile: t => 1 - t * .85 });
    if (depth === 0) for (const k of [3, 6]) grow(pts[k][0], pts[k][1], a - dir * (.35 + rr() * .3), len * .45, w * .55, 1, seed + k);
    const n = depth ? 10 : 22;
    for (let k = 0; k < n; k++) {
      const t = 2.5 + rr() * 6.5, i = Math.floor(t), u = t - i, q = pts[Math.min(9, i + 1)];
      const p = [pts[i][0] + (q[0] - pts[i][0]) * u, pts[i][1] + (q[1] - pts[i][1]) * u];
      const l = 26 + Math.pow(rr(), 1.2) * 90, s = (rr() - .5) * 12 - dir * 5;
      const tw = [[p[0], p[1]], [p[0] - dir * 3, p[1] + l * .2], [p[0] + s * .5, p[1] + l * .6], [p[0] + s, p[1] + l]];
      depthLine(c, tw, 1.5, .08);
      stroke(c.l, smooth(tw, 4), { wid: .55 + rr() * .5, fun: t => 1 - t * .8, noi: .3, col: `rgba(34,30,24,${.16 + rr() * .3})`, seed: seed + 50 + k, dry: .4 });
    }
  };
  sp.branches.forEach(([x, y, ang, len, w], i) => grow(x, y, ang, len, w, 0, sp.seed + 700 + i * 31));
  // the stems end in young shoots (a bare fork reads as a slingshot): two thin arching rods with strands
  sp.stems.forEach((st, i) => {
    const [x, y] = st.axis[Math.max(1, st.axis.length - 2)];
    grow(x, y, -Math.PI / 2 - .9 + i * .4, 70, 1.6, 1, sp.seed + 950 + i);
    grow(x, y, -Math.PI / 2 + .7 + i * .3, 55, 1.4, 1, sp.seed + 970 + i);
  });
}
