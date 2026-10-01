// Trees and reeds built from noisy strokes and blobs (ink.js). c.w = wash layer (watercolor-softened), c.l = crisp ink.
import { rng } from '../kit/brush/brush.js';
import { stroke, blob, div, walk } from '../kit/brush/ink.js';

const taper = t => 1 - t * .6;

// Trunk: pale wash body with two living outline strokes
function trunk(c, r, pts, w) {
  const p = div(pts, 6);
  stroke(c.w, p, { wid: w, fun: taper, noi: .3, col: 'rgba(120,110,96,.32)', seed: r() * 99 });
  const side = k => p.map(([x, y], i) => [x + k * w * .45 * taper(i / p.length), y]);
  stroke(c.l, side(-1), { wid: 1.7, fun: t => .6 + .4 * Math.sin(t * Math.PI), noi: .6, col: 'rgba(24,22,19,.9)', seed: r() * 99 });
  stroke(c.l, side(1), { wid: 1.3, fun: t => .5 + .5 * Math.sin(t * Math.PI), noi: .7, col: 'rgba(24,22,19,.7)', seed: r() * 99 });
}

// Foliage clump: pale wash beds -> mid-tone leaves -> small dark "dot leaves" weighted to the shaded underside
function clump(c, r, cx, cy, s, dark = 1) {
  for (let i = 0; i < 4; i++)
    blob(c.w, cx + (r() - .5) * 16 * s, cy + (r() - .5) * 6 * s,
      { len: (18 + r() * 10) * s, wid: (9 + r() * 5) * s, ang: (r() - .5) * .4, col: `rgba(92,98,92,${.16 * dark})`, noi: .6, seed: r() * 99 });
  for (let i = 0; i < 14; i++) {
    const a = r() * 6.28, rr = Math.sqrt(r());
    blob(c.w, cx + Math.cos(a) * rr * 15 * s, cy + Math.sin(a) * rr * 7 * s,
      { len: (6 + r() * 5) * s, wid: (3 + r() * 2) * s, ang: (r() - .5) * .6, col: `rgba(52,56,52,${(.3 + r() * .25) * dark})`, noi: .5, seed: r() * 99 });
  }
  for (let i = 0; i < 26; i++) {
    const a = r() * 6.28, rr = Math.sqrt(r());
    const y = cy + Math.abs(Math.sin(a)) * rr * 7 * s * (r() < .7 ? 1 : -1);
    blob(c.l, cx + Math.cos(a) * rr * 15 * s, y,
      { len: (3 + r() * 3.5) * s, wid: (1.6 + r() * 1.4) * s, ang: (r() - .5) * .5, col: `rgba(16,18,16,${(.5 + r() * .4) * dark})`, noi: .4, seed: r() * 99 });
  }
}

export function drawBroadleaf(c, x, y, s, seed) {
  const r = rng(seed);
  const stem = walk(r, x, y, -Math.PI / 2, 34 * s, 4, .1);
  trunk(c, r, stem, 5.5 * s);
  const [tx, ty] = stem[stem.length - 1];
  const tips = [];
  for (let i = 0; i < 7; i++) {
    const ang = -Math.PI / 2 + (i / 6 - .5) * 2.6 + (r() - .5) * .3;
    const b = walk(r, tx, ty, ang, (22 + r() * 16) * s, 3, .3);
    stroke(c.l, div(b, 4), { wid: 2 * s, fun: taper, noi: .4, col: 'rgba(28,26,23,.85)', seed: r() * 99 });
    tips.push(b[b.length - 1], b[1]);
  }
  tips.sort((a, b) => a[1] - b[1]);
  tips.forEach(([cx, cy], i) => clump(c, r, cx, cy - 2 * s, s * (.7 + r() * .3), .8 + .3 * (i / tips.length)));
}

export function drawPine(c, x, y, s, seed) {
  const r = rng(seed);
  const stem = [[x, y], [x - 4 * s, y - 28 * s], [x + 4 * s, y - 55 * s], [x - 8 * s, y - 82 * s], [x - 22 * s, y - 104 * s]];
  trunk(c, r, stem, 7.5 * s);
  const pads = [[x - 26 * s, y - 110 * s, 1]];
  for (const [i, dir] of [[1, 1], [3, -1], [4, 1], [2, -1]]) {
    const [sx, sy] = stem[i];
    const arm = walk(r, sx, sy, dir > 0 ? -.25 : Math.PI + .25, (44 + r() * 20) * s, 3, .25);
    stroke(c.l, div(arm, 4), { wid: 3 * s, fun: taper, noi: .4, col: 'rgba(28,26,23,.85)', seed: r() * 99 });
    pads.push([...arm[arm.length - 1].map((v, k) => v - (k ? 4 * s : 0)), 1], [arm[2][0], arm[2][1] - 4 * s, .6]);
  }
  for (const [cx, cy, k] of pads) {
    blob(c.w, cx, cy, { len: 52 * k * s, wid: 14 * k * s, ang: (r() - .5) * .2, col: 'rgba(56,66,58,.26)', noi: .6, seed: r() * 99 });
    for (let i = 0; i < 50 * k; i++) {
      const bx = cx + (r() - .5) * 44 * k * s, by = cy + (r() - .5) * 5 * k * s;
      const ang = -Math.PI / 2 + (r() - .5) * 2.9, len = (5 + r() * 6) * s;
      stroke(c.l, [[bx, by], [bx + Math.cos(ang) * len * .5, by + Math.sin(ang) * len * .28], [bx + Math.cos(ang) * len, by + Math.sin(ang) * len * .55]],
        { wid: 1, fun: taper, noi: .2, col: `rgba(18,22,18,${.3 + r() * .55})`, seed: r() * 99 });
    }
  }
}

export function drawReeds(c, r, x0, x1, y) {
  for (let i = 0; i < 26; i++) {
    const x = x0 + r() * (x1 - x0), h = 10 + r() * 22, lean = (r() - .3) * 9;
    const pts = [[x, y + r() * 3], [x + lean * .3, y - h * .6], [x + lean, y - h]];
    stroke(c.l, div(pts, 4), { wid: .8 + r() * .8, fun: t => 1 - t * .8, noi: .3, col: `rgba(34,36,30,${.3 + r() * .5})`, seed: r() * 99 });
  }
}
