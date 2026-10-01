// Near ground (近景) of a level-distance (平远) composition, painted in the scene's own airy manner:
// a reed shallow (芦汀) — a low sandbar in soft washes only, no contour, dissolving into the water,
// with reeds in several ink tones (near ones darker and taller) and feathery plumes (芦花) leaning in the breeze.
import { rng } from '../kit/brush/brush.js';
import { blob, inkLine as ln, polyPath, looseWash, stroke, div, quad } from '../kit/brush/ink.js';

// Sandbar: three overlapping washes, the lowest and darkest at the waterline, plus a few wet-mud drags
function sandbar(c, r) {
  const top = x => 672 + Math.pow(Math.max(0, x) / 360, 1.6) * 40;             // tapers into a spit toward the right
  const pts = [[-10, 730], [-10, top(0)]];
  for (let x = 0; x <= 380; x += 20) pts.push([x, top(x) + (r() - .5) * 3]);
  pts.push([400, 730]);
  looseWash(c.w, r, polyPath(pts), 'rgba(200,184,154,.34)', 4);
  looseWash(c.w, r, polyPath(pts.map(([x, y]) => [x, y + 10])), 'rgba(150,146,138,.26)', 3);
  looseWash(c.w, r, polyPath(pts.map(([x, y]) => [x * .85, y + 22])), 'rgba(110,110,108,.2)', 3);
  for (let i = 0; i < 12; i++) {
    const x = r() * 330, y = top(x) + 6 + r() * 20, l = 20 + r() * 40;
    ln(c.w, r, [[x, y], [x + l, y + (r() - .5)]], 1 + r() * 1.5, .12 + r() * .1, '80,76,70');
  }
  return top;
}

// One reed: a slightly bowed stem, a couple of long leaves peeling off, and sometimes a plume at the top
function reed(c, r, x, y, h, tone, lean) {
  const ink = Math.round(24 + (1 - tone) * 110), col = a => `rgba(${ink},${ink + 2},${ink - 2},${a})`;
  const broken = r() < .12;                     // a snapped stem folds over halfway up
  const tip = broken ? [x + lean * h * .2 + h * .28 * Math.sign(lean || 1), y - h * .45] : [x + lean * h * .35, y - h];
  const stem = broken
    ? [...quad([x, y], [x + lean * h * .04, y - h * .3], [x + lean * h * .12, y - h * .58], 5), tip]
    : quad([x, y], [x + lean * h * .05, y - h * .6], tip, 8);
  stroke(c.l, div(stem, 2), { wid: (.7 + tone * 1.4) * (.75 + r() * .5), fun: t => 1 - t * .7, noi: .3, col: col(.5 + tone * .45), seed: r() * 99, dry: .5 });
  for (let k = 0; k < Math.floor(r() * 3); k++) {
    const at = stem[1 + Math.floor(r() * 5)], dir = r() < .65 ? 1 : -1, l = h * (.2 + r() * .45);
    const lift = .15 + r() * .45, droop = (r() - .3) * .5;
    const leaf = quad(at, [at[0] + dir * l * .45, at[1] - l * lift], [at[0] + dir * l * .85 + lean * 6, at[1] + l * droop], 8);
    stroke(c.l, div(leaf, 2), { wid: 1.6 + tone * 1.2, fun: t => Math.sin(Math.min(1, t * 1.3) * Math.PI) * .9 + .1, noi: .3, col: col(.35 + tone * .35), seed: r() * 99 });
  }
  if (r() < .45) {
    const a = -Math.PI / 2 + lean * .9;
    for (let k = 0; k < 3; k++)
      blob(c.w, tip[0] + Math.cos(a) * (3 + k * 3), tip[1] + Math.sin(a) * (3 + k * 3),
        { len: 9 + r() * 5, wid: 3 + r() * 2, ang: a + (r() - .5) * .5, col: `rgba(196,184,160,${.45 + r() * .2})`, noi: .7, seed: r() * 99 });
    for (let k = 0; k < 5; k++) {
      const s = a + (r() - .5) * .9, l = 6 + r() * 8;
      ln(c.l, r, [tip, [tip[0] + Math.cos(s) * l, tip[1] + Math.sin(s) * l]], .4, .25 + tone * .15);
    }
  }
}

export function drawForeground(c) {
  const r = rng(314);
  const top = sandbar(c, r);
  // reeds grow in clumps of uneven size; far (pale, short) ones first, near (dark, tall) ones last
  const reeds = [];
  for (const [cx, n, spread] of [[14, 30, 30], [74, 20, 24], [136, 26, 32], [204, 14, 20], [266, 9, 16], [320, 4, 10]])
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - .5) * spread * 2, depth = r();
      reeds.push({ x, y: top(Math.max(0, x)) + 4 + (1 - depth) * 16, h: (40 + (1 - depth) * 125) * (1 - x / 700) * (.7 + r() * .5), tone: .3 + (1 - depth) * .7 });
    }
  reeds.sort((a, b) => a.y - b.y);
  for (const { x, y, h, tone } of reeds) reed(c, r, x, y, h, tone, r() < .25 ? -(.05 + r() * .25) : .1 + r() * .45);
  for (const [x0, x1, y] of [[330, 372, 716], [352, 392, 720], [300, 330, 722]]) ln(c.l, r, [[x0, y], [x1, y]], .8, .3);
}
