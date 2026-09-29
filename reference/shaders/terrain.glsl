// Shared mountain geometry (scene pass + ridge readback pass), so washes and brush strokes agree exactly.
uniform vec4 uLayer[7];   // x: base y, y: depth (0 near .. 1 far), z: seed, w: unused
uniform vec4 uMass[28];   // 4 per layer: x: center, y: height, z: half-width left, w: half-width right
#define NL 7

float ridged(float x, float s) {
  float v = 0., a = .5;
  for (int i = 0; i < 4; i++) {
    float n = 1. - abs(2. * n1(x, s + float(i) * 3.1) - 1.);
    v += a * n * n; x *= 2.13; a *= .5;
  }
  return v / .9375;
}

// Ridge height: rounded rock masses (smooth lumps) carrying a few sharper crests
float ridgeH(int li, float x) {
  vec4 L = uLayer[li];
  float env = 0.;
  for (int k = 0; k < 4; k++) {
    vec4 m = uMass[li * 4 + k];
    if (m.y <= 0.) continue;
    float dx = x - m.x;
    float w = dx < 0. ? m.z : m.w;
    env = max(env, m.y * exp(-pow(abs(dx) / w, 1.45) * 2.3));
  }
  float lumps = .5 * n1(x * .018, L.z + 2.) + .3 * n1(x * .045, L.z + 6.) + .2 * n1(x * .11, L.z + 8.);
  float crest = env * (.58 + .3 * ridged(x * .009, L.z) + .22 * lumps);
  float und = clamp((WATER - L.x) / 12., 0., 1.) * (3. + 9. * n1(x * .006, L.z + 9.));
  return max(crest, und);
}

// Hand-drawn wobble of the silhouette; depends on x only, so the ridge line has a closed form
vec2 ridgeWarp(int li, float x) {
  vec4 L = uLayer[li];
  vec2 k = vec2(x * .012, L.z * .9) + L.z;
  return (vec2(fbm2(k), fbm2(k + 5.)) - .5) * mix(vec2(14., 8.), vec2(22., 12.), L.y);
}

// Screen y of the ridge of layer li at x (the mountain occupies y > ridgeY)
float ridgeY(int li, float x) {
  vec2 w = ridgeWarp(li, x);
  return uLayer[li].x - ridgeH(li, x + w.x) - w.y;
}
