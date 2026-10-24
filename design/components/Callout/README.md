# Callout

An aside inside a post, one of four kinds, replacing the existing `{{< info >}}` shortcode one to one: `info`, `note`, `tip`, `warn`.

## Markup the consumer provides
- `aside.fk-callout.fk-callout--<kind>.body-sm` with `role="note"`, containing a Lucide icon (`.fk-callout__icon`), `p.fk-callout__label`, and `.fk-callout__body` with the markdownified inner content.
- Icons: info → `info`, note → `pencil-line`, tip → `lightbulb`, warn → `triangle-alert`.
- The label is the kind in sentence case: "Info", "Note", "Tip", "Warn". Keep the word: colour alone never carries the meaning.

## Tokens
| kind | ground | icon + label |
| --- | --- | --- |
| info | `callout-info-bg` | `callout-info-ink` |
| note | `callout-note-bg` | `callout-note-ink` |
| tip | `callout-tip-bg` | `callout-tip-ink` |
| warn | `callout-warn-bg` | `callout-warn-ink` |

Body text is always `ink`. Inline code inside a callout sits on `surface` so it stays visible on the tint.

## Do / don't
- Use sparingly: one or two per post. If everything is a callout, nothing is.
- No coloured side border, no header strip; the tint and icon are enough.
- Warn is orange, not red, so it never reads as an error state and stays distinct from tip for red-green colour blindness.
