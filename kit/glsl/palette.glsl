// Palette unifiers. Optional: a blue-green (青绿) or colour-rich picture should not use them.
#include "kit/noise.glsl"
#ifndef KIT_PALETTE
#define KIT_PALETTE

// how strongly a colour reads as a red accent (0..1)
float redness(vec3 c) { return smoothstep(.1, .28, c.r - max(c.g, c.b)); }

// one palette: desaturate everything to `sat` (e.g. .85) except red accents, which keep full colour
vec3 muteExceptReds(vec3 c, float sat) { return mix(vec3(lum(c)), c, mix(sat, 1., redness(c))); }
#endif
