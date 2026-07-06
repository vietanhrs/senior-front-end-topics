# Scheduling work without Fiber lanes

React has lanes, transitions, deferred values, and interruptible rendering. Angular does not expose
an equivalent of React Fiber lanes for app code.

That absence is important. A strong Angular answer does not invent `startTransition` in Angular.
It designs the work pipeline differently.

## Common Angular tools

| Problem | Angular-friendly tool |
|---|---|
| Too many keystroke-triggered requests | `debounceTime`, `distinctUntilChanged`, `switchMap` |
| Stale response wins | `switchMap`, `AbortController`, request tokens |
| Huge DOM list | CDK virtual scroll / pagination |
| Expensive CPU transform | Web Worker, pre-indexing, chunked work |
| Below-fold heavy UI | `@defer` |
| Expensive change checks | OnPush, signals, smaller component boundaries |

## Search example

```ts
results$ = this.search.valueChanges.pipe(
  debounceTime(150),
  distinctUntilChanged(),
  switchMap((term) => this.api.search(term)),
  shareReplay({ bufferSize: 1, refCount: true }),
);
```

The input stays responsive because you reduce source frequency, cancel stale async work, and avoid
rendering too much DOM.

## React analogy

React transition:

```ts
startTransition(() => setQuery(value));
```

Angular equivalent thinking:

- make the urgent input cheap,
- debounce or throttle the expensive source,
- cancel old async work,
- virtualize or defer heavy UI,
- move CPU-heavy work off the main thread.

## Senior interview phrasing

> Angular does not give me React lanes. I use RxJS to control event/request scheduling, OnPush and
> signals to scope view updates, `@defer` for lazy UI, and workers/virtualization for real CPU or
> DOM pressure.

## References

- [Angular: RxJS interop](https://angular.dev/ecosystem/rxjs-interop)
- [Angular: Deferrable views](https://angular.dev/guide/templates/defer)
- [Angular CDK: Virtual scrolling](https://material.angular.io/cdk/scrolling/overview)
