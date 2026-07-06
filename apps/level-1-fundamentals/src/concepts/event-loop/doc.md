# Event loop: macrotasks vs microtasks

## Mental model

JavaScript runs **single-threaded**: one call stack, one thread. To handle async work
without blocking, the runtime uses the **event loop** to coordinate between the **call
stack** and two kinds of queues:

```
        ┌─────────────┐
        │  Call Stack │  ← runs synchronous code until empty
        └─────────────┘
              │ (stack empty)
              ▼
   ┌────────────────────────┐
   │  Microtask queue        │  ← DRAINED COMPLETELY before moving on
   │  (Promise.then,         │
   │   queueMicrotask,        │
   │   MutationObserver)      │
   └────────────────────────┘
              │
              ▼
   ┌────────────────────────┐   (usually) render / paint
   │  Macrotask queue        │  ← takes EXACTLY one task per loop
   │  (setTimeout, events,    │
   │   message, I/O)          │
   └────────────────────────┘
```

## The golden rules

1. Run all synchronous code (call stack returns to empty).
2. **Drain the entire microtask queue** — including microtasks added *while* draining.
3. (The browser may) render.
4. Take **one** macrotask, run it → go back to step 2.

The most important consequence: **microtasks always run before the next macrotask**, and a
microtask can "cut in line" with more microtasks, delaying rendering.

## The classic example

```js
console.log('1: script start');           // sync

setTimeout(() => console.log('2: setTimeout'), 0); // macrotask

Promise.resolve().then(() => console.log('3: promise')); // microtask

queueMicrotask(() => console.log('4: queueMicrotask'));   // microtask

console.log('5: script end');             // sync

// Print order: 1 → 5 → 3 → 4 → 2
// sync first (1,5), drain microtasks (3,4), then the macrotask (2)
```

## Why this is "must-not-be-fuzzy" knowledge

- **`await` = microtask**: the code after `await` is scheduled as a microtask. Many ordering
  bugs come from thinking `await` is synchronous.
- **Microtask starvation**: if a microtask keeps `queueMicrotask`-ing more work, the event
  loop **never** reaches a macrotask/render → the UI freezes with no obvious infinite loop.
- **`setTimeout(fn, 0)` is not "immediately"**: it's a macrotask, running after all current
  microtasks, and is clamped to a minimum (~4ms when deeply nested).
- **Rendering happens between macrotasks**: to let the browser paint before more heavy work,
  yield with a macrotask (`setTimeout`/`MessageChannel`/`scheduler.postTask`), not a microtask.

## Where does `requestAnimationFrame` fit?

`requestAnimationFrame` (`rAF`) is the browser's "prepare the next frame" hook. It is not a
regular microtask or macrotask. A useful frame-level model is:

```
one task runs
  -> microtask checkpoint drains completely
  -> rAF callbacks for the upcoming frame
  -> style recalculation
  -> layout
  -> paint
  -> composite
  -> next task
```

The exact browser pipeline has more scheduling nuance, but this model is the one you need in
interviews:

- **Microtasks run before `rAF`.** If a Promise chain or `queueMicrotask` loop keeps refilling the
  microtask queue, the next `rAF` callback and the next paint are delayed.
- **`rAF` runs before paint.** It is the right place to read the previous layout, compute animation
  state, and write visual updates for the upcoming frame.
- **`rAF` is frame-paced.** On a 60 Hz display you usually get about one callback every 16.7 ms
  while the tab is visible. On high-refresh screens it can run more often; in background tabs it is
  throttled or paused.
- **A heavy `rAF` still blocks paint.** If the callback does 30 ms of JS, the frame misses its
  deadline. `rAF` gives you timing, not a separate thread.

Common pattern:

```js
let latestPointer;

window.addEventListener('pointermove', (event) => {
  latestPointer = { x: event.clientX, y: event.clientY };
});

function frame() {
  // Runs before paint. Keep it short.
  cursor.style.transform = `translate(${latestPointer.x}px, ${latestPointer.y}px)`;
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
```

Use `rAF` for visual work that should align with frames. Use a macrotask / `scheduler.yield()` /
Worker to split heavy non-visual work so the browser still gets chances to run `rAF` and paint.

## Microtask vs macrotask — quick reference

| Source | Kind |
|---|---|
| `Promise.then/catch/finally`, `await` | microtask |
| `queueMicrotask` | microtask |
| `MutationObserver` | microtask |
| `setTimeout`, `setInterval` | macrotask |
| `MessageChannel`, `postMessage` | macrotask |
| DOM events, `setImmediate` (Node) | macrotask |
| `requestAnimationFrame` | before style/layout/paint for the next frame (separate) |

## Practical patterns

- **Yield the thread so you don't block the UI**: split heavy work into multiple macrotasks
  (`setTimeout`/`MessageChannel`), or move it to a Web Worker (see "Web/Service Workers").
- **Batch work after the current sync run**: use a microtask when you want to run "after the
  current synchronous code but before yielding to the browser" (e.g. how React batches updates).
- **Avoid starvation**: don't recurse via microtasks for long-running work; use a macrotask
  to allow rendering.
- **Use `requestAnimationFrame` for frame-aligned DOM writes**: measure/mutate visual state before
  the next paint, and keep the callback inside the frame budget.

## Senior checklist

- State the correct order: sync → microtasks (fully drained) → render → one macrotask.
- Know `await` schedules a microtask, and the ordering consequences.
- Know starvation and how to yield via a macrotask.
- Distinguish `rAF` from micro/macro: it runs before the next paint, is frame-paced, and can still
  jank if the callback is heavy.

## Angular equivalent

Angular's classic Zone.js mode hooks into the event loop by patching async APIs and triggering change detection after async tasks. In zoneless Angular, the equivalent update signal comes from explicit reactivity: signals, async pipe emissions, toSignal, events, or manual dirty marking. The browser event-loop rules are identical; only the framework's scheduling trigger differs.

## References

- [Jake Archibald: Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
- [MDN: The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop)
- [HTML spec: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [MDN: queueMicrotask](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask)
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
