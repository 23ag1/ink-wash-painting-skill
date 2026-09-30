# Motif studies (from {Shan, Shui}*)

Study notes derived from reading the generators in **shan-shui-inf** by Lingdong Huang
(https://github.com/LingDong-/shan-shui-inf, MIT licence). These are my own words and my own
numbers read off the source as approximate ranges; **no code is copied**. The project is a single
file (`index.html`, ~4300 lines); its motifs are: mountain, flat mountain, distant mountain, rock,
eight tree kinds, four buildings (hut-house, two-storey pavilion, multi-storey tower/pagoda, small
pagoda/gate), boat, man, water lines, transmission tower. Not present in the source: bridge,
fence, umbrella, crowd/market. For those, derive from the same principles (see the last section).

## Contents
1. Primitives shared by everything
2. Architecture (pavilion, tower, pagoda, eaves, railing)
3. Boat
4. Figure (man, hat, stick)
5. Trees (shrub, pine-like, bare, rooted trunk, fractal winter tree)
6. Rock and mountain texture (皴)
7. Water lines
8. Repeats: fence, crowd, forests, rows
9. General lessons: how the hand-drawn feel is made
10. How to use

---

## 1. Primitives shared by everything
- **stroke**: a centre polyline turned into a filled ribbon. Half-width = `wid * profile(t)`, where the
  profile is a sine bump (fat middle, pointed ends) by default, or constant 1 for ruled lines.
  Width is then mixed with Perlin noise: `w = w*(1-noi) + w*noi*noise`, noi ~0.5 (1.0 for wobbly
  architecture lines). Colour is a flat grey with alpha 0.3 to 0.6 -- never pure black.
- **blob**: a leaf/stone/moss dab. An outline is built from a spindle (length `len`, max width `wid`,
  pointed both ends), each vertex radius multiplied by a looped noise (noi 0.5) so it closes smoothly.
  Used for leaves, moss dots, hats, bark flecks. Typical dab: len 10-30, wid 3-9, random tilt ±15 deg.
- **poly**: a plain filled polygon. Filled *white* it is an eraser (occlusion), filled grey it is a wash.
- **div**: resample a two-point line into N points so noise can bend a straight edge.
- **texture**: the 皴 engine (section 6). **bezmh**: smooth curve through a few control points.
- Randomness everywhere is uniform, gaussian (clump near centre) or a weighted sampler; rarely a plain
  uniform for placement, because clustering looks natural.

## 2. Architecture (pavilion, tower, pagoda, eaves, railing)
a. Skeleton: one shared set of numbers -- width, height, `rot` (0..1, how far the front corner sits from
   the left edge: 0.3 or 0.7 means a corner view, never 0.5) and `per` (vertical drop of the front corner,
   ~4-5 px, the whole perspective). Every part (box, roof, rail) reuses the same `rot` and `per`, so the
   pieces agree in perspective without any 3D.
b. A **box** (wall block) = two vertical edges, a front corner edge, and two short slanted bottom edges;
   stroke width 1.5-3, noise 1. A **roof** = five edges: two curved eaves swooping up at the tips
   (overhang `cor` 5-10 px beyond the wall), a ridge, and a hip line; the flat underside is a white polygon.
   A **pagoda roof** = a fan of 4 lines from the apex to tips that overhang by `cor` ~10 px, joined by
   low arcs: a tent, not a box.
c. Order: white polygon first (hides whatever is behind, including mountain lines), then the ruled
   strokes. Order of parts: back railing, figure, then front railing -- so a person stands *between*
   the rails.
d. Numbers: hut-house = roof (40-60% of height, wall width 2/3 of roof width) over a box; pavilion
   3 storeys, wid 40-70, hei ~10 per storey; tower 5-7 storeys. **Each storey is 0.85x the width of the one
   below, its roof 0.9x, stacked at 1.5x storey height**: taper equals the pagoda silhouette. Small pagoda
   gate: 2 storeys, wid 30, hei 15. The count of storeys is the only variable.
e. Windows/doors ("deco"): three styles only, all from dividing the wall face into a grid (1x3..1x5):
   verticals only; verticals with short crossbars; a lattice. Drawn as thin strokes inside the box face --
   texture, not detail. Railings: two rows of posts (2-6 segments) between a top and bottom rail, with
   posts jittered in height by noise and one segment left open, so it is not a perfect fence.
f. Omitted: tiles, beams, brackets (斗拱), doors' depth, any shading. All lines equal weight (ruled,
   界画 spirit) yet each wobbles slightly. Depth: distance is handled by *scale and placement* only --
   the same function at wid 40 far, 180 near; low alpha 0.4 for every building line.

