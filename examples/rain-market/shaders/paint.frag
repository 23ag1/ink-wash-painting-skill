// Pass B (once): watercolor filter over the diffused washes, brush ink on top, depth haze, mist between
// the planes, one palette, xuan paper fibres and ageing. Adapted from the skill's generic paint filter:
// the reference's y-band haze and river mist are replaced by haze read from this painting's depth layer.
// Colour model: C' = C - (C - C^2)(d - 1)  (Bousseau et al., "Interactive watercolor rendering")
uniform vec2 uRes;
uniform sampler2D uScene;
uniform sampler2D uDiffused;
uniform sampler2D uWet;
uniform sampler2D uLines;   // crisp brush ink (straight alpha)
uniform sampler2D uDepth;   // r: depth 0 near .. 1 far
out vec4 fragColor;

vec3 S(vec2 uv) { return texture(uDiffused, uv).rgb; }

// torn mist bands between the planes (藏露): one hides the bases of the far roofs and the middle of the far
// crowd, a thinner one drifts through the middle distance
float mistAt(vec2 p) {
  float band1 = exp(-pow((p.y - 470.) / 60., 2.)) * smoothstep(.3, .68, fbm(vec2(p.x * .008, p.y * .02) + 3.));
  // the town behind the street rows fades sideways into rain
  float side = smoothstep(120., 300., abs(p.x - 330.)) * (1. - smoothstep(500., 1100., p.y)) * .25;
  float band2 = exp(-pow((p.y - 905.) / 30., 2.)) * smoothstep(.5, .78, fbm(vec2(p.x * .01, p.y * .03) + 9.));
  float top = (1. - smoothstep(160., 330., p.y)) * (.55 + .45 * fbm(p * .01 + 5.));
  return max(max(max(band1 * .55, band2 * .22), top * .55), side * (.6 + .4 * fbm(p * .012 + 2.)));
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / uRes, px = 1. / uRes;
  float sc = uRes.x / DESIGN.x;
  vec2 dp = fc / sc;                               // design units, y up (noise only)
  vec2 p = designPos(fc, uRes);                    // design units, y down
  float dep = texture(uDepth, uv).r;

  vec2 wob = (vec2(fbm2(dp * .03), fbm2(dp * .03 + 7.)) - .5) * 2.2 * sc * px;
  vec3 c0 = S(uv + wob);
  vec3 near = vec3(0.), far = vec3(0.);
  float farWet = 0.;
  float rot = hash(fc) * 6.2832;
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.39996 + rot, r = sqrt((float(i) + .5) / 16.);
    vec2 o = vec2(cos(a), sin(a)) * r * sc * px;
    near += S(uv + wob + o * 1.8);
    far  += S(uv + wob + o * 8.);
    farWet += texture(uWet, uv + o * 8.).r;
  }
  near /= 16.; far /= 16.; farWet /= 16.;
  // far plane is softer: it was painted wetter and is seen through rain
  vec3 c = mix(c0, near, .25 + .35 * smoothstep(.5, 1., dep));

  float lc = lum(c);
  float dens = 1. + 1.8 * max(0., lum(far) - lc);
  dens *= 1. + .2 * (fbm(dp * .007) - .5);
  float grain = fbm(dp * .38);
  dens *= 1. + .3 * (grain - .5) * (1. - lc);
  c = c - (c - c * c) * (dens - 1.);
  float yun = clamp((lc - lum(far)) * 3., 0., 1.) * smoothstep(.35, .8, farWet);
  c = mix(c, c * vec3(.94, .945, .955), yun * .6);

  // brush ink on top: sharper than the washes, feathered, veiled by depth like everything at that depth
  vec2 luv = uv + wob * .4;
  vec4 L = texture(uLines, luv), Ls = vec4(0.), halo = vec4(0.);
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.0472 + rot;
    vec2 o = vec2(cos(a), sin(a)) * sc * px;
    Ls += texture(uLines, luv + o * .8);
    halo += texture(uLines, luv + o * 2.6);
  }
  Ls /= 6.; halo /= 6.;
  float haze = .45 * smoothstep(.35, 1., dep);
  c = mix(c, vec3(.4), halo.a * .24 * (1. - haze));
  L = mix(L, Ls, .62);
  L.rgb = mix(L.rgb, MIST, haze * .6);
  L.a *= 1. - haze * .7;
  c = mix(c, L.rgb, L.a * .92);

  c = mix(c, MIST, mistAt(p) * smoothstep(.02, .25, dep));   // near plane and the inscription stay clear

  // one palette: mute every colour except the red accents
  float red = smoothstep(.1, .28, c.r - max(c.g, c.b));
  c = mix(vec3(lum(c)), c, mix(.85, 1., red));

  c *= .984 + .032 * fbm(dp * vec2(.03, .12));
  float ang = fbm(dp * .018) * 9.42;
  vec2 fdir = vec2(cos(ang), sin(ang));
  vec2 q = vec2(dot(dp, fdir), dot(dp, vec2(-fdir.y, fdir.x)));
  float fib = pow(1. - abs(2. * noise(vec2(q.x * .05, q.y * 1.6)) - 1.), 18.);
  float fib2 = pow(1. - abs(2. * noise(vec2(q.x * .04 + 7., q.y * 1.4)) - 1.), 16.);
  c = mix(c, min(vec3(1.), c * 1.035 + .012), fib * .55);
  c *= 1. - fib2 * .07 * (1. - lum(c));
  c *= 1. - .03 * smoothstep(.55, .8, fbm(dp * .005 + 9.));
  vec2 e = abs(uv - .5) * 2.;
  float age = smoothstep(.55, 1.15, max(e.x, e.y)) * .6 + smoothstep(.5, .8, fbm(dp * .003 + 31.)) * .4;
  c *= mix(vec3(1.), vec3(.985, .962, .915), age);
  fragColor = vec4(clamp(c, 0., 1.), 1.);
}
