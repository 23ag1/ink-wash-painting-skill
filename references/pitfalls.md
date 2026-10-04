# Pitfalls: rules learned from real failures

Read this before any big change and again when an element keeps failing. Every rule below came from a
mistake that was actually made (mostly on the Mid-Autumn reference, the rain market and the Ma Yuan study
`examples/tage`). Format: rule — reason. "False words" (marks that read as something unintended) are collected
in one table near the end.

---

## 1. Process
- **Study before inventing.** Research the canon (Guo Xi, Xie He; MoXi, Curtis, Bousseau, Lingdong Huang's
  shan-shui-inf) and look at real paintings of the motif — three real 墨竹 fixed bamboo in one round where
  parameter tweaking had failed for many.
- **Crop the master's motif large before building it** (`sips -c` works without PIL) and copy its
  *construction*, not its silhouette — motifs built from a verbal idea ("pollarded willow", "rock") were wrong
  constructions that no tuning could save. Compare your crop and the master's at the same size; full frame hides it.
- **Motif study before multiplying** — one bad umbrella × 40 = a crowd of pebbles and pies.
- **When an element fails twice, stop tweaking: go back to the reference and rebuild the construction** —
  the willow and the near rocks each burned 4+ rounds tuning the wrong construction.
- **Simplest approach first.** Every elaborate trunk (contours + bark + knots + fork pieces) read worse than the
  plain recipe that already worked for the crown.
- **Read the complaint AND its screenshot.** The screenshot may show the GOOD example ("why are these fine and
  that is bad"); re-read or ask before rewriting what the user liked. "It is a stick" was about shape, not texture.
- **Keep what the user likes.** When fixing A, don't move B they praised; a change made to serve an element
  (a poem) is reverted when that element goes.
- **Change one thing, then look** — overcorrection both ways (sparse → overgrown, grey → empty, rocks → reeds).
- **Critique top-down, harshly, before the user does** — composition before detail: four detail rounds polished
  a ladder composition nobody had questioned.
- **Fix systemically** — haze, palette and softness as global rules keep new objects consistent.
- **Verify zoomed AND full frame** every round: beads, stitching, halos, floating boats, stray dots are invisible
  full-frame; after every local fix re-check the whole picture at thumbnail size and at the user's own viewport
  (an enlarged rock overran the composition; a new element over the figures made "eyes").
- **Screenshots lie:** right after a JS change the in-app browser may return a stale frame — take a second one.
  A hidden browser pane pauses `requestAnimationFrame` (animation frozen, screenshots stale) — keep it visible.
  Emulated viewports crop the page — use the real pane size. Inspection switches: `?s=3` (render scale),
  `?t=5` (freeze reveal), `?still` (skip reveal).
- **Painting over tooling** — no export buttons or UI unless asked; keep the project in a real folder under git.

## 2. Composition & tone
- **No fences, no ladders, for ANY subject** — evenly spaced similar peaks, or a street down the middle between
  mirrored rows of equal roof blocks, read as CG. Host/guest masses, a void, asymmetry; gate on a notan sketch.
- **Earn the void** — an interlocking edge, forms dissolving toward it with lost edges, no stray scraps in it.
- **After cleaning up, fill emptiness with depth, not objects** (pale far ranges, distant trees, a sail, a
  pagoda on a crest) — removing noise also removed fullness.
- **Don't park the subject dead centre** — put the boat in the moon's glitter path, on a diagonal with the building.
- **One text per picture** — plum + big title + poem columns + two seals + pagoda in one corner = crowded;
  title + poem = "too heavy". Title + one seal.
- **Grey mush:** every veil justified alone kills the range together (haze .36 + two mist bands + desaturation
  .7 + blur + halo). Working values: haze ~.24, mist ~.3, saturation ~.85, real blacks near, paper-white moon.
- **Value range beats detail** — a flat-glazed slab with texture stamps is cardboard; model with tone.
- **Moon: 烘云托月** — bare paper disc, wash ring around it; never grey on grey or a neon rim.
- **Sky:** isotropic blotchy cloud washes with definite edges, most sky left paper — stretched fbm
  (x·.0025, y·.011) reads as brushed metal.
- **Water:** paper + faint reflection + a few tapered ripple strokes + glints — per-row offsets read as scan lines.
- **Haze/mist placement:** haze as a function of (x, y), masked out of the title column (a y-band left top tiers
  crisp and veiled glyphs); mist at deck/water level, never across the main facade.
- **Colour:** red only on accents (plum, umbrella, seal) — the only saturated colour pulls all attention.

## 3. Depth, mist, layers & pipeline
- **Everything painted goes through the wash/ink canvases BEFORE diffusion and the paint pass.** A shape
  composited after the paint pass (an SDF tree overlay) reads as a vector cut-out. `kit/glsl/limbs.glsl` is for
  masks and silhouettes that feed the layers, never a final overlay.
- **Mass = wet ink on the wash layer; the crisp ink layer gets only narrow strokes.** Any wide stroke on the ink
  layer reads digital (rope, plank, stacked boards). Thick trunks and rock-plane tone: several broad wet strokes
  side by side, merged by diffusion — no canvas blur.
- **Softness from a wetness map, edges from anisotropic fibre diffusion** (+ halo, edge darkening) — one global
  blur is plastic, Gaussian edges are plastic.
- **Write depth for every mark at exactly its own shape/width, including hidden parts** (the start of a limb
  buried in the trunk). No depth → the mist veils near things as far (white gap at a joint, hazed leaves);
  too wide → halos and black silhouettes on things behind; round caps past the object → domes in the mist.
- **Depth edges must be soft** — a hard edge in the depth map prints a hard edge in the mist (a floating saucer).
- **Dissolving a form also fades its depth back to air** — otherwise the mist draws rectangles under peaks.
- **Grounding across mist = hiding the base, not adding ground.** A mid-distance grove gets nothing under it:
  lower trunks fade on an uneven per-tree line (a straight gradient cuts every tree at one height), mist rises
  over the feet, a faint soft tone under the crowns. A pale hill or dark undergrowth band under it floated.
- **Near things stand on something** — trees, reeds and grass growing from bare paper float: give them a bank
  or ground with undergrowth at the roots.
- **Occlusion:** each front object erases ink behind its silhouette (destination-out) and fills opaque paper on
  the wash layer — otherwise the pine shows through the wall.
- **Integrate, don't feature:** an object drawn more carefully than its neighbours (dense black lines, exact
  fills, saturated colour, crisp against haze) jumps out — looser washes offset from lines, fewer lines,
  systemic haze, muted palette.
