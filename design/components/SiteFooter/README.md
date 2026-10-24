# SiteFooter

The bottom of every page: copyright line left, social icon links right.

## Markup the consumer provides
- `footer.fk-footer > .fk-container.fk-footer__inner` with `p.caption` "© 2020–2026 Fabian Kammel" (end year from `now.Year`) and `.fk-footer__social` holding `fk-icon-btn` links: GitHub, LinkedIn, Bluesky, RSS.
- Each icon link needs an `aria-label` with the service name.

## Rules
- `hairline` top rule, text in `ink-muted`, icons 15px.
- Nothing else: no newsletter box, no tag cloud, no "made with" badge.
