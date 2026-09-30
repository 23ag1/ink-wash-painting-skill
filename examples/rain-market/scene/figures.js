// What of a person shows around an umbrella seen from above: the hem of a robe flaring down to two feet,
// a porter's shoulder pole with baskets, or — without an umbrella — a bamboo hat over a straw rain cape (蓑衣).
// Never a face, never legs: cloth, hat and pole carry the figure (减笔).
import { stroke, div, blob } from '../lib/ink.js';
import { up, mix, HV } from './layout.js';
import { glaze, occlude } from './layers.js';

// robe: one 没骨 stroke widening toward the hem, from under the canopy (C) to the feet (g)
export function robe(c, r, C, g, R, s, d, ink) {
  const top = [mix(C[0], g[0], .15), mix(C[1], g[1], .15)];
  const mid = [mix(top[0], g[0], .55) + (r() - .5) * 2 * s, mix(top[1], g[1], .55)];
  stroke(c.l, div([top, mid, g], 6), { wid: Math.max(3, R * .62), fun: t => .55 + .45 * Math.sin(t * 2.2),
    noi: .45, col: `rgba(${ink},${mix(.82, .4, d)})`, seed: r() * 99, tip: .7, dry: .5 });
  if (d < .6) for (const k of [-1, 1]) {                                    // feet: two small dabs on the wet street
    blob(c.l, g[0] + k * R * .16, g[1] + 1.2 * s, { len: 3.2 * s + 1, wid: 1.8 * s + .6, ang: .3, seed: r() * 99,
      col: `rgba(${ink},${mix(.8, .4, d)})`, noi: .5 });
  }
}

// porter's pole across the shoulders, two baskets swinging under its ends
export function pole(c, r, g, R, s, d, ink) {
  const sh = up(g, 22, d), half = R * 1.35, ang = (r() - .5) * .25;
  const a = [sh[0] - Math.cos(ang) * half, sh[1] - Math.sin(ang) * half], b = [sh[0] + Math.cos(ang) * half, sh[1] + Math.sin(ang) * half];
  stroke(c.l, div([a, b], 8), { wid: 1.6 * s + .4, fun: () => 1, noi: .15, col: `rgba(${ink},${mix(.85, .4, d)})`, seed: r() * 99, dry: .2 });
  for (const e of [a, b]) {
    const bk = [e[0] - HV[0] * 12 * s, e[1] - HV[1] * 12 * s];
    stroke(c.l, div([e, bk], 3), { wid: .7, noi: .1, col: `rgba(${ink},.6)`, seed: r() * 99 });
    blob(c.l, bk[0], bk[1] + 2 * s, { len: 9 * s, wid: 7 * s, ang: r() * .6, seed: r() * 99,
      col: `rgba(${ink},${mix(.75, .35, d)})`, noi: .5 });
  }
}

// no umbrella: straw cape as a wedge of dry hatching, bamboo hat as a flat straw disc with a dark crown
export function hatFigure(c, r, u, d, s, ink) {
  const g = u.g, sh = up(g, 24, d), R = 11 * s * u.size;
  for (let k = 0; k < 13; k++) {
    const t = (k / 12 - .5) * 1.7;
    const from = [sh[0] + t * R * .45, sh[1] + Math.abs(t) * 2 * s];
    const to = [g[0] + t * R * .8 + (r() - .5) * 2 * s, g[1] - (1 - Math.abs(t)) * 2 * s];
    stroke(c.l, div([from, to], 6), { wid: (2.2 + r() * 1.8) * s, fun: t2 => .7 + .3 * t2, noi: .5,
      col: `rgba(${ink},${mix(.8, .38, d) * (.6 + r() * .4)})`, seed: r() * 99, tip: .6, dry: .8 });
  }
  const H = up(g, 31, d), hat = new Path2D();
  hat.ellipse(H[0], H[1], R, R * .66, -.12, 0, Math.PI * 2);
  occlude(c, hat, d);
  glaze(c, hat, [178, 150, 98].map(v => Math.round(mix(v, 205, d * .6))), mix(.72, .35, d), mix(.35, .8, d), .5);
  const arc = [], a0 = .2 + r();                                            // one dry sweep along the brim
  for (let k = 0; k <= 10; k++) { const t = a0 + k / 10 * 2.2; arc.push([H[0] + Math.cos(t) * R * .95, H[1] + Math.sin(t) * R * .74]); }
  stroke(c.l, arc, { wid: 1.4 * s + .4, noi: .5, col: `rgba(${ink},${mix(.7, .3, d)})`, seed: r() * 99, tip: .8, dry: .7 });
  blob(c.l, H[0], H[1], { len: R * .45, wid: R * .38, seed: r() * 99, col: `rgba(${ink},${mix(.7, .35, d)})`, noi: .4 });
}
