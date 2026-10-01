// Organic ink primitives after Lingdong Huang's {Shan, Shui}* (github.com/LingDong-/shan-shui-inf):
// stroke width and blob radius are modulated by smooth noise, never by per-point jitter.
import { rng } from './brush.js';

// 2D value noise in [0,1], smooth (smoothstep interpolation)
const PERM = (() => { const r = rng(1234); return Float32Array.from({ length: 1024 }, r); })();
const cell = (i, j) => PERM[(((i * 374761393) ^ (j * 668265263)) >>> 0) % 1024];
export function noise(x, y = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = cell(xi, yi), b = cell(xi + 1, yi), c = cell(xi, yi + 1), d = cell(xi + 1, yi + 1);
  return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
}

// Linear subdivision so strokes have enough vertices for smooth width modulation
export function div(pts, reso) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++)
    for (let k = 0; k < reso; k++) {
      const t = k / reso, [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
    }
  out.push(pts[pts.length - 1]);
  return out;
}

// Filled brush stroke along pts. Width = wid * fun(t), blended with noise (noi = 0 smooth .. 1 very ragged).
// Noise is sampled by arc length (period ~20 units), so pressure breathes smoothly however densely pts are sampled.
// Ink is not flat: the brush is loaded light in the belly and dark at the tip (点墨), so each stroke is laid as
// a pale full-width body plus a darker, narrower core shifted toward the tip side (tip: -1..1, 0 = centred 中锋),
// and it loses ink along its length (dry: 0..1), heaviest just after the entry press.
function parseRGBA(col) {
  const m = /rgba?\(([^)]+)\)/.exec(col);
  if (!m) return null;
  const v = m[1].split(',').map(Number);
  return { rgb: v.slice(0, 3).join(','), a: v.length > 3 ? v[3] : 1 };
}

function outlinePath(g, left, right) {
  g.beginPath(); g.moveTo(...left[0]);
  for (let i = 1; i < left.length; i++) g.lineTo(...left[i]);
  for (let i = right.length - 1; i >= 0; i--) g.lineTo(...right[i]);
  g.closePath();
}

export function stroke(g, pts, { wid = 2, fun = t => Math.sin(t * Math.PI), noi = .5, col = 'rgba(20,18,16,.9)', seed = 0, tip = 0, dry = .35 } = {}) {
  const n = pts.length;
  if (n < 2) return;
  const left = [], right = [], coreL = [], coreR = [];
  let dist = 0;
  for (let i = 0; i < n; i++) {
    if (i) dist += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    let w = wid * fun(i / (n - 1));
    w = w * (1 - noi) + w * noi * noise(dist * .05, seed) * 2;
    const [px, py] = pts[Math.max(0, i - 1)], [nx, ny] = pts[Math.min(n - 1, i + 1)];
    const a = Math.atan2(ny - py, nx - px) + Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
    const [x, y] = pts[i];
    left.push([x + ca * w / 2, y + sa * w / 2]);
    right.push([x - ca * w / 2, y - sa * w / 2]);
    const off = tip * w * .24, cw = w * .5;
    coreL.push([x + ca * (off + cw / 2), y + sa * (off + cw / 2)]);
    coreR.push([x + ca * (off - cw / 2), y + sa * (off - cw / 2)]);
  }
  const c = parseRGBA(col);
  const [x0, y0] = pts[0], [x1, y1] = pts[n - 1];
  const chord = Math.hypot(x1 - x0, y1 - y0);
  if (!c || wid < 1.2 || chord < dist * .25) {           // hairlines and closed loops: flat ink is fine
    g.fillStyle = col; outlinePath(g, left, right); g.fill();
    return;
  }
  const ramp = k => {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, `rgba(${c.rgb},${Math.min(1, c.a * k * 1.08)})`);
    gr.addColorStop(.12, `rgba(${c.rgb},${c.a * k})`);
    gr.addColorStop(1, `rgba(${c.rgb},${c.a * k * (1 - dry * .6)})`);
    return gr;
  };
  g.fillStyle = ramp(.6); outlinePath(g, left, right); g.fill();
  g.fillStyle = ramp(.72); outlinePath(g, coreL, coreR); g.fill();
}

