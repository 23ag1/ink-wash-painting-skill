// Watercolor behaviour of washes, as separate functions. Use any subset, in your own order.
// Coordinates: uv = texture coords, px = 1/resolution, sc = device pixels per design unit,
// dp = fragment position in design units (any orientation; used only for noise).
#include "kit/noise.glsl"
#ifndef KIT_WASH
#define KIT_WASH

// Hand-painted edges: an offset (in uv) that wobbles slowly over the sheet.
// freq ~.03 (design units⁻¹), amp ~2 design units. Add it to uv before sampling the washes.
vec2 handWobble(vec2 dp, float freq, float amp, float sc, vec2 px) {
  return (vec2(fbm2(dp * freq), fbm2(dp * freq + 7.)) - .5) * amp * sc * px;
}

// Neighbourhood of the (diffused) washes: the colour at uvW, a near average (radius nearR design units),
// a far average (radius farR) and the far average of wetness (sampled at uv, unwobbled).
// 16 golden-angle taps each; rot = per-pixel random rotation (e.g. hash(gl_FragCoord.xy) * 6.2832).
struct WashSample { vec3 c0; vec3 near; vec3 far; float farWet; };
WashSample gatherWash(sampler2D src, sampler2D wet, vec2 uvW, vec2 uv, vec2 px, float sc, float rot, float nearR, float farR) {
  WashSample s;
  s.c0 = texture(src, uvW).rgb;
  s.near = vec3(0.); s.far = vec3(0.); s.farWet = 0.;
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.39996 + rot, r = sqrt((float(i) + .5) / 16.);
    vec2 o = vec2(cos(a), sin(a)) * r * sc * px;
    s.near += texture(src, uvW + o * nearR).rgb;
    s.far += texture(src, uvW + o * farR).rgb;
    s.farWet += texture(wet, uv + o * farR).r;
  }
  s.near /= 16.; s.far /= 16.; s.farWet /= 16.;
  return s;
}

// Pigment pools at the drying edge of a wash (Bousseau et al.: C' = C - (C - C²)(d - 1)).
// k = edge darkening strength (how much darker than the surroundings raises density; ~1-2.5);
// turb, turbFreq = broad density variation (~.2, ~.007); gran, granFreq = granulation in the grain (~.3, ~.38).
vec3 edgeDarken(vec3 c, vec3 far, vec2 dp, float k, float turb, float turbFreq, float gran, float granFreq) {
  float lc = lum(c);
  float dens = 1. + k * max(0., lum(far) - lc);
  dens *= 1. + turb * (fbm(dp * turbFreq) - .5);
  float grain = fbm(dp * granFreq);
  dens *= 1. + gran * (grain - .5) * (1. - lc);
  return c - (c - c * c) * (dens - 1.);
}

// 晕 halo: just outside a wet dark wash the paper is faintly tinted where water ran past the pigment.
// lcBefore = lum of the colour before edgeDarken; tint multiplies the paper (e.g. a cool grey ~.94);
// amount ~.4-.8.
vec3 washHalo(vec3 c, float lcBefore, vec3 far, float farWet, vec3 tint, float amount) {
  float yun = clamp((lcBefore - lum(far)) * 3., 0., 1.) * smoothstep(.35, .8, farWet);
  return mix(c, c * tint, yun * amount);
}
#endif
