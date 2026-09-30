// Geometry of the painting: design space, depth, the oblique projection and the street.
// Everything (tone, scale, detail, wetness) derives from depth d ∈ [0 near .. 1 far] of an object's ground point.
import { smooth } from '../lib/brush.js';

export const DW = 640, DH = 1280;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const mix = (a, b, t) => a + (b - a) * t;

export const depthAt = y => clamp((1290 - y) / 1110);          // ground row → depth (same as the shader)
export const scaleAt = d => 1 - .6 * d;                          // far things are ~40% of near
export const HV = [.42, -.66];                                   // one unit of height, projected (viewer above-left)
export const up = ([x, y], H, d, s = scaleAt(d)) => [x + HV[0] * H * s, y + HV[1] * H * s];

// ink tone by depth: charred near → pale blue-grey far (墨分五色 by distance)
export function inkRGB(d, k = 1) {
  const t = Math.pow(clamp(d), 1.2) * k;
  return [mix(20, 133, t), mix(20, 148, t), mix(23, 166, t)].map(Math.round);
}
export const inkStr = (d, a, k = 1) => `rgba(${inkRGB(d, k).join(',')},${a})`;
export const inkRgbStr = (d, k = 1) => inkRGB(d, k).join(',');

// the street: an S-curve from the near edge up into the rain; half-width shrinks with depth
const SPINE = smooth([[446, 1340], [424, 1130], [362, 930], [288, 740], [240, 560], [262, 390], [336, 262], [410, 190]], 12);
export function streetX(y) {
  for (let i = 1; i < SPINE.length; i++) {
    const [x0, y0] = SPINE[i - 1], [x1, y1] = SPINE[i];
    if (y <= y0 && y >= y1) return mix(x0, x1, (y0 - y) / (y0 - y1 || 1));
  }
  return y > SPINE[0][1] ? SPINE[0][0] : SPINE[SPINE.length - 1][0];
}
export const halfWidth = y => mix(118, 20, Math.pow(depthAt(y), .85));
// the designed void (upper right, same ellipse as scene.frag): 1 at its heart, 0 outside; things near it dissolve
export function voidness([x, y]) {
  const l = Math.hypot((x - 545) / 190, (y - 250) / 240);
  const t = clamp((l - .55) / .5);
  return 1 - t * t * (3 - 2 * t);
}
export const edgeL = y => streetX(y) - halfWidth(y);
export const edgeR = y => streetX(y) + halfWidth(y);
