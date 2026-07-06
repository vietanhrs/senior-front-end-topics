# Level 8 — Concurrency & Streams

Interactive SPA workbook for 10 concurrency & streaming concepts: scheduling and starvation,
backpressure, streaming pipelines, real-time collaboration, shared memory, and keeping the UI
correct and responsive under async load. Built on the shared `@sfe/workbook` engine. Stack: Bun ·
React 19 · TypeScript · Vite · Tailwind v4 · Mantine v8.

## Running

```bash
bun install                                       # (run at the repo root)
bun run --filter level-8-concurrency-streams dev    # dev server
bun run --filter level-8-concurrency-streams build  # type-check + production build
```

## Architecture

Thin app on top of the shared engine (`packages/workbook`, imported as `@sfe/workbook`, aliased to
its TS source in `vite.config.ts` + `tsconfig.json`).

```
src/
├── main.tsx               # MantineProvider + <WorkbookApp level={LEVEL} />
├── index.css              # Mantine/Tailwind layers + @source for the shared engine
└── concepts/
    ├── index.ts           # LEVEL registry (assembles the 10 concepts)
    └── <slug>/            # doc.md + Demo.tsx + Exercise.tsx + index.ts (+ helper modules)
```

## Concepts

Task starvation · Priority inversion in async code · Scheduler internals · Concurrent rendering
tearing · Backpressure handling · Streaming SSR pipelines · WebRTC basics · CRDT basics for
collaboration · Shared memory models · Deterministic UI under async.

## Notes on the demos

The demos prefer **real** platform APIs over mockups, and are deterministic where a live race would
be flaky:

- **Task starvation** runs the same chunked work as a self-replenishing microtask chain vs yielding
  macrotasks, and shows a JS heartbeat freeze to zero ticks during the microtask flood.
- **Priority inversion** is a tiny deterministic scheduler comparing H's finish time with and without
  priority inheritance (lock holder boosted to the blocked waiter's priority).
- **Scheduler internals** is a genuine mini-scheduler: a binary min-heap keyed by expiration, ~5ms
  time slices, and yielding via a real `MessageChannel` (the mechanism React uses).
- **Concurrent rendering tearing** is a controlled reproduction: a store mutates at the slice
  boundary; naive live reads tear, a frozen snapshot (à la `useSyncExternalStore`) stays consistent.
- **Backpressure** uses the real Streams API — a push source vs a pull source against a slow reader,
  showing `desiredSize` going negative (unbounded) vs the buffer staying at the high-water mark.
- **Streaming SSR pipelines** pipes a real `ReadableStream` → `TransformStream` (injects hydration
  scripts) → `TextEncoderStream`, and reveals page regions as out-of-order chunks arrive.
- **WebRTC basics** connects two real `RTCPeerConnection`s in-page (the page is the signaling
  channel) and opens a working `RTCDataChannel` chat — feature-detected.
- **CRDT basics** is a 3-replica G-Counter (merge = element-wise max) that converges to the true
  total, contrasted with a last-write-wins register that loses concurrent increments.
- **Shared memory models** probes live `crossOriginIsolated`/`SharedArrayBuffer` and models the
  publication bug (relaxed reordering → stale reads) vs atomic store-release/load-acquire.
- **Deterministic UI** races out-of-order search responses: naive last-response-wins shows stale
  results; a request-id guard applies only the latest.

## Angular equivalent

React concurrency examples in this level map to Angular through explicit stream scheduling, signals, OnPush, @defer, Web Workers, and zoneless dirty marking. Angular does not expose Fiber lanes, so the scheduling choices live in app architecture.
