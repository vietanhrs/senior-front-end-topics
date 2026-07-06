# CSS containment

## The idea

`contain` (and its higher-level cousin `content-visibility`) lets you **promise the browser that a
subtree is independent** of the rest of the page. With that promise, the browser can **scope
layout, paint, and style work to the subtree** instead of re-evaluating the whole document — and
can even **skip work entirely** for off-screen content.

It's a manual optimization for the engine's two biggest costs: layout and paint.

## The `contain` property

`contain` accepts one or more values:

| Value | Promise to the browser | Effect |
|---|---|---|
| `layout` | The subtree's internal layout doesn't affect the outside (and vice-versa) | Reflows inside don't escape; the element becomes a layout boundary |
| `paint` | Descendants don't paint outside the element's box | Clips painting; offscreen subtree paint can be skipped; creates a containing block & stacking context |
| `size` | The element's size doesn't depend on its descendants | Browser can lay it out without measuring children (you must give it a size) |
| `style` | Certain style effects (counters) don't escape | Scopes counter/quotes |
| `strict` | = `size layout paint style` | Strongest isolation |
| `content` | = `layout paint style` (no `size`) | Common, safe default for self-contained widgets |

```css
/* A card/list-row whose internals never affect outside layout/paint */
.widget { contain: content; }
```

The payoff: when something changes **inside** a contained element, the browser knows it can't
affect siblings/ancestors, so it limits the dirty region — smaller layout/paint, less work.

## `content-visibility: auto` — skip offscreen rendering

This is the high-impact one for long pages/lists. `content-visibility: auto` tells the browser to
**skip rendering (layout + paint) of an element while it's off-screen**, rendering it just-in-time
as it approaches the viewport. It implies containment.

```css
.row {
  content-visibility: auto;
  contain-intrinsic-size: auto 48px;  /* placeholder size so the scrollbar is correct */
}
```

- **`contain-intrinsic-size`** gives the browser a size estimate for the not-yet-rendered content,
  so the scrollbar and layout don't jump as items render/un-render. Use `auto <size>` so the
  browser remembers the last real size.
- Result: a 10k-row list only lays out/paints the ~visible rows → dramatically faster initial
  render and smoother scroll, with **no virtualization library**.

### vs virtualization (windowing)
Virtualization (react-window/virtuoso) removes off-screen rows from the **DOM**.
`content-visibility` keeps them in the DOM but skips their **rendering**. Virtualization saves
DOM/memory and is better for huge lists; `content-visibility` is far simpler and great for
moderately long content (articles, comment threads). They can be combined.

## Gotchas

- `contain: size` (and `content-visibility` via intrinsic size) requires a sensible size or the
  element can collapse to 0 — always pair with `contain-intrinsic-size`.
- `contain: paint`/`content-visibility` create a **stacking context & containing block**, which
  can affect `position: fixed` descendants and `z-index`.
- Content skipped by `content-visibility: auto` isn't found by in-page **Ctrl+F** until rendered
  (browsers handle find-in-page by forcing render, but anchor scrolling/`:target` can surprise).
- Accessibility: skipped subtrees are still in the a11y tree; but measure that focus/scroll-to
  works.

## Senior checklist

- `contain` scopes layout/paint/style to a subtree (`content` = safe default for widgets).
- `content-visibility: auto` + `contain-intrinsic-size` skips offscreen rendering — huge win for long lists.
- It complements (doesn't replace) virtualization; virtualization removes DOM, containment skips render.
- Beware: creates stacking/containing contexts; always set an intrinsic size.

## Angular equivalent

Angular apps usually pair containment with CDK virtual scroll, @defer, and OnPush/signals. The React-window/virtuoso lesson maps to cdk-virtual-scroll-viewport: remove off-screen DOM first, then use CSS containment to limit the remaining layout/paint blast radius.

## References

- [MDN: contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain)
- [web.dev: content-visibility](https://web.dev/articles/content-visibility)
- [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)
- [MDN: contain-intrinsic-size](https://developer.mozilla.org/en-US/docs/Web/CSS/contain-intrinsic-size)
