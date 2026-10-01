// 清风 — the smallest complete build from the kit: an album leaf with bamboo.
// Marks are painted once into three canvases (wash, wetness, ink); the kit runtime runs a scene field,
// the diffusion pass, a paint pass assembled from kit modules, and a per-frame pass with drifting mist.
// Deliberately different choices from the other examples: square format, cooler sheet, no palette muting,
// stronger pooled edges, no water, no mountains.
//
// Studied from real bamboo paintings (墨竹): culms are wide single side-brush strokes, grey with darker pooled
// edges and dry streaks (飞白), separated at the nodes by a gap of paper and short dark bracket marks; leaves are
// long and narrow (7-10× longer than wide), thin at the start, widest near a third, with a long sharp tail, laid
// in one stroke of nearly flat dark ink and hung in fanned 个/介 groups; far leaves and culms are pale and wet.
import { createRuntime } from '../../kit/runtime.js';
import { rng } from '../../kit/brush/brush.js';
import { stroke, quad, walk } from '../../kit/brush/ink.js';
import { drawInscription } from '../../kit/brush/text.js';

const D = 800;                                   // design space: 800 × 800, y down
const WHITE = 'rgba(255,255,255,1)';

function layer(S, fill) {
  const c = document.createElement('canvas');
  c.width = c.height = D * S;
  const g = c.getContext('2d');
  if (fill) { g.fillStyle = fill; g.fillRect(0, 0, c.width, c.height); }
  g.scale(S, S);
  return g;
}

// a mark goes to the wash layer and records how wet it was (wet marks spread along the fibres, dry stay sharp)
function washMark(c, wetness, paint) {
  paint(c.w, null);
  c.wet.save(); c.wet.globalAlpha = wetness; paint(c.wet, WHITE); c.wet.restore();
}

// one leaf in one stroke: thin entry from the stalk, widest near a third, long sharp tail; it droops a little
const LEAF = t => (t < .14 ? Math.pow(t / .14, .6) : 1 - Math.pow((t - .14) / .86, 1.9));
function leaf(g, r, x, y, a, len, col, seed, coats = 1) {
  const droop = len * (.06 + r() * .1) * Math.sign(Math.cos(a) || 1);
  const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
  const cx = x + Math.cos(a) * len * .5 - Math.sin(a) * droop, cy = y + Math.sin(a) * len * .5 + Math.cos(a) * droop;
  const pts = quad([x, y], [cx, cy], [ex, ey], 24), wid = len * (.15 + r() * .04);
  // a fully loaded brush: near leaves get a second coat so they read as nearly solid black
  for (let k = 0; k < coats; k++) stroke(g, pts, { wid: wid * (1 - k * .08), fun: LEAF, noi: .12, col, seed, tip: .25, dry: .18 });
}

// a group (个 = 3, 介 = 4) splayed like fingers from one point: step = angle between neighbouring leaves (~.5)
function group(g, r, x, y, base, step, size, n, col, seed, coats = 1) {
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * step * (.8 + r() * .4) + (r() - .5) * .2;
    // leaves leave the twig at slightly different points, so the group overlaps instead of radiating
    leaf(g, r, x + (r() - .5) * 14, y + (r() - .5) * 10, a, size * (.7 + r() * .5), col, seed + i * 3.1, coats);
  }
}

