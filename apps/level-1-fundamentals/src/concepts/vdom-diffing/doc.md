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

Important nuance: **O(n) does not mean every render is cheap.** It means React scans the relevant
sibling lists once instead of solving the minimum tree-edit problem. The constant cost and the
number of real DOM mutations still depend on how stable your tree is.

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

## When diffing is fast vs slow

React diffing is usually fast when React can match the new elements to existing fibers with
the same `type`, stable `key`, and similar sibling position:

- **Same component type, same position, same key** → reuse the fiber/DOM node, update only changed
  props/text.
- **Appending to the end of a keyed list** → scan the old list, create one new child.
- **Stable keyed reorder** → React can preserve state/DOM for each item, then move nodes as needed.
- **Memoized subtrees / unchanged props** → React may bail out and skip deeper work entirely.

It becomes slow or behaviorally expensive when the match fails or when the "cheap" diff still
implies lots of work:

- **Root type changes** (`<ul>` → `<ol>`, `<Counter>` → `<Profile>`) → React tears down the old
  subtree and mounts a new one. That is O(size of subtree), loses state, and creates/removes DOM.
- **Unstable keys** (`Math.random()`, changing generated keys) → every render looks like a brand
  new list, so React remounts everything.
- **Index keys in dynamic lists** → the scan is still O(n), but identity is wrong: state, focus,
  uncontrolled DOM values, and animations stick to positions instead of items.
- **Prepending/inserting without keys** → React compares by position, so many siblings appear to
  have changed even if the logical items only shifted.
- **Huge unchanged-looking trees that still re-render** → O(n) over 20,000 elements is still real
  CPU work unless memoization/windowing lets React skip it.
- **Large DOM mutation commits** → diffing might be linear and correct, but inserting/removing/
  moving thousands of real nodes is still expensive in the browser.

Interview answer: React's heuristic diff is **predictably linear**, not magically cheap. It is
fast when identity is stable and the touched subtree is small. It is slow or state-breaking when
keys/types/positions make React remount or touch too much.

## Complexity at a glance

| Operation | Without proper keys | With proper keys |
|---|---|---|
| Append 1 item at the end | cheap scan + create 1 node | cheap scan + create 1 node |
| Insert 1 item at the head | compares many shifted positions; can update ~n nodes | creates 1 node and preserves existing item identity |
| Reorder | wrong state + many apparent updates | preserves item state; may move DOM nodes |
| Stable props in a memoized subtree | can bail out early | can bail out early |
| Random key every render | remounts everything | still remounts everything — the key is unstable |
| Change root `type` | rebuild subtree | rebuild subtree (unavoidable) |

## Senior checklist

- Explain why O(n³) → O(n): the type & key assumptions.
- Explain that O(n) is a heuristic scan, not a guarantee of small work; fast depends on stable
  identity, small touched subtrees, and few real DOM mutations.
- Keys: stable + unique among siblings; **never** index for dynamic lists; **never** random.
- Changing `type` = losing subtree state (sometimes used intentionally to reset state by
  changing `key`).
- Reconciliation internals (Fiber, double buffering) come in Level 2.

## Angular equivalent

Angular does not normally build a Virtual DOM tree and diff it like React. Angular compiles templates into instructions and refreshes binding slots in existing views. The closest identity lesson is React key -> Angular @for (...; track item.id) / trackBy: stable identity preserves DOM, directive instances, component state, and embedded views across reorder/insert/delete operations.

## References

- [React: Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [React (legacy docs): Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html)
- [React: Rendering Lists & keys](https://react.dev/learn/rendering-lists)
- [Why you need keys (Dan Abramov)](https://twitter.com/dan_abramov/status/1415279090446204929)
