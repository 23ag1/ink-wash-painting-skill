// This painting's constants: the silk, the mist and where it lies. Noise from the kit.
#include "kit/noise.glsl"
const vec2 DESIGN = vec2(640., 1120.);
const vec3 SILK = vec3(.9, .83, .7);     // aged silk: warm, darker than paper
const vec3 MIST = vec3(.94, .9, .81);     // mist on old silk: lighter than the silk, still warm

// the mist band across the middle with tongues rising between the peaks, plus a thin morning haze in the sky
float mistAt(vec2 p) {
  float tear = fbm(vec2(p.x * .006, p.y * .012) + 4.);
  float band = smoothstep(520., 600., p.y) * (1. - smoothstep(700., 770., p.y));
  float tongues = smoothstep(380., 560., p.y) * (1. - smoothstep(600., 640., p.y)) * smoothstep(.5, .7, fbm(vec2(p.x * .012, p.y * .004) + 9.));
  float sky = (1. - smoothstep(120., 520., p.y)) * smoothstep(250., 520., p.x) * .35;
  float rocksFoot = exp(-pow((p.y - 690.) / 50., 2.)) * (1. - smoothstep(280., 340., p.x)) * .7;
  // the mist rises over the foot of the grove, torn, so the trees come up out of it
  float grove = smoothstep(540., 600., p.y) * (1. - smoothstep(640., 700., p.y)) * smoothstep(190., 260., p.x) * (1. - smoothstep(560., 620., p.x)) * mix(.75, 1., tear);
  return clamp(max(max(max(band * mix(.55, 1., tear), tongues * .7), max(sky, rocksFoot)), grove), 0., 1.);
}
