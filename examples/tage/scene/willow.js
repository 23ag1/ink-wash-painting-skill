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

// a branch grown with gravity, like a cantilever: it bends down more the longer and thinner it is — thick limbs
// hold their direction, thin parts droop more and more toward the tip (the willow's arch comes from this, not
// from a hand-set curve). A little crookedness, an occasional kink.
function grow(r, x, y, ang, len, w0, steps = 8, G = .34) {
  const pts = [[x, y]];
  let a = ang;
  for (let k = 1; k <= steps; k++) {
    const t = k / steps, w = Math.max(.5, w0 * Math.pow(1 - t, .55));
    const sag = G * t / (1 + w / 3.5);                                 // flexibility ~ 1 / thickness, load grows outward
    const down = Math.PI / 2 - a, d = Math.atan2(Math.sin(down), Math.cos(down));
    a += Math.sign(d) * Math.min(Math.abs(d), sag) + (r() - .5) * .14 + (r() < .2 ? (r() - .5) * .45 : 0);
    pts.push([pts[k - 1][0] + Math.cos(a) * len / steps, pts[k - 1][1] + Math.sin(a) * len / steps]);
  }
  return pts;
}

// does a polyline cross another chain (used so a branch never grows through a big limb)
function crosses(pts, chains, skip) {
  const hit = (a, b, c, d) => { const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])); return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b); };
  for (const ch of chains) {
    if (ch === skip || ch.depth > 1) continue;
    for (let i = 2; i < pts.length - 1; i++) for (let j = 0; j < ch.P.length - 1; j += 2) if (hit(pts[i], pts[i + 1], ch.P[j], ch.P[Math.min(ch.P.length - 1, j + 2)])) return true;
  }
  return false;
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
  // branches of a chain: alternating sides, uneven spacing; they leave at 30-50° (narrower toward the parent's
  // tip), lean a little to the light, longer low on the parent (a cone); gravity bends them; a branch that
  // would grow through a big limb takes the other side or is not grown; its base flares into the parent (collar)
  const branch = (ch, from, to, count, lenK, depth, seed) => {
    const br = rng(seed);
    let side = br() < .5 ? 1 : -1;
    for (let i = 0; i < count; i++) {
      const u = from + (to - from) * (i + .2 + br() * .6) / count, p = at(ch, u);
      const len = ch.L * lenK * (.7 + br() * .6) * (1.2 - u * .6), w0 = Math.min(p.w * .85, len * (depth >= 2 ? .055 : .08));   // willow whips are thin
      let kidPts = null;
      for (const sd of [side, -side]) {
        let a = p.a + sd * (.85 - .4 * u + (br() - .5) * .2);
        const up = -Math.PI / 2 - a; a += Math.atan2(Math.sin(up), Math.cos(up)) * (depth >= 2 ? .15 : .25);
        const pts = grow(br, p.x, p.y, a, len, w0, 7, depth >= 2 ? .75 : .45);   // whips arch over and hang (柳条)
        if (!crosses(pts, chains, ch)) { kidPts = pts; break; }
      }
      side = -side;
      if (!kidPts) continue;
      const kid = addChain(kidPts, w0, depth, .45);
      if (depth < 3 && len > 22) branch(kid, .3, .95, depth === 1 ? 4 : 2, .45, depth + 1, seed + 97 * (i + 1));
    }
  };

  // 1. the trunk + main leader: one chain from the root, through the S of the trunk, arching out over the path
  const trunkPts = smooth(sp.trunk, 2);
  const [tx, ty] = trunkPts[trunkPts.length - 1], [px, py] = trunkPts[trunkPts.length - 2];
  const lead = grow(r, tx, ty, sp.leader.ang, sp.leader.len, sp.w0 * .55, 10, sp.leader.G);
  const main = addChain([...trunkPts, ...lead.slice(1)], sp.w0, 0, .15);
  const uTop = arcLens(trunkPts).at(-1) / main.L;                      // where the trunk ends and the crown begins
  // the pollard head (Ma Yuan's willow): the trunk swells into a knuckle where all the limbs leave together
  main.W = main.W.map((w, i) => w * (1 + .38 * Math.exp(-Math.pow((main.S[i] / main.L - uTop) / .035, 2))));
  // roots: the base spreads and grips the ground — the tree grows out of the bank, it is not stood on it
  const [bx, by] = sp.trunk[0];
  for (const [ang, len, w] of sp.roots) { const rr = rng(sp.seed + 30 + Math.round(ang * 10)); const pts = [[bx, by - 8]]; let a = ang; for (let k = 1; k <= 4; k++) { a += (rr() - .5) * .3; pts.push([pts[k - 1][0] + Math.cos(a) * len / 4, pts[k - 1][1] + Math.sin(a) * len / 4]); } addChain(pts, w, -1); }
  // 2. the other limbs of the crown leave the trunk's top, each starting at the trunk's width there
  sp.limbs.forEach(([ang, len, G], i) => {
    const p = at(main, uTop - .01 * i), lr = rng(sp.seed + 50 + i), w0 = Math.min(p.w * .85, len * .1);
    const kid = addChain(grow(lr, p.x, p.y, ang, len, w0, 10, G), w0, 1, .45);
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
      if (P.length > 2) { c.l.globalCompositeOperation = 'destination-out'; hairyStroke(c.l, P, w * .18, sp.seed + 300 + k * 5 + j, { rgb: '0,0,0', alpha: .22, bristles: 6, dryFrom: 0, dryness: .8, streak: 40, edge: 0, fade: .3, tipSide: 0, close: 0, profile: t => Math.sin(Math.max(.1, t) * Math.PI) }); c.l.globalCompositeOperation = 'source-over'; }
    }
  });
  c.l.restore();

  // the base half hidden in the bank: a soft wet ground shadow and grass over the foot (no cut-off bottom)
  {
    const [bx, by] = sp.trunk[0], gr = rng(sp.seed + 900);
    c.w.save(); c.w.globalCompositeOperation = 'multiply'; c.w.filter = `blur(${4 * c.S}px)`; c.w.fillStyle = 'rgba(70,60,46,.4)';
    c.w.beginPath(); c.w.ellipse(bx - 4, by + 3, 56, 8, 0, 0, 6.283); c.w.fill(); c.w.restore();
    for (let i = 0; i < 18; i++) {
      const x = bx - 48 + gr() * 96, y = by + 2 + gr() * 6, h = 8 + gr() * 16, lean = (gr() - .5) * 8;
      stroke(c.l, smooth([[x, y], [x + lean * .4, y - h * .55], [x + lean, y - h]], 3), { wid: .9 + gr() * .8, fun: t => 1 - t * .9, noi: .3, col: `rgba(22,18,14,${.55 + gr() * .3})`, seed: sp.seed + 910 + i, tip: .3, dry: .3 });
    }
  }

  // 5. strands: bunches from the tips of the outer twigs and limbs (none from the trunk's own branches low down)
  chains.forEach((ch, k) => {
    if (ch.depth <= 0) return;
    const tip = ch.P[ch.P.length - 1], prev = ch.P[ch.P.length - 2], a = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
    if (tip[1] > sp.strandsAbove) return;
    bunch(c, tip[0], tip[1], a, ch.depth === 1 ? 10 : ch.depth === 2 ? 7 : 4, 18 + ch.L * .12, sp.seed + 500 + k * 13);
    if (ch.depth <= 2) for (let j = 0; j < 3; j++) {                   // more hanging along the outer half: the curtain
      const i = Math.floor(ch.P.length * (.45 + .5 * (j + .5) / 3)), q = ch.P[i], q2 = ch.P[Math.min(ch.P.length - 1, i + 1)];
      if (q[1] < sp.strandsAbove) bunch(c, q[0], q[1], Math.atan2(q2[1] - q[1], q2[0] - q[0]), 3, 12, sp.seed + 700 + k * 17 + j);
    }
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
    const la = a + (rr() - .5) * .7, K = reach * (.3 + rr() * 1.1), L = 50 + Math.pow(rr(), 1.3) * 230;   // willow strands hang long
    const vx = Math.cos(la), vy = Math.min(.2, Math.sin(la)), drift = (rr() - .5) * 10;
    const pts = Array.from({ length: 14 }, (_, i) => { const t = i / 13; return [x + vx * K * t * (1 - t * .55) + drift * t * t, y + vy * K * t + L * t * t]; });
    depthLine(c, pts, 1.5, .08);
    stroke(c.l, smooth(pts, 2), { wid: .45 + rr() * .35, fun: t => 1 - t * .85, noi: .25, col: `rgba(30,26,20,${.14 + Math.pow(rr(), .7) * .4})`, seed: seed + 30 + k, tip: .3, dry: .3 });
  }
}
