# Virtual DOM diffing complexity

## The root problem

Comparing two arbitrary trees to find the minimum set of transformations is an **O(n³)**
problem (n = number of nodes). For UIs with thousands of nodes this is infeasible on every
render. So React (and other Virtual DOM frameworks) **don't solve the general problem** —
they use **heuristics** to bring it down to **O(n)**.

## React's two heuristics

React reduces the complexity with two pragmatic assumptions:

1. **Two elements of different `type` → throw away the whole subtree and rebuild it.**
   A `<div>` becoming a `<span>`, or `<Counter>` becoming `<Profile>` → React unmounts the
   entire old subtree (losing all state) and mounts the new one. It does **not** try to
   "move" nodes between different types.

2. **For lists of children, use `key` to identify elements across renders.**
   A `key` tells React "this is still the same element, just moved/with new props", letting
   React **move** the DOM instead of destroying + recreating it.

```
General diff:    O(n³)   ❌ too expensive
React heuristic: O(n)    ✔ thanks to the two assumptions above
```

## Why `key` matters so much

When rendering a list, React walks old and new children in parallel by `key`:

- matching `key` → **keep** the instance, only update props (preserves DOM, state, focus, scroll).
- new `key` → **create** a new instance.
- disappearing `key` → **destroy** the old instance.

### Using `index` as the key — the classic trap

```tsx
{items.map((item, i) => <Row key={i} item={item} />)} // ❌
```

When you **insert/remove/reorder** the list, each element's `index` changes. React thinks
"the element at position 0 is still the old one" while the item is actually different →
**state/DOM gets attached to the wrong row**:

- The text in an `<input>` jumps to a different row.
- A checkbox ticks the wrong item.
- Animations glitch, focus is lost.

`index` is only safe when the list is **static** (no reorder, no insert/remove in the middle).

### Use a stable, unique key

```tsx
{items.map((item) => <Row key={item.id} item={item} />)} // ✔
```

A `key` must be **stable** (unchanged across renders) and **unique among siblings** (it
doesn't need to be globally unique). Don't use `Math.random()` as a key — each render produces
a new key → React destroys + recreates everything, killing both performance and state.

## Diffing works level-by-level

React diffs **breadth-first, one level at a time**; it does not try to find matching nodes
across different levels. That's why "lifting" a node to a different parent makes it remount.
A stable tree structure → cheap diffs.

## Complexity at a glance

| Operation | Without proper keys | With proper keys |
|---|---|---|
| Insert 1 item at the head (n items) | updates ~n nodes | inserts 1 node |
| Reorder | wrong state + many mutations | move, state preserved |
| Change root `type` | rebuild subtree | rebuild subtree (unavoidable) |

## Senior checklist

- Explain why O(n³) → O(n): the type & key assumptions.
- Keys: stable + unique among siblings; **never** index for dynamic lists; **never** random.
- Changing `type` = losing subtree state (sometimes used intentionally to reset state by
  changing `key`).
- Reconciliation internals (Fiber, double buffering) come in Level 2.

## References

- [React: Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [React (legacy docs): Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html)
- [React: Rendering Lists & keys](https://react.dev/learn/rendering-lists)
- [Why you need keys (Dan Abramov)](https://twitter.com/dan_abramov/status/1415279090446204929)
