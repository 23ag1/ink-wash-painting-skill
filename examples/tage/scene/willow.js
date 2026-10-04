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
import { createTree, growLimb, arcLens, chainShape, strandCurve } from '../../../kit/brush/tree.js';
import { grey, depthLine, occlude, glaze } from './layers.js';

// the willow's choices for the kit's tree mechanics (references/trees.md: species character)
const LIMB = { jitter: .14, kink: .45, stiffness: 3.5, hold: .55 };
const shape = (ch, r) => chainShape(ch, r, .08);

export function willowTree(c, sp, notan) {
  const r = rng(sp.seed);
  const T = createTree(), chains = T.chains, addChain = (pts, w0, depth, flare = 0) => T.addChain(pts, w0, depth, { flare });
  const at = T.at;
  // willow branching: thin whips (width ~.055 × length on twigs) that barely rise and hang (柳条); trunk branches
  // few; twigs on whips one level deep
  const branch = (ch, from, to, count, lenK, depth, seed) => T.branch(ch, {
    from, to, count, lenK, widthPerLen: depth >= 2 ? .055 : .08, spread: .85, narrow: .4, lean: depth >= 2 ? .15 : .25,
    gravity: depth >= 2 ? .75 : .45, steps: 7, collar: .45, depth, seed, limb: LIMB,
    then: (kid, i, len) => { if (depth < 3 && len > 22) branch(kid, .3, .95, depth === 1 ? 4 : 2, .45, depth + 1, seed + 97 * (i + 1)); },
  }, rng);
  const grow = (rr, x, y, ang, len, w0, steps, G) => growLimb(rr, x, y, ang, len, w0, { ...LIMB, steps, gravity: G });

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

function bunch(c, x, y, a, n, reach, seed) {
  const rr = rng(seed);
  for (let k = 0; k < n; k++) {
    const la = a + (rr() - .5) * .7, K = reach * (.3 + rr() * 1.1), L = 50 + Math.pow(rr(), 1.3) * 230;   // willow strands hang long
    const pts = strandCurve(x, y, la, K, L, (rr() - .5) * 10);
    depthLine(c, pts, 1.5, .08);
    stroke(c.l, smooth(pts, 2), { wid: .45 + rr() * .35, fun: t => 1 - t * .85, noi: .25, col: `rgba(30,26,20,${.14 + Math.pow(rr(), .7) * .4})`, seed: seed + 30 + k, tip: .3, dry: .3 });
  }
}
