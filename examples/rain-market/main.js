// 雨市 — a rain market as a hanging scroll. Paints every mark once into the layers, then hands them to the
// GL pipeline (diffusion, watercolor filter, ink) and animates only steam and rain.
import { DW, DH } from './scene/layout.js';
import { makeLayers } from './scene/layers.js';
import { paintScene } from './scene/painting.js';
import { paint } from './gl.js';

async function start() {
  const canvas = document.getElementById('gl');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const fitted = Math.min(innerWidth / DW, innerHeight / DH) * dpr;
  const forced = Number(new URLSearchParams(location.search).get('s'));   // ?s=3 renders sharper, for zoom checks
  const S = Math.min(4, Math.max(forced || fitted, 1));                   // never below 1 device px per unit
  const c = makeLayers(S);
  canvas.width = c.W; canvas.height = c.H;
  await document.fonts.load('40px "Ma Shan Zheng"', '雨市').catch(() => []);
  const { steam } = paintScene(c);
  await paint(canvas, c.canvases, { steam });
}

start().catch(err => {
  console.error('Painting failed:', err);
  document.body.textContent = `Не удалось нарисовать картину: ${err.message}`;
});
