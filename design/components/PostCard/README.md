# PostCard

A featured post as a card with its full-width cover, for the top of the home page (the latest one or two posts).

## Markup the consumer provides
- `a.fk-card` > `img.fk-card__media` (cover, 12:5) + `.fk-card__body` with `p.fk-card__meta.caption`, `h3.fk-card__title.title-3`, `p.fk-card__desc.body-sm`.
- Lay out one or two in `.fk-grid.fk-grid--2`. Everything older goes in PostList.

## Rules
- Card ground `surface-raised`, radius `radius-lg`, padding `space-5`; no border. Hover lifts 2px with `shadow-hover`.
- Covers keep the existing Nordic art direction (muted greys and blues, single centred subject, no text). They are the only colour on the page besides `accent`; don't add tinted cards to compete.