## 3. Boat
a. Skeleton: one hull curve. Two arcs, both `sin(t*pi)^0.5` (blunt, full ends), depth 7 and 10 px times
   scale, run along length 120 px; joined into a thin lens. Scale comes from its y position on the water
   (`y/800`): further up the picture, smaller.
b. Draw: fisherman first (so hull covers his legs), then hull as white polygon, then one sine-weighted
   outline stroke (width 1, swelling mid-hull, alpha 0.4). Nothing else: no mast, no net, no cabin.
c. The figure is scaled 0.5 of the boat, stands 20 px from the centre, carries a long stick (pole) and a wide
   flat hat. The pole length is shortened by custom limb lengths.
d. Variation: flipped randomly, placed so no two boats are within 400 px. Reflection/ripples are not drawn
   on the boat: the water lines beside it do that job.

## 4. Figure (man, hat, stick)
a. Skeleton: a 9-joint stick figure with hierarchical angles (hip, neck, head, two legs, two arms
   with elbows). Limb length 30 (units * scale 0.4-0.5), torso 30, head 20. Angles are fixed except small
   random ranges on one leg and one arm (up to 45-135 deg) so each figure stands slightly differently.
b. Body parts are **ribbons along the joint chains**: sleeve and robe widths come from a profile
   (widest near the shoulder, tapering, a small bulge at hips: `sin`-based), width 8x and 11x scale;
   head is a squat ellipse profile, width 7x scale. Each ribbon = white fill + two thin side strokes with
   different alpha (0.5 / 0.6) so the body reads as a robe with a lit and a shaded edge.
c. Face: the head is filled grey *except* a thin sliver at the front, leaving just a hint of profile. Hat
   (a hand-set 7-point polygon drawn relative to head direction, filled grey 0.8) -- two hats only: a
   small cap with a hair-knot line, and a wide flat bamboo hat (length ~2.5x head, tilt by neck direction).
d. Omitted: hands, feet, face, folds. The figure is ~15-25 px tall in the picture. Read as a person from
   posture and hat alone. Flip flag mirrors the whole thing.
e. Umbrella does not exist in the source; a figure with an umbrella would be the same body plus one
   wide flat hat-like polygon.

## 5. Trees
Every tree is one idea -- **trunk = two wobbly edges, foliage = a cloud of blobs** -- varied by how
blobs are placed.
- **tree01 (shrub/pine-ish)**: 10-slice vertical trunk, trunk width 1-4 px, two thin noise-wobbled edges
  (1.5 px); blobs sprinkle only above the lower quarter, a few per slice, fewer near the top, tilted ±15 deg,
  alpha 0.3-0.5 (lighter when far). No trunk fill.
- **tree02 (foliage clump)**: only 5 blobs (clu) scattered by gaussian around the point, each a leaf shape
  (len 8-16, wid 4-10). Used on ridges as "moss trees" -- alpha 0.5-0.8 by noise so patches vary.
- **tree03 (conifer/cypress)**: trunk tapers to a point (white fill, outline); blobs per slice
  `(slices-left)*2` fill a *log-shaped* envelope: wide at the bottom, sharp at top; tilted a little.
