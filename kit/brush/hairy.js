// Hairy brush — one stroke made of many bristles (after Strassmann, "Hairy brushes", SIGGRAPH 1986).
// Each bristle carries its own ink load. Along the stroke the brush runs dry: weak bristles start skipping first,
// and because each bristle skips along its own slow noise, the paper shows through as LONG, PARALLEL streaks
// that open up toward the exit — 飞白 (flying white), the dry-brush texture of bamboo culms, wood, rock edges,
// fast calligraphy. Pigment collects at the outer bristles, so the edges read darker.
//
// Every look parameter is required (no defaults):
//   rgb       'r,g,b' ink colour
//   alpha     ink per bristle (overlap is ~2 bristles, so the solid part reaches ≈ 1-(1-alpha)²)
//   bristles  number of hairs across the brush (30-60 for a wide stroke)
//   dryFrom   where along the stroke (0..1) the first bristles may start to run dry
//   dryness   how much paper the dry part shows (0 = none .. 1 = about half the hairs skip at the driest point)
//   streak    length scale of the streaks along the stroke, in design units (~40-120; longer = straighter)
//   edge      extra darkness at the outer bristles (0..1)
//   fade      ink lost from entry to exit (0..1)
//   tipSide   how the brush is held: 0 = upright (中锋, both edges alike); ±1 = laid on its side (侧锋): the tip
//             edge (+1 = the v>0 side) dark and crisp, the heel edge pale and dry — the axe-cut stroke (斧劈)
//   close     how much the brush closes again at the very end (回锋 turn at a node: 0 = stays frayed, 1 = solid)
//   profile   t → width factor (entry press, flare at the ends, …)
import { rng } from './brush.js';
import { noise } from './ink.js';

const REQUIRED = ['rgb', 'alpha', 'bristles', 'dryFrom', 'dryness', 'streak', 'edge', 'fade', 'tipSide', 'close', 'profile'];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function hairyStroke(g, pts, wid, seed, p) {
  const missing = REQUIRED.filter(k => p[k] === undefined);
  if (missing.length) throw new Error(`hairyStroke: missing ${missing.join(', ')}`);
  const n = pts.length;
  if (n < 2) return;
  const r = rng(seed);
  const L = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[n - 1] || 1;
  const nor = pts.map((_, i) => {
    const [ax, ay] = pts[Math.max(i - 1, 0)], [bx, by] = pts[Math.min(i + 1, n - 1)];
    const l = Math.hypot(bx - ax, by - ay) || 1;
    return [-(by - ay) / l, (bx - ax) / l];
  });
  const bw = wid / p.bristles * 1.9;
  const TAPER = 5;                                    // design units over which a hair lifts off the paper
  // a run of one hair: a filled ribbon, tapered at the ends where the hair starts or stops (not at forced splits)
  const drawRun = (run, openStart, openEnd) => {
    if (run.length < 2) return;
    const d = [0];
    for (let i = 1; i < run.length; i++) d.push(d[i - 1] + Math.hypot(run[i].x - run[i - 1].x, run[i].y - run[i - 1].y));
    const len = d[d.length - 1];
    if (len < 1.5) return;
    const k = i => Math.min(1, openStart ? d[i] / TAPER : 1, openEnd ? (len - d[i]) / TAPER : 1);
    const left = run.map((q, i) => [q.x + q.nx * q.hw * k(i), q.y + q.ny * q.hw * k(i)]);
    const right = run.map((q, i) => [q.x - q.nx * q.hw * k(i), q.y - q.ny * q.hw * k(i)]);
    // ink varies smoothly along the hair: a gradient through up to 9 sampled points (no steps, no bands)
    const gr = g.createLinearGradient(run[0].x, run[0].y, run[run.length - 1].x, run[run.length - 1].y);
    const m = Math.min(9, run.length);
    for (let j = 0; j < m; j++) {
      const i = Math.round(j / (m - 1) * (run.length - 1));
      gr.addColorStop(d[i] / len, `rgba(${p.rgb},${Math.min(1, run[i].a)})`);
    }
    g.fillStyle = gr;
    g.beginPath();
    left.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (let i = right.length - 1; i >= 0; i--) g.lineTo(...right[i]);
    g.closePath();
    g.fill();
  };
  g.save();
  for (let k = 0; k < p.bristles; k++) {
    const v = ((k + .5) / p.bristles) * 2 - 1 + (r() - .5) * .6 / p.bristles;   // across the brush, -1..1
    const load = .5 + .5 * r();
    const dryAt = p.dryFrom + (1 - p.dryFrom) * (.15 + .85 * r()) * (.5 + .5 * load);   // weak hairs dry first
    const edgeV = Math.pow(Math.abs(v), 5);
    const side = p.tipSide * v;                                  // +1 at the tip edge, -1 at the heel
    const sideInk = 1 + .8 * side, sideDry = 1 - .7 * side;      // tip: more ink, stays wet; heel: less, dries first
    const sd = r() * 997;
    let run = [], startOpen = false;
    for (let i = 0; i < n; i++) {
      const t = L[i] / total;
      let dryT = Math.min(1, Math.max(0, (t - dryAt) / Math.max(1e-3, (1 - dryAt) * .55)));   // dries over ~half the rest
      dryT *= 1 - p.close * smooth(.72, .96, t);                                  // the turn at the end closes it
      // streak field: long along the stroke, its ends torn by a finer noise
      const nv = noise(L[i] / p.streak, sd) * .85 + noise(L[i] / 16, sd + 11.3) * .15;
      const thr = Math.min(.95, dryT * p.dryness * .8 * sideDry);
      if (nv < thr) {                                                           // this hair skips here: paper
        drawRun(run, startOpen, true); run = []; startOpen = true;
        continue;
      }
      const half = nv < thr + .05 ? .45 : 1;                                    // half-dry rim of each streak
      const press = 1 + .35 * (1 - smooth(0, .1, t));                           // the entry is pressed, darker
      const edgeK = 1 + p.edge * edgeV * noise(L[i] / 25, sd + 5.1) * 2;        // pooled edge, broken along its length
      const a = half * press * p.alpha * Math.max(.1, sideInk) * load * edgeK * (1 - p.fade * t) * (.92 + .16 * noise(L[i] / 30, sd + 3.7));
      const prof = p.profile(t), off = v * wid * .5 * prof;
      run.push({ x: pts[i][0] + nor[i][0] * off, y: pts[i][1] + nor[i][1] * off, nx: nor[i][0], ny: nor[i][1], hw: bw * prof / 2, a });
    }
    drawRun(run, startOpen, false);
  }
  g.restore();
}
