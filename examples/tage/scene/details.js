// Small things that carry the story: palace roofs half lost in the mist (界画), the path along the paddy ridge,
// the dancing peasants, the emperor's poem and the seal.
import { rng } from '../../../kit/brush/brush.js';
import { stroke, blob, div, quad, ruledLine, brokenLine } from '../../../kit/brush/ink.js';
import { drawInscription } from '../../../kit/brush/text.js';
import { poly, glaze, occlude, grey } from './layers.js';

// a hip roof seen slightly from the side: dark roof wash, ruled eave with upturned tips, a pale wall below
export function palace(c, roofs, notan) {
  const r = rng(7);
  for (const [x, y, w, h, depth] of roofs) {
    const roof = poly([[x - w * .55, y + h * .45], [x - w * .32, y], [x + w * .32, y], [x + w * .55, y + h * .45], [x + w * .5, y + h * .55], [x - w * .5, y + h * .55]]);
    occlude(c, roof, depth);
    glaze(c, roof, notan ? '110,100,86' : '120,112,100', notan ? .4 : .7, .5, .6);
    if (notan) continue;
    const ink = `rgba(60,52,44,${.5 - depth * .3})`;
    ruledLine(c.l, r, quad([x - w * .62, y + h * .3], [x, y + h * .62], [x + w * .62, y + h * .3], 10), 1.3, .5 - depth * .25, '60,52,44');
    ruledLine(c.l, r, [[x - w * .32, y], [x + w * .32, y]], 1.4, .55 - depth * .25, '60,52,44');
    const wall = poly([[x - w * .38, y + h * .55], [x + w * .38, y + h * .55], [x + w * .38, y + h * 1.05], [x - w * .38, y + h * 1.05]]);
    glaze(c, wall, '200,190,170', .5, .6, .8);
    for (let i = 0; i < 3; i++) stroke(c.l, [[x - w * .3 + i * w * .3, y + h * .6], [x - w * .3 + i * w * .3, y + h * .95]], { wid: 1, noi: .2, col: ink, seed: 40 + i });
  }
}

// the path on the ridge between paddies: a pale ribbon with broken ink edges, dark tufts of grass along it
export function path(c, upper, lower, notan) {
  const r = rng(21);
  const band = poly([...upper, ...lower.slice().reverse()]);
  occlude(c, band, .05);
  const below = poly([...lower, [640, 1120], [0, 1120]]);
  occlude(c, below, .02);
  if (notan) { glaze(c, below, '60,52,44', .7, 0); return; }
  glaze(c, below, '150,134,108', .7, .5, 1.5);
  glaze(c, band, '226,214,190', .6, .4, 1);
  brokenLine(c.l, r, div(upper, 6), 2.6, .7, '30,26,20', .4);
  brokenLine(c.l, r, div(lower, 6), 3.2, .8, '26,22,18', .4);
  for (const edge of [upper, lower]) for (let i = 0; i < 26; i++) {
    const k = r() * (edge.length - 1), j = Math.floor(k), u = k - j;
    const x = edge[j][0] + (edge[j + 1][0] - edge[j][0]) * u, y = edge[j][1] + (edge[j + 1][1] - edge[j][1]) * u;
    for (let b = 0; b < 4; b++) {
      const a = -Math.PI / 2 + (r() - .5) * 1.4;
      stroke(c.l, [[x + b * 2, y], [x + b * 2 + Math.cos(a) * (7 + r() * 9), y + Math.sin(a) * (7 + r() * 9)]], { wid: 1.4, fun: t => 1 - t, noi: .2, col: 'rgba(28,30,20,.7)', seed: 600 + i * 4 + b });
    }
  }
  // a stream running down from under the path, crossed by a plank bridge
  const stream = poly([[372, 1060], [404, 1064], [430, 1090], [452, 1120], [380, 1120], [376, 1096], [360, 1074]]);
  occlude(c, stream, .04);
  glaze(c, stream, '150,140,120', .55, .8, 2);
  for (let i = 0; i < 6; i++) {
    const y = 1072 + i * 8 + r() * 4, x = 372 + (y - 1060) * .55;
    stroke(c.l, [[x + 4, y], [x + 18 + r() * 14, y + 2]], { wid: 1.2, fun: t => Math.sin(t * Math.PI), noi: .3, col: 'rgba(60,54,44,.5)', seed: 700 + i });
  }
  for (const dy of [0, 7]) ruledLine(c.l, r, [[352, 1058 + dy], [412, 1066 + dy]], 2.2, .75, '34,28,22');
  for (const x of [358, 404]) stroke(c.l, [[x, 1066], [x + 1, 1084]], { wid: 2, noi: .3, col: 'rgba(30,26,20,.8)', seed: 710 + x });

  // the ground below: clumps of grass and reeds in dark ink, thicker toward the left corner
  for (let i = 0; i < 40; i++) {
    const x = Math.pow(r(), 1.4) * 640, y = 1075 + r() * 45;
    for (let b = 0; b < 3 + Math.floor(r() * 4); b++) {
      const a = -Math.PI / 2 + (r() - .5) * 1.1, l = 8 + r() * 18;
      stroke(c.l, [[x + b * 2.5, y], [x + b * 2.5 + Math.cos(a) * l * .5, y + Math.sin(a) * l * .5], [x + b * 2.5 + Math.cos(a) * l, y + Math.sin(a) * l]], { wid: 1.6, fun: t => 1 - t, noi: .2, col: `rgba(26,28,18,${.45 + r() * .4})`, seed: 900 + i * 7 + b });
    }
  }
}

