// Market stalls along both street edges: a sloping cloth awning (pale wash, ruled hem), two poles, a table with
// bowls and baskets as dots (点), a seller under a bamboo hat. Some cook: they are the sources of the steam.
// One awning on the right carries the yellow lantern — the second colour accent.
import { rng } from '../../../kit/brush/brush.js';
import { stroke, div, blob } from '../../../kit/brush/ink.js';
import { depthAt, scaleAt, up, edgeL, edgeR, mix, inkRGB, inkRgbStr, HV } from './layout.js';
import { glaze, occlude, poly } from './layers.js';

const lerp2 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
const ruled = (g, r, pts, w, a, rgb) =>
  stroke(g, div(pts, 6), { wid: w, fun: t => (t < .06 ? .8 + t * 3.3 : 1), noi: .12, col: `rgba(${rgb},${a})`, seed: r() * 99, dry: .12 });

export const LANTERN_Y = 648;

// stalls hang off row-0 houses; key = just before the house so its eave covers the awning's back edge
export function makeStalls(houses) {
  const r = rng(717), out = [];
  const right = houses.filter(h => h.side > 0 && !h.row);
  const host = right.reduce((a, h) => (Math.abs((h.y0 + h.y1) / 2 - LANTERN_Y) < Math.abs((a.y0 + a.y1) / 2 - LANTERN_Y) ? h : a));
  for (const h of houses) {
    if (h.row || h.d > .82 || h.d < .14) continue;
    const lantern = h === host;
    if (!lantern && r() > .5) continue;
    const s = h.s, len = Math.min(h.y0 - h.y1, (34 + r() * 22) * s);
    const y0 = lantern ? h.y0 - (h.y0 - h.y1 - len) * .5 : h.y0 - r() * (h.y0 - h.y1 - len);
    out.push({ side: h.side, y0, y1: y0 - len, d: depthAt(y0), s: scaleAt(depthAt(y0)), key: h.y0 - .5,
      W: (26 + r() * 16) * s, cook: r() < .5, lantern, seed: 40 + out.length * 13, cloth: r() });
  }
  return out;
}

function ground(st, u, y) {                    // u = 0 at the street edge .. 1 at the awning's outer edge
  const ex = st.side < 0 ? edgeL(y) : edgeR(y);
  return [ex - st.side * u * st.W, y];
}

