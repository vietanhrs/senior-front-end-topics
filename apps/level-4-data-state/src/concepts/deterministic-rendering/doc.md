# Deterministic rendering

## The principle

A render is **deterministic** when the **same inputs (props + state) always produce the same
output** — no dependence on hidden, changing, or environment-specific values. React assumes your
components are pure functions of their inputs; when they aren't, you get flicker, reordering,
hydration mismatches, flaky tests, and broken memoization.

> Determinism is the render-time companion to immutability: immutability keeps *data* stable;
> determinism keeps the *mapping from data to UI* stable.

## Sources of non-determinism (and what they break)

| Source | Symptom |
|---|---|
| `Math.random()` / `crypto.getRandomValues()` in render | different output each render; SSR hydration mismatch |
| `Date.now()` / `new Date()` / `toLocaleString()` in render | time/locale-dependent output; hydration mismatch (Level 1) |
| **Unstable sort** (comparator returns 0 for ties, or uses randomness) | tied items jump around between renders |
| Iterating a **`Set`/`Map`** or `Object.keys` and assuming an order that isn't guaranteed | order drift across runs/engines |
| Reading **global mutable** state during render (a module variable, `window.x`) | output depends on hidden state (also tearing — Level 2) |
| Generating **keys/ids** with `Math.random()`/`uuid()` *in render* | new keys each render → React remounts everything, loses state |
| Floating-point / locale-dependent formatting differences | server vs client divergence |

## The big one: stable sorting & tiebreakers

`Array.prototype.sort` is **stable** since ES2019 (equal elements keep their input order). But your
*comparator* can still be **non-deterministic** if:

- it returns `0` for items you consider "equal" but whose **input order isn't stable** (e.g. the
  array came from an object/`Map`/network in varying order), or
- it uses randomness or volatile values.

Always provide a **total order** with a stable tiebreaker (usually a unique id):

```ts
// ❌ ties are arbitrary → rows shuffle when the source order changes
rows.sort((a, b) => b.score - a.score);

// ✔ deterministic total order: score desc, then id asc as a stable tiebreaker
rows.sort((a, b) => (b.score - a.score) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
```

## Keys and ids must be derived, not generated at render

```tsx
// ❌ new key every render → every item remounts (state/focus lost, perf)
{items.map((it) => <Row key={crypto.randomUUID()} item={it} />)}

// ✔ key derived from stable data
{items.map((it) => <Row key={it.id} item={it} />)}
```

If you truly need a generated id, create it **once** when the entity is created (in an event/
reducer/`useState` initializer), not during render.

## Where to put the non-determinism

You can't avoid randomness/time forever — you move it **out of render**:

- Generate ids/timestamps in **event handlers / reducers / effects** and store them in state.
- For SSR-safe time, render a placeholder and set the real value in `useEffect` (Level 1).
- **Seed** randomness (a seeded PRNG) when you need reproducible "random" output (tests,
  animations, generative UI) so the same seed → same result.
- Snapshot/format with explicit locale & timezone (`Intl` with fixed options) for stable output.

## Why it matters

- **SSR/hydration**: server and client must render identically (Level 1 — hydration mismatch).
- **Memoization**: `React.memo`/`useMemo` assume same inputs → same output; non-determinism makes
  caching pointless or wrong.
- **Testing**: snapshot and visual-regression tests require deterministic output; otherwise flaky.
- **Concurrent rendering**: React may render multiple times; a non-deterministic render can produce
  inconsistent trees.

## Senior checklist

- Render must be a pure function of props+state — no `random`/`now`/global mutable reads in render.
- Sorting needs a **total order** with a stable id tiebreaker; rely on stable `sort` only with stable input.
- Derive keys/ids from data; generate them once at creation, never during render.
- Push unavoidable randomness/time into events/effects, or seed it; format with fixed locale/tz.

## Angular equivalent

Angular templates must also be deterministic for stable change detection and hydration. Avoid Date.now(), Math.random(), unstable sorts, or browser-only branches in template expressions; compute deterministic view state in signals, resolvers, or services.

## References

- [React: Keeping components pure](https://react.dev/learn/keeping-components-pure)
- [MDN: Array.prototype.sort (stability)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#sort_stability)
- [React: hydration mismatches](https://react.dev/link/hydration-mismatch)
- [V8: Getting things sorted (stable sort)](https://v8.dev/blog/array-sort)
