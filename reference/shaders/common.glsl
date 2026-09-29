// Shared noise + palette. Prepended to every fragment shader (after the #version header).
#define WATER 540.0
const vec3 PAPER = vec3(.942, .918, .866);   // warm ivory xuan
const vec3 MIST  = vec3(.935, .93, .912);
const vec2 DESIGN = vec2(1280., 720.);

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0., a = .5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= .5; }
  return v / .9375;
}
float fbm2(vec2 p) { return .65 * noise(p) + .35 * noise(p * 2.07 + 13.1); }
float n1(float x, float s) { return noise(vec2(x, s * 17.31)); }
float lum(vec3 c) { return dot(c, vec3(.299, .587, .114)); }

// design-space position (y down) of the current fragment
vec2 designPos(vec2 fc, vec2 res) { vec2 uv = fc / res; return vec2(uv.x, 1. - uv.y) * DESIGN; }

// Aerial perspective for painted objects (design coords, y down): things standing at the shoreline (the whole
// pavilion, trees, reeds) sit as deep as the near ranges and get veiled like them; the boat on the water only
// slightly. The plum branch and the inscription column on the right are near-plane and stay clear.
float objectHaze(vec2 p) {
  float shore = .24 * smoothstep(330., 370., p.y) * (1. - smoothstep(548., 575., p.y));
  float water = .2 * smoothstep(560., 580., p.y) * (1. - smoothstep(630., 640., p.y)) * smoothstep(340., 400., p.x);
  return max(shore, water) * (1. - smoothstep(1040., 1080., p.x));
}
