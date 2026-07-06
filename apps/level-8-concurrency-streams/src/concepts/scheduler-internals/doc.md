# Scheduler internals

## Why a userland scheduler exists

The browser event loop is a single FIFO-ish queue with coarse macrotask/microtask ordering and no
notion of *priority* or *interruptibility*. React's concurrent renderer needs both: it wants to do a
big render in small slices, **yield** to the browser so it can paint and handle input, and run
**urgent** updates ahead of background ones. So React ships its own cooperative scheduler (the
`scheduler` package), and the platform is standardizing the same ideas as
`scheduler.postTask()` / `scheduler.yield()`.

## The core pieces

### Priority via *expiration time* (a min-heap)

Tasks aren't stored by a static priority number — they're stored by an **expiration time** in a
**min-heap** (priority queue), and the scheduler always runs the task that expires soonest:

```
expiration = now + timeoutForPriority(priority)
```

React's timeouts (roughly):

| Priority | Timeout |
|---|---|
| Immediate | -1 (already expired, run now) |
| UserBlocking | 250 ms |
| Normal | 5 000 ms |
| Low | 10 000 ms |
| Idle | never (Infinity) |

A nearer expiration = higher effective priority. Crucially this gives **aging for free**: a Normal
task queued long ago can have an earlier expiration than a UserBlocking task queued just now, so it
runs first — preventing starvation of low-priority work (the priority-inversion mitigation from the
previous concept, built into the data structure).

### Yielding without `setTimeout(0)`

`setTimeout(cb, 0)` is clamped to ~4 ms (and more for nested timers), so it's too slow for
slicing. The scheduler instead posts a message on a **`MessageChannel`** — `port.postMessage()`
schedules a macrotask that runs *as soon as the current one finishes*, with no clamp. That callback
is the scheduler's "work loop" entry point. (Older React used `requestAnimationFrame` + a
`MessageChannel`; current React uses a `MessageChannel`-driven loop, falling back to `setTimeout`.)

### Time slicing & `shouldYield()`

Inside the work loop, the scheduler runs tasks until the **frame budget** (~5 ms) is exceeded, then
stops and re-posts itself for the next macrotask:

```js
function workLoop(deadline) {
  while (taskQueue.length && !shouldYield()) {
    const task = peek(taskQueue);
    const more = task.callback();      // do a unit of work
    if (!more) pop(taskQueue);
  }
  if (taskQueue.length) schedulePerform(); // continue next macrotask
}

function shouldYield() {
  // elapsed past the 5ms slice? or is input waiting?
  return getCurrentTime() >= deadline || navigator.scheduling?.isInputPending?.();
}
```

`isInputPending()` lets the loop bail early when the user is trying to interact, even before the 5 ms
budget is spent — keeping input latency low.

## Putting it together

1. `postTask(work, priority)` → compute expiration → push onto the min-heap → ensure the
   `MessageChannel` callback is scheduled.
2. The callback drains the heap by expiration order, one slice at a time, checking `shouldYield()`.
3. When it yields, it re-posts itself; the browser gets a turn (paint, input, timers), then the loop
   resumes — interruptible, prioritized, starvation-free.

## Senior checklist

- Priority is encoded as **expiration time** in a **min-heap**; soonest-expiring runs first, which
  also ages older low-priority work so it isn't starved.
- Yielding uses a **`MessageChannel`** macrotask (no `setTimeout` 4 ms clamp), not microtasks (which
  wouldn't let the browser paint).
- A ~5 ms time slice + `shouldYield()`/`isInputPending()` makes long work interruptible and keeps
  input responsive.
- This is the machinery under React concurrent features and `scheduler.postTask`/`scheduler.yield`.

## Angular equivalent

Angular scheduling is mostly the browser event loop plus framework dirty marking. Zone.js can trigger a broad tick after async work; zoneless Angular relies more on signals, async pipe, and explicit marks. Do not assume a React-like cooperative Fiber scheduler.

## References

- [React scheduler source (`Scheduler.js`)](https://github.com/facebook/react/blob/main/packages/scheduler/src/forks/Scheduler.js)
- [MDN: Scheduler.postTask()](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask)
- [MDN: isInputPending()](https://developer.mozilla.org/en-US/docs/Web/API/Scheduling/isInputPending)
- [The MessageChannel yield trick (web.dev)](https://web.dev/articles/optimize-long-tasks)
