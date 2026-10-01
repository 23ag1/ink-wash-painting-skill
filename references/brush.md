# Brush grammar → stroke algorithms

Every visible mark is made by a brush. Model the brush, not the shape. `kit/brush/ink.js` implements the core
primitives (≈170 lines, subject-agnostic) — copy it or reimplement the same ideas.

## 1. One stroke (the atom)
A stroke is a path + a width profile + an ink profile:
- **Width along the path:** `w(t) = wid · fun(t)` blended with smooth noise **sampled by arc length**
  (period ≈ 20 units). Sampling noise per point index makes dense strokes pulse ("beads").
- **Entry and exit:** 顿 press on entry (width jumps ~.55→1 over the first 12%), 提 lift toward the exit
  (thins to ~30%). `press = t => (t<.12 ? .55+t*3.75 : 1) * (1 - pow(max(0,t-.12)/.88, 2.4)*.7)`.
- **Ink inside the stroke (点墨):** pale full-width body + darker half-width core, offset sideways by `tip`
  (-1..1). `|tip| ≈ .8` = 侧锋 side brush (one hard dark edge, one soft pale edge); 0 = 中锋 centred.
- **Drying:** alpha falls along the length (`dry` 0..1), heaviest just after entry.
- **飞白:** for dry fast strokes cut streaks of paper along the stroke direction (destination-out thin lines, or
  a noise mask along the stroke's local v coordinate).
- **Breaks:** a contour breaks 0-2 times per stroke at random places (probability per stroke, not per point —
  per-point gaps look like stitching).
- Hairlines (< 1.2 wide) can be flat; everything else gets the tone treatment.

## 2. Stroke families as algorithms
| family | algorithm |
|---|---|
| 界画 ruled line | straight segments, width nearly constant (`fun ≈ 1`, tiny entry), noise .1, no breaks |
| 铁线/游丝 描 | long smooth curve, constant thin width, low noise, few breaks |
| 兰叶描 / orchid blade | width `sin(πt)^.7` swelling mid-stroke, one continuous sweep |
| 钉头鼠尾 | strong entry dot then long thinning tail |
| 皴 texture | many short strokes **oriented by the surface**: direction from a field (fall line of terrain = gradient of height; roof slope = the slope direction; bark = along the trunk; walls = horizontal courses). Density by tone: more strokes on the shadow side and where the form turns away |
| 斧劈 axe-cut | short wide side-brush wedges (`tip ≈ .9`), angular, dark edge on one side |
| 点 dots | noisy lens/polar blobs (`blob`): radius = base·(1 - noi + noi·loopedNoise(θ)); grouped in 个/介 clusters or scattered by Poisson-disk with density by tone |
| 没骨 | one or two wide wet strokes whose tone varies across the width (dark back, pale belly) — write high wetness so diffusion softens them |
| 渲染 wash | filled shape offset 1-2 units from its contour and blurred ("looseWash"); or a shader field; always high wetness |
| branches / roots | random walk with bounded bend per step (`walk`), recursive forks with decreasing width, angular for plum/pine, supple for willow |

## 3. Composition of strokes into things
- **Structure first, then strokes.** Build the object's skeleton geometrically (a tower's tiers, a roof's
  planes, a street's curve, a cat's pose curve), then *decorate the skeleton with strokes*. Never render the
  skeleton itself.
- **Suggest, don't enumerate:** 40 tile strokes on a roof read as tiles; 400 read as a texture map. Leave gaps.
- **Hierarchy of line weight:** outer silhouette > structural lines > secondary detail (lattice, tiles) > hints.
- **Level of detail by screen size:** decide per object from its size in design units; small = silhouette +
  one dark accent.
- **Every stroke has a seed** derived from the object's seed + index/hash of position. Adding a random call
  into an existing sequence reshapes everything after it.
