# Deterministic UI under async

## The problem this whole level builds toward

Everything so far — scheduling, tearing, backpressure, streams, shared memory — is in service of one
goal: a UI that shows the **right** thing even though the work producing it happens **asynchronously
and out of order**. The enemy is **nondeterminism**: the same user actions producing different
screens depending on the *timing* of responses.

The signature bug is the **stale response race** (a.k.a. last-response-wins):

```
type "a"   → request A (slow, 900ms) ─────────────────────────▶ resolves LAST
type "ab"  → request B (300ms) ───────────▶ resolves
type "abc" → request C (150ms) ──▶ resolves FIRST
```

A naive handler that does `setResults(response)` on every resolution ends up showing **results for
"a"** — the slowest, oldest request — even though the input says "abc". The UI is now wrong, and
whether it's wrong depends entirely on network jitter.

## The toolkit for determinism

### 1. Make the latest win, not the last
Tag each request with a **sequence number / id** (or use the query itself) and apply a result **only
if it's still the latest**:

```js
let latest = 0;
async function search(q) {
  const id = ++latest;
  const res = await api(q);
  if (id === latest) setResults(res); // ignore superseded responses
}
```

In React, the idiomatic form is an **effect with a cleanup flag** (or `AbortController`):

```js
useEffect(() => {
  let active = true;
  const ctrl = new AbortController();
  api(query, { signal: ctrl.signal }).then((res) => { if (active) setResults(res); });
  return () => { active = false; ctrl.abort(); }; // stale run is neutralized
}, [query]);
```

### 2. Cancel superseded work
`AbortController` doesn't just ignore the response — it **stops** it (saves bandwidth, frees server
work, avoids late side effects). Pair it with the id guard.

### 3. Idempotent, order-independent updates
Design state transitions so applying the same update twice, or in either order, lands in the same
place (the CRDT mindset, scoped to UI). Prefer **reducers** keyed by request id over imperative
`setState` so you can drop/merge late arrivals deterministically.

### 4. Single source of truth + derive
Don't store async results in five places. Keep one canonical state and **derive** the view; that
removes whole classes of "these two pieces of UI disagree" bugs (and tearing).

### 5. Decouple urgency with concurrent features
`useTransition` / `useDeferredValue` keep the input responsive (urgent) while results update at lower
priority — so determinism doesn't cost responsiveness. `useSyncExternalStore` keeps external reads
consistent.

## Senior checklist

- The core hazard is the **stale-response race**: apply *latest*, never *last* — guard with a
  request id / cleanup flag, and `abort()` superseded work.
- In React, async effects need a **cleanup flag or `AbortSignal`** so a slow earlier run can't write
  after a newer one.
- Prefer **idempotent, order-independent** state updates and a **single source of truth** you derive
  the UI from.
- Use transitions/deferred values to keep determinism without sacrificing input responsiveness.

## Angular equivalent

Angular's latest-not-last answer is usually switchMap, request tokens, or AbortController in a service/store. Template state should come from a single Observable/signal source so a slow older response cannot overwrite a newer user intent.

## References

- [React: synchronizing with effects — race conditions](https://react.dev/learn/synchronizing-with-effects#fetching-data)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [React: useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [A complete guide to useEffect — race conditions (Dan Abramov)](https://overreacted.io/a-complete-guide-to-useeffect/)
