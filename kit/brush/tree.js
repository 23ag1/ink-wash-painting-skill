// Tree mechanics — grow any branching plant as ONE graph and get its parts as tapered shapes to paint as ONE body.
// Mechanics only (no look, no species): you choose every parameter from the species you studied (willow, pine,
// plum, bare winter tree, bamboo is different — see references/trees.md). Required options throw when missing.
//
//   const T = createTree();
//   const trunk = T.addChain(points, 30, 0, { flare: .15, hold: .55 });         // root → crown, one chain
//   T.branch(trunk, { from: .3, to: .95, count: 5, lenK: .25, widthPerLen: .08, spread: .85, narrow: .4,
//                     lean: .25, gravity: .45, steps: 7, collar: .45, depth: 1, seed: 7, then: (kid) => {...} });
//   const body = new Path2D(); T.chains.forEach(ch => body.addPath(chainShape(ch, r, .08)));   // fill ONCE
//
// Why this shape of API (each rule came from a failure, references/pitfalls.md "Structure: trees", "Joints"):
//  - thickness falls continuously along every chain; a child starts at its parent's width WHERE it leaves,
//    capped by its own size (min(parent width, widthPerLen × length)) — no jump at a fork, no fat short thorns
//  - gravity like a cantilever: the bend grows toward the tip and with thinness (thick limbs hold their line)
//  - a branch that would cross a big limb takes the other side or is not grown
//  - a collar: the child flares into its parent over its first ~8%
//  - all chains filled as ONE path: the tree is one body (separate shapes always show seams at the joints)
import { smooth } from './brush.js';

export const arcLens = P => P.reduce((a, p, i) => (a.push(i ? a[i - 1] + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0), a), []);

const need = (o, keys, who) => { const m = keys.filter(k => o[k] === undefined); if (m.length) throw new Error(`${who}: missing ${m.join(', ')}`); };

// a limb grown with gravity: per step the direction turns toward straight down by gravity·t / (1 + w / stiffness)
// (t = 0 at its base .. 1 at its tip, w = its width there), plus small jitter and an occasional kink
export function growLimb(r, x, y, ang, len, w0, o) {
  need(o, ['steps', 'gravity', 'stiffness', 'jitter', 'kink', 'hold'], 'growLimb');
  const pts = [[x, y]];
  let a = ang;
  for (let k = 1; k <= o.steps; k++) {
    const t = k / o.steps, w = Math.max(.5, w0 * Math.pow(1 - t, o.hold));
    const sag = o.gravity * t / (1 + w / o.stiffness);
    const down = Math.PI / 2 - a, d = Math.atan2(Math.sin(down), Math.cos(down));
    a += Math.sign(d) * Math.min(Math.abs(d), sag) + (r() - .5) * o.jitter + (r() < .2 ? (r() - .5) * o.kink : 0);
    pts.push([pts[k - 1][0] + Math.cos(a) * len / o.steps, pts[k - 1][1] + Math.sin(a) * len / o.steps]);
  }
  return pts;
}

// does a polyline cross any chain of depth ≤ maxDepth (other than `skip`)
export function crosses(pts, chains, skip, maxDepth = 1) {
  const hit = (a, b, c, d) => { const o = (p, q, s) => Math.sign((q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0])); return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b); };
  for (const ch of chains) {
    if (ch === skip || ch.depth > maxDepth) continue;
    for (let i = 2; i < pts.length - 1; i++) for (let j = 0; j < ch.P.length - 1; j += 2) if (hit(pts[i], pts[i + 1], ch.P[j], ch.P[Math.min(ch.P.length - 1, j + 2)])) return true;
  }
  return false;
}

