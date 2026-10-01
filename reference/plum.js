// Plum branch in the 红梅 manner: slim angular wood that forks again and again, every twig lined with
// coral blossoms and round buds with black sepals, black moss dots along the wood.
// c.l = ink layer (wood, sepals, stamens, dots), c.w = wash layer (petals, softened by the watercolor pass).
import { rng } from '../kit/brush/brush.js';
import { stroke, blob, div } from '../kit/brush/ink.js';

const lerp = (a, b, t) => a + (b - a) * t;
// The branch keeps inside spec.bounds and out of the title box spec.avoid (set by drawPlumBranch)
let outside = () => false;
const CORAL = [[236, 76, 64], [243, 100, 84], [226, 60, 52]];
// Depth within the branch: blossoms "behind" the wood are smaller, paler and more transparent. Taken from a hash
// of the position (not from the generator) so the branch's geometry stays exactly as it was.
const farness = (x, y) => (((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) + 1) % 1 < .4;
function tint([R, G, B], x, y) {
  if (!farness(x, y)) return { rgb: [R, G, B], a: 1, k: 1 };
  return { rgb: [R + (250 - R) * .4, G + (218 - G) * .4, B + (205 - B) * .4].map(Math.round), a: .7, k: .72 };
}

function wood(g, r, a, b, w0, w1) {
  const v = Math.round(20 + r() * 40);
  const col = `rgba(${v},${v - 2},${v - 4},${.85 + r() * .1})`;
  const seed = r() * 100;   // brush side (侧锋) derived from the seed, so the generator sequence stays unchanged
  stroke(g, div([a, b], 10), { wid: 1, fun: t => lerp(w0, w1, t), noi: .45, col, seed, tip: seed % 2 < 1 ? .8 : -.8, dry: .45 });
  g.fillStyle = col;
  g.beginPath(); g.arc(a[0], a[1], w0 * .45, 0, 7); g.fill();
  if (w0 < 3.5) return;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
  g.save();
  g.globalCompositeOperation = 'destination-out';
  for (let j = 0; j < Math.round(w0 * .4); j++) {
    const off = (r() - .5) * .6, t0 = .15 + r() * .5, t1 = Math.min(1, t0 + .2 + r() * .4);
    const P = t => [lerp(a[0], b[0], t) + nx * off * lerp(w0, w1, t), lerp(a[1], b[1], t) + ny * off * lerp(w0, w1, t)];
    stroke(g, div([P(t0), P(t1)], 6), { wid: .5 + r() * .8, noi: .8, col: `rgba(0,0,0,${.4 + r() * .5})`, seed: r() * 100 });
  }
  g.restore();
}

function dots(g, r, x, y, n, spread) {
  for (let i = 0; i < n; i++)
    blob(g, x + (r() - .5) * spread, y + (r() - .5) * spread,
      { len: 1.6 + r() * 1.4, wid: 1.2 + r() * .8, ang: r() * 3, col: 'rgba(14,13,11,.9)', noi: .4, seed: r() * 100 });
}

// Round bud: coral ball, black sepals where it meets the twig
function bud(c, r, x, y, dir, s0) {
  const { rgb: [R, G, B], a: fa, k } = tint(CORAL[Math.floor(r() * 3)], x, y), s = s0 * k;
  blob(c.w, x, y, { len: 5.6 * s, wid: 5.2 * s, ang: dir, col: `rgba(${R},${G},${B},${.9 * fa})`, noi: .35, seed: r() * 100 });
  dots(c.l, r, x - Math.cos(dir) * 2.6 * s, y - Math.sin(dir) * 2.6 * s, 2 + Math.floor(r() * 2), 3 * s);
}

// Open blossom: round coral dabs (five, or four seen from the side), pale heart, black stamens with anthers
function blossom(c, r, x, y, s0) {
  const { rgb: [R, G, B], a: fa, k } = tint(CORAL[Math.floor(r() * 3)], x, y), s = s0 * k;
  const rot = r() * 6.28, side = r() < .35;
  const petals = side ? [-1.1, -.4, .35, 1.1] : [0, 1, 2, 3, 4].map(k => k * 1.2566);
  for (const pa of petals) {
    const a = rot + pa + (r() - .5) * .3;
    blob(c.w, x + Math.cos(a) * 2.9 * s, y + Math.sin(a) * 2.9 * s,
      { len: 6 * s, wid: 5.8 * s, ang: a, col: `rgba(${R},${G},${B},${(.8 + r() * .15) * fa})`, noi: .4, seed: r() * 100 });
  }
  blob(c.w, x, y, { len: 2.4 * s, wid: 2.2 * s, ang: 0, col: 'rgba(252,226,200,.75)', noi: .3, seed: r() * 100 });
  c.l.strokeStyle = 'rgba(40,24,16,.55)'; c.l.lineWidth = .4;
  for (let k = 0; k < 6; k++) {
    const a = side ? rot + (r() - .5) * 2 : r() * 6.28, l = (2 + r() * 1.4) * s;
    c.l.beginPath(); c.l.moveTo(x, y); c.l.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.l.stroke();
    c.l.fillStyle = 'rgba(30,20,14,.75)';
    c.l.beginPath(); c.l.arc(x + Math.cos(a) * l, y + Math.sin(a) * l, .55, 0, 7); c.l.fill();
  }
  if (side) dots(c.l, r, x - Math.cos(rot) * 3 * s, y - Math.sin(rot) * 3 * s, 3, 3 * s);
}

// A twig: angular segments with blossoms and buds strung along it, forking into thinner twigs
function twig(c, r, x, y, ang, len, wid, depth, items) {
  let a = ang, run = 0;
  while (run < len) {
    const L = 14 + r() * 20;
    a += (r() < .5 ? -1 : 1) * (.12 + r() * .3);
    a -= (a - ang) * .45;
    const nx = x + Math.cos(a) * L, ny = y + Math.sin(a) * L;
    if (outside(nx, ny)) break;
    const w0 = wid * (1 - run / len * .7), w1 = wid * (1 - Math.min(1, (run + L) / len) * .7);
    wood(c.l, r, [x, y], [nx, ny], w0, w1);
    if (r() < .6) dots(c.l, r, nx, ny, 1 + Math.floor(r() * 2), 5);
    const n = r() < .3 ? 0 : 1 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) {
      const t = r(), sd = r() < .5 ? -1 : 1, off = w1 * .5 + 2.5 + r() * 2.5;
      items.push({
        x: lerp(x, nx, t) - Math.sin(a) * off * sd, y: lerp(y, ny, t) + Math.cos(a) * off * sd,
        dir: a + sd * Math.PI / 2, open: r() < .5,
      });
    }
    if (depth > 0 && r() < .42)
      twig(c, r, nx, ny, a + (r() < .5 ? -1 : 1) * (.45 + r() * .5), len * (.35 + r() * .25), Math.max(1.4, w1 * .7), depth - 1, items);
    x = nx; y = ny; run += L;
  }
  items.push({ x: x + Math.cos(a) * 3, y: y + Math.sin(a) * 3, dir: a, open: false });
}

export function drawPlumBranch(c, spec) {
  const { bounds: { x: [bx0, bx1], y: [by0, by1] }, avoid } = spec;
  outside = (x, y) => y < by0 || y > by1 || x < bx0 || x > bx1 + 20 || (avoid && x > avoid[0] && y > avoid[1]);
  const r = rng(spec.seed), items = [];
  twig(c, r, ...spec.from, spec.angle, spec.length, spec.width, 3, items);
  if (spec.shoot) twig(c, r, ...spec.shoot.from, spec.shoot.angle, spec.shoot.length, 4, 2, items);
  for (const it of items) {
    if (it.open) blossom(c, r, it.x, it.y, 1.5 + r() * .35);
    else bud(c, r, it.x, it.y, it.dir, 1.2 + r() * .3);
  }
}
