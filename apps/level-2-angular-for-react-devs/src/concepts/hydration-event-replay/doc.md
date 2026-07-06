# Hydration, event replay, and incremental hydration

React's Level 2 concepts cover `hydrateRoot`, Suspense-driven selective hydration, and event
replay. Angular has its own hydration story.

## Basic hydration

Server rendering produces HTML. Client hydration reuses that DOM and attaches Angular behavior
instead of throwing it away and recreating it.

```ts
bootstrapApplication(AppComponent, {
  providers: [provideClientHydration()],
});
```

Hydration requires deterministic initial output. Server and client markup must match.

## Event replay

If a user clicks before Angular listeners are attached, event replay can capture and replay the
event after hydration:

```ts
provideClientHydration(withEventReplay())
```

This maps closely to React's event replay intuition: the user should not lose an early
interaction just because hydration is still catching up.

## Incremental hydration

Angular can connect incremental hydration to deferrable views:

```ts
provideClientHydration(withIncrementalHydration())
```

That lets below-the-fold or deferred blocks hydrate later, often based on the same triggers used
by `@defer`.

## Mismatch causes

The same categories that hurt React hydration also hurt Angular:

- random IDs generated differently on server and client,
- time/date text rendered during initial pass,
- browser-only branches during server render,
- direct DOM mutation before hydration,
- data fetched twice with different first values.

## Senior interview phrasing

> Angular hydration is DOM reuse plus Angular listener/state attachment. I enable
> `provideClientHydration`, add event replay when early interactions matter, and use incremental
> hydration with `@defer` for deferred islands. Then I audit deterministic markup exactly like I
> would for React hydration.

## References

- [Angular: Hydration](https://angular.dev/guide/hydration)
- [Angular: Incremental hydration](https://angular.dev/guide/incremental-hydration)
- [Angular: Deferrable views](https://angular.dev/guide/templates/defer)
