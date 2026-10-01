#include "common.glsl"
// Pass A (once): the continuous background field — paper and the rain atmosphere as glazes with definite,
// ragged edges — multiplied by the brush wash layer painted in Canvas. Writes colour and wetness (MRT).
uniform vec2 uRes;
uniform sampler2D uWash;    // opaque paper-white canvas, washes multiplied in (holes = paper)
uniform sampler2D uWetC;    // r: wetness written by every mark
uniform sampler2D uDepth;   // r: depth of what is painted there (ground depth elsewhere)
layout(location = 0) out vec4 oCol;
layout(location = 1) out vec4 oWet;

const vec2 RAIN = vec2(.21, .978);   // falling direction (down, leaning right): wind from the left


void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = designPos(gl_FragCoord.xy, uRes);
  float d = groundDepth(p.y);

  // rain-sheet coordinates: along the fall and across it; mildly stretched (1:2.4), never stripes
  vec2 q = vec2(dot(p, vec2(RAIN.y, -RAIN.x)), dot(p, RAIN));
  vec2 rq = q * vec2(.011, .0046);

  // the designed void (upper right): kept clean — no blotchy veils, only paper and one soft mist
  float voidM = 1. - smoothstep(.55, 1.05, length((p - vec2(545., 250.)) / vec2(190., 240.)));
  float veil = 1. - .85 * voidM;

  vec3 bg = PAPER;
  // a whole-sheet grey glaze: a rainy day is darker than paper, in broad patches
  bg *= mix(vec3(1.), vec3(.93, .935, .945), glaze(p * .0045 + 3.1, .42, .05) * .35 * veil);
  // slanted rain veils: wet grey sheets falling over the far part of the street and the sky
  float far = smoothstep(.45, .95, d);
  bg *= mix(vec3(1.), vec3(.86, .875, .9), glaze(rq + 11.7, .5, .05) * (.3 + .7 * far) * .5 * veil);
  bg *= mix(vec3(1.), vec3(.9, .91, .93), glaze(rq * 1.9 + 4.2, .56, .05) * far * .35 * veil);
  // the top of the scroll is the rain itself: a soft cloud wash that thins into bare paper at the very top
  float sky = (1. - smoothstep(140., 420., p.y)) * (1. - (1. - smoothstep(20., 110., p.y)) * .7);
  bg *= mix(vec3(1.), vec3(.88, .895, .915), glaze(p * .007 + 21., .47, .05) * sky * .5 * veil);

  vec4 w = texture(uWash, uv);
  vec3 wash = mix(vec3(1.), w.rgb, w.a);
  oCol = vec4(bg * wash, 1.);

  float bgWet = .55 * far + .3;                    // everything is wet in the rain; far washes wettest
  oWet = vec4(max(texture(uWetC, uv).r, bgWet * .6), 0., 0., 1.);
}
