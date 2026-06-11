# Cumulative Layout Shift (CLS)

## What CLS measures

**CLS** quantifies **visual stability** — how much visible content **jumps around unexpectedly**.
You've felt it: you go to tap a button, an image or ad loads above it, everything shifts, and you tap
the wrong thing. CLS is a Core Web Vital. **Good ≤ 0.1**, "needs improvement" ≤ 0.25, **poor > 0.25**.

It is **unitless**. Each *layout shift* gets a score:

```
layout shift score = impact fraction × distance fraction
```

- **Impact fraction** — how much of the viewport the unstable (moving) elements cover.
- **Distance fraction** — how far they moved, as a fraction of the viewport's largest dimension.

## Session windows (not a naive sum)

CLS is **not** the sum of *all* shifts over the page's life. It's the **largest burst**: shifts are
grouped into **session windows** (a window extends while shifts are ≤ 1 s apart, capped at 5 s
total). CLS = the **maximum window's** summed score. This stops a long-lived page from accumulating an
unfairly huge number.

## The input-exclusion rule (a senior gotcha)

Shifts that happen **within 500 ms of a user interaction** are flagged `hadRecentInput = true` and
**excluded** from CLS — because a shift you *caused* (opening an accordion, clicking "load more") is
expected, not janky. So:

- A banner that appears **right after** you click → excluded (expected).
- A banner that appears **800 ms later** because an ad/image finally loaded → **counted** (you didn't
  ask for it). This is why measuring CLS requires *non-input* shifts.

```js
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (e.hadRecentInput) continue;   // ignore shifts near user input
    cls += e.value;                   // (within the current session window)
  }
}).observe({ type: 'layout-shift', buffered: true });
```

## Common causes & fixes

| Cause | Fix |
|---|---|
| Images/video without dimensions | set `width`/`height` or `aspect-ratio` so space is reserved |
| Ads / embeds / iframes | reserve a min-height slot up front |
| Web fonts (FOUT/FOIT swap) | `font-display: optional`/`swap` + `size-adjust`/preload to match metrics |
| Late-injected content above the fold | don't insert above existing content (except in response to input); reserve space |
| Animating layout properties (`top`, `height`) | animate `transform`/`opacity` (compositor-only — no layout) |

The golden rule: **reserve space before content arrives**, and only shift things as a *direct
result of user interaction*.

## Senior checklist

- CLS = visual stability; score = impact × distance, summed within the **worst session window**
  (≤ 1 s gaps, ≤ 5 s), good ≤ 0.1.
- Shifts within 500 ms of input are excluded (`hadRecentInput`) — so the dangerous shifts are the
  **async** ones (images, ads, fonts).
- Reserve space (`width`/`height`, `aspect-ratio`, min-height slots); fix font swap; never inject
  above-the-fold content unprompted.
- Animate with `transform`/`opacity`, not layout-affecting properties.

## References

- [web.dev: Cumulative Layout Shift (CLS)](https://web.dev/articles/cls)
- [web.dev: Optimize CLS](https://web.dev/articles/optimize-cls)
- [web.dev: Evolving CLS — session windows](https://web.dev/articles/evolving-cls)
- [MDN: LayoutShift](https://developer.mozilla.org/en-US/docs/Web/API/LayoutShift)
