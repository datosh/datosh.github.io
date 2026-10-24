# TalkCard

One conference talk, rendered from an entry in `data/portfolio.yml`: venue and date, title, a short abstract, recording and slides.

## Markup the consumer provides
- `article.fk-card.fk-talk` > `img.fk-card__media` (the event image at 16:9) + `.fk-card__body`:
  - `p.fk-card__eyebrow.eyebrow`: `venue · date` (date is the first `authors` entry, e.g. "November 2025").
  - `h3.fk-card__title.title-3`: `name`.
  - `p.fk-card__desc.body-sm`: the first sentence or two of `description`, clamped to three lines. The full abstract lives on the talk's own page or behind the recording.
  - `.fk-card__foot`: primary "Watch" (`link`) and secondary "Slides" (the slides link currently inside `description`; move it to its own `slides:` field).
- Grid: `.fk-grid.fk-grid--2`, newest first.

## Rules
- Co-speakers go in the eyebrow after the venue ("with Kevin Ward"), not in the title.
- Workshops keep "3h Workshop:" out of the title; put "Workshop" as a tag.
- Event images are third-party conference art; keep them, they carry the recognition.
