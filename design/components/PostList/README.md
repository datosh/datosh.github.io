# PostList

The post index and the home page's "Latest posts": one row per post, newest first, with the cover as a small thumbnail.

## Markup the consumer provides
- `ul.fk-postlist > li.fk-postrow > a` wrapping `.fk-postrow__text` and `img.fk-postrow__thumb`.
- Text: `p.fk-postrow__date.caption` ("11 October 2026 · 6 min read"), `h3.fk-postrow__title.headline`, `p.fk-postrow__desc.body-sm` from front matter `Description`.
- Thumbnail: the post's `thumbnail` (12:5, the existing 1536×640 covers), decorative so `alt=""`. Omit the `img` when a post has none; the grid keeps its column.
- Optional `.fk-section-head` above with a `title-2` heading and an arrow link.

## Rules
- Dates are written out: "11 October 2026", British order. Reading time is `.ReadingTime` minutes.
- Rows are separated by `hairline` rules, no cards: lists should read like a table of contents.
- If `Description` is empty (some home-lab posts), drop the paragraph rather than falling back to the auto summary.
- Hover tints only the title to `accent`.
