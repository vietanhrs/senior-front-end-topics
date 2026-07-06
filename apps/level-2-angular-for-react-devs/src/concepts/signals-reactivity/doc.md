# Signals and fine-grained reactivity

React developers often map:

- `useState` -> `signal`
- `useMemo` -> `computed`
- `useEffect` -> `effect`

This is a useful first bridge, but it is not a perfect translation.

## Writable signals

```ts
count = signal(0);

increment() {
  this.count.update((n) => n + 1);
}
```

Reading a signal is a function call:

```ts
const value = this.count();
```

When a template, `computed`, or `effect` reads a signal, Angular can track that dependency.

## Computed signals

```ts
total = computed(() => this.quantity() * this.unitPrice());
```

`computed` is for pure derived state. It is cached and recalculates when dependencies change.
This is closer to `useMemo` than to `useEffect`.

## Effects

```ts
private logTotal = effect(() => {
  analytics.log(this.total());
});
```

Use effects for side effects, not for pure derivation. Effects run in an Angular injection
context and support cleanup patterns.

## How signals change Angular

Signals make Angular more explicit about what changed. In OnPush and zoneless designs, signals are
the preferred way to mark the right consumers dirty without relying on a broad Zone.js tick.

## Where React intuition misleads

- Do not destructure a signal value once and expect it to stay reactive.
- Do not move pure derived state into `effect` because you are used to `useEffect`.
- Do not expect dependency arrays; dependencies are the signal reads that happen while the
  reactive function executes.
- Do not mutate nested objects inside a signal and expect consumers to notice unless you set/update
  the signal appropriately.

## Senior interview phrasing

> Angular signals are a dependency-tracked state primitive. I use `signal` for writable state,
> `computed` for pure derivation, and `effect` for side effects. The React hooks analogy helps,
> but Angular tracks dependencies from signal reads rather than dependency arrays.

## References

- [Angular: Signals](https://angular.dev/guide/signals)
- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- [Angular: RxJS interop with signals](https://angular.dev/ecosystem/rxjs-interop)