- **Waterline:** a wide noisy seam, objects sinking gradually into the shallows, torn bank feet, seam haze —
  a 6 px switch with hard masks and straight bank bottoms is a cut.
- **Reflections start at the hull/stilts** — a gap or separate shadow plate makes the boat float.

## 4. Structure: trees
Reference: `examples/tage/scene/willow.js` (the final approach).
- **One growth graph, painted as one body.** Grow the tree as ONE graph: the trunk flows into the main limb as
  one chain, branches leave along the whole trunk and limbs, twigs on branches. Draw every chain as a tapered
  shape with an uneven edge and fill them all as ONE path: solid boneless ink, wet underneath, bristle texture
  and 飞白 clipped inside. Fine strands stay separate brush strokes.
- **Don't** (each tried and failed): a filled polygon trunk + dashes (plank; two languages in one tree with a
  brushed crown); an SDF smooth-union shader overlay (vector cut-out after the paint pass); one wide stroke
  (rope/plank); short side strokes (boards, hexagons); a bundle of separate strokes (cables); separate pieces
  for limbs or forks (seams, pinched necks, bandages).
- **Thickness continuity (Leonardo / data tree).** Cross-sections carry on: d² ≈ Σ dᵢ² (a 46-wide trunk → main
  limbs ~18–26 at their base, thinning gradually); the trunk does NOT narrow into the fork — it is thickest there.
  A thick trunk splitting into thin branches is impossible. Check widths at every fork, at every scale.
