// Scene field (once): aged silk, the mist band and the morning sky haze, the wash layer multiplied in.
#include "common.glsl"
uniform vec2 uRes;
uniform sampler2D uWash;    // opaque white, washes multiplied in (transparent = untouched)
uniform sampler2D uWetC;    // r: wetness of every mark
uniform sampler2D uDepth;   // r: depth of what is painted there (air is far)
layout(location = 0) out vec4 oCol;
layout(location = 1) out vec4 oWet;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = designPos(gl_FragCoord.xy, uRes, DESIGN);
  float d = texture(uDepth, uv).r;
  vec4 w = texture(uWash, uv);
  vec3 wash = mix(vec3(1.), w.rgb, w.a);
  vec3 col = SILK * wash;
  // mist: covers what is far more than what is near; it is lighter than the silk (old silk keeps its mist pale)
  float m = mistAt(p) * mix(.25, 1., smoothstep(.2, .7, d));
  col = mix(col, MIST, m);
  oCol = vec4(col, 1.);
  oWet = vec4(max(texture(uWetC, uv).r, m * .8), 0., 0., 1.);
}
