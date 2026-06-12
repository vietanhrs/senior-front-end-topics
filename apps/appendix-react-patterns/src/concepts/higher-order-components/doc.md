# Higher-Order Components (HOC)

## The pattern

A **Higher-Order Component** is a **function that takes a component and returns a new component**,
wrapping it with extra behavior or injected props. It's React's take on the higher-order-function
idea (like `connect()` from React-Redux, `withRouter`, `withTranslation`).

```jsx
function withLoading(Wrapped) {
  function WithLoading({ isLoading, ...rest }) {
    if (isLoading) return <Spinner />;
    return <Wrapped {...rest} />;
  }
  WithLoading.displayName = `withLoading(${Wrapped.displayName ?? Wrapped.name})`;
  return WithLoading;
}

const UserListWithLoading = withLoading(UserList);
<UserListWithLoading isLoading={loading} users={users} />;
```

HOCs **compose**: `withAuth(withLoading(withTheme(Page)))`.

## HOC hygiene (the easy-to-get-wrong parts)

- **Pass through unrelated props** — spread `{...rest}` so you don't swallow the wrapped component's
  props.
- **Set `displayName`** (`withX(Inner)`) or DevTools shows a useless `WithLoading`.
- **Don't mutate** the input component; **compose** it.
- **Forward refs** — a plain HOC breaks `ref` (the ref lands on the wrapper). Use `forwardRef` inside
  the HOC to pass it through.
- **Hoist non-React statics** (`hoist-non-react-statics`) if the wrapped component had static methods.
- **Create the wrapped component once** (module scope), **never inside render** — doing it in render
  remounts the whole subtree every render (state loss, perf).

## Problems that pushed the ecosystem to hooks

- **Wrapper hell** — deep trees of `withX(withY(...))` clutter DevTools and the DOM.
- **Prop name collisions** — two HOCs inject `data` and clobber each other; the source is invisible
  at the call site.
- **Indirection** — where did this prop come from? You have to trace the HOC stack.

**Custom hooks** solve the same "share logic" goal without any of these (no wrapper, explicit
inputs/outputs, no collisions), which is why HOCs are now mostly **legacy** — you'll still meet them
in older code and some libraries.

## When an HOC still fits

- Cross-cutting concerns applied **uniformly to many components** at the boundary (auth gating,
  error/loading wrappers, analytics, feature flags) — especially where you want to wrap a component
  you don't control.
- Library APIs that predate or can't assume hooks.

## Senior checklist

- HOC = `Component → Component`, injecting props/behavior; composes and is great for cross-cutting
  wrappers.
- Mind hygiene: spread `...rest`, set `displayName`, **forward refs**, hoist statics, and **never
  create the HOC-wrapped component inside render**.
- Its weaknesses (wrapper hell, prop collisions, indirection) are exactly what **custom hooks** fix —
  prefer hooks for new logic reuse.
- Reach for HOCs for uniform boundary concerns or when wrapping components you don't own.

## References

- [React (legacy) docs: Higher-Order Components](https://legacy.reactjs.org/docs/higher-order-components.html)
- [patterns.dev: HOC Pattern](https://www.patterns.dev/react/hoc-pattern/)
