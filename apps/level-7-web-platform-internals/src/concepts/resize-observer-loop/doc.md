# ResizeObserver loop limits

## What ResizeObserver gives you

`ResizeObserver` (RO) notifies you when an **element's size** changes — without polling or
listening to window `resize` (which only fires for the viewport). It's the right tool for
container queries done in JS, fitting text, charts that must re-layout, etc.

```js
const ro = new ResizeObserver((entries) => {
  for (const e of entries) {
    const { inlineSize, blockSize } = e.contentBoxSize[0]; // width/height in writing-mode terms
    // react to e.target's new size
  }
});
ro.observe(el, { box: 'content-box' }); // or 'border-box' | 'device-pixel-content-box'
```

## The infamous loop error

> **"ResizeObserver loop completed with undelivered notifications."**

This fires when your RO callback **changes the size of an observed element** (directly or via a
side effect), which schedules **another** resize notification, which runs your callback, which
resizes again… a feedback loop. To prevent an infinite loop within one frame, the spec **bounds RO
to one pass per frame**: if, after delivering notifications, sizes changed *again* (creating
"undelivered" notifications), the browser:

1. delivers what it can this frame,
2. **emits an error** (`ResizeObserver loop limit exceeded` / `…completed with undelivered
   notifications`) to signal the loop, and
3. schedules the remaining work for the **next frame** — so it doesn't hang, but you get a visible
   error and a frame of churn/flicker.

The error is dispatched on `window` (`window.onerror`), **not** catchable inside the callback. In
practice it often comes from libraries (charting, editors) resizing observed nodes in their RO
handler. It's usually benign-looking but indicates wasted layout work and can cause jitter.

## How to avoid the loop

- **Don't synchronously mutate an observed element's size in its own callback.** Read in the
  callback; if you must write a size that affects the observed box, **defer it** to the next frame:

```js
const ro = new ResizeObserver((entries) => {
  requestAnimationFrame(() => {            // break the synchronous loop
    for (const e of entries) applyLayout(e); // safe to mutate now; settles next frame
  });
});
```

- **Observe a different element than the one you resize** (observe the container, resize a child
  that doesn't feed back into the container's measured box).
- **Add hysteresis / equality checks**: skip the write if the new size equals the last applied one,
  so you don't ping-pong on sub-pixel changes.
- **Prefer CSS** where possible: real **container queries** (`container-type`/`@container`) and
  intrinsic sizing solve many "resize then restyle" cases with zero JS and no loop risk.

## The `box` option & entry geometry

- `contentBoxSize` — content area (excludes padding/border).
- `borderBoxSize` — includes padding + border.
- `devicePixelContentBoxSize` — content area in **device pixels** (great for canvas backing stores
  on HiDPI — Level 3 subpixel rendering).
- These are arrays (for fragmentation/multicol). Use `contentRect` (a `DOMRectReadOnly`) for the
  simple case, but the `*BoxSize` arrays are the modern, writing-mode-aware source.

## Senior checklist

- RO observes element size; the loop error means a callback changed an observed element's size → feedback loop, bounded to one pass/frame.
- Fix by deferring size writes to `requestAnimationFrame`, observing a non-feedback element, or adding equality/hysteresis checks.
- Prefer CSS container queries/intrinsic sizing when they can replace measure-then-resize JS.
- Read geometry from `contentBoxSize`/`borderBoxSize`/`devicePixelContentBoxSize`; pick the right `box`. Always `disconnect()`.

## Angular equivalent

Angular directives using ResizeObserver should update signals/state in a scheduled way, often via requestAnimationFrame or render callbacks, and disconnect with DestroyRef. Avoid writing layout-affecting state synchronously inside the observer callback.

## References

- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [w3c: "ResizeObserver loop" explanation](https://github.com/w3c/csswg-drafts/issues/5023)
- [web.dev: ResizeObserver](https://web.dev/articles/resize-observer)
- [MDN: CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
