# Engine internals of the reference implementation

> Since the kit refactor, `reference/` is assembled from `kit/` modules (runtime, diffusion pass, wash/ink/paper/
> palette modules, brush library); its scene field, terrain, ridge readback, objectHaze, river mist and water
> pass remain its own. Paths below that say `ink.js` mean `kit/brush/ink.js`.

> How `reference/` implements the material and brush principles (`materials.md`, `brush.md`). Coordinates, the
> waterline and `objectHaze` bands here are specific to that scene.

## Contents
1. Pipeline (render once, animate only the last pass)
2. The two object layers and occlusion
3. Brush primitives (`ink.js`) — API and why each parameter exists
4. Mountains: washes in the shader, brushwork from read-back ridges
5. Ink and paper: wetness, fibre diffusion, watercolor filter
6. Water and the waterline
7. Animation rules
8. GLSL / WebGL gotchas that cost hours

---

## 1. Pipeline
```
gl.js  ridge.frag      every range's ridge y(x) and height → readPixels (RGBA32F) → JS
JS     objects.js       paints c.w (wash) and c.l (ink) canvases at device scale, from scene.js
       scene.frag       sky/moon washes, mountain washes, mist, composites c.w  → colour + wetness (MRT)
       diffuse.frag ×36 ink creeps along paper fibres where wet (half-float ping-pong)
       paint.frag       watercolor filter, halo 晕, paper fibres/ageing, palette, ink layer on top, mist
       final.frag       EVERY FRAME: water (reflection of the painting), glints, seam haze, mist drift
main.js overlay canvas  EVERY FRAME: breathing lamp washes, geese, petals
```
The picture is static, so expensive work (36 diffusion passes, 16-tap filters) runs once at load. Keep it that way.

## 2. The two object layers and occlusion
- `c.w` **wash layer**: fills, washes, petals, foliage beds. Composited in `scene.frag` (with `objectHaze`), then
  diffused and filtered like the mountains → soft, bleeding, edge-darkened.
- `c.l` **ink layer**: contours, wood, stamens, dots, text. Laid on top in `paint.frag` after the filter, lightly
  feathered (6-tap blur mix .62 + a faint ink halo) → crisp but not vector.
- Because `c.l` is on top of everything, **anything in front must erase the ink behind it**:
  `c.l.globalCompositeOperation = 'destination-out'; c.l.fill(silhouette)`, and give it an opaque paper fill on
  `c.w`. Same for the boat hull over the fisherman's legs, ranges over farther ranges, banks, the pavilion.
- Objects' alpha is carried to the water pass (paint alpha) so things standing on the water survive it.

## 3. Brush primitives (`ink.js`)
All take a seeded `r` where randomness is needed; widths in design units.
- `stroke(g, pts, { wid, fun, noi, col, seed, tip, dry })` — filled stroke polygon.
  - `fun(t)` width profile along the stroke; `noi` 0-1 blends in width noise **sampled by arc length**
    (period ≈ 20 units). Sampling by point index made dense strokes pulse into "beads" — never do that.
  - Two passes: pale full-width belly + darker half-width core offset by `tip` (-1..1) → 点墨 tonal gradient,
    侧锋 side brush when `|tip|` ≈ .8. `dry` 0-1 fades ink along the length (heavier just after entry).
  - Hairlines (< 1.2 wide) and closed loops fall back to flat fill.