- **A branch's start width = min(parent width, ~.09 × its length)** — the data-tree rule alone gives short fat thorns.
- **Gravity sag by thickness:** bend per step ∝ distance from the branch base / (1 + thickness) — thick limbs
  hold their line, thin parts droop toward the tip; arches emerge, no hand-set curves.
- **Departures 30–50°**, narrower toward the parent's tip; branches longer low on the parent; a branch that would
  cross a big limb takes the other side or is dropped — no crossings.
- **A trunk is not a pole.** It stands on the ground: roots as chains spreading from the foot, a soft wet ground
  shadow, grass over it — never a flat cut-off bottom or a trunk entering from the frame edge with limbs only at
  its top (stick, broom on a stick). It bends (S), its width varies strongly (flared root, waist, swelling under
  the crown, rounded shoulder into the fork, a knot bulge); a thick limb may leave mid-trunk. Fix shape before texture.
- **Paint wood, don't shade it:** a cylinder gradient across a limb reads CG — wet dark shadow side with a ragged
  inner edge, dry bristle streaks in the middle, broken contour; thin limbs as plain dark lines (texture on a thin
  limb reads as nodes). No width ripple or strong dry cross-streaks on thick limbs (bamboo nodes).
- **Species character beats generic rules.** Branches all along the trunk with rising deer-antler (鹿角) twigs
  read as oak/elm. A **willow**: short, nearly bare, leaning trunk (one thin shoot at most); a pollard knuckle
  where the limbs leave together; limbs rise and arch over, crooked, never a clean arc; twigs are thin whips
  (width ~.055 × length) that barely rise and droop hard (high gravity); strands long (50–280) and dense, from the
  tips AND along the outer half of limbs, as curtains with gaps.
- **Willow strands:** bunches thrown along a stone's curve (out and a little up along the twig, then over and
  down), lengths and tones varied — straight hairs dropped from points on a line read as "a stick with hairs".
- **Ends:** stems end in thin shoots — a bare fork ending in two points is a slingshot. No small glued-on stubs.
- **Crowns:** not a round ball on a trunk (lollipop). Use kinds (Mi dots, umbrella pines, trunk + crown). Pine
  crowns are soft dark masses of short wet strokes on the wash layer that merge, overlapping along each branch,
  needles only on the upper rim — separate ink discs on sticks are umbrellas.
- **Plum:** angular segments, side brush, 飞白, knots, straight shoots — one smooth thick stroke with a halo is a
  cable. Many thin forks with blossoms along twigs, kept in its zone by bounds; depth by paler, smaller far
  blossoms (three sticks and an overgrown mass were both wrong). Blossoms: noisy blobs, front/side/bud kinds,
  black sepals — never identical circles.

## 5. Structure: rocks, mountains, figures, architecture, other motifs
**Rocks** (from a crop of Ma Yuan's own; failed first: cardboard slabs + stamps, Catmull-Rom eggs, inward-radiating
strokes = scallop shell, Western domes with spots):
- Faceted silhouette, only the corners softened; model with tone (渲染): near-black shadow edge into the lit face
  in soft overlapping bands (hard bands show seams).
- Write the form with LONG dry-brush sweeps from the upper contour, all running the same way down the slope,
  dark at the root, covering the face; the shadow face written densely so bristle gaps become light streaks.
- Plane tone from broad wet strokes on the wash layer starting at different heights; only some dry side-brush
  chops for grain (kit hairy brush, `tipSide` ±1). Random short chops = fish scales; chops hanging from a straight
  break = icicles/thatch. Mark a plane break with short broken touches, never a ruled lid line.
- A soft dark rim inside the contour, a dark cleft, the base sunk in a ground shadow.
- Keep rocks in the picture's weight — heavy faceted rocks sink an airy picture (a reed shallow may serve better);
  enlarging them to fix them overruns the composition.

**Mountains:** broad shoulders, half-width ≳ .8 × height (255 high on 130 half-width was a spike); ridged fractal
crest + lumps, asymmetric half-widths, x-only silhouette wobble — never pure symmetric triangles.

