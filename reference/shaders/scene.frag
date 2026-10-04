#include "common.glsl"
#include "terrain.glsl"
// Pass A (rendered once): the washes (染) of the painting — sky around the moon, mountain ranges, mist, and the
// wash layer of the objects. Contours, texture strokes and moss dots of the mountains are brushwork, painted
// in JS on the ink layer from the ridge lines this shader computes (terrain.glsl). Water is left as bare paper.
uniform vec2 uRes;
uniform sampler2D uObjects;
uniform vec3 uMoon;        // x, y, radius (radius 0 = no moon)
uniform float uWaterOn;    // 1 = river below the waterline, 0 = land/valley continues down
uniform float uBare;       // 1 = bare paper only (the reveal's first state)
layout(location = 0) out vec4 fragColor;   // rgb: painting
layout(location = 1) out vec4 wetOut;      // r: how wet the paper was here (drives ink diffusion)

float gWet = .35;   // 干湿: open sky is dry paper, washes are wet, near crests dry, water left as bare paper
#define MOON uMoon.xy
#define MOON_R max(uMoon.z, 1.)
#define HAS_MOON step(.5, uMoon.z)

// One range as overlapping washes: mist-coloured body, wet blotches darkest under the crest, a soft wet edge;
// the body dissolves into mist (留白) well before its base.
vec3 drawLayer(int i, vec2 p, vec3 col) {
  vec4 L = uLayer[i];
  float base = L.x, depth = L.y, seed = L.z;
  vec2 q = p + ridgeWarp(i, p.x);
  float h = ridgeH(i, q.x);
  float d = q.y - (base - h);
  if (d > -4.) {
    float slope = (ridgeH(i, q.x + 3.) - h) / 3.;
    float fadeLen = 18. + h * .6;
    float body = exp(-max(d, 0.) / fadeLen);
    float bottom = 1. - smoothstep(base - 18., base + 4., p.y);
    float shape = smoothstep(-2., 2.5, d) * bottom;
    vec3 inkC = mix(vec3(.08, .08, .09), vec3(.52, .58, .65), pow(depth, 1.2));
    vec3 mistC = mix(PAPER, MIST, depth);
    col = mix(col, mistC, shape * mix(.97, .85, depth));
    gWet = mix(gWet, mix(.3, mix(.5, 1., depth), smoothstep(0., 6., d)), shape);

    float xg = q.x + slope * max(d, 0.) * .9;
    float blot = fbm(vec2(q.x * .011, q.y * .018) + seed);
    // Glazes: overlapping washes with ragged but definite edges (the watercolor pass pools pigment on them)
    float g1 = smoothstep(.74, .79, fbm(q * vec2(.008, .014) + seed) * .75 + body * .6);
    float g2 = smoothstep(.8, .84, fbm(vec2(xg, q.y) * .022 + seed * 2.) * .8 + body * .5);
    float g3 = smoothstep(.86, .89, fbm(vec2(xg * .05, q.y * .04) + seed * 3.) * .85 + body * .38);
    float tone = 1. - (1. - body * .22) * (1. - .3 * g1) * (1. - .4 * g2) * (1. - .52 * g3);
    tone = clamp(tone * mix(1.15, .5, depth), 0., 1.);
    col = mix(col, inkC, tone * shape);

    float ochre = (1. - depth) * smoothstep(.35, .9, 1. - body) * smoothstep(.45, .7, blot);
    col = mix(col, vec3(.74, .63, .48), .14 * ochre * shape);

    float edge = exp(-max(d, 0.) / 2.) * smoothstep(-2., 0., d) * smoothstep(.25, .55, noise(vec2(q.x * .05, seed)));
    col = mix(col, inkC * .75, edge * mix(.4, .2, depth) * bottom);
  }
  float mf = fbm2(vec2(p.x * .005 + seed, p.y * .035));
  float band = exp(-pow((p.y - (base - 6.)) / (12. + 10. * depth), 2.));
  float mistA = band * smoothstep(.2, .8, mf) * .75;
  gWet = mix(gWet, 1., mistA);
  return mix(col, MIST, mistA);
}