- **tree04/05 (old tree / willow-like)**: trunk is a 3-segment random-walk spine, ~300 px, width 5-6,
  thinning by half along its length. Then 1) **bark** (short noise-bent strokes across the trunk, 20% are
  dark blobs, 5% knot clusters), 2) broken outline stretches (half of the boundary points skipped, drawn as
  separate rough strokes displaced by 15 px noise: dry-brush edge), 3) side branches (same function at 0.3
  scale, angle ±36 deg to 100+ deg), 4) **twigs** and, for tree05, small leaf cloud at branch tips (5 blobs
  tight in a row).
- **tree06 (fractal winter tree)**: recursive, depth 3: each child branch 70-90% length, 60% width, angle
  offset 0.02-0.1*pi; branching probability 2.5% per point in the middle 60% of the parent, plus one
  guaranteed fork at the middle. Twigs at random points. Leafless.
- **tree08 (thin twig tree)**: a curved trunk with tiny recursive twigs: length shrinks 0.8-0.9 per level,
  each node splits in 1 or 2 (50%), tips fade (width cos profile at last level).
- **tree07 (filled colour tree)**: a triangle mesh coloured by noise in 50-250 grey -- a flat-shaded
  "distant" style, used rarely.
- Omitted: leaves as individual shapes (blobs stand in), root flare, light direction. Avoiding
  mechanical: branch side and angle are random, blob alpha varies, trunk width noise ±(wid*hei/80).
- Depth: the same tree function gets height scaled by ground y (`(h+y)/h*70` etc.) and alpha 0.3 (far)
  to 0.8 (near); trees on the crest (tree02) are lighter than trees on the foot (tree03).

## 6. Rock and mountain texture (皴)
**Mountain**
a. Skeleton: a 10 x 50 grid of "slices". Slice 0 is the silhouette: a cosine hump `cos(x)` (x in ±pi/2)
   multiplied by Perlin noise (noise at a fixed seed along x, slowly changing per slice: step 0.15).
   Each deeper slice is the same curve scaled down by `p = 1 - j/10` and shifted down a little: nested
   contours, like a topographic map seen from the side. Height 100-500, width 400-600.
b. Draw order (back to front): moss trees on the rim -> white filled silhouette (eraser) -> outline stroke
   (alpha 0.3, width 3, noise 1 -- a fat, soft, broken line) -> **foot** (2-4 low, faint, overlapping
   bumps at the base, alpha 0.1-0.2) -> **texture** -> moss trees at the top -> mid-slope trees ->
   foot trees -> buildings -> rocks at the base.
c. **Texture** (the 皴 engine): pick a number of strokes (200 default, 80 flat mount). Each stroke
   picks a random slice (so strokes are spread across depth), then a centre position along the slice
   -- chosen near 1/3 or 2/3 of the width (the two flanks, not the crest or the middle) -- and a half-length
   up to 20% of the width. The stroke follows the **contour of that slice** for that span, displaced by noise
   whose amount is `30/(layer+1)`: outer slices wobble a lot, inner ones hardly. Width 1.5, alpha random
   0-0.3. Result: hundreds of faint, contour-following, broken fibres, which reads as 披麻皴 without any
   rule about texture direction. 10% of mountains add a soft wide "shade" pass (width 5, alpha 0.1) first.
d. Vegetation is **rule-based placement on the grid**: a cubed noise value below a threshold
   (`n^3 < 0.1`) picks sparse clumps -- cubing pushes most places to "no", a few to "yes". Rules: top only
   where the slope is high, middle only where it is low (< 30% of height) and in clusters (each needs
   >2 neighbours within 30 px, otherwise no tree), bottom only at the two side edges.
d'. Flat (table) mountain: the same grid, clipped at a fixed height to make a plateau; the flat stretches
   are found, joined, then their outline is wobbled to make a light "cap". Decorated with rocks (2-6),
   a tree group (chosen from five kinds) and sometimes a small house.
e. **Distant mountain**: a ribbon of ridge at height ≤150, split into 10-px-wide columns; each column
   filled with light grey 200-255 varying by noise; nothing else (no outline, no texture). Depth = light,
   flat, featureless.
**Rock**
a. Skeleton: an ellipse (wid x hei 20-60) with radius × (0.7..1.0 by looped noise) so the outline is a
   bumpy pebble; the bottom half is squashed to 20% height (a flat base); 10 concentric, shrinking copies.
