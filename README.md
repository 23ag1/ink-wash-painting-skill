# ink-wash-painting

**A Claude skill that paints Chinese ink-wash (水墨) of any subject as live browser art — WebGL2 shaders for paper, water and ink, Canvas brushwork, no images and no libraries.**

<img src="docs/scene-live.gif" width="100%" alt="The reference scene 月满中秋, live: a pavilion by a misty river, geese crossing the full moon, a plum branch, a boat">

<sub>The reference scene, 月满中秋 (<i>full moon, mid-autumn</i>) — it paints itself in from blank paper, then geese, petals and lamplight are drawn with the same brush code every frame. **[See it running live →](https://research.23ag.one/ink-wash)**</sub>

---

It is not a scene generator. The skill teaches Claude how an ink painter *sees* a subject, how paper, water and brush behave, and how to criticise its own picture — then Claude writes a new renderer for every request, reusing only the generic material core.

> Quality comes from four things, in this order: **translating the subject into the painter's language**, **composition by the canon**, **material and brush that hide the computer**, and **inspection at zoom**.

## How a painting gets made

| Step | What happens | Reference |
|---|---|---|
| **1. See** | Five questions before any code: the spirit of the subject (神), what is solid and what is empty (实 / 虚), the family of line, the depth planes, the format. | [`references/seeing.md`](references/seeing.md) |
| **2. Compose** | One host and its guests (主宾), empty paper as a shape (留白), hiding and revealing (藏露), one focal point, 1–3 red accents, at most one inscription and one seal. | [`references/composition.md`](references/composition.md) |
| **3. Material** | Fibre-ridged paper; every mark writes a wetness map that diffuses along the fibres (~36 steps on half-float targets), with edge darkening, granulation and a halo. | [`references/materials.md`](references/materials.md) |
| **4. Brush** | Width noise by arc length, pressed entry and lifted exit, a dark core offset for 中锋 / 侧锋, drying into flying white (飞白). Ten stroke families. | [`references/brush.md`](references/brush.md) |
| **5. Structure** | Every motif built from the master's crop at 3×. Trees grow as one graph — continuous thickness (Leonardo), gravity by thickness, collars at joints, roots in the ground — painted as one body of ink; the species decides the rest. | [`references/trees.md`](references/trees.md) |
| **6. Render** | Everything ordered by depth 0…1; everything goes through the wash/ink layers before diffusion and the paint pass. | [`references/renderer.md`](references/renderer.md) |
| **7. Reveal** | The painting appears on blank paper: washes bloom like ink in wet paper, strokes travel from entry to exit, the inscription and seal come last; then quiet motion (mist, rain, steam). | [`references/animation.md`](references/animation.md) |
| **8. Critique** | At least two rounds on six zoomed crops — composition, tone, execution, grounding, motion — and an honest note on what is still weak. | [`references/critique.md`](references/critique.md) |

![Detail: washes bleed along the paper fibres and darken at their edges; reeds and branches break where the brush runs dry](docs/detail.jpg)

<sub>Detail at 2×. Every real failure behind it — 103 rules in ten sections, from joints and false readings (“an eye”, “a slingshot”, “bamboo nodes”) to the reveal — is in [`references/pitfalls.md`](references/pitfalls.md).</sub>

## Install

```bash
git clone https://github.com/23ag1/ink-wash-painting-skill ~/.claude/skills/ink-wash-painting
```

Then ask Claude for a painting — *“a canal city in mist, in Chinese ink style”*, *“a pagoda at dusk, 水墨”*, *“a cat on a windowsill in the rain, sumi-e”*.

## Run the examples

```bash
python3 kit/serve.py 8770          # from the repo root
# → http://localhost:8770/reference/index.html               月满中秋, the Mid-Autumn river scene
# → http://localhost:8770/examples/rain-market/index.html     雨市, a market street in rain (vertical scroll)
# → http://localhost:8770/examples/minimal-bamboo/index.html  清风, the smallest complete build (album leaf)
# → http://localhost:8770/examples/tage/index.html           踏歌, after Ma Yuan's Singing and Dancing (silk, axe-cut peaks)
```

## The kit — modules, not a pipeline

`kit/` holds the materials as small, composable, scene-agnostic modules: a WebGL runtime (programs with
`#include`, targets, ping-pong, read-back), GLSL modules (noise and glazes, watercolour wash behaviour, brush ink
over washes, the paper sheet, palette, rain / steam / drifting mist), the fibre-diffusion pass, and the brush
library — plus tree growth (`brush/tree.js`) and the reveal (`brush/inktime.js`, `glsl/reveal.glsl`). There is no fixed pass order, no scene and no default look: every parameter that changes the picture is
an argument the painting must give, and the runtime refuses to draw if a uniform was left unset.

The four paintings are four different assemblies of the same modules. The two larger ones were ported onto the
kit and checked against their original code pixel by pixel: the rain market is identical, the Mid-Autumn scene
differs by 1/255 on 0.0005% of values (float rounding).

`scripts/new-painting.sh <folder>` starts a new painting with the kit only — never with an example's scene.

## What's inside

```
SKILL.md                 workflow and principles
references/              research · seeing · judgement · composition · materials · brush · renderer (kit catalogue)
                         · trees · animation · critique · pitfalls · motif studies · painting how-to · technique sources
kit/                     runtime.js · glsl/ · passes/diffuse.frag · brush/ · serve.py
reference/               月满中秋 — landscape build (mountains read back from a shader, river, reflection)
examples/rain-market/    雨市 — vertical scroll with a depth layer, rain and steam
examples/minimal-bamboo/ 清风 — smallest build
examples/tage/           踏歌 — after Ma Yuan on aged silk: axe-cut peaks, a willow grown as one tree, the reveal
scripts/new-painting.sh  scaffold a new painting with the kit
evals/evals.json         test prompts: a pagoda, a canal city in mist, a cat in the rain
```

Rain market is an honest test result, not a showcase: composition and void work; motifs up close (tiles,
figures) are still weaker than the composition.

## Honest limits

- No photographic detail, cast shadows or full colour — by design.
- Faces, hands and anatomy are weak.
- New subjects start without motif code; the examples show technique, not reusable scenes.
- Needs WebGL2 with `EXT_color_buffer_float`.

## Prior work

MoXi (Chu & Tai) · Curtis et al., *Computer-generated watercolor* · Bousseau et al., *Interactive watercolor rendering* · Lingdong Huang, [shan-shui-inf](https://github.com/LingDong-/shan-shui-inf)

---

Part of [23AG Research](https://research.23ag.one/) — the full write-up is at [research.23ag.one/ink-wash](https://research.23ag.one/ink-wash).
