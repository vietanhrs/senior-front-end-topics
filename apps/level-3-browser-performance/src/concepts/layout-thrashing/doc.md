# Layout thrashing

## The one-sentence definition

**Layout thrashing** (a.k.a. *forced synchronous layout* or *reflow thrashing*) is when JS
**repeatedly interleaves DOM reads and writes**, forcing the browser to recompute layout many
times in a single frame instead of once. It's one of the most common causes of jank that
profilers blame on "Recalculate Style / Layout".

## Why it happens: the read/write feedback loop

The browser is lazy about layout. When you **mutate** the DOM/styles, it marks the layout as
*dirty* but defers the actual recalculation. When you **read** a geometric property, the browser
must return an up-to-date answer — so if the layout is dirty, it **synchronously recomputes it
right then** ("forced reflow").

If your code does `write → read → write → read …`, every read forces a full layout:

```js
// ❌ Thrashing: each iteration invalidates layout, then forces it again
for (const el of boxes) {
  el.style.width = el.offsetWidth + 10 + 'px'; // read offsetWidth (forces layout)
  // ...the next write dirties layout, next read forces it again → O(n) reflows
}
```

`n` elements → up to `n` forced layouts in one frame → the frame blows past 16.7ms → dropped frames.

## The fix: batch reads, then writes

Separate the phases so layout is computed **once**: read everything first (against the clean
layout from last frame), then write everything (which only dirties layout once, recomputed at the
next natural point).

```js
// ✔ Batched: one read pass, one write pass
const widths = boxes.map((el) => el.offsetWidth);   // all reads (one layout at most)
boxes.forEach((el, i) => {                            // all writes
  el.style.width = widths[i] + 10 + 'px';
});
```

This is the idea behind **FastDOM** and `requestAnimationFrame`-based read/write scheduling.

## Properties that trigger a forced layout when read

Reading any of these on a dirty tree forces a synchronous reflow:

| Category | Examples |
|---|---|
| Element box metrics | `offsetTop/Left/Width/Height`, `clientWidth/Height`, `scrollWidth/Height`, `scrollTop/Left` |
| Geometry APIs | `getBoundingClientRect()`, `getClientRects()` |
| Computed style (some) | `getComputedStyle(el)` then reading layout-affected props |
| Scroll/focus side effects | `scrollIntoView()`, `el.focus()` (can scroll), `innerText` (forces layout) |
| Window metrics | `window.innerWidth/Height` (cheap), `scrollX/Y` |

> Mnemonic: anything that asks "where/how big is it *right now*?" forces the browser to settle
> pending layout.

## Diagnosing it

- **Performance panel**: long purple "Layout" bars, "Recalculate Style", and the warning
  **"Forced reflow is a likely performance bottleneck"**.
- Look for the classic shape: many small layout events within one task, instead of one.
- React-specific: `useLayoutEffect` that measures then mutates then measures across components can
  thrash; libraries reading geometry in loops (auto-resize textareas, masonry) are usual suspects.

## Beyond batching

- **Cache** geometry you'll reuse instead of re-reading.
- **Avoid reading layout in scroll/resize handlers** without throttling (and read before writing).
- Use **`ResizeObserver`/`IntersectionObserver`** instead of polling `getBoundingClientRect`.
- Animate with **transform/opacity** (composite-only) so there's no layout to force at all.
- For unavoidable measure-then-mutate, schedule writes in `requestAnimationFrame` after a read pass.

## Senior checklist

- Reads on a dirty layout force synchronous reflow; interleaving read/write multiplies it.
- Batch: one read phase, then one write phase (FastDOM pattern).
- Know the list of layout-forcing properties cold (`offset*`, `getBoundingClientRect`, `scroll*`…).
- Prefer observers and transform/opacity animations to sidestep layout entirely.

## References

- [Google: Avoid forced synchronous layouts](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- [Paul Irish: What forces layout/reflow (gist)](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
- [FastDOM](https://github.com/wilsonpage/fastdom)
- [MDN: Reflow / performance](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work)
