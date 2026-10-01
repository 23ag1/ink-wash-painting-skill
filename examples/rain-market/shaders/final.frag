#include "common.glsl"
#include "kit/atmos.glsl"
// Per-frame pass: the painting is static; only steam rising from the food stalls and the rain move.
// Steam is paper showing through (a veil toward mist colour), rain is a few pale slanted hair strokes.
uniform vec2 uRes;
uniform sampler2D uPainted;
uniform sampler2D uDepth;
uniform float uTime;
uniform vec3 uSteam[8];     // x, y (design units) of the pot, and scale
uniform float uSteamN;
out vec4 fragColor;

const vec2 RAIN = vec2(.21, .978);   // falling direction (down, leaning right)

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = designPos(gl_FragCoord.xy, uRes);
  float sc = uRes.x / DESIGN.x;
  vec3 c = texture(uPainted, uv).rgb;

  float steam = 0.;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uSteamN) break;
    steam = max(steam, plume(p, uSteam[i].xy, uSteam[i].z, .22, uTime));
  }
  c = mix(c, MIST, steam * .66);

  float d = groundDepth(p.y);
  float nearRain = rainStreaks(p, RAIN, uTime, 21., 70., 430., 1.1, .42, 1.7, sc) * (1. - d * .6);
  float farRain = rainStreaks(p, RAIN, uTime, 6.5, 24., 260., .6, .5, 8.3, sc) * (.35 + .65 * d);
  float r = max(nearRain * .2, farRain * .13);
  c = mix(c, vec3(.6, .61, .63), r);          // darker than paper, lighter than wet roofs
  fragColor = vec4(c, 1.);
}
