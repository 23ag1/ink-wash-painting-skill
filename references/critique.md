# Critic's checklist and zoom protocol

Run this after every meaningful change, as a harsh critic, not as the author. Fix the top issues, re-render,
run it again. Stop only when a round finds nothing a painter would object to.

## Zoom protocol
Full-frame screenshots hide almost every execution flaw. Each round, look at:
1. Full frame (composition, tone, focal hierarchy).
2. Host massif at 3× (contour, fibre strokes, glaze edges, mist at the foot).
3. Main building + waterline at 3-5× (grounding, stilts, reflection, seam, facade density).
4. Focal object at 5-6× (boat: hull/reflection contact, canopy, figure; or whatever the focus is).
5. Branch / near ground at 3× (stroke tone, blossoms, reeds).
6. Title + seal at 3× (brush texture, placement on clean paper).
In a browser pane: `stage.style.transformOrigin = 'X% Y%'; stage.style.transform = 'scale(k)'` then screenshot.
Also read the console for shader compile errors after every reload.

## Composition
- [ ] One host massif, guests lower and grouped, a void — not a fence of equal peaks.
- [ ] No spiky peaks (half-width ≥ ~0.8 × height).
- [ ] Exactly one focal point; everything else quieter. The subject of the occasion is not the weakest spot.
- [ ] Diagonals: near-ground ↔ branch, building ↔ focal object. Nothing important dead centre.
- [ ] Three planes present; the near plane has the darkest ink and the biggest scale.
- [ ] The void reads as distance (pale far ranges, distant trees, a sail), not as a hole.
- [ ] Writing: at most one text + one seal, on clean paper, no punctuation, not a subtitle.

## Tone and colour
- [ ] Full range: charred accents near, paper-white moon/void, pale far. Not a grey haze over everything.
- [ ] Red only on the accents; the rest muted and warm; paper warm ivory, aged at the edges.
- [ ] Every object at the same depth has the same veil (shoreline objects as hazy as the near ranges).

## Execution (digital tells)
- [ ] No striped sky, no banded / scan-line water, no ruler-straight waterline.
- [ ] No radial glows, specks, vignettes, neon rims, UI.
- [ ] Strokes have tone inside (tip/belly), pressed entry, thinning exit — no flat single-colour polygons.
- [ ] No "beads" (pulsing width) and no "stitching" (regular dashes) along lines.
- [ ] Wet washes have fibrous edges and pooled rims; dry strokes stay sharp. Not uniformly soft.
- [ ] No element drawn more carefully than its neighbours (sharper, darker, more saturated, more detailed).

## Grounding and physics
- [ ] Every object ends in ground, water (with reflection), mist, or the sheet edge — nothing floats.
- [ ] Trees stand on ground, not on water.
- [ ] Objects on water: reflection starts at their foot, no paper gap.
- [ ] Objects in the shallows sink into the water gradually; the seam is soft and ragged.
- [ ] Nothing behind shows through anything in front (ink-layer occlusion).
- [ ] The moon's glitter path is under the moon; reflections are under their objects.

## Motion
- [ ] Only water, mist, geese, petals, lamplight move — slowly, few, painted.
- [ ] Nothing flickers or shimmers (no per-frame noise on the static painting).
