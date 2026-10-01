// The four canvases every mark writes into.
//   w   wash: opaque white; washes are MULTIPLIED in, so glazes darken and never cover
//   wet wetness: grey value, max-combined; diffusion runs only where wet
//   l   ink: crisp brush layer on transparent
//   d   depth: grey = depth of the nearest thing painted there (0 near .. 1 far); air is far
export const DW = 640, DH = 1120;               // hanging scroll, design units, y down

function ctx2d(S) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(DW * S); cv.height = Math.round(DH * S);
  const g = cv.getContext('2d');
  g.setTransform(S, 0, 0, S, 0, 0);
  return [cv, g];
}

export function makeLayers(S) {
  const [cw, w] = ctx2d(S), [cwet, wet] = ctx2d(S), [cl, l] = ctx2d(S), [cd, d] = ctx2d(S);
  w.fillStyle = '#fff'; w.fillRect(0, 0, DW, DH);
  wet.fillStyle = '#000'; wet.fillRect(0, 0, DW, DH);
  d.fillStyle = grey(.95); d.fillRect(0, 0, DW, DH);
  return { S, w, wet, l, d, canvases: { wash: cw, wet: cwet, ink: cl, depth: cd } };
}

export const grey = v => { const k = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${k},${k},${k})`; };

export function poly(pts) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

// record the depth of a linear thing (branch, strand) so the aerial veil treats it as near/far correctly
export function depthLine(c, pts, width, depth) {
  const g = c.d;
  g.save(); g.strokeStyle = grey(depth); g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke(); g.restore();
}

// a glaze: colour multiplied into the wash layer, wetness recorded alongside
export function glaze(c, path, rgb, a, wet, blur = 0) {
  for (const [g, style, op] of [[c.w, `rgba(${rgb},${a})`, 'multiply'], [c.wet, grey(wet), 'lighten']]) {
    g.save();
    g.globalCompositeOperation = op;
    if (blur) g.filter = `blur(${blur * c.S}px)`;
    g.fillStyle = style;
    g.fill(path);
    g.restore();
  }
}

// an object in front: paper under its silhouette, ink behind it erased, its depth recorded
export function occlude(c, path, depth) {
  c.w.save(); c.w.fillStyle = '#fff'; c.w.fill(path); c.w.restore();
  c.l.save(); c.l.globalCompositeOperation = 'destination-out'; c.l.fillStyle = '#000'; c.l.fill(path); c.l.restore();
  c.d.save(); c.d.fillStyle = grey(depth); c.d.fill(path); c.d.restore();
}

// directional dissolution: inside `path`, everything fades to paper from y0 (kept) to y1 (gone)
export function dissolve(c, path, y0, y1) {
  const fade = (g, colour, op) => {
    g.save(); g.clip(path); g.globalCompositeOperation = op;
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, colour.replace('A', '0')); gr.addColorStop(1, colour.replace('A', '1'));
    g.fillStyle = gr; g.fillRect(0, Math.min(y0, y1), DW, Math.abs(y1 - y0));
    g.fillStyle = colour.replace('A', '1');
    if (y1 > y0) g.fillRect(0, y1, DW, DH); else g.fillRect(0, 0, DW, y1);
    g.restore();
  };
  fade(c.w, 'rgba(255,255,255,A)', 'source-over');
  fade(c.l, 'rgba(0,0,0,A)', 'destination-out');
  fade(c.d, 'rgba(242,242,242,A)', 'source-over');                    // the dissolved base is air again
}
