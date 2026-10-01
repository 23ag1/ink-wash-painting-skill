// Painting one house: wet black tiles as 没骨 washes with bare-paper sheen, tile rows as 皴 strokes down the
// slope, ruled ridge / eave / verge (界画) with curled ridge ends, white walls left as paper, shop openings.
import { rng } from '../../../kit/brush/brush.js';
import { stroke, div, blob } from '../../../kit/brush/ink.js';
import { mix, inkRGB, inkRgbStr } from './layout.js';
import { glaze, glazeVia, occlude, poly, roughPoly, wetMark } from './layers.js';

const lerp2 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
const ruled = (g, r, pts, w, a, rgb) =>
  stroke(g, div(pts, 6), { wid: w, fun: t => (t < .06 ? .8 + t * 3.3 : 1), noi: .12, col: `rgba(${rgb},${a})`, seed: r() * 99, dry: .12 });

// point on a slope: u across the house (0 street end .. 1 back), v from ridge (0) to eave (1)
function slopePoint(eave, RE, RB, u, v) {
  u = Math.max(0, Math.min(1, u));
  const k = u * (eave.length - 1), i = Math.min(eave.length - 2, Math.floor(k));
  return lerp2(lerp2(RE, RB, u), lerp2(eave[i], eave[i + 1], k - i), v);
}

