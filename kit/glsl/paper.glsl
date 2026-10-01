// The sheet: tone mottling, fibres, blotches, ageing. Each is optional; the colours and amounts are yours
// (xuan is warm ivory and ages warm; silk is smoother and darker; dyed or gold-flecked papers exist too).
#include "kit/noise.glsl"
#ifndef KIT_PAPER
#define KIT_PAPER

// fibre direction field — use the SAME dirScale here and in the diffusion pass so ink creeps along the fibres
// you see. Returns design-space coords rotated into the local fibre frame.
vec2 fibreFrame(vec2 dp, float dirScale) {
  float ang = fbm(dp * dirScale) * 9.42;
  vec2 fdir = vec2(cos(ang), sin(ang));
  return vec2(dot(dp, fdir), dot(dp, vec2(-fdir.y, fdir.x)));
}

// low-frequency uneven sheet tone: amount = peak-to-peak (~.03)
vec3 paperMottle(vec3 c, vec2 dp, float amount) { return c * ((1. - amount * .5) + amount * fbm(dp * vec2(.03, .12))); }

// long thin light fibres in the sheet (light ~.55) and pigment settling beside them (settle ~.07)
vec3 paperFibres(vec3 c, vec2 dp, float dirScale, float light, float settle) {
  vec2 q = fibreFrame(dp, dirScale);
  float fib = pow(1. - abs(2. * noise(vec2(q.x * .05, q.y * 1.6)) - 1.), 18.);
  float fib2 = pow(1. - abs(2. * noise(vec2(q.x * .04 + 7., q.y * 1.4)) - 1.), 16.);
  c = mix(c, min(vec3(1.), c * 1.035 + .012), fib * light);
  return c * (1. - fib2 * settle * (1. - lum(c)));
}

// broad faint blotches in the sheet (amount ~.03)
vec3 paperBlotch(vec3 c, vec2 dp, float amount) { return c * (1. - amount * smoothstep(.55, .8, fbm(dp * .005 + 9.))); }

// ageing: tint toward the sheet edges (edgeW) and in broad clouds (cloudW). tint = aged colour multiplier.
vec3 paperAge(vec3 c, vec2 uv, vec2 dp, vec3 tint, float edgeW, float cloudW) {
  vec2 e = abs(uv - .5) * 2.;
  float age = smoothstep(.55, 1.15, max(e.x, e.y)) * edgeW + smoothstep(.5, .8, fbm(dp * .003 + 31.)) * cloudW;
  return c * mix(vec3(1.), tint, age);
}
#endif
