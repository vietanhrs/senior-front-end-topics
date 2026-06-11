# Long Tasks API

## What a "long task" is

A **long task** is any task that occupies the main thread for **more than 50 ms**. While it runs,
the thread can do **nothing else** — no input handling, no animation, no painting. Long tasks are the
*root cause* behind the input-delay portion of FID/INP and behind dropped animation frames. The
**Long Tasks API** surfaces them as `longtask` performance entries.

## Why 50 ms?

From the **RAIL** model: to feel instant, you should respond to input within **100 ms**. But a task
already executing can't be interrupted — if a 70 ms task starts the instant before a tap, the tap
waits ~70 ms before its handler even begins. Capping tasks at **50 ms** leaves headroom to respond
within the 100 ms budget even in the worst case. Anything longer risks visible unresponsiveness.

```js
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // entry.duration (ms), entry.startTime, entry.attribution[0] (where it came from)
    report('longtask', entry.duration);
  }
}).observe({ type: 'longtask', buffered: true });
```

## Total Blocking Time (TBT)

The lab metric built on long tasks: **TBT** = the sum of the **blocking portion** (everything over
50 ms) of all long tasks between First Contentful Paint and interactivity:

```
blocking time of a task = max(0, duration − 50)
TBT = Σ blocking time   (between FCP and TTI)
```

A 300 ms task contributes **250 ms** of blocking; six 40 ms tasks contribute **0**. TBT is the lab
proxy that correlates with field **INP** — improving TBT (fewer/shorter long tasks) is how you
improve INP in the lab.

## Attribution & the newer LoAF API

`longtask` tells you a task was long and roughly which `<iframe>`/container caused it, but **not which
function**. The newer **Long Animation Frames API** (`long-animation-frame`) gives far richer
attribution: the scripts that ran, their source URLs, durations, and the frame's
render/style/layout breakdown — much better for *finding* the culprit.

## Fixing long tasks

This is the level-8 yielding story applied to metrics:

- **Break work into chunks** under 50 ms, separated by `await scheduler.yield()` / a macrotask, so
  input and rendering can interleave.
- **Move CPU work to a Web Worker** — the main thread stays free entirely.
- **`scheduler.postTask`** with priorities; **`isInputPending()`** to bail early.
- **Code-split & defer** so boot doesn't run as one giant task; **hydrate less** (islands).
- **Memoize/virtualize** expensive renders so a single update isn't a long task.

## Senior checklist

- Long task = main thread busy > 50 ms → blocks input, animation, paint; the 50 ms threshold comes
  from the 100 ms RAIL response budget.
- **TBT = Σ max(0, duration − 50)** is the lab proxy for field **INP**; reduce it by removing/splitting
  long tasks.
- Read `longtask` entries for *that a task was long*; use **`long-animation-frame`** (LoAF) for
  *which script* caused it.
- Fix by chunking + yielding, workers, code-splitting, and cheaper renders.

## References

- [MDN: Long Tasks API / PerformanceLongTaskTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming)
- [web.dev: Total Blocking Time (TBT)](https://web.dev/articles/tbt)
- [web.dev: Long Animation Frames API](https://web.dev/articles/loaf)
- [web.dev: Optimize long tasks](https://web.dev/articles/optimize-long-tasks)
