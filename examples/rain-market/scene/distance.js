// The void's job: distance. Where the street turns away, a pagoda rises out of the rain — only pale wet eave
// bands, no lines, its base swallowed by mist — with a few far roofs at its foot. It gives the empty paper a
// meaning (the town continues, far away) without filling it.
import { rng } from '../../../kit/brush/brush.js';
import { inkRGB, mix } from './layout.js';
import { glaze, occlude, roughPoly } from './layers.js';

const PAGODA = { x: 428, base: 318, tiers: 5, w: 96, h: 36 };
const TIER_H = [1, .9, .86, .74, .7];           // uneven storeys, never a regular ladder
const MIST_BELT = 1;                            // a cloud belt crosses the second storey (藏露)

function eaveBand(cx, y, w, t, lift) {
  const pts = [];
  for (let k = 0; k <= 10; k++) {                              // underside of the eave, corners turned up
    const u = k / 10 - .5, bow = Math.pow(Math.abs(u) * 2, 3);
    pts.push([cx + u * w, y - lift * bow]);
  }
  for (let k = 10; k >= 0; k--) {                              // roof slope above it, narrower
    const u = k / 10 - .5;
    pts.push([cx + u * w * .7, y - t - lift * .6 * Math.pow(Math.abs(u) * 2, 3)]);
  }
  return pts;
}

export function paintDistance(c) {
  const r = rng(4242), d = .9, rgb = inkRGB(d);
  // far roofs at the pagoda's foot: three pale bands of unequal size, one half lost
  for (const [x, y, w] of [[372, 340, 84], [492, 352, 120], [556, 322, 54]]) {
    const band = roughPoly([[x - w / 2, y], [x + w / 2, y + 2], [x + w * .4, y - 15], [x - w * .44, y - 17]], 1.5, x);
    occlude(c, band, d, { paper: false });
    glaze(c, band, rgb, .4 + r() * .15, 1, 2.2);
  }
  const P = PAGODA;
  let y = P.base;
  for (let i = 0; i < P.tiers; i++) {
    const k = i / (P.tiers - 1), w = P.w * (1 - .5 * k), veil = i === MIST_BELT ? .35 : 1;
    if (i) y -= P.h * TIER_H[i];
    const body = roughPoly([[P.x - w * .32, y], [P.x + w * .32, y], [P.x + w * .3, y - P.h * .7], [P.x - w * .3, y - P.h * .7]], 1, i);
    glaze(c, body, rgb, .3 * veil, 1, 1.5);                             // walls: barely a breath of tone
    const eave = roughPoly(eaveBand(P.x + (r() - .5) * 3, y - P.h * .62, w, 17 * (1 - .3 * k), 9 * (1 - .3 * k)), 1.8, i + 20);
    occlude(c, eave, d, { paper: false });
    glaze(c, eave, rgb, mix(.72, .86, k) * veil, 1, 1.6);               // upper tiers a touch darker: they clear the mist
  }
  const top = y - P.h * .7;
  glaze(c, roughPoly([[P.x - 1.6, top + 6], [P.x + 1.6, top + 6], [P.x + .8, top - 26], [P.x - .8, top - 26]], .4, 9), rgb, .4, .9, .8);
}
