// Noise and helpers shared by every module. Pure functions, no look decisions.
#ifndef KIT_NOISE
#define KIT_NOISE
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
// 4-octave fractal noise, normalised to ~[0,1]
float fbm(vec2 p) {
  float v = 0., a = .5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= .5; }
  return v / .9375;
}
// cheap 2-octave noise for broad, soft fields
float fbm2(vec2 p) { return .65 * noise(p) + .35 * noise(p * 2.07 + 13.1); }
float lum(vec3 c) { return dot(c, vec3(.299, .587, .114)); }

// design-space position of the fragment, y down (design = size of your design space, e.g. vec2(1280, 720))
vec2 designPos(vec2 fc, vec2 res, vec2 design) { vec2 uv = fc / res; return vec2(uv.x, 1. - uv.y) * design; }

// one glaze: a thresholded noise field — a wash with a ragged but DEFINITE boundary, where the watercolor
// filter pools pigment. lo = threshold (higher = smaller patches), soft = edge width (~.03-.06)
float glaze(vec2 q, float lo, float soft) { return smoothstep(lo, lo + soft, fbm(q)); }
#endif
