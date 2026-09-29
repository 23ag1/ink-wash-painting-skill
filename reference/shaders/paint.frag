// Pass B (rendered once): watercolor filter over the diffused painting, then brush ink on top.
//  - wobble: hand-painted irregular edges
//  - bleed: already done by the fibre diffusion pass (uDiffused); only a light smoothing here
//  - halo (晕): a pale grey fringe just outside wet dark areas, where water ran further than pigment
//  - paper fibres (宣纸): visible light fibres, with pigment settling along them
//  - edge darkening: pigment pools on the dark side of every wash edge
//  - turbulence + granulation: uneven pigment density, settling in the paper grain
// Colour model: C' = C - (C - C^2)(d - 1)  (Bousseau et al., "Interactive watercolor rendering")
uniform vec2 uRes;
uniform sampler2D uScene;   // rgb: painting before diffusion (unused alpha)
uniform sampler2D uLines;   // crisp object ink (straight alpha)
uniform sampler2D uObjects; // wash object layer: its coverage tells the water pass where objects sit
uniform sampler2D uDiffused; // painting after ink diffusion along the fibres
uniform sampler2D uWet;      // r: wetness
out vec4 fragColor;

vec3 S(vec2 uv) { return texture(uDiffused, uv).rgb; }

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / uRes, px = 1. / uRes;
  float sc = uRes.x / DESIGN.x;          // device pixels per design unit
  vec2 dp = fc / sc;                     // design-space coords (y up; fine for noise)

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
  vec3 c = mix(c0, near, .25);

  float lc = lum(c);
  float dens = 1. + 1.8 * max(0., lum(far) - lc);
  dens *= 1. + .2 * (fbm(dp * .007) - .5);
  float grain = fbm(dp * .38);
  dens *= 1. + .3 * (grain - .5) * (1. - lc);
  c = c - (c - c * c) * (dens - 1.);
  // 晕: just outside a wet dark wash the paper is faintly greyed where the water front ran past the pigment
  float yun = clamp((lc - lum(far)) * 3., 0., 1.) * smoothstep(.35, .8, farWet);
  c = mix(c, c * vec3(.94, .945, .955), yun * .6);

  // brush ink on top of the washes: sharper than the washes, but it still feathers into the paper
  vec2 luv = uv + wob * .4;
  vec4 L = texture(uLines, luv), Ls = vec4(0.), halo = vec4(0.);
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.0472 + rot;
    vec2 o = vec2(cos(a), sin(a)) * sc * px;
    Ls += texture(uLines, luv + o * .8);
    halo += texture(uLines, luv + o * 2.6);
  }
  Ls /= 6.; halo /= 6.;
  float y = DESIGN.y - dp.y, haze = objectHaze(vec2(dp.x, y));
  c = mix(c, vec3(.4, .4, .4), halo.a * .24 * (1. - haze));     // ink bleeding into wet paper
  L = mix(L, Ls, .62);                                           // brush line, not pen line
  L.rgb = mix(L.rgb, MIST, haze * .6);
  L.a *= 1. - haze * .8;
  c = mix(c, L.rgb, L.a * .92);

  // river mist drifting in front of the shoreline (over buildings and trees too), in torn patches
  float mist = exp(-pow((y - 537.) / 11., 2.)) * smoothstep(.42, .72, fbm(vec2(dp.x * .006, y * .05) + 3.));
  c = mix(c, MIST, mist * .3);

  // one palette: mute every colour except the reds (plum, seal, lanterns), which stay the accents
  float red = smoothstep(.1, .28, c.r - max(c.g, c.b));
  c = mix(vec3(lum(c)), c, mix(.85, 1., red));

  c *= .984 + .032 * fbm(dp * vec2(.03, .12));
  // 宣纸 fibres: long thin light fibres in the sheet, pigment collecting along their sides
  float ang = fbm(dp * .018) * 9.42;
  vec2 fdir = vec2(cos(ang), sin(ang));
  vec2 q = vec2(dot(dp, fdir), dot(dp, vec2(-fdir.y, fdir.x)));
  float fib = pow(1. - abs(2. * noise(vec2(q.x * .05, q.y * 1.6)) - 1.), 18.);
  float fib2 = pow(1. - abs(2. * noise(vec2(q.x * .04 + 7., q.y * 1.4)) - 1.), 16.);
  c = mix(c, min(vec3(1.), c * 1.035 + .012), fib * .55);
  c *= 1. - fib2 * .07 * (1. - lum(c));
  c *= 1. - .03 * smoothstep(.55, .8, fbm(dp * .005 + 9.));
  // the sheet has aged unevenly: broad warm foxing toward the edges and in faint clouds
  vec2 e = abs(uv - .5) * 2.;
  float age = smoothstep(.55, 1.15, max(e.x, e.y)) * .6 + smoothstep(.5, .8, fbm(dp * .003 + 31.)) * .4;
  c *= mix(vec3(1.), vec3(.985, .962, .915), age);
  // alpha = object coverage (softened), so objects drawn on the water survive the water pass
  float cover = max(max(L.a, Ls.a), texture(uObjects, luv).a);
  fragColor = vec4(clamp(c, 0., 1.), cover);
}
