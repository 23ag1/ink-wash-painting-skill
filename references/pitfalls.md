# Pitfalls: every mistake made building this, and the fix

Symptom → cause → fix. Grouped by area; the process lessons at the end matter most.

## Contents
1. Composition
2. Tone and atmosphere
3. Brushwork and ink
4. Objects: grounding, occlusion, integration
5. Text and accents
6. Animation and UI
7. Engine / GLSL bugs
8. Process lessons

---

## 1. Composition
- **Fence of mountains** — evenly spaced similar triangles across the width. *Cause:* peaks placed by
  coordinates without a host. *Fix:* host/guest masses, a void, bases in mist (canon §3-4).
- **Spiky peaks** — "the leftmost is too sharp". *Cause:* height 255 with half-width 130. *Fix:* broad
  shoulders, half-width ≳ 0.8 × height.
- **Everything symmetric / pure triangles** — "too even". *Fix:* ridged fractal crest + lumps, asymmetric
  half-widths, x-only silhouette wobble.
- **Boat dead centre** — static. *Fix:* into the moon's glitter path, on a diagonal with the building.
- **Empty centre after cleaning up** — "it became empty". *Cause:* removing noise also removed fullness.
  *Fix:* fill voids with depth (pale far ranges, distant trees, sail, pagoda on a crest), not with objects.
- **Crowded corner** — plum + large title + poem columns + two seals + pagoda in one corner. *Fix:* one text.
- **Moving well-liked parts to solve another problem** — mountains moved away from the title; the user liked
  them where they were. *Fix:* when a change serves another element (the poem), revert it when that element goes.

## 2. Tone and atmosphere
- **Grey mush** — every veil justified alone (haze .36 + two mist bands + desaturation .7 + blur + halo) killed
  the range. *Fix:* haze .24, mist .3, saturation .85, real blacks near, paper-white moon.
- **Moon lost** — grey on grey, neon orange rim. *Fix:* 烘云托月: bare paper disc, wash ring around it.
- **Striped sky** — horizontally stretched fbm clouds (x·.0025, y·.011) read as brushed metal. *Fix:* isotropic
  blotchy cloud washes with definite edges, most sky left as paper.
- **Scan-line water** — per-row random offsets, banded reflections, dark drags. *Fix:* paper + faint reflection
  + a few tapered ripple strokes + glints.
- **Haze band in the wrong place** — started at y 430 while the scaled pavilion reached y 350 (top tiers crisp)
  and it veiled the lower title glyphs. *Fix:* haze as a function of (x, y), masked out of the title column.
- **Mist buried the main facade** — band centred at the facade height. *Fix:* mist at the deck/water level.

## 3. Brushwork and ink
- **Flat single-colour strokes** — the biggest digital tell. *Fix:* belly + offset core (点墨), `dry` along length,
  pressed entry and thinning exit.
- **Beads** — stroke width noise sampled per point index pulsed every 3-4 px on dense strokes. *Fix:* sample by
  arc length.
- **Stitching** — broken-line gap probability per point → regular dashes. *Fix:* probability per stroke.
- **Uniform softness** — one blur for everything. *Fix:* wetness map; diffusion only where wet.
- **Gaussian blur edges** — plasticky. *Fix:* anisotropic fibre diffusion (MoXi-style) + halo + edge darkening.
- **Pen lines** — crisp even contours after "add ink lines". The user then said real painting has no pen.
  *Fix:* brush feathering on the ink layer, halo, breaks; ruled lines only for architecture.
- **Wood as a cable** — plum branch as one smooth thick stroke with a blurred halo. *Fix:* angular segments,
  side brush, 飞白 cut out, knots, straight shoots.
- **Branch "three and a half sticks", then an overgrown mass** — overcorrection both ways. *Fix:* many thin forks
  with blossoms along twigs; bounds keep it in its zone; depth by paler smaller far blossoms.
- **Flowers as cookie stamps** — perfect circles, identical. *Fix:* noisy blobs, front/side/bud kinds, black sepals.
- **Rocks drawn the Western way** — domes with spots, then faceted rocks that were too heavy for an airy picture.
  *Fix:* in this style the near plane is a reed shallow; if rocks, follow 石分三面 and keep them in the picture's tone.
