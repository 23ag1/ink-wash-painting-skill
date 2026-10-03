# Technique sources beyond MoXi / Curtis / Bousseau / shan-shui-inf

Verification note: URLs below were fetched (HTTP 200) on 2026-09-30 unless marked. "Opened" = page text read.
"Reachable only" = HTTP 200 but I did not read the body (PDF/binary). The Shadertoy, Smithsonian and ACM pages
returned 403/429 and are marked UNVERIFIED. Licences are as shown by GitHub API or the page itself.
Honest caveat: the literature on Chinese-ink GPU rendering is thin; most of the value here is in adjacent
techniques (layered washes, structure-tensor flattening, fluid/curl fields) and reference images.

## Ranked by expected visual gain per effort

### 1. Tyler Hobbs - A Guide to Simulating Watercolor Paint with Generative Art (opened)
- URL: https://tylerxhobbs.com/essays/2017/a-generative-approach-to-simulating-watercolor-paints
- Licence: essay, no code licence stated (describes an algorithm; reimplement in own code).
- Technique: stack 30-100 near-transparent (about 4% alpha) copies of a shape, each re-deformed by recursive
  midpoint displacement with per-segment variance, so edges are soft where variance is high and crisp where low;
  plus a per-layer random texture mask for opacity mottling.
- Fixes: washes that look like a flat blurred fill. Gives a hard-edge/soft-edge mix on one mountain mass or
  moon halo, and a dried-rim feel, on the Canvas 2D wash layer with no shader work.
- Cost: LOW.

### 2. Kyprianidis, Kang, Doellner - Anisotropic Kuwahara filtering (opened abstract page)
- URL: https://www.kyprianidis.com/p/pg2009  (taxonomy survey of stylisation: https://www.kyprianidis.com/p/tvcg2013)
- Licence: paper; reference code not verified. Only a GPL-3.0 TouchDesigner port was found
  (https://github.com/yeataro/TD-Anisotropic-Kuwahara) - do not copy; reimplement (it is a structure tensor plus
  sector-weighted means, about 100 lines of GLSL).
- Technique: smooth the structure tensor, then average inside elliptical sectors aligned to local feature
  direction. Flattens tone along strokes while keeping shape boundaries.
- Fixes: "noise-gradient" mountain washes that do not follow form. Run it over the wash layer (with the ridge
  direction as an override of the tensor) to get brush-flat tonal bands that follow the slope. Also the best
  route for the image-to-ink (reference photo) mode.
- Cost: MED (a two-pass shader; temporally stable so safe for the animated last pass).

### 3. Met Museum Open Access - CC0 images and API (opened; API call tested)
- URL: https://github.com/metmuseum/openaccess  ; API: https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=ink+landscape+hanging+scroll
  (returned 2311 hits; object 45420 is Kano Tanyu "Landscape in Moonlight", isPublicDomain true).
- Licence: CC0 for data and public-domain images (use the isPublicDomain flag).
- Use: reference only (never ship or copy). Pull 20-30 scroll paintings and measure: how much of the frame is bare
  paper, tonal histogram, how wide mist gaps are. Turns "looks off" into numbers for the critique step.
- Cost: LOW.

### 3b. Cleveland Museum of Art Open Access API (opened; query tested)
- URL: https://openaccess-api.clevelandart.org/  ; example: .../api/artworks/?q=landscape&department=Chinese%20Art&has_image=1
  (216 hits, each record carries share_license_status: CC0).
- Licence: CC0, stated free for commercial use. Strong Chinese ink holdings, simpler API than the Met.
- Use: same as above; filter on share_license_status.
- Cost: LOW.

### 3c. Art Institute of Chicago open access (page opened; docs at https://api.artic.edu/docs/ reachable, mention CC0)
- URL: https://www.artic.edu/open-access/open-access-images
- Licence: CC0 for public-domain works. Secondary source after the two above.

### 4. Bridson - Curl-noise for procedural fluid flow (reachable only, PDF not read)
- URL: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf
- Licence: paper (idea only).
- Technique: take the curl of a scalar noise potential to get a divergence-free velocity field. Advect mist, ink
  bleed, petals or a backrun front through it without clumping or sinks.
- Fixes: mist/ink drifting that "breathes" in place or piles up. Cheap drop-in for the existing diffuse and mist
  passes (derive from the noise already in common.glsl). Also can warp wash edges into cauliflower/backrun
  fronts when the field is used to displace the wetness boundary.
- Cost: LOW.

### 5. Paper Shaders (paper-design/shaders) (opened repo and file list)
- URL: https://github.com/paper-design/shaders  (src/shaders has paper-texture, warp, water, grain-gradient, perlin-noise)
- Licence: Apache-2.0 (confirmed via GitHub API). WebGL, no dependencies.
- Use: read paper-texture.ts as a worked example of fibre/crumple paper in one fragment shader; compare with
  our paper.frag for fibre scale and crumple normal shading. Good readable code, not ink-specific.
- Cost: LOW (reading), MED to port.

### 6. WebGL-Fluid-Simulation, Pavel Dobryakov (repo and licence opened)
- URL: https://github.com/PavelDoGreat/WebGL-Fluid-Simulation  - MIT, ~16.7k stars.
- Technique: Stam stable fluids on the GPU (advect, divergence, pressure solve, vorticity confinement) with
  half-float targets. Same extension path we already need (EXT_color_buffer_float).
