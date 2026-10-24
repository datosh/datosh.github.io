# ProjectCard

A side project on the Projects page: name, one sentence, its domain, linking out.

## Markup the consumer provides
- `a.fk-card.fk-project` > `.fk-card__body` with `.fk-project__head` (`h3.fk-card__title.headline` + Lucide `arrow-up-right`), `p.fk-card__desc.body-sm`, `p.fk-project__domain.caption` (bare domain, no scheme).
- Grid: `.fk-grid` (three across on desktop).

## Rules
- No screenshots by default: the cards stay quiet so the posts remain the focus. If a project earns an image, use `fk-card__media` at 12:5.
- The arrow nudges up-right on hover to signal an external link.
- The ElvenXCEL description is a placeholder; replace it with the project's own one-liner.