// a culm: segments as wide side-brush strokes (wash layer, fairly dry so the edges pool), paper gaps at the
// nodes, dark bracket marks and a short ring stroke on the ink layer; returns the node points for the twigs
function culm(c, pts, seg, wid, col, wetness, nodeInk, seed) {
  const r = rng(seed), nodes = [0];
  for (let i = 0, acc = 0; i < pts.length - 1; i++) {
    acc += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (acc > seg[Math.min(nodes.length - 1, seg.length - 1)]) { nodes.push(i + 1); acc = 0; }
  }
  if (nodes[nodes.length - 1] !== pts.length - 1) nodes.push(pts.length - 1);
  for (let k = 0; k < nodes.length - 1; k++) {
    const s = pts.slice(nodes[k] + 1, nodes[k + 1]);       // the gap of one point at each node stays paper
    if (s.length < 2) continue;
    const w = wid * (1 - k * .045);
    const flare = t => .96 + .1 * Math.pow(Math.abs(2 * t - 1), 4);    // segments swell slightly at the nodes
    washMark(c, wetness, (g, white) => stroke(g, s, { wid: w, fun: flare, noi: .18, col: white || col, seed: seed + k, tip: .85, dry: .5 }));
    // 飞白: a few dry streaks along the segment where the brush ran out
    c.w.save(); c.w.globalCompositeOperation = 'destination-out';
    for (let j = 0; j < 3; j++) {
      const off = (r() - .5) * w * .7, from = Math.floor(r() * s.length * .5), to = Math.min(s.length, from + 3 + Math.floor(r() * s.length * .6));
      const run = s.slice(from, to).map(([x, y], i, arr) => {
        const [nx, ny] = arr[Math.min(i + 1, arr.length - 1)], [px, py] = arr[Math.max(i - 1, 0)];
        const l = Math.hypot(nx - px, ny - py) || 1;
        return [x - (ny - py) / l * off, y + (nx - px) / l * off];
      });
      if (run.length > 1) stroke(c.w, run, { wid: .8 + r() * 1.4, noi: .6, col: `rgba(0,0,0,${.35 + r() * .35})`, seed: seed + 40 + j, dry: .6 });
    }
    c.w.restore();
    if (!nodeInk || k === nodes.length - 2) continue;
    const [nx, ny] = pts[nodes[k + 1]], [px, py] = pts[nodes[k + 1] - 1];
    const l = Math.hypot(nx - px, ny - py), ux = (nx - px) / l, uy = (ny - py) / l, vx = -uy, vy = ux;
    const hw = w * .55;
    const at = (u, v) => [nx + ux * u + vx * v, ny + uy * u + vy * v];
    stroke(c.l, [at(-3, -hw), at(1, -hw * .3), at(2, hw * .2), at(-2, hw)], { wid: 2.6, noi: .4, col: nodeInk, seed: seed + 60 + k, dry: .3 });
    stroke(c.l, [at(-6, -hw - 3), at(-1, -hw + 1)], { wid: 3, noi: .3, col: nodeInk, seed: seed + 70 + k });
    stroke(c.l, [at(-1, hw - 1), at(-6, hw + 3)], { wid: 3, noi: .3, col: nodeInk, seed: seed + 80 + k });
  }
  return nodes.map(i => pts[i]);
}

// a twig from a node: thin, long, with a joint where a side twig leaves; returns its end and joint
function twig(g, r, [x, y], ang, len, col, seed) {
  const main = walk(rng(seed), x, y, ang, len, 8, .14);
  stroke(g, main, { wid: 2.4, fun: t => 1 - t * .6, noi: .3, col, seed, dry: .3 });
  const j = main[4];
  const side = walk(rng(seed + 1), j[0], j[1], ang + (r() < .5 ? .5 : -.45), len * .45, 5, .15);
  stroke(g, side, { wid: 1.6, fun: t => 1 - t * .6, noi: .3, col, seed: seed + 1, dry: .3 });
  return { end: main[main.length - 1], joint: j, side: side[side.length - 1] };
}

