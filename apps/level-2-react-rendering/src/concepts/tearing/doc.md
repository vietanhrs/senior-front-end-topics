# Tearing in concurrent UI

## What "tearing" means

**Tearing** is when a single render shows **inconsistent values of the same source** across the
screen — part of the UI reflects the old value, part reflects the new one. The name comes from
graphics ("screen tearing"). In React it happens when components read from an **external mutable
store** that changes **in the middle of a render**.

```
Expected (consistent):   price: $10   total: $10   tax on $10   ✔ all agree
Torn (inconsistent):     price: $10   total: $12   tax on $10   ✗ mixed values
```

## Why concurrency introduces it

In **legacy synchronous** React a render ran start-to-finish in one uninterrupted task, so an
external value couldn't change mid-render — every component read the same value.

**Concurrent rendering** is interruptible and **time-sliced**: React renders some components,
yields to the browser, then resumes. If an external store mutates during one of those gaps,
components rendered *before* the change see the old value and components rendered *after* see the
new one — within the **same commit**. That's tearing.

```
Time-sliced render of a list reading `store.value`:
  [Row0 reads 10][Row1 reads 10] │ yield │ store.value = 12 │ [Row2 reads 12][Row3 reads 12]
                                  ▲ commit shows 10,10,12,12  → TORN
```

Crucially this only bites stores that live **outside React** (a module variable, a Redux-like
store, a global event source). React's own `useState`/`useReducer` are part of the render and
can't tear.

## The fix: `useSyncExternalStore`

React 18 added `useSyncExternalStore` precisely to make external stores **concurrency-safe**. You
give it a `subscribe` function and a `getSnapshot` function:

```tsx
import { useSyncExternalStore } from 'react';

function usePrice() {
  return useSyncExternalStore(
    store.subscribe,        // (cb) => unsubscribe — called when the store changes
    store.getSnapshot,      // () => current value (must be cached/stable per state)
    store.getServerSnapshot // optional: value for SSR
  );
}
```

What it guarantees:

- All reads in a commit use a **consistent snapshot**. If `getSnapshot()` returns a different
  value mid-render, React **detects the change and re-renders synchronously** (a deliberate
  de-opt) so the screen never shows a torn state.
- It integrates store subscriptions with React's scheduler correctly (no missed updates, no
  tearing), unlike a hand-rolled `useState` + `useEffect` subscription.

> `getSnapshot` must return a **stable, cached** value for the same state — returning a fresh
> object/array each call causes infinite re-renders. Use `useSyncExternalStoreWithSelector` (from
> `use-sync-external-store/shim/with-selector`) when you need to select/derive a slice.

## Why not just `useState` + `useEffect`?

The old pattern — subscribe in `useEffect`, copy the value into local state — can **miss updates**
that happen between render and the effect running, and does **not** protect against tearing under
concurrency. That's exactly the gap `useSyncExternalStore` closes. Modern state libraries
(Redux, Zustand, Jotai, etc.) already use it internally.

## Senior checklist

- Tearing = inconsistent reads of one external source within a single commit, caused by mutation
  during an interruptible render.
- Only **external mutable stores** tear; React state can't.
- Read external stores via `useSyncExternalStore` (stable, cached `getSnapshot`).
- Don't hand-roll `useState` + `useEffect` subscriptions for shared mutable stores.

## Angular equivalent

Angular's equivalent external-state concern usually appears around RxJS/store integration. Prefer async pipe, toSignal, shared streams, and lifecycle-aware subscriptions so all template consumers see coherent emissions. There is no direct useSyncExternalStore API because Angular's view/update model is different.

## References

- [React: useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [React 18 WG: Concurrent React for library maintainers (tearing)](https://github.com/reactwg/react-18/discussions/69)
- [Dan Abramov: useMutableSource → useSyncExternalStore RFC](https://github.com/reactwg/react-18/discussions/86)
- [useSyncExternalStoreWithSelector](https://www.npmjs.com/package/use-sync-external-store)
