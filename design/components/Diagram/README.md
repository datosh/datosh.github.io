# Diagram

A D2 diagram, rendered to SVG at build time and inlined, so the page's tokens re-colour it for light and dark.

## Markup the consumer provides
- `figure.fk-diagram` (add `fk-wide` inside prose to break out to `width-wide`) > `div.fk-diagram__canvas` with `role="img"` and an `aria-label` that states what the diagram shows, then the inlined `<svg>`, then `figcaption.caption`.
- A Hugo shortcode inlines the page resource: `{{< diagram src="bootstrap.svg" caption="…" alt="…" >}}` reading `(.Page.Resources.Get (.Get "src")).Content | safeHTML`. It must be inline SVG, not `<img>`: an `<img>` cannot see page CSS.

## Authoring
- Write `.d2` files next to the post's `index.md`. Use plain shapes and containers; mark at most one shape or connection `{class: accent}` to highlight it.
- `scripts/render-diagrams.sh` prepends the house style file `_theme.d2` (rounded 10px corners, 1px strokes, 15px labels, 13px upright edge labels, no padding) and renders with Inter so text metrics match the page:

```bash
#!/usr/bin/env bash
# Render every content/**/*.d2 to an .svg beside it, with the house style prepended.
set -euo pipefail
THEME=assets/d2/_theme.d2
FONTS=assets/d2/fonts   # Inter-Regular.ttf, Inter-Italic.ttf, Inter-SemiBold.ttf (rsms/inter release, extras/ttf)
find content -name '*.d2' ! -name '_*' -print0 | while IFS= read -r -d '' src; do
  cat "$THEME" "$src" | d2 \
    --font-regular "$FONTS/Inter-Regular.ttf" --font-italic "$FONTS/Inter-Italic.ttf" \
    --font-bold "$FONTS/Inter-SemiBold.ttf" --font-semibold "$FONTS/Inter-SemiBold.ttf" \
    - "${src%.d2}.svg"
done
```

- The house style is concatenated, not imported: D2 (v0.6.9) does not apply globs declared in an imported file to the importing diagram, so `...@_theme` silently does nothing.
- Never set hex colours in D2 (`style.fill: "#…"`): those are baked into the SVG and won't follow the theme. D2 also rejects its own theme codes (`B2`, `AA4`) as style values. Use `class: accent` instead.

## How the re-colouring works
D2 emits theme classes (`fill-N1`, `stroke-B1`, `fill-B6` …). `bundle.css` maps them onto the `diagram-*` tokens with `!important` (needed to beat the `<style>` D2 embeds):

| D2 class | token |
| --- | --- |
| N1 | `diagram-text` |
| N2, connection labels | `diagram-label` |
| N7 | `diagram-ground` |
| N6, B4, B5, AB4 | `diagram-container` |
| B6, AA4, AA5, AB5 | `diagram-shape` |
| B1, B3, N3–N5 | `diagram-stroke` |
| B2, AA2, `class: accent` | `diagram-accent` (+ `diagram-accent-fill`) |

## Rules
- Lay out left to right when it fits; switch to `direction: down` when the rendered width passes ~1000 units, otherwise text shrinks below 12px at column width. The canvas scrolls horizontally below 560px rather than shrinking further.
- Captions are one sentence, no full stop needed for fragments.
- Mermaid stays supported for old posts but new diagrams are D2.
