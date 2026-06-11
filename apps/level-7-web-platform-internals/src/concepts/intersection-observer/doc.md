# IntersectionObserver internals

## Why it exists

Before `IntersectionObserver` (IO), "is this element visible?" meant calling
`getBoundingClientRect()` in a `scroll` handler — synchronous layout reads on every scroll event,
the textbook cause of jank (Level 3 — layout thrashing). IO answers visibility **asynchronously,
off the main thread's critical path**, batching results and delivering them via a callback. It
powers lazy-loading, infinite scroll, ad/impression tracking, sticky/scroll-spy UIs, and
`visible`-triggered hydration (earlier in this level).

```js
const io = new IntersectionObserver(callback, {
  root: scrollContainer,   // null = the viewport
  rootMargin: '0px 0px 200px 0px',  // grow/shrink the root's bounds (preload below the fold)
  threshold: [0, 0.5, 1],  // fire when crossing 0%, 50%, 100% visible
});
io.observe(target);
```

## The mechanics that trip people up

### It's asynchronous & batched
The callback runs **after** layout, asynchronously (not synchronously when visibility changes), and
receives an **array of entries** — all targets that changed since the last delivery, coalesced. Don't
assume one entry per call, and don't expect pixel-perfect timing; it's "intersection observed",
not "scroll position now".

### `isIntersecting` vs `intersectionRatio`
- `entry.isIntersecting` — boolean: did it cross *into* (or out of) the intersecting state.
- `entry.intersectionRatio` — fraction (0–1) of the target that's visible **within the root**.
- `threshold` is the set of ratio boundaries that trigger a callback. `threshold: 0` fires when any
  pixel enters/leaves; `threshold: 1` only when fully visible; an array fires at each crossing. Note
  a target larger than the root can never reach ratio `1` — choose thresholds accordingly.

### The first callback fires immediately(ish)
On `observe()`, IO schedules an **initial** callback with the current state — so you learn the
starting visibility without waiting for a scroll. Handle that initial entry (e.g. an already-visible
target should lazy-load right away).

### `rootMargin`
A CSS-margin-like string that **expands or contracts** the root's rectangle before intersection is
computed. `rootMargin: '0px 0px 300px 0px'` makes targets count as "intersecting" 300px *before*
they enter the viewport — the standard **preload-ahead** trick for lazy images. Negative margins
shrink it (e.g. trigger only when an element is well inside). With `root: null`, percentages aren't
allowed in older specs — use pixel values.

### `root` and the entry geometry
`entry.rootBounds`, `boundingClientRect`, and `intersectionRect` give the measured rectangles for
free (already computed) — use them instead of calling `getBoundingClientRect()` yourself.

## Lifecycle & cost

- One observer can watch **many** targets efficiently — prefer a single shared observer over one
  per element.
- `unobserve(target)` for one, `disconnect()` for all; **always disconnect on cleanup** (effect
  return / `disconnectedCallback`) or you leak the observer and its target refs.
- For "do something once when first seen" (lazy-load), `unobserve` the target inside the callback so
  it doesn't keep firing.
- `takeRecords()` synchronously drains pending entries (rarely needed).

## Related observers

`IntersectionObserver` (visibility) is one of a family with `ResizeObserver` (size — next concept)
and `MutationObserver` (DOM changes). All are async, batched, and must be disconnected.

## Senior checklist

- IO replaces scroll-handler `getBoundingClientRect` — async, batched, off the jank path.
- Callback gets an **array** of entries + the initial state on `observe`; use `isIntersecting` vs `intersectionRatio` correctly.
- `threshold` sets the ratio crossings; `rootMargin` expands/contracts the root (preload-ahead); read geometry from the entry, don't re-measure.
- One observer, many targets; `unobserve` after first hit for lazy-load; always `disconnect()` on cleanup.

## References

- [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [MDN: IntersectionObserver.rootMargin / threshold](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver)
- [web.dev: Lazy-load images with IntersectionObserver](https://web.dev/articles/lazy-loading-images)
- [w3c: Intersection Observer spec](https://w3c.github.io/IntersectionObserver/)
