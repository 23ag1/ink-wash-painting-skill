# Reference implementation: the Mid-Autumn river scene (a worked example, NOT a template)

> This documents `reference/`, which paints ONE picture. Read it to see how the principles were realised.
> Do not reuse its scene, motifs, coordinates or y-bands for another subject — that yields the same picture
> every time. Copyable generic parts are listed in `renderer.md` §1.

## Contents
1. Coordinate conventions
2. `scene.js` field reference (with the default Mid-Autumn scene as the worked example)
3. Component catalogue (what each module draws, footprint, knobs)
4. Recipes for motifs the catalogue lacks
5. From a reference image to a scene
6. Worked brief → scene example

---

## 1. Coordinate conventions
- Design space **1280 × 720**, origin top-left, **y down**. Rendering happens at devicePixelRatio (≤ 2).
- **Waterline y = 540** (`WATER` in `shaders/common.glsl`). Above it: sky and land; below: water (if `water: true`).
- Angles in radians, **0 = right, π/2 = down, π = left** (y is down).
- Rough bands: sky 0-330, far ranges crest 330-470, mountain feet 470-540, shoreline objects 440-560,
  open water 560-720, near ground (reed shallow) 600-720 on the left.
- Every generator takes a seed. Never add `r()` calls in the middle of an existing generator to get new
  randomness — it shifts every later value and reshapes the branch/trees. Hash positions instead.

## 2. `scene.js` fields
| field | meaning | notes / good values |
|---|---|---|
| `moon` | `{ x, y, r }` or `null` | Paper-white disc + wash ring + glints on water under `x`. Default `{860,190,60}`. Keep it clear of the title and mostly clear of the branch. |
| `water` | `true` / `false` | `false` keeps land below 540 (valleys, 高远). Then remove `banks`, `boat`, water `ripples`, and extend `masses` lower. |
| `layers` | 7 ranges far→near: `[baseY, depth, seed, 0]` | depth 1 = far (pale blue wash only) … 0 = near. Ranges with depth < .7 get brushwork (contour 勾, fibres 皴, moss 点). The last range (base 556) is the low bank at the water. |
| `masses` | 4 per range: `[cx, height, halfW_left, halfW_right]`, `[0,0,1,1]` = empty | Envelope of each mountain mass. Height is above the range's base. Keep half-widths ≳ 0.8 × height (broad shoulders); host ~200-230 tall; far ranges fill voids with pale depth. |
| `pavilion` | `{ anchor:[x,y], scale }` or `null` | Three-tier 楼阁 drawn in local coords (deck x 148-410, y 541; roof finial ≈ y 398) scaled around `anchor`. Default `{[266,541], 1.35}` spans scene x ≈ 107-460. |
| `banks` | `[{ top:[[x,y]…], water }]` | Earth banks the pavilion/trees stand on. `top` is the bank's upper edge left→right, `water` its waterline (≈ 548). |
| `trees` | `[{ kind:'pine'|'broadleaf', x, y, s, seed }]` | Base at `(x,y)`. Pine ≈ 115·s tall with flat needle pads; broadleaf ≈ 70·s with dot-leaf crowns. Pines are drawn behind the pavilion, broadleafs in front. |
| `reeds` | `[[x0, x1, y]]` | Small shoreline reed clumps (10-32 tall). |
| `boat` | `{ dx }` or `null` | Fisherman's sampan drawn at x ≈ 580-780, y ≈ 565-625, shifted by `dx`. Put it in the moon's glitter path (`dx ≈ moon.x - 650`) or on a diagonal with the pavilion. |
| `plum` | `{ seed, from, angle, length, width, shoot, bounds, avoid }` or `null` | Branch entering from an edge. `bounds.x/y` = region the twigs may grow in; `avoid = [xMin, yMin]` = title box to keep clear. Try a few seeds and keep the one whose silhouette crosses the moon's edge at most. |
| `distance` | `{ treeRows, pagoda, sail, ripples }` | `treeRows [[x0,x1,y]]` distant trees at y ≈ 536; `pagoda {layer, x}` stands on that range's crest near x; `sail [x,y]` a tiny distant sail; `ripples [[x0,x1,y,n]]` tapered water strokes. |
| `foreground` | `true` / `false` | Reed shallow (芦汀) in the lower-left corner: darkest ink, biggest scale. |
| `title` | `{ text, x, y, size, step, seal:{x,y,size,chars[4]} }` or `null` | Vertical brush title, top glyph centre at `(x,y)`, spacing `step`. One seal. |
| `geese`, `petals` | booleans | Animated overlay: a V of painted geese crossing every ~80 s; ≤ 3 petals falling from the plum bounds. |

