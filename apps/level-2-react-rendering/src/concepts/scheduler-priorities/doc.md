# Scheduler priorities

## The problem priorities solve

When several updates are pending, React must decide **what to render first**. Not all updates
are equal: a keystroke or click must feel instant; recomputing a big list or navigating can
wait a few milliseconds. **Priorities** let React render urgent work first and **interrupt or
postpone** less urgent work — the engine behind concurrent rendering and time slicing.

## Lanes: how React represents priority

Internally, React currently assigns updates to **lanes**. Think of lanes as priority buckets that
let React group compatible work and choose what should render next. The lane bitmask layout is an
implementation detail and can change across React versions, but the mental model is still useful:
urgent work should preempt less urgent work.

Lanes let React:

- pick the **highest-priority** pending work to render next,
- **batch** updates that share compatible lanes into one render,
- **interrupt** a low-priority render when a higher-priority update arrives,
- keep track of which updates are still "in flight" after an interruption.

You never manipulate lanes directly; you express intent through APIs, and React maps that intent
to lanes.

## The priority tiers (roughly, high → low)

| Tier | Triggered by | Behavior |
|---|---|---|
| **Discrete / urgent** | click, keypress, input, submit | rendered synchronously-ish, never sliced; must feel instant |
| **Continuous** | scroll, mousemove, drag | high, but coalesced |
| **Default** | normal `setState`, network callbacks, timeouts | standard priority |
| **Transition** | `startTransition` / `useTransition` | low, interruptible, time-sliced |
| **Deferred** | `useDeferredValue` | renders the new value at low priority, old value stays meanwhile |
| **Idle** | offscreen / lowest | only when nothing else is pending |

The key rule: **urgent updates preempt transitions.** If React is mid-way through a transition
render and you press a key, React abandons (or pauses) that render, processes the urgent update
so the input stays responsive, then resumes/restarts the transition.

## Expressing priority in your code

```tsx
// Urgent (default): the input must update on every keystroke
setQuery(value);

// Low priority: this expensive update may be interrupted by urgent ones
startTransition(() => setResults(filter(all, value)));

// Low priority value that lags behind without you owning the setter
const deferred = useDeferredValue(query);
```

There's also the lower-level `scheduler.postTask` (web platform) and React's internal
`scheduler` package, but in app code you almost always use `useTransition` / `useDeferredValue`.

## Automatic batching

React 18+ **batches all updates by default** — multiple `setState` calls in the same tick (even
inside promises, timeouts, native event handlers) are grouped into a single render. This is a
scheduling decision too: fewer renders, and updates with compatible priority commit together.
Use `flushSync` only when you must force a synchronous, un-batched commit (rare).

## Gotchas

- Don't put truly urgent UI (controlled input value, a toggle) inside a transition — it'll feel
  laggy under load because it's now interruptible.
- Transitions can be **starved** if urgent updates keep arriving; that's by design (urgent wins),
  but watch for transitions that "never finish" while the user keeps typing.
- `isPending` reflects that a transition is in progress — use it for "stale/updating" UI, not as
  a data-loading spinner.

## Senior checklist

- Updates carry scheduler priority; React renders highest priority first and interrupts lower priority.
- Lanes are useful for source-level reasoning, but their exact bit layout is not app-level API.
- Urgent (input/click) > default > transition/deferred > idle.
- Express priority via `useTransition` / `useDeferredValue`; keep urgent UI out of transitions.
- React 18 batches by default; `flushSync` opts out (rarely needed).

## References

- [React: useTransition](https://react.dev/reference/react/useTransition)
- [React 18: automatic batching](https://react.dev/blog/2022/03/29/react-v18#automatic-batching)
- [React lanes model (source notes)](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberLane.js)
- [MDN: scheduler.postTask](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask)