- `blob(g, x, y, { len, wid, ang, col, noi, seed, reso })` — lens-shaped organic dab with looped-noise radius
  (after Lingdong Huang's shan-shui-inf). Petals, leaves, moss dots, foliage beds, buds.
- `inkLine(g, r, pts, w, a, rgb)` — living contour: pressed entry (顿), thinning exit (提), `tip` from the seed.
- `brokenLine(g, r, pts, w, a, rgb, gap)` — contour with dry-brush breaks; `gap` ≈ expected breaks per stroke ×3,
  independent of point density (per-point gaps looked like stitching).
- `ruledLine(g, r, pts, w, a, rgb)` — 界画: even width, unbroken. For architecture only.
- `looseWash(g, r, path, color, blur)` — wash offset 1-2 units from its contour and blurred: colour never
  registers exactly with the line, which is what reads as "painted".
- `quad`, `div`, `polyPath`, `walk` (random-walk branches), `lantern`.

## 4. Mountains
- Geometry (`terrain.glsl`): each range = max of its masses' envelopes (`exp(-(|dx|/w)^1.45·2.3)`) × a ridged
  fractal crest + smooth lumps; silhouette wobble depends on x only so the ridge line has a closed form.
- Shader washes per range (`drawLayer`): mist-coloured body (occludes behind), glaze patches with definite
  ragged edges (the filter pools pigment on them), a soft wet edge, pale ochre low on near slopes, mist band at
  the foot; bodies dissolve before their base (留白). Far ranges: pale blue, washes only.
- JS brushwork (`mountains.js`) on the read-back ridges for depth < .7: contour strokes only where the crest is
  > 24 tall (not in the mist), hemp fibres (披麻皴) down the fall line (direction from the ridge slope), moss dots
  on local peaks. Bolder on nearer ranges (width 2.7→1.6, alpha .95→.55).
- Composition changes are made in `scene.js` masses, never by editing the ridge function.

## 5. Ink and paper
- **Wetness** (`gWet` → MRT target 1): sky .35 (dry paper), wash around the moon and clouds wet, mountain bodies
  wet by depth (.5 near → 1 far), crests dry (.3), mist 1, objects .6, water 0.
- **Fibre diffusion** (`diffuse.frag`, ×36, step .8 design units): 8 neighbours, weight = fibre alignment
  (fibre angle from low-freq fbm) × fibrous permeability streaks × min(wetness). Simplified MoXi: not a fluid
  solver, but it gives wet washes fibrous edges while dry strokes stay sharp. Needs half-float targets
  (8-bit loses the small increments).
- **Watercolor filter** (`paint.frag`): hand wobble, light smoothing, edge darkening via Bousseau's
  `C' = C - (C - C²)(d - 1)` with `d` from a wide blur, turbulence + granulation, 晕 halo (grey fringe just outside
  wet dark areas), paper fibres (pigment settling beside them), warm ageing toward the edges, saturation ×0.85
  except reds, mist band at the shoreline.
- **Aerial perspective**: `objectHaze(p)` veils the wash layer (scene.frag) and the ink layer (paint.frag) for
  shoreline objects (.24) and the water band (.2), masked out of the title column.

## 6. Water and the waterline (`final.frag`)
- Water = paper + faint reflection of the finished painting (7-tap vertical blur, slow wobble), glints under the
  moon, drifting surface mist, same paper texture. No stripes, no bands, no dark drags.
- The seam: water enters over a noise-wandering band (y 532-552); objects in the first ~30 units of water fade to
  40% (stilts, bank feet sink in); a thin wet haze sits on the seam. Farther out (the boat) objects are whole.
- Boats: reflection starts at the hull (mirrored hull wash + horizontal dry drags), the lower hull dissolves;
  no separate "shadow plate" (it leaves a paper gap and the boat floats).

## 7. Animation rules
Only things that move in a painting's world, slowly, drawn in the painting's language:
- water wobble and glints (`final.frag`), mist drift (fbm at ~0.006 design units/s), geese (brush wing strokes,
  individual sizes and wingbeat phases, loop ~80 s), ≤ 3 petals from the branch fading before the water,
  lamplight as a pre-painted warm wash sprite whose alpha breathes (.28 ± .1).
- Not allowed: radial glows, specks, vignettes, camera moves that shimmer the stipple, UI over the art unless
  the user asks for it.

## 8. GLSL / WebGL gotchas
- `smoothstep(e0, e1, x)` with `e0 > e1` is undefined (Metal/ANGLE returns garbage) — write `1. - smoothstep(e1, e0, x)`.
- Stipple thresholds: `smoothstep(g - soft, g + soft, 0.)` is > 0 when `g < soft` → dots where density is zero.
  Remap `g = mix(soft, 1., hash)`.
- Shader identifiers must not collide (`halo` defined twice broke compilation).
- WebGL2 + MRT: multiple `layout(location=N) out` need `gl.drawBuffers`. Reading float targets needs
  `EXT_color_buffer_float`.
- Reading the WebGL canvas: only within the same frame it was drawn (no `preserveDrawingBuffer`).
- Canvas `filter: blur(px)` is in device pixels, not affected by the transform — multiply by the scale.
- ES modules are cached aggressively: serve with `Cache-Control: no-store` (`serve.py`).
