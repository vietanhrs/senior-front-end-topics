# Time slicing

## What it is

**Time slicing** is the scheduling technique that lets React render a large update **in small
chunks spread across multiple frames**, yielding control back to the browser between chunks.
Instead of one long, blocking task that freezes the page, the render is sliced so the main
thread stays free to handle input, paint, and animations.

It's a direct consequence of **Fiber** (interruptible units of work) and is what makes
**concurrent rendering** feel smooth.

## The problem it solves: long tasks

The browser's main thread does everything: JS, layout, paint, event handling. A render that
takes 200ms is a **long task** — for those 200ms the page can't respond to clicks, can't run
JS-driven animations, and input feels frozen. Anything over ~50ms is perceptible jank.

Legacy (synchronous) React rendered an entire update in one task. Time slicing breaks it up:

```
Synchronous (blocking):
  │■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■│   ← one 200ms task, browser frozen
  ▲ click ignored, animation stalls

Time-sliced (concurrent):
  │■■■■│ │■■■■│ │■■■■│ │■■■■│ ...     ← ~5ms slices, browser breathes between
        ▲ paint  ▲ handle input   ▲ animation frame runs
```

## How React decides to yield

React renders work units (fibers) in a loop and periodically checks a "should I yield?" signal
(roughly every 5ms). If the time budget for the frame is used up — or a higher-priority update
arrives — React **pauses**, lets the browser do its thing, and **resumes** (or restarts) later.
Under the hood it yields via a `MessageChannel`-based scheduler (a macrotask), not by blocking.

> Key limitation: only the **render phase** is sliceable. The **commit phase** (applying DOM
> mutations) is synchronous and atomic. So slicing helps when the *render* is expensive (lots of
> components/computation); it can't slice the insertion of tens of thousands of DOM nodes — for
> that you still need **virtualization**.

## You opt in via priority, not a "slice" API

There's no `slice()` call. You get time slicing by marking work as non-urgent so React renders
it concurrently:

```tsx
startTransition(() => setBigState(next)); // this render can be time-sliced & interrupted
const deferred = useDeferredValue(value);  // renders driven by `deferred` are low priority
```

Urgent updates (default `setState` from a click/keystroke) are **not** sliced — they render
synchronously so they feel instant. That's intentional.

## Senior checklist

- Time slicing = render an update in ~5ms chunks across frames, yielding to the browser between.
- Enabled by Fiber's interruptibility; you opt in via transitions / deferred values.
- Only the render phase is sliceable; commit is atomic — huge DOM still needs virtualization.
- It makes work **non-blocking**, not faster — combine with memoization/virtualization for big lists.

## References

- [React 18: time slicing / concurrent features](https://react.dev/blog/2022/03/29/react-v18)
- [web.dev: Long tasks & the main thread](https://web.dev/articles/long-tasks-devtools)
- [scheduler package (React)](https://github.com/facebook/react/tree/main/packages/scheduler)
- [React: useTransition](https://react.dev/reference/react/useTransition)
