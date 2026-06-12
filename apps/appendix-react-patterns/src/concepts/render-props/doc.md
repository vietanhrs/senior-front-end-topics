# Render Props

## The pattern

A **render prop** is a prop whose value is a **function that returns JSX**. A component owns some
state/behavior and **delegates rendering** to that function, passing the state in as arguments. The
consumer decides what the UI looks like; the component decides how the behavior works.

```jsx
<MouseTracker render={({ x, y }) => <p>The pointer is at {x}, {y}</p>} />

// children-as-a-function is the same idea, using `children`:
<MouseTracker>{({ x, y }) => <Dot x={x} y={y} />}</MouseTracker>
```

```jsx
function MouseTracker({ render, children }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ui = render ?? children;            // accept either prop
  return <div onPointerMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>{ui(pos)}</div>;
}
```

## Why it existed / what it solved

Before hooks, render props (and HOCs) were the main way to **share stateful logic** without
copy-paste: one `MouseTracker`/`Downshift`/`Formik` component held the behavior, and many call sites
rendered it differently. It avoids the HOC problems of name collisions and opaque injected props —
the data is passed **explicitly** as function arguments.

## Render props vs custom hooks (the honest take)

For **logic reuse**, **custom hooks have largely replaced render props** — no extra nesting, no
"render prop callback hell", composable, typed. If you control the logic, prefer a hook:

```jsx
const { x, y } = useMousePosition(); // flat, no wrapper
```

Render props are **still useful** when:
- The shared thing must render **DOM/structure** (e.g. a component that needs to attach handlers to
  an element it owns, like a drag container, a `<Virtualizer>`, or `react-window`'s row renderer).
- You're exposing a component API to consumers who shouldn't call hooks (a library boundary), or you
  need to pass **rendered children** computed from internal state.
- A third-party library uses them (you'll meet them in the wild).

## Pitfalls

- **Inline function = new identity each render** → can defeat memoization of the child. Memoize the
  render callback or the children below it if it matters.
- **Nesting** several render-prop components creates a "pyramid"; that's exactly what hooks flatten.

## Senior checklist

- A render prop is a **function-returning-JSX prop** (often `children`) that lets a behavior-owning
  component delegate rendering, passing state as arguments.
- It was the pre-hooks logic-sharing tool; **prefer custom hooks** for pure logic reuse now (flatter,
  composable, typed).
- Still apt when the shared unit owns **DOM/structure** or you're exposing a component-level API
  (lists/virtualizers/drag containers/library boundaries).
- Watch inline-callback identity (memoization) and render-prop nesting.

## References

- [React (legacy) docs: Render Props](https://legacy.reactjs.org/docs/render-props.html)
- [patterns.dev: Render Props](https://www.patterns.dev/react/render-props-pattern/)
- [When to use render props (vs hooks)](https://kentcdodds.com/blog/when-to-use-render-props)
