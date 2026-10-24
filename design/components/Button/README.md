# Button

Pill-shaped actions in three weights: primary fill, secondary tint, and the chevron arrow link.

## Markup the consumer provides
- `a.fk-btn.fk-btn--primary.ui` or `.fk-btn--secondary`; add `.fk-btn--sm` for 30px height. Optional leading Lucide icon with `fk-icon fk-icon--sm`.
- Arrow link: `a.fk-arrow-link` + text + a `chevron-right` icon. Used for "All posts", "All talks", "Read more".

## Tokens
- Primary: `accent-fill` under `on-accent`; hover `accent-fill-hover`.
- Secondary: `accent-subtle` under `accent`; hover text `accent-hover`.
- Radius `radius-pill`, height 36px, horizontal padding `space-4`.

## Do / don't
- One primary per view at most. On a talk card that is "Watch the recording"; "Get the slides" is secondary.
- Labels are sentence case verbs: "Watch the recording", never "WATCH" or "Click here".
- Don't use buttons for in-prose links; those are plain underlined links.
