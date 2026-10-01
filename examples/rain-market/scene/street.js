// The wet street: bare paper under a pale wash, with a few darker puddle pools. It is the ground every
// umbrella, stall and wall stands on, so it is painted first.
import { rng } from '../../../kit/brush/brush.js';
import { noise } from '../../../kit/brush/ink.js';
import { edgeL, edgeR, depthAt, scaleAt, mix, inkRGB } from './layout.js';
import { glaze } from './layers.js';

function streetPath(inset = 0) {
  const p = new Path2D(), ys = [];
  for (let y = 1300; y >= 190; y -= 10) ys.push(y);
  ys.forEach((y, i) => { const x = edgeL(y) + inset * scaleAt(depthAt(y)); i ? p.lineTo(x, y) : p.moveTo(x, y); });
  [...ys].reverse().forEach(y => p.lineTo(edgeR(y) - inset * scaleAt(depthAt(y)), y));
  p.closePath();
  return p;
}

function pool(x, y, rx, ry, seed) {
  const p = new Path2D();
  for (let k = 0; k <= 28; k++) {
    const a = k / 28 * Math.PI * 2, n = .7 + .6 * noise(Math.cos(a) * 1.3 + seed, Math.sin(a) * 1.3);
    const px = x + Math.cos(a) * rx * n, py = y + Math.sin(a) * ry * n;
    k ? p.lineTo(px, py) : p.moveTo(px, py);
  }
  p.closePath();
  return p;
}

export function paintStreet(c) {
  const r = rng(505);
  glaze(c, streetPath(-6), [214, 214, 212], .35, .85, 3);
  // puddles: wet darker pools, stretched across the street (the street is seen from above at an angle)
  for (let k = 0; k < 16; k++) {
    const y = 1260 - r() * 900, d = depthAt(y), s = scaleAt(d);
    const x = mix(edgeL(y), edgeR(y), .15 + r() * .7);
    glaze(c, pool(x, y, (18 + r() * 40) * s, (5 + r() * 9) * s, k * 3.1), inkRGB(d, 1.3), mix(.16, .08, d), 1, 2.5);
  }
}
