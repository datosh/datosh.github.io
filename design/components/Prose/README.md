# Prose

Rendered Markdown inside a post: paragraphs, h2/h3, links, lists, quotes, tables, inline code and horizontal rules.

## Markup the consumer provides
- Wrap `.Content` in `div.fk-prose.body`. The `body` type style sets size, leading and family for everything inside.
- Headings get their type class from a Hugo heading render hook (`layouts/_default/_markup/render-heading.html`): h2 → `title-2`, h3 → `title-3`, h4 → `headline`, each followed by `a.fk-anchor` "#".
- Children sit at `measure` (680px). A child with `.fk-wide` (wide code, diagrams, figures) breaks out to `width-wide`.

## Rules
- Paragraph spacing `space-5`; space above h2 `space-7`, above h3 `space-6`.
- In-text links are `accent` with a 1px underline at 35% strength, full strength on hover. Never bold a link.
- Inline code: `code-inline` style on `code-bg`, `radius-xs`.
- Blockquotes are `ink-muted` with a 2px `hairline` rule, not italic.
- Tables: header rule in `ink-faint`, row rules in `hairline`, tabular figures; wrap scrolls horizontally on mobile.
- Write in British English, first person plural for walkthroughs ("we explore"), first person singular for opinion ("I would disagree").
