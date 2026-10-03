// The willow, grown as ONE tree and painted as ONE body (after the willow paintings the user gave, and the
// "data tree" rule from Marius Ballot's procedural trees):
//  - one growth graph: the trunk rises from the root and flows on into the main arching limb as a single chain;
//    branches leave along the WHOLE height of the trunk and from every limb; twigs on the branches
//  - thickness from the graph: along every chain it falls continuously to a fine tip; a child starts at ~.85 of
//    its parent's width where it leaves, and thins faster over its shorter path — no jump at any fork
//  - every chain becomes a tapered shape with an uneven edge; all shapes are filled as ONE path, so the tree is a
//    single ink body (没骨, boneless: solid ink, no outlines), wet underneath (it bleeds a little), bristle texture
//    and flying white on top on the thick wood
//  - the willow's strands fall from twig tips in bunches along a thrown-stone curve
import { rng, smooth } from '../../../kit/brush/brush.js';
import { stroke } from '../../../kit/brush/ink.js';
import { hairyStroke } from '../../../kit/brush/hairy.js';
import { grey, depthLine, occlude, glaze } from './layers.js';

const arcLens = P => P.reduce((a, p, i) => (a.push(i ? a[i - 1] + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0), a), []);

// an arching run: starts at angle `ang`, turns by `bend` in total (more toward the tip), crooked
function arch(r, x, y, ang, len, bend, steps = 8) {
  const pts = [[x, y]];
  let a = ang;
  for (let k = 1; k <= steps; k++) {
    a += bend / steps * (.4 + 1.2 * k / steps) + (r() - .5) * .3 + (r() < .3 ? (r() - .5) * .7 : 0);
    pts.push([pts[k - 1][0] + Math.cos(a) * len / steps, pts[k - 1][1] + Math.sin(a) * len / steps]);
  }
  return pts;
}

export function willowTree(c, sp, notan) {
  const r = rng(sp.seed);
  const chains = [];                                                  // { P (smoothed points), W (widths), depth }
  const addChain = (pts, w0, depth, flare = 0) => {
    const P = smooth(pts, 3), S = arcLens(P), L = S[S.length - 1] || 1;
    const W = S.map(s => Math.max(.5, w0 * Math.pow(1 - s / L, .55) * (1 + flare * Math.max(0, 1 - s / L * 12))));   // holds its width, thins at the end
    const ch = { P, W, S, L, depth };
    chains.push(ch);
    return ch;
  };
  const at = (ch, u) => {                                             // point, width, direction at fraction u
    const i = Math.max(0, Math.min(ch.P.length - 2, Math.round(u * (ch.P.length - 1))));
    const [x, y] = ch.P[i], [nx, ny] = ch.P[i + 1];
    return { x, y, w: ch.W[i], a: Math.atan2(ny - y, nx - x) };
  };
  // branches of a chain: alternating sides, uneven spacing, mostly rising (鹿角), each with its own twigs
  const branch = (ch, from, to, count, lenK, depth, seed) => {
    const br = rng(seed);
    let side = br() < .5 ? 1 : -1;
    for (let i = 0; i < count; i++) {
      const u = from + (to - from) * (i + .2 + br() * .6) / count, p = at(ch, u);
      let a = p.a + side * (.55 + br() * .5);
      const up = -Math.PI / 2 - a; a += Math.atan2(Math.sin(up), Math.cos(up)) * .3;
      const len = ch.L * lenK * (.7 + br() * .6) * (1.15 - u * .5);
      // a branch's thickness belongs to its size: a short one is thin from the start even off a thick trunk
      // (start at the parent's width only when the branch is big enough to carry it — else short fat thorns)
      const kid = addChain(arch(br, p.x, p.y, a, len, side * .4, 5), Math.min(p.w * .85, len * .09), depth);
      if (depth < 3 && len > 18) branch(kid, .25, .95, depth === 1 ? 3 : 2, .38, depth + 1, seed + 97 * (i + 1));
      side = -side;
    }
  };

  // 1. the trunk + main leader: one chain from the root, through the S of the trunk, arching out over the path
  const trunkPts = smooth(sp.trunk, 2);
  const [tx, ty] = trunkPts[trunkPts.length - 1], [px, py] = trunkPts[trunkPts.length - 2];
  const lead = arch(r, tx, ty, sp.leader.ang ?? Math.atan2(ty - py, tx - px), sp.leader.len, sp.leader.bend);
  const main = addChain([...trunkPts, ...lead.slice(1)], sp.w0, 0, .3);
  const uTop = arcLens(trunkPts).at(-1) / main.L;                      // where the trunk ends and the crown begins
  // 2. the other limbs of the crown leave the trunk's top, each starting at the trunk's width there
  sp.limbs.forEach(([ang, len, bend], i) => {
    const p = at(main, uTop - .01 * i), lr = rng(sp.seed + 50 + i);
    const kid = addChain(arch(lr, p.x, p.y, ang, len, bend), Math.min(p.w * .85, len * .1), 1);
    branch(kid, .15, .95, 7, .32, 2, sp.seed + 60 + i * 31);
  });
  // 3. branches along the trunk's whole height and along the leader
  branch(main, uTop * .35, uTop * .95, sp.trunkBranches, .18, 1, sp.seed + 70);
  branch(main, uTop + .03, .95, 8, .26, 2, sp.seed + 80);

  if (notan) { const g = new Path2D(); chains.forEach(ch => g.addPath(shape(ch, r))); glaze(c, g, '40,34,28', .9, 0); return; }

  // 4. ONE body: every chain's tapered shape into one path
  const body = new Path2D();
  chains.forEach(ch => body.addPath(shape(ch, r)));
  occlude(c, body, .08);                                              // paper under it: what is behind is hidden
  c.d.save(); c.d.fillStyle = grey(.08); c.d.fill(body); c.d.restore();
  // wet underneath: the wash layer gets the body darkly, so the diffusion softens its edge a little
  c.w.save(); c.w.globalCompositeOperation = 'multiply'; c.w.fillStyle = 'rgba(70,60,48,.75)'; c.w.fill(body); c.w.restore();
  c.wet.save(); c.wet.globalCompositeOperation = 'lighten'; c.wet.fillStyle = grey(.6); c.wet.fill(body); c.wet.restore();
  // the ink itself: one fill, then bristle texture along the thick chains, clipped to the body
  c.l.save(); c.l.fillStyle = 'rgba(20,16,12,.72)'; c.l.fill(body);
  c.l.clip(body);
  chains.filter(ch => ch.W[0] > 5).forEach((ch, k) => {
    const w = ch.W[0];
    for (let j = 0; j < (w > 20 ? 3 : 1); j++) {
      const off = (j - (w > 20 ? 1 : 0)) * .28;
      const P = ch.P.map((p, i) => { const q = ch.P[Math.min(ch.P.length - 1, i + 1)], o = ch.P[Math.max(0, i - 1)], a = Math.atan2(q[1] - o[1], q[0] - o[0]); return [p[0] - Math.sin(a) * ch.W[i] * off, p[1] + Math.cos(a) * ch.W[i] * off]; });
      hairyStroke(c.l, P, w * (w > 20 ? .5 : .9), sp.seed + 200 + k * 7 + j, { rgb: '12,9,7', alpha: .45, bristles: Math.max(6, Math.round(w)), dryFrom: .2, dryness: .7, streak: 70, edge: .5, fade: .3, tipSide: .4, close: 0, profile: t => ch.W[Math.round(t * (ch.W.length - 1))] / w });
    }
    // flying white on the lit (left) side of thick wood: a few pale dry streaks lifted out of the ink
    if (w > 14) for (let j = 0; j < 3; j++) {
      const i0 = Math.floor(r() * ch.P.length * .5), i1 = Math.min(ch.P.length, i0 + 6 + Math.floor(r() * 10)), off = -.15 - r() * .2;
      const P = ch.P.slice(i0, i1).map((p, i) => { const ii = i0 + i, q = ch.P[Math.min(ch.P.length - 1, ii + 1)], o = ch.P[Math.max(0, ii - 1)], a = Math.atan2(q[1] - o[1], q[0] - o[0]); return [p[0] - Math.sin(a) * ch.W[ii] * off, p[1] + Math.cos(a) * ch.W[ii] * off]; });
      if (P.length > 2) { c.l.globalCompositeOperation = 'destination-out'; hairyStroke(c.l, P, w * .18, sp.seed + 300 + k * 5 + j, { rgb: '0,0,0', alpha: .35, bristles: 6, dryFrom: 0, dryness: .8, streak: 40, edge: 0, fade: .3, tipSide: 0, close: 0, profile: t => Math.sin(Math.max(.1, t) * Math.PI) }); c.l.globalCompositeOperation = 'source-over'; }
    }
  });
  c.l.restore();

  // 5. strands: bunches from the tips of the outer twigs and limbs (none from the trunk's own branches low down)
  chains.forEach((ch, k) => {
    if (ch.depth === 0) return;
    const tip = ch.P[ch.P.length - 1], prev = ch.P[ch.P.length - 2], a = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
    if (tip[1] > sp.strandsAbove) return;
    bunch(c, tip[0], tip[1], a, ch.depth === 1 ? 8 : ch.depth === 2 ? 5 : 3, 18 + ch.L * .12, sp.seed + 500 + k * 13);
  });
}

