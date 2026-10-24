# HomeHero

The first thing on the home page: portrait, name in `display`, one sentence, social links.

## Markup the consumer provides
- `section.fk-hero` inside `.fk-container`.
- `img.fk-hero__portrait`: the profile photo (asset `Images/profile.jpg`), square source, shown as a 96px circle. Alt text "Portrait of Fabian Kammel".
- `h1.fk-hero__name.display`: the name, exactly "Fabian Kammel".
- `p.fk-hero__lede.lede`: one or two sentences, `ink-muted`, max 600px. Today's site description ("Software Engineering, Security, and Cloud Native Technologies") is the seed.
- `.fk-hero__social`: `fk-icon-btn` links for GitHub, LinkedIn, Bluesky and RSS, in that order.

## Rules
- Padding is `space-10` top and `space-9` bottom on desktop, `space-8` on mobile. The emptiness is the point; don't fill it.
- Below 640px swap `display` for `title-1`.
- No background image, gradient or animated text.
