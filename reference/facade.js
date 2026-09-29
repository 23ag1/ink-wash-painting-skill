// Facade details of a pavilion storey, suggested the way a painter would at this distance:
// 隔扇 lattice doors, 槛窗 lattice windows over a low sill wall (冰裂纹 cracked-ice / 步步锦 step patterns),
// an open lamplit bay with a hanging lamp, screen and figures, bamboo blinds, lacquered columns on plinths,
// a painted lintel (彩画) with 挂落 fretwork below it, red couplets, and side-wall windows.
// 界画: ruled lines for all carpentry — `bl` here is the ruled line
import { blob, ruledLine as bl, polyPath, looseWash, lantern } from './ink.js';

const LIGHT = 'rgba(244,184,120,.6)';
// facade carpentry is suggested, not enumerated: lighter than the structural lines of the building
const thin = (c, r, pts, a = .45, w = .45) => bl(c.l, r, pts, w, a * .7, undefined, 0);

function clipTo(g, x0, y0, x1, y1, fn) {
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip(); fn(); g.restore();
}

// Lattice patterns inside a panel
function lattice(c, r, x0, y0, x1, y1, kind) {
  clipTo(c.l, x0, y0, x1, y1, () => {
    if (kind === 'ice') {
      const pts = Array.from({ length: 9 }, () => [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)]);
      pts.forEach((p, i) => {
        const q = pts[(i + 1 + Math.floor(r() * 3)) % pts.length];
        thin(c, r, [p, q], .4);
        thin(c, r, [p, [p[0] + (r() < .5 ? -12 : 12), p[1] + (r() - .5) * 6]], .35);
      });
    } else if (kind === 'step') {
      for (let y = y0 + 2; y < y1; y += 4) thin(c, r, [[x0, y], [x1, y]], .38);
      for (let y = y0, row = 0; y < y1; y += 4, row++)
        for (let x = x0 + (row % 2 ? 2 : 4); x < x1; x += 4) thin(c, r, [[x, y], [x, y + 4]], .38);
    } else {
      for (let x = x0 + 2.5; x < x1; x += 3) thin(c, r, [[x, y0], [x, y1]], .35);
      for (let y = y0 + 2.5; y < y1; y += 3) thin(c, r, [[x0, y], [x1, y]], .35);
    }
  });
  thin(c, r, [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], .6, .6);
}

// 隔扇门: a row of leaves, lattice heart above, waist panel, solid skirt panel below
function door(c, r, x0, x1, top, bot, lit) {
  const leaves = Math.max(2, Math.round((x1 - x0) / 7));
  const lw = (x1 - x0) / leaves, heart = top + (bot - top) * .58;
  if (lit) looseWash(c.w, r, polyPath([[x0, top], [x1, top], [x1, heart], [x0, heart]]), LIGHT, 1.8);
  for (let i = 0; i < leaves; i++) {
    const a = x0 + i * lw + .6, b = a + lw - 1.2;
    lattice(c, r, a + .6, top + .8, b - .6, heart - .4, i % 2 ? 'grid' : 'step');
    thin(c, r, [[a, heart + 1.6], [b, heart + 1.6]], .5);
    thin(c, r, [[a + 1.2, heart + 3.4], [b - 1.2, heart + 3.4], [b - 1.2, bot - 1.4], [a + 1.2, bot - 1.4], [a + 1.2, heart + 3.4]], .4, .4);
    thin(c, r, [[b + .6, top], [b + .6, bot]], .6, .6);
  }
}

// 槛窗: brick sill wall, lattice window above (lit from inside or not)
function windowBay(c, r, x0, x1, top, bot, lit, kind) {
  const sill = top + (bot - top) * .6;
  looseWash(c.w, r, polyPath([[x0, sill], [x1, sill], [x1, bot], [x0, bot]]), 'rgba(150,146,140,.28)', 1);
  for (let y = sill + 2.5; y < bot; y += 2.5) thin(c, r, [[x0 + r() * 3, y], [x1 - r() * 3, y]], .22, .4);
  if (lit) looseWash(c.w, r, polyPath([[x0 + 1, top + 1], [x1 - 1, top + 1], [x1 - 1, sill], [x0 + 1, sill]]), LIGHT, 2);
  lattice(c, r, x0 + 1.5, top + 1.5, x1 - 1.5, sill - .8, kind);
  thin(c, r, [[x0, sill], [x1, sill]], .7, .9);
}

