// Object layers, painted from the SCENE description: c.w goes through the watercolor pass (soft, bleeding),
// c.l is brush ink laid on top. Paint order matters — whatever is drawn later occludes what is behind it.
import { rng } from '../kit/brush/brush.js';
import { recordInkTimes } from '../kit/brush/inktime.js';
import { drawBroadleaf, drawPine, drawReeds } from './flora.js';
import { drawPlumBranch } from './plum.js';
import { drawHouse, HOUSE_LANTERNS } from './house.js';
import { drawBoat, BOAT_LANTERN } from './boat.js';
import { drawInscription } from '../kit/brush/text.js';
import { drawForeground } from './foreground.js';
import { drawMountainInk } from './mountains.js';
import { drawDistance } from './distance.js';
import { drawShore } from './shore.js';
import { blob } from '../kit/brush/ink.js';
import { SCENE } from './scene.js';

const TREES = { pine: drawPine, broadleaf: drawBroadleaf };

// Lantern positions in scene coords (for the lamp washes and the breathing lamplight overlay)
function lanternsOf(scene) {
  const out = [];
  if (scene.boat) out.push([BOAT_LANTERN[0] + scene.boat.dx, BOAT_LANTERN[1], BOAT_LANTERN[2]]);
  if (scene.pavilion) {
    const { anchor: [ax, ay], scale: k } = scene.pavilion;
    for (const [x, y, s] of HOUSE_LANTERNS) out.push([ax + (x - ax) * k, ay + (y - ay) * k, s * k * .7]);  // veiled like the pavilion
  }
  return out;
}
export const LANTERNS = lanternsOf(SCENE);

function transformed(c, fn, [tx, ty], k = 1, [ax, ay] = [0, 0]) {
  for (const g of [c.w, c.l]) { g.save(); g.translate(tx + ax, ty + ay); g.scale(k, k); g.translate(-ax, -ay); }
  fn();
  for (const g of [c.w, c.l]) g.restore();
}

// Warm lamplight laid as a wash of diluted ochre-red around each lantern (not a glow effect)
function lampWashes(c) {
  LANTERNS.forEach(([x, y, s], i) => {
    for (let k = 0; k < 3; k++)
      blob(c.w, x + (k - 1) * 3 * s, y + 1, { len: (34 - k * 8) * s, wid: (26 - k * 6) * s, ang: .2 * k, col: `rgba(240,176,112,${.1 + k * .05})`, noi: .7, seed: i * 7 + k });
  });
}

// Feet of everything standing at the shore fade into the water mist
function shoreFade(c, W) {
  for (const g of [c.w, c.l]) {
    g.save();
    g.globalCompositeOperation = 'destination-out';
    const fade = g.createLinearGradient(0, 554, 0, 574);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,.8)');
    g.fillStyle = fade; g.fillRect(0, 554, W, 30);
    g.restore();
  }
}

// Layers at device scale S. Order: mountain brushwork (behind all) -> far plane -> banks -> trees & pavilion ->
// reeds -> plum branch -> shore fade -> boat (on the water) -> near ground -> lamp washes -> title.
export function buildObjects(W, H, S, ridges, layers, { record = false } = {}) {
  const mk = () => {
    const cv = document.createElement('canvas');
    cv.width = W * S; cv.height = H * S;
    const g = cv.getContext('2d'); g.scale(S, S);
    return [cv, g];
  };
  const [wash, w] = mk(), [lines, l] = mk();
  const c = { w, l }, r = rng(42), sc = SCENE;
  // the reveal: every ink mark records when it is drawn (kit/brush/inktime.js)
  const timeI = record ? recordInkTimes(l, W * S, H * S, { seed: 31337, dur: .22 }) : null;
  drawMountainInk(c, ridges, layers);
  if (sc.distance) drawDistance(c, ridges, sc.distance);
  drawShore(c, sc.banks || []);
  const [behind, front] = [(sc.trees || []).filter(t => t.kind === 'pine'), (sc.trees || []).filter(t => t.kind !== 'pine')];
  for (const t of behind) TREES[t.kind](c, t.x, t.y, t.s, t.seed);
  if (sc.pavilion) transformed(c, () => drawHouse(c, r), [0, 0], sc.pavilion.scale, sc.pavilion.anchor);
  for (const t of front) TREES[t.kind](c, t.x, t.y, t.s, t.seed);
  for (const [x0, x1, y] of sc.reeds || []) drawReeds(c, r, x0, x1, y);
  if (sc.plum) drawPlumBranch(c, sc.plum);
  shoreFade(c, W);
  if (sc.boat) transformed(c, () => drawBoat(c, r), [sc.boat.dx, 0]);
  if (sc.foreground) drawForeground(c);
  lampWashes(c);
  // the reveal's washes-only stage must not contain the title or the seal (they are written strictly last)
  const washesStage = document.createElement('canvas');
  washesStage.width = wash.width; washesStage.height = wash.height;
  washesStage.getContext('2d').drawImage(wash, 0, 0);
  if (sc.title) drawInscription(c, sc.title);
  return { wash, lines, washesStage, timeI };
}
