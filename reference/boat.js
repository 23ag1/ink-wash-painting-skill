// 孤舟蓑笠翁: a lone fisherman in a straw cloak and bamboo hat at the bow of a sampan.
// Seen slightly from above: near gunwale, far gunwale and a sliver of the interior between them;
// planked hull with a blunt transom stern, woven canopy with ribs and a dark mouth, sculling oar astern.
// Paint order: water marks -> interior -> fisherman -> near hull side -> canopy -> ink lines.
import { blob, inkLine as ln, brokenLine as bl, quad, polyPath, lantern, looseWash } from '../kit/brush/ink.js';

export const BOAT_LANTERN = [636, 588, .75];

const BOW = [582, 579], STERN = [738, 583];
const nearPts = quad(BOW, [652, 606], [736, 590], 20);
const farPts = quad(BOW, [656, 590], STERN, 20);
const waterPts = quad([598, 597], [656, 615], [730, 602], 20);
const near = t => nearPts[Math.round(t * 20)];
const between = (a, b, k) => a.map(([x, y], i) => [x + (b[i][0] - x) * k, y + (b[i][1] - y) * k]);

// The reflection begins right at the waterline (no gap, no shadow plate) and breaks up into dry horizontal drags
function waterMarks(c, r) {
  const mirror = waterPts.map(([x, y]) => [x, y + 2]).concat(nearPts.slice().reverse().map(([x, y]) => [x, 2 * 608 - y + 4]));
  looseWash(c.w, r, polyPath(mirror), 'rgba(92,86,78,.2)', 3);
  for (let i = 0; i < 12; i++) {
    const y = 609 + i * 2 + r() * 1.2, half = (60 - i * 3.8) * (.8 + r() * .3), x = 660 + (r() - .5) * 10;
    ln(c.w, r, [[x - half, y], [x + half, y + (r() - .5)]], 1.4 + r(), (.2 - i * .012) + r() * .08, '74,68,60');
  }
}

function interior(c, r) {
  looseWash(c.w, r, polyPath([...farPts, ...nearPts.slice().reverse()]), 'rgba(62,54,44,.72)', 1);
}

function hullSide(c, r) {
  const g = c.w, side = polyPath([...nearPts, [730, 601], ...waterPts.slice().reverse()]);
  c.l.save(); c.l.globalCompositeOperation = 'destination-out'; c.l.fill(side); c.l.restore();   // hides the fisherman's legs
  looseWash(g, r, side, 'rgba(112,104,94,.74)', 1.3);
  looseWash(g, r, polyPath([...between(nearPts, waterPts, .55), ...waterPts.slice().reverse()]), 'rgba(56,50,42,.34)', 2);
  looseWash(g, r, polyPath([...nearPts, ...between(nearPts, waterPts, .16).reverse()]), 'rgba(176,152,116,.55)', .6);
  looseWash(g, r, polyPath([[736, 590], STERN, [741, 596], [730, 601]]), 'rgba(70,58,46,.85)', .6);
  // the waterline is lost, not drawn: the lower hull fades into the water
  g.save(); g.clip(side); g.globalCompositeOperation = 'destination-out';
  const f = g.createLinearGradient(0, 603, 0, 616);
  f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,.7)');
  g.fillStyle = f; g.fillRect(580, 600, 170, 20);
  g.restore();
}

function hullLines(c, r) {
  bl(c.l, r, farPts, .9, .55, undefined, .2);
  bl(c.l, r, nearPts, 1.4, .72, undefined, .1);
  for (const k of [.4, .7]) bl(c.l, r, between(nearPts, waterPts, k).slice(3, 18), .55, .2, undefined, .4);
  bl(c.l, r, [[736, 590], STERN, [741, 596], [730, 601]], 1, .65, undefined, 0);
  // sculling oar (橹) trailing from the stern into the water
  bl(c.l, r, [[718, 586], [746, 598], [770, 612]], 1.5, .8, undefined, 0);
  blob(c.l, 770, 612, { len: 12, wid: 3.4, ang: .5, col: 'rgba(60,50,40,.75)', noi: .4, seed: 17 });
  for (const [x0, x1, y] of [[760, 784, 616], [764, 778, 619.5]]) ln(c.l, r, [[x0, y], [x1, y]], .8, .35);
}

