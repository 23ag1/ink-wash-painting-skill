# Judgement: the decisions that change from picture to picture

Rules like "leave 70% paper" are wrong half the time. A painter decides void, density, darkness and wetness
from **what the picture must feel like**. This file gives the reasoning, then the universal laws that keep any
procedural picture from looking computer-made.

## Contents
1. Decide from the mood (the dials)
2. Density: sparse and dense are both right — choose
3. Every part of the sheet has a job (edges included)
4. Structure right, rendering loose
5. The anti-CG laws (universal)
6. Hierarchy of finish

---

## 1. The dials — set each deliberately in the brief, with a reason
| dial | low end | high end | follows from |
|---|---|---|---|
| void (paper untouched) | 15-30%: crowded, lively, rich (markets, festivals, forests, 积墨 night) | 70-90%: lonely, vast, calm, cold (a boat on a lake, snow, one bird) | mood + subject scale |
| ink darkness | pale, 淡/清 dominant: mist, dawn, rain, distance | charred accents, heavy blacks: night, storm, weight, drama | light + weather |
| wetness | dry: crisp, autumn, wind, age, sharp air | wet: rain, mist, spring, softness, humidity | weather + season |
| mark density | few marks, each important (写意, Bada, Liang Kai) | many marks building texture (Wang Meng, Gong Xian) | mood + distance |
| colour | ink only | ink + 1-3 accents | occasion; heavy colour = different genre |
| motion in the scene | still (silence) | busy (crowd, wind, rain) | subject |
Write e.g. "void ≈ 25%: a rain market is crowded and noisy; the calm comes from the pale far end, not from
empty margins." Then hold yourself to it in critique.

## 2. Density
- Sparse pictures live or die by the **shape and placement of the void** and the precision of few marks.
- Dense pictures live or die by **rhythm**: clusters and gaps (疏密), a clear path for the eye through the mass,
  one place where it breathes (a gap of paper, mist, a pale street), and one darkest dark.
- Even a dense picture keeps the paper somewhere; even a sparse one needs one strong dark.

## 3. Every region of the sheet has a job
Divide the sheet into rough thirds both ways and name each region's job: host, supporting group, transition,
void/distance, edge. A region with no job is dead — it reads as "empty" (not as void) or as "filler".
- **Void is designed**: it has a shape, it is on one side (rarely both), and it leads the eye somewhere.
  Symmetric empty margins on both sides read as "the picture did not reach the edges".
- **A void must be earned — four conditions** (a void that fails them reads as "unfinished" or "dirty fog"):
  1. *It has a reason in the world:* sky, water, a square, rising mist, snow, distance. If the world logically
     continues there (more town, more forest), mist must visibly swallow it — show a few dissolving fragments.
  2. *It is light:* paper or near-paper, lighter than the masses around it, maybe with one soft graded wash.
     A flat mid-grey veil over a large area is not void, it is a dull wash.
  3. *Its boundary interlocks* (犬牙交错, 虚实相生): masses push tongues into the void and the void pushes into the
     masses; elements dissolve into it gradually (half-lost roofs, a tree fading, mist entering the mass). A
     straight or stepped boundary (two triangles, a mask edge) looks cut out.
  4. *Something talks to it:* the eye is led into it and back (a road, a line of birds, a branch, a banner, a
     boat, the title placed to balance it), and its size is in proportion — not one flat shape taking 40% with
     nothing in it.
- **Void, practical rules** (from the rain-market test):
  - The void follows the logic of the world, not a mask shape. Where the world continues at the same distance as
    neighbouring masses there is no void — only mist eating fragments. Ask: "what stands here in the world, and
    why can't I see it?" If the answer is "nothing, it's just empty", it is a hole.
  - Dissolution is *directional*: an object stays crisp on the mass side and melts toward the void (gradient
    erase + blur) — never uniformly pale (a "ghost slab"). Lost edges apply to ALL layers: contour lines melt
    too, or the ink outline keeps the rectangle.
  - Fragments in the void are few, large enough and connected to the mass; lone crumbs read as errors.
  - Atmospheric veils (rain, blotchy glazes) are switched off inside the void: paper + at most one graded wash.
  - One void function shared by JS and shader (single source), or they drift apart.