**Figures:** choose motifs that survive tiny scale (孤舟蓑笠翁 fisherman in a boat; silhouettes) — a tiny walking
figure became a mushroom ghost. A hat is one solid shallow cone with a dark underside hiding the head (not a
sombrero, lampshade, or a brim stroke over a head dot). Never place a new element over the focal figures.

**Architecture:**
- 界画 oblique projection, hip-and-gable roofs — a frontal box under a mushroom roof is clip art.
- A house is wall + roof + openings — roofs alone with barcode hatching are not houses.
- Ridges run ACROSS the street in a bird's-eye town — ridges along it read as stacked boxes.
- Facade vocabulary (lattice doors/windows, lamplit bay, columns, lintel, fretwork, couplets, moon windows,
  balcony, plaque), suggested and veiled; start facade bands at the eave line (details under the overhang vanish).
- Stilts reach the water with reflections, a deck shadow, banks to stand by, light base mist.
- No bare-paper sheen scratches on roofs — they read as white artifacts.

**Bamboo (墨竹):**
- Scale first: culm ≈ 8–10% of sheet width, leaves ≈ ¼, culms cropped by the edges — thin culms in an empty
  sheet don't read.
- Leaf = one stroke: thin entry, widest near 15%, holds, long sharp tail; width ~15–19% of length; nearly flat
  dark ink. Groups of 3–4 splayed like fingers (~.5 rad), leaving the twig a short stalk apart (one point = black
  hub), many groups along twigs. Not lens dabs, starbursts or tassels.
- Culm: nearly flat grey side-brush segments with pooled edges (a strong core = striped pipe); segment ends solid,
  飞白 in the middle; segments meet at the node, marked by two uneven dark touches (never a white band, never a
  closed ring). Twigs leave from the culm's EDGE at a node with a knot, thick at the base, tapering, never crossing it.

**Reeds:** clumps leaning both ways, broken stems — symmetric leaf pairs are a fence of palms.

**Text & seal:** brushed glyphs on the ink layer (jitter, uneven ink, dry streaks, wet halo), worn seal edges —
never typeset text over the art; no subtitle in the water (video caption); vertical inscription or none.

## 6. Joints
Joints were the most repeated failure. All of these hold:
- **A joint between separately painted shapes is always a seam or step.** Fill the parent and child as one path
  (one union). If pieces are unavoidable, a child paints only OUTSIDE its parent (clip with the parent path,
  even-odd) and never lays paper under itself — otherwise its end cap lies across the parent as a seam.
- **The join is the parent's own edge** — no outlined ring, pale ring or scrape at a joint (pipe collar, eye);
  no blurred "knot" dab over it (smudge); no separate joint pieces (pinched neck, bandages).
- **Collar:** the child's width flares over its first ~8%.
- **Thickness continuity:** start width = min(parent width, ~.09 × length); the trunk does not narrow into the
  fork; no thick trunk ending in a flat cut with boughs floating above it; boughs never start at full width
  as square blocks.
- **Every layer of a form follows the same profile** — a tonal under-layer that doesn't narrow with the trunk is
  a pale ghost block.
- **Strokes that must join start buried inside the parent** (pressed, ink over ink) — blunt starts mid-trunk show
  as steps and tongues; and the buried part still writes depth, or the mist opens a white gap.
- **A knot is a slanting scar** — a ring with a dot is an eye.
- **Along one chain, plain continuation** — swelling every segment joint makes bamboo nodes.

## 7. Brush & marks
- **No flat single-tone strokes** (the biggest digital tell): belly + offset core (点墨), dryness along the length,
  pressed entry, thinning exit.
- **Sample width noise by arc length**, not point index (beads every 3–4 px); **broken-line gaps per stroke**,
  not per point (stitching).
- **No pen:** crisp even contours read as pen; brush feathering, halo, breaks. Ruled lines only for architecture.
- **Contours in soft-ended overlapping segments** — hard segment ends make saw teeth; square or pointed polygon
  ends and a pressed dark entry on wide strokes read as boards/hexagons.
