# Composition canon

> Principles are universal; the "Engine:" notes refer to the reference river scene only. For any subject:
> host = the main mass or object (a building, a figure, a tree), guests answer it, a void leads the eye.
> Formats: 立轴 vertical scroll (高远), 手卷 handscroll (wide, moving viewpoint), 册页 album leaf, 扇面 fan.

Chinese landscape painting is not illusionism: no fixed light source, no cast shadows, no single-point
perspective. It is built from a few principles. Each one below says what it means, what breaking it looks like,
and which engine control implements it.

## Contents
1. Xie He's six principles (谢赫六法) — the two that matter most here
2. Three distances (三远, Guo Xi)
3. Host and guests (主宾)
4. Void and solid, open and closed, sparse and dense (虚实 · 开合 · 疏密)
5. Leave the paper (留白) and paint around the moon (烘云托月)
6. Hide and reveal (藏露)
7. Five tones of ink (墨分五色) and dry/wet (干湿)
8. Aerial perspective in ink
9. Near ground and scale
10. Architecture: ruled-line painting (界画)
11. Writing and seals (题款 / 印)
12. Colour

---

## 1. Xie He's six principles (谢赫六法)
- **经营位置 managing placement** — composition, where the void carries weight as much as the masses.
- **骨法用笔 bone method** — the brush line is the structure: pressure, speed and dryness are visible in it.
The other four (spirit resonance, likeness, colour by type, copying) follow if these two are right.

## 2. Three distances (三远, Guo Xi, 《林泉高致》)
- **平远 level distance** — horizon low (here: waterline y = 540 of 720), river or lake, ranges receding sideways.
  Calm, wide. *This engine's home ground.* Structure: near ground → water → far ranges.
- **高远 high distance** — looking up at a towering peak; vertical composition; water optional (`water: false`).
- **深远 deep distance** — looking over and into receding valleys.
Choose one as the governing mode; mixing is allowed but one must lead.

## 3. Host and guests (主宾)
One **host** massif dominates (tallest, broadest, most brushwork). **Guests** are lower, grouped, and answer it
from the other side. Never a row of equal peaks — "the fence" is the #1 composition failure.
Engine: `scene.masses`. Give the host range (depth ~.6) the tallest mass (≈200-230) with half-widths ≥ 200;
guests ≈100-165 on the opposite side; near shoulders lower. Keep half-width ≳ 0.8 × height or peaks become spikes.

## 4. Void & solid, open & closed, sparse & dense (虚实 · 开合 · 疏密)
Dense masses on one side, an opening on the other that leads the eye into depth (toward the moon, the water,
the far ranges). In the reference composition: dense left (host + pavilion), open centre (pale far ranges, moon's
path), quieter right (guest group, title). Fill voids with *depth* (pale far ranges, distant trees 远树, a sail),
not with objects — an empty centre reads as a hole, a pale receding centre reads as distance.

## 5. Leave the paper (留白) and paint around the moon (烘云托月)
Sky and water are mostly untouched paper. The moon is never painted white on grey: it is **bare paper**, and the
sky **around** it gets a soft blotchy wash so it glows by contrast. Engine: `sky()` in `scene.frag` (wash ring +
sparse isotropic cloud washes kept off the moon). Horizontal striped clouds and banded water are digital tells.

## 6. Hide and reveal (藏露)
Cloud belts cross mountains at the waist, bases dissolve into mist, a path disappears behind a hill. The viewer
completes what is hidden. Engine: per-range mist bands at each base, the cloud belt across the host
(`scene.frag`, i == 2), bodies dissolving (`body` term), shore mist.

## 7. Five tones of ink (墨分五色) and dry/wet (干湿)
Charred 焦, dark 浓, heavy 重, light 淡, clear 清 — plus dry and wet. A painting must span them: the darkest accents
in the near plane (reeds, branch wood, title), the palest in the far ranges, bare paper in the void.
Dry strokes (texture, contours) stay sharp; wet washes spread with soft fibrous edges and a faint halo (晕).
Engine: stroke tone/dryness in `ink.js`, wetness map (`gWet` in `scene.frag`) gating fibre diffusion
(`diffuse.frag`), halo and edge darkening in `paint.frag`.

## 8. Aerial perspective in ink
Distance = paler, bluer, softer, less detail. Apply it **systemically**: everything standing at the shoreline
(buildings, trees, reeds) is as deep as the near ranges and must be veiled the same amount; the boat on the water
a little less; near-plane items (plum branch, title, foreground reeds) not at all. Engine: `objectHaze()` in
`common.glsl` (≈ .24 at the shore band, ≈ .2 on the water band, masked away from the title column).

## 9. Near ground and scale
A level-distance picture needs a near plane for depth — but it must be painted in the picture's own language.
In an airy, misty painting heavy dark rocks look pasted on; a reed shallow (芦汀) or a low sandbar works. The near
plane carries the darkest ink and the biggest scale jump (near reeds 2-3× the height of shoreline reeds).

## 10. Architecture: ruled-line painting (界画)
Buildings are drawn in oblique parallel projection (front + receding side face) with ruled, even, unbroken lines,
contrasting deliberately with the organic brushwork of nature. Hip-and-gable roofs with upturned corners,
brackets (斗拱) under the eaves, lattice doors (隔扇) and windows (槛窗), lacquered columns, a name plaque (匾额),
couplets (对联), balconies with 美人靠 backrests, round moon windows (月洞窗). Suggest, don't enumerate: facade
lines are lighter than structure lines. Always ground the building (banks, stilts to the water, deck shadow).

## 11. Writing and seals (题款 / 印)
At most one text: a vertical title in brush calligraphy (Ma Shan Zheng) with one cinnabar seal, over clean paper
or pale far ranges. Classical inscriptions have no punctuation and read top→bottom, right→left. Two texts in two
hands (title + poem columns) crowd the picture — the user rejected it. A horizontal line of text in the water
reads as a video subtitle, not as painting.

## 12. Colour
Ink greys + warm ivory paper (xuan ages warm), blue-grey for distance, pale ochre on near slopes/banks. Red is the
only saturated colour and only for 1-3 accents (plum blossoms, seal, lanterns). Global unifier: saturation ×0.85
except reds (`paint.frag`). The moon is warm paper-white, not neon; lamplight is a warm wash, not a glow.
