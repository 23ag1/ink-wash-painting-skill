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
import { stroke, quad, walk, div } from '../../kit/brush/ink.js';
import { hairyStroke } from '../../kit/brush/hairy.js';
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
const LEAF = t => (t < .28 ? .08 + .92 * Math.pow(t / .28, .9) : 1 - Math.pow((t - .28) / .72, 1.6));
function leaf(g, r, x, y, a, len, col, seed, coats = 1) {
  const droop = len * (.06 + r() * .1) * Math.sign(Math.cos(a) || 1);
  const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
  const cx = x + Math.cos(a) * len * .5 - Math.sin(a) * droop, cy = y + Math.sin(a) * len * .5 + Math.cos(a) * droop;
  const pts = quad([x, y], [cx, cy], [ex, ey], 24), wid = len * (.12 + r() * .03);
  // a fully loaded brush: near leaves get a second coat so they read as nearly solid black
  for (let k = 0; k < coats; k++) stroke(g, pts, { wid: wid * (1 - k * .08), fun: LEAF, noi: .12, col, seed, tip: .25, dry: .18 });
}

// a group (个 = 3, 介 = 4) splayed like fingers from one point: step = angle between neighbouring leaves (~.5)
function group(g, r, x, y, base, step, size, n, col, seed, coats = 1) {
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * step * (.8 + r() * .4) + (r() - .5) * .2;
    // leaves leave the twig at different points a short stalk apart, so the bases never merge into a hub
    const off = (i - (n - 1) / 2) * size * .07 + (r() - .5) * size * .05;
    leaf(g, r, x + Math.cos(base) * off * .3 + (r() - .5) * 6, y + Math.sin(base) * off * .3 + off * .6, a, size * (.7 + r() * .5), col, seed + i * 3.1, coats);
  }
}

// a culm: segments as wide side-brush strokes (wash layer, fairly dry so the edges pool), paper gaps at the
// nodes, dark bracket marks and a short ring stroke on the ink layer; returns the node points for the twigs
function culm(c, pts, seg, wid, ink, dry, wetness, nodeInk, seed) {
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
    // one upward stroke of a hairy brush: solid at the entry, 飞白 streaks opening toward the node above
    hairyStroke(c.w, div(s, 4), w, seed + k * 13, {
      rgb: ink.rgb, alpha: ink.alpha, bristles: Math.round(w * .45), dryFrom: dry[0], dryness: dry[1],
      streak: 130, edge: .45, fade: .2, close: .8, profile: flare,
    });
    c.wet.save(); c.wet.globalAlpha = wetness;     // fairly dry paper: the streaks must stay crisp
    stroke(c.wet, s, { wid: w, fun: flare, noi: 0, col: WHITE, seed });
    c.wet.restore();
    if (!nodeInk || k === nodes.length - 2) continue;
    const [nx, ny] = pts[nodes[k + 1]], [px, py] = pts[nodes[k + 1] - 1];
    const l = Math.hypot(nx - px, ny - py), ux = (nx - px) / l, uy = (ny - py) / l, vx = -uy, vy = ux;
    const hw = w * .5;
    const at = (u, v) => [nx + ux * u + vx * v, ny + uy * u + vy * v];
    // 节: one short dark stroke across the top of the lower segment, pressed in the middle, plus a tick at one end
    stroke(c.l, quad(at(-4, -hw * .95), at(-7, 0), at(-4, hw * .8), 12), { wid: w * .09, fun: t => .5 + .5 * Math.sin(t * Math.PI), noi: .3, col: nodeInk, seed: seed + 60 + k, dry: .25 });
    stroke(c.l, [at(-4, -hw * .95), at(-1, -hw * 1.12), at(3, -hw * 1.18)], { wid: w * .07, noi: .3, col: nodeInk, seed: seed + 70 + k });
  }
  return nodes.map(i => pts[i]);
}

// a twig from a node: thin, long, with a joint where a side twig leaves; returns its end and joint
function twig(g, r, [x, y], ang, len, col, seed) {
  const main = walk(rng(seed), x, y, ang, len, 8, .07);
  stroke(g, main, { wid: 2.2, fun: t => 1 - t * .6, noi: .3, col, seed, dry: .3 });
  const j = main[4];
  const side = walk(rng(seed + 1), j[0], j[1], ang + (r() < .5 ? .5 : -.45), len * .45, 5, .15);
  stroke(g, side, { wid: 1.6, fun: t => 1 - t * .6, noi: .3, col, seed: seed + 1, dry: .3 });
  return { end: main[main.length - 1], joint: j, side: side[side.length - 1] };
}

function paintMarks(S) {
  const c = { w: layer(S), wet: layer(S, '#000'), l: layer(S) };
  const r = rng(11);
  const DARK = 'rgba(16,15,14,1)', MID = 'rgba(70,70,72,.88)', PALE = 'rgba(112,116,120,.5)';

  // far culm: pale and very wet, behind the leaves — depth by tone and softness, not by detail
  culm(c, quad([585, 860], [590, 420], [625, -60], 90), [230, 260], 24, { rgb: '160,164,168', alpha: .22 }, [.5, .4], .95, null, 300);

  // two near culms, big enough to fill the leaf (≈8% of its width), cropped by the top and bottom edges
  const nB = culm(c, quad([150, 860], [185, 430], [240, -60], 90), [205, 245, 255], 54, { rgb: '138,138,140', alpha: .45 }, [.2, .8], .1, 'rgba(70,68,66,.85)', 200);
  const nA = culm(c, quad([330, 860], [345, 420], [400, -60], 90), [235, 250, 260], 64, { rgb: '108,108,110', alpha: .55 }, [.15, .9], .1, 'rgba(40,38,36,.9)', 100);

  // leaves: long, black, in wide groups; some hang, some reach sideways or up; a wet pale group lower right
  const tA1 = twig(c.l, r, nA[3], -.55, 120, 'rgba(34,32,30,.85)', 390);
  group(c.l, r, ...tA1.end, .95, .42, 215, 4, DARK, 395, 2);
  group(c.l, r, ...tA1.joint, -.15, .5, 175, 3, DARK, 396, 2);
  const tA0 = twig(c.l, r, nA[2], -.3, 170, 'rgba(34,32,30,.85)', 400);
  group(c.l, r, ...tA0.end, .75, .45, 200, 4, DARK, 410, 2);
  group(c.l, r, ...tA0.side, 1.5, .5, 150, 3, MID, 411);
  const tB1 = twig(c.l, r, nB[2], -2.75, 90, 'rgba(34,32,30,.8)', 450);
  group(c.l, r, ...tB1.end, 2.25, .5, 185, 4, DARK, 460, 2);
  group(c.l, r, ...tB1.joint, 1.75, .45, 130, 3, MID, 470);
  // lower right: a wet pale group that spreads (破墨), from a twig of the host culm
  const tA2 = twig(c.l, r, nA[1], .25, 150, 'rgba(90,88,86,.7)', 480);
  washMark(c, .85, (g, white) => group(g, rng(490), ...tA2.end, 1.05, .38, 190, 6, white || PALE, 490));
  washMark(c, .85, (g, white) => group(g, rng(491), ...tA2.joint, 1.6, .45, 140, 3, white || PALE, 491));

  drawInscription(c, { text: '清风', x: 735, y: 105, size: 46, step: 50, seal: { x: 718, y: 205, size: 22, chars: ['竹', '影', '清', '风'] } });
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