// 烘云托月: the sky is left as paper; only a soft, blotchy wash is laid around the moon so the moon itself —
// untouched paper — becomes the lightest thing in the picture. One thin cloud crosses its lower edge.
vec3 sky(vec2 p) {
  vec3 col = PAPER;
  float r = length(p - MOON);
  float around = smoothstep(MOON_R - 1., MOON_R + 10., r) * exp(-(r - MOON_R) / 150.);
  around *= .55 + .75 * fbm(p * .007 + 2.);
  around *= HAS_MOON;
  col = mix(col, vec3(.72, .75, .79), clamp(around, 0., 1.) * .5);
  gWet = max(gWet, clamp(around * 1.4, 0., 1.));
  float top = smoothstep(.55, .62, fbm(p * .0045 + 1.) * .8 + (1. - p.y / 260.) * .3);
  col = mix(col, vec3(.8, .83, .85), top * .16);
  // clouds as wet washes (isotropic blotches with definite edges, not streaks), kept off the moon
  float cl1 = smoothstep(.6, .66, fbm(p * vec2(.0042, .0075) + 13.) + .18 * (1. - smoothstep(80., 320., p.y)));
  float cl2 = smoothstep(.66, .71, fbm(p * vec2(.006, .01) + 29.));
  float keep = mix(1., smoothstep(MOON_R + 8., MOON_R + 60., r), HAS_MOON) * (1. - smoothstep(330., 420., p.y));
  col = mix(col, vec3(.76, .79, .82), cl1 * keep * .3);
  col = mix(col, vec3(.68, .71, .75), cl2 * cl1 * keep * .22);
  gWet = max(gWet, cl1 * keep);
  vec2 mq = (p - MOON) / MOON_R;
  vec3 mc = mix(vec3(.985, .975, .95), vec3(1.), sqrt(max(0., 1. - dot(mq, mq))));
  mc -= .02 * smoothstep(.45, .72, fbm(mq * 2.4 + 3.));
  col = mix(col, mc, (1. - smoothstep(MOON_R - 1.5, MOON_R + 1., r)) * HAS_MOON);
  float st = exp(-pow((p.y - MOON.y - MOON_R * .6 - (p.x - MOON.x) * .06) / 4.5, 2.)) * smoothstep(.4, .75, fbm(vec2(p.x * .012, p.y * .25)));
  st *= smoothstep(MOON.x - 160., MOON.x - 60., p.x) * (1. - smoothstep(MOON.x + 70., MOON.x + 200., p.x)) * HAS_MOON;
  return mix(col, vec3(.7, .72, .75), st * .55);
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 p = designPos(fc, uRes);
  if (uBare > .5) { fragColor = vec4(PAPER, 0.); wetOut = vec4(.3, 0., 0., 1.); return; }
  vec3 col = sky(p);
  for (int i = 0; i < NL - 1; i++) {
    col = drawLayer(i, p, col);
    if (i == 2) {
      // 藏露: a cloud belt crosses the host massif at its waist, so the mountain continues in the mind
      float belt = exp(-pow((p.y - 420. - sin(p.x * .012) * 8.) / 13., 2.)) * smoothstep(.38, .68, fbm(vec2(p.x * .006, p.y * .04) + 21.));
      belt *= 1. - smoothstep(430., 600., p.x);
      col = mix(col, MIST, belt * .85);
    }
  }
  col = mix(col, PAPER, smoothstep(WATER - 3., WATER + 3., p.y) * uWaterOn);
  gWet *= 1. - smoothstep(WATER - 3., WATER + 3., p.y) * uWaterOn;
  col = drawLayer(NL - 1, p, col);

  vec4 obj = texture(uObjects, fc / uRes);
  col = mix(col, mix(obj.rgb, MIST, objectHaze(p)), obj.a);
  gWet = mix(gWet, .6, obj.a);

  float sm = fbm2(vec2(p.x * .004, p.y * .04 + 5.));
  float shore = exp(-pow((p.y - (WATER - 5.)) / 12., 2.)) * (.25 + .4 * sm);
  col = mix(col, MIST, shore);
  gWet = mix(gWet, 1., shore);
  fragColor = vec4(col, 0.);
  wetOut = vec4(gWet, 0., 0., 1.);
}
