# Materials → shader: why ink on xuan looks the way it does, and how to render it

These effects are subject-agnostic: every painting needs them, whatever is painted. Implement them in your own
pipeline from the kit modules (`kit/passes/diffuse.frag`, `kit/glsl/wash.glsl`, `ink.glsl`, `paper.glsl` — catalogue in `renderer.md` §1). Each effect is
listed with the physics, the visual signature, the rendering technique, and the failure if you skip or overdo it.

## Contents
1. The paper (宣纸)
2. Water and wetness (干湿)
3. Ink and its five tones (墨分五色)
4. Pigment behaviour in washes
5. Brush ink laid on top
6. Global unifiers (palette, ageing)
7. Minimal pipeline that gets all of this
8. Tuning ranges that worked

---

## 1. Paper
- **Physics:** absorbent mulberry/bark fibres, unevenly distributed; warm ivory, ages warmer at edges.
- **Signature:** faint long fibres visible in flat areas; pigment settles *beside* fibres; slight uneven tone.
- **Render:** base colour ≈ `vec3(.942,.918,.866)`. A slowly turning fibre direction `ang = fbm(p*.018)*9.42`;
  in rotated coords `q`, thin ridges `pow(1-abs(2*noise(q*vec2(.05,1.6))-1), 18)` lighten, a second set darkens
  pigment slightly (only where there is pigment). Low-frequency ±1.5% tone variation.
- **Fail:** pure white or flat cream background → "digital canvas". Visible tiling or high-frequency noise → grain filter.

## 2. Water and wetness
- **Physics:** ink spreads only where the paper is wet; spreading follows fibres (anisotropic), dry strokes keep
  sharp edges. This contrast — sharp and soft in one picture — is the core of the look.
- **Render:** every mark writes a **wetness** value alongside its colour (MRT second target or a separate canvas):
  dry texture strokes .2-.35, washes .5-1, mist 1, bare paper low. Then run a diffusion step N times (≈36) on
  half-float targets: for 8 neighbours, weight = fibre alignment `mix(.2,1,pow(|dot(d,fdir)|,3))` × fibre
  permeability streaks × `min(wet_here, wet_there)`; `c += .11 * Σ w (c_n - c)`.
- **Fail:** one global blur → plastic, "uniformly soft". No diffusion → vector edges. 8-bit targets → diffusion
  quantises away (use `EXT_color_buffer_float` + RGBA16F).

## 3. Ink tones
- **Physics:** one stick of carbon ink diluted to five tones — 焦 charred, 浓 dark, 重 heavy, 淡 light, 清 clear —
  and loaded unevenly into one brush (dark tip, pale belly).
- **Render:** strokes are never one flat colour (see `brush.md`). Tone is the depth cue: near plane has 焦/浓,
  far only 淡/清 with a bluish shift `mix(vec3(.08,.08,.09), vec3(.52,.58,.65), depth)`.
- **Fail:** mid-grey everywhere (stacked veils) → "grey mush". Charred black in the far plane → flat stage set.

## 4. Pigment in washes (watercolor behaviour)
- **Edge darkening:** pigment migrates to the drying edge of a wash. Bousseau's model
  `C' = C - (C - C²)(d - 1)` with density `d = 1 + k·max(0, lum(blurWide) - lum(C))` darkens the inside of every
  edge. k ≈ 1.8.
- **Glazes with definite edges:** real washes overlap as layers with ragged but *definite* boundaries — build
  tone as products of thresholded noise fields `smoothstep(a, a+.05, fbm(...))`, not as smooth gradients. The
  edge-darkening then pools on each boundary.
- **Granulation + turbulence:** pigment settles in the paper grain: `d *= 1 + .3*(fbm(p*.38)-.5)*(1-lum)`, plus
  low-frequency density variation ±10%.
- **晕 halo:** outside a wet dark wash, water ran farther than pigment: a faint grey fringe
  `mix(c, c*vec3(.94,.945,.955), clamp((lum(c)-lum(blurWide))*3,0,1)*wetFar*.6)`.
- **Hand wobble:** sample the wash through a small fbm offset (≈2 design units) so edges are never geometric.
- **Fail:** smooth gradients everywhere → airbrush. Striped anisotropic noise for skies → brushed metal.

## 5. Brush ink on top
- Crisp brushwork (contours, dots, text) lives on its own layer, laid over the diffused washes, lightly
  feathered: mix it with a 6-tap blur of itself at ≈.6 and add a faint grey bleed (a wider blur's alpha × .24).
  "Crisp but not vector". Hazed by depth like everything else.
- Anything in front must erase this layer behind it (destination-out) — see `renderer.md`.

## 6. Global unifiers
- One palette: desaturate everything ×0.85 except the red accents (seal, lanterns, blossoms).
- Warm ageing toward the sheet edges and in faint broad clouds (`mix(1, vec3(.985,.962,.915), age)`).
- Light comes from paper; no glows, no vignettes, no lens effects.

## 7. Minimal pipeline
```
marks (Canvas 2D or shader fields) → washColour + wetness
  → diffuse ×N (ping-pong, half-float)             [once]
  → watercolor filter + brush ink on top + paper    [once]
  → per-frame pass: only what moves (water, mist)   [every frame]
  → overlay canvas: sprites that move (birds, petals, lamp washes)
```
Everything heavy runs once at load; the painting is static. Keep animation in the last pass.

## 8. Ranges that worked (1280×720 design space, DPR ≤ 2)
Diffusion 36 steps, step .8 design units, rate .11. Filter: near blur r ≈ 1.8, far blur r ≈ 8 (16 golden-angle
taps). Edge-darkening k 1.8. Halo .6. Ink feather mix .62, bleed .24. Saturation .85. Haze of the middle plane
.2-.25 toward mist colour `vec3(.935,.93,.912)`.
