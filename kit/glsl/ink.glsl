// Crisp brush ink (a straight-alpha layer) laid over the washes: brush, not pen.
#include "kit/noise.glsl"
#ifndef KIT_INK
#define KIT_INK

// The ink layer at luv plus two 6-tap rings: a tight one (featherR design units, ~.8) to soften the edge,
// a wider one (bleedR, ~2.6) for ink bleeding into damp paper. rot = per-pixel random rotation.
struct InkSample { vec4 L; vec4 Ls; vec4 halo; };
InkSample gatherInk(sampler2D lines, vec2 luv, vec2 px, float sc, float rot, float featherR, float bleedR) {
  InkSample s;
  s.L = texture(lines, luv);
  s.Ls = vec4(0.); s.halo = vec4(0.);
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.0472 + rot;
    vec2 o = vec2(cos(a), sin(a)) * sc * px;
    s.Ls += texture(lines, luv + o * featherR);
    s.halo += texture(lines, luv + o * bleedR);
  }
  s.Ls /= 6.; s.halo /= 6.;
  return s;
}

// faint bleed of the ink into the paper around it: tone = colour of the bleed, amount ~.15-.3
vec3 inkBleed(vec3 c, InkSample s, vec3 tone, float amount) { return mix(c, tone, s.halo.a * amount); }
// brush edge: mix of the crisp layer and its soft ring (~.5-.7; 0 = vector-sharp, 1 = blurred)
vec4 inkFeather(InkSample s, float feather) { return mix(s.L, s.Ls, feather); }
// aerial perspective on ink: colour toward the atmosphere colour, alpha down
vec4 inkVeil(vec4 L, vec3 atmosphere, float colourAmt, float alphaAmt) {
  L.rgb = mix(L.rgb, atmosphere, colourAmt);
  L.a *= 1. - alphaAmt;
  return L;
}
// lay the ink on: opacity < 1 keeps a trace of the wash under it
vec3 inkOver(vec3 c, vec4 L, float opacity) { return mix(c, L.rgb, L.a * opacity); }
#endif