// Open bay: lamplit room, hanging lamp, painted screen at the back, two small figures at a table
function openBay(c, r, x0, x1, top, bot) {
  const g = c.w, cx = (x0 + x1) / 2;
  looseWash(g, r, polyPath([[x0, top], [x1, top], [x1, bot], [x0, bot]]), 'rgba(236,176,112,.55)', 2.5);
  looseWash(g, r, polyPath([[x0 + 4, top + 4], [x1 - 4, top + 4], [x1 - 4, bot - 5], [x0 + 4, bot - 5]]), 'rgba(214,200,170,.5)', 1.2);
  thin(c, r, [[x0 + 4, top + 4], [x1 - 4, top + 4], [x1 - 4, bot - 5], [x0 + 4, bot - 5], [x0 + 4, top + 4]], .45, .5);
  for (let i = 0; i < 3; i++) {
    const hx = x0 + 7 + i * (x1 - x0 - 14) / 3;
    bl(c.l, r, [[hx, top + 9], [hx + 5, top + 6.5], [hx + 9, top + 8]], .5, .3, undefined, 0);
  }
  thin(c, r, [[cx, top], [cx, top + 3]], .6);
  lantern(c.l, cx, top + 5.5, .38);
  thin(c, r, [[cx - 7, bot - 5.5], [cx + 7, bot - 5.5]], .8, 1.1);
  for (const [dx, robe, s] of [[-5, 'rgba(176,52,40,.9)', 1], [5.5, 'rgba(70,84,98,.85)', .9]]) {
    blob(c.l, cx + dx, bot - 7.5 * s, { len: 7 * s, wid: 5.5 * s, ang: -1.5, col: robe, noi: .3, seed: r() * 99 });
    blob(c.l, cx + dx, bot - 12.5 * s, { len: 2.8 * s, wid: 2.6 * s, ang: 0, col: 'rgba(232,216,194,.95)', noi: .2, seed: r() * 99 });
    blob(c.l, cx + dx + .3, bot - 13.7 * s, { len: 2.6 * s, wid: 1.6 * s, ang: 0, col: 'rgba(22,20,18,.9)', noi: .2, seed: r() * 99 });
  }
  thin(c, r, [[x0 + 1, top + 2.2], [x1 - 1, top + 2.2]], .55, 1.6);
}

// Bamboo blind half let down, with its two ties
function blindBay(c, r, x0, x1, top, bot) {
  const low = top + (bot - top) * .55;
  looseWash(c.w, r, polyPath([[x0, low], [x1, low], [x1, bot], [x0, bot]]), 'rgba(236,178,114,.45)', 2);
  looseWash(c.w, r, polyPath([[x0, top], [x1, top], [x1, low], [x0, low]]), 'rgba(192,172,132,.55)', 1);
  for (let y = top + 1.6; y < low; y += 1.9) thin(c, r, [[x0 + .5, y], [x1 - .5, y]], .28, .35);
  thin(c, r, [[x0 - .5, low], [x1 + .5, low]], .7, 1.1);
  for (const f of [.3, .7]) thin(c, r, [[x0 + (x1 - x0) * f, top], [x0 + (x1 - x0) * f, low + 1.5]], .5, .5);
}

// Round moon window (月洞窗) on a receding side face, lattice cross inside
export function moonWindow(c, r, C, u, R) {
  const ring = Array.from({ length: 29 }, (_, i) => {
    const a = i / 28 * 6.2832;
    return [C[0] + u[0] * Math.cos(a) * R * .85, C[1] + u[1] * Math.cos(a) * R * .85 + Math.sin(a) * R];
  });
  looseWash(c.w, r, polyPath(ring), 'rgba(246,184,118,.72)', 1.2);
  c.l.save(); c.l.clip(polyPath(ring));
  for (let k = -3; k <= 3; k++) {
    thin(c, r, [[C[0] + k * 2.6 - 10, C[1] + 10], [C[0] + k * 2.6 + 10, C[1] - 10]], .3);
  }
  c.l.restore();
  bl(c.l, r, ring, 1, .75, undefined, 0);
}

