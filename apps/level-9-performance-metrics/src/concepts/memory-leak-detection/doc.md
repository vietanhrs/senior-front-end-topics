# Browser memory leak detection

## What a leak is in a GC'd language

JavaScript is garbage-collected, so a "leak" isn't forgetting to `free()` — it's **keeping a
reference alive longer than you need it**, so the GC *can't* reclaim the memory. Memory grows over a
session until the tab slows (GC thrash) or crashes. The skill is spotting the **unintended reference
that keeps an object reachable**.

## The usual suspects

- **Detached DOM nodes** — you remove a node from the document but a JS variable (or a closure, or an
  array) still references it. The whole subtree stays in memory, off-screen and useless. *The single
  most common front-end leak.*
- **Forgotten event listeners** — `addEventListener` on `window`/`document`/a long-lived element,
  never removed. The handler closure (and everything it captures) is retained for the page's life.
- **Timers** — `setInterval`/`setTimeout` not cleared; the callback and its closure stay alive (and
  keep firing).
- **Growing caches / maps** — a `Map`/array you push into forever without eviction. Use a **bounded**
  cache (LRU) or **`WeakMap`/`WeakRef`** keyed by objects so entries die with their keys.
- **Closures over large scope** — a small long-lived callback that closes over a big object keeps the
  big object alive.
- **Framework lifecycles** — React effects that subscribe without a cleanup return; stale store
  subscriptions; refs to unmounted nodes.

## React-specific

```js
useEffect(() => {
  const id = setInterval(tick, 1000);
  window.addEventListener('resize', onResize);
  const sub = store.subscribe(update);
  return () => {                 // ← the cleanup is the leak fix
    clearInterval(id);
    window.removeEventListener('resize', onResize);
    sub.unsubscribe();
  };
}, []);
```

Missing that `return` cleanup leaks one listener/timer/subscription **per mount** — brutal on routes
the user revisits.

## How to detect

- **DevTools → Memory → Heap snapshot.** Take a snapshot, do the suspect action (open/close a modal a
  few times), take another, **Comparison** view → look for objects/Detached nodes that grew and
  didn't shrink. The **"Detached"** filter finds detached DOM directly.
- **Three-snapshot technique:** snapshot → interact N times → snapshot → GC → snapshot. Anything
  retained across the cycle that should have been freed is a leak.
- **DevTools → Performance Monitor:** live **JS heap size**, **DOM node count**, **event listener
  count** — if they climb monotonically as you repeat an action, you're leaking.
- **Allocation timeline / sampling profiler** to find *where* allocations come from.
- **`performance.measureUserAgentSpecificMemory()`** — programmatic, cross-process memory (requires
  **cross-origin isolation**); good for field/lab regression alarms. (`performance.memory` is the
  old, Chrome-only, deprecated readout.)
- **`FinalizationRegistry`** — for diagnostics, get notified when an object is *actually* collected
  (don't use it for app logic; collection timing is non-deterministic).

## Senior checklist

- A leak = an unintended **live reference**; the fixes are removal/cleanup, bounded caches, and weak
  references (`WeakMap`/`WeakRef`).
- Top causes: **detached DOM**, forgotten **listeners**, uncleared **timers**, unbounded **caches**,
  big **closures**; in React, missing effect **cleanup**.
- Detect with **heap snapshots + comparison** (Detached filter) and the **Performance Monitor**
  (heap/nodes/listeners climbing); use the three-snapshot method.
- `measureUserAgentSpecificMemory()` (needs COOP/COEP) for programmatic checks; `FinalizationRegistry`
  for diagnostics only.

## Angular equivalent

Angular leak equivalents are manual subscriptions without takeUntilDestroyed, directives keeping DOM references, CDK overlays/portals not disposed, long-lived services retaining component callbacks, and third-party widgets not destroyed in lifecycle cleanup.

## References

- [web.dev: Fix memory problems (DevTools)](https://developer.chrome.com/docs/devtools/memory-problems)
- [MDN: performance.measureUserAgentSpecificMemory()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory)
- [MDN: WeakRef & FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
- [web.dev: monitor total page memory usage](https://web.dev/articles/monitor-total-page-memory-usage)