export function paintStall(c, st) {
  const r = rng(st.seed), { d, s } = st, ink = inkRgbStr(d);
  const Hin = 40 + st.cloth * 10, Hout = Hin - 8 - st.cloth * 6, Htab = 15;
  const A = [up(ground(st, 0, st.y0), Hin, d), up(ground(st, 0, st.y1), Hin, d),
    up(ground(st, 1, st.y1), Hout, d), up(ground(st, 1, st.y0), Hout, d)];
  const T = [up(ground(st, .1, st.y0 - 3 * s), Htab, d), up(ground(st, .1, st.y1 + 3 * s), Htab, d),
    up(ground(st, .85, st.y1 + 3 * s), Htab, d), up(ground(st, .85, st.y0 - 3 * s), Htab, d)];
  // table: a dark board with bowls and baskets as dots
  occlude(c, poly(T), d);
  glaze(c, poly(T), inkRGB(d, 1.1), mix(.55, .25, d), .5, .6);
  for (let k = 0; k < 5 + r() * 5; k++) {
    const p = lerp2(lerp2(T[0], T[1], r()), lerp2(T[3], T[2], r()), .5 + (r() - .5) * .8);
    blob(c.l, p[0], p[1] - 1.5 * s, { len: (3 + r() * 4) * s, wid: (2.4 + r() * 3) * s, ang: r() * 3, seed: r() * 99,
      col: `rgba(${ink},${mix(.8, .35, d) * (.5 + r() * .5)})`, noi: .6 });
  }
  // seller: bamboo hat (shallow cone, dark underside) over one stroke of cloth, behind the table
  const sp = up(ground(st, -.05, mix(st.y0, st.y1, .4 + r() * .3)), 0, d);
  const hat = up(sp, 24, d);
  stroke(c.l, div([[hat[0] - HV[0] * 3 * s, hat[1] + 4 * s], sp], 5),
    { wid: 5.5 * s, fun: t => 1 - t * .5, noi: .4, col: `rgba(${ink},${mix(.8, .4, d)})`, seed: r() * 99, tip: .5, dry: .6 });
  const hatPath = new Path2D();
  hatPath.ellipse(hat[0], hat[1], 7.5 * s, 3.4 * s, -.15, 0, Math.PI * 2);
  occlude(c, hatPath, d);
  glaze(c, hatPath, [150, 130, 95], mix(.6, .3, d), .5, .4);
  stroke(c.l, div([[hat[0] - 7 * s, hat[1] + 1 * s], [hat[0], hat[1] + 2.6 * s], [hat[0] + 7 * s, hat[1] + .6 * s]], 4),
    { wid: 1.2 * s + .3, noi: .3, col: `rgba(${ink},${mix(.7, .3, d)})`, seed: r() * 99 });
  // poles from the street to the awning's outer corners
  for (const y of [st.y0, st.y1]) ruled(c.l, r, [ground(st, 1, y), up(ground(st, 1, y), Hout, d)], 1.1 * s + .3, mix(.8, .35, d), ink);
  // awning: loose pale cloth wash, sagging hem, ruled edge
  const sag = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8, p = lerp2(A[3], A[2], t);
    sag.push([p[0], p[1] + Math.sin(t * Math.PI) * 2.5 * s]);
  }
  const cloth = poly([A[0], A[1], ...sag.reverse()]);
  occlude(c, cloth, d);
  const tint = st.cloth < .35 ? [186, 174, 146] : st.cloth < .7 ? [128, 130, 134] : [92, 94, 100];
  const tone = tint.map(v => Math.round(mix(v, 215, d * .5)));
  glaze(c, cloth, tone, mix(.6, .3, d), .8, 1.4);
  const hem = poly([lerp2(A[0], A[3], .55), lerp2(A[1], A[2], .55), ...sag]);   // rain gathers toward the hem
  glaze(c, hem, tone, mix(.4, .2, d), .95, 2.2 * s);
  ruled(c.l, r, sag, 1.2 * s + .3, mix(.75, .3, d), ink);
  if (st.lantern) st.hook = lerp2(A[3], A[2], .5);                     // painted later: it hangs above the crowd
  return st.cook ? [up(ground(st, .5, mix(st.y0, st.y1, .5)), Hout + 2, d)] : [];
}

// the yellow paper lantern: a warm wet wash, darker caps, a tassel, and its warm smear on the wet street
export function paintLantern(c, st) {
  const { hook, d } = st, s = st.s * 1.6, ink = inkRgbStr(d);
  const L = [hook[0], hook[1] + 18 * s];
  stroke(c.l, div([hook, [L[0], L[1] - 8 * s]], 4), { wid: .8, noi: .1, col: `rgba(${ink},.7)`, seed: 3 });
  const body = new Path2D();
  body.ellipse(L[0], L[1], 8.5 * s, 10.5 * s, 0, 0, Math.PI * 2);
  occlude(c, body, d);
  glaze(c, body, [226, 172, 58], .9, .85, .6);
  const core = new Path2D();
  core.ellipse(L[0] + 1.6 * s, L[1] - 1.4 * s, 4.6 * s, 6.4 * s, 0, 0, Math.PI * 2);
  glaze(c, core, [250, 214, 120], .35, .9, 1.2);
  for (const dy of [-10.2, 9.6]) {
    const cap = new Path2D();
    cap.ellipse(L[0], L[1] + dy * s, 4.6 * s, 1.7 * s, 0, 0, Math.PI * 2);
    glaze(c, cap, inkRGB(d), .85, .3);
  }
  stroke(c.l, div([[L[0], L[1] + 10.5 * s], [L[0] + .8, L[1] + 16 * s]], 4), { wid: 1.4 * s, fun: t => 1 - t * .7, noi: .3, col: 'rgba(150,40,30,.8)', seed: 7 });
  const g = up(L, -44, d), refl = new Path2D();             // the lantern mirrored in the wet street
  refl.ellipse(g[0] - 6 * s, g[1] + 16 * s, 6 * s, 20 * s, .5, 0, Math.PI * 2);
  glaze(c, refl, [224, 180, 90], .3, 1, 3 * s);
}
