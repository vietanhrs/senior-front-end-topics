# Finite state modeling

## The problem: "boolean soup"

Most UI bugs are **impossible states made possible**. The usual culprit is modeling a process with
a handful of independent booleans:

```ts
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError]     = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [data, setData]           = useState(null);
```

Four booleans = **2⁴ = 16 combinations**, but only a few are valid. The rest are *impossible
states* you now have to defend against everywhere: `isLoading && isError`? `isSuccess && !data`?
`isError && isSuccess`? Forget one guard and you ship a spinner-over-an-error, or an empty success.

## The fix: model a finite state machine (FSM)

A process has a **finite set of states**, and you can only move between them via explicit
**transitions** triggered by **events**. Make the *state* a single value, not a bag of booleans:

```ts
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Data }   // data exists ONLY in success
  | { status: 'error'; error: Error };  // error exists ONLY in error
```

Now `success` *carries* its data and `error` *carries* its error — the type system makes
"success without data" or "loading and error at once" **unrepresentable**. This is "make illegal
states unrepresentable."

## Transitions: a reducer or a machine

Define which events are valid in which state; everything else is ignored:

```ts
function reducer(state: State, event: Event): State {
  switch (state.status) {
    case 'idle':    return event.type === 'FETCH'   ? { status: 'loading' } : state;
    case 'loading': return event.type === 'RESOLVE' ? { status: 'success', data: event.data }
                  : event.type === 'REJECT'  ? { status: 'error', error: event.error }
                  : event.type === 'CANCEL'  ? { status: 'idle' } : state;
    case 'success': return event.type === 'FETCH'   ? { status: 'loading' } : state;
    case 'error':   return event.type === 'RETRY'   ? { status: 'loading' } : state;
  }
}
```

A stray `RESOLVE` while `idle`? Ignored — no impossible state. Rendering becomes a clean
`switch (state.status)` with **no defensive `&&` chains**.

## When to reach for a library (XState)

For complex flows — nested/parallel states, guards, entry/exit actions, delays, history,
cancellation — a statechart library like **XState** gives you formal semantics, visualization, and
testability. For most component-level flows, a discriminated-union `useReducer` is enough.

## Benefits

- **No impossible states** → fewer bugs, less defensive code.
- **Exhaustive handling**: TypeScript's discriminated unions + `switch` give you compile-time
  completeness (a `never` default catches unhandled states).
- **Explicit transitions** = a spec you can read, draw, and test; invalid events are *ignored*, not
  silently corrupting state.
- **Self-documenting**: the states and events *are* the behavior.

## Smells that you need an FSM

- Multiple `isX` booleans describing one process.
- `useEffect`s that sync booleans to keep them consistent.
- Bugs like "spinner stuck", "error + success both showing", "double submit", "back button leaves
  a half state".
- Comments like "this should never happen".

## Senior checklist

- Replace independent booleans with one discriminated-union state; co-locate data with its state.
- Define explicit transitions (reducer/machine); ignore invalid events instead of guarding everywhere.
- Make illegal states unrepresentable; use `switch` + `never` for exhaustiveness.
- Escalate to XState for nested/parallel/guarded statecharts.

## References

- [XState](https://stately.ai/docs/xstate)
- [Kent C. Dodds: Make impossible states impossible](https://kentcdodds.com/blog/make-impossible-states-impossible)
- [David Khourshid: No, disabling a button is not app logic (statecharts)](https://dev.to/davidkpiano/no-disabling-a-button-is-not-app-logic-598i)
- [Redux: discriminated-union state](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)
