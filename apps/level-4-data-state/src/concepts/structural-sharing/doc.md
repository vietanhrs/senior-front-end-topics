# Structural sharing

## The idea

**Structural sharing** is how you update immutable data efficiently: instead of deep-copying the
whole structure, you create **new objects only along the path to the change** and **reuse
(share) every untouched subtree by reference**. The old and new versions coexist; they share most
of their memory.

```
Update state.user.profile.name:

  root ───────────────┐                 root' (new)
   ├─ user ───────────┤                  ├─ user'  (new)
   │   ├─ profile ─────┤      ──▶         │   ├─ profile' (new) ── name changed
   │   └─ settings ────┤                  │   └─ settings  (SHARED, same ref)
   └─ posts ───────────┘                  └─ posts          (SHARED, same ref)

Only root, user, profile are re-created. settings and posts are the SAME objects.
```

## Why it matters

Two big payoffs, both central to modern front-end state:

1. **Cheap change detection via reference equality.** Because untouched subtrees keep their
   reference, `prev.posts === next.posts` is `true` — an O(1) check tells you "posts didn't
   change." This is what powers `React.memo`, `useMemo` deps, selector memoization (Reselect),
   and `PureComponent`. Deep-cloning would break all of it (every reference changes).

2. **Performance + memory.** You don't copy gigabytes to change one field; you copy a handful of
   nodes along one path. Old snapshots stay valid (great for undo/redo, time-travel, concurrent
   rendering reading a consistent snapshot).

## Doing it by hand (spread copies the path)

```ts
// Re-create only the path root → user → profile; share the rest.
const next = {
  ...state,                       // new root
  user: {
    ...state.user,                // new user
    profile: {
      ...state.user.profile,      // new profile
      name: 'Ada',                // the actual change
    },
    // state.user.settings is NOT spread → shared by reference
  },
  // state.posts is NOT spread → shared by reference
};

next.posts === state.posts;        // true  (shared)
next.user.settings === state.user.settings; // true (shared)
next.user.profile === state.user.profile;   // false (on the change path)
```

The rule: **spread/clone every ancestor of the changed node, and nothing else.**

## Libraries that automate it

- **Immer** — you write "mutating" code against a `draft`; Immer produces a new immutable state
  with structural sharing under the hood (untouched branches are reused).
- **Immutable.js / `immutable`** — persistent data structures (HAMTs / tries) with structural
  sharing built in; `Map`/`List` updates are O(log n) and share nodes.
- **Redux Toolkit** uses Immer; **Zustand/Jotai** rely on you returning new references for changed
  slices.

```ts
import { produce } from 'immer';
const next = produce(state, (draft) => {
  draft.user.profile.name = 'Ada'; // looks like mutation; output is shared-structure immutable
});
```

## Pitfalls

- **Accidental sharing then mutation.** If you share a subtree and later *mutate* it in place, you
  corrupt the old snapshot too (they're the same object). Structural sharing requires you never
  mutate shared nodes — only replace along the path.
- **Over-cloning** (deep clone "to be safe") destroys sharing → breaks memoization and wastes
  memory/CPU. It's the opposite of what you want.
- **Shallow vs deep change detection mismatch**: comparing with `===` only works if updates
  preserve sharing; a single rogue deep-clone or mutation makes comparisons lie.

## Senior checklist

- Structural sharing = new nodes on the change path, reuse everything else by reference.
- It's what makes `===`/shallow comparison a valid, O(1) change check (memo, selectors).
- Spread only the ancestors of the change; never mutate shared subtrees; use Immer for deep updates.
- Don't deep-clone "for safety" — it defeats sharing and memoization.

## Angular equivalent

Angular OnPush, signals, and selector-style stores benefit from the same structural sharing rule: replace only the changed path, preserve the rest. It lets reference checks and computed dependencies stay meaningful without deep cloning the whole graph.

## References

- [Immer: How Immer works (structural sharing)](https://immerjs.github.io/immer/)
- [Redux: Immutable update patterns](https://redux.js.org/usage/structuring-reducers/immutable-update-patterns)
- [Immutable.js](https://immutable-js.com/)
- [Persistent data structures (overview)](https://en.wikipedia.org/wiki/Persistent_data_structure)
