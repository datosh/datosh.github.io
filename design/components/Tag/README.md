# Tag

Quiet pills for post tags and talk topics; links to the tag's list page.

## Markup the consumer provides
- `ul.fk-tags.ui > li > a.fk-tag` per tag. A non-link pill (talk topics with no page) is `span.fk-tag`.

## Rules
- Fill `surface-subtle`, text `ink-muted`; hover turns `accent-subtle` / `accent`.
- Show tags in lower case as written in front matter. Talk topics from `portfolio.yml` keep their own case.
- At most five on a card; the article header shows all.
