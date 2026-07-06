# Stale captures and lifecycle cleanup

Angular does not have React hook dependency arrays, but stale captures still happen. They just
show up in different places.

## React version

React stale closure:

```tsx
useEffect(() => {
  socket.on('message', () => {
    sendToRoom(roomId); // maybe old roomId
  });
}, []);
```

The callback captured the `roomId` from the render that created it.

## Angular version

Angular can make the same mistake:

```ts
ngOnInit() {
  const roomId = this.roomId();

  this.socket.messages$.subscribe((message) => {
    this.sendToRoom(roomId, message); // maybe old roomId
  });
}
```

If `roomId` is an input signal that can change, the subscription captured the initial value.

## Safer pattern

Read the current signal value at use time and clean up the subscription:

```ts
private destroyRef = inject(DestroyRef);
roomId = input.required<string>();

ngOnInit() {
  this.socket.messages$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((message) => {
      this.sendToRoom(this.roomId(), message);
    });
}
```

If the relationship is pure state derivation, use `computed`. If it is an external side effect,
use `effect` cleanup or RxJS teardown.

## Lifecycle cleanup

React effect cleanup maps to several Angular patterns:

- `DestroyRef.onDestroy(...)`,
- `takeUntilDestroyed(...)`,
- `effect((onCleanup) => { ... })`,
- `async` pipe lifecycle ownership.

## Senior interview phrasing

> Angular removes the hook dependency-array problem, but it does not remove JavaScript closure
> semantics. I still look for callbacks that captured old inputs, manual subscriptions without
> teardown, and effects that should be computed signals instead.

## References

- [Angular: Component lifecycle](https://angular.dev/guide/components/lifecycle)
- [Angular: DestroyRef](https://angular.dev/api/core/DestroyRef)
- [Angular: takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed)
- [Angular: Signals - effects](https://angular.dev/guide/signals#effects)
