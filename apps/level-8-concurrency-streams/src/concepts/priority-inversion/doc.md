# Priority inversion in async code

## The phenomenon

**Priority inversion** is when a *high*-priority task is blocked waiting on a resource held by a
*low*-priority task — and the low task can't make progress because *medium*-priority work keeps
preempting it. The net effect: medium-priority work runs **ahead of** the high-priority task, even
though it's strictly lower priority. The famous case is NASA's **Mars Pathfinder** (1997), which
kept resetting because a high-priority bus-management task starved waiting on a mutex held by a
low-priority task that medium tasks kept preempting.

```
H (high)  ── wants the lock ──▶ ⛔ blocked (L holds it)
L (low)   ── holds the lock, but keeps getting preempted by ──▶ M
M (medium)── runs and runs ... ── so L can't finish & release ── so H waits
```

H is effectively running at M's mercy: **its priority has been inverted.**

## How it shows up in front-end / async code

It isn't only an RTOS problem — anywhere you have **priorities + a shared, exclusively-held
resource**, you can invert:

- **An async mutex / semaphore.** A low-priority job `await`s and holds a lock (or a
  concurrency-limited queue slot); an urgent job needs the same lock and waits behind it while
  unrelated medium work hogs the event loop.
- **A shared in-flight promise.** Many callers `await` one memoized request. If a low-priority
  caller "owns" computing it and gets deprioritized, every high-priority awaiter is stuck.
- **Connection / request pools.** An urgent `fetch` queued behind low-priority fetches that occupy
  all the pool slots — the urgent one inverts behind them.
- **React lanes.** An urgent update that depends on state being produced by a low-priority
  transition can be delayed; React mitigates with **expiration** (aging) so stalled work is forced
  to flush.

## Fixes

- **Priority inheritance (the classic fix):** while a high-priority task is blocked on a resource,
  temporarily **boost the holder** to the waiter's priority so it finishes and releases quickly,
  ahead of medium work. This is exactly what RTOS mutexes do.
- **Priority ceiling:** give the lock itself a priority equal to the highest task that can ever take
  it; whoever holds it runs at that ceiling.
- **Avoid the shared lock:** prefer lock-free designs, per-priority queues, or short non-yielding
  critical sections so the resource is never held across a yield point.
- **Cancel / reprioritize:** `AbortController` + `fetchpriority`, or `scheduler.postTask` priorities,
  to make sure urgent work isn't queued behind background work.

## The async-specific gotcha

In single-threaded JS there's no preemption *inside* synchronous code — but the moment a low-priority
task `await`s (a yield point), the scheduler can run other work, and a higher-priority awaiter that
needs the same not-yet-released resource is now blocked behind whatever the loop chooses to run.
**Holding a logical lock across an `await` is where inversion sneaks in.**

## Senior checklist

- Inversion = high task blocked on a resource held by a low task that medium work keeps preempting →
  medium effectively outranks high.
- It needs three ingredients: priorities, a shared exclusively-held resource, and the holder being
  preemptable while holding it.
- Fix with priority inheritance / ceiling, by not holding locks across `await`, or with per-priority
  queues and cancellation.
- React's lane **expiration** is aging-as-inversion-mitigation; recognize the same pattern in your
  own queues.

## References

- [Wikipedia: Priority inversion](https://en.wikipedia.org/wiki/Priority_inversion)
- [What really happened on Mars (Pathfinder)](https://www.cs.cornell.edu/courses/cs614/1999sp/papers/pathfinder.html)
- [MDN: Scheduler.postTask() priorities](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask)
- [React: lanes & expiration (rationale)](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberLane.js)
