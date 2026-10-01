// Pass B (rendered once), assembled from kit modules: watercolor filter over the diffused painting, brush ink
// on top with this scene's aerial perspective, river mist, one palette, the xuan sheet.
#include "common.glsl"
#include "kit/wash.glsl"
#include "kit/ink.glsl"
#include "kit/paper.glsl"
#include "kit/palette.glsl"
uniform vec2 uRes;
uniform sampler2D uLines;    // crisp object ink (straight alpha)
uniform sampler2D uObjects;  // wash object layer: its coverage tells the water pass where objects sit
uniform sampler2D uDiffused; // painting after ink diffusion along the fibres
uniform sampler2D uWet;      // r: wetness
out vec4 fragColor;

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / uRes, px = 1. / uRes;
  float sc = uRes.x / DESIGN.x;          // device pixels per design unit
  vec2 dp = fc / sc;                     // design-space coords (y up; fine for noise)
  float rot = hash(fc) * 6.2832;

  vec2 wob = handWobble(dp, .03, 2.2, sc, px);
  WashSample w = gatherWash(uDiffused, uWet, uv + wob, uv, px, sc, rot, 1.8, 8.);
  vec3 c = mix(w.c0, w.near, .25);
  float lc = lum(c);
  c = edgeDarken(c, w.far, dp, 1.8, .2, .007, .3, .38);
  c = washHalo(c, lc, w.far, w.farWet, vec3(.94, .945, .955), .6);

  vec2 luv = uv + wob * .4;
  InkSample s = gatherInk(uLines, luv, px, sc, rot, .8, 2.6);
  float y = DESIGN.y - dp.y, haze = objectHaze(vec2(dp.x, y));
  c = inkBleed(c, s, vec3(.4, .4, .4), .24 * (1. - haze));
  vec4 L = inkVeil(inkFeather(s, .62), MIST, haze * .6, haze * .8);
  c = inkOver(c, L, .92);

  // river mist drifting in front of the shoreline (over buildings and trees too), in torn patches
  float mist = exp(-pow((y - 537.) / 11., 2.)) * smoothstep(.42, .72, fbm(vec2(dp.x * .006, y * .05) + 3.));
  c = mix(c, MIST, mist * .3);

  c = muteExceptReds(c, .85);
  c = paperMottle(c, dp, .032);
  c = paperFibres(c, dp, .018, .55, .07);
  c = paperBlotch(c, dp, .03);
  c = paperAge(c, uv, dp, vec3(.985, .962, .915), .6, .4);
  // alpha = object coverage (softened), so objects drawn on the water survive the water pass
  float cover = max(max(L.a, s.Ls.a), texture(uObjects, luv).a);
  fragColor = vec4(clamp(c, 0., 1.), cover);
}
