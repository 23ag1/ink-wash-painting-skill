// Paint pass (once), from kit modules with this leaf's own choices: stronger pooled edges, softer ink edge,
// no palette muting (it is ink only), a cool sheet that ages only a little.
#include "kit/wash.glsl"
#include "kit/ink.glsl"
#include "kit/paper.glsl"
uniform vec2 uRes;
uniform sampler2D uDiffused;
uniform sampler2D uWet;
uniform sampler2D uLines;
out vec4 fragColor;

void main() {
  vec2 fc = gl_FragCoord.xy, uv = fc / uRes, px = 1. / uRes;
  float sc = uRes.x / 800.;
  vec2 dp = fc / sc;
  float rot = hash(fc) * 6.2832;

  vec2 wob = handWobble(dp, .035, 1.6, sc, px);
  WashSample w = gatherWash(uDiffused, uWet, uv + wob, uv, px, sc, rot, 2., 10.);
  vec3 c = mix(w.c0, w.near, .3);
  float lc = lum(c);
  c = edgeDarken(c, w.far, dp, 2.3, .25, .006, .35, .4);
  c = washHalo(c, lc, w.far, w.farWet, vec3(.93, .94, .95), .5);

  InkSample s = gatherInk(uLines, uv + wob * .3, px, sc, rot, .9, 3.);
  c = inkBleed(c, s, vec3(.42, .42, .43), .2);
  c = inkOver(c, inkFeather(s, .55), .95);

  c = paperMottle(c, dp, .04);
  c = paperFibres(c, dp, .022, .45, .06);
  c = paperBlotch(c, dp, .02);
  c = paperAge(c, uv, dp, vec3(.975, .965, .93), .5, .3);
  fragColor = vec4(clamp(c, 0., 1.), 1.);
}
