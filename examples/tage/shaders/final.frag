// Per frame: only the mist moves — slowly drifting through the band and the tongues between the peaks.
#include "common.glsl"
#include "kit/atmos.glsl"
uniform vec2 uRes;
uniform sampler2D uPainted;
uniform sampler2D uDepth;
uniform float uTime;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = designPos(gl_FragCoord.xy, uRes, DESIGN);
  vec3 c = texture(uPainted, uv).rgb;
  float d = texture(uDepth, uv).r;
  float band = smoothstep(500., 580., p.y) * (1. - smoothstep(690., 760., p.y));
  float drift = smoothstep(.55, .85, mistDrift(p, uTime, vec2(.0035, .02), .006));
  c = mix(c, MIST, drift * band * smoothstep(.25, .6, d) * .3);
  fragColor = vec4(c, 1.);
}
