#!/usr/bin/env bash
# Start a new painting project with ONLY the subject-agnostic core of the reference implementation:
# brush primitives, brushed text/seal, fibre diffusion, watercolor filter, no-cache server.
# The scene, motifs and pipeline wiring are yours to write for this subject (see references/renderer.md).
# Usage: new-painting.sh <target-folder>
set -euo pipefail
[ $# -eq 1 ] || { echo "usage: $0 <target-folder>" >&2; exit 2; }
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$1"
if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
  echo "error: $TARGET exists and is not empty — pick a new folder" >&2; exit 1
fi
mkdir -p "$TARGET/shaders" "$TARGET/lib"
R="$SKILL_DIR/reference"
cp "$R/serve.py" "$TARGET/"
cp "$R/ink.js" "$R/brush.js" "$R/text.js" "$TARGET/lib/"
cp "$R/shaders/diffuse.frag" "$R/shaders/common.glsl" "$TARGET/shaders/"
cp "$R/shaders/paint.frag" "$TARGET/shaders/paint.reference.frag"
echo "Core copied to $TARGET (lib/: brush primitives + text; shaders/: diffusion + reference filter)."
echo "common.glsl: noise/palette are generic; WATER and objectHaze belong to the reference scene. paint.reference.frag uses them — replace with depth-based haze. Shaders expect common.glsl prepended (see reference/gl.js)."
echo "Reference pipeline to read (not copy): $R/gl.js, $R/shaders/"
echo "Run later:  cd \"$TARGET\" && python3 serve.py 8770"
