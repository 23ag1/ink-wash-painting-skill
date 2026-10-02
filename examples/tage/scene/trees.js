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

// Ma Yuan's willow (踏歌图), a pollard: a short thick trunk leaning in from the edge, a knobby swollen head wider
// than the trunk, three or four thin straight wands rising from it toward the grove, and one crooked, nearly level
// branch reaching left with short upward side shoots and a sparse fringe of hanging strands.
// The wood is not painted here: every limb (and every lump of the head, as a circle) becomes part of ONE skeleton
// that shaders/tree.frag renders as a single field — joints and lumps merge by construction, nothing floats.
// Only depth and the fine strands are drawn on the canvases.
export function pollardWillow(c, sp, notan) {
  const segs = c.skeleton || (c.skeleton = []);
  const chain = (pts, w0, w1, s0 = 0) => {        // returns the arc length at its tip; a child starts where it leaves its parent
    const L = pts.length - 1;
    let s = s0;
    for (let i = 0; i < L; i++) {
      const s1 = s + Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segs.push([...pts[i], (w0 + (w1 - w0) * i / L) / 2, s, ...pts[i + 1], (w0 + (w1 - w0) * (i + 1) / L) / 2, s1, 0, i === 0 ? 1 : 0]);
      s = s1;
    }
    depthLine(c, pts, (w0 + w1) / 2 + 2, .08);
    return s;
  };
  if (notan) {
    const g = c.w; g.save(); g.globalCompositeOperation = 'multiply'; g.strokeStyle = 'rgba(40,34,28,.9)'; g.lineCap = 'round';
    g.lineWidth = sp.trunkW[0]; g.beginPath(); sp.trunk.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke();
    for (const [x, y, rr] of sp.head) { g.beginPath(); g.arc(x, y, rr, 0, 6.283); g.fillStyle = g.strokeStyle; g.fill(); }
    g.restore(); return;
  }
  const sTop = chain(smooth(sp.trunk, 3), sp.trunkW[0], sp.trunkW[1]);
  // the head: lumps of different sizes fused by the field's smooth union
  const hr = rng(sp.seed + 3);                 // each lump its own darkness: a mottled, knotty mass, dark overall
  for (const [x, y, rr] of sp.head) {
    segs.push([x, y, rr, sTop, x + .5, y + .3, rr, sTop + .5, .38 + hr() * .14, 1]);
    c.d.save(); c.d.fillStyle = grey(.08); c.d.beginPath(); c.d.arc(x, y, rr + 2, 0, 6.283); c.d.fill(); c.d.restore();   // near: no mist over it
  }
  // wands: thin, nearly straight, a slight bow; the longest forks near its top
  sp.wands.forEach(([x, y, ang, len, w, fork], i) => {
    const rr = rng(sp.seed + 40 + i), pts = [[x, y]];          // a slight bow to the right, a tiny wobble — never a ruled ray
    for (let k = 1; k <= 6; k++) { const a = ang + .035 * k + (rr() - .5) * .04; pts.push([pts[k - 1][0] + Math.cos(a) * len / 6, pts[k - 1][1] + Math.sin(a) * len / 6]); }
    const sEnd = chain(smooth(pts, 2), w, w * .3, sTop + 10);
    if (fork) {
      const [fx, fy] = pts[4];
      chain(smooth(walk(rng(sp.seed + 60 + i), fx, fy, ang + .45, len * .3, 4, .1), 2), w * .45, w * .2, sEnd - len * .3);
    }
  });
  // the crooked branch(es): explicit kinked polylines; short side shoots rise from the kinks; strands hang sparse
  const r = rng(sp.seed + 7);
  sp.branches.forEach((br, bi) => {
    const sEnd = chain(smooth(br.pts, 2), br.w, br.w * .2, sTop + 5);
    for (const [k, ang, len] of br.shoots || []) {
      const [x, y] = br.pts[k];
      chain(smooth(walk(rng(sp.seed + 80 + bi * 10 + k), x, y, ang, len, 4, .15), 2), br.w * .45, br.w * .12, sEnd * k / br.pts.length);
    }
    const n = br.strands || 0, P = smooth(br.pts, 4), dir = -1;
    for (let k = 0; k < n; k++) {
      const p = P[Math.floor(P.length * (.3 + .7 * r()))];
      const l = 22 + Math.pow(r(), 1.3) * 80, sx = (r() - .5) * 10 - dir * 3;
      const tw = [[p[0], p[1]], [p[0] - dir * 2, p[1] + l * .25], [p[0] + sx * .5, p[1] + l * .6], [p[0] + sx, p[1] + l]];
      depthLine(c, tw, 1.5, .08);
      stroke(c.l, smooth(tw, 4), { wid: .5 + r() * .45, fun: t => 1 - t * .8, noi: .3, col: `rgba(34,30,24,${.14 + r() * .26})`, seed: sp.seed + 300 + bi * 50 + k, dry: .4 });
    }
  });
}
