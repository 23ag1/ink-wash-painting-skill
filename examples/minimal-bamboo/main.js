// 清风 — the smallest complete build from the kit: an album leaf with one bamboo in the wind.
// Marks are painted once into three canvases (wash, wetness, ink); the kit runtime runs a scene field,
// the diffusion pass, a paint pass assembled from kit modules, and a per-frame pass with drifting mist.
// Deliberately different choices from the other examples: square format, cooler sheet, no palette muting,
// stronger pooled edges, no water, no mountains.
import { createRuntime } from '../../kit/runtime.js';
import { rng } from '../../kit/brush/brush.js';
import { stroke, blob, walk, quad } from '../../kit/brush/ink.js';
import { drawInscription } from '../../kit/brush/text.js';

const D = 800;                                   // design space: 800 × 800, y down

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
  paint(c.w);
  c.wet.save(); c.wet.globalAlpha = wetness; paint(c.wet, true); c.wet.restore();
}

// one leaf: a lens-shaped dab hanging from (x, y) along angle a
function leaf(g, r, x, y, a, len, col, seed) {
  blob(g, x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2,
    { len, wid: len * (.13 + r() * .04), ang: a, col, noi: .35, seed });
}

// a 个 / 介 cluster: 2-6 leaves fanning unevenly from one point (bigger clusters have more leaves)
function cluster(g, r, x, y, base, size, col, seed) {
  const n = Math.max(2, Math.min(6, Math.round(size / 22 + r() * 1.6)));
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * (.22 + r() * .22) + (r() - .5) * .16;
    leaf(g, r, x, y, a, size * (.6 + r() * .55), col, seed + i * 3.1);
  }
}

function paintMarks(S) {
  const c = { w: layer(S), wet: layer(S, '#000'), l: layer(S) };
  const r = rng(11);
  const white = 'rgba(255,255,255,1)';

  // far culm and leaves: pale, wet, behind — depth by tone and softness, not by detail
  washMark(c, 1, (g, w) => {
    stroke(g, quad([600, 820], [640, 420], [700, 40], 30), { wid: 11, fun: () => 1, noi: .3, col: w ? white : 'rgba(118,124,128,.32)', seed: 4, dry: .2 });
  });
  for (let i = 0; i < 4; i++) {
    const x = 560 + r() * 160, y = 120 + r() * 360, base = .9 + r() * .4;
    washMark(c, .9, (g, w) => cluster(g, rng(30 + i), x, y, base, 70, w ? white : 'rgba(126,132,136,.3)', 30 + i));
  }

  // host culm: segments with dark nodes, rising on a diagonal from the lower left (the void is upper left)
  const P = quad([200, 830], [300, 470], [470, 40], 60);
  const nodes = [0, 11, 22, 32, 41, 49, 56, 60];
  for (let k = 0; k < nodes.length - 1; k++) {
    const seg = P.slice(nodes[k] + 1, nodes[k + 1]);
    if (seg.length < 2) continue;
    stroke(c.l, seg, { wid: 21 - k * 1.6, fun: t => .92 + .08 * Math.sin(t * Math.PI), noi: .25, col: 'rgba(32,30,28,.9)', seed: k, tip: .7, dry: .45 });
    const [nx, ny] = P[nodes[k + 1]];
    stroke(c.l, [[nx - 10 + k, ny + 2], [nx, ny - 1.5], [nx + 10 - k, ny + 1]], { wid: 3.2, noi: .4, col: 'rgba(20,18,16,.9)', seed: 50 + k, dry: .2 });
  }

  // branchlets — each different (length, angle, how many clusters, where) so the eye never finds a ladder;
  // leaves in three tones: charred dry ink, mid ink, and wet mid-tone washes that spread (破墨)
  const TONE = { dark: 'rgba(22,20,18,.88)', mid: 'rgba(64,62,60,.7)', wet: 'rgba(70,72,74,.55)' };
  const BRANCHES = [   // node, angle, length, clusters: [position along the twig 0..1, hang angle, size, tone]
    [1, -2.5, 60, [[1, 1.9, 64, 'mid']]],
    [2, -.25, 135, [[1, .7, 108, 'dark'], [.45, 1.3, 72, 'wet']]],
    [3, -.05, 70, [[1, 1.05, 82, 'wet']]],
    [4, -.42, 165, [[1, .5, 122, 'dark'], [.62, 1.35, 92, 'dark'], [.28, 2.05, 58, 'wet']]],
    [6, -.75, 95, [[1, .95, 78, 'mid']]],
  ];
  BRANCHES.forEach(([k, a, len, clusters], i) => {
    const [x, y] = P[nodes[k]];
    const tw = walk(rng(70 + i), x, y, a, len, 8, .16);
    stroke(c.l, tw, { wid: 3.4 - i * .2, fun: t => 1 - t * .65, noi: .3, col: 'rgba(30,28,26,.85)', seed: 70 + i, dry: .3 });
    clusters.forEach(([at, hang, size, tone], j) => {
      const [cx, cy] = tw[Math.round(at * (tw.length - 1))], seed = 90 + i * 7 + j;
      if (tone === 'wet') washMark(c, .7, (g, w) => cluster(g, rng(seed), cx, cy, hang, size, w ? white : TONE.wet, seed));
      else cluster(c.l, rng(seed), cx, cy, hang, size, TONE[tone], seed);
    });
  });

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
