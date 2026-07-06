# Concurrent rendering tearing

## What "tearing" means

**Tearing** is when a single rendered output shows **two different values of the same source** at
once — the screen is "torn" between an old and a new state. The term comes from graphics (a frame
buffer updated mid-scan shows half the old image, half the new). In React it happens when an
**external mutable store** changes *during* a render, and because concurrent rendering is
**interruptible and sliced**, some components in the same commit read the old value and others read
the new one.

```
store.value = 0
   render row 0 ─ reads 0
   render row 1 ─ reads 0
   ⏸ render is interrupted / sliced …
   store.value = 1            ← external mutation between slices
   ▶ render row 2 ─ reads 1   ← TORN: same commit, two values
   render row 3 ─ reads 1
```

In React's **legacy synchronous** mode this couldn't happen: a render ran start-to-finish in one
uninterruptible go, so every component saw the same store value. **Concurrent rendering** (time
slicing, `startTransition`, Suspense) can pause between components — opening the window for an
external store to change mid-render.

## Why only *external* stores tear

React state (`useState`/`useReducer`) is captured per render — it can't change mid-render. The
danger is data that lives **outside** React and mutates independently:

- a Redux/Zustand store read in a `useSelector`-style hook,
- a module-level variable / event emitter,
- `window`, `navigator`, a shared cache, anything with a mutable snapshot.

If those are read with a naive `useState + useEffect(subscribe)` pattern, concurrent rendering can
read a value that's already stale or already changed for *some* of the components.

## The fix: `useSyncExternalStore`

React 18+ provides `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` specifically to
make external reads **tear-free**:

```js
function useStoreValue() {
  return useSyncExternalStore(
    store.subscribe,        // (cb) => unsubscribe
    store.getSnapshot,      // () => current value (must be cheap & referentially stable)
    store.getServerSnapshot // () => value during SSR
  );
}
```

How it prevents tearing:
- React reads the snapshot **synchronously and consistently** for the whole tree.
- If the store changes **during** a concurrent render, React detects it (the snapshot it read no
  longer matches) and **re-renders synchronously / restarts**, abandoning the torn in-progress work
  so the commit is consistent.
- `getSnapshot` must return a **stable** value for unchanged state (return the same object
  reference), or React loops re-rendering. Don't return a fresh object each call.

## Senior checklist

- Tearing = one commit shows two values of the same external source, enabled by concurrent
  rendering's interruptibility.
- React's own state can't tear; **external mutable stores read naively** can.
- Use `useSyncExternalStore` for any external source — it reads a consistent snapshot and bails out
  of concurrent rendering when the store changes mid-render.
- `getSnapshot` must be cheap and referentially stable (cache the snapshot; don't allocate per call)
  or you get infinite re-renders.

## Angular equivalent

Angular does not have React concurrent render tearing, but it can still show inconsistent external state if multiple manual subscriptions update fields independently. Prefer one shared stream, combineLatest into a view model, async pipe, or toSignal for a coherent snapshot.

## References

- [React: useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [React 18 working group: concurrent rendering & tearing](https://github.com/reactwg/react-18/discussions/69)
- [React: startTransition](https://react.dev/reference/react/startTransition)
