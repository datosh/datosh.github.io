# ArticleHeader

The top of every post: date and reading time, title, description as lede, tags, then the cover at wide width.

## Markup the consumer provides
- `header.fk-article-head` inside `.fk-container`; text block in `.fk-measure` centred.
- `p.fk-article-head__meta.caption` with a `<time>` and reading time, separated by a middle dot.
- `h1.fk-article-head__title.title-1` (balanced wrapping), `p.fk-article-head__lede.lede` from `Description`, then `ul.fk-tags`.
- `img.fk-article-cover` from `thumbnail`, at `width-wide`, radius `radius-xl`, decorative `alt=""`.

## Rules
- Text column is `measure` (680px); the cover breaks out to `width-wide` (980px).
- Below 640px the title drops to 32px/38px and the cover radius to `radius-lg`.
- Series posts (home lab) may add a series line above the meta in `eyebrow`, e.g. "KUBERNETES HOME LAB · PART 1".
