# Optimistic UI & rollback strategy

## What optimistic UI is

An **optimistic update** applies the *expected* result of an action to the UI **immediately**,
before the server confirms it — assuming success. If the server later **fails**, you **roll back**
to the previous state (and usually surface an error). It trades a small risk of a visible revert
for a UI that feels instant.

```
Pessimistic:  click → spinner …………… server OK → update UI         (feels laggy)
Optimistic:   click → update UI now → server OK → keep (reconcile)  (feels instant)
                                    → server FAIL → roll back + error
```

Use it for high-frequency, low-stakes, usually-succeeding actions: likes, toggles, reorder,
add-to-cart, inline edits. Avoid it for irreversible/high-stakes actions (payments, destructive
deletes) — there a confirmation/pessimistic flow is safer.

## The rollback mechanics

The essential pattern: **capture the previous state, apply the optimistic change, and on error
restore the snapshot.**

```tsx
async function toggleLike(id) {
  const prev = items;                          // 1. snapshot for rollback
  setItems(applyToggle(items, id));            // 2. optimistic update (instant)
  try {
    const serverState = await api.toggleLike(id);
    setItems((cur) => reconcile(cur, serverState)); // 3a. reconcile with truth
  } catch (err) {
    setItems(prev);                            // 3b. ROLL BACK
    showError(err);
  }
}
```

## The hard parts (where seniors earn their keep)

### 1. Concurrent optimistic updates
If two updates are in flight and you naively `setItems(prev)` on failure, you can **clobber** the
other in-flight change (prev is stale). Prefer **functional, targeted updates** that revert only
the affected entity, or track a per-item pending/previous value, or apply a **reducer of pending
mutations** over the confirmed base state.

### 2. Reconcile, don't just "keep"
The server may return a *different* value than you guessed (normalized fields, server timestamps,
computed totals, a different id for a created item). On success, **replace the optimistic value
with the server's** rather than assuming your guess was exactly right. Temp client ids must be
swapped for server ids.

### 3. Races between optimistic state and refetches
A background refetch can land mid-flight and overwrite your optimistic value (or vice-versa). Tie
optimistic state to the mutation lifecycle (see React Query's `onMutate`/`onError`/`onSettled`),
and make sure a stale refetch can't win (Level 4 — race conditions).

### 4. Error UX
Decide what a rollback looks like: silent revert, toast, inline retry, or "queued, will retry".
A value snapping back with no explanation is confusing — pair rollback with feedback.

## Framework support

- **React 19 `useOptimistic`**: a hook for exactly this — show an optimistic value derived from
  the current state + a pending action, automatically reverting to the real state when the async
  action settles.
- **React Query / SWR / RTK Query**: `onMutate` snapshots & sets optimistic cache, `onError` rolls
  back, `onSettled` invalidates/refetches to reconcile — the battle-tested approach.

```tsx
const [optimistic, addOptimistic] = useOptimistic(items, (state, next) => applyToggle(state, next));
// render `optimistic`; React reverts to `items` when the action resolves/fails
```

## Senior checklist

- Apply the expected result now; snapshot previous state; roll back + signal error on failure.
- Reconcile with the server's returned value (ids, computed fields), don't blindly keep your guess.
- Handle concurrent updates with targeted/functional reverts; guard against stale refetches.
- Use `useOptimistic` (R19) or React Query's onMutate/onError/onSettled; reserve for low-stakes actions.

## References

- [React: useOptimistic](https://react.dev/reference/react/useOptimistic)
- [TanStack Query: Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [SWR: Optimistic UI / mutate](https://swr.vercel.app/docs/mutation#optimistic-updates)
- [web.dev: Optimistic UI patterns](https://web.dev/articles/building-an-instant-loading-web-app)