- **飞白 comes from a hairy brush, not cut-out lines** — 2–4 white lines cut from a fill read as scratches. In the
  hairy model: only weak hairs dry out (all hairs breaking = broom); hairs as continuous tapered runs (short
  pieces = pixel stairs); no equal-length splits (horizontal bands) — ink varies by a gradient along each hair.
- **A side-held brush has a dark crisp tip edge and a dry heel** — `hairyStroke` models it with `tipSide`.
- **Limbs are brushed** (pale base + long wet strokes along the limb + one dry side-brush stroke on the shadow
  edge), never a flat fill with dashes on top (birch, bamboo, plastic tube).
- **Cross-bands on a thick stroke read as bamboo nodes** — no width ripple, no strong dry cross-streaks.

## 8. False words
| Reading | Cause | Fix |
|---|---|---|
| Eyes / eyebrow | brim stroke over a head dot; ring with a dot as knot; pale ring at a joint | hat = solid cone hiding head; knot = slanting scar; no rings |
| Smiley, heart, lollipop, cartoon flower | dark blob or outlined circles as pollard head; ball crown on trunk | pollard knuckle in the limbs' own ink; crown kinds |
| Slingshot | bare fork ending in two points | end stems in thin shoots |
| Bamboo nodes | width ripple/dry cross-bands; swelling chain joints; texture on thin limbs | smooth width; fuse only at real forks; plain dark thin limbs |
| Pipe collar / washer | closed ring at a node or joint | two uneven touches; join = parent's edge |
| Plank, rope, cable | filled polygon trunk; one wide stroke; bundle of strokes | one graph filled as one path; mass on wash layer |
| Stacked boards, hexagons | short wide side strokes on the ink layer | wet mass + narrow strokes |
| Broom | all hairs breaking; branches only at the top of a pole | weak hairs dry; branches along the whole trunk |
| Stick, pole | even width, no base, limbs only on top | S-bend, varying width, roots, mid-trunk limb |
| Label | small glued-on stubs | leave them out |
| Short fat thorns | data-tree start width without length cap | min(parent, .09 × length) |
| Oak/elm (not willow) | generic rising antler twigs everywhere | willow whips, knuckle, curtains of strands |
| Pinched neck, bandages, smudge | separate fork pieces; blurred knot dab | one body; no dab |
| Pale ghost block | under-layer not following the profile | same profile for every layer |
| Cardboard / cut-out | flat glaze + outline + stamps; shape composited after paint pass | 渲染 tone; everything through the layers |
| Eggs, scallop shell | Catmull-Rom rock; strokes radiating inward | faceted silhouette; sweeps down one slope |
| Fish scales, icicles, thatch | random short chops; chops from a straight break | wet plane tone, few chops, broken plane touches |
| Umbrellas (pines) | separate ink discs on sticks | merged wet masses |
| Dome / saucer / rectangles in mist | depth caps; hard depth edge; dissolved form kept depth | exact soft depth, fade it with the form |
| Scratches | 飞白 cut as white lines; paper sheen streaks on roofs | hairy brush; no sheen scratches |
| Saw teeth | hard contour segment ends | soft overlapping ends |
| Striped pipe, black hub | strong side-brush core on culm; leaves from one point | flat grey culm; stalk-apart leaves |
| Lens dabs, starbursts, tassels | bamboo leaves as blobs / radiating needles | one tapered stroke per leaf, finger groups |
| Fence of palms | symmetric reed leaf pairs | clumps, lean, broken stems |
| Pebbles, pies | crowd/umbrellas multiplied before the motif worked | motif study first |
| Mushroom ghost, sombrero, lampshade | tiny walking figure; wrong hat profile | scale-tolerant motif; shallow cone |
| Clip art, stacked boxes, barcode | frontal box house; ridges along street; hatched roofs alone | 界画 oblique; ridges across; wall + openings |
| Brushed metal, scan lines | stretched fbm sky; per-row water offsets | blotchy isotropic washes; ripple strokes |
| Video caption | subtitle in the water | vertical inscription or none |
| Cookie stamps | identical circular blossoms | noisy varied blobs, sepals |

