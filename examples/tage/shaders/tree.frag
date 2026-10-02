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
  float d = f.d + (fbm(vec2(along * .12, across * .4) + 3.) - .5) * (min(f.r * .3, 2.2) * smoothstep(2.5, 7., f.r) + .25);   // thin wands: smooth (bumps read as bamboo nodes)
  float cover = smoothstep(px, -px, d);
  if (cover <= 0.) { fragColor = vec4(0.); return; }

  float right = f.across * sign(perp.x + 1e-4);               // -1 lit (left) .. 1 shadow (right)
  // painted, not shaded: no cylinder gradient. A broad wet stroke down the shadow side with a ragged inner
  // edge; silk in the middle crossed by a few dry bristle streaks; dark knots; a broken contour.
  float rag = fbm(vec2(along * .03, 1.7)) - .5;
  float side = smoothstep(-.35 + .5 * rag, -.05 + .5 * rag, right);  // the wet stroke covers the shadow two-thirds
  float bristle = fbm(vec2(along * .012, across * 1.4) + 5.);
  float tone = .22 + f.ink;                                      // the silk with a thin warm wash
  tone = max(tone, side * (.62 + .3 * bristle));
  tone = max(tone, smoothstep(.6, .72, bristle) * .55 * (1. - side));   // dry streaks along the limb
  float knot = smoothstep(.76, .84, noise(vec2(along * .035, across * .14) + 41.));
  tone = max(tone, knot * .85);
  // creases where the head's lumps fuse (only on the head: the trunk's own taper must not draw a rim)
  tone = max(tone, smoothstep(.4, 2.5, f.crease) * smoothstep(.05, .2, f.ink) * .9);
  // the contour: pressed, heavier on the shadow side, broken on the lit side
  float edgeW = clamp(f.r * .14, .8, 3.) * mix(.8, 1.4, step(0., right));
  float edge = 1. - smoothstep(edgeW * .4, edgeW, -d);
  edge *= mix(smoothstep(.35, .5, noise(vec2(along * .05, 3.) + 23.)), 1., step(0., right));
  tone = max(tone, edge * .9);
  // thin wands and twigs are single dark lines: any texture on them reads as bamboo nodes
  tone = mix(.82, clamp(tone, 0., .95), smoothstep(4.5, 8., f.r));
  fragColor = vec4(mix(SILK, INK, tone), cover);
}
