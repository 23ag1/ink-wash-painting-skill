// Hand-written inscription, painted into the picture rather than typeset over it:
// per-character jitter (size, tilt, baseline), uneven ink load, dry-brush gaps, a wet halo for the
// watercolor pass, and a cinnabar seal with worn edges.
import { rng } from './brush.js';
import { stroke, div, noise } from './ink.js';

function layerLike(g) {
  const c = document.createElement('canvas');
  c.width = g.canvas.width; c.height = g.canvas.height;
  const o = c.getContext('2d');
  o.setTransform(g.getTransform());
  return [c, o];
}

// Draw glyphs [{ch, x, y, size}] as brushed ink into the line layer, with a soft halo in the wash layer
function brushGlyphs(c, r, glyphs, family, ink = [24, 22, 20]) {
  const [cv, o] = layerLike(c.l);
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const { ch, x, y, size } of glyphs) {
    const s = size * (.94 + r() * .12), tilt = (r() - .5) * .07;
    o.save();
    o.translate(x + (r() - .5) * size * .05, y + (r() - .5) * size * .05);
    o.rotate(tilt);
    o.font = `${s}px "${family}", serif`;
    o.textAlign = 'center'; o.textBaseline = 'middle';
    o.fillStyle = `rgba(${ink.join(',')},${.84 + r() * .14})`;
    o.fillText(ch, 0, 0);
    o.restore();
    bounds[0] = Math.min(bounds[0], x - size); bounds[1] = Math.min(bounds[1], y - size);
    bounds[2] = Math.max(bounds[2], x + size); bounds[3] = Math.max(bounds[3], y + size);
  }
  // uneven ink load: lift pigment in soft noisy patches
  o.save();
  o.globalCompositeOperation = 'destination-out';
  for (let y = bounds[1]; y < bounds[3]; y += 3)
    for (let x = bounds[0]; x < bounds[2]; x += 3) {
      const n = noise(x * .06, y * .06 + 40);
      if (n > .55) { o.fillStyle = `rgba(0,0,0,${(n - .55) * .9})`; o.fillRect(x, y, 3, 3); }
    }
  // dry-brush gaps: thin streaks where the hairs ran out of ink
  for (let i = 0; i < glyphs.length * 6; i++) {
    const { x, y, size } = glyphs[Math.floor(r() * glyphs.length)];
    const a = (r() < .6 ? 0 : Math.PI / 2) + (r() - .5) * .5, l = size * (.2 + r() * .35);
    const x0 = x + (r() - .5) * size * .7, y0 = y + (r() - .5) * size * .7;
    stroke(o, div([[x0, y0], [x0 + Math.cos(a) * l, y0 + Math.sin(a) * l]], 6),
      { wid: .5 + r() * size * .018, noi: .8, col: `rgba(0,0,0,${.35 + r() * .45})`, seed: r() * 99 });
  }
  o.restore();
  // wet halo: a faint blurred copy in the wash layer, which the watercolor pass pools and bleeds
  const S = c.w.getTransform().a;
  c.w.save(); c.w.setTransform(1, 0, 0, 1, 0, 0);
  c.w.filter = `blur(${2.5 * S}px)`; c.w.globalAlpha = .22;
  c.w.drawImage(cv, 0, 0);
  c.w.restore();
  c.l.save(); c.l.setTransform(1, 0, 0, 1, 0, 0); c.l.drawImage(cv, 0, 0); c.l.restore();
}

// Cinnabar seal: rough-edged square of seal paste, characters left as paper (白文), worn speckles
function seal(c, r, x, y, size, chars) {
  const g = c.w, pts = [];
  for (let i = 0; i < 24; i++) {
    const t = i / 24 * 4, side = Math.floor(t), f = t - side;
    const [px, py] = [[f, 0], [1, f], [1 - f, 1], [0, 1 - f]][side];
    pts.push([x + px * size + (r() - .5) * 1.2, y + py * size + (r() - .5) * 1.2]);
  }
  g.fillStyle = 'rgba(184,46,38,.9)';
  g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fill();
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.font = `${size * .44}px "Ma Shan Zheng", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(0,0,0,.9)';
  chars.forEach((ch, i) => g.fillText(ch, x + size * (i < 2 ? .72 : .28), y + size * (i % 2 ? .72 : .28)));
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(0,0,0,${.3 + r() * .6})`; g.fillRect(x + r() * size, y + r() * size, .5 + r() * 1.3, .5 + r() * 1.1); }
  g.restore();
}

// Title in large regular script and its seal — the only writing on the painting, so it reads as one accent
// spec: { text, x, y, size, step, seal: { x, y, size, chars: [4 chars] } | null }
export function drawInscription(c, spec) {
  const r = rng(77);
  brushGlyphs(c, r, [...spec.text].map((ch, i) => ({ ch, x: spec.x + (r() - .5) * 4, y: spec.y + i * spec.step, size: spec.size })), 'Ma Shan Zheng');
  if (spec.seal) seal(c, r, spec.seal.x, spec.seal.y, spec.seal.size, spec.seal.chars);
}
