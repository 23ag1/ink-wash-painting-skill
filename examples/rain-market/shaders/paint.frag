// Pass B (once), assembled from kit modules: watercolor filter over the diffused washes, brush ink on top,
// haze read from this painting's depth layer, mist between the planes, one palette, xuan paper.
#include "common.glsl"
#include "kit/wash.glsl"
#include "kit/ink.glsl"
#include "kit/paper.glsl"
#include "kit/palette.glsl"
uniform vec2 uRes;
uniform sampler2D uDiffused;
uniform sampler2D uWet;
uniform sampler2D uLines;   // crisp brush ink (straight alpha)
uniform sampler2D uDepth;   // r: depth 0 near .. 1 far
out vec4 fragColor;

// torn mist bands between the planes (藏露): one hides the bases of the far roofs and the middle of the far
// crowd, a thinner one drifts through the middle distance
float mistAt(vec2 p) {
  float band1 = exp(-pow((p.y - 470.) / 60., 2.)) * smoothstep(.3, .68, fbm(vec2(p.x * .008, p.y * .02) + 3.));
  // the town behind the street rows fades sideways into rain
  float side = smoothstep(120., 300., abs(p.x - 330.)) * (1. - smoothstep(500., 1100., p.y)) * .25;
  float band2 = exp(-pow((p.y - 905.) / 30., 2.)) * smoothstep(.5, .78, fbm(vec2(p.x * .01, p.y * .03) + 9.));
  float top = (1. - smoothstep(160., 330., p.y)) * (.55 + .45 * fbm(p * .01 + 5.));
  return max(max(max(band1 * .55, band2 * .22), top * .55), side * (.6 + .4 * fbm(p * .012 + 2.)));
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / uRes, px = 1. / uRes;
  float sc = uRes.x / DESIGN.x;
  vec2 dp = fc / sc;                               // design units, y up (noise only)
  vec2 p = designPos(fc, uRes);                    // design units, y down
  float dep = texture(uDepth, uv).r;
  float rot = hash(fc) * 6.2832;

  vec2 wob = handWobble(dp, .03, 2.2, sc, px);
  WashSample w = gatherWash(uDiffused, uWet, uv + wob, uv, px, sc, rot, 1.8, 8.);
  // far plane is softer: it was painted wetter and is seen through rain
  vec3 c = mix(w.c0, w.near, .25 + .35 * smoothstep(.5, 1., dep));
  float lc = lum(c);
  c = edgeDarken(c, w.far, dp, 1.8, .2, .007, .3, .38);
  c = washHalo(c, lc, w.far, w.farWet, vec3(.94, .945, .955), .6);

  // brush ink on top: sharper than the washes, feathered, veiled by depth like everything at that depth
  InkSample s = gatherInk(uLines, uv + wob * .4, px, sc, rot, .8, 2.6);
  float haze = .45 * smoothstep(.35, 1., dep);
  c = inkBleed(c, s, vec3(.4), .24 * (1. - haze));
  c = inkOver(c, inkVeil(inkFeather(s, .62), MIST, haze * .6, haze * .7), .92);

  c = mix(c, MIST, mistAt(p) * smoothstep(.02, .25, dep));   // near plane and the inscription stay clear

  c = muteExceptReds(c, .85);
  c = paperMottle(c, dp, .032);
  c = paperFibres(c, dp, .018, .55, .07);
  c = paperBlotch(c, dp, .03);
  c = paperAge(c, uv, dp, vec3(.985, .962, .915), .6, .4);
  fragColor = vec4(clamp(c, 0., 1.), 1.);
}
