# Task starvation

## What starvation is

**Starvation** is when runnable work never gets to run because something else keeps monopolizing the
processing resource. On the web that resource is usually the **main thread** and its queues. A task
is *starved* when higher-priority or higher-frequency work is always ahead of it, so it's
perpetually deferred — the UI stops painting, input handlers don't fire, timers drift.

This is distinct from a single long task (which blocks once): starvation is a *structural* problem
where the scheduler's ordering rules keep one class of work permanently behind another.

## The classic JS trap: microtask starvation

The event loop drains the **entire microtask queue** between macrotasks and before each render. If a
microtask schedules another microtask, that new one is processed **in the same drain** — so a
self-replenishing microtask chain runs to completion before *any* timer, *any* input handler, or
*any* paint:

```js
function flood(n) {
  if (n <= 0) return;
  doWork();
  Promise.resolve().then(() => flood(n - 1)); // re-queues within the same microtask checkpoint
}
flood(100000); // freezes the page: timers, rendering, and input all starve
```

Because rendering and macrotasks sit *behind* the microtask checkpoint, the heartbeat
`setInterval`, the next `requestAnimationFrame`, and the browser's paint are all starved until the
chain empties. The same work split across **macrotasks** (`setTimeout`) or yielded with
`scheduler.yield()` interleaves with everything else and starves nothing.

## Other starvation shapes

- **rAF starvation:** doing heavy work in every `requestAnimationFrame` and re-scheduling means the
  frame budget is always consumed by you; lower-priority idle work (`requestIdleCallback`) never
  gets time — its callbacks are *only* invoked when the frame has spare time.
- **Priority-queue starvation:** a scheduler that always runs the highest-priority lane (React's
  lanes, OS threads) can starve low-priority work forever unless it has **aging** / **expiration**
  (React expires a stalled transition and forces it to flush — see scheduler internals).
- **I/O / stream starvation:** a fast producer that never yields starves consumers reading from the
  same loop (see backpressure).

## How to avoid it

- **Yield.** Break long work into chunks separated by a macrotask or `await scheduler.yield()` /
  `await new Promise(r => setTimeout(r))`, so the browser can paint and run input between chunks.
- **Don't self-replenish microtasks** for heavy work — use them only for short continuations.
- **Use the right priority primitive:** `scheduler.postTask({ priority })`,
  `requestIdleCallback` for truly background work, transitions for non-urgent React updates.
- **Add fairness/aging** to any custom priority queue so low-priority items eventually run.

## Senior checklist

- Starvation = ordering rules keep a class of work permanently deferred, not a one-off long task.
- Microtask checkpoints drain fully (including microtasks queued during the drain) before macrotasks
  & paint → a self-replenishing microtask chain starves the whole UI.
- Split heavy work across macrotasks / `scheduler.yield()`; reserve microtasks for short
  continuations.
- Any priority scheduler needs aging/expiration or the lowest lane starves forever.

## Angular equivalent

Angular can starve just like React if microtasks or high-priority stream emissions continually enqueue more work. Break chains with macrotask/rAF boundaries, throttle/debounce noisy Observables, and avoid triggering global change detection for background work.

## References

- [HTML spec: event loop processing model (microtask checkpoint)](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)
- [MDN: Using microtasks / queueMicrotask](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)
- [scheduler.yield()](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield)
- [web.dev: Optimize long tasks](https://web.dev/articles/optimize-long-tasks)