- **Lollipop trees** — trunk + round crown. *Fix:* three kinds (Mi dots, umbrella pines, trunk+crown).
- **Reeds as a fence of little palms** — symmetric leaf pairs. *Fix:* clumps, lean both ways, broken stems.

## 4. Objects: grounding, occlusion, integration
- **Clip-art house** — frontal box under a mushroom roof. *Fix:* 界画 oblique projection, hip-and-gable roofs.
- **Empty walls** — *Fix:* facade vocabulary (lattice doors/windows, open lamplit bay, columns, lintel, fretwork,
  couplets, moon windows, balcony, plaque), all suggested and veiled.
- **Details hidden under the eaves** — lintel/brackets drawn at the wall top, covered by the roof overhang.
  *Fix:* start facade bands at the eave line.
- **Pine showing through the wall** — ink layer composited on top of everything. *Fix:* erase ink behind every
  front silhouette (destination-out) + opaque paper fill on the wash layer.
- **Pavilion floating** — stilts erased by the global shore fade, base buried in mist, no banks.
  *Fix:* banks, stilts to the water with reflections, deck shadow, lighter base mist.
- **Boat floating** — paper gap between hull and a separate shadow plate; reflection started lower.
  *Fix:* reflection from the hull down, dissolve the keel, no shadow plate.
- **Boat / house "stand out"** — drawn more carefully than their surroundings (dense black lines, exact fills,
  saturated colour, crisp against hazy neighbours). *Fix:* looser washes offset from lines, fewer lines,
  systemic haze, palette muting.
- **Hard waterline** — water switched on in a 6 px band, hard object mask, straight bank bottoms.
  *Fix:* noisy wide seam, objects sink gradually in the shallows, torn bank feet, seam haze.
- **Walking figure looked like a mushroom ghost / cartoon** — *Fix:* replace with a motif that tolerates tiny scale
  (孤舟蓑笠翁 fisherman in a boat), figures as silhouettes.
- **Fisherman's hat a sombrero, then a lampshade** — *Fix:* shallow cone, dark underside, small crown.

## 5. Text and accents
- **Typeset title over the art** — *Fix:* brushed glyphs in the ink layer with jitter, uneven ink, dry streaks,
  wet halo; seal with worn edges.
- **Subtitle in the water** — reads as a video caption. *Fix:* vertical inscription or none.
- **Title + poem** — "both small and big text, too heavy". *Fix:* title + one seal only.
- **Only saturated colour pulls all attention** (plum) — *Fix:* depth in the branch, keep reds to accents.

## 6. Animation and UI
- **Everything animated** (camera push, parallax, ink reveal) shimmered the stipple and fought the stillness.
  *Fix:* static painting; only water, mist, geese, petals, lamplight move.
- **CG tells in motion** — radial lantern glows, tiny petal specks, vector geese, brown vignette. *Fix:* painted
  versions (see execution §7).
- **Unrequested features** — export buttons. The user wanted the picture, not tooling. *Fix:* don't add UI.

## 7. Engine / GLSL bugs
- Reversed `smoothstep` edges (undefined behaviour on Metal). Stipple dots at zero density. Duplicate identifier.
  Stale ES modules from browser cache (`serve.py` no-store). RNG sequence shift when adding `r()` calls
  (branch reshaped). Emulated viewport screenshots cropping the page (use the real pane size). Float readback
  needs `EXT_color_buffer_float`. A Python patch that fails halfway writes nothing — re-run it complete.

## 7b. From the first test on a new subject (rain market, weaker model)
- **Ladder composition** — street straight down the middle, two mirrored rows of equal roof blocks, empty grey
  margins. *Cause:* the skill suggested "generate roof blocks procedurally"; the no-fence rule was written for
  mountains only; critique polished details. *Fix:* anti-CG laws for every subject, notan gate, top-down critique.
- **Roofs without houses** — barcode hatching on rectangles, no walls. *Fix:* structure note; wall + roof + openings.
- **Crowd as pebbles, umbrellas as pies** — one motif multiplied before it worked. *Fix:* motif study first.