// Lacquered column with a stone plinth
function column(c, r, x, top, bot) {
  looseWash(c.w, r, polyPath([[x - 1.3, top], [x + 1.3, top], [x + 1.3, bot], [x - 1.3, bot]]), 'rgba(146,66,52,.7)', .4);
  blob(c.l, x, bot - .6, { len: 4.6, wid: 2.2, ang: 0, col: 'rgba(120,116,110,.7)', noi: .3, seed: r() * 99 });
  bl(c.l, r, [[x - 1.3, top], [x - 1.3, bot]], .6, .6, undefined, .1);
}

// Everything on the face of one storey. bays: 'door' | 'doorLit' | 'window' | 'windowLit' | 'open' | 'blind'
// eave: y where the roof overhang ends; everything above it is hidden, so the bands start just below it
export function facade(c, r, { x, y, W, H, bays, eave, couplets = false }) {
  const top = Math.max(y - H, eave), bw = W / bays.length;
  for (let t = x + 2.5; t < x + W - 1; t += 4.6)                          // 斗拱 bracket blocks
    blob(c.l, t, top + 1.2, { len: 2.6, wid: 1.9, ang: 0, col: `rgba(44,40,36,${.45 + r() * .2})`, noi: .3, seed: r() * 99 });
  const lintel = top + 2.4, beam = lintel + 3.2, fret = beam + 2.6;
  looseWash(c.w, r, polyPath([[x, lintel], [x + W, lintel], [x + W, beam], [x, beam]]), 'rgba(84,118,116,.42)', .6);
  thin(c, r, [[x, lintel], [x + W, lintel]], .5, .6);
  thin(c, r, [[x, beam], [x + W, beam]], .6, .7);
  for (let t = x + 3; t < x + W - 2; t += 7) thin(c, r, [[t, lintel + .6], [t + 3.5, beam - .6]], .3, .35);
  bays.forEach((kind, i) => {
    const x0 = x + i * bw + 1.8, x1 = x + (i + 1) * bw - 1.8;
    clipTo(c.l, x0, beam, x1, fret, () => {
      thin(c, r, [[x0, fret], [x1, fret]], .45, .5);
      for (let t = x0 + 2; t < x1; t += 3.2) thin(c, r, [[t, beam], [t, fret]], .35, .35);
    });
    const b0 = fret + .6, b1 = y - .6;
    if (kind.startsWith('door')) door(c, r, x0, x1, b0, b1, kind === 'doorLit');
    else if (kind.startsWith('window')) windowBay(c, r, x0, x1, b0, b1, kind === 'windowLit', i % 2 ? 'ice' : 'step');
    else if (kind === 'open') openBay(c, r, x0, x1, b0, b1);
    else if (kind === 'blind') blindBay(c, r, x0, x1, b0, b1);
  });
  for (let i = 0; i <= bays.length; i++) column(c, r, x + i * bw, top, y);
  if (couplets) {
    const mid = Math.floor(bays.length / 2);
    for (const xc of [x + mid * bw + 2.8, x + (mid + 1) * bw - 2.8]) {
      looseWash(c.w, r, polyPath([[xc - 1.2, fret + 1], [xc + 1.2, fret + 1], [xc + 1.2, y - 3], [xc - 1.2, y - 3]]), 'rgba(196,52,40,.85)', .3);
      for (let k = 0; k < 4; k++) blob(c.l, xc, fret + 3 + k * ((y - fret - 6) / 4), { len: 1.4, wid: 1.2, ang: 0, col: 'rgba(30,20,14,.8)', noi: .3, seed: r() * 99 });
    }
  }
}
