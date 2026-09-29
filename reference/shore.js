// River banks beside the pavilion, so the building, the pine and the trees stand on ground instead of floating:
// an earth wash, a darker wet strip at the waterline, stones along the edge, grass and moss dots,
// and a faint broken reflection. The bank also runs behind the pavilion (hidden by it).
import { rng } from './brush.js';
import { blob, polyPath, looseWash, inkLine as ln, brokenLine as bl, stroke, div } from './ink.js';


function bank(c, r, { top, water }) {
  const x0 = top[0][0], x1 = top[top.length - 1][0];
  // the lower edge is torn: it dips and rises along the water instead of running as a straight line
  const under = [];
  for (let x = x1 + 6; x >= x0; x -= 8) under.push([x, water + (r() - .3) * 3.5]);
  const shape = polyPath([...top, ...under]);
  c.l.save(); c.l.globalCompositeOperation = 'destination-out'; c.l.fill(shape); c.l.restore();
  looseWash(c.w, r, shape, 'rgba(150,138,114,.68)', 2);
  looseWash(c.w, r, polyPath([...top.map(([x, y]) => [x, (y + water) / 2 + 1]), [x1 + 6, water], [x0, water]]), 'rgba(74,70,62,.5)', 2);
  for (let i = 0; i < 4; i++)
    blob(c.w, x0 + r() * (x1 - x0), water - 5 - r() * 5, { len: 24 + r() * 30, wid: 5 + r() * 4, ang: (r() - .5) * .1, col: 'rgba(120,110,92,.2)', noi: .6, seed: r() * 99 });
  bl(c.l, r, top, 1.9, .78, '30,28,26', .25);
  // wet foot: the bank dissolves into the water over its last few units
  for (const g of [c.w, c.l]) {
    g.save(); g.clip(shape); g.globalCompositeOperation = 'destination-out';
    const f = g.createLinearGradient(0, water - 7, 0, water + 3);
    f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,.7)');
    g.fillStyle = f; g.fillRect(x0 - 5, water - 8, x1 - x0 + 20, 14);
    g.restore();
  }

  // stones along the waterline: a pale top, an ink contour heavier underneath
  for (let x = x0 + 8 + r() * 10; x < x1 - 4; x += 16 + r() * 22) {
    const w = 5 + r() * 7, h = 3 + r() * 3, y = water - 1 - r() * 3;
    const stone = polyPath([[x - w, y], [x - w * .7, y - h], [x + w * .3, y - h * 1.15], [x + w, y - h * .3], [x + w * .9, y]]);
    looseWash(c.w, r, stone, 'rgba(120,118,112,.55)', .6);
    ln(c.l, r, [[x - w, y], [x - w * .7, y - h], [x + w * .3, y - h * 1.15], [x + w, y - h * .3], [x + w * .9, y]], 1.1, .7);
  }
  // grass and moss on the bank
  for (let i = 0; i < 10; i++) {
    const k = Math.floor(r() * (top.length - 1)), t = r();
    const x = top[k][0] + (top[k + 1][0] - top[k][0]) * t, y = top[k][1] + (top[k + 1][1] - top[k][1]) * t;
    if (r() < .5) blob(c.l, x, y + 1, { len: 2.4, wid: 1.6, ang: r() * 3, col: 'rgba(18,20,18,.8)', noi: .4, seed: r() * 99 });
    else for (let g = 0; g < 4; g++) {
      const a = -Math.PI / 2 + (r() - .4) * 1.1, l = 4 + r() * 6;
      stroke(c.l, div([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 3), { wid: .9, fun: u => 1 - u * .8, noi: .3, col: 'rgba(26,30,26,.6)', seed: r() * 99 });
    }
  }
  // the bank's reflection: a few pale broken drags just below the waterline
  for (let i = 0; i < 3; i++)
    ln(c.w, r, [[x0 + r() * 20, water + 2 + i * 2.2], [x1 - r() * 30, water + 2.5 + i * 2.2]], 1.4, .12 - i * .03, '90,84,74');
}

// banks: [{ top: [[x, y], ...], water: y }]
export function drawShore(c, banks) {
  const r = rng(271);
  for (const b of banks) bank(c, r, b);
}