function paintMarks(S) {
  const c = { w: layer(S), wet: layer(S, '#000'), l: layer(S) };
  const r = rng(11);
  const DARK = 'rgba(16,15,14,1)', MID = 'rgba(70,70,72,.88)', PALE = 'rgba(112,116,120,.5)';

  // far culm and its leaves: pale, very wet — depth by tone and softness, not by detail
  culm(c, quad([690, 830], [700, 420], [742, -20], 60), [140, 160], 15, 'rgba(150,154,158,.38)', .95, null, 300);
  washMark(c, .9, (g, white) => group(g, rng(301), 712, 300, 1.6, .5, 95, 4, white || PALE, 301));
  washMark(c, .9, (g, white) => group(g, rng(302), 705, 470, 1.0, .55, 80, 3, white || PALE, 302));

  // second culm, mid grey, partly behind the host
  const nB = culm(c, quad([520, 830], [540, 450], [590, 60], 70), [120, 150, 165, 160, 150], 26, 'rgba(98,98,100,.72)', .4, 'rgba(60,58,56,.75)', 200);

  // host culm: dark grey, wide, on a diagonal from the lower left; the void and the title are upper left
  const nA = culm(c, quad([250, 840], [330, 470], [460, -30], 80), [95, 125, 150, 160, 160, 150], 38, 'rgba(66,66,68,.86)', .3, 'rgba(26,24,22,.9)', 100);

  // twigs and leaves — every group different: size, count, spread, tone; near ones charred and flat,
  // a wet mid-tone group lower right, a light group from the second culm
  // host culm: a heavy dark mass near the top (crossing the culm), groups along the twigs, one twig to the left
  const tA5 = twig(c.l, r, nA[5], -.35, 130, 'rgba(34,32,30,.85)', 390);
  group(c.l, r, ...tA5.end, 1.2, .5, 120, 4, DARK, 395, 2);
  group(c.l, r, ...tA5.joint, 2.0, .55, 105, 3, DARK, 396, 2);
  group(c.l, r, ...tA5.side, .55, .5, 95, 3, DARK, 397, 2);
  const tA3 = twig(c.l, r, nA[3], -.45, 160, 'rgba(34,32,30,.85)', 400);
  group(c.l, r, ...tA3.end, .85, .55, 118, 4, DARK, 410, 2);
  group(c.l, r, ...tA3.joint, 1.75, .5, 100, 3, DARK, 411, 2);
  group(c.l, r, ...tA3.side, 1.3, .45, 90, 3, MID, 420);
  const tA2 = twig(c.l, r, nA[2], -2.6, 115, 'rgba(34,32,30,.8)', 450);
  group(c.l, r, ...tA2.end, 2.3, .5, 108, 4, DARK, 460, 2);
  group(c.l, r, ...tA2.joint, 1.7, .5, 75, 3, MID, 470);
  // second culm: lighter groups, one of them wet so it spreads (破墨)
  const tB2 = twig(c.l, r, nB[2], -.3, 165, 'rgba(70,68,66,.7)', 480);
  washMark(c, .8, (g, white) => group(g, rng(490), ...tB2.end, 1.1, .5, 115, 4, white || 'rgba(96,98,102,.62)', 490));
  washMark(c, .8, (g, white) => group(g, rng(491), ...tB2.joint, 1.9, .55, 95, 3, white || 'rgba(96,98,102,.62)', 491));
  group(c.l, r, ...tB2.side, .7, .5, 85, 3, MID, 500);
  const tB4 = twig(c.l, r, nB[4], -.6, 95, 'rgba(70,68,66,.7)', 510);
  group(c.l, r, ...tB4.end, 1.0, .5, 92, 3, MID, 520);
  group(c.l, r, ...tB4.joint, 2.1, .5, 70, 2, MID, 521);

  drawInscription(c, { text: '清风', x: 118, y: 150, size: 54, step: 56, seal: { x: 100, y: 268, size: 22, chars: ['竹', '影', '清', '风'] } });
  return c;
}

async function start() {
  const S = Math.min(2, window.devicePixelRatio || 1);
  const canvas = document.getElementById('gl');
  canvas.width = canvas.height = D * S;
  await document.fonts.load('54px "Ma Shan Zheng"', '清风竹影').catch(() => []);
  const c = paintMarks(S);

  const rt = await createRuntime(canvas);
  if (!rt.float) throw new Error('EXT_color_buffer_float is not available');
  const size = [canvas.width, canvas.height];
  const [scene, diffuse, paint, fin] = await Promise.all(
    ['shaders/scene.frag', '../../kit/passes/diffuse.frag', 'shaders/paint.frag', 'shaders/final.frag'].map(rt.program));

  const col = rt.texture(...size, { type: 'rgba16f' }), wet = rt.texture(...size, { type: 'rgba16f' });
  rt.draw(scene, { to: rt.target([col, wet]), size, tex: { uWash: rt.fromCanvas(c.w.canvas), uWetC: rt.fromCanvas(c.wet.canvas) } });
  const diffused = rt.pingpong(diffuse, col, 30, {
    size, type: 'rgba16f', tex: { uWet: wet },
    u: { uStep: S * .9, uDesignW: D, uRate: .12, uFibreScale: .022, uCross: .25 },
  });
  const painted = rt.texture(...size), fb = rt.target([painted]);
  rt.draw(paint, { to: fb, size, tex: { uDiffused: diffused, uWet: wet, uLines: rt.fromCanvas(c.l.canvas) } });

  const t0 = performance.now();
  const frame = now => {
    rt.draw(fin, { size, tex: { uPainted: painted }, u: { uTime: (now - t0) / 1000 } });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

start().catch(err => { console.error(err); document.body.textContent = 'Painting failed: ' + err.message; });