- **Edges**: near elements are cropped by the edge (the world continues); far elements fade before the edge;
  a picture where everything sits in a central column looks like a sticker on a sheet.
- **Diagonals and curves**: rivers, streets, branches, ridges run on diagonals or S-curves, never straight down
  the middle. Central vertical axes and mirror symmetry are almost always wrong.

## 4. Structure right, rendering loose
The viewer's "this looks unnatural" usually means the structure is wrong, not that the brushwork is loose:
roofs without walls, buildings all the same height and orientation, umbrellas as flat discs, figures without
weight, perspective that changes from object to object. Get the construction right (research the real thing),
keep one consistent projection, then paint it loosely.

## 5. The anti-CG laws — apply to every repeated thing, in every subject
What gives away a computer: **repetition, uniform spacing, uniform size, uniform tone, uniform finish, perfect
geometry, symmetry, no hierarchy**. So:
1. **Nothing identical.** Any repeated element (roof, tree, umbrella, leaf, wave, figure, tile row) varies in
   size (±20-40%), tone, angle, proportion and completeness; some are partial, merged or lost.
2. **Cluster, don't distribute.** Place repeated things in groups with gaps (Poisson-disk + clustering), not on
   a grid or evenly along a line. Groups of 3, 5, 7 of unequal size; one big group, a few small ones.
3. **Hierarchy of sizes:** few large, some medium, many small. Never a field of equal units.
4. **No perfect geometry.** Straight lines only for ruled architecture, and even those slightly vary in weight;
   circles become brush dabs; rectangles lose a corner or an edge.
5. **Break symmetry and axes** at every level: the picture, a group, a single object.
6. **Lost and found edges:** along any contour, parts are crisp, parts dissolve. A shape fully outlined or fully
   blurred reads as digital.
7. **Hand order:** a painter works big wet washes → structural strokes → texture → dots → accents; later marks
   sit on earlier ones and interact with them. Generating objects one at a time, fully finished, looks
   assembled rather than painted.
8. **Seed test:** change the random seed. If the picture still reads the same and still looks designed, the
   structure is good; if it becomes a new random arrangement with the same flaw, the flaw is in the rules.

## 5b. Structure and motifs: failures that parameters don't fix
- **False-word test** for every motif at thumbnail size: "what else does this look like?" Seen in tests: umbrella
  with spokes = pie/wheel; straw hat with radial strokes = flower/cog/button; umbrella + stroke below = mushroom;
  carrying pole with baskets = dumbbell; soft umbrella = pompom; top-down roofs with ridge along the street =
  stacked boxes/books; a thin evenly-tiered pagoda = antenna. If it reads as an everyday object, change the
  *construction*, not the numbers.
- Build motifs from how the thing really behaves: an umbrella in rain is tilted (rotated ellipse) with a dark
  underside along the lower rim and a dry brush arc on the near edge; a roof shows a horizontal ridge, a slope
  facing the viewer, tile rows, eave ends, upturned corners.
- A white wall on white paper exists only through its dark openings (doors, windows of different sizes) and 1-2
  broken lines (corner, base) — Wu Guanzhong: narrow black roof, big white wall, black window squares.
- Projected flat details (openings, awnings in oblique projection) can read as flying black diamonds or cards —
  check each at thumbnail size.
- Ink splashes/blots (破墨) are irregular and follow structure; regular ellipses read as holes or puddles.
- A landmark in mist needs unequal tiers, a mist belt (藏露), and enough tone to survive stacked veils.

## 6. Hierarchy of finish
The host and the focal point get the most considered marks; everything else is progressively summarised.
If every element has the same level of finish, the picture has no focus and reads as a render.
