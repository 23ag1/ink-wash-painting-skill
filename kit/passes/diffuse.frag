// One step of ink creeping through wet paper (run N times with rt.pingpong; once, at load).
// Simplified MoXi (Chu & Tai 2005): transport gated by wetness (dry strokes stay sharp, wet washes spread),
// anisotropic along a fibre direction field, following fibrous permeability streaks.
#include "kit/noise.glsl"
#include "kit/paper.glsl"
uniform vec2 uRes;
uniform sampler2D uSrc;      // current colour
uniform sampler2D uWet;      // r: wetness 0..1
uniform float uStep;         // neighbour distance in device pixels (~.8 design units × scale)
uniform float uDesignW;      // width of the design space (noise scale is in design units)
uniform float uRate;         // transport per step (~.11); total spread ≈ rate × steps
uniform float uFibreScale;   // fibre direction field frequency — same as paperFibres' dirScale (~.018)
uniform float uCross;        // transport across the fibres relative to along them (~.2; 1 = isotropic)
out vec4 fragColor;

void main() {
  vec2 fc = gl_FragCoord.xy, px = 1. / uRes, uv = fc * px;
  float sc = uRes.x / uDesignW;
  vec2 dp = fc / sc;
  vec4 c = texture(uSrc, uv);
  float w = texture(uWet, uv).r;

  float ang = fbm(dp * uFibreScale) * 9.42;
  vec2 fdir = vec2(cos(ang), sin(ang)), fnor = vec2(-fdir.y, fdir.x);
  vec2 q = vec2(dot(dp, fdir), dot(dp, fnor));
  float perm = .3 + .7 * smoothstep(.35, .8, noise(vec2(q.x * .09, q.y * 1.3)));   // long thin fibre channels

  vec4 acc = vec4(0.);
  for (int i = 0; i < 8; i++) {
    float a = float(i) * .7854;
    vec2 d = vec2(cos(a), sin(a));
    vec2 nuv = uv + d * px * uStep;
    float k = mix(uCross, 1., pow(abs(dot(d, fdir)), 3.)) * perm * min(w, texture(uWet, nuv).r);
    acc += k * (texture(uSrc, nuv) - c);
  }
  fragColor = vec4(c.rgb + acc.rgb * uRate, c.a);
}