// a peasant dancing: head, a robe with a sash, one or both arms raised, a leg kicking — a few marks, no face
export function figure(c, x, y, s, pose, seed) {
  const r = rng(seed);
  const ink = 'rgba(34,28,22,.85)';
  const head = [x + pose.lean * 6 * s, y - 26 * s];
  blob(c.l, head[0], head[1], { len: 5 * s, wid: 4.4 * s, ang: 1.5, col: ink, noi: .3, seed });
  stroke(c.l, [[head[0] - 6 * s, head[1] - 1 * s], [head[0], head[1] - 4.5 * s], [head[0] + 6 * s, head[1] - 1.5 * s]], { wid: 1.8 * s, fun: t => .6 + .4 * Math.sin(t * Math.PI), noi: .2, col: ink, seed: seed + 1 });   // straw hat
  const robe = poly([[head[0] - 3 * s, head[1] + 3 * s], [head[0] + 3 * s, head[1] + 3 * s], [x + 6 * s, y - 6 * s], [x - 5 * s, y - 6 * s]]);
  glaze(c, robe, '236,228,210', .9, .2);
  stroke(c.l, [[head[0] - 3 * s, head[1] + 3 * s], [x - 5 * s, y - 6 * s]], { wid: 1.3 * s, noi: .3, col: ink, seed: seed + 2 });
  stroke(c.l, [[head[0] + 3 * s, head[1] + 3 * s], [x + 6 * s, y - 6 * s]], { wid: 1.3 * s, noi: .3, col: ink, seed: seed + 3 });
  for (const [ax, ay] of pose.arms) {
    const sh = [head[0] + Math.sign(ax) * 3 * s, head[1] + 5 * s];
    stroke(c.l, quad(sh, [sh[0] + ax * .5 * s, sh[1] + ay * .2 * s], [sh[0] + ax * s, sh[1] + ay * s], 6), { wid: 1.4 * s, fun: t => 1 - t * .5, noi: .3, col: ink, seed: seed + 4 + ax });
  }
  stroke(c.l, [[x - 2 * s, y - 6 * s], [x - 3 * s + pose.kick * 2 * s, y]], { wid: 1.4 * s, noi: .3, col: ink, seed: seed + 8 });
  stroke(c.l, [[x + 2 * s, y - 6 * s], [x + 4 * s + pose.kick * 7 * s, y - 2 * s - pose.kick * 4 * s]], { wid: 1.4 * s, noi: .3, col: ink, seed: seed + 9 });
  c.d.save(); c.d.fillStyle = grey(.05); c.d.fillRect(x - 10 * s, y - 32 * s, 20 * s, 32 * s); c.d.restore();
}

// the poem: four columns read right to left, then the seal near the peak tops
export function poem(c, cols, seal) {
  cols.forEach(({ text, x, y }) => drawInscription(c, { text, x, y, size: 25, step: 29, seal: null }));
  drawInscription(c, { text: '', x: 0, y: 0, size: 1, step: 1, seal });
}
