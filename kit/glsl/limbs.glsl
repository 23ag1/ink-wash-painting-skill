// Limbs as one field: a branching thing (tree, root, bamboo node, antler, coral) described as a skeleton of
// tapered segments and rendered as ONE signed distance field with a smooth union, so joints flow into each other
// by construction — no seams, no end caps, no branch floating beside its trunk. The look (tone, bark, contour,
// dry brush) is the caller's: this module gives the field and the frame of the nearest limb.
// Skeleton texture (rgba32f, NEAREST, height 1): texel 2i = (ax, ay, ra, sa), texel 2i+1 = (bx, by, rb, sb), design
// units; s = arc length along the limb (any origin per chain). Texture coordinates come from s and the cross
// position — never from projecting world position on a direction: where the limb turns, that jumps (rings).

// tapered capsule (IQ's uneven capsule in the segment's frame). fr.x: signed position across the limb in
// radii (-1 left of a->b .. 1 right), fr.y: 0..1 along it
float sdLimb(vec2 p, vec2 a, vec2 b, float ra, float rb, out vec2 fr) {
  vec2 ba = b - a; float L = max(length(ba), 1e-3); vec2 d = ba / L;
  vec2 q = vec2(dot(p - a, vec2(-d.y, d.x)), dot(p - a, d));
  float t = clamp(q.y / L, 0., 1.), r = mix(ra, rb, t);
  fr = vec2(q.x / max(r, 1e-3), t);
  q.x = abs(q.x);
  float bb = (ra - rb) / L, aa = sqrt(max(1. - bb * bb, 0.));
  float k = dot(q, vec2(-bb, aa));
  if (k < 0.) return length(q) - ra;
  if (k > aa * L) return length(q - vec2(0., L)) - rb;
  return dot(q, vec2(aa, bb)) - ra;
}

float sminLimb(float a, float b, float k) { float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }

struct LimbField {
  float d;       // signed distance to the whole skeleton (negative inside)
  float r;       // local radius (blended)
  vec2 dir;      // local limb direction, root -> tip (blended, unit)
  float across;  // signed position across the limb, -1..1 (blended)
  float along;   // arc length along the limb, design units (blended)
};

// k: smooth-union radius as a fraction of the thinner limb's radius (.5-1 gives a natural crotch)
LimbField limbField(sampler2D skel, int n, vec2 p, float k) {
  LimbField f; f.d = 1e5; f.r = 1.; f.dir = vec2(0., -1.); f.across = 0.; f.along = 0.;
  float ws = 0.; vec2 dirs = vec2(0.); float rs = 0., us = 0., ss = 0.;
  for (int i = 0; i < n; i++) {
    vec4 A = texelFetch(skel, ivec2(2 * i, 0), 0), B = texelFetch(skel, ivec2(2 * i + 1, 0), 0);
    vec2 fr; float di = sdLimb(p, A.xy, B.xy, A.z, B.z, fr);
    float ri = mix(A.z, B.z, fr.y);
    f.d = i == 0 ? di : sminLimb(f.d, di, max(.5, k * ri));
    float w = exp(-max(di, -ri) / max(ri * .6, .5) * 2.);      // nearby limbs share their frame: no grain seam at joints
    ws += w; dirs += w * normalize(B.xy - A.xy + 1e-4); rs += w * ri; us += w * clamp(fr.x, -1., 1.); ss += w * mix(A.w, B.w, fr.y);
  }
  f.r = rs / max(ws, 1e-6); f.dir = normalize(dirs + 1e-6); f.across = us / max(ws, 1e-6); f.along = ss / max(ws, 1e-6);
  return f;
}
