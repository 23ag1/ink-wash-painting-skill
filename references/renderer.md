# Designing the renderer for a new painting

You write the program for *this* painting by assembling **kit modules** (`kit/`). The kit contains only
mechanics and materials as separate functions — no pipeline, no pass order, no scene, and no look decisions:
every parameter that changes how the picture looks is an argument you must give (there are no defaults; the
runtime refuses to draw if a shader uniform was not set). The three examples are three *different* assemblies
of the same modules — read the one closest to your needs, don't copy its scene:
- `examples/minimal-bamboo/` — smallest complete build (~130 lines JS + 3 short shaders): album leaf, cool
  sheet, no palette muting, drifting mist.
- `examples/rain-market/` — vertical scroll, depth layer drives haze/softness, rain and steam per frame.
- `reference/` — landscape, mountains computed in a shader and read back for brushwork, river with reflection.
Both larger builds were ported onto the kit and verified pixel-identical with their original code (≤1/255 on
0.0005% of values), so the modules reproduce the tested look exactly when given the same arguments.

## 1. The kit
Start a project with `scripts/new-painting.sh <folder>` (copies `kit/`). Serve with `python3 kit/serve.py 8770`
from the project root. Shaders include modules with `#include "kit/<file>.glsl"`; local includes are relative.

### Runtime — `kit/runtime.js` (WebGL mechanics only)
`createRuntime(canvas, glOptions)` → `{ gl, float, program, texture, fromCanvas, target, draw, pingpong, read }`
- `program(url)` — fragment shader with includes expanded (each file once). Header (`#version 300 es`, highp) added.
- `texture(w, h, { type: 'rgba8' | 'rgba16f' | 'rgba32f' })`, `fromCanvas(canvas)` — straight alpha, y flipped.
- `target([tex, …])` — framebuffer (several textures = MRT, write `layout(location = i) out`).
- `draw(prog, { to, size, tex: {uName: texture}, u: {uName: value} })` — one full-screen pass; `uRes` automatic;
  **throws if any used uniform is missing**.
- `pingpong(prog, src, n, { size, type, srcName, tex, u })` — iterate a pass (diffusion).
- `read(fb, w, h, { float })` — read back (ridge data, debugging, pixel comparisons).
- `float` — whether half/float targets are available (diffusion needs them; plan a fallback or fail clearly).

### GLSL modules — `kit/glsl/`
| module | functions | what it does to the picture | leave it out when |
|---|---|---|---|
| `noise.glsl` | `hash noise fbm fbm2 lum designPos(fc,res,design) glaze(q,lo,soft)` | noise; `glaze` = wash with a ragged but definite edge (where pigment pools) | never needed by itself |
| `wash.glsl` | `handWobble(dp,freq,amp,sc,px)` | edges wobble like a hand, not a ruler | a deliberately mechanical look |
| | `gatherWash(src,wet,uvW,uv,px,sc,rot,nearR,farR)` | near/far neighbourhood of the washes (+ far wetness) | — (input for the next two) |
| | `edgeDarken(c,far,dp,k,turb,turbFreq,gran,granFreq)` | pigment pools on wash edges; density turbulence; granulation | gouache/opaque looks |
| | `washHalo(c,lcBefore,far,farWet,tint,amount)` | 晕: tinted fringe where water ran past pigment | dry paper techniques |
| `ink.glsl` | `gatherInk(lines,luv,px,sc,rot,featherR,bleedR)` | crisp ink layer + soft rings | — |
| | `inkBleed(c,s,tone,amount)` | ink bleeding faintly into damp paper | very dry/sized paper (熟宣) |
| | `inkFeather(s,feather)` | brush edge instead of vector edge | — |
| | `inkVeil(L,atmosphere,colourAmt,alphaAmt)` | aerial perspective on ink (by your depth) | no depth haze wanted |
| | `inkOver(c,L,opacity)` | lays ink on the washes | — |
| `paper.glsl` | `fibreFrame paperMottle paperFibres paperBlotch paperAge` | the sheet: tone, fibres + pigment settling, blotches, ageing tint | silk, dyed, gold-flecked or new paper — write your own sheet |
| `palette.glsl` | `redness muteExceptReds(c,sat)` | one muted palette with red accents | colour-rich pictures, 青绿 |
| `atmos.glsl` | `rainStreaks(p,dir,t,…)` `plume(p,src,scale,lean,t)` `mistDrift(p,t,freq,speed)` | per-frame rain, steam/smoke, drifting mist (coverage 0..1; you choose colour, mask, amount) | still pictures |

### Pass — `kit/passes/diffuse.frag`
Ink creeping along paper fibres where the paper is wet (simplified MoXi). Uniforms (all required): `uSrc`,
`uWet`, `uStep` (device px), `uDesignW`, `uRate` (~.11), `uFibreScale` (match `paperFibres`), `uCross` (~.2; 1 =
isotropic). Run with `rt.pingpong` ~30-40 times on `rgba16f` targets.

### Brush — `kit/brush/`
`ink.js`: `stroke blob walk div quad press inkLine brokenLine ruledLine looseWash polyPath lantern noise`;
`brush.js`: `rng smooth brush wash line`; `text.js`: `drawInscription(c, spec)` (brushed vertical title + seal;
`c = { w: washCtx, l: inkCtx }`). See `brush.md` for what each parameter means.

### What you always write yourself
The scene field shader (background, masses, glazes), what goes into which layer and how wet, the depth model,
the paint pass *composition* (which modules, in which order, with which values), mist placement, the per-frame
pass, and every motif. That is where pictures differ — the kit never decides it.

### Extending the kit
Write a new module when a picture needs a material the kit lacks (silk, gold flecks, backruns, a different
paper): one function or pass, every look parameter an argument, no scene knowledge. Verify it on a blank sheet
before using it in a scene.

## 2. Organise everything by depth, not by screen position
The reference ties haze and mist to y-bands (waterline at 540) — fine for its one composition. For a new picture
give every element a **depth d ∈ [0 near, 1 far]** and derive from it:
- tone: ink colour `mix(charred, paleBlue, d^1.2)`, max alpha falls with d;
- haze: veil toward mist colour ≈ `.25·d` for the middle plane, more for far; near plane untouched;
- detail: stroke count and line weight fall with d; far = silhouette washes only;
- wetness: far washes wetter (softer), near texture strokes dry (sharp).
Pass depth as a separate canvas (as `examples/rain-market` does) so the shaders can haze by it.
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
