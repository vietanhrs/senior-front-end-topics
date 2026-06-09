# Concurrent rendering

## The core idea

**Concurrent rendering** (React 18+) means React can **prepare multiple versions of the UI at
the same time** and, crucially, **interrupt an in-progress render** to handle something more
urgent. Rendering is no longer an all-or-nothing, blocking operation.

This is not multithreading — it's still one thread. It's *cooperative scheduling*: React renders
in small chunks on the Fiber tree, and between chunks it can yield to the browser, abandon a
half-finished render, or switch to a higher-priority update. (The "render in chunks" part is
**time slicing**; the "what's more urgent" part is **scheduler priorities** — separate concepts.)

## Why it matters: keep urgent updates snappy

The classic problem: a user types into a search box that filters a huge list. In legacy React,
each keystroke triggers a synchronous re-render of the whole list, blocking the input — typing
feels laggy. With concurrent rendering you mark the expensive update as **non-urgent** so React
keeps the input responsive and renders the list in the background, interrupting it if the user
keeps typing.

## The APIs

### `useTransition`
Marks state updates inside `startTransition` as **low priority / interruptible**, and gives you
an `isPending` flag for UI feedback.

```tsx
const [isPending, startTransition] = useTransition();

function onChange(e) {
  setQuery(e.target.value);              // urgent: update the input immediately
  startTransition(() => {
    setResults(filter(allItems, e.target.value)); // non-urgent: can be interrupted
  });
}
```

### `useDeferredValue`
Lets a value "lag behind" — React renders with the previous value first, then re-renders with
the updated value at low priority. Great when you don't own the setter:

```tsx
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => filter(allItems, deferredQuery), [deferredQuery]);
// `results` lags behind `query`; the input stays responsive.
```

## What "interruptible" buys you

- **Urgent updates preempt non-urgent ones.** A keystroke (urgent) interrupts the in-progress
  list render (transition). React throws away the partial work and restarts later.
- **No torn commits.** Because of double buffering, the half-rendered tree is never shown — the
  screen only updates when a render fully commits.
- **`isPending` UX.** You can show the *old* UI (slightly dimmed) while the next one is being
  prepared, instead of a hard spinner or a frozen frame.

## Requirements & gotchas

- Requires `createRoot` (the concurrent root). `ReactDOM.render` (legacy) opts out of all of this.
- Transitions are for **non-urgent** updates (navigations, filtering, expensive recomputes), not
  for things that must feel instant (text input value, toggles).
- The render work inside a transition must still be **pure and idempotent** — it can run multiple
  times (interrupted/restarted), so no side effects in render.
- Concurrency exposes **tearing** if you read from an external mutable store without
  `useSyncExternalStore` (see "Tearing in concurrent UI").
- It doesn't make slow renders fast — it makes them **non-blocking**. Still memoize / virtualize
  genuinely heavy lists.

## Senior checklist

- Concurrent rendering = interruptible, cooperative scheduling on one thread (not threads).
- Use `useTransition` when you own the setter; `useDeferredValue` when you only have the value.
- Keep urgent updates (input) out of the transition; only the expensive part goes in.
- Render must stay pure/idempotent; external stores need `useSyncExternalStore`.

## References

- [React: useTransition](https://react.dev/reference/react/useTransition)
- [React: useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [React 18: startTransition / concurrent features](https://react.dev/blog/2022/03/29/react-v18)
- [React Working Group: concurrent rendering discussions](https://github.com/reactwg/react-18/discussions)
