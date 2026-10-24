# Redesign hand-off: blog.kammel.dev

This folder is the "Fabian Kammel" design system, exported from Claude. Use it to replace the Anatole theme with a small custom Hugo theme. The design and the rules are settled; your job is the Hugo implementation.

## Read first, in this order

1. `BRAND.md`: the brand book (principles, voice, colour, type, spacing, imagery, motion, icons) and a 7-step migration outline.
2. `components/<Name>/README.md`: the exact markup each component expects (class names, which type style goes on which element, what Hugo data feeds it).
3. `components/<Name>/preview.html`: the reference rendering. Run `./design/scripts/preview.sh` and open `http://localhost:8099/components/<Name>/preview.html`; each has a "Toggle theme" button. Your Hugo output should match these in both themes.
4. `css/tokens.css` (generated from `tokens.json`) and `css/bundle.css`: the finished stylesheets. Use them as they are. Don't re-type values or add colours; if something is missing, add it to `bundle.css` using the existing `var(--…)` tokens.

## Before you start

Ask me before writing code if anything here is ambiguous. Work on a new branch, `redesign`. Don't touch post content in `content/post/**/index.md` except where step 7 below says so, and leave front matter and cover images alone.

## What exists today (checked against the repo on 24 Oct 2026)

- Theme: `github.com/lxndrblz/anatole` v1.16.2 as a Hugo module; overrides in `layouts/shortcodes/info.html`, `layouts/_default/rss.xml` (keep this one), `assets/css/custom.css`, `assets/css/components.css`, `assets/js/copy-code.js`.
- Shortcodes used by posts: `info` (23 uses, types info/warn/note/tip) and Hugo's built-in `figure` (19 uses). No post uses Mermaid, so `[params.mermaid]` can go.
- Code fence languages: bash, console, sh, yaml, sh-session, tf, txt, nix, go, bat, yml, ini, json, Dockerfile.
- 7 posts set `toc:` in front matter, so a table of contents is needed (see below).
- Talks come from `data/portfolio.yml`; side projects are menu links (GoInvaders at `/goinvaders/game.html`, pin-gh-actions.kammel.dev, elvenxcel.app).

## Target

| Page | Components |
| --- | --- |
| All pages | SiteHeader, SiteFooter |
| Home `/` | HomeHero, PostCard ×2 (latest), PostList (next 5), link to talks |
| Posts `/post/` | PostList (all, newest first) |
| Post | ArticleHeader, Prose with CodeBlock, Callout, Diagram, figure |
| Talks | TalkCard grid from `data/portfolio.yml`; keep the `/portfolio/` URL working (alias or keep the path) |
| Projects (new) | ProjectCard grid; replaces the Side Projects dropdown |
| Tag pages | PostList |

Keep every existing URL (`/post/<slug>/`, `/index.xml`, `/goinvaders/game.html`). Check by diffing the `public/` file list before and after.

## Steps

1. Theme scaffold: remove the Anatole module import from `config.toml` and `go.mod`, and create `layouts/_default/baseof.html`, `list.html`, `single.html`, `index.html` and partials for header and footer. Put `design/css/*.css` into `assets/css/` and `design/fonts/*` into `static/fonts/`. Bundle both CSS files with Hugo Pipes (`resources.Concat`, `minify`, `fingerprint`).
2. Theme switching: an inline script in `<head>` before the CSS sets `data-theme` on `<html>` from `localStorage.theme`, falling back to `prefers-color-scheme`. The toggle in SiteHeader flips it and stores it.
3. Markup: `markup.highlight.noClasses = false`, and remove `style = 'nord'`. Add render hooks:
   - `_markup/render-heading.html`: h2 → `title-2`, h3 → `title-3`, h4 → `headline`, plus `a.fk-anchor`.
   - `_markup/render-codeblock.html`: `figure.fk-code` with label (fence `title` attribute, else the language; `console`, `sh-session` and `bash` sessions show "console"), copy button, Chroma output inside. A small JS file implements copy; it must skip `.gp` prompt spans.
   - `_markup/render-link.html`: external links get `rel="noopener"`.
4. Shortcodes: rewrite `info.html` to output the Callout markup (same four types, same call syntax, so posts don't change). Override `figure` with `figure.fk-figure`. Add `diagram.html` per `components/Diagram/README.md`.
5. D2: copy `design/d2/_theme.d2` and `design/d2/fonts/` to `assets/d2/`, and `design/scripts/render-diagrams.sh` to `scripts/`. Add a test diagram to a draft post from `design/d2/example-bootstrap.d2`, render it, and check it recolours in both themes.
6. Talks and Projects: render TalkCards from `data/portfolio.yml`. Add a `data/projects.yml` for ProjectCards (name, url, domain, description). The ElvenXCEL description is a placeholder for me to fill in.
7. Content data: move each talk's "Get the slides" link out of `description` into a `slides:` field in `data/portfolio.yml`.
8. Table of contents (not in the design system yet): for posts with `toc: true`, render `.TableOfContents` above the prose at `measure` width, in `body-sm`, links in `ink-muted`, the current section highlighted with `accent-subtle`. Keep it minimal and show me before polishing.
9. Remove the old `assets/css/custom.css`, `components.css` and `copy-code.js`, and the Font Awesome dependency. Inline Lucide or Simple Icons SVGs from `design/assets/icons/` through a partial, e.g. `partial "icon" "rss"`.

## Done means

- `hugo --minify` builds with no warnings, and `./scripts/render-diagrams.sh` runs clean.
- Every page type above renders, side by side with the matching preview, in light and dark at 1280px and 375px wide.
- All existing posts render; spot-check the ones with `info`, `figure` and `toc`.
- No colour or size literals outside `tokens.css`, and no Google Fonts or Font Awesome requests (check the network tab).
- Lighthouse accessibility 100 on home and on one post.
- A short write-up of anything that didn't fit the design system, so it can be fed back into it.
