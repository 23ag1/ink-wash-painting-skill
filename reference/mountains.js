// Brushwork of the mountain ranges, painted on the ink layer exactly on the ridges the shader computed.
// Order of a painter: 勾 contour along the crests, 皴 hemp-fibre strokes down the fall lines, 点 moss dots on the
// peaks; the washes (染) come from the scene shader. Each range erases the ink of the ranges behind it.
import { rng } from './brush.js';
import { stroke, div, blob, press, quad } from './ink.js';

function sampler({ y, h, step }) {
  const at = (arr, x) => {
    const f = Math.max(0, Math.min(arr.length - 1.001, x / step)), i = Math.floor(f), t = f - i;
    return arr[i] * (1 - t) + arr[i + 1] * t;
  };
  return { Y: x => at(y, x), H: x => at(h, x) };
}

// Everything under this ridge hides the ink behind it
function occlude(g, Y, base) {
  const body = new Path2D();
  body.moveTo(-10, base + 40);
  for (let x = -10; x <= 1290; x += 4) body.lineTo(x, Y(Math.max(0, Math.min(1280, x))) + 1.2);
  body.lineTo(1290, base + 40);
  body.closePath();
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(body); g.restore();
}

// 勾: contour in separate pressured strokes, only where the crest stands clear of the mist
function contour(g, r, Y, H, ink, alpha, w) {
  let x = r() * 20;
  while (x < 1280) {
    const len = 40 + r() * 90, x1 = Math.min(1280, x + len);
    let tall = 0;
    for (let t = x; t <= x1; t += 8) tall = Math.max(tall, H(t));
    if (tall > 24) {
      const pts = [];
      for (let t = x; t <= x1; t += 3) pts.push([t, Y(t)]);
      stroke(g, pts, { wid: w, fun: press, noi: .45, col: `rgba(${ink},${ink},${ink + 3},${alpha})`, seed: r() * 99, tip: (r() - .5) * 1.2, dry: .5 });
    }
    x = x1 + 4 + r() * 20;
  }
}

// 披麻皴: long, slightly bowed hemp-fibre strokes running down the fall line from the crest, lighter than the contour
function hempFibres(g, r, Y, H, ink, alpha, w) {
  for (let x = r() * 8; x < 1280; x += 4 + r() * 6) {
    const h = H(x);
    if (h < 30 || r() > .62) continue;
    const slope = (Y(x + 3) - Y(x - 3)) / 6;                 // screen dy/dx of the crest
    const L = (12 + r() * 26) * (.45 + h / 150);
    const s = [x + (r() - .5) * 3, Y(x) + 2 + r() * 7];
    const dx = Math.sign(slope) * Math.min(.9, Math.abs(slope)) * L * .6;
    const pts = quad(s, [s[0] + dx * .35 + (r() - .5) * 5, s[1] + L * .5], [s[0] + dx, s[1] + L], 6);
    stroke(g, div(pts, 2), { wid: w * (.7 + r() * .6), fun: t => Math.sin(Math.min(1, t * 1.15) * Math.PI) * .8 + .2, noi: .5,
      col: `rgba(${ink + 14},${ink + 14},${ink + 18},${alpha * (.5 + r() * .5)})`, seed: r() * 99, tip: (r() - .5) * 1.4, dry: .85 });
  }
}

// 点苔: clusters of moss dots on the local peaks
function moss(g, r, Y, H, ink) {
  for (let x = 30; x < 1250; x += 6) {
    const h = H(x);
    if (h < 55 || !(Y(x) <= Y(x - 30) && Y(x) <= Y(x + 30)) || r() > .6) continue;
    for (let k = 0; k < 4 + Math.floor(r() * 5); k++) {
      const px = x + (r() - .5) * 36, py = Y(px) + 1 + r() * 7;
      blob(g, px, py, { len: 2.2 + r() * 2.2, wid: 1.6 + r() * 1.3, ang: r() * 3, col: `rgba(${ink - 6},${ink - 4},${ink - 6},.85)`, noi: .4, seed: r() * 99 });
    }
    x += 40;
  }
}

// Only ranges nearer than depth .7 carry brushwork; the far ranges stay as washes (atmospheric perspective)
export function drawMountainInk(c, ridges, layers) {
  if (!ridges) return;
  const r = rng(808);
  for (let i = 0; i < layers.length - 1; i++) {
    const [base, depth] = layers[i], { Y, H } = sampler(ridges[i]);
    occlude(c.l, Y, base);
    if (depth > .7) continue;
    const k = depth / .7, ink = Math.round(16 + k * 70), alpha = .95 - k * .4;
    contour(c.l, r, Y, H, ink, alpha, 2.7 - k * 1.1);
    hempFibres(c.l, r, Y, H, ink, alpha * .75, 1.5 - k * .5);
    if (k < .75) moss(c.l, r, Y, H, ink);
  }
  // the cloud belt across the host massif (scene shader, 藏露) veils its brushwork too
  c.l.save();
  c.l.globalCompositeOperation = 'destination-out';
  for (let x = 0; x < 560; x += 14) {
    const fade = 1 - Math.max(0, (x - 430) / 130);
    blob(c.l, x, 420 + Math.sin(x * .012) * 8, { len: 70, wid: 20, ang: 0, col: `rgba(0,0,0,${.55 * fade})`, noi: .6, seed: x });
  }
  c.l.restore();
}
