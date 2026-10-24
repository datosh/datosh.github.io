#!/usr/bin/env bash
# Render every content/**/*.d2 to an .svg beside it, with the house style prepended.
# D2 v0.6.9 does not apply globs from an imported file, so the theme is concatenated rather than imported.
# Run from the repo root: ./scripts/render-diagrams.sh   (needs d2 on PATH: https://github.com/terrastruct/d2/releases)
set -euo pipefail
THEME=assets/d2/_theme.d2
FONTS=assets/d2/fonts
find content -name '*.d2' ! -name '_*' -print0 | while IFS= read -r -d '' src; do
  cat "$THEME" "$src" | d2 \
    --font-regular "$FONTS/Inter-Regular.ttf" --font-italic "$FONTS/Inter-Italic.ttf" \
    --font-bold "$FONTS/Inter-SemiBold.ttf" --font-semibold "$FONTS/Inter-SemiBold.ttf" \
    - "${src%.d2}.svg"
  echo "rendered ${src%.d2}.svg"
done
