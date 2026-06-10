# Immutable data patterns

## Why immutability is non-negotiable in React

React decides whether to re-render by **comparing references** (`Object.is`) between the previous
and next state/props. If you **mutate** an object/array in place and set it back, the reference is
unchanged → React thinks nothing changed → **the UI doesn't update** (or updates inconsistently).
Immutability — never modifying existing data, always producing a new value — is what makes React's
(and Redux's, and memo selectors') change detection correct and fast.

> Mutation bugs are insidious: the data *did* change, so logs look right, but the screen is stale.

## The core rule

**Never mutate state; replace it.** Produce a *new* container with the change applied, leaving the
original untouched (structural sharing keeps this cheap — previous concept).

### Arrays — mutating vs immutable

| Goal | ❌ Mutates | ✔ Immutable |
|---|---|---|
| add | `arr.push(x)` | `[...arr, x]` |
| prepend | `arr.unshift(x)` | `[x, ...arr]` |
| remove | `arr.splice(i, 1)` | `arr.filter((_, idx) => idx !== i)` |
| update item | `arr[i].done = true` | `arr.map((it, idx) => idx === i ? { ...it, done: true } : it)` |
| sort/reverse | `arr.sort()` | `[...arr].sort()` (sort/reverse mutate in place!) |

> `sort`, `reverse`, `splice`, `push`, `pop`, `shift`, `unshift`, `fill`, `copyWithin` **mutate**.
> ES2023 added non-mutating `toSorted`, `toReversed`, `toSpliced`, `with` — prefer them.

### Objects

```ts
// ❌ mutation
state.user.name = 'Ada';
// ✔ new object on the change path
{ ...state, user: { ...state.user, name: 'Ada' } }
```

## Enforcing & easing immutability

- **Immer** (`produce`) lets you write mutation-style code on a `draft` and outputs immutable,
  structurally-shared state — the ergonomic default for deep updates (Redux Toolkit uses it).
- **`Object.freeze`** (deep-freeze in dev) turns accidental mutations into thrown errors — a great
  guardrail in development.
- **`readonly` / `ReadonlyArray<T>` / `as const`** in TypeScript make mutation a *compile-time*
  error.
- **ESLint** rules (e.g. `no-param-reassign`, `functional/immutable-data`) catch mutations.

```ts
type State = {
  readonly items: ReadonlyArray<{ readonly id: number; readonly done: boolean }>;
};
// state.items.push(x)  // ❌ TS error: push doesn't exist on ReadonlyArray
```

## Subtle traps

- **Shallow copy isn't deep**: `{ ...state }` shares nested objects. Mutating
  `copy.user.name = ...` still mutates the original's `user`. Copy the whole path.
- **Sorting props/state**: `items.sort()` mutates the prop/state array in place — a classic
  "why did my source data reorder?" bug. Use `[...items].sort()` / `toSorted()`.
- **Derived data**: don't store derived values you then mutate; compute them (memoized) from the
  immutable source.
- **Refs/Maps/Sets**: `Map`/`Set` are mutable; create a new one (`new Map(old)`) to signal change,
  or use a library with immutable collections.

## Senior checklist

- React/Redux/memoization rely on reference changes; mutation → stale UI / broken memo.
- Replace, don't mutate: spread the change path; beware in-place `sort/splice/push`.
- Use Immer for deep updates, deep-freeze in dev, `readonly`/`as const` in TS to enforce it.
- Shallow copies still share nested objects — copy the full path to the change.

## References

- [React: Updating objects in state](https://react.dev/learn/updating-objects-in-state)
- [React: Updating arrays in state](https://react.dev/learn/updating-arrays-in-state)
- [Immer](https://immerjs.github.io/immer/)
- [MDN: Array change-by-copy (toSorted/toSpliced/with)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#copying_methods_and_mutating_methods)
