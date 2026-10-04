#include "common.glsl"
#include "kit/reveal.glsl"
// Pass C (every frame): the reveal (the painting appearing on blank paper), then the finished painting + living
// water that reflects it.
uniform vec2 uRes;
uniform float uTime;
uniform sampler2D uPaint;
uniform sampler2D uWashes;   // reveal states (kit/glsl/reveal.glsl)
uniform sampler2D uBlank;
uniform sampler2D uTimeI;
uniform float uProgress;     // reveal progress, unclamped (≥ 2 = finished)
uniform float uFx;           // water, mist drift fade in once the painting has appeared
uniform vec3 uMoon;        // x, y, radius (radius 0 = no moon)
uniform float uWaterOn;    // 0 = no water pass
out vec4 fragColor;

#define MOON_X uMoon.x

vec3 P(vec2 designXY) { return texture(uPaint, vec2(designXY.x, DESIGN.y - designXY.y) / DESIGN).rgb; }

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / uRes;
  vec2 p = designPos(fc, uRes);
  float t = uTime;
  vec4 paint = texture(uPaint, uv);
  // the title column and its seal are written strictly last
  float last = max(1. - smoothstep(1., 1.3, length((p - vec2(1180., 430.)) / vec2(80., 225.))),
                   1. - smoothstep(1., 1.3, length((p - vec2(1125., 497.)) / vec2(30., 30.))));
  vec3 col = uProgress > 2. ? paint.rgb : revealPainting(uBlank, uWashes, uPaint, uTimeI, uv, p, uRes, uRes.x / DESIGN.x, uProgress, last, .0026);

  if (uWaterOn > .5 && p.y > WATER - 10.) {
    // water is left as paper (留白): only a faint, slowly breathing reflection of the painting above,
    // a few moon glints under the moon, and a thin mist drifting on the surface
    float k = max(p.y - WATER, 0.);
    float wob = (sin(p.y * .22 - t * .8) * .7 + (fbm2(vec2(p.x * .006, p.y * .03 - t * .12)) - .5) * 2.4) * smoothstep(0., 30., k);
    vec2 m = vec2(p.x + wob, 2. * WATER - p.y);
    vec3 refl = vec3(0.);
    for (int i = -3; i <= 3; i++) refl += P(m + vec2(float(i) * .7, float(i) * (1.2 + k * .04)));
    refl /= 7.;
    vec3 w = mix(PAPER, refl, .34 * exp(-k / 110.));

    float glow = exp(-pow((p.x - MOON_X - wob * 2.) / (16. + k * .25), 2.));
    float gl = smoothstep(.62, .88, noise(vec2(p.x * .04, p.y * .18 - t * .35)));
    w = mix(w, vec3(1.), glow * gl * .5 * exp(-k / 150.) * step(.5, uMoon.z));

    float wisp = smoothstep(.58, .85, fbm2(vec2(p.x * .004 - t * .01, p.y * .04)));
    w = mix(w, MIST, .18 * wisp * exp(-k / 90.));
    vec2 dp = p * vec2(1., -1.);
    w *= .984 + .032 * fbm(dp * vec2(.03, .12));
    // the waterline is a wet, ragged zone, not a ruled line: water comes in over a band that wanders with noise,
    // and objects standing in the shallows (stilts, bank edges, trees) sink into it gradually; further out
    // (the boat) objects are kept whole again
    float edgeY = p.y + (fbm2(vec2(p.x * .02, 7.)) - .5) * 10.;
    float waterIn = smoothstep(WATER - 8., WATER + 12., edgeY);
    float shallows = smoothstep(WATER + 1., WATER + 20., p.y) * (1. - smoothstep(WATER + 26., WATER + 36., p.y));
    float keep = smoothstep(.05, .45, paint.a) * (1. - .6 * shallows);
    col = mix(col, w, waterIn * (1. - keep) * uFx);
    // a thin wet haze lies right on the seam
    float seam = exp(-pow((p.y - WATER - 3.) / 7., 2.)) * (.55 + .45 * fbm2(vec2(p.x * .01 - t * .01, 3.)));
    col = mix(col, MIST, seam * .32 * (1. - smoothstep(1040., 1100., p.x)) * uFx);
  }

  // mist drifting very slowly along the foot of the mountains and over the near water, thinning out
  // toward the inscription column so the writing stays on clean paper
  float drift = fbm2(vec2(p.x * .0035 - t * .006, p.y * .028 + 3.)) * .7 + fbm2(vec2(p.x * .009 + t * .004, p.y * .05)) * .3;
  float feet = exp(-pow((p.y - 512.) / 26., 2.)) + .6 * exp(-pow((p.y - 575.) / 18., 2.));
  float veil = feet * smoothstep(.5, .78, drift) * .3 * (1. - smoothstep(1040., 1100., p.x));
  col = mix(col, MIST, veil * uFx);
  fragColor = vec4(col, 1.);
}
