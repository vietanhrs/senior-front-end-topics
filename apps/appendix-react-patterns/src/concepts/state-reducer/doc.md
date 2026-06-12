# State Reducer Pattern

## The pattern

The **State Reducer pattern** (popularized by Kent C. Dodds, used in Downshift) is the most powerful
form of **inversion of control** for component state. A reusable component manages its state with a
reducer internally, but lets the **consumer pass in their own `stateReducer`** that can **inspect,
modify, or veto every state transition** — without the component having to anticipate each use case.

```jsx
function useToggle({ stateReducer = (state, changes) => changes } = {}) {
  const [state, dispatch] = useReducer((state, action) => {
    const changes = internalReducer(state, action);    // what the component WOULD do
    return stateReducer(state, changes, action);       // let the consumer have the final say
  }, { on: false, count: 0 });

  return {
    ...state,
    toggle: () => dispatch({ type: 'toggle' }),
    reset: () => dispatch({ type: 'reset' }),
  };
}
```

The consumer's reducer receives the **current state**, the **proposed changes**, and the **action**,
and returns the state that will actually be committed — so they can enforce arbitrary rules.

## Why it's different from "just expose props"

Normally you customize a component by adding props (`maxToggles`, `disableAfter`, `allowReset`…).
That doesn't scale — you can't foresee every rule, and the prop surface explodes. The state reducer
**inverts control**: instead of the component guessing which knobs to expose, it hands the consumer
the *entire* state-transition function. One escape hatch covers infinitely many rules:

```jsx
// consumer enforces "can't toggle on more than 4 times" — the component never knew about this rule
const { on, count, toggle } = useToggle({
  stateReducer(state, changes, action) {
    if (action.type === 'toggle' && state.count >= 4) return state; // veto
    return changes;
  },
});
```

## When to use it

- You're building a **reusable/library component** and keep getting "can it also do X?" requests.
- Consumers need to **constrain or tweak** behavior (clamp, disallow, derive extra state, sync with
  external state) that you don't want to hard-code.

For app-internal one-offs, it's overkill — just `useReducer`/`useState` directly. The pattern earns
its complexity at a **reuse boundary**.

## Related: props getters often accompany it

State reducers control *state*; **props getters** (next pattern) control *prop wiring*. Libraries
like Downshift expose both: maximum flexibility while keeping accessibility/behavior correct by
default.

## Senior checklist

- State Reducer = the component runs its internal reducer, then calls a **consumer-supplied
  `stateReducer(state, changes, action)`** that has the final say → ultimate inversion of control.
- It replaces an ever-growing pile of behavior props with **one** extensible hook over every
  transition.
- Pass `state`, the proposed `changes`, and the `action` so consumers can veto/modify precisely.
- Use it at **reuse/library boundaries**; plain `useReducer` is fine for app-internal state.

## References

- [Kent C. Dodds: The State Reducer Pattern with Hooks](https://kentcdodds.com/blog/the-state-reducer-pattern-with-react-hooks)
- [Downshift (uses state reducer + props getters)](https://www.downshift-js.com/)
- [React: useReducer](https://react.dev/reference/react/useReducer)
