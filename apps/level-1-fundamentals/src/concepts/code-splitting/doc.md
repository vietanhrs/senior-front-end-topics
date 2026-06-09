# Code splitting strategies

## The problem

A SPA that bundles all its JS into **one giant bundle** forces users to download + parse +
execute everything before they can interact — including code for pages they never open.
Parsing/compiling JS is a significant **CPU** cost on weak devices, not just a network cost.

**Code splitting** = breaking the bundle into smaller **chunks**, loaded only when needed.
The goal: reduce the JS on the path to interactivity (TTI) and cache more effectively.

## Splitting strategies

### 1. Route-based splitting (most common & effective)
Each route is a chunk. Visiting `/dashboard` only then loads the dashboard code.

```tsx
const Dashboard = lazy(() => import('./routes/Dashboard'));
const Settings = lazy(() => import('./routes/Settings'));

<Routes>
  <Route path="/dashboard" element={
    <Suspense fallback={<Spinner />}><Dashboard /></Suspense>
  } />
</Routes>
```

### 2. Component-based splitting
Split heavy/rarely-used components: a modal, an editor (Monaco), charts, a map. Load only
when the user opens them.

### 3. Vendor / library splitting
Split large, rarely-changing libraries (React, Mantine…) into their own chunk for **long-term
caching** — when app code changes, users don't have to re-download the vendor chunk.

### 4. Interaction / idle-based splitting
Prefetch chunks the user is likely to need when the browser is idle
(`requestIdleCallback`), or when they hover a link.

## React API

| API | Purpose |
|---|---|
| `React.lazy(() => import('...'))` | create a dynamically-loaded component |
| `<Suspense fallback={…}>` | UI to show while the chunk loads |
| Error Boundary | catch errors when a chunk **fails to load** (network drop, new deploy) |

> **Important:** a `lazy` component **must** sit inside a `Suspense`. It should also be
> wrapped in an Error Boundary — a chunk can fail to load (especially after a new deploy
> changes the hashed filename, so the old chunk 404s). In that case you need a "reload" fallback.

## Trade-offs & pitfalls

- **Too small → too many requests**: over-splitting creates a multi-round-trip waterfall that
  hurts more than it helps. Balance chunk size.
- **Loading waterfall**: chunk A loads, only then discovers it needs chunk B → sequential
  loads. Fix with **preload/prefetch** in parallel (see "Dynamic import chunking" & "Resource
  Hints").
- **Layout shift**: a fallback whose size differs from the real content → CLS. Keep skeletons
  the same size.
- **Chunk-load error after deploy**: needs a retry / reload strategy.

## Measuring

Use the **Network tab** (watch `.js` chunks load on demand), the **Coverage tab** (% of
unused code), and a bundle analyzer (`rollup-plugin-visualizer` with Vite) to decide where to
split.

## Senior checklist

- Default to route-based splitting + splitting heavy components.
- Always wrap a lazy component in `Suspense` + an Error Boundary.
- Understand the trade-off: number of requests vs chunk size; avoid waterfalls.
- Know how to prefetch to eliminate the latency when users navigate.

## References

- [React: lazy](https://react.dev/reference/react/lazy)
- [React: Suspense](https://react.dev/reference/react/Suspense)
- [web.dev: Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)
- [Vite: Dynamic import](https://vitejs.dev/guide/features.html#dynamic-import)
