# Custom Hooks

## The pattern

A **custom hook** is a function whose name starts with `use` and that calls other hooks. It lets you
**extract and reuse stateful logic** between components — the modern, idiomatic replacement for most
uses of HOCs and render props.

```jsx
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle, setOn];
}

// reuse the LOGIC across components; each call gets its OWN state
function Panel() {
  const [open, toggleOpen] = useToggle();
  return <button onClick={toggleOpen}>{open ? 'Hide' : 'Show'}</button>;
}
```

## The key mental model: shared logic, not shared state

This trips people up: a custom hook is **not** a store. Two components calling `useToggle()` get
**two independent pieces of state** — the hook is just a recipe that runs fresh on each call. To
share *state*, you need a shared source (Context/store) that the hook reads from (Provider pattern).

## Rules of Hooks (non-negotiable)

- **Only call hooks at the top level** — never inside conditions, loops, or nested functions. React
  matches hook calls to state by **call order**; conditional calls corrupt that mapping.
- **Only call hooks from React functions** (components or other hooks).

## Why custom hooks beat HOC/render props

- **No wrapper hell** — they add logic without adding to the component tree (HOCs/render props nest).
- **Composable** — a hook can call other hooks; combine `useFetch` + `useDebounce` freely.
- **Typed & explicit** — inputs/outputs are plain function args/returns, not magic injected props.
- **Testable** — test the hook in isolation (e.g. `@testing-library/react`'s `renderHook`).

## Good custom-hook hygiene

- **Name the return** clearly: a tuple `[value, setValue]` for symmetric pairs, or an **object**
  `{ data, error, loading }` when there are several values (so call sites destructure by name).
- **Stabilize callbacks** with `useCallback` and memoize derived values so consumers don't re-render
  needlessly.
- **Encapsulate effects + cleanup** inside the hook (subscriptions, timers, listeners) so consumers
  can't forget teardown.
- **Keep them focused** — one concern per hook; compose small hooks instead of one mega-hook.

## Senior checklist

- Custom hooks extract **reusable stateful logic**; each call has **independent state** (not a shared
  store).
- Obey the **Rules of Hooks** (top-level only, React functions only) — order-based state mapping
  depends on it.
- Prefer hooks over HOC/render props: no wrapper nesting, composable, typed, testable.
- Return a tuple for pairs / an object for many values; stabilize callbacks; own effect cleanup; keep
  each hook single-purpose.

## References

- [React: Reusing logic with custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [usehooks.com — example hooks](https://usehooks.com/)
