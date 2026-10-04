// Per frame: the reveal (the painting appearing on blank paper, kit/glsl/reveal.glsl), then only the mist moves —
// slowly drifting through the band and the tongues between the peaks.
#include "common.glsl"
#include "kit/atmos.glsl"
#include "kit/reveal.glsl"
uniform vec2 uRes;
uniform sampler2D uFull;
uniform sampler2D uWashes;
uniform sampler2D uBlank;
uniform sampler2D uTimeI;
uniform sampler2D uDepth;
uniform float uTime;
uniform float uProgress;     // reveal progress (unclamped; ≥ ~1.6 = finished)
uniform float uFx;           // the mist drift fades in once the painting is finished
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = designPos(gl_FragCoord.xy, uRes, DESIGN);
  float sc = uRes.x / DESIGN.x;
  // the poem (top right) and the seal (by the peak tops) are written strictly last
  float last = max(1. - smoothstep(1., 1.3, length((p - vec2(548., 118.)) / vec2(105., 118.))),
                   1. - smoothstep(1., 1.3, length((p - vec2(191., 86.)) / vec2(30., 30.))));
  vec3 c = uProgress > 2. ? texture(uFull, uv).rgb : revealPainting(uBlank, uWashes, uFull, uTimeI, uv, p, uRes, sc, uProgress, last, .0038);
  float d = texture(uDepth, uv).r;
  float band = smoothstep(500., 580., p.y) * (1. - smoothstep(690., 760., p.y));
  float drift = smoothstep(.55, .85, mistDrift(p, uTime, vec2(.0035, .02), .006));
  c = mix(c, MIST, drift * band * smoothstep(.25, .6, d) * .3 * uFx);
  fragColor = vec4(c, 1.);
}
