// The far plane that gives a level-distance (平远) painting its fullness: rows of distant trees (远树) along the
// far shore, a small pagoda on the ridge of the guest mountains, a distant sail, and a few ripple strokes.
// Everything here is small and pale; the object haze in the shaders veils it further.
import { rng } from './brush.js';
import { stroke, div, blob, quad, polyPath, looseWash, inkLine as ln } from './ink.js';

// 远树: groups of distant trees in three manners — Mi-style dot clusters (米点, no trunk), flat umbrella pines,
// and a trunk with a dab of crown — with gaps between the groups
function distantTrees(c, r, rows) {
  for (const [x0, x1, y] of rows) {
    for (let x = x0; x < x1; x += 3 + r() * 5) {
      if (r() < .18) { x += 8; continue; }
      const h = 6 + r() * 9, yy = y + (r() - .5) * 2, tone = 44 + r() * 34, kind = r();
      const ink = a => `rgba(${tone},${tone + 5},${tone + 2},${a})`;
      if (kind < .4) {
        for (let k = 0; k < 5; k++)
          blob(c.l, x + (r() - .5) * 6, yy - 2 - r() * h * .8, { len: 3 + r() * 2, wid: 1.6 + r(), ang: (r() - .5) * .3, col: ink(.45 + r() * .3), noi: .4, seed: r() * 99 });
      } else if (kind < .65) {
        ln(c.l, r, [[x, yy], [x + (r() - .5) * 2, yy - h]], .7, .6, `${tone},${tone + 4},${tone}`);
        blob(c.w, x, yy - h, { len: 10 + r() * 6, wid: 2.6 + r() * 1.5, ang: (r() - .5) * .15, col: ink(.6), noi: .5, seed: r() * 99 });
        blob(c.l, x, yy - h - .5, { len: 8, wid: 1.4, ang: 0, col: ink(.5), noi: .5, seed: r() * 99 });
      } else {
        ln(c.l, r, [[x, yy], [x + (r() - .5), yy - h]], .7, .6, `${tone},${tone + 4},${tone}`);
        blob(c.w, x, yy - h - 1.5, { len: 5 + r() * 5, wid: 4 + r() * 4, ang: -1.5 + (r() - .5) * .4, col: ink(.62), noi: .5, seed: r() * 99 });
      }
    }
  }
}

// Small seven-storey pagoda standing on the crest of layer `li` near x0, found from the read-back ridge line
function pagoda(c, r, ridge, x0) {
  if (!ridge) return;
  const Y = x => ridge.y[Math.round(Math.max(0, Math.min(1280, x)) / ridge.step)];
  let bx = x0;
  for (let x = x0 - 50; x <= x0 + 50; x += 2) if (Y(x) < Y(bx)) bx = x;
  const by = Y(bx) + 4, tiers = 7, H = 30;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers, w = 7 * (1 - t * .55), y = by - t * H, th = H / tiers;
    looseWash(c.w, r, polyPath([[bx - w * .6, y], [bx + w * .6, y], [bx + w * .55, y - th * .7], [bx - w * .55, y - th * .7]]), 'rgba(150,150,152,.7)', .4);
    ln(c.l, r, quad([bx - w - 1.5, y - th * .6], [bx, y - th * .85], [bx + w + 1.5, y - th * .6], 6), .8, .6, '60,62,66');
  }
  ln(c.l, r, [[bx, by - H], [bx, by - H - 6]], .6, .6, '60,62,66');
}

// A distant sail: a tilted mat sail and a sliver of hull, barely more than a mark
function sail(c, r, x, y) {
  looseWash(c.w, r, polyPath([[x, y - 1], [x + 2, y - 15], [x + 9, y - 13], [x + 8, y - 1]]), 'rgba(160,156,150,.75)', .4);
  for (let k = 1; k < 4; k++) ln(c.l, r, [[x + .5 + k * .3, y - 1 - k * 3.4], [x + 8, y - 1 - k * 3.1]], .35, .35, '70,70,72');
  ln(c.l, r, [[x + 1.5, y], [x + 1.5, y - 16]], .5, .55, '60,60,62');
  ln(c.l, r, quad([x - 5, y], [x + 3, y + 2.2], [x + 13, y - .5], 6), 1.1, .6, '60,58,56');
  ln(c.w, r, [[x - 8, y + 4], [x + 16, y + 4.5]], .8, .18, '90,88,86');
}

// Ripples: a handful of tapered horizontal strokes, heavier near the shore, lighter in the open water
function ripples(c, r, marks) {
  for (const [x0, x1, y, n] of marks)
    for (let i = 0; i < n; i++) {
      const a = x0 + r() * (x1 - x0) * .6, len = 18 + r() * 50, yy = y + (r() - .5) * 6;
      stroke(c.l, div([[a, yy], [a + len * .5, yy + (r() - .5) * 1.2], [a + len, yy + (r() - .5)]], 4),
        { wid: .9 + r() * .6, fun: t => Math.sin(t * Math.PI), noi: .4, col: `rgba(70,72,74,${.18 + r() * .14})`, seed: r() * 99, dry: .7 });
    }
}

export function drawDistance(c, ridges, spec) {
  const r = rng(515);
  distantTrees(c, r, spec.treeRows || []);
  if (spec.pagoda) pagoda(c, r, ridges && ridges[spec.pagoda.layer], spec.pagoda.x);
  if (spec.sail) {
    const [sx, sy] = spec.sail;
    c.w.save(); c.l.save();
    for (const g of [c.w, c.l]) { g.translate(sx, sy); g.scale(1.5, 1.5); g.translate(-sx, -sy); }
    sail(c, r, sx, sy);
    c.w.restore(); c.l.restore();
  }
  ripples(c, r, spec.ripples || []);
}