## 3. Component catalogue
| module | draws | layer use |
|---|---|---|
| `mountains.js` | on each range's read-back ridge: 勾 contour strokes where the crest clears the mist, 披麻皴 fibre strokes down the fall line, 点苔 moss on local peaks; each range erases the ink of ranges behind it; cloud belt veils the host | ink |
| `distance.js` | 远树 distant trees (Mi dots / umbrella pines / trunk+crown), pagoda on a crest, distant sail, ripples | wash + ink |
| `shore.js` | banks: earth wash, wet dark strip, torn dissolving foot, stones, grass, moss, faint reflection | wash + ink |
| `house.js` + `facade.js` | 楼阁 pavilion: storeys, hip roofs with upturned tips, 瓦当 tile ends, 脊兽, brackets, lattice doors/windows (冰裂纹, 步步锦), open lamplit bay with figures, blinds, columns, painted lintel, 挂落, couplets, moon windows, balcony with 美人靠, plaque, potted pine, corner lanterns, stilts + reflections, deck shadow | wash + ruled ink (界画) |
| `boat.js` | sampan seen slightly from above (far/near gunwale + interior sliver), planks, transom stern, woven canopy with dark mouth, lantern, fisherman (straw cloak, 斗笠 hat, rod + line), sculling oar, reflection starting at the hull, dissolving keel | wash + ink |
| `flora.js` | pine, broadleaf (three-tone dot foliage), small reeds | wash + ink |
| `plum.js` | 红梅 branch: angular side-brush wood with 飞白, knots, moss dots, straight shoots, blossoms (front/side), buds with black sepals, depth by position hash | wash (petals) + ink |
| `foreground.js` | reed shallow: sandbar washes, clumped reeds (lean, broken stems, leaves, plumes) | wash + ink |
| `text.js` | brushed title glyphs (jitter, uneven ink, dry streaks, wet halo) + cinnabar seal | ink + wash halo |
| `main.js` | animation overlay: breathing lamp washes, geese, petals | overlay canvas |

## 4. Recipes for new motifs
Create `motif.js` exporting `drawMotif(c, …)`, add a field to `scene.js`, call it from `objects.js` at the right
place in the paint order (far → near; things in front drawn later). In the function:

1. **Occlude what is behind**: `c.l` `destination-out` fill of the silhouette, then an opaque paper fill
   (`rgb(236,232,222)`) of it on `c.w`. Otherwise ink from behind shows through (a pine through a wall).
2. **Washes on `c.w`** with `looseWash` (offset from the contour, blurred) and `blob` (noisy organic shapes).
   Washes go through fibre diffusion and the watercolor filter — they will soften and pool at edges.
3. **Ink on `c.l`**: `inkLine` for living contours (pressed entry, thinning exit), `brokenLine` for dry contours
   (1-2 breaks per stroke), `ruledLine` for architecture, `stroke` with `tip`/`dry` for side-brush wood,
   `blob` for dots and dabs. Keep line alpha 0.5-0.85; charred black only in the near plane.
4. **Ground it**: something to stand on, contact with water, a reflection that starts at the waterline.
5. **Match density and tone** to neighbours at the same depth; the shader haze does the rest.

Motif sketches:
- **Arched stone bridge** — semicircle arch in ruled line, stone courses suggested by 3-4 short lines, pale wash
  under the arch, its reflection completes the circle on the water; banks at both ends.
- **Waterfall** — leave a vertical ribbon of bare paper between two rock masses; a few dry vertical strokes at its
  edges; mist blob at the foot where it enters the water. Never paint the water white.
- **Bamboo** — culms as segmented side-brush strokes with dark nodes; leaves as tapered `blob`s in 个/介 groups,
  near leaves dark, far pale; lean all in one wind direction.
- **Willow** — trunk with bark dabs; long thin hanging strokes curving down, pale wash behind; sway = animate a
  tiny offset only if the brief wants motion.
- **Snow scene** — `moon: null` or pale sun, sky slightly greyer so paper snow reads white; mountains keep their
  contour and moss but lighter washes (snow = unpainted paper on tops); trees drawn by leaving white on dark.
- **Temple on a hill** — reuse `house.js` scaled 0.4-0.6 on a mid range crest (use ridge data like the pagoda);
  heavier haze; a stair path as a broken zig-zag line disappearing into mist.
- **Figures** — keep them tiny (≤ 25 px tall), in a boat, on a bridge, or on a balcony, as silhouettes with one
  colour accent. A walking figure with visible legs reads as a cartoon.

## 5. From a reference image to a scene
1. Grid it: note in 1280×720 coords the waterline, host mass (x, height), guest group, moon, main building,
   boat/figures, branch entry, text column.
2. List motifs and map each to a component or a recipe.
3. Note the vibe words (misty, soft, warm, lonely, festive…) and the accents (which reds).
4. Fix what breaks the canon silently (fence mountains, subtitle text, glows) — the user wants the vibe, not the
   defects. Mention what you changed and why.

## 6. Worked brief → scene (the default scene)
Brief: *Mid-Autumn night on a river (平远). Moon = protagonist, upper centre-right. Host massif left behind a
three-tier waterside pavilion; guest group right with a small pagoda on its crest; centre opens to pale far
ranges and the moon's path. Focal point: lone fisherman's sampan with a lantern in the moon's glitter path.
Near ground: reed shallow bottom-left (darkest ink). Plum branch enters top-right, crossing only the moon's edge.
Title 月满中秋 vertical at the right over pale ranges + one seal. Motion: water, mist drift, geese, petals, lamps.*
Scene: see the shipped `scene.js` — every field above is set from this brief.
