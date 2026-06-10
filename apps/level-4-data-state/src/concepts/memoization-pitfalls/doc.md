# Memoization pitfalls

`useMemo`, `useCallback`, and `React.memo` are caching tools. Like any cache, they're easy to get
**subtly wrong** — and a broken cache is worse than none: you pay the comparison/memory cost and
still recompute or re-render.

## Pitfall 1 — Dependencies that change identity every render

A memo only hits when its **dependencies are referentially equal** to last time. If a dep is a
**new object/array/function each render**, the memo recomputes every time (cache miss rate 100%):

```tsx
// ❌ { filter } is a new object every render → useMemo never reuses its result
const result = useMemo(() => expensive(data, { filter }), [data, { filter }]);

// ✔ depend on stable/primitive values
const result = useMemo(() => expensive(data, filter), [data, filter]);
```

The same kills `useEffect`/`useCallback` and `React.memo` (previous concept).

## Pitfall 2 — Missing or lying dependencies

Omitting a dep (or silencing `react-hooks/exhaustive-deps`) makes the memo return a **stale**
value computed from an old render's variables (a stale-closure bug). Don't lie to the deps array;
restructure instead (functional updates, refs, splitting effects).

## Pitfall 3 — Memoizing trivial work

`useMemo`/`useCallback` cost memory + a deps comparison **every render**. Wrapping `a + b` or a
one-line handler that isn't passed to a memoized child is **net negative**. Memoize when:
the value feeds a **memoized child** or a **dependency array**, *or* the computation is genuinely
expensive (measured).

```tsx
// ❌ pointless: cheap value, not used as a dep / by a memo child
const total = useMemo(() => price * qty, [price, qty]);
// ✔ just compute it
const total = price * qty;
```

## Pitfall 4 — `React.memo` broken by `children` / spread props

`React.memo` shallow-compares props. **`children` is almost always a new element each render**, so
a memoized component with `children` rarely bails:

```tsx
const Box = memo(function Box({ children }) { /* ... */ });
<Box><Row /></Box>   // <Row/> is a new element each render → Box re-renders anyway
```

Spreading props (`{...rest}`) or passing freshly-built objects has the same effect. Memoize the
*children's* source, pass primitives, or restructure so the expensive subtree is itself memoized.

## Pitfall 5 — `useMemo` is not a semantic guarantee

React may **throw away** memoized values (e.g. to free memory) and recompute. So `useMemo` must be
used for **performance**, never for **correctness** — don't rely on it to run something exactly
once or to preserve identity that *must* never change (use `useRef`/`useState` initializer for
that). Likewise, **don't put side effects** inside `useMemo` (it runs during render).

## Pitfall 6 — Memoizing values that should be state, or vice versa

Deriving a value with `useMemo` from props/state is fine; but if you find yourself memoizing then
syncing into state via effects, you probably want **derived-during-render** (no state) or a single
source of truth. Storing derived data in state invites it going stale.

## Diagnosing

- React DevTools **Profiler** → "Why did this render?" shows which prop/hook changed.
- A render-count ref on a memoized component reveals whether memo actually bails.
- Log inside `useMemo` to see your real cache hit/miss rate.
- The **React Compiler** (React 19) auto-memoizes correctly, removing most manual hooks — but you
  still need to understand these failure modes to reason about performance.

## Senior checklist

- A memo with unstable deps = 100% miss + overhead; depend on stable/primitive values.
- Don't memoize trivial work; memoize for memoized children / dep arrays / measured-expensive work.
- `React.memo` + `children`/spread usually doesn't bail — memoize the source, not the wrapper.
- `useMemo` is a perf hint, not a correctness/identity guarantee; no side effects inside it.

## References

- [React: useMemo — caveats & when to use](https://react.dev/reference/react/useMemo#caveats)
- [React: memo — minimizing props changes](https://react.dev/reference/react/memo#minimizing-props-changes)
- [Kent C. Dodds: useMemo/useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
- [React Compiler](https://react.dev/learn/react-compiler)
