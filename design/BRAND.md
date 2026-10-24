A personal technical publication for Fabian Kammel: a blog first, with talks and side projects beside it. The design is quiet, exact and expensive-feeling: mostly white (or black), one blue, generous space, and type doing the work. Every page should look like nothing was left to chance, and nothing was added for decoration.

## Principles

- **Content is the colour.** Surfaces are greyscale. The only colours are `accent` (links and one primary action), the post cover art, and code. Nothing else gets a hue.
- **Separate with fill and space, not lines and shadows.** Cards are `surface-raised` with no border. Rules (`hairline`) appear only in lists, tables and the header edge. `shadow-hover` exists only for a card being hovered.
- **One column you can read.** Prose sits at `measure` (680px, about 72 characters). Code, diagrams and covers may break out to `width-wide` (980px). Nothing is wider.
- **Precision over flourish.** Tight negative tracking on large type, exact 4px spacing steps, radii from the scale only. No gradients, no glows, no animated hero.
- **Both themes are first class.** Every token has a light and a dark value; dark is true black (`#000000`) like an OLED screen, not dark grey.

## Voice and content

- British English: "colour", "organisation", dates as "11 October 2026".
- Walkthroughs use "we" ("We explore why NixOS…"); opinions use "I" ("I would disagree with this decision"). Address the reader as "you".
- Titles are sentence-like and specific, often with a twist: "The unreasonable effectiveness of VEX in NixOS", "Kubernetes' Default CoreDNS Configuration is *insecure*".
- Expand an acronym on first use: "VEX stands for Vulnerability Exploitability eXchange". Abbreviations are fine after that.
- Show evidence: real commands with real output, versions pinned, dates stamped ("as of 11 Oct 2026").
- No emoji in headings, buttons or UI. Sentence case everywhere; the only uppercase is the `eyebrow` style.
- Button and link labels are verbs or destinations: "Watch the recording", "Get the slides", "All posts". Never "Click here" or "Learn more".

## Colour

Name tokens, never hex. Light values first, dark second.

- Page: `surface`. Code, tags, the note callout: `surface-subtle`. Cards: `surface-raised`. Sticky header: `surface-glass` + `backdrop-filter: saturate(180%) blur(20px)`.
- Text: `ink` for everything you read, `ink-muted` for metadata, descriptions and captions. `ink-faint` is for icons and list markers only; it fails 4.5:1 for text in light.
- Links: `accent`, hover `accent-hover`. The primary button is `accent-fill` with `on-accent`; the secondary is `accent-subtle` with `accent`.
- Focus: a 2px solid `focus-ring` outline, 2px offset, on every interactive element. It clears 3:1 on every surface in both themes.
- Callouts: `callout-<kind>-bg` ground, `callout-<kind>-ink` icon and label, body in `ink`. Kinds are info, note, tip, warn, matching the existing shortcode.
- Code: `code-bg`, `code-ink`, and the `syntax-*` palette (CodeBlock has the Chroma mapping). Every syntax colour is 4.5:1 or better on `code-bg` in both themes.
- Diagrams: the `diagram-*` tokens, applied to D2 output by CSS (Diagram has the mapping).

All text pairs named in token usage notes meet WCAG AA (4.5:1) in both themes; the notes give the measured ratios.

## Typography

- Inter (variable, with optical sizes) for everything; JetBrains Mono for code. Both are self-hosted woff2 files under `fonts/`; no Google Fonts request. Inter's `cv11` (single-storey a) and `ss03` (round quotes) are on via `font-feature-settings` on `.fk-page`.
- Display: `display` (home name only), `title-1` (article and page titles), `title-2` (h2, section heads), `title-3` (h3, talk titles), `headline` (post rows, project names, h4, the wordmark).
- Text: `lede` (article description, home intro, in `ink-muted`), `body` (prose), `body-sm` (cards, callouts, footer), `ui` (nav, buttons, tags), `caption` (dates, captions), `eyebrow` (uppercase venue or series line).
- Code: `code` for blocks, `code-inline` (0.88em, scales with its parent), `code-label` for the block's filename bar.
- Apply type by class: `.title-2` on the element. In rendered Markdown, a Hugo heading render hook adds the class; the prose wrapper carries `body`.
- Below 640px: `display` → `title-1`; `title-1` → 32px/38px.

## Space, size and shape

- Spacing is a 4px-based scale, `space-1` (4px) to `space-10` (128px). Paragraphs `space-5`; h2 top `space-7`; sections `space-9` desktop, `space-8` mobile. Gutter `space-6` desktop, `space-4` mobile.
- Widths: `measure` 680px for reading, `width-wide` 980px for the header, grids and breakouts. `header-height` 52px.
- Radii: `radius-xs` inline code, `radius-sm` small icon buttons, `radius-md` code blocks, callouts and thumbnails, `radius-lg` cards, `radius-xl` the article cover, `radius-pill` buttons, tags and the portrait.

## Imagery

- Post covers keep the established art direction: stylised fantasy landscapes and animals in a Nordic palette of muted greys and blues, one centred subject, no text, 1536×640 (12:5). They are the only imagery in the blog and the main source of warmth; don't add stock photos or illustrations.
- Talk cards use the event's own artwork at 16:9.
- The portrait is round, 96px, on the home page only.

## Motion

- Durations 200ms (colour, opacity) and 300ms (card lift), easing `cubic-bezier(.25,.1,.25,1)`.
- Allowed: link and button colour changes, a 2px card lift, the arrow-link chevron nudging 2px. Nothing animates on load.
- `prefers-reduced-motion: reduce` turns all transitions off.

## Iconography

- Lucide (ISC licence) for UI icons, stroked at 1.75px at 18px (15px in small contexts), `currentColor`, inlined as SVG so they inherit text colour. Used: rss, sun, moon, copy, check, chevron-right, arrow-up-right, info, pencil-line, lightbulb, triangle-alert, play, presentation, link, search.
- Simple Icons for brand marks (GitHub, LinkedIn, Bluesky, YouTube), filled with `currentColor`.
- This replaces Font Awesome from the old Anatole theme. Icons always come with a text label or an `aria-label`.
- The originals are in the Icons asset group; as `<img>` they render black, so inline them in the site.

## Logo

There is no logo mark. The wordmark is the name, **Fabian Kammel**, set in `headline` in `ink`. Don't draw a monogram or use the old "DaTosh" handle as the brand.

## Building the Hugo site with this system

Replace the Anatole theme with a small custom theme. The steps, in order:

1. Copy `tokens.css` (generated from this system) and `components/bundle.css` into `assets/css/`, and the four woff2 files into `static/fonts/`.
2. In `config.toml`, set `markup.highlight.noClasses = false` and remove `style = 'nord'`. Remove the `[params.mermaid]` block once old Mermaid diagrams are converted.
3. Add render hooks: `render-heading.html` (type classes + anchor), `render-codeblock.html` (the `fk-code` wrapper and copy button), `render-link.html` (external links get `rel="noopener"`).
4. Rewrite `layouts/shortcodes/info.html` to emit the Callout markup; existing posts keep working unchanged.
5. Add a `diagram` shortcode and `scripts/render-diagrams.sh` (Diagram has both); run the script before `hugo` in CI.
6. Put the theme script inline in `<head>`: read `localStorage.theme`, fall back to `prefers-color-scheme`, set `data-theme` on `<html>`.
7. Talks: move the slides link out of each `description` in `data/portfolio.yml` into a `slides:` field.