function slopeWash(c, r, h, pts, eave, tone, sheen) {
  const rgb = inkRGB(h.dv), path = roughPoly(pts, 1.4 * h.s + .3, h.seed * .13);
  glazeVia(c, g => {
    const soft = (h.row === 2 ? 5 : h.row * 1.2) + Math.max(0, h.d - .55) * 7 + h.fade * 7;          // back rows and the far end: lost in rain
    if (soft) g.filter = `blur(${soft * c.S}px)`;       // back rows: wet, soft, half lost in mist
    g.fillStyle = `rgba(${rgb.join(',')},${tone})`;
    g.fill(path);
    // the brush reloads: a darker second pass along the ridge, ragged at its lower edge
    const band = [];
    for (let k = 0; k <= 8; k++) band.push(slopePoint(eave, h.RE, h.RB, k / 8, .3 + r() * .25));
    g.fillStyle = `rgba(${rgb.join(',')},${tone * .4})`;
    g.fill(poly([h.RE, h.RB, ...band.reverse()]));
    // wet sheen: streaks of bare paper running down the slope where the tiles catch the sky
    g.filter = 'none';
    g.globalCompositeOperation = 'destination-out';
    if (h.fade > .12) {                                             // lost edge: it melts on the side facing the void
      const cx = (h.RE[0] + h.RB[0]) / 2, cy = (h.RE[1] + h.RB[1]) / 2;
      const dx = 545 - cx, dy = 250 - cy, n = Math.hypot(dx, dy) || 1, reach = Math.hypot(h.RB[0] - h.RE[0], 40) * .5;
      const gr = g.createLinearGradient(cx - dx / n * reach, cy - dy / n * reach, cx + dx / n * reach, cy + dy / n * reach);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${Math.min(.97, h.fade * 2.2)})`);
      g.fillStyle = gr; g.fill(path);
    }
    const n = Math.round(sheen * (3 + h.s * 9));
    for (let k = 0; k < n; k++) {
      const u = .05 + r() * .9, v0 = .1 + r() * .4, v1 = Math.min(1, v0 + .25 + r() * .5);
      const p = [slopePoint(eave, h.RE, h.RB, u, v0), slopePoint(eave, h.RE, h.RB, u + (r() - .5) * .02, v1)];
      stroke(g, div(p, 8), { wid: (1.5 + r() * 3) * h.s, noi: .6, col: `rgba(0,0,0,${.2 + r() * .35})`, seed: r() * 99, dry: .5 });
    }
  }, path, mix(.45, .9, h.dv));
}

function tileRows(c, r, h, count, a) {
  const rgb = inkRgbStr(h.dv);
  for (let k = 0; k < count; k++) {
    const u = (k + .5 + (r() - .5) * .6) / count;
    // tile-end discs (瓦当) along the eave: the dotted edge that says "tiled roof" at any distance
    const e = slopePoint(h.Fe, h.RE, h.RB, u, 1);
    blob(c.l, e[0], e[1] + .6 * h.s, { len: 2.6 * h.s + .6, wid: 2.2 * h.s + .5, seed: r() * 99, col: `rgba(${rgb},${a * .9})`, noi: .5 });
    if (r() < .35) continue;                                          // leave gaps: suggest, don't enumerate
    const v0 = .02 + r() * .25, v1 = .55 + r() * .45;
    const p = [slopePoint(h.Fe, h.RE, h.RB, u, v0), slopePoint(h.Fe, h.RE, h.RB, u, v1)];
    stroke(c.l, div(p, 10), { wid: (.8 + r() * .7) * h.s + .3, fun: t => .8 + .2 * Math.sin(t * 3), noi: .35,
      col: `rgba(${rgb},${a * (.45 + r() * .4)})`, seed: r() * 99, tip: .4, dry: .45 });
  }
}

const quadAt = ([G0, G1, T1, T0], u0, u1, v0, v1) => {
  const at = (u, v) => lerp2(lerp2(G0, G1, u), lerp2(T0, T1, u), v);
  return [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
};

function walls(c, r, h) {
  const d = h.dv, rgb = inkRgbStr(d);
  occlude(c, poly(h.wall), d);
  glaze(c, roughPoly(h.wall, 1.2 * h.s, h.seed), [238, 232, 218], .45, .4);                    // white wall: paper with a breath of tone
  if (d < .8) {
    // a white wall on white paper exists only through its dark openings and a few lines (Wu Guanzhong):
    // a tall door, one or two windows of different sizes, the wall's corner and a broken foot line
    const du = .12 + r() * .5, dw = .08 + r() * .07;
    glaze(c, roughPoly(quadAt(h.wall, du, du + dw, 0, .55 + r() * .15), .8 * h.s, h.seed + 3), inkRGB(d), mix(.85, .4, d), .35);
    const n = 1 + Math.floor(h.shop * 2.2);
    for (let k = 0; k < n; k++) {
      const u = Math.min(.9, du + dw + .08 + k * .22 + r() * .1), w = .04 + r() * .06, v0 = .45 + r() * .15;
      glaze(c, roughPoly(quadAt(h.wall, u, u + w, v0, v0 + .14 + r() * .12), .6 * h.s, h.seed + k), inkRGB(d), mix(.8, .35, d), .3);
    }
    const [G0, G1, , T0] = h.wall;
    ruled(c.l, r, [G0, T0], .9 * h.s + .3, mix(.5, .2, d), rgb);
    if (r() < .7) ruled(c.l, r, [lerp2(G0, G1, .05), lerp2(G0, G1, .35 + r() * .4)], .8 * h.s + .3, mix(.35, .15, d), rgb);
  }
  occlude(c, poly(h.gable), d);
  glaze(c, poly(h.gable), [238, 232, 218], .4, .4);
  for (const [a, b] of h.caps) ruled(c.l, r, [a, b], 3 * h.s, mix(.9, .4, d), rgb);   // black coping on steps
  wetMark(c, poly(h.gable), .3);
}

function ridgeLine(c, r, h, rgb, d) {
  const w = mix(2.8, 1.4, d) * h.s + .6, a = mix(.95, .35, d);
  ruled(c.l, r, [h.RE, h.RB], w, a, rgb);
  for (const [P, dir] of [[h.RE, -h.side], [h.RB, h.side]]) {           // curled ridge ends (鸱吻), a small hook
    const k = 5 * h.s;
    stroke(c.l, div([P, [P[0] + dir * k, P[1] - k * .5], [P[0] + dir * k * 1.3, P[1] - k * 1.4]], 6),
      { wid: w * 1.1, noi: .3, col: `rgba(${rgb},${a})`, seed: r() * 99, dry: .3 });
  }
}

export function paintHouse(c, h) {
  const r = rng(h.seed * 7 + 13);
  const d = h.dv, rgb = inkRgbStr(d);
  if (!h.row && h.fade < .5) walls(c, r, h);
  const paper = !h.row;                                               // back rows only glaze: no hard paper edge
  occlude(c, roughPoly(h.back, 1.4 * h.s + .3, h.seed * .13), d, { paper }); occlude(c, roughPoly(h.front, 1.4 * h.s + .3, h.seed * .13), d, { paper });
  const sheen = mix(1, .2, d);
  slopeWash(c, r, h, h.back, h.Be, Math.min(.95, mix(.92, .3, d) * h.tone), sheen * .3);
  slopeWash(c, r, h, h.front, h.Fe, Math.min(.95, mix(.82, .26, d) * h.tone), sheen);
  if (h.row) {                                                         // behind the street: only a ridge hint
    if (d < .85) ruled(c.l, r, [h.RE, h.RB], 1.2 * h.s + .4, mix(.45, .15, d), rgb);
    return;
  }
  if (d > .9) return;                                                  // far: a pale silhouette only
  if (d < .8 && !h.row && h.fade < .25) {
    const count = Math.round(Math.hypot(h.RB[0] - h.RE[0], h.RB[1] - h.RE[1]) / (4.6 * h.s));
    tileRows(c, r, h, Math.round(count * mix(1, .5, d)), mix(.75, .4, d));
  }
  if (h.fade > .12) {                              // dissolving: only the street end keeps a line, and it breaks off
    const keep = Math.max(.15, .7 - h.fade);
    ruled(c.l, r, [h.RE, [mix(h.RE[0], h.RB[0], keep), mix(h.RE[1], h.RB[1], keep)]], 1.2 * h.s + .3, mix(.6, .25, d), rgb);
    return;
  }
  ridgeLine(c, r, h, rgb, d);
  ruled(c.l, r, h.Fe, mix(1.9, 1, d) * h.s + .4, mix(.85, .3, d), rgb);                  // near eave
  ruled(c.l, r, [h.Fe[0], h.RE, h.Be[0]], mix(1.3, .8, d) * h.s + .3, mix(.7, .3, d), rgb);  // verge at the street end
}