b. White fill, soft outline (alpha 0.3, width 3), then texture with strokes near 15% and 85% (left and right
   shoulders only), width 3, light grey 180, alpha 0.3-0.6, plus "sha" pass. Omitted: edges,
   facets. Rocks at the base are small (20-40), big ones 50-70 on plateaus.

## 7. Water lines
a. No skeleton. 10 short horizontal clusters; each a line 100-400 px with y from
   `sin(x*0.2)*2*noise` (a small ripple) stacked downward by random 0-5 px.
b. One stroke each, width 1, alpha 0.3-0.6, horizontal shift random. That is all.
c. Omitted: waves, reflection, colour. Water = gaps. Every water cluster is attached to the foot of a mountain,
   drawn as a separate chunk layered *behind* it (y - 10000 in the sorting), so it appears only as ripple
   lines near the shore and the rest of the water is paper.

## 8. Repeats: fence, crowd, forests, rows
Fence, crowd: not in the source. What the source does for repetition (forests, railings, tower lattices,
rows of trees on a plateau, windows):
- Rows are built by a **grid plus per-element noise**: same function called at a regular step (20-30 px)
  with ±20 px jitter in x and random height (60-300 or 40-80) -- never an exact step.
- One element per row breaks the pattern: railing leaves one segment open and every post gets its own
  height noise ±hei/2; posts are drawn 2 px wide in a second pass, separate from the rails.
- Count is a probabilistic rule ("more if near, fewer if far"), not a constant.
- Elements near each other overlap in painter's order (sorted by base y), and each has a white
  fill so a near one cleanly cuts a far one; overlap is what turns N repeats into a crowd or a grove.

## 9. General lessons: how the hand-drawn feel is made
1. **Noise-modulated width along the stroke.** Not a uniform line: sine profile (pointed ends) times a
   Perlin wobble (noi 0.5-1.0). Even ruled architecture lines use noi 1 with constant profile, so they
   are straight but not uniform. Ends taper to zero, like a lifted brush.
2. **Partial, broken strokes.** Texture strokes cover only 10-20% of a contour; bark outline drops half its
   points and redraws pieces displaced by noise; railings leave a gap. The eye completes the form: marks
   are sparse, each one is a separate gesture.
3. **Painter's order with white erasers.** Every solid thing paints a white polygon first, then its lines,
   then is sorted by base y (far to near). The layering itself produces occlusion and depth;
   no hidden-line logic. Water lines are sorted behind their mountain.
4. **Tone by depth through alpha and amount, not by lines.** Far: pale flat fill, no outline. Mid:
   alpha 0.3 strokes. Near: alpha 0.5-0.8 and more detail (bark, twigs). Grey is never below ~100/255;
   one rgba(100,100,100,a) is the whole palette, variation comes from `a` (random 0-0.3 per stroke).
5. **Structure from a handful of parameters plus constrained randomness.** Each motif has one skeleton,
   3-6 knobs, and randomness in *choice* (how many storeys, which tree, flip) and in *placement*
   (gaussian clusters, cubed-noise thresholds, jitter). Constraints keep it plausible (corner `rot`
   never 0.5, tree height tied to ground y). Detail is added only where the eye goes (crest, bark,
   rim); the rest is left empty.

## 10. How to use
- When a motif is new (a bridge, a fence, an umbrella, a pagoda seen from another side), open this
  file, find the nearest relative and read its **skeleton first, strokes second, omissions third**.
- Do **not** copy these numbers as a recipe; derive your own construction for your canvas scale: what is
  the minimum skeleton that fixes the silhouette and perspective, which 3-6 knobs vary, which
  marks are the "right" few, what do you leave empty, how does depth change it.
- Then run the **false-word test**: cover the label and look at the result. If the picture could be
  described by a wrong word ("a box", "a bush", "a tent", "a rock" for a pagoda) then one mark is
  missing or wrong -- typically the silhouette marker (eave tips, hat, taper, hull ends). Fix that
  mark, not the amount of detail.
