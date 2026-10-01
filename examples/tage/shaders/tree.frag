// The willow's wood (once): the whole skeleton as one field, so trunk, fork and branches are a single body.
// Painted like Ma Yuan's trunk: pale where lit, wet dark on the shadow (right) side, bark grain running along
// each limb, dry-brush breaks letting the silk through on the lit side, a broken pressed contour, a ragged edge.
// Output: straight-alpha colour over the painting (a = coverage).
#include "common.glsl"
#include "kit/limbs.glsl"
uniform vec2 uRes;
uniform sampler2D uSkel;
uniform int uN;
uniform vec4 uBox;          // design-space bounds of the skeleton (+ margin): outside is skipped
out vec4 fragColor;

const vec3 INK = vec3(.08, .065, .05);

void main() {
  vec2 p = designPos(gl_FragCoord.xy, uRes, DESIGN);
  if (p.x < uBox.x || p.y < uBox.y || p.x > uBox.z || p.y > uBox.w) { fragColor = vec4(0.); return; }
  float px = DESIGN.x / uRes.x;                                // design units per pixel
  LimbField f = limbField(uSkel, uN, p, .8);
  vec2 perp = vec2(-f.dir.y, f.dir.x);
  float along = f.along, across = f.across * f.r;            // the limb's own frame (see kit/limbs.glsl)
  // ragged silhouette: the brush edge is never a clean offset curve
  float d = f.d + (fbm(vec2(along * .12, across * .4) + 3.) - .5) * min(f.r * .3, 2.2);
  float cover = smoothstep(px, -px, d);
  if (cover <= 0.) { fragColor = vec4(0.); return; }

  float right = f.across * sign(perp.x + 1e-4);               // -1 lit (left) .. 1 shadow (right)
  float thin = smoothstep(1.2, 4., f.r);                       // thin twigs are just dark lines
  float shade = smoothstep(-.4, .9, right);
  float tone = .4 + .42 * shade;
  // wet tonal variation along the limb (strokes laid one beside another), then bark grain
  tone += (fbm(vec2(along * .02, across * .08) + 11.) - .5) * .3;
  float grain = fbm(vec2(along * .05, across * .5) + 5.);
  tone += smoothstep(.55, .78, grain) * .35 * (.5 + .5 * shade);
  // dry brush on the lit side: bristle gaps where the silk shows through
  float dry = smoothstep(.6, .85, fbm(vec2(along * .03, across * .9) + 17.));
  tone *= 1. - .5 * dry * (1. - shade);
  // the contour: pressed, darker on the shadow side, broken here and there
  float edgeW = clamp(f.r * .16, .7, 3.2) * mix(.7, 1.3, shade);
  float edge = 1. - smoothstep(edgeW * .4, edgeW, -d);
  edge *= smoothstep(.3, .45, noise(vec2(along * .04, right * 2.) + 23.));
  tone = max(tone, edge * .92);
  tone = mix(.85, clamp(tone, 0., .95), thin);
  fragColor = vec4(mix(SILK, INK, tone), cover);
}
