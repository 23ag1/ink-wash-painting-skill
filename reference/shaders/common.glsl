// This painting's constants and its aerial perspective. Noise comes from the kit.
#define WATER 540.0
const vec3 PAPER = vec3(.942, .918, .866);   // warm ivory xuan
const vec3 MIST  = vec3(.935, .93, .912);
const vec2 DESIGN = vec2(1280., 720.);

#include "kit/noise.glsl"
float n1(float x, float s) { return noise(vec2(x, s * 17.31)); }

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
