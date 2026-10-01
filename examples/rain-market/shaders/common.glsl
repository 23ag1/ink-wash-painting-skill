// This painting's constants and its depth model. Noise comes from the kit.
const vec3 PAPER = vec3(.942, .918, .866);   // warm ivory xuan
const vec3 MIST  = vec3(.935, .93, .912);
const vec2 DESIGN = vec2(640., 1280.);        // vertical scroll, design units

#include "kit/noise.glsl"

// design-space position (y down) of the current fragment
vec2 designPos(vec2 fc, vec2 res) { vec2 uv = fc / res; return vec2(uv.x, 1. - uv.y) * DESIGN; }

// ground depth of a design-space row: 0 at the near (bottom) edge, 1 where the street vanishes (y ~ 180)
float groundDepth(float y) { return clamp((1290. - y) / 1110., 0., 1.); }
