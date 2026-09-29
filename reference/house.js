// Three-tier waterside pavilion (楼阁) in 界画 oblique projection, painted the way a painter suggests
// architecture: broken contours, washes that don't quite register with the lines, a base lost in mist.
// c.w = wash layer (watercolor pass), c.l = brush-ink layer.
// 界画: architecture is drawn with ruled lines (even, unbroken) — `bl` here is the ruled line
import { blob, ruledLine as bl, quad, polyPath, lantern, looseWash } from './ink.js';
import { facade, moonWindow } from './facade.js';

// Eave-corner lantern positions (local coords), used for the animated glows
export const HOUSE_LANTERNS = [[373, 510, 1], [159, 510, .85], [347, 473, .7], [189, 473, .6]];
const O = [26, -15];                                   // receding direction of side faces
const add = ([x, y], [dx, dy], k = 1) => [x + dx * k, y + dy * k];
const lerp2 = ([ax, ay], [bx, by], t) => [ax + (bx - ax) * t, ay + (by - ay) * t];
const PAPERF = 'rgb(236,232,222)';

// Erase ink lines of anything behind this shape, then lay an opaque paper ground for the washes
function occlude(c, path) {
  c.l.save(); c.l.globalCompositeOperation = 'destination-out'; c.l.fill(path); c.l.restore();
  c.w.fillStyle = PAPERF; c.w.fill(path);
}

// Storey: walls (lit front, shaded side), facade details below the eave, optional moon window on the side
function storey(c, r, { x, y, W, H, k, eave, bays, couplets, sideWindow }) {
  const TL = [x, y - H], TR = [x + W, y - H], BR = [x + W, y], BL = [x, y];
  const front = polyPath([TL, TR, BR, BL]), side = polyPath([TR, add(TR, O, k), add(BR, O, k), BR]);
  occlude(c, front); occlude(c, side);
  looseWash(c.w, r, front, 'rgba(206,186,150,.2)', 2);
  looseWash(c.w, r, side, 'rgba(92,96,104,.28)', 1.5);
  looseWash(c.w, r, polyPath([TL, TR, add(TR, O, k), add(TR, [O[0] * k, O[1] * k + H * .35]), add(TR, [0, H * .35]), add(TL, [0, H * .35])]), 'rgba(70,72,78,.22)', 3);
  facade(c, r, { x, y, W, H, bays, eave, couplets });
  if (sideWindow) moonWindow(c, r, add([x + W, y - H * .42], O, k * .5), [.867, -.5], sideWindow);
  bl(c.l, r, [add(TR, O, k), add(BR, O, k)], 1.2, .5);
  bl(c.l, r, [BL, BR, add(BR, O, k)], 1.2, .55);
}

// Lantern hanging from an upturned eave corner
function cornerLantern(c, r, [x, y], s = .75) {
  bl(c.l, r, [[x, y], [x, y + 7]], .5, .6, undefined, 0);
  lantern(c.l, x, y + 12, s);
}

// Balcony railing along the front and side of a storey base; meiren adds the curved 美人靠 backrest
function railing(c, r, x, y, W, k, meiren = false) {
  const h = 6;
  bl(c.l, r, [[x - 4, y - h], [x + W + 4, y - h], add([x + W + 4, y - h], O, k)], 1.1, .62);
  for (let px = x; px <= x + W; px += 9) bl(c.l, r, [[px, y - h], [px, y]], .6, .4, undefined, 0);
  if (!meiren) return;
  bl(c.l, r, [[x - 5, y - h - 4], [x + W / 2, y - h - 4.6], [x + W + 5, y - h - 4]], .9, .55, undefined, .1);
  for (let px = x - 2; px <= x + W + 2; px += 3.6) bl(c.l, r, [[px, y - h], [px - .8, y - h - 4.2]], .4, .38, undefined, 0);
}

