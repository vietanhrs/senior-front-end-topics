# Change detection strategy

React asks components to render again and then reconciles the returned element tree. Angular runs
change detection over views and refreshes bindings.

That difference matters more than the syntax.

## Default vs OnPush

Angular components can use:

- `ChangeDetectionStrategy.Default`: the component is checked during normal tree traversal.
- `ChangeDetectionStrategy.OnPush`: the component is skipped unless Angular has a reason to mark
  it dirty.

Typical OnPush dirty triggers include:

- an input reference changes,
- an event happens in the component view,
- an `async` pipe receives a new value,
- a signal read by the template changes,
- code calls `markForCheck()` or similar APIs.

## OnPush is not exactly React.memo

The analogy helps: both can avoid unnecessary work and both reward immutable data.

But the mechanism differs:

| React | Angular |
|---|---|
| `React.memo` compares props and can skip rendering a component | `OnPush` controls when Angular checks a view |
| `setState` schedules work | dirty marking schedules/checks Angular views |
| render returns element objects | template bindings are refreshed |

## Template getter trap

This is easy to miss:

```ts
get expensiveTotal() {
  return heavyCalculation(this.items);
}
```

If used in a template, Angular may call it during checks. Prefer `computed()`, memoized data,
or precomputed state for expensive derived values.

## Senior interview phrasing

> I do not say Angular "re-renders components like React". I say Angular checks component views.
> With OnPush and signals, I design clear dirty-marking boundaries and immutable input changes,
> then avoid expensive template getters.

## References

- [Angular: Skipping component subtrees](https://angular.dev/best-practices/skipping-subtrees)
- [Angular: Component lifecycle](https://angular.dev/guide/components/lifecycle)
- [Angular: Signals](https://angular.dev/guide/signals)
