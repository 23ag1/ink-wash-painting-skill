// Paint pass (once), from kit modules with this scroll's choices: silk instead of xuan — less pooling, a tight
// ink edge (silk does not let ink bleed far), aerial veil on the ink by depth, a woven sheet that has darkened
// with age, warm toward the edges.
#include "common.glsl"
#include "kit/wash.glsl"
#include "kit/ink.glsl"
#include "kit/paper.glsl"
uniform vec2 uRes;
uniform sampler2D uDiffused;
uniform sampler2D uWet;
uniform sampler2D uLines;
uniform sampler2D uDepth;
uniform sampler2D uTree;     // the willow's wood, straight alpha (tree.frag)
out vec4 fragColor;

// silk weave: fine warp and weft threads, slightly irregular, visible only as a faint texture
vec3 silkWeave(vec3 c, vec2 dp) {
  float warp = .5 + .5 * sin(dp.x * 3.1 + noise(dp * vec2(.02, .6)) * 2.);
  float weft = .5 + .5 * sin(dp.y * 2.7 + noise(dp * vec2(.6, .02)) * 2.);
  return c * (.985 + .02 * (warp * weft) + .012 * (noise(dp * vec2(.03, 1.2)) - .5));
}

void main() {
  vec2 fc = gl_FragCoord.xy, uv = fc / uRes, px = 1. / uRes;
  float sc = uRes.x / DESIGN.x;
  vec2 dp = fc / sc;
  vec2 p = designPos(fc, uRes, DESIGN);
  float rot = hash(fc) * 6.2832;
  float dep = texture(uDepth, uv).r;

  vec2 wob = handWobble(dp, .03, 1.4, sc, px);
  WashSample w = gatherWash(uDiffused, uWet, uv + wob, uv, px, sc, rot, 1.4, 6.);
  vec3 c = mix(w.c0, w.near, .2 + .3 * smoothstep(.5, 1., dep));
  float lc = lum(c);
  c = edgeDarken(c, w.far, dp, 1.2, .25, .006, .2, .5);
  c = washHalo(c, lc, w.far, w.farWet, vec3(.95, .94, .93), .3);

  // the wood lies over the washes; ink behind it is hidden, the strands hanging off it stay in front
  vec4 T = texture(uTree, uv + wob * .3);
  c = mix(c, T.rgb, T.a);
  InkSample s = gatherInk(uLines, uv + wob * .3, px, sc, rot, .7, 2.);
  float haze = .55 * smoothstep(.3, .95, dep);
  c = inkBleed(c, s, vec3(.35, .3, .25), .14 * (1. - haze));
  vec4 L = inkVeil(inkFeather(s, .5), MIST, haze * .7, haze * .75);
  L.rgb *= vec3(1., .96, .9);                         // ink on silk reads warm
  L.a *= 1. - T.a * .85;
  c = inkOver(c, L, .95);
  // mist also passes in front of the ink of what stands in it
  c = mix(c, MIST, mistAt(p) * smoothstep(.3, .8, dep) * .55);

  c = silkWeave(c, dp);
  c = paperBlotch(c, dp, .05);
  c = paperAge(c, uv, dp, vec3(.9, .82, .7), .45, .25);
  fragColor = vec4(clamp(c, 0., 1.), 1.);
}
