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

`rAF` callbacks run **right before paint**, after that frame's microtasks. Use it for
paint/animation-related work. It's neither the regular micro nor macro queue.

## Microtask vs macrotask — quick reference

| Source | Kind |
|---|---|
| `Promise.then/catch/finally`, `await` | microtask |
| `queueMicrotask` | microtask |
| `MutationObserver` | microtask |
| `setTimeout`, `setInterval` | macrotask |
| `MessageChannel`, `postMessage` | macrotask |
| DOM events, `setImmediate` (Node) | macrotask |
| `requestAnimationFrame` | before paint (separate) |

## Practical patterns

- **Yield the thread so you don't block the UI**: split heavy work into multiple macrotasks
  (`setTimeout`/`MessageChannel`), or move it to a Web Worker (see "Web/Service Workers").
- **Batch work after the current sync run**: use a microtask when you want to run "after the
  current synchronous code but before yielding to the browser" (e.g. how React batches updates).
- **Avoid starvation**: don't recurse via microtasks for long-running work; use a macrotask
  to allow rendering.

## Senior checklist

- State the correct order: sync → microtasks (fully drained) → render → one macrotask.
- Know `await` schedules a microtask, and the ordering consequences.
- Know starvation and how to yield via a macrotask.
- Distinguish `rAF` from micro/macro.

## References

- [Jake Archibald: Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
- [MDN: The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop)
- [HTML spec: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [MDN: queueMicrotask](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask)
