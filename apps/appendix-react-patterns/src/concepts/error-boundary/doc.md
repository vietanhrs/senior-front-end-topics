# Error Boundaries

## The pattern

An **Error Boundary** is a component that **catches JavaScript errors in its child tree during
render**, logs them, and shows a **fallback UI** instead of letting the whole React app unmount to a
blank white screen. It's React's "try/catch for the component tree."

Error boundaries are still **class components** (there's no hook equivalent yet); you implement one of
two lifecycles (usually both):

```jsx
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };                 // render the fallback on the next render
  }
  componentDidCatch(error, info) {
    reportToSentry(error, info.componentStack); // side effect: log it
  }
  render() {
    if (this.state.error) return this.props.fallback ?? <DefaultFallback />;
    return this.props.children;
  }
}
```

In practice most teams use **`react-error-boundary`** (a tiny library) rather than hand-rolling —
it adds `FallbackComponent`, `onReset`, and `resetKeys`.

## What it does and does NOT catch

Error boundaries only catch errors thrown **during rendering, in lifecycle methods, and in
constructors** of the tree below them. They do **NOT** catch:

- **Event handlers** — use a regular `try/catch` (the error doesn't happen during render).
- **Asynchronous code** (`setTimeout`, promises, `fetch` `.then`) — handle with `.catch`/`try-catch`;
  to surface it in a boundary, set it into state and re-throw during render.
- **Server-side rendering** errors.
- **Errors in the boundary itself** (a parent boundary catches those).

## How to use them well

- **Granularity** — don't wrap only the root (one error blanks everything). Place boundaries around
  **independent regions** (a widget, a route, each micro-frontend — Level 10) so a failure degrades
  *locally* while the rest of the page keeps working.
- **Recovery** — give the fallback a **reset** (clear the boundary's error and remount the subtree,
  e.g. via `resetKeys` or a changing `key`) so users aren't stuck; pair with retry.
- **Report** — `componentDidCatch` is where you log to your error service with the **component stack**.
- **Routes** — frameworks (React Router, Next.js) provide route-level error boundaries; lean on them.

## Senior checklist

- Error boundaries catch **render/lifecycle/constructor** errors in their subtree and show a
  **fallback** instead of a blank screen; implement `getDerivedStateFromError` (UI) +
  `componentDidCatch` (logging). Still class-only.
- They do **not** catch **event handlers** or **async** — use `try/catch`/`.catch` there (re-throw in
  render to surface in a boundary).
- Place boundaries around **independent regions** for local failure isolation; offer a **reset**;
  report with the component stack.
- Prefer **`react-error-boundary`** and your router's error boundaries over hand-rolling.

## References

- [React: Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [bvaughn/react-error-boundary](https://github.com/bvaughn/react-error-boundary)
- [React: componentDidCatch / getDerivedStateFromError](https://react.dev/reference/react/Component#componentdidcatch)
