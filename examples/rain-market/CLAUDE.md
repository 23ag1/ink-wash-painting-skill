# 雨市 Rain Market — ink-wash vertical scroll

Procedural 水墨 painting in the browser: WebGL2 shaders (paper, diffusion, watercolor filter, rain, steam) +
Canvas 2D brushwork. Built by the ink-wash-painting skill (github.com/23ag1/ink-wash-painting-skill).
No build step, no deps. Run: `python3 serve.py 8770` → http://localhost:8770/index.html

## Architecture
- Design space 640×1280 (y down), scaled to device (DPR ≤ 2), letterboxed.
- `main.js` → `scene/*.js` draw marks into 4 canvases: wash (opaque paper, washes multiplied), wet (wetness),
  ink (crisp brush layer, straight alpha), depth (R = depth 0 near .. 1 far).
- `gl.js` pipeline: scene.frag (bg field × wash, MRT colour+wet) → diffuse.frag ×36 (half-float ping-pong)
  → paint.frag (watercolor filter, ink on top, depth haze, mist, paper) once → final.frag every frame
  (steam + rain only).
- Everything derives from depth d (tone, scale, detail, haze, wetness) — `scene/layout.js`.
- `lib/` and `shaders/diffuse.frag` are the skill's generic core (copied, not scene code).

## Conventions
- Painter's order far → near; each object erases ink behind it and fills paper under its silhouette.
- Every stroke has a seed from object seed + index; never insert rng calls into existing sequences.
- Red only on accents (red umbrella, seal); yellow lantern is the second accent.
- No UI, no export. Files < 300 lines. No tests (visual art; verified by screenshots + critique checklist).

## Brief (five questions, seeing.md)
1. 神: a river of umbrellas flowing between black wet roofs, dissolving upward in rain and steam.
2. 实: roofs (darkest), umbrellas, awnings, poles. 虚 (paper): sky, most of the street, gable walls, steam,
   wet sheen on tiles. ~60-65% paper or pale wash.
3. Lines: roofs 没骨 wash + 皴 tile strokes + 界画 ridge/eave; umbrellas 没骨 blobs + few ribs, body as one
   slanted stroke (no legs); stalls 界画 + 点 goods; street 渲染 + soft reflections; rain 游丝 slanted.
4. Depth: near (y>980) cropped charred roof corner + big umbrellas; middle = host crowd around red umbrella
   (~285,760) + stalls with steam + yellow lantern (~455,600); far = street narrows into rain mist, pale roof
   silhouettes, dot crowd (the planned gate tower was dropped). Mist band between middle and far (藏露).
5. Format 立轴 640×1280, 深远 bird's-eye from slightly left: oblique projection, height vector
   hv = (+.42, −.66)·H·s(d). Ridges run ACROSS the street (a first version with ridges along it read as
   stacked boxes); right-row gable ends with shop openings face the viewer.
Composition (retuned with the updated skill): diagonal S-street from bottom-right to upper-left; dense town mass
left, designed void of rain upper-right (title 雨市 + seal there); right side sparse. Dials: void ≈ 35%, ink mid
with charred near plane, wet, dense marks in the host only. Studied: Wu Guanzhong Jiangnan (viewed), Qingming
scroll and Fu Baoshi rain (from memory).

## Dev Notes
- External: skill repo above (core copied by `scripts/new-painting.sh`), Google Font "Ma Shan Zheng" (title).
- Needs WebGL2 + EXT_color_buffer_float. `?s=3` renders at 3 device px per design unit (for zoomed inspection).
- Files: `scene/layout.js` (depth, projection, street), `houses.js` (roof geometry, ridges across the street),
  `roofs.js` (roof/wall painting), `stalls.js` (awnings, lantern, steam sources), `crowd.js` + `figures.js`
  (umbrellas, robes, porters, straw-hat figures), `street.js`, `layers.js` (glaze/occlude/roughPoly), `painting.js` (order).
- Screenshots of the in-app browser can be stale right after a JS change: take a second screenshot.
