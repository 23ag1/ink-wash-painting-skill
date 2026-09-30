// Per-frame pass: the painting is static; only steam rising from the food stalls and the rain move.
// Steam is paper showing through (a veil toward mist colour), rain is a few pale slanted hair strokes.
uniform vec2 uRes;
uniform sampler2D uPainted;
uniform sampler2D uDepth;
uniform float uTime;
uniform vec3 uSteam[8];     // x, y (design units) of the pot, and scale
uniform float uSteamN;
out vec4 fragColor;

const vec2 RAIN = vec2(.21, .978);

// one sheet of rain: sparse columns across the fall direction, one tapered streak per column per period
float rainLayer(vec2 p, float spacing, float len, float speed, float width, float dens, float seed, float sc) {
  vec2 q = vec2(dot(p, vec2(RAIN.y, -RAIN.x)), dot(p, RAIN));
  float col = floor(q.x / spacing);
  if (hash(vec2(col, seed)) > dens) return 0.;
  float cx = (col + .5 + (hash(vec2(col, seed + 1.)) - .5) * .6) * spacing;
  float l = len * (.6 + .8 * hash(vec2(col, seed + 3.)));
  float period = l * (4. + 5. * hash(vec2(col, seed + 2.)));
  float v = mod(q.y - uTime * speed * (.85 + .3 * hash(vec2(col, seed + 4.))) + hash(vec2(col, seed + 5.)) * 999., period);
  float t = v / l;
  if (t > 1.) return 0.;
  float taper = smoothstep(0., .25, t) * (1. - smoothstep(.55, 1., t));    // thin entry, fading tail
  float w = width * (.4 + .6 * taper);
  float across = 1. - smoothstep(w * .5, w * .5 + 1. / sc, abs(q.x - cx));
  return across * taper * (.6 + .4 * hash(vec2(col, seed + 6.)));
}

float steamAt(vec2 p) {
  float a = 0.;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uSteamN) break;
    vec3 s = uSteam[i];
    vec2 q = (p - s.xy) / s.z;
    float h = -q.y;                                            // height above the pot
    float off = h * .22 + sin(h * .045 - uTime * .5 + s.x) * 3.5;   // leans with the wind, sways
    float w = 6. + h * .45;
    float n = fbm(vec2((q.x - off) * .07, (h - uTime * 11.) * .04) + s.xy * .01);
    float m = exp(-pow((q.x - off) / w, 2.)) * smoothstep(0., 12., h) * (1. - smoothstep(55., 150., h));
    a = max(a, m * smoothstep(.3, .7, n) * (1. - smoothstep(30., 150., h) * .6));
  }
  return a;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = designPos(gl_FragCoord.xy, uRes);
  float sc = uRes.x / DESIGN.x;
  vec3 c = texture(uPainted, uv).rgb;

  c = mix(c, MIST, steamAt(p) * .66);

  float d = groundDepth(p.y);
  float nearRain = rainLayer(p, 21., 70., 430., 1.1, .42, 1.7, sc) * (1. - d * .6);
  float farRain = rainLayer(p, 6.5, 24., 260., .6, .5, 8.3, sc) * (.35 + .65 * d);
  float r = max(nearRain * .2, farRain * .13);
  c = mix(c, vec3(.6, .61, .63), r);          // darker than paper, lighter than wet roofs
  fragColor = vec4(c, 1.);
}
