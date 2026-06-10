# SharedArrayBuffer

## What it is

A normal `ArrayBuffer` sent to a worker is **transferred or copied** — only one side owns it at a
time. A **`SharedArrayBuffer` (SAB)** is **genuinely shared memory**: the same bytes are visible to
the main thread *and* workers simultaneously. Combined with **`Atomics`**, it enables real
multi-threaded primitives — lock-free counters, mutexes, condition variables, ring buffers — and
is what WebAssembly threads are built on.

```js
const sab = new SharedArrayBuffer(4);
const view = new Int32Array(sab);
worker.postMessage(sab);            // NOT transferred — both threads see the same memory
// later, from either thread:
Atomics.add(view, 0, 1);            // atomic read-modify-write
```

## Why it's a *security* topic: Spectre

Shared memory + a high-resolution timer is the recipe for **Spectre** side-channel attacks (2018):
an attacker thread can build a precise timer from a SAB counter incremented in a tight loop, then
measure cache timing to read memory it shouldn't. The fallout:

- Browsers **disabled `SharedArrayBuffer`** and **reduced `performance.now()` resolution** in 2018.
- It was re-enabled **only for *cross-origin isolated* contexts**. So SAB availability is gated
  behind two response headers on your document:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp        (or credentialless)
```

- With both set, `self.crossOriginIsolated === true`, `SharedArrayBuffer` is available, and timers
  regain higher resolution. Without them, `SharedArrayBuffer` is **undefined** (or unusable) in
  most browsers.

**COEP `require-corp`** means every cross-origin subresource must opt in (via
`Cross-Origin-Resource-Policy` or CORS) — so enabling isolation can break third-party embeds; audit
before flipping it on.

## Atomics: the correctness half

Plain reads/writes to shared memory **race**. A non-atomic `view[0] = view[0] + 1` is
read-modify-write — two threads can both read the old value and one update is lost. `Atomics`
makes operations indivisible and gives you ordering:

| API | Purpose |
|---|---|
| `Atomics.add/sub/and/or/xor` | atomic read-modify-write (returns the *old* value) |
| `Atomics.compareExchange(view, i, expected, next)` | CAS — the basis of lock-free algorithms |
| `Atomics.load/store` | atomic single read/write with memory ordering |
| `Atomics.wait(view, i, value)` | block the thread until the slot changes (workers only — not main thread) |
| `Atomics.notify(view, i, count)` | wake threads waiting on a slot |

`Atomics.wait` **cannot run on the main thread** (it would freeze the UI) — use it in workers for
blocking sync; on the main thread use `Atomics.waitAsync` or message passing.

## When to actually use it

- Heavy parallel compute sharing large datasets without copy overhead (image/video/audio, sims,
  WASM threads).
- High-frequency worker↔main coordination where postMessage latency/copies dominate.

For most apps, **`postMessage` with Transferable objects** (next concept) is simpler and enough;
reach for SAB only when you need true concurrent shared state and have isolation in place.

## Senior checklist

- SAB = real shared memory across threads; pair with `Atomics` for correct, ordered access.
- It's gated behind **cross-origin isolation** (COOP `same-origin` + COEP `require-corp`) because of Spectre; check `crossOriginIsolated`.
- Non-atomic RMW on shared memory loses updates; use `Atomics.add`/`compareExchange`; `Atomics.wait` is worker-only.
- Enabling COEP can break cross-origin embeds — they must send CORP/CORS; audit first. Prefer Transferables unless you truly need shared state.

## References

- [MDN: SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
- [MDN: Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics)
- [web.dev: Cross-origin isolation (COOP/COEP) & why SAB needs it](https://web.dev/articles/coop-coep)
- [Google: Mitigating Spectre on the web](https://security.googleblog.com/2021/03/a-spectre-proof-of-concept-for-spectre.html)
