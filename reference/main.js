import { rng } from '../kit/brush/brush.js';
import { stroke, blob, quad } from '../kit/brush/ink.js';
import { buildObjects, LANTERNS } from './objects.js';
import { createPainting } from './gl.js';
import { SCENE } from './scene.js';

const W = 1280, H = 720, WATER = 540;
const GL_SCALE = Math.min(window.devicePixelRatio || 1, 2);
const UI_SCALE = GL_SCALE;


// Lamplight that barely breathes: a painted warm wash (blurred noisy blob, made once) whose strength drifts
// slowly, like a flame — not a radial glow effect
function makeLampSprites() {
  return LANTERNS.map(([, , s], i) => {
    const size = Math.ceil(90 * s * UI_SCALE), cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const g = cv.getContext('2d');
    g.filter = `blur(${5 * UI_SCALE}px)`;
    g.translate(size / 2, size / 2); g.scale(UI_SCALE, UI_SCALE);
    blob(g, 0, 0, { len: 36 * s, wid: 28 * s, ang: .3, col: 'rgba(242,170,104,.5)', noi: .7, seed: 40 + i });
    return { cv, size };
  });
}

function drawLamps(g, t, sprites, fx = 1) {
  LANTERNS.forEach(([x, y], i) => {
    const { cv, size } = sprites[i];
    g.globalAlpha = fx * (.28 + .1 * Math.sin(t * 1.3 + i * 2.1) + .05 * Math.sin(t * 3.7 + i));
    g.drawImage(cv, x - size / UI_SCALE / 2, y - size / UI_SCALE / 2, size / UI_SCALE, size / UI_SCALE);
  });
  g.globalAlpha = fx;
}

// Wild geese in a loose V toward the moon: each a body dab and two pressured wing strokes, own size and wingbeat
const GEESE = [[0, 0, 1.1, 0], [-18, -8, .95, 1.1], [-34, -13, .85, 2.3], [-16, 9, 1, .6], [-31, 17, .8, 1.8], [-47, 22, .75, 2.9]];
function drawGeese(g, t) {
  const tt = (t + 20) % 80;
  const cx = -80 + tt * 18, cy = 320 - tt * 2.4;
  if (cx > W + 100) return;
  const wing = u => Math.sin(Math.min(1, u * 1.1) * Math.PI) * .85 + .15;
  GEESE.forEach(([dx, dy, s, ph], i) => {
    const x = cx + dx + Math.sin(t * .7 + ph) * 1.5, y = cy + dy, f = Math.sin(t * 4.2 + ph) * 3.2 * s, w = 7.5 * s;
    stroke(g, quad([x, y], [x - w * .45, y - 2 - f * .3], [x - w, y - f], 8), { wid: 2.1 * s, fun: wing, noi: .35, col: 'rgba(34,32,30,.72)', seed: i, dry: .5 });
    stroke(g, quad([x, y], [x + w * .45, y - 2 - f * .3], [x + w, y - f], 8), { wid: 2.1 * s, fun: wing, noi: .35, col: 'rgba(34,32,30,.72)', seed: i + 9, dry: .5 });
    blob(g, x + 1, y + .4, { len: 4.6 * s, wid: 2 * s, ang: .15, col: 'rgba(28,26,24,.8)', noi: .3, seed: i });
  });
}

// A few plum petals let go from the branch and tumble down; they fade before reaching the water
function drawPetals(g, t, petals, r) {
  if (petals.length < 3 && r() < .006) {
    const { x: [x0, x1], y: [y0, y1] } = SCENE.plum.bounds;     // they let go from where the branch is
    petals.push({ x: x0 + (x1 - x0) * (.3 + r() * .65), y: Math.max(0, y0) + (y1 - Math.max(0, y0)) * (.3 + r() * .6), v: 9 + r() * 6, p: r() * 6, seed: r() * 99, tone: r() });
  }
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i];
    p.y += p.v / 60; p.x -= 7 / 60 + Math.sin(t * 1.4 + p.p) * .35;
    const fade = 1 - Math.max(0, (p.y - 380) / 140);
    const col = p.tone < .5 ? '236,76,64' : '243,100,84';
    blob(g, p.x, p.y, { len: 8, wid: 1.4 + Math.abs(Math.sin(t * 2.2 + p.p)) * 5.4, ang: t * 1.1 + p.p, col: `rgba(${col},${.8 * fade})`, noi: .35, seed: p.seed });
    if (fade <= 0) petals.splice(i, 1);
  }
}

export async function start(stage, glc, uic) {
  // the reveal (painting appearing on blank paper, like the rain market): ?still skips it, ?t=3 freezes it
  const q = new URLSearchParams(location.search), still = q.has('still'), freeze = parseFloat(q.get('t'));
  const render = await createPainting(glc, {
    width: W * GL_SCALE, height: H * GL_SCALE, layers: SCENE.layers, masses: SCENE.masses, moon: SCENE.moon, water: SCENE.water !== false,
    build: ridges => buildObjects(W, H, GL_SCALE, ridges, SCENE.layers, { record: !still }), reveal: !still,
  });
  const WASH = [.25, 4.5], FX = 7.2;                 // timeline (s): paper, washes bloom, ink, title last, then life
  uic.width = W * UI_SCALE; uic.height = H * UI_SCALE;
  const ui = uic.getContext('2d');
  const petals = [], pr = rng(99), lamps = makeLampSprites();
  const t0 = performance.now();

  function frame(now) {
    const t = Number.isFinite(freeze) ? freeze : (now - t0) / 1000;
    const progress = still ? 9 : Math.max(0, (t - WASH[0]) / WASH[1]), fx = still ? 1 : Math.max(0, Math.min(1, (t - FX) / 2.5));
    render(t, progress, fx);
    ui.setTransform(1, 0, 0, 1, 0, 0);
    ui.clearRect(0, 0, uic.width, uic.height);
    ui.setTransform(UI_SCALE, 0, 0, UI_SCALE, 0, 0);
    ui.globalAlpha = fx;                              // lamplight, geese and petals come alive after the reveal
    if (fx <= 0) { requestAnimationFrame(frame); return; }
    drawLamps(ui, t, lamps, fx);
    if (SCENE.geese) drawGeese(ui, t);
    if (SCENE.petals && SCENE.plum) drawPetals(ui, t, petals, pr);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