// Hip roof over a storey (a = ridge inset; .5 gives a pyramid), upturned corners, sparse tile hints
function roof(c, r, EFL, EFR, k, R, a, dark = 1) {
  const EBR = add(EFR, O, k), EBL = add(EFL, O, k);
  const RL = add(add(lerp2(EFL, EFR, a), O, k * .5), [0, -R]), RR = add(add(lerp2(EFL, EFR, 1 - a), O, k * .5), [0, -R]);
  const tipL = add(EFL, [-9, -8]), tipR = add(EFR, [9, -8]), tipB = add(EBR, [8, -8]);
  const tips = { tipL, tipR, tipB };
  const front = polyPath([tipL, EFL, EFR, tipR, RR, RL]), rightHip = polyPath([tipR, EFR, EBR, tipB, RR]);
  const leftHip = polyPath([tipL, RL, add(EBL, [-6, -6])]);
  occlude(c, front); occlude(c, rightHip); occlude(c, leftHip);
  const ramp = (p, t, b) => {
    c.w.save(); c.w.clip(p);
    const gr = c.w.createLinearGradient(0, RL[1], 0, EFR[1]);
    gr.addColorStop(0, `rgba(${t})`); gr.addColorStop(1, `rgba(${b})`);
    c.w.fillStyle = gr; c.w.fillRect(EFL[0] - 20, RL[1] - 10, EBR[0] - EFL[0] + 40, EFR[1] - RL[1] + 20);
    for (let i = 0; i < 5; i++)
      blob(c.w, lerp2(EFL, EFR, r())[0], lerp2(RL, EFR, .3 + r() * .6)[1], { len: 30 + r() * 40, wid: 5 + r() * 6, ang: (r() - .5) * .2, col: `rgba(64,80,98,${(.08 + r() * .12) * dark})`, noi: .6, seed: r() * 99 });
    c.w.restore();
  };
  ramp(front, `150,164,178,${.5 * dark}`, `96,110,128,${.78 * dark}`);
  ramp(rightHip, `112,126,142,${.62 * dark}`, `78,92,108,${.85 * dark}`);
  ramp(leftHip, `166,178,190,${.4 * dark}`, `128,142,158,${.55 * dark}`);
  // a few tile hints near the eave, not an enumeration of every tile
  for (let i = 0; i < 6; i++) {
    const t = .1 + r() * .8, top = lerp2(RL, RR, t), bot = lerp2(EFL, EFR, t);
    bl(c.l, r, [lerp2(top, bot, .3 + r() * .2), bot], .6, .15 + r() * .1, undefined, 0);
  }
  for (let t = .04; t < .97; t += .026) {                                  // 瓦当: tile ends along the eave
    const [ex, ey] = lerp2(EFL, EFR, t);
    blob(c.l, ex, ey + 2.2, { len: 1.5, wid: 1.3, ang: 0, col: `rgba(40,42,46,${.35 + r() * .2})`, noi: .3, seed: r() * 99 });
  }
  for (const [from, to] of [[RL, tipL], [RR, tipR]])                         // 脊兽: little beasts near the hip ends
    for (const t of [.68, .78, .88]) {
      const [bx, by] = lerp2(from, to, t);
      blob(c.l, bx, by - 1.6, { len: 2.4, wid: 1.8, ang: -.5, col: 'rgba(36,36,38,.7)', noi: .4, seed: r() * 99 });
    }
  const eave = [...quad(tipL, add(EFL, [2, 3]), add(EFL, [22, 1])), ...quad(add(EFR, [-22, 1]), add(EFR, [-2, 3]), tipR)];
  bl(c.l, r, eave, 2.2, .82, undefined, .06);
  bl(c.l, r, quad(tipR, add(EFR, [O[0] * k * .5 + 8, O[1] * k * .5 - 2]), tipB), 1.6, .7);
  bl(c.l, r, quad(RL, add(lerp2(RL, EFL, .6), [4, 4]), tipL), 1.3, .7);
  bl(c.l, r, quad(RR, add(lerp2(RR, EFR, .6), [-4, 4]), tipR), 1.3, .7);
  bl(c.l, r, quad(RR, add(lerp2(RR, EBR, .6), [0, 3]), tipB), 1.1, .55);
  if (a < .5) bl(c.l, r, [add(RL, [-6, -5]), add(RL, [-2, 1]), add(RR, [2, 1]), add(RR, [6, -5])], 2.6, .85, undefined, 0);
  return { RL, RR, ...tips };
}

// Tiny figure in red at the balcony, turned toward the moon
function moonGazer(c, x, y) {
  blob(c.w, x, y - 4, { len: 9, wid: 6.5, ang: -1.5, col: 'rgba(182,56,42,.9)', noi: .3, seed: 21 });
  blob(c.l, x, y - 10, { len: 3.6, wid: 3.4, ang: 0, col: 'rgba(236,220,198,.95)', noi: .2, seed: 22 });
  blob(c.l, x + .5, y - 11.4, { len: 3.4, wid: 2, ang: 0, col: 'rgba(22,20,18,.9)', noi: .2, seed: 23 });
}

