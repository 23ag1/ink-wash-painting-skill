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
