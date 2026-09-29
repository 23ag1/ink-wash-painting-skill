// One step of ink creeping through wet xuan paper (run many times, once, at load).
// Simplified from MoXi (Chu & Tai 2005): no lattice-Boltzmann flow, but the two things that make the
// edge look like paper and not like a blur — transport is gated by wetness (dry strokes stay sharp, wet washes
// spread) and it is anisotropic, preferring a fibre direction and following fibrous permeability streaks.
uniform vec2 uRes;
uniform sampler2D uSrc;     // current colour
uniform sampler2D uWet;     // r: wetness 0..1
uniform float uStep;        // neighbour distance in device pixels
out vec4 fragColor;

void main() {
  vec2 fc = gl_FragCoord.xy, px = 1. / uRes, uv = fc * px;
  float sc = uRes.x / DESIGN.x;
  vec2 dp = fc / sc;
  vec4 c = texture(uSrc, uv);
  float w = texture(uWet, uv).r;

  float ang = fbm(dp * .018) * 9.42;                                   // slowly turning fibre direction
  vec2 fdir = vec2(cos(ang), sin(ang)), fnor = vec2(-fdir.y, fdir.x);
  vec2 q = vec2(dot(dp, fdir), dot(dp, fnor));
  float perm = .3 + .7 * smoothstep(.35, .8, noise(vec2(q.x * .09, q.y * 1.3)));   // long thin fibre channels

  vec4 acc = vec4(0.);
  for (int i = 0; i < 8; i++) {
    float a = float(i) * .7854;
    vec2 d = vec2(cos(a), sin(a));
    vec2 nuv = uv + d * px * uStep;
    float k = mix(.2, 1., pow(abs(dot(d, fdir)), 3.)) * perm * min(w, texture(uWet, nuv).r);
    acc += k * (texture(uSrc, nuv) - c);
  }
  fragColor = vec4(c.rgb + acc.rgb * .11, c.a);
}
