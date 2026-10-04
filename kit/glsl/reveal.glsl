// Reveal: the painting appears on blank paper as ink running into wet paper (from the rain-market example; every
// comment marks a failure that was fixed). Needs kit/noise.glsl. Inputs are WHOLE states of the painting, each
// rendered through the full material pipeline and mipmapped (rt.mipmap):
//   blank  = bare paper            washes = every wash down, no ink (and no seal/inscription)
//   full   = the finished painting  timeI  = kit/brush/inktime.js map (R·A = stroke time, A = coverage)
// progress: 0 → 1 the washes arrive (unclamped: ink and the last marks run past 1, the inscription at ~1.2-1.5).
// lastMask: 1 where marks must come strictly last (inscription, seal). poolScale: size of the blooms (≈ 2.4 / width).
// Rules it embodies: the arrival field is smooth and independent of the objects (per-object timing always drew
// outlines and cut-outs); a smooth remap, never clamped (plateaus switched all at once); blurs come from mip
// levels (random taps shimmered as sand); ink follows the wash front locally; thin paper strips that only the ink
// covers are filled with the surrounding wash until their stroke arrives (else white stripes flash).

vec3 revealSoft(sampler2D s, vec2 uv, vec2 r, vec2 res) {
  float rpx = r.x * res.x;
  vec3 sharp = texture(s, uv).rgb;
  float lod = log2(max(1., rpx * .9));
  vec2 o = r * .35;
  vec3 blur = .25 * (textureLod(s, uv + vec2(o.x, o.y), lod).rgb + textureLod(s, uv + vec2(-o.x, o.y), lod).rgb
                   + textureLod(s, uv + vec2(o.x, -o.y), lod).rgb + textureLod(s, uv - o, lod).rgb);
  return mix(sharp, blur, smoothstep(.2, 2., rpx));       // continuous: a hard switch drew a seam along every front
}

vec3 revealPainting(sampler2D blank, sampler2D washes, sampler2D full, sampler2D timeI,
                    vec2 uv, vec2 p, vec2 res, float sc, float progress, float lastMask, float poolScale) {
  vec2 px = 1. / res;
  // a few BIG pools start in scattered places and run into each other (not a top-to-bottom sweep, not confetti)
  float bloom = .8 * fbm(p * poolScale + 4.1) + .2 * fbm(p * poolScale * 2.9 + 9.7);
  float T = smoothstep(.2, .8, bloom) * .55;
  float fw = (progress - T) / .4;                                           // 0 = the wash front here
  float k = clamp((progress - T - .1) / .36, 0., 1.);                       // ink follows its own wash locally
  k = mix(k, clamp((progress - 1.22) / .28, 0., 1.), lastMask);             // inscription and seal strictly last
  float a1 = smoothstep(0., 1., fw);                                        // the pool arrives: a pale dilute tint
  float a2 = smoothstep(0., 1., (progress - T - .1) / .6);                  // then the tone deepens to full value
  // the stroke-time map read as blurred as the paint is wet (a sharp mask under wet paint showed ghost strokes)
  vec4 tv = textureLod(timeI, uv, 1. + log2(1. + (1. - a2) * 7. * sc));
  float cov = smoothstep(.04, .45, tv.a), tI = tv.a > .01 ? clamp(tv.r / tv.a, 0., 1.) : 0.;
  float ai = mix(1., smoothstep(tI * .9, tI * .9 + .1, k), cov);
  ai = mix(ai, k, lastMask);
  vec3 base = texture(blank, uv).rgb;
  vec3 tint = mix(base, revealSoft(washes, uv, 12. * sc * px, res), .4);
  vec3 sw = revealSoft(washes, uv, (1. - a2) * 7. * sc * px, res);
  vec3 sf = revealSoft(full, uv, max((1. - ai) * 1.5, (1. - a2) * 7.) * sc * px, res);   // same wetness as around it
  vec3 c = mix(base, tint, a1);
  // thin strips of bare paper that only the ink covers (between a wash and its contour, under rows of marks) are
  // paper-white in the washes state: fill them with the surrounding wash (a small min filter on a smooth mip level)
  vec3 sfS = revealSoft(full, uv, max(1.5, (1. - a2) * 7.) * sc * px, res);
  vec3 closed = textureLod(washes, uv, 1.5).rgb;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 1.0472 + (i < 6 ? 0. : .5236), r = i < 6 ? 2.6 : 6.;
    closed = min(closed, textureLod(washes, uv + vec2(cos(a), sin(a)) * r * sc * px, 1.5).rgb);
  }
  float gap = smoothstep(.02, .1, lum(textureLod(washes, uv, 1.5).rgb) - lum(textureLod(full, uv, 1.5).rgb)) * (1. - lastMask);
  vec3 swf = mix(sw, max(closed, sfS), gap);
  vec3 deep = mix(swf, sfS, .5 * (1. - lastMask));
  c = mix(c, deep, a2 * a2 * (3. - 2. * a2));
  // water runs ahead of the pigment: a faint cool damp band just before the front (晕)
  float damp = smoothstep(-.6, 0., fw) * (1. - smoothstep(0., .4, fw));
  c *= mix(vec3(1.), vec3(.958, .962, .97), damp);
  return mix(c, sf, ai * a2);
}
