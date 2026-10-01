// Moving atmosphere for the per-frame pass. All parameters are yours; nothing here is on by default.
#include "kit/noise.glsl"
#ifndef KIT_ATMOS
#define KIT_ATMOS

// One sheet of rain: sparse columns across the fall direction `dir` (unit vector, design space, y down),
// one tapered streak per column per period. spacing/len/width in design units, speed in units/s,
// dens = fraction of columns that rain, seed separates sheets, sc = device pixels per design unit.
// Returns coverage 0..1 — mix toward a rain colour darker than paper, lighter than wet ink.
float rainStreaks(vec2 p, vec2 dir, float t, float spacing, float len, float speed, float width, float dens, float seed, float sc) {
  vec2 q = vec2(dot(p, vec2(dir.y, -dir.x)), dot(p, dir));
  float col = floor(q.x / spacing);
  if (hash(vec2(col, seed)) > dens) return 0.;
  float cx = (col + .5 + (hash(vec2(col, seed + 1.)) - .5) * .6) * spacing;
  float l = len * (.6 + .8 * hash(vec2(col, seed + 3.)));
  float period = l * (4. + 5. * hash(vec2(col, seed + 2.)));
  float v = mod(q.y - t * speed * (.85 + .3 * hash(vec2(col, seed + 4.))) + hash(vec2(col, seed + 5.)) * 999., period);
  float u = v / l;
  if (u > 1.) return 0.;
  float taper = smoothstep(0., .25, u) * (1. - smoothstep(.55, 1., u));
  float w = width * (.4 + .6 * taper);
  float across = 1. - smoothstep(w * .5, w * .5 + 1. / sc, abs(q.x - cx));
  return across * taper * (.6 + .4 * hash(vec2(col, seed + 6.)));
}

// A plume of steam/smoke rising from `src` (design units, y down), `scale` = size, leaning with `lean` (dx per
// unit of height), swaying, torn by noise. Returns coverage 0..1 — mix toward the mist/paper colour.
float plume(vec2 p, vec2 src, float scale, float lean, float t) {
  vec2 q = (p - src) / scale;
  float h = -q.y;
  float off = h * lean + sin(h * .045 - t * .5 + src.x) * 3.5;
  float w = 6. + h * .45;
  float n = fbm(vec2((q.x - off) * .07, (h - t * 11.) * .04) + src * .01);
  float m = exp(-pow((q.x - off) / w, 2.)) * smoothstep(0., 12., h) * (1. - smoothstep(55., 150., h));
  return m * smoothstep(.3, .7, n) * (1. - smoothstep(30., 150., h) * .6);
}

// slowly drifting torn mist field 0..1 (two octaves moving in opposite directions). freq = (x, y) frequency of
// the main octave, speed = drift in units/s. Shape it with your own bands/masks (where mist lies).
float mistDrift(vec2 p, float t, vec2 freq, float speed) {
  return fbm2(vec2(p.x * freq.x - t * speed, p.y * freq.y + 3.)) * .7
       + fbm2(vec2(p.x * freq.x * 2.571 + t * speed * .667, p.y * freq.y * 1.786)) * .3;
}
#endif