// a chain's tapered shape, its edge uneven (a brush edge is never a clean offset curve)
function shape(ch, r) {
  const { P, W } = ch, n = P.length, L = [], R = [];
  const ph = r() * 6;
  for (let i = 0; i < n; i++) {
    const q = P[Math.min(n - 1, i + 1)], o = P[Math.max(0, i - 1)], a = Math.atan2(q[1] - o[1], q[0] - o[0]);
    const wl = W[i] / 2 * (1 + .08 * Math.sin(i * .7 + ph)), wr = W[i] / 2 * (1 + .08 * Math.sin(i * .9 + ph * 1.7));
    L.push([P[i][0] + Math.sin(a) * wl, P[i][1] - Math.cos(a) * wl]);
    R.push([P[i][0] - Math.sin(a) * wr, P[i][1] + Math.cos(a) * wr]);
  }
  const g = new Path2D();
  [...L, ...R.reverse()].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  return g;
}

function bunch(c, x, y, a, n, reach, seed) {
  const rr = rng(seed);
  for (let k = 0; k < n; k++) {
    const la = a + (rr() - .5) * .7, K = reach * (.3 + rr() * 1.1), L = 25 + Math.pow(rr(), 1.6) * 190;
    const vx = Math.cos(la), vy = Math.min(.2, Math.sin(la)), drift = (rr() - .5) * 10;
    const pts = Array.from({ length: 14 }, (_, i) => { const t = i / 13; return [x + vx * K * t * (1 - t * .55) + drift * t * t, y + vy * K * t + L * t * t]; });
    depthLine(c, pts, 1.5, .08);
    stroke(c.l, smooth(pts, 2), { wid: .45 + rr() * .35, fun: t => 1 - t * .85, noi: .25, col: `rgba(30,26,20,${.14 + Math.pow(rr(), .7) * .4})`, seed: seed + 30 + k, tip: .3, dry: .3 });
  }
}