- **Bamboo as lens dabs and starbursts** (minimal example, first tries) — leaves drawn as symmetric short
  blobs, then as needles radiating from one point, then as tight tassels. *Fix (from real 墨竹):* one stroke per
  leaf, thin entry, widest near 15%, holding width then a long sharp tail, width ~15-19% of length, nearly flat
  dark ink; groups of 3-4 splayed like fingers (~.5 rad apart) leaving the twig at slightly different points,
  many groups along the twigs; culms as wide grey side-brush segments with pooled edges, 飞白 and paper gaps at
  the nodes. Looking at three real paintings fixed in one round what parameter tweaking did not.
  Second round (user: "still not bamboo"): **scale** was the real error — thin culms and short leaves in an empty
  sheet. Real 墨竹 fills the leaf: culm ≈ 8-10% of the sheet width, leaves ≈ ¼ of it, culms cropped by the edges.
  Also: a strong side-brush core made culms look like striped pipes (keep culms nearly flat grey, dry streaks),
  and leaves starting from one point merged into a black hub (start them a short stalk apart, thin entry).
  Third round (user: "the streaks are the main thing"): 飞白 faked by cutting 2-4 white lines out of a flat
  fill read as scratches. A hairy-brush model fixed it, after three more visible failures at zoom: all hairs
  breaking at the end = a broom (only weak hairs dry, the turn at the node closes the stroke); hairs drawn in
  short pieces = pixel-stair ends (draw continuous tapered runs); runs split at equal lengths = horizontal bands
  (no splits, ink varies by a gradient along each hair).
  Fourth round (user: "a hair sticks out, and that empty space"): the node was a white band of paper and the
  twig started at the culm's axis and crossed it as a hairline. *Fix (real 墨竹):* segments meet; the node is two
  uneven dark touches across the joint (never a closed ring — that reads as a pipe washer); the ends of each
  segment are solid, the 飞白 lives in the middle; twigs leave from the culm's EDGE at a node, with a knot, thick at
  the base, tapering — they never cross the culm.

- **Ma Yuan study (tage): forms as cut-out cardboard** — slabs filled with one flat glaze + outline + texture
  stamps read as illustration. *Fix:* model the form with tone (渲染): a gradient from a near-black shadow edge into
  the lit face, laid in soft overlapping bands (hard bands show seams), and write the shadow face DENSELY in dry
  brush so the bristle gaps become the rock's light streaks. Value range matters more than detail.
- **Near things veiled as if far** — branches, strands and leaves outside the trunk's depth stroke got the air's
  depth, so the shader hazed and misted them away; too-wide depth strokes then made halos. *Fix:* record depth
  for every near mark at about its own width.
- **Base dissolved but depth kept** — the mist drew rectangles under the peaks. *Fix:* dissolving a form also
  fades its depth back to air.

