# Designing the renderer for a new painting

You write the program for *this* painting. The reference implementation (`reference/`, a Mid-Autumn river
scene) shows one complete solution; reuse its material core, not its scene.

## 1. What is reusable as-is vs scene-specific
| file | status |
|---|---|
| `ink.js`, `brush.js` (stroke, blob, inkLine, brokenLine, ruledLine, looseWash, walk, rng, noise) | generic — copy |
| `text.js` (brushed vertical title + seal) | generic — copy |
| `serve.py` (no-cache static server) | generic — copy |
| `shaders/diffuse.frag` (fibre diffusion) | generic — copy |
| `shaders/paint.frag` (watercolor filter, ink on top, paper, ageing) | generic **except** `objectHaze` (y-bands of that scene) and the river-mist line at y≈537 — replace both with your depth-based haze/mist |
| `gl.js` | pipeline plumbing is generic (programs, half-float ping-pong, MRT); ridge readback and uniforms are scene-specific |
| `shaders/scene.frag`, `terrain.glsl`, `ridge.frag`, `final.frag` water band, `common.glsl` `WATER`/`objectHaze` | scene-specific: write your own fields |
| `mountains.js`, `house.js`, `facade.js`, `boat.js`, `plum.js`, `shore.js`, `flora.js`, `foreground.js`, `distance.js`, `scene.js`, `objects.js` | motifs of that painting — read for technique, don't paste into a different subject |

## 2. Organise everything by depth, not by screen position
The reference ties haze and mist to y-bands (waterline at 540). That only works for one composition.
Instead give every element a **depth d ∈ [0 near, 1 far]** and derive from it:
- tone: ink colour `mix(charred, paleBlue, d^1.2)`, max alpha falls with d;
- haze: veil toward mist colour ≈ `.25·d` for the middle plane, more for far; near plane untouched;
- detail: stroke count and line weight fall with d; far = silhouette washes only;
- wetness: far washes wetter (softer), near texture strokes dry (sharp).
Pass depth as a third channel (or a separate depth canvas) so the shader can haze by it.
Mist bands sit *between* planes and hide the bases of the plane behind (藏露).

## 3. GPU fields vs CPU strokes
- **Shader (continuous fields):** sky/background washes, big terrain or cloud masses, mist, water, paper,
  diffusion, filter. Things defined everywhere.
- **Canvas 2D (discrete marks):** every brush stroke, dot, contour, text. Things with a hand in them.
- When strokes must follow a shader-defined shape (e.g. texture strokes on a ridge), compute the shape in a small
  shader and read it back (`readPixels` float), or define the shape in JS and upload it — one source of truth.

## 4. Two layers and occlusion
- **Wash layer** (goes through diffusion + filter) and **ink layer** (laid on top, lightly feathered).
- Painter's order far → near. Anything in front erases ink behind it (`destination-out` fill of its silhouette on
  the ink layer) and gets an opaque paper fill on the wash layer. Otherwise far lines show through near objects.
- Objects' coverage goes into alpha so later passes (water reflection, mist) know where they are.

## 5. Grounding (nothing floats)
Every object ends in something: ground with a wash under it, water with a reflection starting at its foot, mist
that swallows its base, or the sheet edge. Decide which for each object in the brief.

## 6. Format and coordinates
Choose the design space from the format (landscape 1280×720, vertical 720×1280, square 1000×1000, wide
1600×600); keep one design space, scale to the device (DPR ≤ 2). Letterbox/pillarbox on the page, never stretch.

## 7. Animation
Render the painting once; animate only a final pass (water wobble, mist drift) and an overlay canvas (birds,
petals, lamplight as a breathing pre-painted wash). Slow, few, in the painting's own marks.

## 8. Build order that avoids rework (each step is a gate — see `critique.md`)
1. **Notan sketch**: a debug mode (e.g. `?mode=notan`) that paints only the planned masses as 3-4 flat tones
   on paper — no detail. Pass composition and tone at thumbnail size before anything else.
2. **Material sheet**: paper + filter + diffusion with a few test strokes and washes → check at zoom.
3. **Motif studies**: a mode (e.g. `?study=roof`) that draws one instance of each new motif large and alone.
   Iterate it against the references until it looks painted, then add variation (anti-CG laws) and only then
   multiply it into the scene.
4. Assemble: host → supporting groups → near plane → text/seal, re-running the thumbnail test.
5. Motion last.
Commit after each step; screenshot and critique (`critique.md`) at each.

## 8b. Placement and order rules (from the rain-market test)
- Key accents and required masses are placed deterministically, never left to the RNG (an accent landed in an
  alley and vanished). If a region has a job, put an explicit cluster there — random placement does not
  guarantee coverage.
- Paint order accounts for height: things hanging above a crowd are drawn after it; the near plane gets explicit
  late order keys (y-sorting let an off-sheet far house cover a near umbrella).
- All effect masks are soft (radial/gradient); a rectangular mask (e.g. a no-mist box around the title) shows as
  a frame.
- Blur and wetness grow with depth for every object, not only for ones tagged "far"; far/back objects only
  glaze (no opaque paper underlay — it cuts hard edges into the background washes).
- Every drawing helper wraps its work in `save()/restore()`; a leaked `globalCompositeOperation =
  'destination-out'` erased all fills once.

## 8c. Inspection tooling
- Zoom: CSS `transform` on the stage may not show in screenshots. Reliable: create the WebGL context with
  `preserveDrawingBuffer: true`, crop the canvas via `drawImage` into an overlay `<img>`, hide the scene
  (`visibility:hidden`); plus a `?s=3` debug param to render at high resolution.
- Screenshots can be stale right after reload and under viewport emulation: don't emulate sizes; if a frame
  looks unchanged, take a second screenshot before concluding.
- Before first run, grep shaders for `smoothstep(a, b, …)` with a > b.
- Batched text patches: use independent anchors and verify each replacement.

## 9. GLSL/WebGL gotchas
`smoothstep` with e0 > e1 is undefined (write `1.-smoothstep(e1,e0,x)`). Float readback needs
`EXT_color_buffer_float`. MRT needs `gl.drawBuffers`. The WebGL canvas can be read only in the frame it was
drawn. Canvas `filter: blur()` is in device pixels — multiply by scale. Serve with no-cache headers: ES modules
and shaders are cached aggressively.
