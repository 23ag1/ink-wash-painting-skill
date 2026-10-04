# Animation — the painting obeys the painting

The picture is painted once; animation is a per-frame pass over the finished result. Two kinds work:
**the reveal** (the painting appearing on blank paper, once, ~7 s) and **quiet motion** after it (mist drift,
rain, steam, water, a few geese/petals). Nothing else: no glows, specks, vignettes, camera moves, UI.

## 1. The reveal (kit: `brush/inktime.js`, `glsl/reveal.glsl`, `rt.mipmap`; examples: `tage`, rain-market)
How it works:
1. Before painting, `recordInkTimes(inkCtx, w, h, { seed, dur: .22 })` wraps the ink context's fill: every ink
   mark also writes WHEN it is drawn into a time map — each stroke a random start (dozens at once), time running
   from its entry to its exit (the brushes record `g.__seg`), so lines travel instead of popping in.
2. Render WHOLE states of the painting, each through the full material pipeline (scene → diffusion → paint),
   and mipmap them: `blank` (bare paper; the scene field may add its atmosphere), `washes` (every wash, NO ink,
   NO inscription or seal — snapshot the wash canvas before writing them: text and seals also touch the wash
   layer), `full` (finished).
3. Per frame, `revealPainting(blank, washes, full, timeI, uv, p, res, scale, progress, lastMask, poolScale)`:
   big pools bloom in scattered places along a smooth noise field, a damp cool band runs just ahead of each front
   (晕), the tone arrives pale and deepens, ink follows its own wash locally, and `lastMask` regions (inscription,
   seal) are written strictly last. Timeline in tage: `progress = (t − .25) / 4.5` unclamped; the quiet motion
   (`uFx`) fades in from 7.2 s over 2.5 s.
4. `?t=3` freezes the reveal at 3 s for inspection, `?still` skips it (and notan/study modes skip it).

Rules learned the hard way (each one was a visible bug):
- The arrival field is independent of the objects. Per-object timing of washes always produced outlines and
  cut-outs at object edges.
- A smooth remap, never a clamp: clamped fields made plateaus that switched all at once with a hard step.
- Big pools, not confetti, not a top-to-bottom sweep.
- Blur from mip levels only (`textureLod`): per-pixel randomly rotated taps made sand that shimmered as the
  radius changed every frame; a hard switch between sharp and blurred drew a seam along every front.
- No per-pixel "fibre" noise in the front (it became white noise), no outline on the front.
- Everything at the same wetness as its neighbourhood: a sharp final over a still-wet surrounding = mottled
  patches; read the time map blurred as much as the paint is wet (a sharp mask under wet paint = ghost strokes).
- White stripes: thin strips of bare paper exist in the washes state where only ink will cover them (between a
  wash and its contour, under rows of marks). Fill them with the surrounding wash (small min filter on a smooth
  mip level) until the stroke arrives. Also remove bare-paper "sheen scratches" from washes: they flash white.
- Inscription and seal strictly last, with a mask that fully covers them (a tight mask shows half a seal early).
- Marks drawn with `drawImage` or the context's current path are not recorded: they follow the wash tone.
- Depth is shared by all states: a mark's depth (e.g. thin strands) can show as a faint ghost in the washes state
  for a moment — acceptable; avoid big depth-only shapes.

## 2. Quiet motion after the reveal (kit: `glsl/atmos.glsl`)
- Mist drift: `mistDrift` within the mist band, only over far things (depth-gated), ×0.3 — slow.
- Rain: a few sparse slanted streak sheets (near: long, faint; far: short, denser), darker than paper, lighter
  than wet roofs; never a uniform grid (rain-market `final.frag`).
- Steam/smoke: `plume` from sources, leaning with the wind, a veil toward mist colour (paper showing through).
- Water: reflections sampled from the painting itself, rippled; still pictures need no water motion.
- Few moving marks (geese, petals) at most; painted shapes, never dots or glows.

## 3. Verifying animation
- Freeze frames with `?t=` (1.5, 3, 4.5, 6, final) and look at each; then watch it live once.
- The in-app browser pane must be visible: when hidden, `requestAnimationFrame` pauses and screenshots are stale;
  after a JS change take a second screenshot.
