---
name: ink-wash-painting
description: Create high-quality Chinese ink-wash paintings (水墨 / 山水 / guohua / sumi-e style) of ANY subject as live browser art — landscapes, but also cities, architecture close-ups (pagodas, temples), figures, animals, plants, weather, even modern subjects — rendered procedurally (WebGL2 shaders + Canvas brushwork) so it reads as hand-painted with brush and ink on xuan paper, with light animation. Use this skill whenever the user wants something "in Chinese ink style", "水墨风", sumi-e, a shanshui landscape, a Mid-Autumn / Spring Festival / Qingming scene, or asks to recreate an ink-style image or video frame in code — from a text description OR a reference image — or asks for a shader / generative / canvas version of a Chinese painting.
---

# Ink-wash painting (水墨) of any subject, in the browser

You are the painter. This skill gives you **principles** — how an ink painter sees a subject, how ink, water and
paper behave, how a brush makes marks — so you can build the right renderer for *whatever* is asked: a misty
river, a city at dawn, a towering pagoda, a cat in the rain. It is not a scene generator. A working reference
implementation (`reference/`, one Mid-Autumn river scene) shows every principle realised in code; reuse its
generic material core, never its scene.

Quality comes from four things, in this order: **translating the subject into the painter's language**,
**composition by the canon**, **material and brush that hide the computer**, and **inspection at zoom**.
The history of mistakes behind these rules is in `references/pitfalls.md`.

## Workflow

### 1. Translate the subject (before any code) — `references/seeing.md`
Answer the five questions in writing: its spirit (神) in one phrase; what is painted (实) and what stays paper
(虚); its structure and which line family carries each part (界画 / 描 / 没骨 / 皴 / 点 / wash); its depth planes
and how tone falls with depth; format and viewpoint (vertical scroll 高远, handscroll 平远, album leaf, fan).
For a reference image, read its composition, motifs, mood and accents, then translate the same way.
Resist defaulting to mountains + moon + water: use them only if the subject calls for them.

### 2. Compose — `references/composition.md`
One host (main mass or object), guests answering it, a void that leads the eye, 留白, 藏露 (mist hides bases and
whatever you cannot or should not paint), one focal point, red only for 1-3 accents, at most one text + one seal.
Sketch the layout as coordinates in the chosen design space.

### 3. Build the renderer for this painting — `references/renderer.md`
```bash
bash <skill>/scripts/new-painting.sh <target-folder>   # copies only the generic core: brush lib, text, diffusion, filter, server
```
Work in a permanent folder the user agreed to, `git init`, commit per step. Then write your own pipeline:
shader fields for continuous things (background washes, masses, mist, water), Canvas brushwork for marks,
wetness map → fibre diffusion → watercolor filter → ink layer on top → a per-frame pass only for what moves.
Organise everything by **depth** (tone, haze, detail, wetness all derive from it), not by fixed screen bands.
Read `reference/gl.js` and `reference/shaders/` for plumbing; `references/materials.md` explains every effect.

### 4. Paint the motifs: structure → strokes — `references/brush.md`
Build each object's skeleton geometrically (tiers of a tower, planes of roofs, a street curve, a pose curve), then
decorate it with strokes of the right family. Strokes carry tone inside (dark tip, pale belly), a pressed entry and
a thinning exit, drying along the length, rare irregular breaks. Level of detail by size on screen. Anything in
front erases the ink behind it. Every object ends in ground, water, mist or the sheet edge.

### 5. Render, inspect, criticise — at least two rounds — `references/critique.md`
Build order: material on a blank sheet first (check at zoom), then masses and voids (full frame), then the host
object, then the rest, motion last. After every step: reload, check the console, look at the full frame and at
3-6× zoomed crops. Run the checklist as a harsh critic, fix the top issues, repeat until a round finds nothing a
painter would object to.

### 6. Deliver
Explain what was painted and why in painting terms, what moves, how to run it, and honestly what is still weak.

## Principles that decide quality
- **Translate, don't illustrate.** A city is a rhythm of black roofs on white paper; a pagoda is a stack of dark
  eave bands rising into cloud. Paint the spirit with few marks; omit what does not serve it.
- **Paper is the light.** Sky, water, snow, white walls, mist and lit sides are unpainted paper. Nothing glows.
- **Tone follows depth, systemically.** Near = charred ink, sharp, detailed; far = pale, bluish, soft, silhouette.
  One rule for everything, never tune one object by hand; stacked veils make grey mush.
- **Sharp and soft together (干湿).** Dry strokes keep hard edges; wet washes spread along fibres. Uniform softness
  or a global blur is the fastest way to look fake.
- **A brush, not a pen or a fill.** No flat single-colour shapes, no uniform vector outlines — except 界画 ruled
  lines for man-made structure, which are even but still veiled by depth.
- **Suggest, don't enumerate.** 40 tile strokes read as a roof; 400 read as a texture map. Mist does the rest.
- **Nothing floats; nothing stands out.** Every object is grounded or dissolved; no element is drawn sharper,
  darker, more saturated or more detailed than its neighbours at the same depth.
- **Animation obeys the painting.** Slow, few, painted marks (mist, water, birds, petals, lamplight). No glows,
  specks, vignettes, camera moves, or UI unless asked.

## Honest limits — tell the user when they apply
- Photographic detail, cast shadows, exact perspective and heavy full colour are outside the style (full colour
  belongs to 工笔 / 青绿 — a different recipe). Offer the painterly equivalent.
- Close-up faces, hands and complex anatomy are hard to make convincing procedurally; keep figures small or
  hidden in cloth, unless the user accepts a sketchier 减笔 look.
- New subjects have no ready motif code: quality depends on the translation and on critique rounds at zoom.
- Needs WebGL2 + `EXT_color_buffer_float` (half-float diffusion).

## References
- `references/seeing.md` — the translation method, the mark vocabulary, subject families (architecture, cities,
  figures, animals, plants, weather, modern subjects), worked translations (large pagoda, city, cat in rain).
- `references/composition.md` — the canon (six principles, three distances, host/guest, 虚实, 留白, 藏露, 墨分五色,
  界画, writing and seals, colour) and formats.
- `references/materials.md` — paper, water, ink, pigment → shader techniques with code and working ranges.
- `references/brush.md` — the stroke atom and stroke families as algorithms; structure → strokes.
- `references/renderer.md` — designing the pipeline for a new painting; depth organisation; layers and
  occlusion; reusable vs scene-specific files; build order; GLSL gotchas.
- `references/critique.md` — critic's checklist and zoom protocol.
- `references/pitfalls.md` — every mistake made building the reference, symptom → cause → fix.
- `references/reference-implementation.md`, `references/reference-internals.md` — how `reference/` paints its one
  scene (read for technique; don't copy the scene).
