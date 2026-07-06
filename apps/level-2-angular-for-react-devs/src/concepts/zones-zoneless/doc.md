# Zone.js, zoneless, and dirty marking

React updates because something explicitly notifies React: `setState`, a reducer dispatch, a
router update, or an external store subscription.

Classic Angular can feel more automatic because Zone.js patches async APIs and tells Angular,
"some async work finished; run change detection."

## What Zone.js does

Zone.js monkey-patches APIs like timers, promises, DOM events, and XHR/fetch-related flows. After
async work completes, Angular can schedule an application tick.

Important nuance: Zone.js does **not** know what data changed. It only helps Angular know that
something async happened.

## Zoneless Angular

Modern Angular can run without Zone.js. In that model, updates come from explicit Angular
reactivity:

- signals changing,
- events handled in Angular,
- `async` pipe emissions,
- `ChangeDetectorRef.markForCheck()`,
- framework integrations that mark views dirty.

This is easier for React developers to reason about because it is closer to explicit scheduling.

## Third-party callback trap

If a chart, map, socket, or SDK callback updates data outside Angular, the UI might not update in
zoneless mode unless you bridge it:

```ts
callbackFromSdk((value) => {
  this.latestValue.set(value);
});
```

or:

```ts
callbackFromSdk((value) => {
  this.latestValue = value;
  this.cdr.markForCheck();
});
```

## Senior interview phrasing

> Zone.js is async-discovery, not data dependency tracking. In zoneless Angular I make reactivity
> explicit with signals, async pipe, `toSignal`, and dirty marking. That is the Angular equivalent
> of making sure React is subscribed to an external store.

## References

- [Angular: Zoneless](https://angular.dev/guide/zoneless)
- [Angular: ChangeDetectorRef](https://angular.dev/api/core/ChangeDetectorRef)
- [Angular: Signals](https://angular.dev/guide/signals)
