---
name: ink-wash-painting
description: Create high-quality Chinese ink-wash paintings (水墨 / 山水 / guohua / sumi-e style) of ANY subject as live browser art — landscapes, but also cities, markets, architecture close-ups (pagodas, temples), figures, animals, plants, weather, even modern subjects — rendered procedurally (WebGL2 shaders + Canvas brushwork) so it reads as hand-painted with brush and ink on xuan paper, with light animation. Use this skill whenever the user wants something "in Chinese ink style", "水墨风", sumi-e, a shanshui landscape, a Mid-Autumn / Spring Festival / Qingming scene, or asks to recreate an ink-style image or video frame in code — from a text description OR a reference image — or asks for a shader / generative / canvas version of a Chinese painting.
---

# Ink-wash painting (水墨) of any subject, in the browser

You are the painter. No skill can contain a recipe for every subject, so this one teaches you to work the way a
painter works: **study** real paintings and the real thing, **translate** the subject into the language of brush
and ink, **decide** the picture's dials (void, density, darkness, wetness) from its mood, **sketch** the
composition in tone before any detail, **try out** each motif alone before multiplying it, and **criticise
top-down** until a painter would not object. The material (paper, ink, water, brush) is rendered by principles
in `references/materials.md` and `brush.md` and implemented as a kit of composable modules (`kit/`); three
examples (`reference/`, `examples/rain-market`, `examples/minimal-bamboo`) are three different assemblies of it —
read them for technique, never copy their scenes.

## Workflow (each step is a gate: don't go on while it fails)

### 1. Study — `references/research.md`
Search the web (Chinese and English queries; museum open-access collections) for 2-4 master works close to the
subject and mood, look at the images, and write a study note for each: skeleton, void, tone map, mark inventory,
**how the hard part is simplified**, edges, what to take. For every unfamiliar motif also look at the real thing
(structure note). This replaces recipes: you derive the recipe from real paintings each time. No web access →
say so and work from the master list by memory.

### 2. Translate and decide — `references/seeing.md`, `references/judgement.md`
Five questions: spirit (神) in one phrase; what is painted (实) and what stays paper (虚); structure and the mark
family for each part; depth planes; format and viewpoint. Then set the dials with a reason each: void %, ink
darkness, wetness, mark density, colour accents, motion. A lonely lake may be 85% paper, a rain market 25% —
decide, don't default. A **photo** reference is a brief in picture form: recompose freely, never trace or filter it (`seeing.md` D).
Don't reach for mountains, moon and water unless the subject calls for them.

### 3. Compose — `references/composition.md`
One host, supporting groups, a designed void on one side, a diagonal or curve that leads the eye, every region
of the sheet with a job, edges treated (near things cropped, far things fading). No central axis, no symmetry,
no rows of equal units.

### 4. Assemble the renderer from kit modules, gate on a notan sketch — `references/renderer.md`
```bash
bash <skill>/scripts/new-painting.sh <target-folder>   # copies kit/: runtime, GLSL modules, diffusion pass, brush lib, server
```
The kit is mechanics and materials only — no pipeline, no scene, no default look: every look parameter is an
argument you choose, and the runtime refuses to draw with a forgotten uniform. You write the scene field, the
layers and their wetness, the depth model, and the paint pass as your own composition of modules. Read
`examples/minimal-bamboo` (smallest build) and the module catalogue in `renderer.md` §1.
Permanent folder the user agreed to, `git init`, commit per step. First render the planned masses as 3-4 flat
tones only (notan mode) and pass the composition checks at thumbnail size. Then the material sheet (paper,
diffusion, filter, test strokes) at zoom. Organise everything by **depth**, not by screen bands.

### 5. Motif studies, then assemble — `references/brush.md` (trees: `references/trees.md`)
Before building a motif, crop the master's version LARGE (3×) and write how it is constructed — a verbal idea
("a pollarded willow") is not a construction. Draw each new motif large and alone (study mode), from correct
structure, compare side by side with the crop, iterate until it looks painted; then give it variation (size,
tone, angle, completeness) and only then multiply it into the scene in clusters with gaps. Paint in the
painter's order: washes → structure strokes → texture → dots → accents. Structure gates, every motif:
- **Shape before texture.** "It's a stick / plank / blob" is a construction problem; no brushwork fixes it.
- **Joints.** No seams, rings, necks, gaps or blurred dabs where parts meet; grow parts out of each other or
  fill them as one shape; thickness continuous at every fork (Leonardo); a collar where a branch leaves.
- **Contact.** Things grow out of / rest in the ground (roots, grass, contact strokes, a soft shadow) — no flat cuts.
- **Character.** The species/kind beats generic rules (a willow is not an oak; `trees.md` §3).
- **Everything through the pipeline.** Marks go into the wash/ink canvases before diffusion and the paint pass;
  an overlay after it reads as vector. Wide strokes on the crisp ink layer read digital — build mass as wet ink
  on the wash layer, keep the ink layer for narrow strokes. Write depth along ALL ink.

