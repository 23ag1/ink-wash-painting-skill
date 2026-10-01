// Pines and the willow, after Ma Yuan. Pines: a bent dark trunk, near-horizontal branches turning down at the
// ends, needles as fans of short fine strokes (松针) over a soft dark pad. Willow: a gnarled trunk in dry brush,
// a few upward boughs, thin hanging strands.
import { rng, smooth } from '../../../kit/brush/brush.js';
import { stroke, blob, div, quad, walk } from '../../../kit/brush/ink.js';
import { hairyStroke } from '../../../kit/brush/hairy.js';
import { glaze, grey, depthLine } from './layers.js';

// one needle cluster (松针): a few overlapping irregular dark dabs, and fine needles fanning from its upper edge
// and sides — at a distance only the dabs remain
function pad(c, r, x, y, rad, tone, seed, fine) {
  const k = 2 + Math.floor(r() * 3);
  for (let i = 0; i < k; i++) {
    const bx = x + (r() - .5) * rad * 1.2, by = y + (r() - .5) * rad * .4;
    blob(c.l, bx, by, { len: rad * (1 + r() * .7), wid: rad * (.35 + r() * .25), ang: (r() - .5) * .5, col: `rgba(30,32,24,${(.25 + .45 * tone) * (fine ? .8 : 1)})`, noi: .7, seed: seed + i * 3 });
  }
  if (!fine) return;
  const n = Math.round(8 + rad * 1.1);
  for (let i = 0; i < n; i++) {
    const a = Math.PI + .1 + (i / (n - 1)) * (Math.PI - .2) + (r() - .5) * .3;
    const l = rad * (.55 + r() * .6), ox = x + (r() - .5) * rad * .8, oy = y + rad * .1;
    stroke(c.l, [[ox, oy], [ox + Math.cos(a) * l, oy + Math.sin(a) * l * .7]], { wid: .8 + .5 * tone, fun: t => 1 - t * .8, noi: .3, col: `rgba(22,24,16,${.4 + .45 * tone})`, seed: seed + 20 + i, dry: .3 });
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
  stroke(c.l, trunk, { wid: sp.h * .045, fun: t => 1 - t * .7, noi: .5, col: `rgba(28,24,20,${.5 + .4 * sp.tone})`, seed: sp.seed, tip: .6, dry: .35 });
  // branches from the upper trunk, alternating sides, nearly horizontal, pads at the ends and along
  const nb = 7 + Math.floor(r() * 5);
  for (let i = 0; i < nb; i++) {
    const t = sp.bare + (i / nb) * (.98 - sp.bare) + (r() - .5) * .05;
    const [bx, by] = trunk[Math.round(t * (trunk.length - 1))];
    const side = i % 2 ? 1 : -1, len = sp.h * (.18 + .3 * (1 - t) + r() * .1);
    const end = [bx + side * len, by + len * (.1 + r() * .3)];
    stroke(c.l, quad([bx, by], [bx + side * len * .5, by - len * .12], end, 8), { wid: sp.h * .016, fun: t => 1 - t * .6, noi: .5, col: `rgba(30,26,22,${.45 + .4 * sp.tone})`, seed: sp.seed + 10 + i, dry: .4 });
    pad(c, r, end[0], end[1] - 2, sp.h * (.13 + r() * .07), sp.tone, sp.seed + 40 + i * 9, fine);
    pad(c, r, bx + side * len * (.35 + r() * .3), by - len * .05 - 3, sp.h * (.1 + r() * .05), sp.tone, sp.seed + 80 + i * 9, fine);
  }
  pad(c, r, top[0], top[1] + sp.h * .04, sp.h * .1, sp.tone, sp.seed + 99, fine);
}

// spec: { base, path: trunk points base → crotch, boughs: [[points]], strands: n, seed }
export function willow(c, sp, notan) {
  const r = rng(sp.seed);
  const trunk = smooth(sp.trunk, 8);
  c.d.save(); c.d.strokeStyle = grey(.08); c.d.lineWidth = 52; c.d.beginPath(); trunk.forEach((p, i) => (i ? c.d.lineTo(...p) : c.d.moveTo(...p))); c.d.stroke(); c.d.restore();
  if (notan) { c.w.save(); c.w.globalCompositeOperation = 'multiply'; c.w.strokeStyle = 'rgb(60,52,44)'; c.w.lineWidth = 22; c.w.beginPath(); trunk.forEach((p, i) => (i ? c.w.lineTo(...p) : c.w.moveTo(...p))); c.w.stroke(); c.w.restore(); return; }
  // the trunk in dry brush, gnarled: two passes, the second narrower and offset
  hairyStroke(c.l, trunk, 46, sp.seed, { rgb: '20,16,12', alpha: .82, bristles: 46, dryFrom: .2, dryness: .9, streak: 60, edge: 1, fade: .3, close: .3, profile: t => 1.15 - t * .45 + .12 * Math.sin(t * 19) });
  hairyStroke(c.l, trunk.map(([x, y]) => [x + 10, y]), 22, sp.seed + 1, { rgb: '12,10,8', alpha: .8, bristles: 14, dryFrom: .1, dryness: .8, streak: 40, edge: .5, fade: .2, close: 0, profile: t => 1 - t * .5 });
  for (let i = 0; i < 6; i++) {                                           // knots
    const p = trunk[Math.floor(r() * trunk.length)];
    blob(c.l, p[0] + (r() - .5) * 14, p[1], { len: 10 + r() * 8, wid: 6 + r() * 4, ang: r() * 3, col: 'rgba(14,11,8,.85)', noi: .6, seed: sp.seed + 20 + i });
  }
  // boughs reaching up, thinning; strands hanging from them
  sp.boughs.forEach((b, bi) => {
    const pts = smooth(b, 6);
    depthLine(c, pts, 8, .08);
    hairyStroke(c.l, pts, 13 - bi * 2, sp.seed + 50 + bi, { rgb: '20,16,12', alpha: .75, bristles: 12, dryFrom: .3, dryness: .7, streak: 50, edge: .8, fade: .4, close: 0, profile: t => 1 - t * .85 });
    if (false) stroke(c.l, pts, { wid: 9, fun: t => 1 - t * .85, noi: .55, col: 'rgba(22,18,14,.85)', seed: sp.seed + 50 + bi, tip: .6, dry: .5 });
    for (let k = 0; k < sp.strands; k++) {
      const [x, y] = pts[Math.floor((.25 + r() * .75) * (pts.length - 1))];
      const len = 90 + r() * 200, sway = (r() - .3) * 30;
      depthLine(c, [[x, y], [x + sway + 10, y + len * .35], [x + sway * 1.6, y + len]], 3, .08);
      stroke(c.l, quad([x, y], [x + sway + 10, y + len * .35], [x + sway * 1.6, y + len], 14), { wid: 1.1 + r() * .7, fun: t => 1 - t * .7, noi: .3, col: `rgba(30,28,22,${.5 + r() * .35})`, seed: sp.seed + 100 + bi * 40 + k, dry: .4 });
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
    const pts = walk(r, x, y, ang, len, 5, .35);
    depthLine(c, pts, 8, .1);
    stroke(c.l, pts, { wid: w, fun: t => 1 - t * .6, noi: .5, col: 'rgba(24,20,16,.8)', seed: sp.seed + depth * 7 + x, dry: .5 });
    if (depth < 3) for (let i = 0; i < 2 + (depth < 1 ? 1 : 0); i++) {
      const p = pts[2 + Math.floor(r() * 3)];
      grow(p[0], p[1], ang + (r() - .5) * 1.4, len * (.5 + r() * .25), w * .55, depth + 1);
    }
  };
  grow(sp.x, sp.y, sp.ang, sp.len, 5, 0);
}
