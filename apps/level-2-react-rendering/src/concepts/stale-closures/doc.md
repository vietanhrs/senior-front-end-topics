# Stale closure problems

## What a stale closure is

Every render of a component creates **new** function instances that **close over the props and
state of that specific render**. A **stale closure** is when a function keeps running later but
still "remembers" values from an **old** render — so it reads outdated state/props.

This is not a React bug; it's how JavaScript closures + React's render model interact. React
state is **immutable per render**: `count` inside a given render is a constant. A callback created
in that render will forever see that constant, unless it's recreated or it reads the latest value
some other way.

## The canonical bug: `setInterval` in an effect

```tsx
function Timer() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);   // ❌ `count` is 0 forever — captured from the first render
    }, 1000);
    return () => clearInterval(id);
  }, []);                    // effect runs once; the closure is frozen with count = 0
  return <p>{count}</p>;     // jumps to 1, then stuck
}
```

The effect runs once (empty deps). The interval callback closes over `count === 0`, so every
tick computes `setCount(0 + 1)` → the value sticks at 1.

## The fixes

### 1. Functional updater (best for "next from previous")
Don't read the captured value at all — derive from the latest state:

```tsx
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000); // ✔ always latest
  return () => clearInterval(id);
}, []);
```

### 2. Add it to the dependency array
Let the effect re-subscribe whenever the value changes (recreates the closure):

```tsx
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, [count]); // re-runs each change — correct, but tears down/sets up the interval every tick
```

### 3. A ref that always holds the latest value (for non-state deps / callbacks)
When you need the freshest value inside a long-lived callback but don't want to re-subscribe:

```tsx
const latest = useRef(value);
useEffect(() => { latest.current = value; });        // keep it current every render
useEffect(() => {
  const id = setInterval(() => doSomething(latest.current), 1000); // reads fresh value
  return () => clearInterval(id);
}, []);
```

## Where else stale closures bite

- **Event handlers passed to non-React systems** (`addEventListener`, `socket.on`, map/chart
  libs) registered once in an effect → they capture old state.
- **`useCallback`/`useMemo` with missing deps** → a memoized callback keeps stale values; passing
  it down means children act on outdated data.
- **`setTimeout`/debounce/throttle** created once but firing later.
- **Async effects**: code after an `await` runs in a later tick but still reads the render-time
  variables (and may set state after unmount → use an `ignore`/`AbortController` guard).

## The mental model & guidance

- Treat each render's props/state as a **snapshot**: a closure sees the snapshot it was born in.
- The ESLint rule **`react-hooks/exhaustive-deps`** exists to catch missing deps — don't silence
  it blindly; fix the dependency or restructure (functional updater / ref).
- Prefer **functional updaters** for state derived from previous state.
- Use a **ref** to bridge "latest value" into long-lived callbacks without re-subscribing.

## Senior checklist

- Closures capture the render they were created in; React state is constant within a render.
- Empty-deps effects freeze their closures — use functional updaters or refs to read latest.
- Don't ignore `exhaustive-deps`; it surfaces exactly these bugs.
- Watch external subscriptions, timers, debounced callbacks, and post-`await` code.

## Angular equivalent

Angular avoids hook dependency arrays, but JavaScript closures still go stale. Watch callbacks/subscriptions created in ngOnInit that capture an initial input; read signal inputs at use time, use computed for pure derivation, and clean up with DestroyRef / takeUntilDestroyed / effect cleanup.

## References

- [React: Removing Effect dependencies](https://react.dev/learn/removing-effect-dependencies)
- [React: useEffect — updating state based on previous state](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)
- [Dan Abramov: A Complete Guide to useEffect (stale closures)](https://overreacted.io/a-complete-guide-to-useeffect/)
- [React: useRef to read latest value](https://react.dev/reference/react/useRef)