// Potted pine on the deck: glazed pot, a few needle clusters
function pottedPine(c, r, x, y) {
  looseWash(c.w, r, polyPath([[x - 4, y - 5], [x + 4, y - 5], [x + 3, y], [x - 3, y]]), 'rgba(88,104,112,.8)', .4);
  bl(c.l, r, [[x - 4, y - 5], [x + 4, y - 5]], .6, .6, undefined, 0);
  bl(c.l, r, [[x, y - 5], [x - 1.5, y - 10], [x + 1.5, y - 14]], .9, .8, undefined, 0);
  for (const [dx, dy] of [[-3.5, -11], [3, -14.5], [-1, -17]])
    blob(c.l, x + dx, y + dy, { len: 6, wid: 2.4, ang: (r() - .5) * .3, col: 'rgba(30,40,34,.8)', noi: .5, seed: r() * 99 });
}

export function drawHouse(c, r) {
  // deck and stilts
  looseWash(c.w, r, polyPath([[150, 541], [384, 541], [410, 526], [176, 526]]), 'rgba(176,162,136,.16)', 3);
  for (let i = 0; i < 5; i++) bl(c.l, r, [[176 + i * 2 + r() * 20, 529 + i * 2.4], [370 + r() * 20, 529 + i * 2.4]], .5, .18, undefined, .6);
  // stilts down into the water, each with a short broken reflection, and the shadow of the deck on the water
  looseWash(c.w, r, polyPath([[150, 541], [384, 541], [384, 550], [150, 550]]), 'rgba(66,62,56,.24)', 3);
  for (let x = 156; x <= 382; x += 22) {
    const x1 = x + (r() - .5) * 2, y1 = 557 + r() * 3;
    bl(c.l, r, [[x, 541], [x1, y1]], 1.5, .68);
    bl(c.w, r, [[x1, y1 + 1.5], [x1 + (r() - .5) * 1.5, y1 + 6 + r() * 3]], 1.2, .22);
  }
  bl(c.l, r, [[148, 541], [266, 540.5], [384, 541], [410, 526]], 2, .75);

  storey(c, r, { x: 186, y: 534, W: 160, H: 30, k: 1.05, eave: 509, couplets: true, sideWindow: 8.5,
    bays: ['windowLit', 'doorLit', 'open', 'door', 'blind'] });
  railing(c, r, 150, 541, 30, 0);
  pottedPine(c, r, 374, 537);
  const r1 = roof(c, r, [168, 506], [364, 506], 1.05, 14, .2);

  storey(c, r, { x: 214, y: 491, W: 108, H: 24, k: .8, eave: 472, sideWindow: 5.5, bays: ['window', 'windowLit', 'window'] });
  // 匾额: dark name plaque with a gilt border over the middle bay
  looseWash(c.w, r, polyPath([[259, 474.5], [277, 474.5], [277, 480], [259, 480]]), 'rgba(52,62,78,.72)', .5);
  bl(c.l, r, [[260, 475.3], [276, 475.3], [276, 479.2], [260, 479.2], [260, 475.3]], .5, .7, '206,172,98', 0);
  railing(c, r, 214, 491, 108, .8, true);
  moonGazer(c, 300, 490);
  const r2 = roof(c, r, [198, 469], [338, 469], .8, 13, .22, .95);

  storey(c, r, { x: 240, y: 458, W: 58, H: 16, k: .6, eave: 447, bays: ['windowLit', 'window'] });
  const top = roof(c, r, [226, 444], [312, 444], .6, 30, .5, .9);
  bl(c.l, r, [top.RL, add(top.RL, [0, -9])], 1.6, .85, undefined, 0);
  blob(c.l, top.RL[0], top.RL[1] - 10, { len: 3.6, wid: 3.6, ang: 0, col: 'rgba(30,28,26,.9)', noi: .2, seed: 31 });

  cornerLantern(c, r, r1.tipR, 1);
  cornerLantern(c, r, r1.tipL, .85);
  cornerLantern(c, r, r2.tipR, .7);
  cornerLantern(c, r, r2.tipL, .6);

  // the base dissolves into river mist: soften washes and fade ink at the foot of the building
  for (let i = 0; i < 5; i++)
    blob(c.w, 150 + r() * 260, 539 + r() * 8, { len: 60 + r() * 60, wid: 6 + r() * 5, ang: (r() - .5) * .1, col: 'rgba(240,238,232,.28)', noi: .6, seed: r() * 99 });
  c.l.save();
  c.l.globalCompositeOperation = 'destination-out';
  const f = c.l.createLinearGradient(0, 540, 0, 568);
  f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,.4)');
  c.l.fillStyle = f; c.l.fillRect(140, 540, 290, 30);
  c.l.restore();
}
