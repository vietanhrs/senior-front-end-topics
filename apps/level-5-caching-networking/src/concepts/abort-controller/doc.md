# AbortController

## What it is

`AbortController` is the web's standard **cancellation primitive**: a controller object whose
`signal` you hand to async APIs; calling `controller.abort(reason?)` flips the signal, and every
API/listener attached to it cancels.

```ts
const ctrl = new AbortController();
fetch('/api/big', { signal: ctrl.signal })
  .then((r) => r.json())
  .catch((e) => { if (e.name === 'AbortError') console.log('cancelled'); else throw e; });

ctrl.abort(); // cancels the request — on the wire, not just ignoring the result
```

Key facts:

- One controller → one `signal`; **a signal can be shared** by many operations (abort them all at
  once). A controller is single-use: once aborted, always aborted.
- Aborting a `fetch` rejects the promise with a **`DOMException` named `AbortError`** — handle it
  *separately* from real errors (don't show "request failed" toasts for your own cancellations).
- Aborting **actually cancels the network work** (and the body stream mid-download), unlike the
  "ignore the stale result" pattern — both are valid; abort also saves bandwidth/server work.

## Beyond fetch: signals are everywhere

```ts
// Event listeners: removal via signal (great for "remove a batch at once")
window.addEventListener('resize', onResize, { signal });
window.addEventListener('scroll', onScroll, { signal });
ctrl.abort(); // removes BOTH listeners — no removeEventListener bookkeeping

// Streams: writable.abort(), readable.cancel(); pipeTo(dest, { signal })
// WebLocks, addEventListener in workers, many libraries (axios, React Query internals)
```

### Static helpers (modern, very useful)

- **`AbortSignal.timeout(ms)`** — a signal that auto-aborts after `ms` (named `TimeoutError`):
  `fetch(url, { signal: AbortSignal.timeout(5000) })` — request-level timeout in one line.
- **`AbortSignal.any([s1, s2])`** — combine signals: abort when *either* fires (e.g. user
  cancellation **or** timeout).
- **`signal.throwIfAborted()`** / `signal.aborted` / `signal.reason` — for your own async code.

## Making your own functions cancelable

Accept a `signal` like the platform does:

```ts
async function processItems(items: Item[], { signal }: { signal?: AbortSignal } = {}) {
  for (const item of items) {
    signal?.throwIfAborted();          // bail out between units of work
    await processOne(item, { signal }); // pass it down to nested async calls
  }
}
```

Listen for cleanup-style cancellation with `signal.addEventListener('abort', ...)` (e.g. to clear
timers, close sockets).

## Canonical React patterns

```tsx
// 1) Cancel in-flight request when deps change / on unmount (race-condition fix)
useEffect(() => {
  const ctrl = new AbortController();
  fetch(`/search?q=${query}`, { signal: ctrl.signal })
    .then((r) => r.json())
    .then(setResults)
    .catch((e) => { if (e.name !== 'AbortError') setError(e); });
  return () => ctrl.abort();
}, [query]);

// 2) Batch-remove listeners with one signal
useEffect(() => {
  const ctrl = new AbortController();
  window.addEventListener('keydown', onKey, { signal: ctrl.signal });
  window.addEventListener('pointermove', onMove, { signal: ctrl.signal });
  return () => ctrl.abort();
}, []);
```

## Gotchas

- **Reusing an aborted controller**: every subsequent op cancels instantly. Create a new
  controller per "attempt".
- **Swallowing all errors in the catch**: separate `AbortError`/`TimeoutError` from genuine
  failures (retry/toast logic must ignore self-inflicted aborts).
- **Forgetting to propagate**: a cancelable outer function calling non-cancelable inner awaits
  still completes the inner work; pass the signal all the way down.
- Server note: aborting tells the browser to drop the connection; the server *may* still have done
  the work (idempotency — Level 4).

## Senior checklist

- One signal, many consumers; abort cancels fetches on the wire, removes batched listeners, stops streams.
- `AbortSignal.timeout` + `AbortSignal.any` cover timeout & combined-cancellation in one line.
- Handle `AbortError` separately; new controller per attempt; thread `signal` through your own APIs.
- In React: abort in the effect cleanup — it's the cancellation half of the race-condition fix.

## Angular equivalent

Angular HttpClient requests are often cancelled by unsubscribing, which operators like switchMap do for stale requests. AbortController still matters for native fetch, workers, and libraries that accept signals; lifecycle cleanup maps to takeUntilDestroyed.

## References

- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN: AbortSignal (timeout, any)](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [WHATWG DOM: Aborting ongoing activities](https://dom.spec.whatwg.org/#abortcontroller-api-integration)
- [Jake Archibald: Abortable fetch](https://developer.chrome.com/blog/abortable-fetch/)