- **Near rocks, four failed constructions before the study** — stacked cardboard slabs with stamps; then
  Catmull-Rom over 8 points = smooth eggs; then strokes radiating inward from the top = a scallop shell. *Fix
  (from a crop of Ma Yuan's own rocks):* faceted silhouette with only the corners softened; the form written
  by LONG dry-brush sweeps that start at the upper contour and all run the SAME way down the slope, dark at the
  root, covering the whole face; a soft dark rim inside the contour; a dark cleft; the base sunk in a ground
  shadow. Compare crops at the same size — full-frame comparison hid all of this.
- **Floating trees and grass** — a grove whose trunks end in mist, reeds growing out of bare paper. *Fix:* a hill
  under the grove dissolving into the mist with undergrowth at the roots; a bank from the rocks to the path.

- **"It got worse"** — fixing one element by enlarging it overran the composition (rocks to half the sheet), a new
  element placed on top of the figures turned their hats into peeking "eyes", and depth strokes wider than the
  twig made black silhouettes of the pines behind. *Rule:* after every local fix, re-check the full frame at
  thumbnail size and the user's own viewport; never place a new element over the focal figures; depth marks
  exactly as wide as the mark.

- **Rock planes, three more false words in the study** — random short chops = fish scales; tapered chops
  hanging from a straight break = icicles / a thatched roof. *Fix:* build the tone of a plane from broad WET
  strokes on the wash layer (the diffusion softens them; no canvas blur), starting at different heights and
  running down the plane's fall; add only some dry side-brush chops (kit hairy brush, `tipSide` ±1) for grain;
  mark the plane break with short broken touches, never a ruled lid line. A side-held brush has a dark crisp tip
  edge and a dry heel — `hairyStroke` now models that with `tipSide`.
- **A stroke through the whole rock** — filtering a closed outline (keep the upper points) made far-apart points
  neighbours; the contour stroke bridged them. *Rule:* after filtering a polyline, split it where consecutive
  points are not adjacent.

- **Hats that look at you** — a brim stroke over a dark head dot reads as an eyebrow over an eye; a row of dancers
  became a row of eyes. *Fix:* a hat is one solid low cone hiding the head. The same goes for any "line over a
  dot" motif: check it for the eye reading.
- **Pine crowns as umbrellas** — separate ink discs on sticks. *Fix:* crowns as soft dark masses from short wet
  strokes on the wash layer that merge, needles only on the upper rim, masses overlapping along each branch.

- **"The grove floats" — and each fix made it worse** — a pale hill under it (trees standing on a strip), then a
  dark undergrowth band (a floating saucer: a hard depth edge printed a hard edge in the mist). *Fix (as Ma Yuan
  does):* nothing under the mid-distance grove; its lower trunks fade out and the mist rises over its foot, so the
  trees come up out of the mist. "Grounding" a thing seen across mist means hiding its base, not adding ground.
  Depth edges must be soft — any hard edge in the depth map shows as a hard edge in the mist.

- **Tree joints** — a trunk ending in a flat cut with boughs starting above it (floating), bough strokes starting
  at full width (square blocks), a tonal under-layer that did not narrow with the trunk (a pale ghost block).
  *Fix:* the trunk thins out into its boughs; every bough starts at the trunk's EDGE, narrow, and swells; every
  layer of a form follows the same profile.
- **Mid-distance grove cut by one straight line** — fading the lower trunks with a straight gradient made every
  tree end at the same height. *Fix:* an uneven, soft fade line (each tree a little different) and a faint soft
  tone under the crowns, not a ground.

## 8. Process lessons
- **Research the canon before inventing.** Composition (Guo Xi, Xie He) and technique (MoXi, Curtis, Bousseau,
  Lingdong Huang's shan-shui-inf) answered questions that trial-and-error kept getting wrong.
- **Inspect at zoom every round.** Beads, stitching, floating boats, halos, stray dots — all invisible full-frame.
- **Criticise yourself before the user does.** A harsh checklist pass after each change caught most issues;
  skipping it meant the user found them.
- **Fix systemically, not locally.** Haze, palette and softness as global rules keep new objects consistent.
- **Beware overcorrection.** Sparse → overgrown branch, grey → empty, rocks → reeds: change one thing, look, then
  the next.
- **Keep what the user likes.** When fixing A, don't move B they praised.
- **Painting over tooling.** Deliver the picture; no export/UI unless asked; keep the project in a real folder
  under git from the start.

### Trees built from a remembered idea instead of the reference crop
- **Symptom:** the near willow went through plank, black blob "pollard head" (read as smiley, heart, lollipop,
  pipe joint), then a pale star — each fix tuned the wrong construction.
- **Cause:** the motif was built from a verbal idea ("pollarded willow") and compared at full-frame scale. A crop
  of the master at 3× showed a different structure: a long trunk leaning in from the edge with a crook, a knot
  where it forks into two stems leaving the frame, one long arching branch hung with fine strands.
- **Fix:** crop the master's motif large (`sips -c` works without PIL) before building it, and copy its
  *construction*, not its silhouette. Limbs are brushed (pale base + long wet strokes along the limb, one dry
  side-brush stroke on the shadow edge), never a flat fill with dashes on top (= birch/bamboo/plastic tube).
  Joints: draw the trunk into the knot, stems over it; no pale ring or outlined scrape at a joint (= pipe, eye).
  A bare fork ending in two points reads as a slingshot — end stems in thin shoots.
- **Forks:** a limb growing out of another must not occlude (paint paper under itself) and must paint only
  *outside* its parent (clip with the parent path, even-odd). Otherwise its end cap lies across the parent as a
  seam or step, and any "knot" dab blurred over the join reads as a smudge. The join is the parent's own edge.

### Branching wood painted piece by piece
- **Symptom:** however the canvas limbs were stacked or clipped, the fork showed a seam or step and a branch
  floated beside the stem.
- **Cause:** each limb was a separate shape painted on its own; a joint between separate shapes is always a seam.
- **Fix:** describe the tree as a skeleton and render the wood in a shader as one SDF with smooth union
  (`kit/glsl/limbs.glsl`, used by `examples/tage/shaders/tree.frag`): tone from the cross position (shadow side),
  bark/dry brush from noise in the limb's own frame (arc length × radii), contour from the field's edge, ragged
  silhouette from noise on the distance. Fine strands stay brush strokes on the canvas.
- **Trap:** texture coordinates from `dot(p, dir)` make rings wherever the limb turns (the projection jumps by
  |p|·Δangle); store arc length in the skeleton and continue it from the parent at each joint.
- **Skeleton field traps (limbs.glsl), each seen on the willow:**
  - frame blending past a segment's end: a thick short segment's round cap contains points far beyond it and
    gives them a wrong cross coordinate → spots at every joint. Weight a segment only alongside it.
  - smooth union between consecutive segments of one chain swells every joint → bamboo nodes. Fuse only where a
    limb grows out of another (the `fuse` flag); plain min along a chain.
  - per-segment values (a dark knot) averaged with a thick neighbour wash out → take the max over containing segments.
  - anything the shader draws must also write depth on the canvas, or the mist pass veils it as if it were far.
  - shading a limb as a cylinder (smooth gradient across) reads as CG. Paint it: a wet dark stroke with a ragged
    inner edge on the shadow side, silk with dry bristle streaks in the middle, a broken contour; thin limbs as
    plain dark lines (texture on a thin limb reads as nodes).
  - the structure came from a crop of the master at full height, not from memory: the first two willows (a Y fork,
    a "head" ball) were both wrong constructions.
- **A shape composited AFTER the paint pass reads as a vector cut-out** (the willow from tree.frag: a "mask" head,
  black pipes). Everything that should look painted must go into the wash/ink canvases BEFORE diffusion and the
  paint pass, like every other mark. The willow is now brushwork again (washes + dry side-brush + a dark knotty head
  of fused lumps whose outer arcs only are pressed), and the joints are hidden the painter's way: limb strokes start
  inside the dark head. `kit/glsl/limbs.glsl` stays for silhouettes/masks that feed the layers, never as a final overlay.

### Willow: a stick with three hairs
- **Symptom:** straight bare wands and a few straight hanging hairs — "a stick with hairs, not a tree".
- **Cause:** the crown was built from a description, not from how willows are painted; and the hairs were
  straight lines dropped from points on a line.
- **Fix (from willow paintings and photos):** limbs rise and ARCH OVER, crooked (never a clean arc), painted with a
  loaded brush, tapering; each carries many short angular branchlets, mostly upward (鹿角); strands fall from twig
  tips in BUNCHES along a thrown-stone curve (out and a little up along the twig, then over and down), lengths and
  tones varied. Limbs start inside the dark head, branchlets with a press from their parent — joints hide in ink.
  No width ripple or strong dry brush on thick limbs: cross-bands read as bamboo nodes.
- **Also:** read a complaint with its screenshot carefully — the screenshot may be the GOOD example ("why are these
  fine and that is bad"). Ask or re-read before rewriting what the user liked.
- **Trunk = the limbs' brush, thicker.** When the crown (brush strokes) looked right but the trunk (a filled
  polygon + dashes) and the head (outlined circles) looked like a plank and a cartoon flower, the cause was two
  languages in one tree. Fix: the trunk is several overlapping loaded strokes along its axis, full length with soft
  ends (blunt starts mid-trunk read as steps), the shadow lanes darker, the lit lanes drier; its edge is the brush's
  own (paper under a band narrower than the strokes only hides what is behind); the pollard top is a few short thick
  strokes toward each limb, and the limbs start pressed inside them — ink over ink, no shape, no outline.
- **A fork is written in one movement.** Separate joint pieces (blocks from one point to each limb) read as a
  pinched neck or bandages; strokes that start mid-trunk show blunt tongues. Write the fork strokes DOWNWARD: they
  enter each limb thin, run loaded through the joint and dry out down the trunk (fade + dryness), ending in
  dissolving streaks; the outer limbs take the trunk's own contours. The trunk is thickest at the fork, its
  silhouette uneven (swellings, a knot bulge), contours in pressed segments (heavy shadow side, broken lit side),
  bark as SHORT dry strokes; a knot is a slanting scar (a ring with a dot is an eye).
- **Depth caps show in the mist.** A thick `depthLine` with round caps sticking out past an object is drawn by the
  mist pass as a dome; write depth as the object's exact shape. And no depth at all lets the mist wash it out.
- **Simplest wins: the trunk = the limb recipe, thicker.** Every elaborate trunk (contours + bark + knots + fork
  pieces) read worse than the crown the user liked. What worked: the SAME hairyStroke recipe as the limbs at the
  trunk's width, small crooks and a gentle swell, one narrower stroke of the same recipe written downward from the
  fork (start buried, ending dry); the limbs' strokes start ~28 units inside the trunk. Depth must follow ALL the
  ink (including the hidden start of a limb) or the mist veils it into a white gap at the joint.
- **A wide stroke on the crisp ink layer reads digital** at any recipe: one long stroke = rope/plank, short side
  strokes = stacked boards or hexagon patches (square/pointed polygon ends, a pressed dark entry). The mass of a
  thick trunk is WET INK ON THE WASH LAYER (several dark wet strokes side by side, merged by diffusion — the way
  the rocks get their tone); the ink layer gets only NARROW strokes: a contour in soft-ended overlapping
  segments (hard segment ends = saw teeth) and a few long dry streaks.
- **"The trunk is a stick" is about SHAPE, not texture.** A long even-width pole entering from the frame edge with
  limbs only at its top reads as a stick whatever the brushwork. A living trunk: its base stands on the ground with
  roots spreading; it bends (an S); its width varies strongly (flared root, a waist, swelling under the crown, a
  rounded shoulder into the fork); a thick limb leaves mid-trunk (cropped by the frame is fine). Fix the shape first.
  Small glued-on stubs read as labels — leave them out.
- **Leonardo's rule: limbs carry the trunk's thickness.** A thick trunk splitting straight into thin branches is
  impossible (the user had to repeat this many times). The main limbs' cross-sections add up to the trunk's
  (d² ≈ Σ dᵢ²): a 46-wide trunk gives limbs of ~18–26 at their base, which then thin gradually; the trunk does NOT
  narrow into the fork. Paint the thick stretch of a limb like the trunk (wet mass + narrow strokes), ending a
  little narrower than the limb's own stroke so there is no step. Check widths at every fork, at every scale.
- **The whole tree in the limbs' language.** What finally worked for the willow: the trunk is the main limbs'
  own strokes running down to the roots as a twisting bundle (no filled trunk), roots are limb strokes too, and
  every child starts at ~.85 of its parent's width where it leaves, thinning to a fine tip (the data-tree rule,
  technique-sources.md). Draw the bundle last so it covers the starts of other strokes on the trunk.
- **One tree, one body** (what finally read as a tree): grow the willow as ONE graph (`examples/tage/scene/willow.js`)
  — the trunk flows into the main arching limb as one chain, branches leave along the WHOLE trunk and every limb,
  twigs on branches; draw every chain as a tapered shape with an uneven edge and fill them all as ONE path (solid
  boneless ink, wet underneath, bristle texture and flying white clipped inside). A bundle of separate strokes reads
  as cables; branches only at the top read as a broom on a stick. A branch's starting width is min(parent width,
  ~.09 × its length): the data-tree rule alone gives short fat thorns.
