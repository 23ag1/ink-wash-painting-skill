# Seeing like an ink painter: translating ANY subject

The style is not a set of motifs (mountains, moon, pavilion). It is a *way of seeing* plus a *material*.
Any subject — a city, a close-up pagoda, a cat, a train station, a storm — can be painted if you first translate
it the way a painter would. Do this translation in writing before any code, after studying real paintings of the subject (`research.md`). Copying the reference implementation's
scene instead of translating is the #1 cause of "template" pictures.

## Contents
1. The five questions (the method)
2. The painter's vocabulary: what every mark can be
3. Subject families — how masters handled them
4. Worked translations: large pagoda, city in mist, a subject with no mountains or water
5. What does not translate (say so honestly)

---

## 1. The five questions
Answer each for the requested subject:

1. **What is its 神 (spirit), in one phrase?** Not "a pagoda" but "a tower rising out of cloud, too tall to see
   whole". Every later decision serves this phrase; details that do not are omitted (以形写神 — form serves spirit).
2. **What is 实 (solid, painted) and what is 虚 (left as paper)?** Decide per region. Usually 60-80% of the sheet
   is 虚: sky, water, mist, snow, white walls, the lit side of things. Paper is the brightest "colour" you have;
   light is never painted, only left.
3. **What is its structure, and which line family carries it?** Man-made → ruled even lines (界画); organic →
   living pressure lines (描); masses without contour → boneless washes (没骨); surfaces → texture strokes (皴);
   foliage, moss, crowds, far detail → dots (点). One subject may use several; each part gets exactly one.
4. **Where is the depth, and how does tone fall with it?** Pick planes (usually 3). Near = darkest ink, sharpest,
   most detail, biggest scale; far = pale, bluish, soft, silhouette only. Mist between planes (藏露) hides what
   you cannot or should not paint — bases of buildings, the middle of a crowd, the rest of a street.
5. **What is the format and viewpoint?** 立轴 hanging scroll (vertical, 高远 looking up), 手卷 handscroll (wide,
   read right→left, moving viewpoint), 册页 album leaf (near-square, one intimate motif), 扇面 fan (curved band).
   There is no single-point perspective: parallel oblique projection for buildings, stacked planes for depth,
   and "high distance / level distance / deep distance" (高远/平远/深远) instead of a camera.

Write the answers as the brief. Then list for every element: plane, 实/虚, line family, tone range, how it
touches the ground or dissolves.

## 2. The vocabulary (every mark on the sheet is one of these)
| mark | what it is | use for |
|---|---|---|
| 勾勒 outline | contour line, then fill | architecture, figures, boats, anything with a clear edge |
| 界画 ruled line | even, unbroken, straightedge | man-made structure only (walls, eaves, rails, bridges, rails, windows) |
| 描 line families | 铁线 (even, firm), 游丝 (hair-fine), 兰叶 (swelling-thinning), 钉头鼠尾 (nail head, rat tail), 折芦 (angular) | figures, cloth, animals, plants |
| 没骨 boneless | shape made by one or two wet strokes, no contour | petals, leaves, animals (Qi Baishi shrimp, Xu Beihong horses), far trees, roofs in mist |
| 皴 texture | strokes that follow a surface: 披麻 (long fibres), 斧劈 (axe-cut, angular), 雨点 (rain dots), 米点 (Mi horizontal dabs), 折带 (folded band), 荷叶 (lotus-leaf veins) | rock, earth, bark, old walls, tiled roofs (tile rows ARE a texture stroke) |
| 点 dots | 介字/个字 (leaf groups), 胡椒 (pepper), 苔点 (moss), 米点 | foliage, moss, distant crowds, lights, texture accents |
| 渲染 wash | graded wet wash, one or several glazes | sky, water tone, mist, shadow sides, atmosphere |
| 泼墨/破墨 | splashed ink / wet ink broken into wet ink | dramatic masses, storms, night, foliage mass |
| 积墨 | layered ink, dry between layers | dense night scenes, heavy earth (Li Keran, Huang Binhong) |
| 飞白 | dry brush leaving streaks of paper | wood, rock edges, fast strokes, calligraphy |
| 留白 | unpainted paper | light, snow, water, white walls, mist, the moon |

Rule of thumb: if you are about to fill a shape with a flat colour or draw a uniform vector outline, stop and
choose a mark from this table instead.

## 3. Subject families
- **Architecture close up** — 界画 (Guo Zhongshu, Yuan Jiang): oblique projection, ruled lines, roofs with
  upturned corners, brackets suggested by a comb of short lines, tile rows as a 皴-like texture, lattice as a
  lighter secondary line. Depth: the building's own lower part dissolves in mist; the sky behind is paper.
- **Towns and cities** — two traditions: (a) panorama (清明上河图): handscroll, many small buildings along a
  river/street, figures as dots and tiny 描 lines, trees punctuating the rhythm; (b) modern ink (Wu Guanzhong's
  Jiangnan, Li Keran): white walls = paper, black tile roofs = bold ink blocks and bands, windows and doors as
  dots, reflections in canals, a few willow lines. The city is a *rhythm of blacks on white*, not a set of houses.
  Mist erases most of it; only rooftops and a landmark emerge.
- **Figures** — small: silhouettes with one accent (hat, umbrella, lantern). Medium: 减笔 (Liang Kai) — a few
  bold cloth strokes, face barely indicated. Close: 描 line families for cloth, face in fine 游丝. Legs and
  hands are where it turns cartoonish — hide them in cloth, boats, grass.
- **Animals and birds** — 没骨 body in one or two wet strokes (dark on the back, pale on the belly by the brush's
  loading), dry accents for claws, eyes, beak. Qi Baishi: the paper around is the water/air.