### 6. Critique top-down, at least two full rounds — `references/critique.md`
Composition → tone/void → structure → anti-CG → marks → motion. Thumbnail, blur, one-second and side-by-side
tests; zoom for marks; run the false-word test (`pitfalls.md` §8: eye, slingshot, rope, plank, broom, nodes…).
Never polish details while a higher level fails. If an element fails twice, rebuild it from research instead of
tweaking numbers. When the user critiques with a screenshot, check whether the screenshot is the BAD part or the
good example before changing anything; change one thing, then look.

### 7. Deliver
What was painted and why (in painting terms, citing what you took from which master), the dials you chose, what
moves, how to run it, and honestly what is still weak, ordered by level.

## Principles that decide quality
- **Study before inventing.** Every good decision in an unfamiliar subject comes from a real painting or the real thing.
- **Translate, don't illustrate.** Paint the spirit with few, right marks; omit what does not serve it.
- **Decide the dials from the mood.** Void, density, darkness, wetness are choices, not constants.
- **Composition first, detail last.** A bad thumbnail cannot be saved by good brushwork.
- **Structure right, rendering loose.** "Unnatural" usually means wrong construction, not loose brushwork.
  Check scale against the sheet first, then how parts join (edges, joints), then the stroke.
- **Model the brush, not the mark.** Dry brush is many bristles running dry (`kit/brush/hairy.js`), not white
  lines cut out of a fill.
- **Nothing identical, nothing evenly spaced, nothing symmetric** — repetition and regularity are what reveal
  the computer (`judgement.md` §5).
- **Paper is the light; tone follows depth; sharp and soft together; a brush, not a pen or a fill.**
- **Nothing floats, nothing stands out; the host gets the most considered marks, the rest is summarised.**
- **Animation obeys the painting.** A reveal from blank paper (ink running into wet paper, inscription last), then
  slow, few, painted motion; no glows, specks, vignettes, camera moves or UI unless asked (`references/animation.md`).

## Honest limits — tell the user when they apply
- Photographic detail, cast shadows, exact perspective and heavy full colour are outside the style (full colour
  belongs to 工笔 / 青绿). Offer the painterly equivalent.
- Close-up faces, hands and complex anatomy are hard to make convincing procedurally; keep figures small or in
  a sketchy 减笔 manner unless the user accepts the risk.
- Motifs up close (figures, tiles) stay weaker than the composition: procedural brushwork is limited by the
  motif's construction, not by parameters. Keep them small, summarised or hidden in mist when possible.
- Quality depends on your visual judgement in the study and critique steps; without image viewing or web
  access, say that the result could not be checked against references.
- Needs WebGL2 + `EXT_color_buffer_float` (half-float diffusion).

## References
- `references/research.md` — how to study: queries, open-access sources, masters by problem solved, study and structure notes.
- `references/motif-studies.md` — study notes on how shan-shui-inf (MIT) reduces pavilions/pagodas, boats, figures, trees, rocks, mountain texture, water and repeats to a few marks. Read when a motif is new; derive your own construction, don't copy numbers. (No bridge, umbrella, crowd or market there.)
- `references/painting-howto.md` — how painters simplify roofs, white walls, umbrellas, crowds, stalls, bridges, figures, town/street composition, rain and mist. Each claim is tagged OPENED / SNIPPET / MEMORY / DERIVED; umbrellas, crowds and stalls are hypotheses to test against a render.
- `references/technique-sources.md` — ranked technical sources worth borrowing (layered-polygon watercolor, anisotropic Kuwahara, curl noise, open-access museum APIs for reference images), with verification status and a skip list.
- `references/seeing.md` — translation method, mark vocabulary, subject families, worked translations.
- `references/judgement.md` — the dials (void, darkness, wetness, density), jobs of sheet regions, structure, anti-CG laws, hierarchy of finish.
- `references/composition.md` — the canon (six principles, three distances, host/guest, 虚实, 留白, 藏露, 墨分五色, 界画, writing and seals, colour) and formats.
- `references/materials.md` — paper, water, ink, pigment → shader techniques with code and working ranges.
- `references/brush.md` — the stroke atom and stroke families as algorithms; structure → strokes.
- `references/renderer.md` — pipeline design, depth organisation, layers/occlusion, reusable files, gated build order (notan, material sheet, motif studies), GLSL gotchas.
- `references/critique.md` — top-down critique with gates and concrete questions.
- `references/trees.md` — trees of any species: study, universal structure (one growth graph, continuous thickness, gravity, joints, base), species character table, painting as one body, checks. `kit/brush/tree.js` is the mechanics.
- `references/animation.md` — the reveal (kit `inktime.js` + `reveal.glsl`) with every lesson from building it; quiet motion after it (mist, rain, steam); how to verify frames.
- `references/pitfalls.md` — rules learned from every real failure (process, composition, depth, trees, joints, brush, false words, reveal animation, tooling).
- `references/reference-implementation.md`, `reference-internals.md` — how `reference/` paints its one scene.
- `kit/` — runtime, GLSL modules, diffusion pass, brush library (catalogue: `renderer.md` §1).
