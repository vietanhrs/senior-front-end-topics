# Race conditions in UI state

## What the race is

A **race condition** in UI state happens when **multiple async operations resolve in an
unpredictable order** and a *stale* one wins, leaving the UI showing data that doesn't match the
current intent. The canonical case is **search-as-you-type**:

```
type "a"   → fetch /search?q=a   (slow, 1500ms) ─────────────────┐
type "ab"  → fetch /search?q=ab  (fast,  300ms) ───┐             │
                                                    ▼             ▼
                                          setResults(ab)   setResults(a)   ← stale wins!
UI now shows results for "a" while the input says "ab".
```

Requests don't come back in the order you sent them. Network latency, retries, caching, and server
load all reorder responses. Any "fire async, then `setState` with whatever comes back" code is
exposed.

## Where it shows up

- Search/autocomplete; filters that refetch on change.
- Tab/route switches that load data (old tab's response lands after you switched).
- Dependent fetches (`/me` then `/org`) where the user changes selection mid-flight.
- Debounced inputs still in flight when a newer one resolves.
- `useEffect` that fetches on a changing dependency without cleanup.

## The fixes

### 1. Ignore stale responses (cleanup flag) — the React idiom
`useEffect` cleanup runs **before the next effect** and **on unmount**. Use a local flag so a
superseded request can't `setState`:

```tsx
useEffect(() => {
  let ignore = false;
  fetchResults(query).then((data) => {
    if (!ignore) setResults(data);   // only the latest effect's response applies
  });
  return () => { ignore = true; };    // mark this request stale when query changes/unmounts
}, [query]);
```

### 2. AbortController — cancel the request itself
Better when the request is expensive or you want to stop it on the wire:

```tsx
useEffect(() => {
  const ctrl = new AbortController();
  fetch(`/search?q=${query}`, { signal: ctrl.signal })
    .then((r) => r.json())
    .then(setResults)
    .catch((e) => { if (e.name !== 'AbortError') throw e; });
  return () => ctrl.abort();         // cancels the in-flight request
}, [query]);
```

### 3. Sequence / request tokens
Tag each request with an incrementing id; apply a response only if it's still the latest:

```tsx
const latest = useRef(0);
async function run(q) {
  const id = ++latest.current;
  const data = await fetchResults(q);
  if (id === latest.current) setResults(data); // drop superseded responses
}
```

### 4. Let a data library handle it
React Query / SWR / RTK Query key requests by their inputs and **automatically discard stale
responses**, dedupe, and cancel — the most robust option for real apps. (They also handle caching,
retries, and `useSyncExternalStore`-based consistency.)

## Subtle points

- **`ignore` flag vs `abort`**: the flag prevents the *state update*; abort also stops the
  *network work*. Use abort for heavy/expensive requests; the flag is fine for cheap ones.
- **Don't forget non-fetch races**: timers, `await`-after-`await`, websocket messages,
  optimistic updates reconciling with server responses (next concept).
- **Last-write-wins isn't always right**: sometimes you want "first wins" or to merge — decide the
  policy explicitly rather than letting latency decide.

## Senior checklist

- Responses can arrive out of order; "setState with whatever resolves" is a latent race.
- In effects, use the `ignore` cleanup flag or `AbortController` keyed on the changing input.
- Or tag requests with a sequence id and apply only the latest; or use React Query/SWR.
- Decide the resolution policy (latest-wins/merge) deliberately; cover timers & sockets too.

## Angular equivalent

Angular's idiomatic stale-response fix is often RxJS switchMap, which cancels/ignores the previous inner request when a new input arrives. takeUntilDestroyed, AbortController, request sequence tokens, and store-level status models cover the same cases as React effect cleanup flags.

## References

- [React: Fetching data with effects (race conditions)](https://react.dev/reference/react/useEffect#fetching-data-with-effects)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [TkDodo: Why you want React Query (race handling)](https://tkdodo.eu/blog/why-you-want-react-query)
- [Dan Abramov: A Complete Guide to useEffect (race)](https://overreacted.io/a-complete-guide-to-useeffect/)
