# PerformanceObserver API

## The one API behind every metric

`PerformanceObserver` is the asynchronous, push-based way to read the browser's **performance
timeline**. Every metric in this level — FID, INP, CLS, LCP, long tasks — is just a different
**entry type** delivered through the *same* observer API. Learn it once and you can read them all.

```js
const po = new PerformanceObserver((list, observer) => {
  for (const entry of list.getEntries()) {
    // entry.entryType, entry.name, entry.startTime, entry.duration, ...
  }
});
po.observe({ type: 'largest-contentful-paint', buffered: true });
```

## Why an observer, not polling

The old way was `performance.getEntriesByType('resource')` on a timer — you had to **poll**, you
could **miss** entries that came and went, and the buffer could overflow. `PerformanceObserver`:

- **Pushes** entries to you as they're recorded (no polling, no missed entries),
- runs its callback **off the critical path** (queued, batched),
- and with **`buffered: true`** replays entries that occurred **before** the observer was created —
  essential for load metrics (your JS runs after FCP/LCP already happened).

## Entry types you'll actually use

| `type` | What it reports |
|---|---|
| `paint` | First Paint & First Contentful Paint |
| `largest-contentful-paint` | LCP candidates |
| `layout-shift` | CLS shifts |
| `event` / `first-input` | INP / FID (Event Timing) |
| `longtask` | tasks > 50 ms blocking the main thread |
| `long-animation-frame` | LoAF — richer long-frame attribution (newer) |
| `resource` | every fetch/img/script/css download (Resource Timing) |
| `navigation` | the document load itself (TTFB, DOMContentLoaded, …) |
| `mark` / `measure` | **your own** User Timing marks & measures |
| `element` | Element Timing (opt-in via `elementtiming` attr) |

## Two ways to observe (don't mix the wrong one)

- `observe({ type: 'x', buffered: true })` — **one** type, but supports `buffered`. Call it multiple
  times on the same observer to watch several types.
- `observe({ entryTypes: ['x', 'y'] })` — **multiple** types at once, but **no** `buffered` and it
  **overrides** previous `observe` calls. Prefer the single-`type` form for buffered metrics.

## Other essentials

- **`PerformanceObserver.supportedEntryTypes`** — feature-detect before observing (types vary by
  browser). Observing an unsupported type throws.
- **`takeRecords()`** — synchronously drain pending entries (e.g. right before page unload, to flush
  metrics).
- **`list.getEntries()` / `getEntriesByType` / `getEntriesByName`** — filter within the callback.
- **`droppedEntriesCount`** — the buffer has a cap; this tells you if entries were dropped.
- **User Timing**: `performance.mark('x')` + `performance.measure('m', 'x', 'y')` instrument *your*
  code and show up as `mark`/`measure` entries (and in DevTools).

## Senior checklist

- One async, push-based API for the whole performance timeline; the metric is just the `type`.
- Use **`buffered: true`** (single-`type` form) for load metrics so you don't miss pre-observer
  entries; `entryTypes` form for many types but no buffering.
- Feature-detect with **`supportedEntryTypes`**; flush with **`takeRecords()`** on unload.
- Instrument your own code with `performance.mark`/`measure`; ship a library (web-vitals) rather than
  hand-rolling field collection.

## References

- [MDN: PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [MDN: PerformanceObserver.supportedEntryTypes](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/supportedEntryTypes_static)
- [MDN: User Timing (mark/measure)](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure)
- [web.dev: Custom metrics](https://web.dev/articles/custom-metrics)
