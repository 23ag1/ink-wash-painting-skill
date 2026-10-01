// Scene field (once): a cool, slightly grey sheet with one damp glaze rising from the lower right, the
// wash layer laid over it. Writes colour and wetness (MRT).
#include "kit/noise.glsl"
uniform vec2 uRes;
uniform sampler2D uWash;     // straight-alpha washes
uniform sampler2D uWetC;     // r: wetness of every mark
layout(location = 0) out vec4 oCol;
layout(location = 1) out vec4 oWet;

const vec3 SHEET = vec3(.925, .918, .894);   // cooler and greyer than the reference's ivory xuan

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = designPos(gl_FragCoord.xy, uRes, vec2(800.));
  // damp air of the grove: one glaze with a definite ragged edge, heavier toward the lower right
  float damp = smoothstep(500., 1100., p.x + p.y * .7);
  float g = glaze(p * .0042 + 5.3, .48, .06) * damp;
  vec3 bg = SHEET * mix(vec3(1.), vec3(.87, .885, .89), g * .4);
  vec4 w = texture(uWash, uv);
  oCol = vec4(mix(bg, w.rgb, w.a), 1.);
  oWet = vec4(max(texture(uWetC, uv).r, g * .7), 0., 0., 1.);
}
