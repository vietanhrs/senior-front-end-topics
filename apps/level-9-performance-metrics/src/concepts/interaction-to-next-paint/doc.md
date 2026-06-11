# Interaction to Next Paint (INP)

## What INP measures

**INP** is the Core Web Vital (since March 2024, replacing FID) for **responsiveness**. For every
interaction (click/tap/key) it measures the **full** latency — from the input to the **next frame
painted** after the handlers run — and reports a representative **high** value for the whole page
visit (roughly the worst interaction, with tolerance for pages with many interactions: it discounts
one bad interaction per ~50).

Unlike FID, INP captures **all three phases**:

```
   input ──▶ [ input delay ] ──▶ handler runs [ processing ] ──▶ [ presentation delay ] ──▶ next paint
   └────────────────────────── INP for this interaction ──────────────────────────────────┘
```

- **Input delay** — main thread busy → handler can't start (the old FID).
- **Processing** — your event handlers (and the React render they trigger) running.
- **Presentation delay** — layout/paint of the resulting DOM changes, until the next frame.

**Good INP ≤ 200 ms**, "needs improvement" ≤ 500 ms, **poor > 500 ms**.

## Reading it (Event Timing API)

Each interaction surfaces one or more `event` entries; the slowest per interaction (grouped by
`interactionId`) is its latency:

```js
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (!e.interactionId) continue;             // only real interactions
    const inputDelay   = e.processingStart - e.startTime;
    const processing   = e.processingEnd   - e.processingStart;
    const presentation = e.startTime + e.duration - e.processingEnd;
    // e.duration is the whole thing, rounded UP to 8ms
  }
}).observe({ type: 'event', durationThreshold: 16, buffered: true });
```

`durationThreshold` (min 16 ms, default 104 ms) filters out trivially fast events. `duration` is
quantized to **8 ms**.

## Why each phase happens & how to fix it

- **High input delay** → long tasks blocking the thread → break them up, defer/yield, hydrate less.
- **High processing** → expensive handlers / big synchronous React renders → memoize, virtualize,
  move work off the critical path, use `startTransition` so the urgent part (showing feedback) isn't
  blocked by the heavy part.
- **High presentation delay** → huge/complex DOM updates, layout thrashing, oversized layers → reduce
  the DOM touched per interaction, avoid forced reflows, `content-visibility`.

A classic trick: **paint immediate feedback first** (e.g. a pressed state) in the handler, then do
the heavy work in a follow-up task / transition — so the *next paint* (which INP measures) happens
quickly.

## Senior checklist

- INP = full interaction latency (input delay + processing + presentation) to the **next paint**,
  reported as a near-worst value across the whole visit — superset of FID.
- Good ≤ 200 ms; it's a **field** metric (real interactions); read via `event` entries grouped by
  `interactionId`.
- Diagnose by **phase**: delay → long tasks; processing → handler/render cost; presentation →
  DOM/layout/paint cost.
- Show feedback before heavy work; yield/transition the expensive part so the next paint lands fast.

## References

- [web.dev: Interaction to Next Paint (INP)](https://web.dev/articles/inp)
- [web.dev: Optimize INP](https://web.dev/articles/optimize-inp)
- [MDN: PerformanceEventTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming)
- [web.dev: Find slow interactions in the field](https://web.dev/articles/find-slow-interactions-in-the-field)