// Half-cylinder of woven bamboo mat seen three-quarter: front arch with a dark mouth, top, back edge; ribs + weave
function canopy(c, r) {
  const g = c.w;
  const front = quad([646, 595], [643, 571], [654, 573], 8);          // near leg of the front arch, up to its crown
  const frontFar = quad([654, 573], [663, 578], [661, 591], 8);       // far leg of the front arch (the mouth's right side)
  const top = quad([654, 573], [676, 567], [697, 573], 12);
  const back = quad([697, 573], [704, 585], [693, 596], 8);
  const base = nearPts.slice(9, 16).reverse();                         // along the near gunwale, back to the front leg
  const shell = polyPath([...front, ...top, ...back, ...base]);
  looseWash(g, r, shell, 'rgba(164,142,108,.84)', .8);
  looseWash(g, r, polyPath([...quad([690, 575], [701, 585], [693, 596], 6), [682, 596], [684, 580]]), 'rgba(94,80,60,.35)', 2);
  const mouth = polyPath([...front, ...frontFar]);
  looseWash(g, r, mouth, 'rgba(32,26,20,.88)', .5);
  c.l.save(); c.l.clip(shell);
  for (let i = 2; i < 12; i += 1.6) {
    const [px, py] = top[Math.round(i)];
    bl(c.l, r, quad([px, py], [px + 6, py + 10], [px - 1, 597], 6), .5, .22, undefined, .3);
  }
  for (let k = 1; k < 3; k++) bl(c.l, r, top.map(([x, y]) => [x + k * 1.5, y + k * 7]), .4, .12, undefined, .5);
  c.l.restore();
  bl(c.l, r, [...front, ...top, ...back], 1.1, .68, undefined, .15);
  bl(c.l, r, frontFar, .9, .6, undefined, 0);
  ln(c.l, r, [[647, 580], [BOAT_LANTERN[0], BOAT_LANTERN[1] - 6]], .6, .7);
  lantern(c.l, BOAT_LANTERN[0], BOAT_LANTERN[1], BOAT_LANTERN[2]);
}

// Fisherman seated in the bow, lower body hidden by the near gunwale: straw cloak, 斗笠 hat, rod over the water
function fisherman(c, r) {
  const g = c.w;
  const cloak = polyPath([[606, 575], [617, 574], [623, 592], [599, 593]]);
  looseWash(g, r, cloak, 'rgba(78,82,80,.85)', 1);
  c.l.save(); c.l.clip(cloak);
  for (let i = 0; i < 7; i++) { const x = 599 + r() * 24; bl(c.l, r, [[x, 576], [x - 1 + (x - 611) * .15, 592]], .55, .3 + r() * .2, undefined, .25); }
  c.l.restore();
  ln(c.l, r, [[615, 580], [621, 583], [626, 581]], 1.5, .9);
  const L = [600, 575.5], A = [612, 566.5], R = [625, 574.5];
  const crown = [...quad(L, [604, 569], A), ...quad(A, [620, 569], R)];
  looseWash(g, r, polyPath([...crown, ...quad(R, [612, 578], L)]), 'rgba(112,102,84,.9)', .5);
  looseWash(g, r, polyPath(quad(L, [612, 579], R)), 'rgba(36,32,28,.85)', .6);
  bl(c.l, r, crown, .8, .7, undefined, 0);
  bl(c.l, r, quad([599, 575.5], [612, 578.5], [626, 574.5]), 1.2, .85, undefined, 0);
  bl(c.l, r, quad([626, 581], [584, 552], [528, 540]), .9, .75, undefined, .08);
  ln(c.l, r, [[528, 540], [527, 575], [526, 610]], .4, .45);
  ln(c.l, r, [[518, 611], [534, 611]], .7, .4);
  ln(c.l, r, [[522, 614], [531, 614]], .6, .3);
}

export function drawBoat(c, r) {
  waterMarks(c, r);
  interior(c, r);
  fisherman(c, r);
  hullSide(c, r);
  canopy(c, r);
  hullLines(c, r);
}
