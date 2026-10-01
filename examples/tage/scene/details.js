// Small things that carry the story: palace roofs half lost in the mist (界画), the path along the paddy ridge,
// the dancing peasants, the emperor's poem and the seal.
import { rng } from '../../../kit/brush/brush.js';
import { stroke, blob, div, quad, ruledLine, brokenLine } from '../../../kit/brush/ink.js';
import { hairyStroke } from '../../../kit/brush/hairy.js';
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

// The ground of the lower third, painted as ONE field the rocks, the willow and the dancers stand in: washes that
// darken toward the bottom and the edges and melt upward into the mist; the path a lighter ribbon through it with
// soft, dry-brushed edges; a darker bank under the path; grass and reeds in clumps of different kinds.
export function ground(c, upper, lower, notan) {
  const r = rng(21);
  const top = [[0, 872], [110, 892], [240, 914], [350, 926], [450, 918], [560, 896], [640, 876]];
  const field = poly([...top, [640, 1120], [0, 1120]]);
  occlude(c, field, .05);
  if (notan) { glaze(c, field, '60,52,44', .6, 0); return; }
  const g = c.w;
  g.save(); g.clip(field); g.globalCompositeOperation = 'multiply';
  const gr = g.createLinearGradient(0, 870, 0, 1120);
  gr.addColorStop(0, 'rgba(150,134,108,0)'); gr.addColorStop(.18, 'rgba(140,124,98,.55)'); gr.addColorStop(1, 'rgba(96,82,62,.9)');
  g.fillStyle = gr; g.fillRect(0, 860, 640, 260);
  g.restore();
  // uneven ground: broad wet strokes lying along the land, darker and lighter, merged by the diffusion
  for (let i = 0; i < 70; i++) {
    const x = r() * 680 - 20, y = 900 + Math.pow(r(), .8) * 220, len = 60 + r() * 120, w = 14 + r() * 30, a = (r() - .5) * .25;
    const pts = quad([x, y], [x + len * .5, y + (r() - .5) * 8], [x + len * Math.cos(a), y + len * Math.sin(a)], 10);
    const p = { bristles: Math.round(w * .5), dryFrom: .4, dryness: .7, streak: len, edge: .3, fade: .4, tipSide: .4, close: 0, profile: t => Math.pow(Math.sin(t * Math.PI), .4) };
    hairyStroke(c.w, pts, w, 4000 + i, { ...p, rgb: '96,82,60', alpha: (.04 + .08 * (y - 900) / 220) * (.6 + r() * .8) });
    hairyStroke(c.wet, pts, w * 1.2, 4000 + i, { ...p, rgb: '255,255,255', alpha: .8 });
  }
  g.save();
  g.restore();
  c.wet.save(); c.wet.globalCompositeOperation = 'lighten'; c.wet.fillStyle = 'rgb(120,120,120)'; c.wet.fill(field); c.wet.restore();

  // the path: a lighter ribbon with soft edges, and a dark bank shading its lower side
  const band = poly([...upper, ...lower.slice().reverse()]);
  g.save(); g.filter = `blur(${5 * c.S}px)`; g.fillStyle = 'rgba(250,244,228,.75)'; g.fill(band);
  g.filter = `blur(${2 * c.S}px)`; g.fillStyle = 'rgba(250,244,228,.45)'; g.fill(band); g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.filter = `blur(${6 * c.S}px)`;
  g.strokeStyle = 'rgba(70,58,42,.75)'; g.lineWidth = 16; g.beginPath(); lower.forEach((p, i) => (i ? g.lineTo(p[0], p[1] + 9) : g.moveTo(p[0], p[1] + 9))); g.stroke(); g.restore();
  // its edges in dry brush: short broken runs of different weight, never one continuous pen line
  for (const [edge, w0] of [[upper, 3], [lower, 5]]) {
    const pts = div(edge, 10);
    for (let i = 0; i < pts.length - 6; i += 3 + Math.floor(r() * 4)) {
      if (r() < .3) continue;
      const run = pts.slice(i, i + 4 + Math.floor(r() * 6));
      hairyStroke(c.l, run, w0 * (.6 + r() * .8), 600 + i, { rgb: '30,26,20', alpha: .35 + r() * .3, bristles: 6, dryFrom: .2, dryness: .8, streak: 30, edge: .5, fade: .4, tipSide: 0, close: 0, profile: t => Math.sin(Math.max(.05, t) * Math.PI) * .8 + .2 });
    }
  }

  // a stream running down from under the path, crossed by a plank bridge
  const stream = poly([[372, 1060], [404, 1064], [430, 1090], [452, 1120], [380, 1120], [376, 1096], [360, 1074]]);
  g.save(); g.filter = `blur(${3 * c.S}px)`; g.fillStyle = 'rgba(236,228,206,.8)'; g.fill(stream); g.restore();
  for (let i = 0; i < 6; i++) {
    const y = 1072 + i * 8 + r() * 4, x = 372 + (y - 1060) * .55;
    stroke(c.l, [[x + 4, y], [x + 18 + r() * 14, y + 2]], { wid: 1.2, fun: t => Math.sin(t * Math.PI), noi: .3, col: 'rgba(60,54,44,.5)', seed: 700 + i });
  }
  for (const dy of [0, 7]) ruledLine(c.l, r, [[352, 1058 + dy], [412, 1066 + dy]], 2.2, .75, '34,28,22');
  for (const x of [358, 404]) stroke(c.l, [[x, 1066], [x + 1, 1084]], { wid: 2, noi: .3, col: 'rgba(30,26,20,.8)', seed: 710 + x });

  // grass in clumps of three kinds: fanned tufts, single leaning blades, dark dabs — densest along the banks
  const tuft = (x, y, n, len, dark) => {
    for (let b = 0; b < n; b++) {
      const a = -Math.PI / 2 + .2 + (r() - .5) * 1.2, l = len * (.5 + r() * .7);
      stroke(c.l, quad([x, y], [x + Math.cos(a) * l * .5 + 2, y + Math.sin(a) * l * .5], [x + Math.cos(a) * l, y + Math.sin(a) * l], 6),
        { wid: 1.4 + r() * 1.2, fun: t => 1 - t * .9, noi: .3, col: `rgba(26,28,18,${dark * (.6 + r() * .4)})`, seed: 900 + x + b });
    }
  };
  for (let i = 0; i < 34; i++) { const k = Math.floor(r() * (lower.length - 1)); tuft(lower[k][0] + r() * 50, lower[k][1] + 8 + r() * 10, 3 + Math.floor(r() * 5), 12 + r() * 16, .85); }
  for (let i = 0; i < 22; i++) { const k = Math.floor(r() * (upper.length - 1)); tuft(upper[k][0] + r() * 50, upper[k][1] + 2, 2 + Math.floor(r() * 4), 8 + r() * 12, .7); }
  for (let i = 0; i < 30; i++) tuft(Math.pow(r(), 1.3) * 640, 1080 + r() * 40, 2 + Math.floor(r() * 5), 14 + r() * 20, .9);
  for (let i = 0; i < 60; i++) {
    const x = r() * 640, y = 930 + r() * 190;
    blob(c.l, x, y, { len: 4 + r() * 7, wid: 2.5 + r() * 3, ang: (r() - .5) * .6, col: `rgba(30,30,20,${.25 + r() * .35})`, noi: .6, seed: 1200 + i });
  }
}