// Organic blob (petal, leaf, ink dab): lens-shaped profile, radius modulated by looped noise
export function blob(g, x, y, { len = 20, wid = 5, ang = 0, col = 'rgba(20,18,16,.8)', noi = .5, seed = 0, reso = 24 } = {}) {
  const fun = t => t <= 1 ? Math.pow(Math.sin(t * Math.PI), .5) : -Math.pow(Math.sin((t + 1) * Math.PI), .5);
  const ns = Array.from({ length: reso + 1 }, (_, i) => noise(i * .12, seed + 7.3));
  const drift = (ns[reso] - ns[0]) / reso;
  g.fillStyle = col;
  g.beginPath();
  for (let i = 0; i <= reso; i++) {
    const p = i / reso * 2;
    const xo = len / 2 - Math.abs(p - 1) * len, yo = fun(p) * wid / 2;
    const a = Math.atan2(yo, xo), l = Math.hypot(xo, yo);
    const k = (ns[i] - drift * i) * noi + (1 - noi);
    const px = x + Math.cos(a + ang) * l * k, py = y + Math.sin(a + ang) * l * k;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath(); g.fill();
}

// Accumulating random-walk path (branches, twigs): angles drift by up to ±ben per step
export function walk(r, x, y, ang, len, steps, ben) {
  const pts = [[x, y]];
  let a = ang;
  for (let i = 0; i < steps; i++) {
    a += (ben / 2 + r() * ben / 2) * (r() < .5 ? -1 : 1);
    x += Math.cos(a) * len / steps; y += Math.sin(a) * len / steps;
    pts.push([x, y]);
  }
  return pts;
}

// Living ink line for drawn contours: pressed entry (顿), then the stroke thins as the hand lifts (提)
const LINE_RGB = '34,32,30';
export const press = t => (t < .12 ? .55 + t * 3.75 : 1) * (1 - Math.pow(Math.max(0, t - .12) / .88, 2.4) * .7);
export function inkLine(g, r, pts, w = 1, a = .85, rgb = LINE_RGB) {
  const seed = r() * 99;
  stroke(g, div(pts, 8), { wid: w, fun: press, noi: .45, col: `rgba(${rgb},${a})`, seed, tip: (seed * 7.3) % 1.2 - .6 });
}

// Quadratic Bezier sampled into points
export function quad([x0, y0], [cx, cy], [x1, y1], n = 10) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
  });
}

export function polyPath(pts) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

// Small red paper lantern
export function lantern(g, x, y, s) {
  const lg = g.createRadialGradient(x, y, 1, x, y, 6 * s);
  lg.addColorStop(0, '#ffc488'); lg.addColorStop(1, '#c2402a');
  g.fillStyle = lg; g.beginPath(); g.ellipse(x, y, 4.2 * s, 5.6 * s, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(40,26,18,.9)';
  g.fillRect(x - 2.4 * s, y - 6.4 * s, 4.8 * s, 1.3 * s); g.fillRect(x - 2.4 * s, y + 5.2 * s, 4.8 * s, 1.3 * s);
}

// Painter's contour: the same living line, but broken by dry-brush gaps
export function brokenLine(g, r, pts, w = 1, a = .7, rgb = LINE_RGB, gap = .14) {
  const p = div(pts, 6);
  const perPoint = gap * 3 / p.length;           // `gap` ~ expected breaks per stroke / 3, independent of length
  let run = [p[0]];
  for (let i = 1; i < p.length; i++) {
    if (r() < perPoint && run.length > 4) {
      inkLine(g, r, run, w, a, rgb);
      i += 1 + Math.floor(r() * 2);
      run = [p[Math.min(i, p.length - 1)]];
    } else run.push(p[i]);
  }
  if (run.length > 1) inkLine(g, r, run, w, a, rgb);
}

// Wash laid slightly off its contour, as a painter's colour never registers exactly with the line
export function looseWash(g, r, path, color, blur = 1.5) {
  g.save();
  g.translate((r() - .5) * 2.4, (r() - .5) * 1.6);
  g.filter = `blur(${blur}px)`;
  g.fillStyle = color;
  g.fill(path);
  g.restore();
}

// 界画 ruled line for architecture: guided along a straightedge, so even in width and unbroken
export function ruledLine(g, r, pts, w = 1, a = .7, rgb = LINE_RGB) {
  stroke(g, div(pts, 6), { wid: w, fun: t => (t < .06 ? .8 + t * 3.3 : 1), noi: .12, col: `rgba(${rgb},${a})`, seed: r() * 99, dry: .12 });
}
