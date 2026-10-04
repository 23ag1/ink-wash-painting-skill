# Trees — structure first, then the species, then the brush

Trees failed more often than any other motif while building this skill (a plank trunk, a cartoon flower head, a
Y-slingshot, black pipes from a shader overlay, a rope of strokes, a broom on a stick, a thorn bush, an oak where a
willow was wanted). Every failure was **construction**, never a missing parameter. Work in this order and do not
go on while a step fails. Mechanics: `kit/brush/tree.js`; worked example: `examples/tage/scene/willow.js`.

## 1. Study the species (before any code)
- Crop the master's tree LARGE (3×) next to your render (`sips -c H W --cropOffset Y X in.png --out crop.png`).
  Write a structure note: trunk length and lean, where the first limbs leave, how many, their angles, how
  twigs behave (rise? droop?), leaves/strands, how the base meets the ground, what the painter simplifies.
- Look at the real tree too (photos). A verbal idea ("pollarded willow") is not a construction.
- If you are recreating a reference painting, measure positions on it (fraction of the sheet) and place by them.

## 2. Universal structure (every tree, every species)
- **One growth graph.** The trunk is a chain from the root that FLOWS ON into the main limb; every other limb,
  branch and twig is a chain growing out of a parent. Never assemble separate pieces (trunk + head + stuck-on limbs).
- **Thickness is continuous** (Leonardo; Ballot's data trees): along a chain it falls smoothly to a fine tip;
  a child starts at its parent's width where it leaves, capped by its own size —
  `w0 = min(parentWidth × .85, widthPerLen × length)`. The trunk does not narrow into the fork; a thin branch
  never comes straight out of a thick trunk; a short branch is thin even on a thick trunk (else fat thorns).
- **Gravity like a cantilever**: per step the direction turns toward down by `gravity · t / (1 + w / stiffness)`
  — thick limbs hold their line, thin parts droop more toward the tip. Arches emerge; never hand-draw the curve.
- **Departure** 30–50° (narrower toward the parent's tip), alternating sides at uneven spacing (no fishbone, no
  pairs, 二二并生), longer branches low on a parent (a cone), a slight lean to the light, limbs in all four
  directions including behind (护, paler) and in front (掩) — 树分四枝.
- **No crossings** through a big limb: try the other side or drop the branch (`crosses`).
- **Joints**: a collar — the child flares over its first ~8% (`collar`). Fill the whole tree as ONE path so
  joints have no seams. Never a ring, outlined oval, blurred dark dab or pale gap at a joint.
- **No inch straight** (树无一寸直): small crooks along every chain, an occasional kink; trunks bend (an S).
- **The base grows out of the ground**: a flare, roots as chains spreading over the bank, a soft wet ground
  shadow and grass over the foot. Never a flat cut, never a pole entering from the frame edge as the whole trunk.

## 3. Species character (decides more than the rules above)
Write the species' dials before building; generic branching reads as an oak/elm whatever the species.

| species | trunk | limbs & twigs | leaves / extras |
|---|---|---|---|
| weeping willow (柳) | short, leaning, nearly bare (one thin shoot at most); a pollard knuckle where limbs leave together (Ma Yuan) | few long arching limbs; twigs are thin whips (`widthPerLen` ≈ .055) that barely rise and droop hard (gravity ≈ .75) | long strands (50–280 units) in bunches along `strandCurve` (thrown-stone arcs), from tips AND along the outer half: curtains with gaps |
| pine (松) | crooked, scaly (fish-scale bark arcs), often leaning from rock | near-horizontal limbs turning down at the ends; few | needle clusters as fans of short strokes over a soft dark pad (`examples/tage/scene/trees.js` `pine`) |
| bare winter tree (枯树, 蟹爪) | crooked, dark | angular; tips claw "one up, one bent down", sharp (crab claw, northern school); or rising antlers (鹿角) | none; or a few dark leaf clusters (点叶) |
| plum (梅) | old, broken, hollowed, dry-brush | young shoots straight and long (a whip with no side twigs), old wood gnarled | blossoms as five dots/rings, sparse, on the shoots (`reference/`) |
| bamboo | NOT a tree graph: culm segments with joint marks, leaves as single strokes in groups (`examples/minimal-bamboo`) | | |

## 4. Painting the tree
- **Everything through the pipeline**: shapes go into the wash/ink canvases BEFORE diffusion and the paint pass.
  A tree composited after the paint pass (e.g. an SDF overlay) reads as a vector cut-out.
- **One body (没骨 boneless)**: `chainShape` per chain (uneven edge ≈ .08) added to ONE Path2D →
  occlude (paper under it) + depth (the exact shape) + a dark multiplied wash with wetness (it bleeds a little)
  + one ink fill + bristle texture (`hairyStroke` along thick chains, clipped to the body) + a few flying-white
  streaks lifted out on the lit side. No outlines.
- Do NOT paint wood as: a filled polygon with dashes (plank), one wide hairy stroke (rope/plank — wide strokes on
  the crisp ink layer always read digital), short wide side strokes (stacked boards, hexagon patches), a bundle of
  separate strokes (cables), outlined lumps (cartoon flower). If a texture is needed on thin parts, don't: thin
  chains are plain dark (texture on a thin limb reads as bamboo nodes).
- Strands/leaves after the body; write depth along ALL ink, including hidden starts (else the mist veils them).

## 5. Check (zoomed AND full frame), in this order
1. Silhouette at thumbnail: does it read as THIS species? (willow: curtain; pine: flat tiers; plum: angular, sparse)
2. Every fork: thickness continuous? collar? no neck, no thorn, no seam?
3. Base: grows from the ground? no flat cut?
4. Physics: do thin parts droop, thick parts hold? anything crossing through a limb?
5. False words (pitfalls.md §8): slingshot, broom, rope, plank, cables, thorns, mace, eye, flower, label.
