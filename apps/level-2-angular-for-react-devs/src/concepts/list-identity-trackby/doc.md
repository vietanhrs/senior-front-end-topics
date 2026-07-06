# View identity, `@for track`, and differ

If you know React keys, you already understand the problem: a list item needs stable identity so
the framework can preserve the right DOM and component state when items move.

Angular's modern syntax makes the identity rule explicit:

```html
@for (user of users(); track user.id) {
  <user-row [user]="user" />
}
```

Older templates use `*ngFor` with `trackBy`.

## React key vs Angular track

| React | Angular |
|---|---|
| `<Row key={user.id} />` | `@for (user of users(); track user.id)` |
| Reconciler matches sibling fibers | Iterable differ matches embedded views |
| Bad index key remounts/mixes state | Bad index tracking destroys/reuses wrong views |
| Key is special and not a normal prop | Track expression is part of control-flow syntax |

## What Angular preserves

Angular preserves an **embedded view** for each tracked item. That view can contain DOM nodes,
directives, component instances, local state, and binding slots.

When the array changes, Angular's differ computes operations such as insert, move, remove, and
identity change. Stable tracking lets it move an existing view instead of tearing it down.

## Common bug

This is risky for mutable lists:

```html
@for (row of rows(); track $index) {
  <trade-row [row]="row" />
}
```

Filtering, sorting, prepending, or deleting shifts indexes. Any state inside `trade-row` can
appear to jump rows. It is the same class of bug as React index keys.

## Senior interview phrasing

> Angular list identity is the `@for track` / `trackBy` problem. I treat it like React keys:
> stable domain identity for mutable lists, index only for truly static lists, and deliberate
> remounting when state reset is desired.

## References

- [Angular: Control flow - @for](https://angular.dev/guide/templates/control-flow)
- [Angular: Performance - trackBy / @for track](https://angular.dev/guide/templates/control-flow#why-is-track-in-for-blocks-important)
