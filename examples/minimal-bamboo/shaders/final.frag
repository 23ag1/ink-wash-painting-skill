// Per frame: only a thin mist drifting through the lower part of the grove.
#include "kit/atmos.glsl"
uniform vec2 uRes;
uniform sampler2D uPainted;
uniform float uTime;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = designPos(gl_FragCoord.xy, uRes, vec2(800.));
  vec3 c = texture(uPainted, uv).rgb;
  float band = exp(-pow((p.y - 600.) / 110., 2.));
  float m = smoothstep(.5, .8, mistDrift(p, uTime, vec2(.004, .02), .012));
  c = mix(c, vec3(.93, .928, .915), m * band * .32);
  fragColor = vec4(c, 1.);
}
