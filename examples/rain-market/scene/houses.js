// Structure of the town (no painting here): footprints, heights and projected roof geometry.
// Every ridge runs ACROSS the street (horizontal on the sheet): the slope facing us shows its tile rows, the eaves
// turn up at the corners, gable ends face the street. Stacked up the scroll they make the rhythm of black roof
// bands and white walls. Row 0 lines the street; rows 1-2 stand behind and fade into mist.
import { rng } from '../../../kit/brush/brush.js';
import { depthAt, scaleAt, up, edgeL, edgeR, mix, DW, voidness } from './layout.js';

const lerp2 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t)];

function row(side, rowIdx, seed) {
  const r = rng(seed), out = [];
  let y = 1450 - r() * 50, i = 0;
  const stop = 215 + rowIdx * 30;                            // right side: sparse above 440, the void is distance
  while (y > stop) {
    const d = depthAt(y), s = scaleAt(d);
    const hall = r() < .18;                                  // now and then a bigger two-storey house
    const len = (hall ? 58 + r() * 34 : 30 + r() * 32) * s;  // house depth along the street
    const lane = r() < .55 ? (14 + r() * 30) * s : 0;        // alleys: a white wall shows between roofs
    const off = rowIdx ? (rowIdx * 150 + (r() - .5) * 90) * s : (r() - .5) * 40 * s;
    const skip = rowIdx ? r() < (side > 0 ? .5 : .35) : side > 0 && r() < .18;          // behind the street the town thins into mist
    const h = {
      side, row: rowIdx, seed: seed * 100 + i, y0: y, y1: y - len, d, off,
      D: (hall ? 150 + r() * 90 : side > 0 && r() < .3 ? 190 + r() * 90 : 50 + r() * 120) * s,
      He: (hall ? 70 : 34) + r() * 34 - rowIdx * 4, rise: (hall ? 28 : 18) + r() * 10,
      step: r() < (rowIdx ? .2 : .35), shop: r(), lift: .5 + r() * .8, tone: .75 + r() * .45,
    };
    h.Hr = h.He + h.rise;
    const g = geometry(h);
    const xs = [...g.front, ...g.back].map(p => p[0]);
    const lost = (g.fade > .78 && r() < .65) || ((g.fade > .35 || rowIdx) && h.D < 90 * s);   // no tiny stray scraps                   // mist has swallowed it: only fragments remain
    if (!skip && !lost && Math.max(...xs) > -10 && Math.min(...xs) < DW + 10) out.push(g);
    y -= len + lane;
    i++;
  }
  return out;
}

// the near plane: one big wet roof corner cropped by the bottom-left of the sheet, the darkest ink in the picture
export function makeNearEave() {
  return geometry({ side: -1, row: 0, seed: 9999, y0: 1335, y1: 1232, d: 0, off: -6, D: 240, He: 92, rise: 30,
    Hr: 126, step: false, shop: .9, lift: 1.2, tone: 1.15, sOverride: 1.45 });
}

// the town right of the street at middle distance: it continues, but mist is swallowing it — a cluster of roofs of
// unequal size with gaps, fading toward the sky (the void's boundary interlocks instead of stopping at a line)
const MIST_TOWN = [[700, 150, 150, 40, .3], [655, 262, 120, 34, .42], [612, 168, 186, 36, .38], [566, 300, 96, 28, .6],
  [532, 196, 140, 30, .5], [478, 262, 110, 26, .7]];
function mistTown() {
  return MIST_TOWN.map(([y0, off, D, len, fade], i) => {
    const d = depthAt(y0), s = scaleAt(d);
    return geometry({ side: 1, row: 1, seed: 7700 + i, y0, y1: y0 - len * s, d, off: off * s, D: D * s,
      He: 40 + i * 3, rise: 22, Hr: 62 + i * 3, step: false, shop: .5, lift: .8, tone: .9, fadeOverride: fade });
  });
}

export function makeHouses() {
  return [row(-1, 0, 101), row(1, 0, 202), row(-1, 1, 303), row(-1, 2, 505), row(1, 1, 404), row(1, 2, 606), mistTown()].flat();
}

// projected points of one house. u runs across the street direction (0 at the street end, 1 at the back),
// the near eave is at ground row y0 (toward the viewer), the far eave at y1.
function geometry(h) {
  const { side, y0, y1, d, D, He, Hr, off } = h;
  const s = h.sOverride || scaleAt(d), ov = 7 * s;
  const ex = y => (side < 0 ? edgeL(y) : edgeR(y)) + side * off;
  const ground = (u, y) => [ex(y) + side * (u * (D + 2 * ov) - ov), y];
  const lift = 6 * h.lift;
  const eave = y => Array.from({ length: 11 }, (_, k) => {
    const t = k / 10, bow = Math.pow(Math.abs(t - .5) * 2, 3.2);          // corners turn up (翼角)
    return up(ground(t, y), He + lift * bow, d, s);
  });
  const ym = (y0 + y1) / 2;
  const Fe = eave(y0 + ov), Be = eave(y1 - ov);
  const RE = up(ground(0, ym), Hr, d, s), RB = up(ground(1, ym), Hr, d, s);
  const front = [...Fe, RB, RE], back = [RE, RB, ...[...Be].reverse()];
  // gable end facing the street (visible on the right row), plain or stepped 马头墙
  const E0 = [ex(y0), y0], E1 = [ex(y1), y1], Em = [ex(ym), ym];
  const gw = (f, H) => up(lerp2(E0, E1, f), H, d, s);
  let gable, caps;
  if (h.step) {
    const top = Hr + 10;
    const hs = [He + 4, mix(He, top, .6), top, mix(He, top, .6), He + 4];
    const fs = [0, .18, .36, .64, .82, 1];
    gable = [E0];
    for (let k = 0; k < 5; k++) gable.push(gw(fs[k], hs[k]), gw(fs[k + 1], hs[k]));
    gable.push(E1);
    caps = hs.map((H, k) => [gw(fs[k] - .03, H), gw(fs[k + 1] + .03, H)]);
  } else {
    gable = [E0, up(E0, He, d, s), up(Em, Hr, d, s), up(E1, He, d, s), E1];
    caps = [];
  }
  // the wall facing us, under the near eave: seen only where an alley opens in front of it
  const B0 = [ex(y0) + side * D, y0];
  const wall = [E0, B0, up(B0, He, d, s), up(E0, He, d, s)];
  const fade = h.fadeOverride ?? voidness([(RE[0] + RB[0]) / 2, (RE[1] + RB[1]) / 2]);
  const dv = Math.min(1, d + (h.row === 2 ? .38 : h.row * .12) + fade * .5);
  return { ...h, s, dv, fade, E0, E1, B0, Fe, Be, RE, RB, front, back, gable, caps, wall };
}