export function createTree() {
  const chains = [];
  // a chain: smoothed points P, arc lengths S, total L, widths W (hold = taper exponent: < 1 keeps its width longer)
  const addChain = (pts, w0, depth, { flare = 0, hold = .55 } = {}) => {
    const P = smooth(pts, 3), S = arcLens(P), L = S[S.length - 1] || 1;
    const W = S.map(s => Math.max(.5, w0 * Math.pow(1 - s / L, hold) * (1 + flare * Math.max(0, 1 - s / L * 12))));
    const ch = { P, W, S, L, depth };
    chains.push(ch);
    return ch;
  };
  const at = (ch, u) => {                                              // point, width, direction at fraction u
    const i = Math.max(0, Math.min(ch.P.length - 2, Math.round(u * (ch.P.length - 1))));
    const [x, y] = ch.P[i], [nx, ny] = ch.P[i + 1];
    return { x, y, w: ch.W[i], a: Math.atan2(ny - y, nx - x) };
  };
  // children along a chain: alternating sides, uneven spacing, departure angle `spread` narrowing by `narrow`
  // toward the parent's tip, leaning `lean` toward the light, longer low on the parent; gravity bends them
  const branch = (ch, o, rng) => {
    need(o, ['from', 'to', 'count', 'lenK', 'widthPerLen', 'spread', 'narrow', 'lean', 'gravity', 'steps', 'collar', 'depth', 'seed', 'limb'], 'branch');
    const br = rng(o.seed);
    let side = br() < .5 ? 1 : -1;
    for (let i = 0; i < o.count; i++) {
      const u = o.from + (o.to - o.from) * (i + .2 + br() * .6) / o.count, p = at(ch, u);
      const len = ch.L * o.lenK * (.7 + br() * .6) * (1.2 - u * .6), w0 = Math.min(p.w * .85, len * o.widthPerLen);
      let kidPts = null;
      for (const sd of [side, -side]) {
        let a = p.a + sd * (o.spread - o.narrow * u + (br() - .5) * .2);
        const up = -Math.PI / 2 - a; a += Math.atan2(Math.sin(up), Math.cos(up)) * o.lean;
        const pts = growLimb(br, p.x, p.y, a, len, w0, { ...o.limb, steps: o.steps, gravity: o.gravity });
        if (!crosses(pts, chains, ch)) { kidPts = pts; break; }
      }
      side = -side;
      if (!kidPts) continue;
      const kid = addChain(kidPts, w0, o.depth, { flare: o.collar });
      if (o.then) o.then(kid, i, len);
    }
  };
  return { chains, addChain, at, branch };
}

// a chain's tapered outline with an uneven edge (a brush edge is never a clean offset curve)
export function chainShape(ch, r, edge) {
  const { P, W } = ch, n = P.length, L = [], R = [];
  const ph = r() * 6;
  for (let i = 0; i < n; i++) {
    const q = P[Math.min(n - 1, i + 1)], o = P[Math.max(0, i - 1)], a = Math.atan2(q[1] - o[1], q[0] - o[0]);
    const wl = W[i] / 2 * (1 + edge * Math.sin(i * .7 + ph)), wr = W[i] / 2 * (1 + edge * Math.sin(i * .9 + ph * 1.7));
    L.push([P[i][0] + Math.sin(a) * wl, P[i][1] - Math.cos(a) * wl]);
    R.push([P[i][0] - Math.sin(a) * wr, P[i][1] + Math.cos(a) * wr]);
  }
  const g = new Path2D();
  [...L, ...R.reverse()].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  return g;
}

// a hanging strand (willow, wisteria, moss): out along the twig, a little up, then over and down — the curve of
// a thrown stone. reach: how far it carries along the twig; length: how far it falls; drift: sideways at the end
export function strandCurve(x, y, ang, reach, length, drift, samples = 14) {
  const vx = Math.cos(ang), vy = Math.min(.2, Math.sin(ang));
  return Array.from({ length: samples }, (_, i) => { const t = i / (samples - 1); return [x + vx * reach * t * (1 - t * .55) + drift * t * t, y + vy * reach * t + length * t * t]; });
}
