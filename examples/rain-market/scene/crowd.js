// The crowd: umbrellas seen from above, each one wet 没骨 blob (dark back, pale belly) with a few ribs, the
// person reduced to one slanted stroke from under the rim to the feet (legs hidden in cloth and rain), and a
// soft reflection on the wet street. Near: big, dark, crisp. Far: pale dots dissolving in the rain.
import { rng } from '../../../kit/brush/brush.js';
import { stroke, div, noise } from '../../../kit/brush/ink.js';
import { depthAt, scaleAt, up, edgeL, edgeR, mix, clamp, inkRGB, inkRgbStr, HV } from './layout.js';
import { glaze, occlude } from './layers.js';
import { robe, pole, hatFigure } from './figures.js';

export const RED = { g: [298, 792], size: 1.12, kind: 'red' };
const NEAR = [{ g: [492, 1276], size: 3.1, kind: 'dark' }, { g: [372, 1290], size: 2.4, kind: 'oil' },
  { g: [430, 1206], size: 1.8, kind: 'mid' }, { g: [362, 1140], size: 1.4, kind: 'dark' }, { g: [452, 1112], size: 1.3, kind: 'hat' }];

function density(x, y) {
  // three groups of unequal size with paper between them (疏密): the host around the red umbrella, a smaller
  // knot nearer, a thin stream far up; elsewhere only stragglers
  const g = (cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
  const base = y > 1040 ? .03 : y > 460 ? .1 : .35;
  return base + 1.1 * g(300, 800, 85, 125) + .8 * g(392, 1000, 50, 45) + .6 * g(238, 470, 45, 110);
}

export function makeCrowd() {
  const r = rng(909), out = [...NEAR.map(u => ({ ...u })), { ...RED }];
  for (let tries = 0; tries < 6000 && out.length < 105; tries++) {
    const y = 250 + r() * 820, d = depthAt(y), s = scaleAt(d);
    const x = mix(edgeL(y) + 10 * s, edgeR(y) - 10 * s, r());
    if (r() * 1.5 > density(x, y)) continue;
    const size = .7 + Math.pow(r(), 2) * .7, R = 21 * s * size;
    const ok = out.every(o => {
      const so = scaleAt(depthAt(o.g[1])) * 21 * o.size;
      return Math.hypot(o.g[0] - x, (o.g[1] - y) * 1.25) > (R + so) * .62;
    });
    if (ok) out.push({ g: [x, y], size });
  }
  return out.map((u, i) => ({ ...u, seed: i * 17 + 3, kind: u.kind || pickKind(rng(i * 31 + 7)) }));
}

function pickKind(r) {
  const k = r();
  return k < .38 ? 'dark' : k < .72 ? 'mid' : k < .88 ? 'oil' : 'hat';
}

function canopyPath(C, R, ribs, seed, rot, tilt = 0, squash = .84) {
  const p = new Path2D();
  for (let k = 0; k <= 48; k++) {
    const a = k / 48 * Math.PI * 2;
    const scallop = 1 - .035 * Math.abs(Math.sin((a - rot) * ribs / 2));
    const n = .92 + .16 * noise(Math.cos(a) * 1.1 + seed, Math.sin(a) * 1.1);
    const lx = Math.cos(a) * R * scallop * n, ly = Math.sin(a) * R * squash * scallop * n;
    const x = C[0] + lx * Math.cos(tilt) - ly * Math.sin(tilt), y = C[1] + lx * Math.sin(tilt) + ly * Math.cos(tilt);
    k ? p.lineTo(x, y) : p.moveTo(x, y);
  }
  p.closePath();
  return p;
}

function canopyTone(kind, d) {
  const fade = 1 - .55 * d;
  if (kind === 'red') return { rgb: [176, 48, 36], a: .86 };
  if (kind === 'oil') return { rgb: [150, 128, 92].map(v => Math.round(mix(v, 200, d * .6))), a: .62 * fade };
  return { rgb: inkRGB(d, kind === 'dark' ? 1 : 1.25), a: (kind === 'dark' ? .85 : .62) * fade };
}

export function paintUmbrella(c, u) {
  const r = rng(u.seed), d = depthAt(u.g[1]), s = scaleAt(d);
  const R = 21 * s * u.size, C = up(u.g, 30 + r() * 6, d), ink = inkRgbStr(d);
  const tone = canopyTone(u.kind, d);
  // reflection on the wet street: the umbrella mirrored below the feet, stretched toward us, broken
  const refl = new Path2D(), L = 34 * s * u.size;
  const rx = u.g[0] - HV[0] * L * .6, ry = u.g[1] - HV[1] * L * .6;
  refl.ellipse(rx, ry, R * .55, L * .45, Math.atan2(-HV[0], -HV[1]) * -1, 0, Math.PI * 2);
  glaze(c, refl, tone.rgb, tone.a * .22, 1, 2.5 * s + 1);
  if (u.kind === 'hat') { hatFigure(c, r, u, d, s, ink); return; }
  // the person: the robe's hem under the rim, now and then a porter's pole sticking out on both sides
  if (d < .85) {
    robe(c, r, C, u.g, R, s, d, ink);
    if (u.seed % 7 === 2 && d < .7 && u.size < 1.5) pole(c, r, u.g, R, s, d, ink);
  }
  // the canopy
  // held against the rain, each umbrella tilts its own way: an ellipse, never a flat disc facing us
  const tilt = (r() - .5) * 1.4, squash = .62 + r() * .26;
  const ribs = 8, rot = r() * Math.PI, path = canopyPath(C, R, ribs, u.seed * .37, rot, tilt, squash);
  occlude(c, path, d);
  glaze(c, path, tone.rgb, tone.a, clamp(mix(.22, .9, Math.pow(d, 1.5))), .4);     // near canopies drier, crisper
  const back = new Path2D();                                        // the brush's darker load on one side
  const k = R * squash * .38;                                        // the underside shows along the low edge
  back.ellipse(C[0] - Math.sin(tilt) * k, C[1] + Math.cos(tilt) * k, R * .86, R * squash * .5, tilt, 0, Math.PI * 2);
  glaze(c, back, tone.rgb, tone.a * .6, .8, R * .12);
  if (d < .36 && R > 15) {                                             // a few ribs, only where the eye is close
    const a = mix(.4, .18, d) * (u.kind === 'red' ? .7 : 1);
    for (let k = 0; k < ribs; k++) {
      if (r() < .55) continue;
      const t = rot + k / ribs * Math.PI * 2;
      const P = [C[0] + Math.cos(t) * R * .92, C[1] + Math.sin(t) * R * .78];
      stroke(c.l, div([[C[0] + Math.cos(t) * R * .12, C[1] + Math.sin(t) * R * .1], P], 6),
        { wid: .7 + .5 * s, fun: t2 => 1 - t2 * .5, noi: .3, col: `rgba(${ink},${a})`, seed: r() * 99, dry: .4 });
    }
    stroke(c.l, div([[C[0] - 1, C[1]], [C[0] + 1.2, C[1] - .6]], 3), { wid: 2.4 * s, noi: .2, col: `rgba(${ink},${a + .2})`, seed: r() * 99 });
  }
  if (d < .62) rimStroke(c, r, C, R, u, d, s, ink);
}

// one dry side-brush (侧锋) sweep along the lower rim: the hard edge that the soft wet canopy needs
function rimStroke(c, r, C, R, u, d, s, ink) {
  const a0 = .15 + r() * .6, span = 1.4 + r() * 1.2, pts = [];
  for (let k = 0; k <= 12; k++) {
    const t = a0 + span * k / 12;
    pts.push([C[0] + Math.cos(t) * R * .97, C[1] + Math.sin(t) * R * .82]);
  }
  const rgb = u.kind === 'red' ? '118,30,24' : ink;
  stroke(c.l, pts, { wid: (2 + r() * 2.2) * s + .5, noi: .5, col: `rgba(${rgb},${mix(.92, .4, d)})`, seed: r() * 99, tip: .9, dry: .8 });
}
