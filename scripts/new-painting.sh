#!/usr/bin/env bash
# Start a new painting project with the kit: composable, scene-agnostic modules (WebGL runtime, GLSL modules,
# the diffusion pass, brush library, dev server). No pipeline, no scene, no look is copied — you assemble
# your own from the modules (see references/renderer.md; smallest complete build: examples/minimal-bamboo).
# Usage: new-painting.sh <target-folder>
set -euo pipefail
[ $# -eq 1 ] || { echo "usage: $0 <target-folder>" >&2; exit 2; }
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$1"
if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
  echo "error: $TARGET exists and is not empty — pick a new folder" >&2; exit 1
fi
mkdir -p "$TARGET/shaders"
cp -R "$SKILL_DIR/kit" "$TARGET/kit"
echo "Kit copied to $TARGET/kit"
echo "  JS:      import { createRuntime } from './kit/runtime.js'; brush: ./kit/brush/{ink,brush,text}.js"
echo "  GLSL:    #include \"kit/wash.glsl\" (noise, wash, ink, paper, palette, atmos); pass: kit/passes/diffuse.frag"
echo "  Read:    $SKILL_DIR/examples/minimal-bamboo (smallest build), references/renderer.md (module catalogue)"
echo "  Run:     cd \"$TARGET\" && python3 kit/serve.py 8770   → http://localhost:8770/index.html"
