# Web Workers vs Service Workers

Both run scripts on a **separate thread, off the main thread**, have **no direct DOM access**,
and communicate via **messages**. But their purposes are completely different.

## Web Worker — a compute thread

Goal: **move CPU-heavy work off the main thread** so the UI doesn't jank. The main thread
handles DOM/layout/paint/events; if you run a heavy loop on it, every interaction and
JS-driven animation **freezes**.

```ts
// main.ts
const worker = new Worker(new URL('./heavy.worker.ts', import.meta.url), { type: 'module' });
worker.postMessage({ n: 5_000_000 });
worker.onmessage = (e) => console.log('result:', e.data.result);

// heavy.worker.ts
self.onmessage = (e) => {
  const result = doHeavyWork(e.data.n); // runs on a separate thread
  self.postMessage({ result });
};
```

Characteristics:
- No `window`, `document`, DOM. Has `fetch`, `WebSocket`, `IndexedDB`, timers, `OffscreenCanvas`.
- Communication via `postMessage` — data is **structured cloned** (copied). For large buffers,
  use **Transferable objects** to *transfer ownership* instead of copying (zero-copy) —
  deeper dive in Level 6.
- Lifetime tied to the page; closing the tab or `worker.terminate()` ends it.
- Variants: **Shared Worker** (shared across tabs of the same origin), **Worklets** (audio/paint).

Use it for: parsing/formatting large data, encryption/compression, image processing,
computation, large diffs…

## Service Worker — a programmable network proxy that can run in the background

Goal: **sit between the page and the network** like a programmable proxy — to serve
**offline**, cache strategically, **push notifications**, **background sync**. It's the
foundation of PWAs.

```ts
// register (usually after load)
navigator.serviceWorker.register('/sw.js');

// sw.js: intercept requests and decide cache vs network
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((hit) => hit ?? fetch(event.request)));
});
```

Characteristics:
- **HTTPS required** (except `localhost`).
- **Event-driven & can be killed at any time**: don't keep state in global variables between
  events — use Cache Storage / IndexedDB.
- Scoped by **scope** (the registration path); intercepts `fetch` within that scope.
- Lives **independently of the page** — it still runs for push/sync even with no tab open.

### Service Worker lifecycle (a common trap)
```
install → (waiting) → activate → (intercepts fetch)
```
- **install**: usually precaches assets.
- **waiting**: a new SW does **not** activate immediately while an old SW still controls a tab
  → you need `skipWaiting()` + `clients.claim()` to update right away (careful: this can cause
  version mismatch).
- An open page is **still controlled by the old SW** until all tabs close (or it claims).
- The lifecycle traps (stale cache versions, updates that don't take) are covered in Level 6.

## Quick comparison

| | Web Worker | Service Worker |
|---|---|---|
| Purpose | heavy compute off the main thread | network proxy, offline, cache, push |
| Count | many, on demand | one per scope, shared across tabs |
| Lifetime | tied to the page that created it | independent, install/activate, can be killed |
| Intercepts the page's `fetch`? | no | yes (within scope) |
| HTTPS required? | no | yes (except localhost) |
| DOM? | no | no |

## Senior checklist

- Web Worker to **avoid blocking the UI**; communication is structured clone, large buffers use
  Transferable.
- Service Worker is a **network proxy**: offline/cache/push, event-driven, can be killed.
- Know the SW lifecycle (install→waiting→activate) and why updates don't take effect immediately.
- Neither has the DOM.

## References

- [MDN: Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web.dev: Service Worker lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [Vite: Web Workers](https://vitejs.dev/guide/features.html#web-workers)
- [MDN: Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
