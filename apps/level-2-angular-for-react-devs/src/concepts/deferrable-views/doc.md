# Deferrable views and loading boundaries

React developers know:

```tsx
const Chart = lazy(() => import('./Chart'));

<Suspense fallback={<Skeleton />}>
  <Chart />
</Suspense>
```

Angular's closest built-in concept is `@defer`.

## Angular shape

```html
@defer (on viewport; prefetch on idle) {
  <expensive-chart [data]="data()" />
} @placeholder {
  <chart-skeleton />
} @loading (minimum 300ms) {
  <spinner />
} @error {
  <retry-panel />
}
```

`@defer` can split code and load a block when a trigger fires.

## Triggers

Useful triggers include:

- `on idle`
- `on viewport`
- `on interaction`
- `on hover`
- `on timer`
- `when condition`

Prefetch triggers can be separate from display triggers, which lets you warm a chunk before the
user needs it.

## Suspense vs @defer

| React Suspense | Angular @defer |
|---|---|
| Boundary catches thrown promises / lazy components | Template block with trigger-based loading |
| `fallback` prop | `@placeholder`, `@loading`, `@error` blocks |
| Often framework-integrated for data/SSR | Primarily template/code-loading and hydration boundary |

## Senior interview phrasing

> I map React.lazy/Suspense to Angular `@defer` only for the loading-boundary intuition. Angular
> gives explicit template triggers and separate placeholder/loading/error blocks, so I choose those
> triggers based on LCP, interaction timing, and layout stability.

## References

- [Angular: Deferrable views](https://angular.dev/guide/templates/defer)
- [Angular: Control flow](https://angular.dev/guide/templates/control-flow)
