// Brush primitives for Canvas 2D: seeded random, smooth curves, dry-brush strokes.

export function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const line = (g, x0, y0, x1, y1) => {
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
};

// Catmull-Rom resample so strokes become smooth curves
export function smooth(pts, n = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    for (let s = 0; s < n; s++) {
      const t = s / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t +
        (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// Dry-brush stroke: tapered solid core + frayed bristle strands with gaps toward the tail
export function brush(g, raw, w0, w1, r, rgb = '28,25,23', core = .88) {
  const pts = smooth(raw), n = pts.length;
  const wAt = i => w0 + (w1 - w0) * Math.pow(i / (n - 1), .8);
  g.lineCap = 'round';
  for (let i = 1; i < n; i++) {
    g.strokeStyle = `rgba(${rgb},${core})`; g.lineWidth = wAt(i) * .75;
    line(g, ...pts[i - 1], ...pts[i]);
  }
  for (let s = 0; s < 7; s++) {
    const off = (r() - .5) * 1.1, a = .2 + r() * .5;
    g.strokeStyle = `rgba(${rgb},${a})`;
    for (let i = 1; i < n; i++) {
      if (r() < .05 + i / n * .12) continue;
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = -(y1 - y0) / len * off * wAt(i), ny = (x1 - x0) / len * off * wAt(i);
      g.lineWidth = wAt(i) * (.15 + r() * .2);
      line(g, x0 + nx, y0 + ny, x1 + nx, y1 + ny);
    }
  }
}

// Flat wash over a Path2D with softened edges
export function wash(g, path, color, blur = 1.5) {
  g.save();
  g.filter = `blur(${blur}px)`;
  g.fillStyle = color;
  g.fill(path);
  g.restore();
}
