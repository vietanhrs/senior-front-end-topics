# Reconciliation algorithm

## What reconciliation is

**Reconciliation** is the process React uses to figure out *what changed* between the previous
render and the next one, and what minimal set of DOM mutations are needed to reflect it. It's
the "diffing" engine — but the important part for a senior is the **rules that decide whether a
component instance is preserved or thrown away**, because those rules determine where **state,
effects, focus, and DOM** survive.

> Level 1 covered the *complexity* (O(n³) → O(n) via type + key heuristics). Here we focus on
> the *consequences*: when state is kept vs reset, and how to control it.

## The mental model: position + type identify an instance

React identifies a component instance by its **position in the render tree** plus its
**element type** (and `key`, among siblings). On each render React walks the tree and, at each
position, compares the new element's type with the previous one:

- **Same type at the same position** → React **keeps** the existing instance: it preserves
  state and the DOM node, and just updates props. (Re-render, no remount.)
- **Different type at the same position** → React **unmounts** the old subtree (runs cleanup,
  destroys DOM, loses state) and **mounts** a brand new one.

```tsx
// Same type, same position -> state preserved across the toggle
{isOpen ? <Panel mode="a" /> : <Panel mode="b" />}

// Different type, same position -> Panel state is DESTROYED when toggling
{isOpen ? <Panel /> : <OtherPanel />}
```

## The subtle traps

### 1. Same component, different DOM parent → remount
If you render the same component in two structurally different branches, React sees a different
*position* and remounts it, losing state:

```tsx
// ❌ Counter remounts (state resets) every time `wide` flips, because it's a
// different position in the tree.
{wide
  ? <div className="wide"><Counter /></div>
  : <section className="narrow"><Counter /></section>}

// ✔ Keep one structure, vary only props/className -> state preserved
<div className={wide ? 'wide' : 'narrow'}><Counter /></div>
```

### 2. Inline component definitions → remount every render
Defining a component **inside** another component creates a new function identity each render →
React treats it as a different type → remount on every parent render (state loss + perf):

```tsx
function Parent() {
  // ❌ New `Child` type on every render -> remounts, loses state
  const Child = () => <input />;
  return <Child />;
}
```

### 3. Using `key` to *intentionally reset* state
The flip side is useful: change the `key` to force a remount and reset state — e.g. reset a form
when the edited entity changes:

```tsx
// Switching userId remounts the form, clearing its internal state
<EditForm key={userId} userId={userId} />
```

## Lists: keys identify siblings

Among siblings, `key` overrides position. A stable, unique key lets React match instances across
reorders/insertions and preserve their state; `index` keys (or `Math.random()`) break this for
dynamic lists. (See Level 1 — Virtual DOM diffing.)

## Render phase vs commit

Reconciliation happens in the **render phase** (pure, interruptible under concurrent React —
see Fiber). The resulting mutations are applied in the **commit phase**. This is why render must
be side-effect-free: it may run multiple times or be discarded before commit.

## Senior checklist

- State is tied to **(position + type + key)**, not to where you "think" the component is.
- Different type at a position = unmount + mount (lost state, fired cleanup).
- Never define components inside render; it forces remounts.
- Use `key` to deliberately reset state when identity changes.

## References

- [React: Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [React: Keeping components pure](https://react.dev/learn/keeping-components-pure)
- [React (legacy): Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html)
- [React: `key` to reset state](https://react.dev/learn/preserving-and-resetting-state#resetting-state-with-a-key)