## 9. Animation (reveal, rain, steam, mist)
- **The painting is still.** Animate only water, mist, geese, petals, lamplight, rain, steam — camera push,
  parallax and per-frame effects shimmered the stipple and fought the stillness.
- **Painted motion, not CG:** no radial lantern glows, tiny petal specks, vector geese or vignettes.
- **Reveal = three whole states** (paper → all washes → finished) blended by ONE smooth arrival field independent
  of the objects. Per-object wash timing always produced outlines and cut-outs at object edges.
- **Arrival field:** a few BIG pools starting in scattered places and running together (low-frequency fbm) — not a
  top-to-bottom sweep, not confetti that tears objects into fragments.
- **Remap smoothly, never clamp** — clamping made plateaus that switched all at once with a hard step.
- **Deterministic blur from the mip chain** — per-pixel randomly rotated taps made shimmering sand as the radius
  changed every frame; blend sharp → blurred continuously (a hard switch drew a seam along every front).
- **No per-pixel "fibre" term from a position-dependent rotation** — it became white noise; the front dissolved
  into flickering sand. No rim outline on the front either.
- **Same wetness everywhere:** blur the washes, the finished image and the stroke-time mask by the same local
  wetness — a sharp final or sharp mask under still-wet paint showed as mottled ghost strokes/patches. Measure
  masks on a lightly smoothed mip (per-pixel paper grain flips them on and off).
- **White stripes:** ink covers thin strips of bare paper (between a slope's wash and its eave line, slope edges,
  under tile rows) that are paper-white in the washes-only state. Where the final will be darker than the washes,
  fill with a min filter of the surrounding wash (two rings, ridge gaps reach ~5 units) until the stroke arrives.
- **Lay a light atmosphere wash over the whole sheet first** — avoids glaring white holes mid-reveal; keep it pale
  (paper stays paper, no grey fog).
- **Ink follows the wash front locally** — strokes drawn in parallel, each with a random start and a time gradient
  entry → exit so the line travels (a stroke-time map); never bare roofs with white streaks waiting for ink.
- **A faint cool damp band runs just ahead of the front** (晕); the tint arrives pale and deepens to full tone.
- **Inscription and seal last**, after everything has settled — never part of the washes stage.
- **Rain and steam fade in after the reveal.** Rain: sparse tapered pale slanted streaks in two layers (near:
  longer/faster, far: fine/dense), darker than paper, lighter than wet roofs. Steam: a veil toward the mist colour
  (paper showing through) rising, leaning and swaying above its source.

## 10. Tooling
- **Every shader uniform must be set** — the kit runtime throws if a used uniform is missing.
- **GLSL:** reversed `smoothstep` edges are undefined (break on Metal); guard stipple at zero density (dots
  appear); watch duplicate identifiers.
- **Float targets:** readback and half-float diffusion need `EXT_color_buffer_float`; without it ridges and
  mountain brushwork are skipped.
- **Stale modules:** serve with no-store (`kit/serve.py`) or edited ES modules/shaders don't reload.
- **Determinism:** never insert `r()` calls into an existing sequence (later geometry, e.g. the plum branch,
  reshapes); seed each stroke from object seed + index, derive extra randomness from existing seeds.
- **Texture coordinates along a limb:** store arc length in the skeleton and continue it from the parent at each
  joint — `dot(p, dir)` jumps by |p|·Δangle where the limb turns and draws rings.
- **After filtering a polyline, split it where consecutive points are no longer adjacent** — a contour stroke
  bridged far-apart points straight through the rock.
- **Skeleton fields (`kit/glsl/limbs.glsl`, masks only):** weight a segment only alongside it (round caps of
  thick short segments give far points wrong frames → joint spots); plain min along a chain, smooth union only
  where a limb grows from another (`fuse`); take the max of per-segment values like knot darkness (averaging
  washes them out); anything drawn from it must also write depth.
- **Scripted edits:** a Python patch that fails halfway writes nothing — re-run it complete.
