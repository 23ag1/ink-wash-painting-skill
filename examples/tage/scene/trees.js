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
// the dark knotty head of short heavy strokes, then the arching limbs of the crown — their strokes start
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
  // the trunk is written with the SAME brush as the limbs, only thicker: several overlapping loaded strokes with
  // flying white; its edge is the brush's own ragged edge (no filled shape with a clean edge — that reads as a
  // plank), no circles or outlined lumps (a cartoon flower). 树无一寸直: the axis gets small crooks.
  const raw = sp.trunk.map(([x, y], i) => (i && i < sp.trunk.length - 1 ? [x + (r() - .5) * 7, y + (r() - .5) * 4] : [x, y]));
  const ax = smooth(raw, 4), n = ax.length;
  const W = ax.map((_, i) => { const t = i / (n - 1); return sp.trunkW[0] + (sp.trunkW[1] - sp.trunkW[0]) * t + Math.max(0, t - .82) / .18 * 9; });  // swells into the pollard knuckle
  const along = k => offsetLine(ax, k, W);
  const [hx, hy] = sp.headAt;
  if (notan) { hairyStroke(c.w, ax, sp.trunkW[0], sp.seed, { rgb: '40,34,28', alpha: .9, bristles: 20, dryFrom: 1, dryness: 0, streak: 100, edge: 0, fade: 0, tipSide: 0, close: 1, profile: t => 1 - t * .3 }); return; }
  // the bank behind is hidden by paper under a band NARROWER than the brushwork (the edge stays the brush's)
  occlude(c, poly([...offsetLine(ax, -1, W.map(w => w * .34)), ...offsetLine(ax, 1, W.map(w => w * .34)).reverse()]), .08);
  depthLine(c, ax, sp.trunkW[0], .08);

  // 1. one wet stroke under everything: the body tone, it bleeds a little at the edges
  hairyStroke(c.w, ax, sp.trunkW[0] * .92, sp.seed + 1, { rgb: '96,82,66', alpha: .45, bristles: 28, dryFrom: .7, dryness: .25, streak: 120, edge: .4, fade: .1, tipSide: .3, close: .3, profile: t => W[Math.round(t * (n - 1))] / sp.trunkW[0] });
  hairyStroke(c.wet, ax, sp.trunkW[0], sp.seed + 3, { rgb: '255,255,255', alpha: .6, bristles: 20, dryFrom: .9, dryness: .1, streak: 120, edge: 0, fade: 0, tipSide: 0, close: .5, profile: t => W[Math.round(t * (n - 1))] / sp.trunkW[0] });
  // 2. the bark: overlapping loaded strokes side by side, each starting and ending at its own place (broken),
  //    the shadow side (right) dark and fuller, the lit side drier with more flying white
  const lanes = 4;
  for (let j = 0; j < lanes; j++) {
    const k = -.27 + j * (.54 / (lanes - 1)) + (r() - .5) * .05, shadow = k > 0;
    const seg = along(k).slice(0, n - Math.floor(r() * 2));             // the full length: no blunt ends mid-trunk
    hairyStroke(c.l, seg, sp.trunkW[0] * (.4 + r() * .1), sp.seed + 20 + j, { rgb: '16,12,9', alpha: shadow ? .78 + r() * .1 : .5 + r() * .12, bristles: 18, dryFrom: shadow ? .4 : .2, dryness: shadow ? .4 : .55, streak: 90, edge: .5, fade: .2, tipSide: shadow ? .8 : -.5, close: 0,
      profile: t => Math.sqrt(Math.min(1, t / .08, (1 - t) / .1)) * (1 - t * .2) });   // soft at both ends, melting into the knuckle
  }
  // 3. scars: a few short dark strokes slanting across the grain (never round blobs)
  for (let i = 0; i < 3; i++) {
    const j = 3 + Math.floor(r() * (n - 8)), [x, y] = along(-.05 + r() * .3)[j], a = Math.atan2(ax[j + 1][1] - ax[j][1], ax[j + 1][0] - ax[j][0]) + 1.1 + (r() - .5) * .4, l = W[j] * (.25 + r() * .15);
    hairyStroke(c.l, [[x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2], [x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2]], 3 + r() * 2, sp.seed + 60 + i, { rgb: '10,8,6', alpha: .8, bristles: 6, dryFrom: .3, dryness: .4, streak: 10, edge: .5, fade: .3, tipSide: .5, close: .5, profile: t => Math.sin(Math.max(.2, t) * Math.PI) });
  }
  // 4. the pollard knuckle: short thick strokes out of the trunk's top toward each limb — the limbs then start
  //    pressed inside them, so every joint is ink over ink
  sp.limbs.forEach(([x, y, ang, , w], i) => {
    const sx = hx + (r() - .5) * 6, sy = hy + 6 + r() * 4, l = Math.hypot(x - sx, y - sy) + 6, a = Math.atan2(y - sy, x - sx);
    hairyStroke(c.l, [[sx, sy], [sx + Math.cos(a) * l * .55 + (r() - .5) * 3, sy + Math.sin(a) * l * .55], [sx + Math.cos(a) * l, sy + Math.sin(a) * l]], w * 1.5, sp.seed + 80 + i,
      { rgb: '14,11,8', alpha: .85, bristles: 12, dryFrom: .4, dryness: .45, streak: 25, edge: .6, fade: .2, tipSide: .6, close: 0, profile: t => 1.1 - t * .35 });
  });

  // 3. the crown, after real willow paintings (and the scroll): limbs RISE AND ARCH OVER, painted with a loaded
  //    brush, uneven, with nodes; each carries many short angular branchlets, mostly upward (鹿角); the strands fall
  //    from the twig tips in BUNCHES along a thrown-stone curve — out and a little up along the twig, then over and
  //    down — never straight hairs stuck on a stick. Every limb starts inside the dark head (the joint hides there),
  //    every branchlet starts pressed from its parent's stroke.
  const bunch = (x, y, a, n, reach, seed) => {
    const rr = rng(seed);
    for (let k = 0; k < n; k++) {
      const la = a + (rr() - .5) * .7, K = reach * (.3 + rr() * 1.1), L = 25 + Math.pow(rr(), 1.6) * 190;
      const vx = Math.cos(la), vy = Math.min(.2, Math.sin(la)), drift = (rr() - .5) * 10;
      const pts = Array.from({ length: 14 }, (_, i) => { const t = i / 13; return [x + vx * K * t * (1 - t * .55) + drift * t * t, y + vy * K * t + L * t * t]; });
      depthLine(c, pts, 1.5, .08);
      stroke(c.l, smooth(pts, 2), { wid: .45 + rr() * .35, fun: t => 1 - t * .85, noi: .25, col: `rgba(30,26,20,${.14 + Math.pow(rr(), .7) * .4})`, seed: seed + 30 + k, tip: .3, dry: .3 });
    }
  };
  const limb = (x, y, ang, len, w, bend, d, seed) => {
    const rr = rng(seed), steps = 7, pts = [[x, y]];
    let a = ang;
    for (let k = 1; k <= steps; k++) {
      a += bend / steps * (.4 + 1.2 * k / steps) + (rr() - .5) * .3 + (rr() < .3 ? (rr() - .5) * .8 : 0);   // crooked, never a clean arc
      pts.push([pts[k - 1][0] + Math.cos(a) * len / steps, pts[k - 1][1] + Math.sin(a) * len / steps]);
    }
    const w1 = Math.max(.6, w * .22), wAt = t => w + (w1 - w) * t;
    depthLine(c, pts, w + 2, .08);
    const P = smooth(pts, 3);
    if (w > 2.4) hairyStroke(c.l, P, w, seed, { rgb: '18,14,10', alpha: .85, bristles: Math.max(6, Math.round(w * 1.4)), dryFrom: .55, dryness: .3, streak: len * .6, edge: .7, fade: .2, tipSide: .3, close: 0, profile: t => (t < .05 ? 1.15 : 1) * (wAt(t) / w) });   // no width ripple, little dry: cross-bands read as bamboo
    else stroke(c.l, P, { wid: w, fun: t => (t < .06 ? 1.15 : 1) * wAt(t) / w, noi: .45, col: 'rgba(20,16,12,.85)', seed, tip: .35, dry: .4 });
    if (d < 2) {
      const n = d === 0 ? 5 + Math.floor(rr() * 3) : 2 + Math.floor(rr() * 2);
      let side = rr() < .5 ? 1 : -1;
      for (let i = 0; i < n; i++) {
        const t = .22 + (i + .15 + rr() * .7) / n * .74, k = Math.min(steps - 1, Math.floor(t * steps)), u = t * steps - k;
        const bx = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u, by = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u;
        const da = Math.atan2(pts[k + 1][1] - pts[k][1], pts[k + 1][0] - pts[k][0]);
        let ca = da + side * (.55 + rr() * .5);
        const up = -Math.PI / 2 - ca; ca += Math.atan2(Math.sin(up), Math.cos(up)) * .3;          // branchlets lean up
        limb(bx, by, ca, len * (.24 + rr() * .18) * (d ? .8 : 1), wAt(t) * .6, side * .35, d + 1, seed + 17 * (i + 1));
        side = -side;
      }
    }
    if (d >= 1 || rr() < .9) bunch(pts[steps][0], pts[steps][1], a, d === 0 ? 7 : d === 1 ? 5 : 3, 18 + len * .12, seed + 500);
  };
  sp.limbs.forEach(([x, y, ang, len, w, bend], i) => limb(x, y, ang, len, w, bend, 0, sp.seed + 1000 + i * 131));

}
