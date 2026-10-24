# CodeBlock

Fenced code with a filename or language bar, a copy button, highlighted lines and diff lines, coloured by the system's own syntax palette in both themes.

## Markup the consumer provides
- Hugo config: `markup.highlight.noClasses = false` so Chroma emits classes (`.k`, `.s`, `.nf` …) that `bundle.css` maps to the `syntax-*` tokens. Delete `style = 'nord'`.
- A code block render hook (`layouts/_default/_markup/render-codeblock.html`) wraps Chroma's `<pre class="chroma">` in `figure.fk-code` and adds `.fk-code__bar` with `span.fk-code__label.code-label` and `button.fk-code__copy`. Put the `code` type class on the `pre`.
- Label: the `title` attribute of the fence if present (```` ```go {title="main.go"} ````), otherwise the language. Shell fences are labelled "console".
- No label wanted: add `fk-code--bare`; the copy button then floats top-right and appears on hover or focus.
- Highlight lines with `{hl_lines=[6]}`; Chroma marks them `.line.hl` → `code-line-highlight` with a 2px `accent` edge.
- Copy button: copies `pre code` text minus `.gp` prompts, swaps the copy icon for a check in `callout-tip-ink` for 1.5s, and announces "Copied" through an `aria-live` region.

## Syntax palette
| token | Chroma classes |
| --- | --- |
| `syntax-keyword` | k kd kn kp kr ow cp nt |
| `syntax-string` | s s1 s2 sb sc sd se sh si sx sr cpf |
| `syntax-number` | kc m mb mf mh mi il mo ss |
| `syntax-type` | kt nb bp nc nn ne |
| `syntax-function` | nf fm nd |
| `syntax-attribute` | na nv vc vg vi no py |
| `syntax-comment` | c ch cm c1 cs (italic) |
| `syntax-punctuation` | o p |
| `syntax-prompt` | gp go |

Every syntax colour holds 4.5:1 or better on `code-bg` in both themes.

## Do / don't
- Do use `console` blocks with `$ ` prompts for shell sessions; the prompt is not copied.
- Do keep blocks under ~25 lines; long files go in a linked gist or repo.
- Don't put code in images.