- Use: a real velocity field for mist and pigment-in-water instead of noise scrolling, and a model for ping-pong
  pass structure. Caveat: it is a colourful toy; expect to drastically damp and monochrome it, and it will cost a
  few extra passes every frame.
- Cost: MED-HIGH. Only worth it if animated mist still looks fake after curl noise (item 4).

### 7. Real-time image-based Chinese ink painting rendering (Springer, Multimedia Tools and Applications) (abstract opened)
- URL: https://link.springer.com/article/10.1007/s11042-012-1126-9  (full text probably paywalled)
- Licence: paper.
- Technique (from abstract): saliency-driven abstraction, non-physical ink diffusion, combine with salient edges,
  then decolorise and advect a paper texture. All GPU.
- Use: confirms our pipeline order is sane and that a cheap non-physical diffusion is an accepted shortcut;
  the paper-texture advection step (texture follows the wet flow) is the one idea we may lack.
- Cost: MED. Low confidence: I only read the abstract.

### 8. Sumi-e stroke-based rendering PDF (reachable only; PDF authors unverified)
- URL: http://www.myeglab.com/Content/sumi_e_painting.pdf  (4.6 MB; references Strassmann 1986, Way 2001, Kang 2003)
- Used by https://github.com/DCtheTall/webgl-landscape (no licence file = all rights reserved; do not copy code).
- Technique: silhouette outline + interior tonal shading + paper effect as a real-time shader pipeline.
- Use: mostly confirms what we already do. Title and authors not verified, so cite it cautiously.
- Cost: LOW (reading).

### 9. Survey: Computational Approaches for Traditional Chinese Painting (opened abstract, arXiv 2307.14227)
- URL: https://arxiv.org/abs/2307.14227
- Licence: arXiv preprint.
- Use: bibliography to mine for ink-specific work (brush models, stroke synthesis, dataset pointers); I could not
  read the PDF body, so the specific references it contains are UNVERIFIED by me.
- Cost: LOW.

### 10. Writing on Water (arsena21/writing-on-water) (repo opened)
- URL: https://github.com/arsena21/writing-on-water  - MIT, but 2012, abandoned, WebGL1.
- Technique: old WebGL watercolor: separate glsl for accumulation, blob, normals, Sobel edges, effect pass.
- Use: only as a readable example of a blob/edge-darkening split. Code is dated and its known issues
  (colours mixing at a distance) make it a weak base.
- Cost: MED, low payoff.

### 11. Mixbox pigment mixing (opened page and repo)
- URL: https://scrtwpns.com/mixbox/  ; https://github.com/scrtwpns/mixbox
- Licence: CC BY-NC 4.0 (non-commercial; commercial needs a paid licence). The idea is Kubelka-Munk-style mixing via a
  latent pigment space; it would improve colour mixing of mineral pigments (azurite, malachite) on top of ink.
- Verdict: usable only for non-commercial work; mostly irrelevant to monochrome ink. Borderline.

## Unverified

- Shadertoy "watercolor propagation" https://www.shadertoy.com/view/mdlXW2 - 403 to fetch; existence known only from a
  search snippet (author aeva). UNVERIFIED, licence unknown (Shadertoy default is CC BY-NC-SA 3.0 unless stated).
- Smithsonian Open Access https://www.si.edu/openaccess and Freer|Sackler (asia.si.edu) - both returned 403.
  UNVERIFIED (their Chinese painting holdings are large and CC0, but I could not open them).
- Wikimedia Commons https://commons.wikimedia.org/wiki/Category:Chinese_landscape_paintings - page opened, but licences are
  per file; check each one.
- ACM pages for MoXi (doi 10.1145/1073204.1073221) returned 403. The project page http://visgraph.cse.ust.hk/MoXi/ does
  open, but the text extract contained only the header.

## Skip list

- Mixbox for this project's core look: non-commercial licence and no gain for ink.
- Full Curtis-style shallow-water watercolor GPUs and lattice-Boltzmann (MoXi proper): high cost, invisible at the
  resolution of a mostly static painting. Our anisotropic diffusion already gets most of the look.
- Commercial apps listed in survey resources (Rebelle, Fresco, Painter): not sources.
- DCtheTall/webgl-landscape and HakuWang/Ink-wash-Rendering: no licence file (HakuWang README is empty), and 3D-mesh
  based toon-outline approaches, not painted compositions.
- Kuwahara TouchDesigner port (GPL-3.0): copyleft; reimplement from the paper instead.
- Neural style transfer / diffusion-model papers on landscape painting (e.g. the arXiv hits): cannot be made deterministic
  or shader-only, and defeat the purpose of a procedural skill.
- Shadertoy generic "watercolor" shaders: mostly single-pass edge darkening and noise already covered by
  Bousseau-style paint.frag.

## Branching thickness — "data trees" (Marius Ballot, YouTube Of-s4o0EhhI; demo procedural-growing-structure.netlify.app)
OPENED (demo source read; the video itself not watched). Tree as a node graph; per node `branchSize` = longest
path to a leaf, `weight = depth / branchSize`; radius = (1 − weight)·R, so thickness falls continuously from root
to every tip. Decompose into chains: the child with the same branchSize CONTINUES the parent's chain (the trunk
flows on into the longest limb as one stroke); every other child starts a new chain AT THE PARENT NODE with the
parent's radius there, and thins faster over its shorter path. Chains are Catmull-Rom smoothed before drawing.
Take: no thickness jump at any fork; one continuous stroke per chain. (Its Fresnel/pulse shading is not for ink.)
