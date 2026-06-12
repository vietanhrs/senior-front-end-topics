# Lazy Loading & Suspense

## The pattern

**Code-splitting** ships less JavaScript up front by loading parts of the app **on demand**.
`React.lazy` turns a dynamic `import()` into a component, and **`<Suspense>`** declaratively shows a
**fallback** while that chunk (or any suspending data) loads.

```jsx
const Chart = lazy(() => import('./Chart')); // its own chunk, fetched when first rendered

function Dashboard() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Chart />   {/* while the chunk downloads, <Skeleton/> shows */}
    </Suspense>
  );
}
```

`React.lazy` requires a module with a **default export**. The bundler (Vite/webpack) automatically
emits a separate chunk for each dynamic `import()`.

## Suspense is more than lazy

`<Suspense>` catches **any** child that "suspends" — not just lazy components:

- **Code (`React.lazy`)** — the chunk is loading.
- **Data** — a resource read via **`use(promise)`** or a Suspense-enabled data library (React Query,
  Relay, RSC) that throws a promise while fetching.
- **Streaming SSR** (Levels 7–8) — boundaries stream in as their content resolves.

One boundary can wrap several suspending children; React shows the fallback until **all** of them are
ready (use multiple boundaries for independent loading).

## Doing it well

- **Boundary placement & granularity** — wrap meaningful regions, not the whole app. Nest boundaries
  so independent parts reveal independently. Show **skeletons** that match the final layout (avoids
  CLS — Level 9).
- **Pair with an error boundary** — a chunk can **fail to load** (network/deploy). A lazy component
  with no error boundary throws on failure. `react-error-boundary` + a retry is the standard combo.
- **Avoid fallback flashes** — `useTransition`/`startTransition` keeps the *old* UI visible during an
  update instead of flashing the fallback; React shows the fallback only for genuinely new content.
- **Preload** on intent — call the lazy component's importer on hover/focus or route prefetch so the
  chunk is warm before the user commits: `const importChart = () => import('./Chart')`.
- **Split by route first** — route-level splitting is the highest-leverage win; then split heavy,
  rarely-used widgets (editors, charts, modals).

## Senior checklist

- `React.lazy(() => import('./X'))` + **`<Suspense fallback>`** code-splits a default-export
  component into its own chunk, loaded on demand.
- Suspense also handles **data** (`use()`, Suspense libraries) and **streaming SSR**, not just lazy
  code; one boundary waits for all its suspending children.
- **Always pair with an error boundary** (chunk loads can fail) and offer retry; use skeletons
  matching layout; **preload** on hover/route intent.
- Use **transitions** to avoid fallback flashes; split by **route** first, then heavy widgets.

## References

- [React: lazy](https://react.dev/reference/react/lazy)
- [React: Suspense](https://react.dev/reference/react/Suspense)
- [React: use(promise) for data](https://react.dev/reference/react/use)
- [web.dev: Code splitting with React.lazy and Suspense](https://web.dev/articles/code-splitting-suspense)