- **Plants** — 四君子 grammar: bamboo (culms ≈ 8-10% of the sheet width, painted as wide grey dry-brush segments
  that meet at dark uneven node touches; twigs leave from the culm edge at a node with a knot; leaves long, one
  stroke each, nearly flat dark ink, in finger-splayed 个/介 groups; see `examples/minimal-bamboo`), orchid (long swelling blades),
  plum (angular wood, round blossoms), chrysanthemum (outlined petals, wash leaves). Trees: trunk in 勾 + 皴,
  crown in dots/washes, never a lollipop.
- **Water** — paper, plus a few tapered lines or a graded wash; reflections are pale, soft, broken. Waves in
  close-up: repeated rhythmic lines (水纹), not noise.
- **Weather and light** — snow: paint the sky and shadow sides darker so paper reads as snow (反衬), dry the
  strokes. Rain: slanted wet washes, 米点 mountains, blurred everything. Night: darker overall ink (积墨), lights
  are left paper with a warm wash around, never glows. Wind: everything leans one way.
- **Non-Chinese / modern subjects** (a car, a skyscraper, a European street): the same five questions work.
  Architecture → 界画 in oblique projection; glass → paper with a few ruled reflections; crowds → dots.

## 4. Worked translations

### A. "A large pagoda" (close-up, the pagoda is the subject)
- 神: *a tower rising out of cloud, too tall to see whole.*
- Format: vertical (立轴, e.g. 720×1280 or 9:16), 高远 — viewer below. Pagoda occupies the central third,
  slightly off-axis; top tiers may be cropped by the sheet edge or lost in cloud (藏露).
- Structure: 7-13 eave tiers, each narrower upward (entasis in the profile), octagonal or square plan drawn in
  oblique projection (front face + one receding face). Per tier: a ruled eave line with upturned corners, a comb
  of short bracket strokes (斗拱) under it, a dark band of shadow under the eave, tile rows as short parallel
  strokes on the roof slope, a door/window as a dark dot or arch, tiny bells as dots at the corners.
- 实/虚: roofs and the shadow under eaves = ink (the rhythm of dark bands up the tower); walls = paper with a
  pale ochre wash; sky = paper with a graded grey wash on one side to lift the silhouette; clouds = paper
  gaps that cut the tower at two heights.
- Depth: base in mist (no ground line); a pine or rock in the near corner with the darkest ink for scale;
  a far pale ridge behind at mid-height.
- Level of detail scales with size on screen: at 400+ px tall draw brackets and tile rows; if a tier is < 15 px
  tall, reduce it to eave line + shadow band.
- Motion: mist drifting through the gaps, a few birds around the top, bells swaying (1-2 px), nothing else.

### B. "A city in this style"
- 神: *a living town breathing in the rain/mist* — decide the mood first (market = dense, 25% void; dawn canal =
  sparse, 60% void) and study Wu Guanzhong's Jiangnan towns, Feng Zikai's streets and 清明上河图 (`research.md`).
- Structure (what makes it believable): each house = **white wall (paper) + dark roof band + dark openings**.
  Show facades, not just roofs: in oblique projection you see the wall under every roof. Houses differ in height,
  width, orientation and roof type (gables 马头墙, hips, sheds); they overlap, lean, have gaps and alleys.
- Composition: the street or canal runs on a **diagonal or S-curve**, never straight down the middle; houses
  crowd one side more than the other; a landmark (gate tower, bridge, big tree) is the host; vertical accents
  (shop banners 幌子, lanterns, poles, a tree) break the horizontal rhythm; the far end dissolves into mist.
- The city is a rhythm of blacks on white: vary the dark shapes' sizes, cluster them, leave paper gaps. If the
  thumbnail reads as rows or a grid, the composition is wrong — no amount of detail fixes it.
- Crowds: clusters of marks of unequal size with gaps; a few legible figures near, the rest dots; see
  `judgement.md` §5 for the anti-repetition laws.

### C. A subject with no mountains and no water (e.g. "a cat on a windowsill in the rain")
- The whole landscape machinery disappears; the material pipeline stays.
- 册页 near-square; cat as 没骨 (2-3 wet strokes, dark back, dry whisker and eye accents); sill in 界画;
  rain as slanted pale washes + a few dry vertical lines; window frame ruled; the room behind left as paper.

### D. From a photo — inspiration, not a copy
A user's photo is a *brief in picture form*: what they love about a place or moment. Not a layout to trace, and
never an image to filter (the photo's pixels through a watercolor shader = a phone-app effect, not a painting).
1. **Read it as a painter:** subject and spirit (what moved the person to take it); mood (time, weather, season,
   temperature, sound); the 1-3 motifs that make it *this* place; light as tone (darkest/lightest); clutter
   (cars, wires, signs, tourists, cast shadows).
2. **Put it aside and paint the brief.** Recompose freely by the canon: own format; move, enlarge or drop things;
   mist over what does not serve; cast shadows → tone by depth; perspective → oblique; colour → ink + 1-3
   accents; sky and highlights → paper.
3. **Use it only as a structure reference** for the characteristic motifs, so they are believable.
4. **Success test:** someone who knows the place recognises its feeling; nobody calls it a filtered photo.

## 5. What does not translate — tell the user
- Photographic detail, specular highlights, cast shadows from a light source, exact perspective — the style
  deliberately does not have them. Offer the painterly equivalent instead.
- Many identical repeated elements at the same scale (a grid of windows) — reduce and vary, or it reads as CG.
- Saturated full colour everywhere — the style keeps colour to accents; heavy colour belongs to 工笔 / blue-green
  landscape (青绿山水), a different recipe (mineral colours, fine outlines, flat opaque fills).