// reed and bamboo clumps by the water: blades leaning one way, dark near the root, a few broken
export function reeds(c, clumps, notan) {
  if (notan) return;
  const r = rng(31);
  for (const [x, y, n] of clumps) for (let i = 0; i < n; i++) {
    const bx = x + (r() - .5) * 60, a = -Math.PI / 2 + .15 + (r() - .5) * .5, l = 30 + r() * 60;
    const tip = [bx + Math.cos(a) * l, y + Math.sin(a) * l], mid = [bx + Math.cos(a) * l * .5 + 4, y + Math.sin(a) * l * .5];
    stroke(c.l, quad([bx, y], mid, tip, 10), { wid: 2.2 + r() * 1.5, fun: t => 1 - t * .9, noi: .3, col: `rgba(28,30,20,${.4 + r() * .45})`, seed: 1500 + i + x, dry: .3 });
    c.d.save(); c.d.strokeStyle = grey(.06); c.d.lineWidth = 4; c.d.beginPath(); c.d.moveTo(bx, y); c.d.lineTo(...tip); c.d.stroke(); c.d.restore();
  }
}

// a peasant dancing, as Ma Yuan draws them: a robe that swings like a bell with the step, wide sleeves flung out,
// a broad straw hat, the body leaning into the dance; a light robe outlined in a few broken brush lines
export function figure(c, x, y, s, pose, seed) {
  const r = rng(seed);
  const ink = a => `rgba(30,24,18,${a})`;
  const L = pose.lean, sw = pose.kick * 4 * s;                          // lean of the body, swing of the hem
  const neck = [x + L * 9 * s, y - 27 * s];
  const hem = [[x - 9 * s + sw, y - 4 * s], [x - 2 * s + sw * .5, y - 1 * s], [x + 6 * s + sw, y - 3 * s], [x + 11 * s + sw * 1.4, y - 6 * s]];
  const left = quad([neck[0] - 3 * s, neck[1] + 2 * s], [x - 5 * s, y - 16 * s], hem[0], 6), right = quad([neck[0] + 3 * s, neck[1] + 2 * s], [x + 5 * s, y - 15 * s], hem[3], 6);
  const robe = poly([...left, ...hem.slice(1, 3), ...right.slice().reverse()]);
  c.w.save(); c.w.fillStyle = 'rgba(236,228,208,.92)'; c.w.fill(robe); c.w.restore();
  c.d.save(); c.d.fillStyle = grey(.05); c.d.fill(robe); c.d.restore();
  const line = (pts, w, a, sd) => stroke(c.l, pts, { wid: w * s, fun: t => .35 + .65 * Math.sin(t * Math.PI), noi: .5, col: ink(a), seed: seed + sd, tip: .6, dry: .45 });
  line(left, 1.5, .85, 1); line(right.slice(0, 5), 1.3, .75, 2);
  line(hem.slice(0, 3), 1, .55, 3);
  // sleeves: wide light flaps thrown out, an outline on their lower side
  for (const [ax, ay] of pose.arms) {
    const sh = [neck[0] + Math.sign(ax) * 3 * s, neck[1] + 5 * s], hand = [sh[0] + ax * s, sh[1] + ay * s];
    const flap = poly([sh, [sh[0] + ax * .5 * s, sh[1] + ay * .5 * s - 3 * s], hand, [hand[0] - Math.sign(ax) * 2 * s, hand[1] + 5 * s], [sh[0] + ax * .3 * s, sh[1] + 7 * s]]);
    c.w.save(); c.w.fillStyle = 'rgba(236,228,208,.92)'; c.w.fill(flap); c.w.restore();
    line([[sh[0], sh[1] + 2 * s], [sh[0] + ax * .4 * s, sh[1] + ay * .4 * s + 5 * s], [hand[0] - Math.sign(ax) * 2 * s, hand[1] + 5 * s]], 1.2, .75, 6 + ax);
    line([sh, [sh[0] + ax * .5 * s, sh[1] + ay * .5 * s - 3 * s], hand], 1, .6, 9 + ax);
  }
  stroke(c.l, [[neck[0] - 3 * s, neck[1] + 10 * s], [neck[0] + 4 * s, neck[1] + 9 * s]], { wid: 1.4 * s, noi: .3, col: ink(.7), seed: seed + 4 });   // sash
  // the straw hat: one solid low cone that hides the head (a brim line over a dot reads as an eye — never that)
  const hat = poly([[neck[0] - 9 * s, neck[1] - 2 * s + L * 2 * s], [neck[0] - 1 * s, neck[1] - 9 * s], [neck[0] + 1.5 * s, neck[1] - 9.5 * s], [neck[0] + 9 * s, neck[1] - 3 * s - L * 2 * s], [neck[0], neck[1] - 1 * s]]);
  c.l.save(); c.l.fillStyle = ink(.78); c.l.fill(hat); c.l.restore();
  stroke(c.l, [[neck[0] - 9 * s, neck[1] - 2 * s + L * 2 * s], [neck[0] + 9 * s, neck[1] - 3 * s - L * 2 * s]], { wid: 1.4 * s, noi: .3, col: ink(.9), seed: seed + 5 });
  stroke(c.l, [[x - 1 * s + sw * .4, y - 2 * s], [x - 3 * s + sw * .2, y + 3 * s]], { wid: 1.4 * s, noi: .3, col: ink(.75), seed: seed + 8 });   // feet under the hem
  stroke(c.l, [[x + 5 * s + sw, y - 3 * s], [x + 9 * s + pose.kick * 6 * s, y - 1 * s - pose.kick * 5 * s]], { wid: 1.4 * s, noi: .3, col: ink(.75), seed: seed + 9 });
  if (pose.staff) stroke(c.l, [[x + 12 * s, y - 32 * s], [x + 16 * s, y + 3 * s]], { wid: 1.3 * s, noi: .2, col: ink(.7), seed: seed + 10 });
}

// the poem: four columns read right to left, then the seal near the peak tops
export function poem(c, cols, seal) {
  cols.forEach(({ text, x, y }) => drawInscription(c, { text, x, y, size: 25, step: 29, seal: null }));
  drawInscription(c, { text: '', x: 0, y: 0, size: 1, step: 1, seal });
}
