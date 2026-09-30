// The whole picture in painter's order: ground first, then every object far → near by its ground row,
// so each nearer thing covers (and erases the ink of) whatever stands behind it. Then the near-plane eave,
// and last the one inscription with its seal on the mist at the top.
import { paintStreet } from './street.js';
import { makeHouses, makeNearEave } from './houses.js';
import { paintHouse } from './roofs.js';
import { makeStalls, paintStall, paintLantern } from './stalls.js';
import { makeCrowd, paintUmbrella } from './crowd.js';
import { drawInscription } from '../lib/text.js';
import { paintDistance } from './distance.js';

const TITLE = { text: '雨市', x: 560, y: 110, size: 46, step: 54, seal: { x: 545, y: 192, size: 25, chars: ['烟', '雨', '人', '家'] } };

export function paintScene(c) {
  paintStreet(c);
  paintDistance(c);                                            // farthest first: the pagoda in the rain
  const houses = makeHouses();
  const steam = [], stalls = makeStalls(houses);
  const items = [
    ...houses.map(h => ({ y: h.y0, draw: () => paintHouse(c, h) })),
    ...stalls.map(st => ({ y: st.key, draw: () => steam.push(...paintStall(c, st).map(p => [...p, st.s])) })),
    ...makeCrowd().map(u => ({ y: u.size > 1.8 ? 9e3 + u.g[1] : u.g[1], draw: () => paintUmbrella(c, u) })),
  ];
  items.push({ y: 7e3, draw: () => stalls.filter(st => st.hook).forEach(st => paintLantern(c, st)) });
  items.push({ y: 8e3, draw: () => paintHouse(c, makeNearEave()) });   // near eave, then the nearest umbrellas
  items.sort((a, b) => a.y - b.y).forEach(it => it.draw());
  // the inscription is near-plane: no haze, no mist over it (depth 0 under its column)
  c.d.save();
  c.d.translate(TITLE.x, TITLE.y + 50); c.d.scale(1, 2.2);
  const g = c.d.createRadialGradient(0, 0, 10, 0, 0, 70);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.d.fillStyle = g; c.d.fillRect(-70, -70, 140, 140);
  c.d.restore();
  drawInscription(c, TITLE);
  return { steam: steam.slice(-6) };
}
