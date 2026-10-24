# SiteHeader

The sticky top bar on every page: wordmark left, the three sections, then RSS and the theme toggle.

## Markup the consumer provides
- `header.fk-header > .fk-container.fk-header__inner`.
- Wordmark: `a.fk-wordmark.headline` with the text **Fabian Kammel**, linking home. No logo mark exists; the name in `headline` is the mark.
- Nav: `nav.fk-nav.ui` with exactly three links, **Posts**, **Talks**, **Projects**. Mark the current section with `aria-current="page"` (it turns from `ink-muted` to `ink`).
- Tools: `a.fk-icon-btn` for RSS and `button.fk-icon-btn.fk-theme-toggle` holding both a `fk-icon--sun` and a `fk-icon--moon` Lucide icon; CSS shows the right one per theme.

## Behaviour
- Height is `header-height` (52px); fill is `surface-glass` with `backdrop-filter: saturate(180%) blur(20px)`; a 1px `hairline` bottom edge.
- The theme toggle writes `data-theme="light|dark"` on `<html>` and stores the choice in `localStorage`. With nothing stored, follow `prefers-color-scheme`. Set the attribute in an inline script in `<head>` before CSS paints, so there is no flash.
- Headings use `scroll-margin-top` so anchors land below the bar.

## Do / don't
- Do keep the nav to three items. Side projects live on **Projects**, not in a dropdown.
- Don't add a search box or social icons here; social links belong in the footer and home hero.
- Don't put the header on a coloured fill; it is always glass.
