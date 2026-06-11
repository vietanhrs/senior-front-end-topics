# Pointer events model

## One input model to rule them all

Before Pointer Events you wrote **two** code paths — `mousedown/move/up` *and* `touchstart/move/end`
— plus pen as a special case, plus glue for the synthetic mouse events touch fires. **Pointer
Events** unify mouse, touch, and pen into a single event model. `PointerEvent` **extends**
`MouseEvent`, so it carries everything mouse events do, plus device-agnostic richness.

```js
el.addEventListener('pointerdown', onDown);
el.addEventListener('pointermove', onMove);
el.addEventListener('pointerup', onUp);
// pointerType tells you which device: 'mouse' | 'touch' | 'pen'
```

Events: `pointerover/enter/down/move/up/cancel/out/leave` and
`gotpointercapture/lostpointercapture`.

## What each pointer carries

- **`pointerId`** — a unique id per active pointer. **Multi-touch** = multiple concurrent `pointerId`s
  (track them in a `Map`).
- **`pointerType`** — `mouse` / `touch` / `pen`; branch behavior on it.
- **`isPrimary`** — the first/primary pointer of its type (the one to treat as "the" pointer for
  single-pointer logic).
- **`pressure`** (0–1), **`tangentialPressure`**, **`tiltX/tiltY`**, **`twist`** — pen/stylus richness.
- **`width`/`height`** — the contact geometry (finger size).
- `button`/`buttons` — inherited from MouseEvent.

## Pointer capture (the killer feature)

`element.setPointerCapture(pointerId)` routes **all** subsequent events for that pointer to your
element **even if the pointer leaves it** — until `pointerup`/`lostpointercapture`. This replaces the
fragile old "attach a `mousemove`/`mouseup` listener to `document` during a drag" pattern:

```js
function onDown(e) {
  e.currentTarget.setPointerCapture(e.pointerId); // capture this pointer
}
function onMove(e) {
  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
  drag(e); // keeps working even outside the element
}
// release happens automatically on pointerup, or call releasePointerCapture
```

## High-frequency input: coalesced & predicted events

Pointer move events are throttled to ~one per frame, but the hardware samples faster. For smooth
drawing you need the in-between samples:

- **`getCoalescedEvents()`** — the raw high-frequency samples merged into this one `pointermove` (draw
  a line through all of them, not just the latest point).
- **`getPredictedEvents()`** — the browser's predicted next points, to reduce perceived latency.

## `touch-action` and `pointercancel`

- **`touch-action`** (CSS) declares which default gestures the browser keeps. `touch-action: none`
  means *you* handle all gestures (required for custom drawing/dragging on touch, or the browser
  scrolls/zooms instead). `pan-y`, `pinch-zoom`, etc. give finer control.
- **`pointercancel`** fires when the browser **takes over** the pointer (e.g. it decides the gesture
  is a scroll) — always handle it as an abort, symmetric with `pointerup`.

## Senior checklist

- Pointer Events unify mouse/touch/pen (`PointerEvent extends MouseEvent`); branch on `pointerType`,
  track concurrent `pointerId`s for multi-touch, use `isPrimary` for single-pointer logic.
- Use **`setPointerCapture`** for drags instead of document-level mouse listeners — it keeps tracking
  outside the element and auto-releases on `pointerup`.
- For drawing, render through **`getCoalescedEvents()`** (smooth) and consider `getPredictedEvents()`
  (latency); handle **`pointercancel`** as an abort.
- Set **`touch-action: none`** (or a specific value) on custom-gesture surfaces or the browser will
  scroll/zoom instead of giving you the events.

## References

- [MDN: Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [MDN: Element.setPointerCapture()](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)
- [MDN: PointerEvent.getCoalescedEvents()](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/getCoalescedEvents)
- [MDN: touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)
