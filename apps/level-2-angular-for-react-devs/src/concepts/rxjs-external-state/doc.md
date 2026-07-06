# RxJS and external state consistency

React's `useSyncExternalStore` gives external stores a contract:

- subscribe,
- read a snapshot,
- keep the snapshot consistent during render.

Angular apps often meet external state through RxJS Observables, services, stores, `async` pipe,
and signals interop.

## Preferred Angular adapters

Template-owned subscription:

```html
@if (user$ | async; as user) {
  <user-card [user]="user" />
}
```

Signal-owned subscription:

```ts
user = toSignal(this.userService.user$, { initialValue: null });
```

Manual subscription with lifecycle teardown:

```ts
this.userService.user$
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe((user) => this.user.set(user));
```

## Why not naked subscribe?

Manual subscriptions are easy to leak and easy to make inconsistent. A component can subscribe
multiple times to a cold Observable, trigger duplicate requests, or update several fields from
different emissions.

Prefer:

- `async` pipe for template rendering,
- `toSignal` when the rest of the component uses signals,
- `shareReplay` when multiple consumers need the same source,
- `switchMap` when stale async responses must be canceled,
- `takeUntilDestroyed` for unavoidable manual subscriptions.

## React analogy

| React | Angular |
|---|---|
| `useSyncExternalStore` | `async` pipe / `toSignal` / store adapter |
| `getSnapshot()` | current signal value / latest Observable emission |
| `subscribe()` cleanup | async pipe cleanup / `takeUntilDestroyed` |

## Senior interview phrasing

> When a React app would need `useSyncExternalStore`, an Angular app usually needs a framework-aware
> Observable or signal bridge. I avoid naked subscriptions, keep emissions shared when consistency
> matters, and let `async` pipe or `toSignal` own lifecycle whenever possible.

## References

- [Angular: RxJS interop](https://angular.dev/ecosystem/rxjs-interop)
- [Angular: AsyncPipe](https://angular.dev/api/common/AsyncPipe)
- [Angular: takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed)
