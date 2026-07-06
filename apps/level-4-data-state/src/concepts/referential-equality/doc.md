# Referential equality

## Identity vs value

JavaScript compares **primitives by value** and **objects (incl. arrays & functions) by
reference**:

```js
1 === 1                  // true
'a' === 'a'              // true
{} === {}                // false  (two different objects)
[1] === [1]              // false
const f = () => {}; f === f          // true
(() => {}) === (() => {})            // false
```

React's `Object.is` comparison (used for state bailouts, `React.memo`, `useMemo`/`useCallback`/
`useEffect` dependency arrays) is **reference equality** for objects. So *creating a new object,
array, or function* — which JSX does on **every render** — produces a **new identity** that
compares `!==` to the previous one, even if the contents are identical.

## The core problem: fresh identities each render

Every render, these expressions create **brand-new** references:

```tsx
<Child
  style={{ color: 'red' }}            // new object each render
  items={data.filter(Boolean)}        // new array each render
  onClick={() => doThing(id)}         // new function each render
/>
```

Consequences:

- **`React.memo(Child)` is defeated.** `memo` shallow-compares props by reference; a new
  `style`/`onClick`/`items` every render means props always look "changed" → Child re-renders
  regardless. The memo does nothing but add overhead.
- **`useEffect`/`useMemo`/`useCallback` deps fire every time.** A dependency that's a fresh object
  each render makes the effect run on every render (and can loop if the effect sets state).
- **Custom equality checks lie.** Selector memoization (Reselect), `useMemo`, context value
  identity — all break if you hand them new references each render.

## Stabilizing references

- **`useMemo`** for derived objects/arrays you pass down or depend on:
  `const items = useMemo(() => data.filter(Boolean), [data]);`
- **`useCallback`** for functions passed to memoized children or used as deps:
  `const onClick = useCallback(() => doThing(id), [id]);`
- **Hoist constants** out of the component (a literal that never changes doesn't belong in render).
- **Lift/normalize**: derive primitives for deps when possible (`id` not the whole object).
- **Context value**: memoize the provider `value={useMemo(() => ({...}), [deps])}` so consumers
  don't all re-render each provider render.

```tsx
const value = useMemo(() => ({ user, logout }), [user, logout]);
<AuthContext.Provider value={value}>…</AuthContext.Provider>
```

## But don't over-correct

`useMemo`/`useCallback` aren't free — they add memory + a deps comparison, and only help when:

1. the value is passed to a **memoized** child / used in a **dependency array**, **or**
2. computing it is genuinely **expensive**.

Memoizing a cheap inline handler on a non-memoized child is pure overhead (see "Memoization
pitfalls"). The React Compiler (React 19) can auto-memoize, reducing the need for manual hooks.

## A note on equality flavors

- **Reference (`===`/`Object.is`)**: same object in memory. What React uses.
- **Shallow equal**: same top-level keys/values by `===` (what `React.memo`/`shallowEqual` do).
- **Deep equal**: recursive value comparison (expensive; avoid in hot paths). A custom
  `areEqual` in `React.memo` can do this but usually costs more than it saves.

## Senior checklist

- Objects/arrays/functions compare by **reference**; JSX makes new ones each render.
- New identities defeat `React.memo` and re-fire `useMemo`/`useEffect`/`useCallback` deps.
- Stabilize with `useMemo`/`useCallback`, hoisting constants, and primitive deps.
- Only memoize when feeding a memoized child / dep array or when the computation is expensive.

## Angular equivalent

Angular's closest equivalent is OnPush input reference checks plus signal invalidation. New object identities can still cause unnecessary work, while in-place mutation can hide changes. Use stable inputs for OnPush components, computed for derived values, and immutable updates for data crossing component/store boundaries.

## References

- [React: memo](https://react.dev/reference/react/memo)
- [React: useMemo](https://react.dev/reference/react/useMemo)
- [React: useCallback](https://react.dev/reference/react/useCallback)
- [Kent C. Dodds: When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
