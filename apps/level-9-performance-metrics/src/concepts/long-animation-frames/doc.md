# Long Animation Frames (LoAF)

## Why LoAF exists

The **Long Tasks API** is useful for finding chunks of JavaScript that monopolize the main thread,
but a user experiences a **rendered frame**, not an isolated task. A slow frame can include script
execution, style calculation, layout, rendering work, and multiple tasks.

The **Long Animation Frames API** exposes performance entries with the type
`long-animation-frame` for rendering updates delayed beyond **50 ms**. It is designed to make
responsiveness debugging more actionable by combining frame timing with script attribution.

> Browser support is still limited. Treat LoAF as progressive diagnostics, not a universal
> production primitive.

## Observing LoAF entries

```js
if (
  'PerformanceObserver' in window &&
  PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame')
) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log({
        duration: entry.duration,
        blockingDuration: entry.blockingDuration,
        scripts: entry.scripts
      });
    }
  });

  observer.observe({
    type: 'long-animation-frame',
    buffered: true
  });
}
```

## The properties that matter most

### `duration`

The total duration of the long frame. This tells you how late the rendering update was, but not how
much of that time prevented high-priority work such as user input.

### `blockingDuration`

The amount of time the frame blocked the main thread from responding to high-priority work.
Conceptually, this is closer to the **responsiveness cost** of the frame than raw duration.

A frame can therefore be long without every millisecond counting as blocking.

### `scripts`

An array of script timing records that contributed to the frame. Useful fields include:

- `duration`
- `sourceURL`
- `sourceFunctionName`
- `forcedStyleAndLayoutDuration`
- `invoker` / `invokerType`

This is the major advantage over the older Long Tasks API: telemetry can often tell you **which
entry point or script caused the slow frame**, not merely that the main thread was busy.

## Long Tasks vs LoAF

| Question | Long Tasks | LoAF |
|---|---|---|
| Was the main thread blocked for >50 ms? | Yes | Indirectly |
| Did a rendered frame miss its responsiveness budget? | Not necessarily | Yes |
| Includes rendering/style/layout timing? | No | Yes |
| Rich per-script attribution? | Limited | Yes |
| Broad browser support? | Better | Limited / experimental |

Use them together: Long Tasks are still useful as a broad main-thread signal; LoAF is better when
you need to connect poor responsiveness to a concrete rendering frame and script contributor.

## LoAF is not INP

**INP** is a user-centric interaction metric. **LoAF** is a diagnostic primitive.

A page may emit long frames while the user is idle, so counting LoAFs alone does not tell you that
users had a bad interaction. In production RUM, correlate LoAF timing with interactions and INP
rather than replacing INP with "number of long frames".

## Production telemetry pattern

Keep only the worst frames and aggressively reduce payload volume:

```js
const worst = [];

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    worst.push(entry);
    worst.sort((a, b) => b.blockingDuration - a.blockingDuration);
    worst.length = Math.min(worst.length, 10);
  }
}).observe({ type: 'long-animation-frame', buffered: true });
```

Then aggregate by **route, release, script URL, and function attribution**. This makes regressions
actionable: "checkout v184 spends 120 ms of blocking time in pricing-widget.js" is far more useful
than "the page had three long tasks."

## Attribution limitations

Script attribution is not guaranteed. It can be missing or incomplete for work associated with
cross-origin frames, workers, extensions, or unsupported browsers. Always build telemetry so
`scripts` may be empty.

Also remember that `sourceFunctionName` points to the script entry point that the browser can
attribute efficiently; it is not a full JavaScript stack trace.

## Senior checklist

- LoAF = a rendering update delayed beyond **50 ms**.
- `duration` measures the whole frame; `blockingDuration` better reflects responsiveness cost.
- Use `scripts` to identify expensive script entry points and forced layout work.
- LoAF is a **diagnostic signal**, not a replacement for **INP**.
- Feature-detect and expect missing attribution.
- For production RUM, sample and keep only the worst frames rather than shipping every entry.

## References

- [MDN: Long animation frame timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Long_animation_frame_timing)
- [MDN: PerformanceLongAnimationFrameTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongAnimationFrameTiming)
- [web.dev: Long Animation Frames API](https://web.dev/articles/loaf)
