# First Input Delay (FID)

## What FID measured

**First Input Delay** measured the time from a user's **first** interaction (click, tap, or key
press — *not* scroll/zoom) to the moment the browser could **begin running that event's handler**. It
captured one specific thing: **input delay** — how long the input sat queued because the **main
thread was busy** (parsing/executing JS, long tasks) and couldn't get to the event.

```
user taps ───┐
             │  ← FID = this gap (main thread busy with other work)
             ▼
   event handler starts running
```

Crucially, FID measured **only the delay**, *not*:
- the time your handler takes to run (processing), nor
- the time to paint the resulting UI (presentation).

A click that waited 10 ms but then ran a 500 ms handler scored a *great* FID of 10 ms — while feeling
terrible. **Good FID ≤ 100 ms**, "needs improvement" ≤ 300 ms.

## Why it's deprecated (→ INP)

FID had two big blind spots:
- **Only the first interaction** — not representative of a whole session.
- **Only the delay** — ignored handler cost and rendering, the parts users actually feel.

So in **March 2024, FID was replaced by INP** (Interaction to Next Paint) as a Core Web Vital. INP
fixes both: it measures *all* interactions and the *full* latency (delay + processing + next paint).
FID is still worth understanding — it isolates the "main thread was too busy to even start" failure
mode, which is a real and distinct problem (heavy hydration, long boot tasks).

## Measuring it (the real API)

FID comes from the **Event Timing API** via the `first-input` entry type:

```js
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const fid = entry.processingStart - entry.startTime; // delay only
    report('FID', fid);
  }
}).observe({ type: 'first-input', buffered: true }); // buffered: catch it even if it already fired
```

`startTime` = when the input happened; `processingStart` = when the handler began. The difference is
the delay. (The same `event` entries power INP — see the next concept.)

## How to improve input delay

- **Break up long tasks** (the level-8 starvation/yielding story): less main-thread blocking → less
  queued input.
- **Defer / code-split** non-critical JS so boot doesn't monopolize the thread.
- **Hydrate less / later** (islands, partial hydration — level 7).
- **Move heavy work off-thread** (workers) so the main thread stays free to dispatch input.

## Senior checklist

- FID = **input delay only** of the **first** interaction (queued time because the main thread was
  busy); it ignores handler + paint cost.
- Good ≤ 100 ms; it's a **field** metric (needs a real user interaction — lab tools can't synthesize
  it).
- **Replaced by INP** (March 2024) because it covered too little; still useful as the "thread too
  busy to start" signal.
- Read it from the `first-input` Event Timing entry (`processingStart − startTime`), with
  `buffered: true`.

## References

- [web.dev: First Input Delay (FID)](https://web.dev/articles/fid)
- [web.dev: FID is being replaced by INP](https://web.dev/blog/inp-cwv-march-2024)
- [MDN: Event Timing API / first-input](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming)
- [web.dev: Optimize long tasks](https://web.dev/articles/optimize-long-tasks)
