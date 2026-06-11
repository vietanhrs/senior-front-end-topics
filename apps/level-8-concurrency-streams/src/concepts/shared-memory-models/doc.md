# Shared memory models

> Level 6 covered `SharedArrayBuffer` + `Atomics` from the **isolation/security** angle. Here the
> focus is the **memory model**: what guarantees you actually have when two agents touch the same
> memory, and why `Atomics` are not optional.

## Shared memory in JS

`SharedArrayBuffer` (SAB) is the *only* memory truly shared between agents (the main thread and
workers) — a normal `ArrayBuffer` is copied (or transferred) by `postMessage`, a SAB is **shared**:
both agents see the same bytes, with no message passing. That power comes with the classic
multi-threading hazard: **data races** and **memory ordering**.

It's gated behind **cross-origin isolation** (`COOP: same-origin` + `COEP: require-corp`,
`crossOriginIsolated === true`) because shared memory enables high-resolution timers that Spectre
can abuse. No isolation → no `SharedArrayBuffer`.

## The JS memory model in one paragraph

JavaScript adopts a **sequentially-consistent-for-data-race-free (SC-DRF)** model, like C++/Java:

- **Atomic** accesses (`Atomics.*`) are **sequentially consistent** — there's a single total order
  all agents agree on, and they act as **memory barriers** (no reordering across them).
- **Non-atomic** accesses that race (two agents, at least one writing, no synchronization between
  them) have **no ordering guarantees**. The compiler/CPU may **reorder** independent writes, and
  another agent may observe them **out of order** or see stale values. (Aligned integer reads/writes
  won't *tear* into garbage, but you still can't rely on *when* a write becomes visible.)

So: if your program is **data-race-free** (every shared access is synchronized via atomics), it
behaves sequentially consistent — easy to reason about. The moment you race on plain accesses, the
result is unspecified.

## The publication bug (why ordering matters)

The canonical mistake — write a payload, then flip a "ready" flag, and read them back:

```js
// producer                       // consumer
data[0] = 42;                      while (flag[0] === 0) {}   // spin until ready
flag[0] = 1;                       use(data[0]);              // may read 0! (stale)
```

With **plain** writes, the producer's two stores can be reordered (or made visible out of order), so
the consumer can see `flag === 1` while `data` is still `0`. The fix is an **atomic store-release /
load-acquire** pair: the atomic flag write *publishes* everything written before it, and the atomic
flag read *acquires* it — establishing **happens-before**:

```js
// producer                                  // consumer
data[0] = 42;                                 while (Atomics.load(flag, 0) === 0) {}
Atomics.store(flag, 0, 1); // release         use(Atomics.load(data, 0)); // sees 42
```

## Atomics toolbox

- `Atomics.load/store` — ordered read/write (acquire/release semantics for synchronization).
- `Atomics.add/sub/and/or/xor/exchange` — atomic read-modify-write (no lost updates — the
  `count++` race fix from Level 6).
- `Atomics.compareExchange` — CAS, the building block for locks and lock-free structures.
- `Atomics.wait(typedArray, index, expected)` / `Atomics.notify(...)` — **block** a worker until a
  value changes (a futex). `wait` is **not allowed on the main thread** (it would freeze the UI); use
  `Atomics.waitAsync` there.

## Senior checklist

- SAB is real shared memory between agents; it requires **cross-origin isolation**
  (`crossOriginIsolated`).
- JS is **SC-DRF**: atomics are sequentially consistent barriers; racy non-atomic accesses have **no
  ordering guarantee** (no tearing for aligned ints, but visibility/order is unspecified).
- Use **store-release / load-acquire** atomics to *publish* data with a flag (happens-before);
  `Atomics.add`/`compareExchange` for race-free RMW.
- `Atomics.wait`/`notify` for blocking synchronization in **workers**; `waitAsync` on the main thread.

## References

- [MDN: Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics)
- [MDN: SharedArrayBuffer & cross-origin isolation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
- [ECMAScript memory model (spec)](https://tc39.es/ecma262/#sec-memory-model)
- [web.dev: Why you need cross-origin isolation](https://web.dev/articles/why-coop-coep)
