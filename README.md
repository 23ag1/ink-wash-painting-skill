# ink-wash-painting — a Claude skill

Principles-first skill that lets Claude paint Chinese ink-wash (水墨) pictures of **any subject** as live browser
art: landscapes, cities, pagodas, figures, animals, weather. It teaches how an ink painter translates a subject,
how paper, water and ink behave (and how to render that in WebGL2 shaders), and how a brush makes marks, so
Claude builds a renderer for each new painting instead of reusing one scene.

- `SKILL.md` — workflow and principles
- `references/` — seeing & translating subjects, composition canon, materials → shaders, brush grammar,
  renderer design, critique checklist, pitfalls
- `reference/` — a complete worked example (Mid-Autumn river scene, WebGL2 + Canvas, no dependencies)
- `scripts/new-painting.sh` — starts a project with the generic core (brush lib, fibre diffusion, watercolor filter)

## Install
```bash
git clone https://github.com/23ag1/ink-wash-painting-skill ~/.claude/skills/ink-wash-painting
```
Then ask Claude for a painting, e.g. "нарисуй город у канала в тумане в стиле китайской туши".

Run the reference example: `cd reference && python3 serve.py 8770` → http://localhost:8770/index.html
